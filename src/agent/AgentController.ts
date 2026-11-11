import { SensorSystem } from './perception/SensorSystem';
import {
  ObstacleDetector,
  type CollisionResolutionResult,
} from './navigation/ObstacleDetector';
import { GridMap } from './navigation/GridMap';
import { PathPlanner } from './navigation/PathPlanner';
import { globalRoomGraph } from './navigation/RoomGraph';
import { getRoomAtPosition, HOUSE_FLOOR_PLAN } from '@/world/House/FloorPlan';
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
 * - Planeja rotas livres de colisão usando A* e grafo multicômodo (RoomGraph)
 * - Detecta obstruções dinâmicas e replaneja a rota automaticamente
 */
export class AgentController {
  private detector: ObstacleDetector;
  private sensor: SensorSystem;
  private grid: GridMap;
  private planner: PathPlanner;

  private currentPath: Vector2D[] = [];
  private currentPathIdx: number = 0;
  private lastGoal: Vector2D | null = null;
  private avoidanceTimer: number = 0;
  private avoidTurnDirection: number = 1;
  private avoidTargetHeading: number = 0;
  private replanCooldown: number = 0;
  private waypointStallTimer: number = 0;
  private lastWaypointIdx: number = -1;

  constructor(
    obstacles: EnvironmentObstacle[],
    roomWidth: number,
    roomDepth: number,
    minX?: number,
    minZ?: number
  ) {
    const computedMinX = minX ?? (roomWidth > 12 ? -5.0 : -roomWidth / 2);
    const computedMinZ = minZ ?? (roomWidth > 12 ? -4.0 : -roomDepth / 2);
    this.detector = new ObstacleDetector(obstacles, roomWidth, roomDepth);
    this.sensor = new SensorSystem(this.detector);
    this.grid = new GridMap(roomWidth, roomDepth, 0.25, obstacles, computedMinX, computedMinZ);
    this.planner = new PathPlanner(this.grid);
  }

  public updateObstacles(obstacles: EnvironmentObstacle[]): void {
    this.detector.setObstacles(obstacles);
    this.grid = new GridMap(
      this.grid.width,
      this.grid.depth,
      this.grid.cellSize,
      obstacles,
      this.grid.minX,
      this.grid.minZ
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

  /**
   * Notificação de emperramento físico (anti-trava):
   * Chamada quando o robô detecta bloqueio físico consecutivo em quinas, batentes ou móveis.
   * Limpa a rota travada, descarta alvos inalcançáveis e orienta para o espaço aberto.
   */
  public notifyStuck(position: Vector2D, currentHeading: number): number {
    this.currentPath = [];
    this.currentPathIdx = 0;
    this.replanCooldown = 0;
    this.avoidanceTimer = 0.75;
    this.waypointStallTimer = 0;

    const scan = this.sensor.scan(position, currentHeading, '');
    const centerIdx = Math.floor(scan.rays.length / 2);
    const leftDist = Math.min(...scan.rays.slice(0, centerIdx).map((r) => r.distance));
    const rightDist = Math.min(...scan.rays.slice(centerIdx + 1).map((r) => r.distance));
    this.avoidTurnDirection = leftDist >= rightDist ? -1 : 1;
    this.avoidTargetHeading = currentHeading + this.avoidTurnDirection * (Math.PI * 0.55);

    if (this.lastGoal && Math.hypot(this.lastGoal.x - position.x, this.lastGoal.z - position.z) < 0.6) {
      this.lastGoal = null;
    }

    return this.avoidTurnDirection;
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
      currentState === 'RECHARGING' ||
      currentState === 'COMPLETED'
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

    const isCatInFront = frontRays.some(
      (r) => r.hit && r.distance < 0.55 && r.obstacleLabel?.includes('Gato')
    );

    // Se estiver em aproximação ou passagem de vão de porta, os batentes laterais são esperados
    const isNearDoorway =
      this.detector.isMultiRoom &&
      HOUSE_FLOOR_PLAN.doors.some(
        (door) =>
          door.isOpen &&
          Math.hypot(position.x - door.position.x, position.z - door.position.z) < 1.3
      );

    // Colisão iminente: gato à frente, ou qualquer feixe frontal perigosamente próximo (< 0.32m),
    // ou feixe oblíquo (< 0.38m) fora de vãos de porta
    const minFrontDist = Math.min(...frontRays.map((r) => r.distance));
    const isImminentCollision =
      isCatInFront ||
      minFrontDist < 0.32 ||
      (!isNearDoorway && minFrontDist < 0.38);

    // Manobra de evasão ativa
    if (this.avoidanceTimer > 0) {
      this.avoidanceTimer -= delta;
      const resumedState: RobotOperationalState =
        this.avoidanceTimer <= 0 ? 'CLEANING' : 'AVOIDING';
      return {
        nextState: resumedState,
        desiredSpeed: baseSpeed * 0.35,
        desiredHeading: this.avoidTargetHeading,
        logAction: 'Contornando obstáculo com segurança',
        plannedPath: this.currentPath,
      };
    }

    if (isImminentCollision) {
      this.avoidanceTimer = 0.55;
      this.avoidTurnDirection = leftDist >= rightDist ? -1 : 1;
      this.avoidTargetHeading =
        rotationY + this.avoidTurnDirection * (Math.PI * 0.45);
      this.currentPath = []; // Invalida rota para forçar replanejamento A* contornando o obstáculo
      const obstacleName = minFrontRay.obstacleLabel ?? 'obstáculo';
      return {
        nextState: 'AVOIDING',
        desiredSpeed: baseSpeed * 0.25,
        desiredHeading: this.avoidTargetHeading,
        logAction: `Desviando de ${obstacleName}`,
        detectedObstacleLabel: obstacleName,
      };
    }

    // 5. Determinação do alvo de navegação A*
    let goal: Vector2D | null = targetPosition;

    if (!goal) {
      let unexplored = this.grid.getUnexploredCells();

      // Se um cômodo específico estiver selecionado, restringe busca de células inexploradas a ele
      if (this.detector.isMultiRoom && currentRegionId && currentRegionId !== 'all') {
        unexplored = unexplored.filter(
          (c) => getRoomAtPosition(c.worldPos) === currentRegionId
        );
      }

      if (unexplored.length > 0) {
        let nearestDist = Infinity;
        let chosenCell = unexplored[0];
        for (const cell of unexplored) {
          const d = Math.hypot(
            cell.worldPos.x - position.x,
            cell.worldPos.z - position.z
          );
          if (d < nearestDist && d > 0.65) {
            nearestDist = d;
            chosenCell = cell;
          }
        }
        goal = chosenCell.worldPos;
      }
    }

    // Verifica se o alvo mudou (ex: usuário clicou em um novo ponto no chão)
    const goalChanged =
      goal !== null &&
      (this.lastGoal === null ||
        Math.hypot(goal.x - this.lastGoal.x, goal.z - this.lastGoal.z) > 0.12);

    if (goalChanged && goal) {
      this.lastGoal = { x: goal.x, z: goal.z };
      this.avoidanceTimer = 0;
    }

    // Verifica se o próximo waypoint da rota atual foi bloqueado pelo gato em movimento
    const nextWaypointBlocked =
      this.currentPath.length > 0 &&
      this.currentPathIdx < this.currentPath.length &&
      this.detector.isColliding(this.currentPath[this.currentPathIdx], 0.32);

    const needsNewPlan =
      goal &&
      (goalChanged ||
        this.currentPath.length === 0 ||
        this.currentPathIdx >= this.currentPath.length ||
        nextWaypointBlocked ||
        (this.replanCooldown <= 0 && isImminentCollision));

    if (needsNewPlan && goal) {
      let plan: Vector2D[] = [];

      // Se estamos na residência multicômodo, utiliza o grafo topológico de portas
      if (this.detector.isMultiRoom) {
        const multiPlan = globalRoomGraph.planMultiRoomNavigation(position, goal);
        if (multiPlan && multiPlan.doorwayWaypoints.length > 0) {
          const waypoints: Vector2D[] = [];
          for (let i = 0; i < multiPlan.doorwayWaypoints.length; i++) {
            const doorCenter = multiPlan.doorwayWaypoints[i];
            const fromRoom = multiPlan.roomSequence[i];
            const toRoom = multiPlan.roomSequence[i + 1];
            const transitionWps = globalRoomGraph.getPerpendicularDoorWaypoints(
              doorCenter,
              fromRoom,
              toRoom
            );
            waypoints.push(...transitionWps);
          }
          waypoints.push(goal);

          let currentStart = position;
          for (const wp of waypoints) {
            const segment = this.planner.findPath(currentStart, wp);
            if (segment.length > 0) {
              plan.push(...segment);
              currentStart = segment[segment.length - 1];
            } else {
              plan.push(wp);
              currentStart = wp;
            }
          }
        }
      }

      // Se a rota direta pelo A* for necessária (dentro do mesmo cômodo ou fallback)
      if (plan.length === 0) {
        plan = this.planner.findPath(position, goal);
      }

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
      // Proteção contra waypoint emperrado: se passar mais de 1.8s no mesmo nó, avança ou replaneja
      if (this.currentPathIdx === this.lastWaypointIdx) {
        this.waypointStallTimer += delta;
        if (this.waypointStallTimer > 1.8) {
          this.currentPathIdx++;
          this.waypointStallTimer = 0;
          if (this.currentPathIdx >= this.currentPath.length) {
            this.currentPath = [];
          }
        }
      } else {
        this.lastWaypointIdx = this.currentPathIdx;
        this.waypointStallTimer = 0;
      }

      if (this.currentPathIdx < this.currentPath.length) {
        const waypoint = this.currentPath[this.currentPathIdx];
        const distToWaypoint = Math.hypot(
          waypoint.x - position.x,
          waypoint.z - position.z
        );

        if (distToWaypoint < 0.32) {
          this.currentPathIdx++;
          this.waypointStallTimer = 0;
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
    }

    return {
      nextState: currentState === 'AVOIDING' ? 'CLEANING' : currentState,
      desiredSpeed: baseSpeed * 0.8,
      desiredHeading: rotationY,
      logAction: 'Varredura exploratória',
    };
  }
}
