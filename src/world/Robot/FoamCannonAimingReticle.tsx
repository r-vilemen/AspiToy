import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { robotMotionBridge } from '@/store/robotStore';

/**
 * Retículo / Mira Holográfica 3D do Canhão de Espuma:
 * - Visível exclusivamente quando o modo de mira do Canhão de Espuma está engatilhado
 * - Projeta-se sobre a superfície exata mirada (parede, móvel ou chão)
 * - Alinha-se dinamicamente à normal da superfície
 * - Animação de pulso e rotação suave indicando área de impacto pronta para disparo
 */
export const FoamCannonAimingReticle = memo(function FoamCannonAimingReticle() {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const upVec = useRef(new THREE.Vector3(0, 1, 0));
  const normalVec = useRef(new THREE.Vector3(0, 1, 0));
  const quat = useRef(new THREE.Quaternion());

  useFrame((state) => {
    if (!groupRef.current) return;

    if (
      !robotMotionBridge.isCannonAiming ||
      (robotMotionBridge.foamTargetX === 0 && robotMotionBridge.foamTargetZ === 0)
    ) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;

    // Normal da superfície mirada
    const nx = robotMotionBridge.foamTargetNormalX || 0;
    const ny = robotMotionBridge.foamTargetNormalY || 1;
    const nz = robotMotionBridge.foamTargetNormalZ || 0;
    normalVec.current.set(nx, ny, nz).normalize();

    // Posiciona ligeiramente destacado da superfície para evitar z-fighting
    const offset = 0.015;
    groupRef.current.position.set(
      robotMotionBridge.foamTargetX + normalVec.current.x * offset,
      robotMotionBridge.foamTargetY + normalVec.current.y * offset,
      robotMotionBridge.foamTargetZ + normalVec.current.z * offset
    );

    // Alinha a rotação do retículo com a normal da face
    quat.current.setFromUnitVectors(upVec.current, normalVec.current);
    groupRef.current.quaternion.copy(quat.current);

    // Animação de pulso e rotação suave
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const s = 1.0 + Math.sin(t * 6.0) * 0.08;
      ringRef.current.scale.set(s, 1, s);
      ringRef.current.rotation.y = t * 1.8;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {/* Anel externo principal de mira */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color="#FB923C"
          transparent
          opacity={0.88}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Círculo central translúcido */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.07, 24]} />
        <meshBasicMaterial
          color="#F97316"
          transparent
          opacity={0.35}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Traços cruzados de precisão (Crosshair) */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => (
        <group key={idx} rotation={[0, ang, 0]}>
          <mesh position={[0.26, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.07, 0.018]} />
            <meshBasicMaterial
              color="#EA580C"
              transparent
              opacity={0.92}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
});
