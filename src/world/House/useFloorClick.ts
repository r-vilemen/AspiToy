import type { ThreeEvent } from '@react-three/fiber';
import { useCommandStore } from '@/store/commandStore';
import { HOUSE_FLOOR_PLAN, getRoomAtPosition } from './FloorPlan';
import { clamp } from '@/utils/math';

/**
 * Hook compartilhado para navegação por clique no chão ("Point-and-Click"):
 * - Funciona em toda a residência conectada (Quarto, Corredor, Sala, Cozinha e Banheiro)
 * - Identifica o cômodo onde ocorreu o clique e aplica margem de segurança de parede
 * - Dispara comando MOVE_TO_POINT que traça a rota pelo grafo de portas (RoomGraph)
 */
export function useHouseFloorClick() {
  const dispatchCommand = useCommandStore((s) => s.dispatchCommand);

  return (e: ThreeEvent<MouseEvent>) => {
    // Ignora arrasto da câmera pelo OrbitControls
    if (e.delta > 6) return;
    e.stopPropagation();

    const rawX = e.point.x;
    const rawZ = e.point.z;

    const roomId = getRoomAtPosition({ x: rawX, z: rawZ });
    const room = HOUSE_FLOOR_PLAN.rooms[roomId];

    const wallMargin = 0.35;
    const targetX = clamp(
      rawX,
      room.bounds.minX + wallMargin,
      room.bounds.maxX - wallMargin
    );
    const targetZ = clamp(
      rawZ,
      room.bounds.minZ + wallMargin,
      room.bounds.maxZ - wallMargin
    );

    dispatchCommand('MOVE_TO_POINT', {
      point: {
        x: Number(targetX.toFixed(2)),
        z: Number(targetZ.toFixed(2)),
      },
    });
  };
}
