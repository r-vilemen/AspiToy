import { memo, useMemo } from 'react';
import { sharedMaterials } from '../Environment/Materials';

interface FloorProps {
  width?: number;
  depth?: number;
}

/**
 * Piso de tábuas de madeira laminada com variação de tons e rodapés de acabamento.
 * Utiliza geometria mesclada/instanciada estática sem re-renderizações (`three-best-practices`).
 */
export const Floor = memo(function Floor({ width = 10, depth = 8 }: FloorProps) {
  // Construção do padrão de réguas/tábuas de madeira (parquet contemporâneo)
  const planks = useMemo(() => {
    const list: { x: number; z: number; w: number; d: number; isAlt: boolean }[] = [];
    const plankWidth = 0.48;
    const plankLength = 1.95;
    const gap = 0.008;

    const startX = -width / 2 + plankWidth / 2;
    const endX = width / 2;
    const startZ = -depth / 2 + plankLength / 2;
    const endZ = depth / 2;

    let col = 0;
    for (let x = startX; x < endX; x += plankWidth + gap) {
      let row = 0;
      // Offset de meio comprimento para padrão desencontrado (running bond)
      const offsetZ = (col % 2) * (plankLength * 0.45);
      for (let z = startZ - offsetZ; z < endZ + plankLength; z += plankLength + gap) {
        if (z + plankLength / 2 > -depth / 2 && z - plankLength / 2 < depth / 2) {
          const isAlt = (col * 3 + row) % 5 === 0 || (col + row) % 7 === 0;
          list.push({ x, z, w: plankWidth, d: plankLength, isAlt });
        }
        row++;
      }
      col++;
    }
    return list;
  }, [width, depth]);

  return (
    <group name="house-floor">
      {/* Substrato isolante sob o piso */}
      <mesh
        receiveShadow
        position={[0, -0.06, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[width + 0.1, 0.1, depth + 0.1]} />
      </mesh>

      {/* Base plana principal de suporte com sombra */}
      <mesh
        receiveShadow
        position={[0, -0.005, 0]}
        material={sharedMaterials.floorWood}
      >
        <boxGeometry args={[width, 0.01, depth]} />
      </mesh>

      {/* Tábuas de piso com relevo sutil (0.003m) gerando ranhuras naturais de iluminação */}
      {planks.map((plank, i) => (
        <mesh
          key={i}
          receiveShadow
          position={[plank.x, 0.001, plank.z]}
          material={plank.isAlt ? sharedMaterials.floorPlankAlt : sharedMaterials.floorWood}
        >
          <boxGeometry args={[plank.w - 0.006, 0.002, plank.d - 0.006]} />
        </mesh>
      ))}

      {/* Moldura / Rodapés periféricos elegantes */}
      <mesh
        receiveShadow
        position={[0, 0.06, -depth / 2 + 0.02]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[width, 0.12, 0.04]} />
      </mesh>
      <mesh
        receiveShadow
        position={[width / 2 - 0.02, 0.06, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[0.04, 0.12, depth]} />
      </mesh>
      <mesh
        receiveShadow
        position={[-width / 2 + 0.02, 0.06, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[0.04, 0.12, depth]} />
      </mesh>
    </group>
  );
});
