import type { PushableToyState } from '@/types/environment';
import type { Vector2D } from '@/types/robot';

/**
 * Zona demarcada do tapete do quarto Andy onde os brinquedos devem ser organizados
 */
export const TOY_STORAGE_ZONE = {
  center: { x: -0.75, z: -1.1 },
  radius: 1.65,
};

export interface ToyOrganizingPlan {
  targetToy: PushableToyState | null;
  targetPoint: Vector2D;
  isPushing: boolean;
  organizedCount: number;
  totalToys: number;
  allDone: boolean;
}

/**
 * Especialista autônomo do Modo Guarda-Brinquedos (ORGANIZING):
 * - Identifica os brinquedos espalhados pelo chão fora do tapete
 * - Calcula a posição de contorno e alinhamento atrás do brinquedo
 * - Orienta o robô a empurrar o brinquedo com a física elástica até a zona do tapete
 */
export class ToyOrganizer {
  public isToyOrganized(toy: PushableToyState): boolean {
    const dist = Math.hypot(
      toy.x - TOY_STORAGE_ZONE.center.x,
      toy.z - TOY_STORAGE_ZONE.center.z
    );
    return dist <= TOY_STORAGE_ZONE.radius;
  }

  public getOrganizedCount(toys: PushableToyState[]): number {
    return toys.filter((toy) => this.isToyOrganized(toy)).length;
  }

  public planStep(robotPos: Vector2D, toys: PushableToyState[]): ToyOrganizingPlan {
    const totalToys = toys.length;
    const unorganized = toys.filter((t) => !this.isToyOrganized(t));
    const organizedCount = totalToys - unorganized.length;

    if (unorganized.length === 0) {
      return {
        targetToy: null,
        targetPoint: TOY_STORAGE_ZONE.center,
        isPushing: false,
        organizedCount,
        totalToys,
        allDone: true,
      };
    }

    // Seleciona o brinquedo não organizado mais próximo do robô
    let bestToy = unorganized[0];
    let minDist = Math.hypot(robotPos.x - bestToy.x, robotPos.z - bestToy.z);

    for (let i = 1; i < unorganized.length; i++) {
      const toy = unorganized[i];
      const d = Math.hypot(robotPos.x - toy.x, robotPos.z - toy.z);
      if (d < minDist) {
        minDist = d;
        bestToy = toy;
      }
    }

    // Vetor do brinquedo até o centro do tapete de destino
    const dx = TOY_STORAGE_ZONE.center.x - bestToy.x;
    const dz = TOY_STORAGE_ZONE.center.z - bestToy.z;
    const len = Math.hypot(dx, dz) || 1;
    const nx = dx / len;
    const nz = dz / len;

    // Ponto de aproximação atrás do brinquedo (para empurrá-lo em direção ao tapete)
    const approachPoint: Vector2D = {
      x: Number((bestToy.x - nx * 0.42).toFixed(2)),
      z: Number((bestToy.z - nz * 0.42).toFixed(2)),
    };

    const distToApproach = Math.hypot(
      robotPos.x - approachPoint.x,
      robotPos.z - approachPoint.z
    );

    // Se o robô já está perto do ponto de aproximação, avança empurrando o brinquedo
    if (distToApproach < 0.32) {
      const pushPoint: Vector2D = {
        x: Number((bestToy.x + nx * 0.65).toFixed(2)),
        z: Number((bestToy.z + nz * 0.65).toFixed(2)),
      };
      return {
        targetToy: bestToy,
        targetPoint: pushPoint,
        isPushing: true,
        organizedCount,
        totalToys,
        allDone: false,
      };
    }

    // Senão, o robô navega até o ponto de aproximação
    return {
      targetToy: bestToy,
      targetPoint: approachPoint,
      isPushing: false,
      organizedCount,
      totalToys,
      allDone: false,
    };
  }
}
