import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CatMotionBridge } from '@/types/environment';

interface CatFoamOverlayProps {
  bridge: CatMotionBridge;
}

/**
 * Camada 3D de Espuma Acumulada no Pelo do Gato:
 * - Exibe montinhos fofos e brilhantes de espuma de sabão nas costas e cabeça do gato quando atingido pelo Canhão
 * - Segue fielmente a anatomia e animação do gato (respiração, corrida, salto)
 * - Dissolve e estoura progressivamente ao longo de alguns segundos
 */
export const CatFoamOverlay = memo(function CatFoamOverlay({ bridge }: CatFoamOverlayProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Material de espuma de sabão branco pérola perolado de alto destaque visual
  const foamMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.18,
        metalness: 0.05,
        emissive: '#FFFFFF',
        emissiveIntensity: 0.35,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, delta) => {
    if (bridge.foamTimer && bridge.foamTimer > 0) {
      bridge.foamTimer = Math.max(0, bridge.foamTimer - delta);

      if (groupRef.current) {
        groupRef.current.visible = true;

        // Animação de pop-in rápido e dissolução suave
        const timer = bridge.foamTimer;
        let scale = 1.0;
        if (timer > 6.0) {
          // Chegando e espumando
          scale = 1.0 + Math.sin(bridge.animPhase * 8.0) * 0.06;
        } else if (timer > 2.0) {
          // Espuma borbulhando no pelo
          scale = 1.0 + Math.sin(bridge.animPhase * 5.0) * 0.04;
        } else {
          // Estourando e sumindo
          scale = Math.max(0.001, timer / 2.0);
        }

        groupRef.current.scale.set(scale, scale, scale);
      }
    } else {
      if (groupRef.current && groupRef.current.visible) {
        groupRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={groupRef} visible={false} name="cat-foam-bubbles">
      {/* Montinho de espuma no dorso central das costas */}
      <mesh position={[0, 0.12, 0.02]} material={foamMaterial}>
        <sphereGeometry args={[0.078, 12, 12]} />
      </mesh>
      <mesh position={[0.038, 0.11, 0.07]} material={foamMaterial}>
        <sphereGeometry args={[0.054, 10, 10]} />
      </mesh>
      <mesh position={[-0.038, 0.10, -0.04]} material={foamMaterial}>
        <sphereGeometry args={[0.06, 10, 10]} />
      </mesh>
      <mesh position={[0.025, 0.09, -0.09]} material={foamMaterial}>
        <sphereGeometry args={[0.048, 8, 8]} />
      </mesh>
      <mesh position={[-0.03, 0.08, 0.1]} material={foamMaterial}>
        <sphereGeometry args={[0.044, 8, 8]} />
      </mesh>

      {/* Bolinhas de espuma no topo da cabeça */}
      <mesh position={[0.028, 0.155, 0.19]} material={foamMaterial}>
        <sphereGeometry args={[0.048, 10, 10]} />
      </mesh>
      <mesh position={[-0.025, 0.16, 0.17]} material={foamMaterial}>
        <sphereGeometry args={[0.042, 8, 8]} />
      </mesh>
      <mesh position={[0.005, 0.17, 0.22]} material={foamMaterial}>
        <sphereGeometry args={[0.035, 8, 8]} />
      </mesh>
    </group>
  );
});
