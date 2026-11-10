import type { EnvironmentObstacle } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { isPointInsideBounds } from '@/utils/coordinates';

/**
 * Detector de obstáculos puramente matemático (desacoplado do Three.js/React).
 */
export class ObstacleDetector {
  private obstacles: EnvironmentObstacle[];
  private roomWidth: number;
  private roomDepth: number;

  constructor(
    obstacles: EnvironmentObstacle[],
    roomWidth: number,
    roomDepth: number
  ) {
    this.obstacles = obstacles;
    this.roomWidth = roomWidth;
    this.roomDepth = roomDepth;
  }

  public setObstacles(obstacles: EnvironmentObstacle[]): void {
    this.obstacles = obstacles;
  }

  /**
   * Verifica se um ponto com raio de colisão intercepta paredes ou móveis.
   */
  public isColliding(point: Vector2D, robotRadius = 0.32): boolean {
    const halfW = this.roomWidth / 2;
    const halfD = this.roomDepth / 2;

    // Colisão com as paredes perimétricas
    if (
      point.x - robotRadius <= -halfW ||
      point.x + robotRadius >= halfW ||
      point.z - robotRadius <= -halfD ||
      point.z + robotRadius >= halfD
    ) {
      return true;
    }

    // Colisão com obstáculos sólidos da sala
    for (const obs of this.obstacles) {
      if (!obs.collidable) continue;
      if (isPointInsideBounds(point, obs.bounds, robotRadius)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Distância estimada de um ponto até o obstáculo mais próximo.
   */
  public getDistanceToNearestObstacle(point: Vector2D): {
    distance: number;
    obstacleId: string | null;
    obstacleLabel: string | null;
  } {
    let minDistance = Infinity;
    let closestId: string | null = null;
    let closestLabel: string | null = null;

    // Distância para as 4 paredes
    const halfW = this.roomWidth / 2;
    const halfD = this.roomDepth / 2;
    const distToWalls = Math.min(
      point.x - (-halfW),
      halfW - point.x,
      point.z - (-halfD),
      halfD - point.z
    );

    if (distToWalls < minDistance) {
      minDistance = distToWalls;
      closestId = 'wall';
      closestLabel = 'Parede';
    }

    // Distância para móveis
    for (const obs of this.obstacles) {
      if (!obs.collidable) continue;
      // Ponto mais próximo no retângulo delimitador
      const clampedX = Math.max(obs.bounds.minX, Math.min(point.x, obs.bounds.maxX));
      const clampedZ = Math.max(obs.bounds.minZ, Math.min(point.z, obs.bounds.maxZ));
      const dist = Math.hypot(point.x - clampedX, point.z - clampedZ);

      if (dist < minDistance) {
        minDistance = dist;
        closestId = obs.id;
        closestLabel = obs.label;
      }
    }

    return {
      distance: Math.max(0, minDistance),
      obstacleId: closestId,
      obstacleLabel: closestLabel,
    };
  }
}
