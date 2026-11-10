import { SensorSystem } from './perception/SensorSystem';
import { ObstacleDetector } from './navigation/ObstacleDetector';
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
}

/**
 * Controlador de autonomia de navegação e inteligência (Sprint 2):
 * - Mantém grade de ocupação e histórico de exploração
 * - Planeja rotas livres de colisão usando A*
 * - Detecta obstruções dinâmicas e replaneja a rota automaticamente
 * - Conduz exploração sistemática de regiões não limpas
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
    this.grid = new GridMap(this.grid.width, this.grid.depth, this.grid.cellSize, obstacles);
    this.planner.setGrid(this.grid);
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
    delta: number
  ): AgentDecision {
    // 1. Atualiza grade de exploração na posição atual
    this.grid.markExplored(position, 0.55);

    // 2. Estados inativos / de repouso
    if (currentState === 'IDLE' || currentState === 'PAUSED' || currentState === 'RECHARGING') {
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

    // 3. Leitura dos sensores frontais
    const scan = this.sensor.scan(position, rotationY, currentRegionId);
    const frontRay = scan.rays[Math.floor(scan.rays.length / 2)];
    const leftDist = Math.min(...scan.rays.slice(0, Math.floor(scan.rays.length / 2)).map((r) => r.distance));
    const rightDist = Math.min(...scan.rays.slice(Math.ceil(scan.rays.length / 2)).map((r) => r.distance));

    // Colisão iminente (< 0.40m)
    const isImminentCollision = frontRay.distance < 0.40 || scan.nearestObstacleDistance < 0.35;

    // Manobra de evasão ativa
    if (this.avoidanceTimer > 0) {
      this.avoidanceTimer -= delta;
      return {
        nextState: 'AVOIDING',
        desiredSpeed: baseSpeed * 0.4,
        desiredHeading: rotationY + this.avoidTurnDirection * 1.8 * delta,
        logAction: 'Manobra de desvio evasivo',
        plannedPath: this.currentPath,
      };
    }

    if (isImminentCollision && currentState !== 'RETURNING') {
      this.avoidanceTimer = 0.75;
      this.avoidTurnDirection = leftDist > rightDist ? -1 : 1;
      this.currentPath = []; // Invalida rota para forçar replanejamento A*
      return {
        nextState: 'AVOIDING',
        desiredSpeed: baseSpeed * 0.3,
        desiredHeading: rotationY + this.avoidTurnDirection * Math.PI * 0.45,
        logAction: `Desviando de ${frontRay.obstacleLabel ?? 'obstáculo'}`,
      };
    }

    // 4. Determinação do alvo de navegação A*
    let goal: Vector2D | null = targetPosition;

    if (!goal) {
      // Se não houver alvo do usuário, busca a célula não explorada mais próxima
      const unexplored = this.grid.getUnexploredCells();
      if (unexplored.length > 0) {
        // Encontra o centro inexplorado mais próximo
        let nearestDist = Infinity;
        let chosenCell = unexplored[0];
        for (const cell of unexplored) {
          const d = Math.hypot(cell.worldPos.x - position.x, cell.worldPos.z - position.z);
          if (d < nearestDist && d > 0.8) {
            nearestDist = d;
            chosenCell = cell;
          }
        }
        goal = chosenCell.worldPos;
      }
    }

    // 5. Planejamento / Replanejamento A* quando necessário
    const needsNewPlan =
      goal &&
      (this.currentPath.length === 0 ||
        this.currentPathIdx >= this.currentPath.length ||
        (this.replanCooldown <= 0 && isImminentCollision));

    if (needsNewPlan && goal) {
      const plan = this.planner.findPath(position, goal);
      if (plan.length > 0) {
        this.currentPath = plan;
        this.currentPathIdx = 0;
        this.replanCooldown = 1.2; // Evita replanejamentos excessivos
      }
    }

    // 6. Seguimento da rota A*
    if (this.currentPath.length > 0 && this.currentPathIdx < this.currentPath.length) {
      const waypoint = this.currentPath[this.currentPathIdx];
      const distToWaypoint = Math.hypot(waypoint.x - position.x, waypoint.z - position.z);

      if (distToWaypoint < 0.28) {
        this.currentPathIdx++;
      }

      if (this.currentPathIdx < this.currentPath.length) {
        const nextTarget = this.currentPath[this.currentPathIdx];
        const heading = Math.atan2(nextTarget.x - position.x, nextTarget.z - position.z);

        return {
          nextState: currentState,
          desiredSpeed: baseSpeed,
          desiredHeading: heading,
          logAction: `Navegando via A* (Passo ${this.currentPathIdx + 1}/${this.currentPath.length})`,
          plannedPath: this.currentPath,
        };
      }
    }

    // 7. Retorno suave padrão
    return {
      nextState: currentState,
      desiredSpeed: baseSpeed * 0.8,
      desiredHeading: rotationY,
      logAction: 'Varredura exploratória',
    };
  }
}
