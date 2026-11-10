import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_PALETTE } from '../Environment/Materials';

interface RobotEffectsProps {
  isCleaning?: boolean;
  isRecharging?: boolean;
}

/**
 * Feedback Visual de Ações do AspiToy (Seção 9 da Direção de Arte):
 * - Fluxo pulsante de sucção e micro-vórtice sob o chassi durante a limpeza
 * - Halo esmeralda suave durante a recarga na base
 */
export const RobotEffects = memo(function RobotEffects({
  isCleaning = false,
  isRecharging = false,
}: RobotEffectsProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outerRingRef.current) {
      const pulse = 1 + Math.sin(t * 6.5) * 0.06;
      outerRingRef.current.scale.set(pulse, pulse, 1);
    }
    if (innerRingRef.current) {
      const inward = 1 - ((t * 1.4) % 0.35);
      innerRingRef.current.scale.set(inward, inward, 1);
    }
  });

  if (!isCleaning && !isRecharging) return null;

  const effectColor = isRecharging
    ? WORLD_PALETTE.ledEmerald
    : WORLD_PALETTE.sensorCyan;

  return (
    <group position={[0, 0.015, 0]}>
      {/* Anel externo pulsante */}
      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.28, 0.34, 36]} />
        <meshBasicMaterial
          color={effectColor}
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </mesh>

      {/* Ondas concêntricas de sucção convergindo para o compartimento de limpeza */}
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
