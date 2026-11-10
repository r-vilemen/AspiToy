import type { EnvironmentObstacle } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { isPointInsideBounds, worldToGrid, gridToWorld } from '@/utils/coordinates';

export type CellState = 'FREE' | 'OCCUPIED' | 'CLEANED' | 'DIRTY' | 'UNKNOWN';

export interface GridCell {
  col: number;
  row: number;
  worldPos: Vector2D;
  state: CellState;
  explored: boolean;
}

/**
 * Grade de ocupação bidimensional representando a sala de estar.
 * Pure TypeScript (desacoplada de React / Three.js).
 */
export class GridMap {
  public readonly width: number;
  public readonly depth: number;
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;
  private cells: GridCell[][];
  private dynamicObstacles: EnvironmentObstacle[] = [];

  constructor(
    width = 10,
    depth = 8,
    cellSize = 0.25,
    obstacles: EnvironmentObstacle[] = []
  ) {
    this.width = width;
    this.depth = depth;
    this.cellSize = cellSize;
    this.cols = Math.floor(width / cellSize);
    this.rows = Math.floor(depth / cellSize);

    this.cells = [];
    this.initGrid(obstacles);
  }

  public setDynamicObstacles(dynamicObstacles: EnvironmentObstacle[]): void {
    this.dynamicObstacles = dynamicObstacles;
  }

  private initGrid(obstacles: EnvironmentObstacle[]): void {
    const robotPadding = 0.24; // Margem de segurança de colisão

    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const worldPos = gridToWorld(
          { col: c, row: r },
          this.width,
          this.depth,
          this.cellSize
        );

        let isOccupied = false;

        // Paredes perimétricas
        const halfW = this.width / 2;
        const halfD = this.depth / 2;
        if (
          worldPos.x <= -halfW + robotPadding ||
          worldPos.x >= halfW - robotPadding ||
          worldPos.z <= -halfD + robotPadding ||
          worldPos.z >= halfD - robotPadding
        ) {
          isOccupied = true;
        }

        // Móveis sólidos
        if (!isOccupied) {
          for (const obs of obstacles) {
            if (!obs.collidable) continue;
            if (isPointInsideBounds(worldPos, obs.bounds, robotPadding)) {
              isOccupied = true;
              break;
            }
          }
        }

        this.cells[r][c] = {
          col: c,
          row: r,
          worldPos,
          state: isOccupied ? 'OCCUPIED' : 'FREE',
          explored: false,
        };
      }
    }
  }

  public getCell(col: number, row: number): GridCell | null {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.cells[row][col];
  }

  public getCellAtWorld(point: Vector2D): GridCell | null {
    const coord = worldToGrid(point, this.width, this.depth, this.cellSize);
    return this.getCell(coord.col, coord.row);
  }

  public isWalkable(col: number, row: number): boolean {
    const cell = this.getCell(col, row);
    if (!cell || cell.state === 'OCCUPIED') return false;

    for (const dyn of this.dynamicObstacles) {
      if (!dyn.collidable) continue;
      if (isPointInsideBounds(cell.worldPos, dyn.bounds, 0.22)) {
        return false;
      }
    }

    return true;
  }

  public markExplored(point: Vector2D, radius = 0.5): void {
    const coord = worldToGrid(point, this.width, this.depth, this.cellSize);
    const range = Math.ceil(radius / this.cellSize);

    for (let r = coord.row - range; r <= coord.row + range; r++) {
      for (let c = coord.col - range; c <= coord.col + range; c++) {
        const cell = this.getCell(c, r);
        if (cell && cell.state !== 'OCCUPIED') {
          const dist = Math.hypot(cell.worldPos.x - point.x, cell.worldPos.z - point.z);
          if (dist <= radius) {
            cell.explored = true;
            if (cell.state === 'FREE') {
              cell.state = 'CLEANED';
            }
          }
        }
      }
    }
  }

  public getUnexploredCells(): GridCell[] {
    const list: GridCell[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[r][c];
        if (!cell.explored && this.isWalkable(c, r)) {
          list.push(cell);
        }
      }
    }
    return list;
  }
}
