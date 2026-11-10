import { memo } from 'react';
import { Floor } from './Floor';
import { Walls } from './Walls';
import { Furniture } from './Furniture';
import { useEnvironmentStore } from '@/store/environmentStore';

/**
 * Módulo unificado da Casa / Sala de Estar 3D.
 * Renderiza piso com tábuas detalhadas, paredes arquitetônicas em corte,
 * esquadrias com vidro, móveis estilizados e base de recarga.
 */
export const House = memo(function House() {
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);
  const dustSpots = useEnvironmentStore((s) => s.dustSpots);

  return (
    <group name="house-living-room">
      {/* 1. Piso de madeira laminada com ranhuras e rodapés */}
      <Floor width={roomDimensions.width} depth={roomDimensions.depth} />

      {/* 2. Paredes com cortes cinematográficos, esquadrias e porta */}
      <Walls
        width={roomDimensions.width}
        depth={roomDimensions.depth}
        height={roomDimensions.wallHeight}
      />

      {/* 3. Mobiliário detalhado, plantas e base de carregamento */}
      <Furniture />

      {/* 4. Pontos de poeira discretos no piso aguardando aspiração */}
      {dustSpots.map(
        (spot) =>
          spot.intensity > 0.05 && (
            <group key={spot.id} position={[spot.position.x, 0.015, spot.position.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.05, spot.radius * spot.intensity, 24]} />
                <meshStandardMaterial
                  color="#8A6A4E"
                  transparent
                  opacity={0.38 * spot.intensity}
                  roughness={1}
                />
              </mesh>
            </group>
          )
      )}
    </group>
  );
});
