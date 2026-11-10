import type { AgentPerceptionSnapshot, SensorRayReading } from '@/types/agent';
import type { Vector2D } from '@/types/robot';
import type { ObstacleDetector } from '../navigation/ObstacleDetector';

/**
 * Sistema de sensores simulados do AspiToy:
 * - Emite feixes em leque frontal para detecção de proximidade (ToF / LIDAR simulado)
 * - Avalia desobstrução à frente, à esquerda e à direita
 */
export class SensorSystem {
  private detector: ObstacleDetector;
  private numRays: number;
  private fovRad: number;
  private maxRange: number;

  constructor(
    detector: ObstacleDetector,
    numRays = 7,
    fovRad = Math.PI * 0.75, // 135 graus de campo de visão frontal
    maxRange = 1.8
  ) {
    this.detector = detector;
    this.numRays = numRays;
    this.fovRad = fovRad;
    this.maxRange = maxRange;
  }

  public scan(
    position: Vector2D,
    rotationY: number,
    currentRegionId: string
  ): AgentPerceptionSnapshot {
    const rays: SensorRayReading[] = [];
    const step = this.numRays > 1 ? this.fovRad / (this.numRays - 1) : 0;
    const startAngle = -this.fovRad / 2;

    let nearestDist = this.maxRange;

    for (let i = 0; i < this.numRays; i++) {
      const angleOffset = startAngle + i * step;
      const rayAngle = rotationY + angleOffset;
      const rayDirX = Math.sin(rayAngle);
      const rayDirZ = Math.cos(rayAngle);

      let dist = this.maxRange;
      let hit = false;
      let hitId: string | null = null;
      let hitLabel: string | null = null;

      // Amostragem ao longo do raio em passos discretos de 5cm
      const sampleStep = 0.05;
      for (let s = 0.15; s <= this.maxRange; s += sampleStep) {
        const testPoint: Vector2D = {
          x: position.x + rayDirX * s,
          z: position.z + rayDirZ * s,
        };

        if (this.detector.isColliding(testPoint, 0.08)) {
          dist = s;
          hit = true;
          const nearest = this.detector.getDistanceToNearestObstacle(testPoint);
          hitId = nearest.obstacleId;
          hitLabel = nearest.obstacleLabel;
          break;
        }
      }

      if (dist < nearestDist) {
        nearestDist = dist;
      }

      rays.push({
        angleOffset,
        distance: Number(dist.toFixed(2)),
        maxRange: this.maxRange,
        hit,
        obstacleId: hitId,
        obstacleLabel: hitLabel,
      });
    }

    const { distance: dockDist } = this.detector.getDistanceToNearestObstacle(position);

    return {
      position: { ...position },
      rotationY,
      rays,
      nearestObstacleDistance: nearestDist,
      isNearDock: dockDist < 0.6,
      currentRegionId,
    };
  }
}

