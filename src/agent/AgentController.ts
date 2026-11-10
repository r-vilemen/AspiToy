import { SensorSystem } from './perception/SensorSystem';
import { ObstacleDetector } from './navigation/ObstacleDetector';
import type { EnvironmentObstacle } from '@/types/environment';
import type { RobotOperationalState, Vector2D } from '@/types/robot';

export interface AgentDecision {
  nextState: RobotOperationalState;
  desiredSpeed: number;
  desiredHeading: number | null;
  logAction?: string;
}

/**
 * Controlador inteligente do agente desacoplado de React e Three.js.
 * Avalia sensores, desvia de obstáculos em tempo real e persegue alvos de limpeza.
 */
export class AgentController {
  private detector: ObstacleDetector;
  private sensor: SensorSystem;
  private wanderAngle: number = 0;
  private avoidanceTimer: number = 0;
  private avoidTurnDirection: number = 1;

  constructor(
    obstacles: EnvironmentObstacle[],
    roomWidth: number,
    roomDepth: number
  ) {
    this.detector = new ObstacleDetector(obstacles, roomWidth, roomDepth);
    this.sensor = new SensorSystem(this.detector);
  }

  public updateObstacles(obstacles: EnvironmentObstacle[]): void {
    this.detector.setObstacles(obstacles);
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
    // 1. Estados passivos
    if (currentState === 'IDLE' || currentState === 'PAUSED' || currentState === 'RECHARGING') {
      return {
        nextState: currentState,
        desiredSpeed: 0,
        desiredHeading: null,
      };
    }

    // 2. Leitura dos sensores ToF
    const scan = this.sensor.scan(position, rotationY, currentRegionId);
    const frontRay = scan.rays[Math.floor(scan.rays.length / 2)];
    const leftRays = scan.rays.slice(0, Math.floor(scan.rays.length / 2));
    const rightRays = scan.rays.slice(Math.ceil(scan.rays.length / 2));

    const leftDist = Math.min(...leftRays.map((r) => r.distance));
    const rightDist = Math.min(...rightRays.map((r) => r.distance));

    // 3. Detecção de colisão iminente (< 0.45m)
    const isImminentCollision = frontRay.distance < 0.45 || scan.nearestObstacleDistance < 0.38;

    if (this.avoidanceTimer > 0) {
      this.avoidanceTimer -= delta;
      return {
        nextState: 'AVOIDING',
        desiredSpeed: baseSpeed * 0.45,
        desiredHeading: rotationY + this.avoidTurnDirection * 1.8 * delta,
        logAction: 'Manobra de desvio em execução',
      };
    }

    if (isImminentCollision && currentState !== 'RETURNING') {
      this.avoidanceTimer = 0.85; // 850ms de manobra de giro evasivo
      this.avoidTurnDirection = leftDist > rightDist ? -1 : 1;
      return {
        nextState: 'AVOIDING',
        desiredSpeed: baseSpeed * 0.35,
        desiredHeading: rotationY + this.avoidTurnDirection * Math.PI * 0.4,
        logAction: `Desviando de ${frontRay.obstacleLabel ?? 'obstáculo'}`,
      };
    }

    // 4. Retorno à base
    if (currentState === 'RETURNING') {
      if (!targetPosition) {
        return {
          nextState: 'IDLE',
          desiredSpeed: 0,
          desiredHeading: null,
        };
      }
      const headingToTarget = Math.atan2(
        targetPosition.x - position.x,
        targetPosition.z - position.z
      );
      return {
        nextState: 'RETURNING',
        desiredSpeed: baseSpeed * 1.05,
        desiredHeading: headingToTarget,
        logAction: 'Retornando à base de recarga',
      };
    }

    // 5. Limpeza direcionada para targetPosition
    if (targetPosition) {
      const headingToTarget = Math.atan2(
        targetPosition.x - position.x,
        targetPosition.z - position.z
      );
      return {
        nextState: 'CLEANING',
        desiredSpeed: baseSpeed,
        desiredHeading: headingToTarget,
        logAction: 'Movendo-se para ponto de limpeza',
      };
    }

    // 6. Varredura autônoma (bouncing & coverage)
    this.wanderAngle += (Math.random() - 0.5) * 0.15;
    return {
      nextState: currentState,
      desiredSpeed: baseSpeed,
      desiredHeading: rotationY + this.wanderAngle * delta,
      logAction: 'Varredura contínua da sala',
    };
  }
}
