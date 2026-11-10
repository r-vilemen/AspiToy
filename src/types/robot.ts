export type RobotOperationalState =
  | 'IDLE'
  | 'EXPLORING'
  | 'CLEANING'
  | 'AVOIDING'
  | 'RETURNING'
  | 'RECHARGING'
  | 'PAUSED'
  | 'COMPLETED';

export type RobotExpression =
  | 'neutral'
  | 'curious'
  | 'focused'
  | 'alert'
  | 'happy'
  | 'worried'
  | 'sleepy';

export interface Vector2D {
  x: number;
  z: number;
}

export interface RobotTelemetry {
  name: string;
  state: RobotOperationalState;
  previousActiveState: RobotOperationalState | null;
  expression: RobotExpression;
  position: Vector2D;
  rotationY: number;
  battery: number;
  speed: number;
  cleaningProgress: number;
  currentRegionId: string;
  currentRegionLabel: string;
  operationSeconds: number;
  lastAction: string;
  targetPosition: Vector2D | null;
}

export interface RobotMotionBridge {
  x: number;
  z: number;
  rotationY: number;
  targetRotationY: number;
  currentSpeed: number;
  wheelSpin: number;
  bobPhase: number;
  bumperCompression: number;
}

