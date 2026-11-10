import type { BoundingBox2D } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { clamp } from './math';

export interface GridCellCoord {
  col: number;
  row: number;
}

export function isPointInsideBounds(point: Vector2D, bounds: BoundingBox2D, padding = 0): boolean {
  return (
    point.x >= bounds.minX - padding &&
    point.x <= bounds.maxX + padding &&
    point.z >= bounds.minZ - padding &&
    point.z <= bounds.maxZ + padding
  );
}

export function worldToGrid(
  point: Vector2D,
  roomWidth: number,
  roomDepth: number,
  cellSize: number
): GridCellCoord {
  const cols = Math.floor(roomWidth / cellSize);
  const rows = Math.floor(roomDepth / cellSize);
  const normalizedX = point.x + roomWidth / 2;
  const normalizedZ = point.z + roomDepth / 2;

  return {
    col: clamp(Math.floor(normalizedX / cellSize), 0, cols - 1),
    row: clamp(Math.floor(normalizedZ / cellSize), 0, rows - 1),
  };
}

export function gridToWorld(
  cell: GridCellCoord,
  roomWidth: number,
  roomDepth: number,
  cellSize: number
): Vector2D {
  return {
    x: -roomWidth / 2 + (cell.col + 0.5) * cellSize,
    z: -roomDepth / 2 + (cell.row + 0.5) * cellSize,
  };
}

export function formatCoordinates(point: Vector2D): string {
  return `X ${point.x >= 0 ? '+' : ''}${point.x.toFixed(1)}m · Z ${point.z >= 0 ? '+' : ''}${point.z.toFixed(1)}m`;
}

