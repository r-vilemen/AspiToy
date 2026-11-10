import type { BoundingBox2D, EnvironmentObstacle } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { isPointInsideBounds } from '@/utils/coordinates';
import { clamp } from '@/utils/math';
import { HOUSE_FLOOR_PLAN } from '@/world/House/FloorPlan';

export interface CollisionResolutionResult {
  position: Vector2D;
  collided: boolean;
  obstacleId: string | null;
  obstacleLabel: string | null;
}

/**
 * Detector e resolvedor físico de colisão 2D (desacoplado de Three.js/React).
 * Considera paredes perimétricas, móveis fixos e obstáculos móveis (como o Gato doméstico).
 * Suporta navegação contínua intercômodos com passagens livres em portas abertas.
 */
export class ObstacleDetector {
  private obstacles: EnvironmentObstacle[];
  private dynamicObstacles: EnvironmentObstacle[] = [];
  private roomWidth: number;
  private roomDepth: number;
  public readonly isMultiRoom: boolean;

  constructor(
    obstacles: EnvironmentObstacle[],
    roomWidth: number,
    roomDepth: number
  ) {
    this.obstacles = obstacles;
    this.roomWidth = roomWidth;
    this.roomDepth = roomDepth;
    this.isMultiRoom = roomWidth > 12;
  }

  public setObstacles(obstacles: EnvironmentObstacle[]): void {
    this.obstacles = obstacles;
  }

  public setDynamicObstacles(dynamicObstacles: EnvironmentObstacle[]): void {
    this.dynamicObstacles = dynamicObstacles;
  }

  public getAllCollidableObstacles(): EnvironmentObstacle[] {
    return [...this.obstacles, ...this.dynamicObstacles].filter(
      (o) => o.collidable
    );
  }

  /**
   * Verifica se um ponto com raio de colisão intercepta paredes, móveis ou o gato.
   */
  public isColliding(point: Vector2D, robotRadius = 0.32): boolean {
    return this.findCollidingObstacle(point, robotRadius) !== null;
  }

  public findCollidingObstacle(
    point: Vector2D,
    robotRadius = 0.32
  ): { id: string; label: string; bounds?: BoundingBox2D } | null {
    if (!this.isMultiRoom) {
      // Modo clássico quarto único
      const halfW = this.roomWidth / 2;
      const halfD = this.roomDepth / 2;

      if (
        point.x - robotRadius <= -halfW ||
        point.x + robotRadius >= halfW ||
        point.z - robotRadius <= -halfD ||
        point.z + robotRadius >= halfD
      ) {
        return { id: 'wall', label: 'Parede' };
      }
    } else {
      // Modo residência completa:
      // Verifica se está dentro de algum cômodo da casa ou no vão de porta
      const inAnyRoom = Object.values(HOUSE_FLOOR_PLAN.rooms).some((room) =>
        isPointInsideBounds(point, room.bounds, 0.08)
      );
      const inAnyDoor = HOUSE_FLOOR_PLAN.doors.some(
        (door) =>
          door.isOpen &&
          isPointInsideBounds(point, door.traversableBounds, 0.08)
      );

      if (!inAnyRoom && !inAnyDoor) {
        return { id: 'wall-outer', label: 'Parede Externa' };
      }
    }

    // Se estiver no vão de porta aberta, ignora colisão com a parede de alvenaria
    const inDoorway =
      this.isMultiRoom &&
      HOUSE_FLOOR_PLAN.doors.some(
        (door) =>
          door.isOpen && isPointInsideBounds(point, door.traversableBounds)
      );

    for (const obs of this.getAllCollidableObstacles()) {
      if (inDoorway && obs.category === 'wall') {
        continue;
      }
      if (isPointInsideBounds(point, obs.bounds, robotRadius)) {
        return { id: obs.id, label: obs.label, bounds: obs.bounds };
      }
    }

    return null;
  }

  /**
   * Resolve fisicamente o movimento do robô (ou gato), impedindo atravessar qualquer objeto
   * e aplicando deslizamento tangencial (sliding) ou repulsão segura.
   */
  public resolveSafeMovement(
    currentPos: Vector2D,
    desiredPos: Vector2D,
    actorRadius = 0.31
  ): CollisionResolutionResult {
    let clampedDesired: Vector2D;

    if (!this.isMultiRoom) {
      const halfW = this.roomWidth / 2 - actorRadius - 0.02;
      const halfD = this.roomDepth / 2 - actorRadius - 0.02;
      clampedDesired = {
        x: clamp(desiredPos.x, -halfW, halfW),
        z: clamp(desiredPos.z, -halfD, halfD),
      };
    } else {
      clampedDesired = {
        x: clamp(desiredPos.x, -5.0 + actorRadius, 17.6 - actorRadius),
        z: clamp(desiredPos.z, -4.0 + actorRadius, 13.5 - actorRadius),
      };
    }

    const directHit = this.findCollidingObstacle(clampedDesired, actorRadius);
    if (!directHit) {
      return {
        position: clampedDesired,
        collided: false,
        obstacleId: null,
        obstacleLabel: null,
      };
    }

    // Tenta deslizar apenas no eixo X
    const slideX: Vector2D = { x: clampedDesired.x, z: currentPos.z };
    if (!this.findCollidingObstacle(slideX, actorRadius)) {
      return {
        position: slideX,
        collided: true,
        obstacleId: directHit.id,
        obstacleLabel: directHit.label,
      };
    }

    // Tenta deslizar apenas no eixo Z
    const slideZ: Vector2D = { x: currentPos.x, z: clampedDesired.z };
    if (!this.findCollidingObstacle(slideZ, actorRadius)) {
      return {
        position: slideZ,
        collided: true,
        obstacleId: directHit.id,
        obstacleLabel: directHit.label,
      };
    }

    return {
      position: currentPos,
      collided: true,
      obstacleId: directHit.id,
      obstacleLabel: directHit.label,
    };
  }

  /**
   * Distância estimada de um ponto até o obstáculo (fixo ou dinâmico) mais próximo.
   */
  public getDistanceToNearestObstacle(point: Vector2D): {
    distance: number;
    obstacleId: string | null;
    obstacleLabel: string | null;
  } {
    let minDistance = Infinity;
    let closestId: string | null = null;
    let closestLabel: string | null = null;

    const halfW = this.roomWidth / 2;
    const halfD = this.roomDepth / 2;
    const distToWalls = Math.min(
      point.x - -halfW,
      halfW - point.x,
      point.z - -halfD,
      halfD - point.z
    );

    if (distToWalls < minDistance) {
      minDistance = distToWalls;
      closestId = 'wall';
      closestLabel = 'Parede';
    }

    for (const obs of this.getAllCollidableObstacles()) {
      const clampedX = Math.max(
        obs.bounds.minX,
        Math.min(point.x, obs.bounds.maxX)
      );
      const clampedZ = Math.max(
        obs.bounds.minZ,
        Math.min(point.z, obs.bounds.maxZ)
      );
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
