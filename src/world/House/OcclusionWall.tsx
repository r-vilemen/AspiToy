import React, { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sharedMaterials } from '../Environment/Materials';

export interface OcclusionWallProps {
  position: [number, number, number];
  meshPosition?: [number, number, number];
  args: [number, number, number];
  roomCenter: [number, number]; // [x, z] centro do cômodo que a parede delimita
  materialType?: 'plaster' | 'bathroomTile';
  minOpacity?: number; // Opacidade quando a câmera está na frente olhando para dentro (padrão: 0.14)
  maxOpacity?: number; // Opacidade quando a parede está ao fundo / opaca (padrão: 1.0)
  name?: string;
  receiveShadow?: boolean;
  children?: React.ReactNode;
}

/**
 * Parede com Transparência Dinâmica por Oclusão de Câmera:
 * - Detecta em tempo real se a câmera está do lado externo da parede olhando para o cômodo.
 * - Quando a parede fica na frente da visão da câmera, faz fade suave para semi-transparente (0.14),
 *   permitindo ver 100% dos móveis, objetos, gatos e robô sem obstrução.
 * - Quando a parede fica ao fundo (backdrop do cômodo), mantém opacidade sólida (1.0).
 * - Sincroniza rodapés, lambris e molduras filhas para desaparecerem/reaparecerem em conjunto.
 * - Desativa depthWrite quando translúcida para garantir renderização cristalina dos interiores.
 */
export const OcclusionWall = memo(function OcclusionWall({
  position,
  meshPosition,
  args,
  roomCenter,
  materialType = 'plaster',
  minOpacity = 0.14,
  maxOpacity = 1.0,
  name,
  receiveShadow = true,
  children,
}: OcclusionWallProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wallMeshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef<number>(minOpacity);
  const childMeshesRef = useRef<THREE.Mesh[]>([]);
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  // Material dedicado e clonado para esta parede específica
  const wallMaterial = useMemo(() => {
    const baseMat =
      materialType === 'bathroomTile'
        ? sharedMaterials.bathroomWallTile
        : sharedMaterials.wallPlaster;
    const mat = baseMat.clone();
    mat.transparent = true;
    mat.opacity = minOpacity;
    mat.depthWrite = false;
    mat.side = THREE.FrontSide;
    return mat;
  }, [materialType, minOpacity]);

  // Clona materiais de elementos filhos (rodapés, lambris) uma única vez na montagem
  useEffect(() => {
    if (!groupRef.current) return;
    const meshes: THREE.Mesh[] = [];

    groupRef.current.traverse((child) => {
      if (child !== wallMeshRef.current && (child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material = mesh.material.map((m) => {
              const cl = m.clone();
              cl.transparent = true;
              cl.opacity = minOpacity;
              cl.depthWrite = false;
              cl.side = THREE.FrontSide;
              return cl;
            });
          } else {
            const cl = mesh.material.clone();
            cl.transparent = true;
            cl.opacity = minOpacity;
            cl.depthWrite = false;
            cl.side = THREE.FrontSide;
            mesh.material = cl;
          }
          meshes.push(mesh);
        }
      }
    });

    childMeshesRef.current = meshes;
  }, [children, minOpacity]);

  useFrame(({ camera }, rawDelta) => {
    if (!groupRef.current) return;
    const delta = Math.min(rawDelta, 0.05);

    // Obtém posição absoluta da parede no espaço 3D global
    groupRef.current.getWorldPosition(worldPos);

    // Vetor da parede para o centro do cômodo (aponta para o interior)
    const vWallToRoomX = roomCenter[0] - worldPos.x;
    const vWallToRoomZ = roomCenter[1] - worldPos.z;

    // Vetor da câmera para a parede
    const vCamToWallX = worldPos.x - camera.position.x;
    const vCamToWallZ = worldPos.z - camera.position.z;

    // Produto escalar 2D (plano XZ):
    // Se dot > 0.05, a câmera está no exterior olhando através da parede para o centro do cômodo -> Oclusão frontal!
    const dot = vCamToWallX * vWallToRoomX + vCamToWallZ * vWallToRoomZ;
    const targetOpacity = dot > 0.05 ? minOpacity : maxOpacity;

    // Transição suave contínua (estilo cinematic lens) sem saltos bruscos
    const prevOpacity = currentOpacityRef.current;
    const newOpacity = THREE.MathUtils.damp(prevOpacity, targetOpacity, 8.0, delta);
    currentOpacityRef.current = newOpacity;

    // Atualiza material da parede principal
    wallMaterial.opacity = newOpacity;
    wallMaterial.depthWrite = newOpacity > 0.85;

    // Atualiza materiais dos elementos filhos (rodapés, lambris)
    const childrenList = childMeshesRef.current;
    for (let i = 0; i < childrenList.length; i++) {
      const mesh = childrenList[i];
      if (Array.isArray(mesh.material)) {
        for (let j = 0; j < mesh.material.length; j++) {
          mesh.material[j].opacity = newOpacity;
          mesh.material[j].depthWrite = newOpacity > 0.85;
        }
      } else {
        mesh.material.opacity = newOpacity;
        mesh.material.depthWrite = newOpacity > 0.85;
      }
    }
  });

  return (
    <group ref={groupRef} name={name} position={position}>
      {/* Parede estrutural - não projeta sombra dura quando translúcida para preservar iluminação */}
      <mesh
        ref={wallMeshRef}
        castShadow={false}
        receiveShadow={receiveShadow}
        position={meshPosition ?? [0, 0, 0]}
        material={wallMaterial}
      >
        <boxGeometry args={args} />
      </mesh>
      {children}
    </group>
  );
});

