import type { ThreeEvent } from '@react-three/fiber';
import { useCommandStore } from '@/store/commandStore';
import { useRobotStore, robotMotionBridge } from '@/store/robotStore';
import { HOUSE_FLOOR_PLAN, getRoomAtPosition } from './FloorPlan';
import { ALL_HOUSE_OBSTACLES, HOUSE_ELEVATED_SURFACES } from './HouseObstacles';
import { getDistanceToAABB, isPointInsideBounds } from '@/utils/coordinates';
import { clamp } from '@/utils/math';

/**
 * Hook compartilhado para navegação por clique no chão ("Point-and-Click"):
 * - Funciona em toda a residência conectada (Quarto, Corredor, Sala, Cozinha e Banheiro)
 * - Identifica o cômodo onde ocorreu o clique e aplica margem de segurança de parede
 * - Reconhece cliques em superfícies elevadas (mesas, sofás, baú, ilha) e preserva o alvo sobre o móvel
 * - Projeta cliques sobre móveis sólidos do piso para o ponto livre navegável seguro mais próximo
 * - Dispara comando MOVE_TO_POINT que traça a rota pelo grafo de portas (RoomGraph)
 */
export function useHouseFloorClick() {
  const dispatchCommand = useCommandStore((s) => s.dispatchCommand);

  return (e: ThreeEvent<MouseEvent>) => {
    // Ignora arrasto da câmera pelo OrbitControls
    if (e.delta > 6) return;

    const rawX = e.point.x;
    const rawZ = e.point.z;

    // Se o modo de mira do Canhão de Espuma estiver ativo, impede navegação pelo chão
    if (robotMotionBridge.isCannonAiming || useRobotStore.getState().isCannonAiming) {
      e.stopPropagation();
      return;
    }

    e.stopPropagation();

    const elevatedSurface = HOUSE_ELEVATED_SURFACES.find((s) =>
      isPointInsideBounds({ x: rawX, z: rawZ }, s.bounds, 0.04)
    );

    let targetX: number;
    let targetZ: number;

    if (elevatedSurface) {
      // O clique ocorreu em uma superfície de móvel elevada (mesa, sofá, baú ou balcão).
      // Mantém o destino sobre o tampo com pequena margem interna para evitar a borda.
      const margin = 0.10;
      targetX = clamp(
        rawX,
        elevatedSurface.bounds.minX + margin,
        elevatedSurface.bounds.maxX - margin
      );
      targetZ = clamp(
        rawZ,
        elevatedSurface.bounds.minZ + margin,
        elevatedSurface.bounds.maxZ - margin
      );
    } else {
      const roomId = getRoomAtPosition({ x: rawX, z: rawZ });
      const room = HOUSE_FLOOR_PLAN.rooms[roomId];

      const wallMargin = 0.35;
      targetX = clamp(
        rawX,
        room.bounds.minX + wallMargin,
        room.bounds.maxX - wallMargin
      );
      targetZ = clamp(
        rawZ,
        room.bounds.minZ + wallMargin,
        room.bounds.maxZ - wallMargin
      );

      // Se o ponto clicado cair dentro ou colado a um móvel/obstáculo sólido do piso,
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
    }

    dispatchCommand('MOVE_TO_POINT', {
      point: {
        x: Number(targetX.toFixed(2)),
        z: Number(targetZ.toFixed(2)),
      },
    });
  };
}
