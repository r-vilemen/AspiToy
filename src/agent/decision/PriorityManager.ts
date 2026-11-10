import type { DustSpot, RoomRegion } from '@/types/environment';
import type { Vector2D } from '@/types/robot';

export interface CleaningTarget {
  spotId: string;
  position: Vector2D;
  priorityScore: number;
  regionId: string;
}

/**
 * Gerenciador de prioridade de limpeza (Sprint 3):
 * - Calcula a pontuação de prioridade ponderando:
 *   1. Intensidade de sujeira acumulada
 *   2. Proximidade espacial do robô
 *   3. Região selecionada pelo usuário (prioridade máxima)
 *   4. Estado de bateria crítica (retorno prioritário)
 */
export class PriorityManager {
  public selectBestTarget(
    currentPos: Vector2D,
    dustSpots: DustSpot[],
    selectedRegionId: string,
    _regions: RoomRegion[],
    battery: number,
    dockPos: Vector2D
  ): Vector2D | null {
    // 1. Regra de segurança de bateria crítica (< 18%): a base de recarga é prioridade absoluta
    if (battery <= 18) {
      return dockPos;
    }

    // 2. Filtra pontos que ainda precisam de limpeza (intensidade > 0.05)
    let candidateSpots = dustSpots.filter((s) => s.intensity > 0.05);

    // Se um cômodo/região específica foi selecionada, o robô atua EXCLUSIVAMENTE nela
    if (selectedRegionId && selectedRegionId !== 'all') {
      candidateSpots = candidateSpots.filter((s) => s.regionId === selectedRegionId);
    }

    if (candidateSpots.length === 0) {
      return null; // Concluído: todas as manchas ativas deste cômodo foram limpas
    }

    let bestTarget: Vector2D | null = null;
    let highestScore = -Infinity;

    for (const spot of candidateSpots) {
      const dist = Math.hypot(spot.position.x - currentPos.x, spot.position.z - currentPos.z);
      const isSelectedRegion = selectedRegionId === 'all' || spot.regionId === selectedRegionId;

      // Fórmula de pontuação:
      // + intensidade de sujeira * 40
      // + bônus de região prioritária do usuário (+80)
      // - penalidade por distância (dist * 8)
      const regionBonus = isSelectedRegion ? 80 : 0;
      const score = spot.intensity * 40 + regionBonus - dist * 8;

      if (score > highestScore) {
        highestScore = score;
        bestTarget = spot.position;
      }
    }

    return bestTarget;
  }
}
