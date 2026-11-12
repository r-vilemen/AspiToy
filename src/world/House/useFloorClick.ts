import type { ThreeEvent } from '@react-three/fiber';
import { useCommandStore } from '@/store/commandStore';
import { HOUSE_FLOOR_PLAN, getRoomAtPosition } from './FloorPlan';
import { ALL_HOUSE_OBSTACLES } from './HouseObstacles';
import { getDistanceToAABB } from '@/utils/coordinates';
import { clamp } from '@/utils/math';

/**
 * Hook compartilhado para navegação por clique no chão ("Point-and-Click"):
 * - Funciona em toda a residência conectada (Quarto, Corredor, Sala, Cozinha e Banheiro)
 * - Identifica o cômodo onde ocorreu o clique e aplica margem de segurança de parede
 * - Projeta cliques sobre móveis para o ponto navegável livre mais próximo
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
    let targetX = clamp(
      rawX,
      room.bounds.minX + wallMargin,
      room.bounds.maxX - wallMargin
    );
    let targetZ = clamp(
      rawZ,
      room.bounds.minZ + wallMargin,
      room.bounds.maxZ - wallMargin
    );

    // Se o ponto clicado cair dentro ou colado a um móvel/obstáculo sólido,
    // projeta para o ponto livre navegável seguro mais próximo
    for (const obs of ALL_HOUSE_OBSTACLES) {
      if (!obs.collidable) continue;
      const info = getDistanceToAABB({ x: targetX, z: targetZ }, obs.bounds);
      if (info.isInside || info.distance < 0.28) {
        const cx = (obs.bounds.minX + obs.bounds.maxX) / 2;
        const cz = (obs.bounds.minZ + obs.bounds.maxZ) / 2;
        let dx = targetX - cx;
        let dz = targetZ - cz;
        const len = Math.hypot(dx, dz);
        if (len > 1e-4) {
          const halfW = (obs.bounds.maxX - obs.bounds.minX) / 2;
          const halfD = (obs.bounds.maxZ - obs.bounds.minZ) / 2;
          targetX = cx + (dx / len) * (halfW + 0.32);
          targetZ = cz + (dz / len) * (halfD + 0.32);
        }
        break;
      }
    }

    dispatchCommand('MOVE_TO_POINT', {
      point: {
        x: Number(targetX.toFixed(2)),
        z: Number(targetZ.toFixed(2)),
      },
    });
  };
}

