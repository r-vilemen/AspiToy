import { memo } from 'react';
import { WORLD_PALETTE } from '../Environment/Materials';

interface RobotEffectsProps {
  isCleaning?: boolean;
}

/**
 * Efeitos visuais contextuais do robô (partículas de sucção e brilho suave de aspiração).
 */
export const RobotEffects = memo(function RobotEffects({
  isCleaning = false,
}: RobotEffectsProps) {
  if (!isCleaning) return null;

  return (
    <group position={[0, 0.02, 0]}>
      {/* Halo de sucção no piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.34, 24]} />
        <meshBasicMaterial
          color={WORLD_PALETTE.robotCoral}
          transparent
          opacity={0.18}
        />
      </mesh>
    </group>
  );
});
