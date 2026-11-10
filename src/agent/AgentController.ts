import { SensorSystem } from './perception/SensorSystem';
import {
  ObstacleDetector,
  type CollisionResolutionResult,
} from './navigation/ObstacleDetector';
import { GridMap } from './navigation/GridMap';
import { PathPlanner } from './navigation/PathPlanner';
import type { EnvironmentObstacle } from '@/types/environment';
import type { RobotOperationalState, Vector2D } from '@/types/robot';

export interface AgentDecision {
  nextState: RobotOperationalState;
  desiredSpeed: number;
  desiredHeading: number | null;
  logAction?: string;
  plannedPath?: Vector2D[];
  detectedObstacleLabel?: string | null;
}

/**
 * Controlador de autonomia de navegação e inteligência:
 * - Mantém grade de ocupação e histórico de exploração
 * - Considera obstáculos fixos (móveis/paredes) e dinâmicos (Gato doméstico andando/dormindo)
 * - Planeja rotas livres de colisão usando A*
 * - Detecta obstruções dinâmicas e replaneja a rota automaticamente
 */
export class AgentController {
  private detector: ObstacleDetector;
  private sensor: SensorSystem;
  private grid: GridMap;
  private planner: PathPlanner;

  private currentPath: Vector2D[] = [];
  private currentPathIdx: number = 0;
  private avoidanceTimer: number = 0;
  private avoidTurnDirection: number = 1;
  private replanCooldown: number = 0;

  constructor(
    obstacles: EnvironmentObstacle[],
    roomWidth: number,
    roomDepth: number
  ) {
    this.detector = new ObstacleDetector(obstacles, roomWidth, roomDepth);
    this.sensor = new SensorSystem(this.detector);
    this.grid = new GridMap(roomWidth, roomDepth, 0.25, obstacles);
    this.planner = new PathPlanner(this.grid);
  }

  public updateObstacles(obstacles: EnvironmentObstacle[]): void {
    this.detector.setObstacles(obstacles);
    this.grid = new GridMap(
      this.grid.width,
      this.grid.depth,
      this.grid.cellSize,
      obstacles
    );
    this.planner.setGrid(this.grid);
  }

  public setDynamicObstacles(dynamicObstacles: EnvironmentObstacle[]): void {
    this.detector.setDynamicObstacles(dynamicObstacles);
    this.grid.setDynamicObstacles(dynamicObstacles);
  }

  public resolveSafeMovement(
    currentPos: Vector2D,
    desiredPos: Vector2D,
    actorRadius = 0.31
  ): CollisionResolutionResult {
    return this.detector.resolveSafeMovement(currentPos, desiredPos, actorRadius);
  }

  public getCurrentPath(): Vector2D[] {
    return this.currentPath;
  }

  public decide(
    currentState: RobotOperationalState,
    position: Vector2D,
    rotationY: number,
    targetPosition: Vector2D | null,
    baseSpeed: number,
    currentRegionId: string,
    delta: number,
    dynamicObstacles: EnvironmentObstacle[] = []
  ): AgentDecision {
    // 1. Atualiza obstáculos móveis (ex: Gato andando/deitado pela casa)
    this.setDynamicObstacles(dynamicObstacles);

    // 2. Atualiza grade de exploração na posição atual
    this.grid.markExplored(position, 0.55);

    // 3. Estados inativos / de repouso
    if (
      currentState === 'IDLE' ||
      currentState === 'PAUSED' ||
      currentState === 'RECHARGING'
    ) {
      this.currentPath = [];
      this.currentPathIdx = 0;
      return {
        nextState: currentState,
        desiredSpeed: 0,
        desiredHeading: null,
      };
    }

    if (this.replanCooldown > 0) {
      this.replanCooldown -= delta;
    }

    // 4. Leitura dos sensores frontais ToF (detecta móveis, paredes e o Gato!)
    const scan = this.sensor.scan(position, rotationY, currentRegionId);
    const centerIdx = Math.floor(scan.rays.length / 2);
    const frontRays = scan.rays.slice(
      Math.max(0, centerIdx - 1),
      Math.min(scan.rays.length, centerIdx + 2)
    );
    const minFrontRay = frontRays.reduce(
      (min, r) => (r.distance < min.distance ? r : min),
      frontRays[0]
    );

    const leftDist = Math.min(
      ...scan.rays.slice(0, centerIdx).map((r) => r.distance)
    );
    const rightDist = Math.min(
      ...scan.rays.slice(centerIdx + 1).map((r) => r.distance)
    );

    // Colisão iminente frontal (< 0.52m) ou proximidade lateral crítica (< 0.36m)
    const isImminentCollision =
      minFrontRay.distance < 0.52 || scan.nearestObstacleDistance < 0.36;

    // Manobra de evasão ativa
    if (this.avoidanceTimer > 0) {
      this.avoidanceTimer -= delta;
      const resumedState: RobotOperationalState =
        this.avoidanceTimer <= 0 ? 'CLEANING' : 'AVOIDING';
      return {
        nextState: resumedState,
        desiredSpeed: baseSpeed * 0.48,
        desiredHeading: rotationY + this.avoidTurnDirection * 2.2 * delta,
        logAction: 'Contornando obstáculo com segurança',
        plannedPath: this.currentPath,
      };
    }

    if (isImminentCollision) {
      this.avoidanceTimer = 0.72;
      this.avoidTurnDirection = leftDist >= rightDist ? -1 : 1;
      this.currentPath = []; // Invalida rota para forçar replanejamento A* contornando o gato/móvel
      const obstacleName = minFrontRay.obstacleLabel ?? 'obstáculo';
      return {
        nextState: 'AVOIDING',
        desiredSpeed: baseSpeed * 0.35,
        desiredHeading: rotationY + this.avoidTurnDirection * Math.PI * 0.48,
        logAction: `Desviando de ${obstacleName}`,
        detectedObstacleLabel: obstacleName,
      };
    }

    // 5. Determinação do alvo de navegação A*
    let goal: Vector2D | null = targetPosition;

    if (!goal) {
      const unexplored = this.grid.getUnexploredCells();
      if (unexplored.length > 0) {
        let nearestDist = Infinity;
        let chosenCell = unexplored[0];
        for (const cell of unexplored) {
          const d = Math.hypot(
            cell.worldPos.x - position.x,
            cell.worldPos.z - position.z
          );
          if (d < nearestDist && d > 0.85) {
            nearestDist = d;
            chosenCell = cell;
          }
        }
        goal = chosenCell.worldPos;
      }
    }

    // Verifica se o próximo waypoint da rota atual foi bloqueado pelo gato em movimento
    const nextWaypointBlocked =
      this.currentPath.length > 0 &&
      this.currentPathIdx < this.currentPath.length &&
      this.detector.isColliding(this.currentPath[this.currentPathIdx], 0.32);

    const needsNewPlan =
      goal &&
      (this.currentPath.length === 0 ||
        this.currentPathIdx >= this.currentPath.length ||
        nextWaypointBlocked ||
        (this.replanCooldown <= 0 && isImminentCollision));

    if (needsNewPlan && goal) {
      const plan = this.planner.findPath(position, goal);
      if (plan.length > 0) {
        this.currentPath = plan;
        this.currentPathIdx = 0;
        this.replanCooldown = 0.9;
      }
    }

    // 6. Seguimento da rota A*
    if (
      this.currentPath.length > 0 &&
      this.currentPathIdx < this.currentPath.length
    ) {
      const waypoint = this.currentPath[this.currentPathIdx];
      const distToWaypoint = Math.hypot(
        waypoint.x - position.x,
        waypoint.z - position.z
      );

      if (distToWaypoint < 0.28) {
        this.currentPathIdx++;
      }

      if (this.currentPathIdx < this.currentPath.length) {
        const nextTarget = this.currentPath[this.currentPathIdx];
        const heading = Math.atan2(
          nextTarget.x - position.x,
          nextTarget.z - position.z
        );

        return {
          nextState: currentState === 'AVOIDING' ? 'CLEANING' : currentState,
          desiredSpeed: baseSpeed,
          desiredHeading: heading,
          logAction: `Navegando via A* (Passo ${this.currentPathIdx + 1}/${this.currentPath.length})`,
          plannedPath: this.currentPath,
        };
      }
    }

    return {
      nextState: currentState === 'AVOIDING' ? 'CLEANING' : currentState,
      desiredSpeed: baseSpeed * 0.8,
      desiredHeading: rotationY,
      logAction: 'Varredura exploratória',
    };
  }
}
