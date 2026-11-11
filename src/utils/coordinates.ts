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

export interface AABBDistanceInfo {
  distance: number;
  normal: Vector2D;
  closestPoint: Vector2D;
  isInside: boolean;
}

/**
 * Calcula a distância euclidiana exata de um ponto 2D até uma caixa delimitadora (AABB).
 * Trata cantos convexos como arcos circulares reais, permitindo deslizamento suave sem travar em quinas.
 */
export function getDistanceToAABB(
  point: Vector2D,
  bounds: BoundingBox2D
): AABBDistanceInfo {
  const cx = Math.max(bounds.minX, Math.min(point.x, bounds.maxX));
  const cz = Math.max(bounds.minZ, Math.min(point.z, bounds.maxZ));

  const dx = point.x - cx;
  const dz = point.z - cz;
  const distSq = dx * dx + dz * dz;

  if (distSq > 1e-8) {
    const dist = Math.sqrt(distSq);
    return {
      distance: dist,
      normal: { x: dx / dist, z: dz / dist },
      closestPoint: { x: cx, z: cz },
      isInside: false,
    };
  }

  // Ponto está dentro do AABB (dist = 0)
  const distLeft = point.x - bounds.minX;
  const distRight = bounds.maxX - point.x;
  const distBottom = point.z - bounds.minZ;
  const distTop = bounds.maxZ - point.z;

  const minDist = Math.min(distLeft, distRight, distBottom, distTop);

  let nx = 0;
  let nz = 0;
  if (minDist === distLeft) nx = -1;
  else if (minDist === distRight) nx = 1;
  else if (minDist === distBottom) nz = -1;
  else nz = 1;

  return {
    distance: 0,
    normal: { x: nx, z: nz },
    closestPoint: { x: cx, z: cz },
    isInside: true,
  };
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

