import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_PALETTE } from '../Environment/Materials';
import { robotMotionBridge } from '@/store/robotStore';

interface RobotEffectsProps {
  isCleaning?: boolean;
  isRecharging?: boolean;
}

/**
 * Feedback Visual e Efeitos Especiais de Base do AspiToy:
 * - Vórtice de sucção e halo de recarga sob o chassi
 * - Anel aerodinâmico de vento descendente (downwash) durante o Modo Aspi-Helicóptero
 */
export const RobotEffects = memo(function RobotEffects({
  isCleaning = false,
  isRecharging = false,
}: RobotEffectsProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const downwashRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 1. Anéis normais de limpeza e recarga sob o chassi
    if (outerRingRef.current) {
      const pulse = 1 + Math.sin(t * 6.5) * 0.06;
      outerRingRef.current.scale.set(pulse, pulse, 1);
    }
    if (innerRingRef.current) {
      const inward = 1 - ((t * 1.4) % 0.35);
      innerRingRef.current.scale.set(inward, inward, 1);
    }

    // 2. Anel de vento descendente do Modo Helicóptero (Downwash)
    if (downwashRingRef.current) {
      if ((robotMotionBridge.isFlying || robotMotionBridge.propellerSpeed > 15.0) && robotMotionBridge.y > 0.06) {
        const expand = 1.0 + ((t * 4.0) % 1.0) * 0.8;
        const fade = Math.max(0, 0.35 - ((t * 4.0) % 1.0) * 0.35);
        downwashRingRef.current.scale.set(expand, expand, 1);
        const mat = downwashRingRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = fade;
        downwashRingRef.current.position.y = -robotMotionBridge.y + 0.005;
      } else {
        const mat = downwashRingRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0;
      }
    }
  });

  const effectColor = isRecharging
    ? WORLD_PALETTE.ledEmerald
    : WORLD_PALETTE.sensorCyan;

  return (
    <group position={[0, 0.015, 0]}>
      {/* Anel de vento descendente do helicóptero projetado no piso */}
      <mesh ref={downwashRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.52, 32]} />
        <meshBasicMaterial
          color="#94A3B8"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Anel externo pulsante de limpeza/recarga */}
      {(isCleaning || isRecharging) && (
        <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 36]} />
          <meshBasicMaterial
            color={effectColor}
            transparent
            opacity={0.26}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Ondas concêntricas de sucção */}
      {isCleaning && (
        <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.25, 32]} />
          <meshBasicMaterial
            color={WORLD_PALETTE.robotYellow}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
});
