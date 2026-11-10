import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT = 42;

interface MoteSeed {
  x: number;
  y: number;
  z: number;
  speedY: number;
  phase: number;
  scale: number;
}

/**
 * Partículas sutis de poeira em suspensão iluminadas pelos feixes solares da janela.
 * Renderizadas via InstancedMesh em 60 FPS sem custo de estado no React.
 */
export function DustParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const seeds = useMemo<MoteSeed[]>(() => {
    const list: MoteSeed[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Distribuídas principalmente na zona banhada pelo sol (oeste e norte da sala)
      const angle = (i * 1.618) % (Math.PI * 2);
      const radius = 0.4 + ((i * 0.37) % 2.8);
      list.push({
        x: -1.4 + Math.cos(angle) * radius,
        y: 0.35 + ((i * 0.29) % 3.1),
        z: -0.9 + Math.sin(angle) * radius * 0.85,
        speedY: 0.04 + (i % 5) * 0.012,
        phase: i * 0.85,
        scale: 0.01 + (i % 3) * 0.004,
      });
    }
    return list;
  }, []);

  useFrame((state) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const s = seeds[i];
      const y = 0.25 + ((s.y + t * s.speedY) % 3.2);
      const x = s.x + Math.sin(t * 0.45 + s.phase) * 0.12;
      const z = s.z + Math.cos(t * 0.38 + s.phase) * 0.12;

      dummy.position.set(x, y, z);
      const pulse = s.scale * (0.8 + Math.sin(t * 1.8 + s.phase) * 0.2);
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#FFF6D6"
        transparent
        opacity={0.42}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

