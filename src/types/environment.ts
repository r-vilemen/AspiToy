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
  | 'SLEEPING';

export interface CatMotionBridge {
  x: number;
  z: number;
  rotationY: number;
  targetRotationY: number;
  speed: number;
  state: CatBehaviorState;
  animPhase: number;
  stateTimer: number;
  targetX: number;
  targetZ: number;
  radius: number;
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
}
