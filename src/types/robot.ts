export type RobotOperationalState =
  | 'IDLE'
  | 'EXPLORING'
  | 'CLEANING'
  | 'AVOIDING'
  | 'RETURNING'
  | 'RECHARGING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'ORGANIZING'
  | 'FLYING';

export type RobotSkinId = 'classic' | 'space-ranger' | 'sheriff' | 'cyber-translucent';

export interface RobotSkin {
  id: RobotSkinId;
  name: string;
  tagline: string;
  description: string;
  requiredM2: number;
  shellColor: string;
  coralTrimColor: string;
  blueTrimColor: string;
  yellowTrimColor: string;
  eyeColor: string;
  isTranslucent?: boolean;
}

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
  skin: RobotSkinId;
  organizedToysCount: number;
  totalToysToOrganize: number;
  position: Vector2D;
  rotationY: number;
  battery: number;
  speed: number;
  cleaningProgress: number;
  roomCleaningProgress: number;
  cleanedAreaM2: number;
  totalAreaM2: number;
  currentRegionId: string;
  currentRegionLabel: string;
  operationSeconds: number;
  lastAction: string;
  targetPosition: Vector2D | null;
}

export interface RobotMotionBridge {
  x: number;
  z: number;
  y: number;
  targetY: number;
  rotationY: number;
  targetRotationY: number;
  pitch: number;
  roll: number;
  propellerSpeed: number;
  propellerExtension: number;
  currentSpeed: number;
  wheelSpin: number;
  bobPhase: number;
  bumperCompression: number;
  isFlying: boolean;
  bubbleBurstTrigger: number;
}

