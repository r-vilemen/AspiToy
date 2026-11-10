import { memo } from 'react';
import { sharedMaterials } from '../Environment/Materials';

interface FloorProps {
  width?: number;
  depth?: number;
}

/**
 * Piso de tábuas de madeira mel saturada estilo PS2 (textura low-res + manchas de sol da janela).
 */
export const Floor = memo(function Floor({ width = 10, depth = 8 }: FloorProps) {
  return (
    <group name="house-floor-ps2">
      {/* Substrato do piso */}
      <mesh
        receiveShadow
        position={[0, -0.06, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[width + 0.2, 0.1, depth + 0.2]} />
      </mesh>

      {/* Piso principal com textura procedural low-res de tábuas de madeira */}
      <mesh
        receiveShadow
        position={[0, 0, 0]}
        material={sharedMaterials.floorWood}
      >
        <boxGeometry args={[width, 0.02, depth]} />
      </mesh>

      {/* Projeção clássica de luz solar da janela no chão (Sun Patches estilo PS2) */}
      <group position={[-2.1, 0.013, -1.25]} rotation={[-Math.PI / 2, 0, -0.12]}>
        <mesh>
          <planeGeometry args={[1.55, 0.95]} />
          <meshBasicMaterial
            color="#FFF2B2"
            transparent
            opacity={0.42}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0.1, -1.1, 0]}>
          <planeGeometry args={[1.7, 0.85]} />
          <meshBasicMaterial
            color="#FFF2B2"
            transparent
            opacity={0.34}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
});
