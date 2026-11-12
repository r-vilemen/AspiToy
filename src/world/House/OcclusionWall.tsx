import React, { useRef, useMemo, useEffect, memo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sharedMaterials } from '../Environment/Materials';
import { robotMotionBridge } from '@/store/robotStore';

export interface OcclusionWallProps {
  position: [number, number, number];
  meshPosition?: [number, number, number];
  args: [number, number, number];
  roomCenter?: [number, number]; // [x, z] centro do cômodo que a parede delimita (legado/opcional)
  materialType?: 'plaster' | 'bathroomTile';
  minOpacity?: number; // Opacidade quando a parede obstrui a visão do robô (padrão: 0.14)
  maxOpacity?: number; // Opacidade quando a parede está ao fundo / visível (padrão: 1.0)
  name?: string;
  receiveShadow?: boolean;
  children?: React.ReactNode;
}

/**
 * Teste exato de interseção entre segmento de reta (Câmera -> Ponto de foco) e caixa alinhada (AABB).
 * Retorna true se o segmento atravessar o volume da parede, significando obstrução direta da visão.
 */
function segmentIntersectsAABB(
  p0x: number,
  p0y: number,
  p0z: number,
  p1x: number,
  p1y: number,
  p1z: number,
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  minZ: number,
  maxZ: number
): boolean {
  // Se a câmera estiver dentro da parede (ou colada na face com margem de near plane)
  const camPad = 0.12;
  if (
    p0x >= minX - camPad &&
    p0x <= maxX + camPad &&
    p0y >= minY - camPad &&
    p0y <= maxY + camPad &&
    p0z >= minZ - camPad &&
    p0z <= maxZ + camPad
  ) {
    return true;
  }

  const dx = p1x - p0x;
  const dy = p1y - p0y;
  const dz = p1z - p0z;

  let tMin = 0.0;
  let tMax = 1.0;

  // Slab X
  if (Math.abs(dx) < 1e-7) {
    if (p0x < minX || p0x > maxX) return false;
  } else {
    const invD = 1.0 / dx;
    let t1 = (minX - p0x) * invD;
    let t2 = (maxX - p0x) * invD;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  // Slab Y
  if (Math.abs(dy) < 1e-7) {
    if (p0y < minY || p0y > maxY) return false;
  } else {
    const invD = 1.0 / dy;
    let t1 = (minY - p0y) * invD;
    let t2 = (maxY - p0y) * invD;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  // Slab Z
  if (Math.abs(dz) < 1e-7) {
    if (p0z < minZ || p0z > maxZ) return false;
  } else {
    const invD = 1.0 / dz;
    let t1 = (minZ - p0z) * invD;
    let t2 = (maxZ - p0z) * invD;
    if (t1 > t2) {
      const tmp = t1;
      t1 = t2;
      t2 = tmp;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }

  return tMax >= 0.0 && tMin <= 1.0;
}

/**
 * Parede com Transparência Dinâmica por Linha de Visão (Line-of-Sight Occlusion):
 * - Mantém a parede 100% sólida e opaca (1.0) com depthWrite=true por padrão.
 * - Detecta em tempo real se a parede está fisicamente posicionada ENTRE a câmera e o robô
 *   (atrapalhando a linha de visão do jogador).
 * - Paredes de fundo, laterais ou em outros cômodos que não estejam bloqueando a visão
 *   permanecem opacas, mantendo a coerência do ambiente real.
 * - Sincroniza rodapés, lambris e molduras filhas para desaparecerem/reaparecerem em conjunto.
 */
export const OcclusionWall = memo(function OcclusionWall({
  position,
  meshPosition,
  args,
  materialType = 'plaster',
  minOpacity = 0.14,
  maxOpacity = 1.0,
  name,
  receiveShadow = true,
  children,
}: OcclusionWallProps) {
  const groupRef = useRef<THREE.Group>(null);
  const wallMeshRef = useRef<THREE.Mesh>(null);
  const currentOpacityRef = useRef<number>(maxOpacity);
  const childMeshesRef = useRef<THREE.Mesh[]>([]);
  const worldPos = useMemo(() => new THREE.Vector3(), []);

  const aabbRef = useRef<{
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
    initialized: boolean;
  }>({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    minZ: 0,
    maxZ: 0,
    initialized: false,
  });

  useEffect(() => {
    aabbRef.current.initialized = false;
  }, [position, meshPosition, args]);

  // Material dedicado e clonado para esta parede específica — inicia 100% opaco e sólido
  const wallMaterial = useMemo(() => {
    const baseMat =
      materialType === 'bathroomTile'
        ? sharedMaterials.bathroomWallTile
        : sharedMaterials.wallPlaster;
    const mat = baseMat.clone();
    mat.transparent = true;
    mat.opacity = maxOpacity;
    mat.depthWrite = true;
    mat.side = THREE.FrontSide;
    return mat;
  }, [materialType, maxOpacity]);

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
              cl.opacity = maxOpacity;
              cl.depthWrite = true;
              cl.side = THREE.FrontSide;
              return cl;
            });
          } else {
            const cl = mesh.material.clone();
            cl.transparent = true;
            cl.opacity = maxOpacity;
            cl.depthWrite = true;
            cl.side = THREE.FrontSide;
            mesh.material = cl;
          }
          meshes.push(mesh);
        }
      }
    });

    childMeshesRef.current = meshes;
  }, [children, maxOpacity]);

  useFrame(({ camera }, rawDelta) => {
    if (!groupRef.current || !wallMeshRef.current) return;
    const delta = Math.min(rawDelta, 0.05);

    // Obtém ou inicializa a AABB da parede em coordenadas globais de mundo
    if (!aabbRef.current.initialized) {
      wallMeshRef.current.updateWorldMatrix(true, false);
      wallMeshRef.current.getWorldPosition(worldPos);
      const halfX = args[0] / 2;
      const halfY = args[1] / 2;
      const halfZ = args[2] / 2;
      aabbRef.current = {
        minX: worldPos.x - halfX,
        maxX: worldPos.x + halfX,
        minY: worldPos.y - halfY,
        maxY: worldPos.y + halfY,
        minZ: worldPos.z - halfZ,
        maxZ: worldPos.z + halfZ,
        initialized: true,
      };
    }

    const { minX, maxX, minY, maxY, minZ, maxZ } = aabbRef.current;

    // Posição da câmera
    const cx = camera.position.x;
    const cy = camera.position.y;
    const cz = camera.position.z;

    // Posição do robô
    const rx = robotMotionBridge.x;
    const ry = 0.28;
    const rz = robotMotionBridge.z;

    // Vetor diretor câmera -> robô (plano XZ para cálculo de raio periférico)
    const dirX = rx - cx;
    const dirZ = rz - cz;
    const distXZ = Math.hypot(dirX, dirZ);

    let isObstructing = false;

    // Teste 1: Linha de visão direta até o centro do robô
    if (segmentIntersectsAABB(cx, cy, cz, rx, ry, rz, minX, maxX, minY, maxY, minZ, maxZ)) {
      isObstructing = true;
    } else if (distXZ > 0.001) {
      // Vetor normalizado perpendicular à linha de visão no chão (para cobrir bordas do robô)
      const perpX = -dirZ / distXZ;
      const perpZ = dirX / distXZ;

      // Teste 2 & 3: Raios para a borda esquerda e direita do chassi do robô
      const hitLeft = segmentIntersectsAABB(
        cx,
        cy,
        cz,
        rx - perpX * 0.22,
        ry,
        rz - perpZ * 0.22,
        minX,
        maxX,
        minY,
        maxY,
        minZ,
        maxZ
      );
      const hitRight =
        !hitLeft &&
        segmentIntersectsAABB(
          cx,
          cy,
          cz,
          rx + perpX * 0.22,
          ry,
          rz + perpZ * 0.22,
          minX,
          maxX,
          minY,
          maxY,
          minZ,
          maxZ
        );

      // Teste 4: Raio para o topo da cúpula do robô
      const hitTop =
        !hitLeft &&
        !hitRight &&
        segmentIntersectsAABB(
          cx,
          cy,
          cz,
          rx,
          ry + 0.16,
          rz,
          minX,
          maxX,
          minY,
          maxY,
          minZ,
          maxZ
        );

      isObstructing = hitLeft || hitRight || hitTop;
    }

    const targetOpacity = isObstructing ? minOpacity : maxOpacity;

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
