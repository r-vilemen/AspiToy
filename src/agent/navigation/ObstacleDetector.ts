import type { BoundingBox2D, EnvironmentObstacle } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { getDistanceToAABB, isPointInsideBounds } from '@/utils/coordinates';
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
  public isColliding(point: Vector2D, robotRadius = 0.30): boolean {
    return this.findCollidingObstacle(point, robotRadius) !== null;
  }

  public findCollidingObstacle(
    point: Vector2D,
    robotRadius = 0.30
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
        isPointInsideBounds(point, room.bounds, 0.12)
      );
      const inAnyDoor = HOUSE_FLOOR_PLAN.doors.some(
        (door) =>
          door.isOpen &&
          isPointInsideBounds(point, door.traversableBounds, 0.12)
      );

      if (!inAnyRoom && !inAnyDoor) {
        return { id: 'wall-outer', label: 'Parede Externa' };
      }
    }

    // Paredes perimétricas e móveis sólidos: os vãos das portas já são recortados
    // fisicamente em HOUSE_WALL_OBSTACLES, garantindo que as ombreiras e paredes sólidas
    // nunca sejam atravessadas pelo robô ou gato mesmo nas passagens entre cômodos.
    for (const obs of this.getAllCollidableObstacles()) {
      const info = getDistanceToAABB(point, obs.bounds);
      if (info.distance < robotRadius) {
        return { id: obs.id, label: obs.label, bounds: obs.bounds };
      }
    }

    return null;
  }

  /**
   * Resolve fisicamente o movimento do robô (ou gato), impedindo atravessar qualquer objeto
   * e aplicando deslizamento tangencial contínuo com normais radiais em quinas (evita travar em cantos de portas).
   */
  public resolveSafeMovement(
    currentPos: Vector2D,
    desiredPos: Vector2D,
    actorRadius = 0.29
  ): CollisionResolutionResult {
    let resolved: Vector2D;

    if (!this.isMultiRoom) {
      const halfW = this.roomWidth / 2 - actorRadius - 0.02;
      const halfD = this.roomDepth / 2 - actorRadius - 0.02;
      resolved = {
        x: clamp(desiredPos.x, -halfW, halfW),
        z: clamp(desiredPos.z, -halfD, halfD),
      };
    } else {
      resolved = {
        x: clamp(desiredPos.x, -5.0 + actorRadius, 17.6 - actorRadius),
        z: clamp(desiredPos.z, -4.0 + actorRadius, 13.5 - actorRadius),
      };
    }

    const directHit = this.findCollidingObstacle(resolved, actorRadius);
    if (!directHit) {
      return {
        position: resolved,
        collided: false,
        obstacleId: null,
        obstacleLabel: null,
      };
    }

    let primaryObstacleId: string = directHit.id;
    let primaryObstacleLabel: string = directHit.label;

    // Resolução contínua com normais radiais (contorna quinas, batentes e móveis suavemente)
    for (let iter = 0; iter < 4; iter++) {
      let anyCorrection = false;

      for (const obs of this.getAllCollidableObstacles()) {
        const info = getDistanceToAABB(resolved, obs.bounds);
        if (info.distance < actorRadius) {
          anyCorrection = true;
          primaryObstacleId = obs.id;
          primaryObstacleLabel = obs.label;

          if (info.isInside) {
            // Robô penetrou no interior do AABB: ejeta de volta na direção de onde veio (currentPos)
            const cx = (obs.bounds.minX + obs.bounds.maxX) / 2;
            const cz = (obs.bounds.minZ + obs.bounds.maxZ) / 2;
            const clampedX = Math.max(obs.bounds.minX, Math.min(currentPos.x, obs.bounds.maxX));
            const clampedZ = Math.max(obs.bounds.minZ, Math.min(currentPos.z, obs.bounds.maxZ));

            let dirX = currentPos.x - clampedX;
            let dirZ = currentPos.z - clampedZ;
            let len = Math.hypot(dirX, dirZ);

            if (len < 1e-4) {
              dirX = currentPos.x - cx;
              dirZ = currentPos.z - cz;
              len = Math.hypot(dirX, dirZ);
              if (len < 1e-4) {
                dirX = 0;
                dirZ = 1;
                len = 1;
              }
            }

            resolved.x = clampedX + (dirX / len) * (actorRadius + 0.003);
            resolved.z = clampedZ + (dirZ / len) * (actorRadius + 0.003);
          } else {
            // Contato externo: empurra ao longo da normal de contato (deslizamento suave)
            const pen = actorRadius - info.distance + 0.002;
            resolved.x += info.normal.x * pen;
            resolved.z += info.normal.z * pen;
          }
        }
      }

      if (!anyCorrection) break;
    }

    // Se após a rotação contínua a posição resolvida estiver livre:
    if (!this.findCollidingObstacle(resolved, actorRadius * 0.95)) {
      return {
        position: resolved,
        collided: true,
        obstacleId: primaryObstacleId,
        obstacleLabel: primaryObstacleLabel,
      };
    }

    // Fallback: deslizar no eixo X
    const slideX: Vector2D = { x: resolved.x, z: currentPos.z };
    if (!this.findCollidingObstacle(slideX, actorRadius * 0.95)) {
      return {
        position: slideX,
        collided: true,
        obstacleId: primaryObstacleId,
        obstacleLabel: primaryObstacleLabel,
      };
    }

    // Fallback: deslizar no eixo Z
    const slideZ: Vector2D = { x: currentPos.x, z: resolved.z };
    if (!this.findCollidingObstacle(slideZ, actorRadius * 0.95)) {
      return {
        position: slideZ,
        collided: true,
        obstacleId: primaryObstacleId,
        obstacleLabel: primaryObstacleLabel,
      };
    }

    return {
      position: currentPos,
      collided: true,
      obstacleId: primaryObstacleId,
      obstacleLabel: primaryObstacleLabel,
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
      const info = getDistanceToAABB(point, obs.bounds);
      if (info.distance < minDistance) {
        minDistance = info.distance;
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
