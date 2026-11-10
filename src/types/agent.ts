import type { Vector2D } from './robot';

export interface SensorRayReading {
  angleOffset: number;
  distance: number;
  maxRange: number;
  hit: boolean;
  obstacleId: string | null;
  obstacleLabel: string | null;
}

export interface AgentPerceptionSnapshot {
  position: Vector2D;
  rotationY: number;
  rays: SensorRayReading[];
  nearestObstacleDistance: number;
  isNearDock: boolean;
  currentRegionId: string;
}

