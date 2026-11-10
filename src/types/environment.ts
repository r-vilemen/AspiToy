import type { Vector2D } from './robot';

export type ObstacleCategory =
  | 'wall'
  | 'furniture'
  | 'rug'
  | 'decor'
  | 'dock'
  | 'pet';

export type CatBehaviorState =
  | 'STANDING'
  | 'WALKING'
  | 'RUNNING'
  | 'LYING'
  | 'SLEEPING'
  | 'SITTING'
  | 'STRETCHING'
  | 'GROOMING'
  | 'JUMPING'
  | 'STARTLED'
  | 'DISORIENTED';

export interface CatMotionBridge {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  targetRotationY: number;
  speed: number;
  state: CatBehaviorState;
  animPhase: number;
  stateTimer: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  radius: number;
  isPerched: boolean;
  perchSurfaceId?: string | null;
  jumpProgress?: number;
  jumpArcHeight?: number;
  jumpDuration?: number;
  jumpStart?: { x: number; y: number; z: number };
  jumpEnd?: { x: number; y: number; z: number };
}

export interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface EnvironmentObstacle {
  id: string;
  label: string;
  category: ObstacleCategory;
  bounds: BoundingBox2D;
  collidable: boolean;
  height: number;
}

export interface RoomRegion {
  id: string;
  label: string;
  description: string;
  bounds: BoundingBox2D;
  center: Vector2D;
}

export interface DustSpot {
  id: string;
  position: Vector2D;
  radius: number;
  intensity: number; // 0 (limpo) a 1 (sujo)
  regionId: string;
}

export interface RoomDimensions {
  width: number;
  depth: number;
  wallHeight: number;
  minX?: number;
  minZ?: number;
}

export type PushableToyKind =
  | 'cowboy-doll'
  | 'space-ranger'
  | 'green-alien'
  | 'trex-dino'
  | 'slinky-dog'
  | 'piggy-bank'
  | 'planet-ball'
  | 'block-red'
  | 'block-blue'
  | 'block-yellow'
  | 'wooden-train'
  | 'ring-stacker'
  | 'rc-buggy'
  | 'bowling-pin';

export interface PushableToyState {
  id: string;
  label: string;
  kind: PushableToyKind;
  initialX: number;
  initialZ: number;
  initialRotY: number;
  x: number;
  z: number;
  rotY: number;
  vx: number;
  vz: number;
  angVel: number;
  rollPitch: number;
  rollRoll: number;
  wobble: number;
  radius: number;
}
