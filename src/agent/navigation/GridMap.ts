import type { EnvironmentObstacle } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { getDistanceToAABB, isPointInsideBounds } from '@/utils/coordinates';
import { clamp } from '@/utils/math';
import { HOUSE_FLOOR_PLAN } from '@/world/House/FloorPlan';

export type CellState = 'FREE' | 'OCCUPIED' | 'CLEANED' | 'DIRTY' | 'UNKNOWN';

export interface GridCell {
  col: number;
  row: number;
  worldPos: Vector2D;
  state: CellState;
  explored: boolean;
}

export interface GridCellCoord {
  col: number;
  row: number;
}

/**
 * Grade de ocupação bidimensional representando a residência do AspiToy.
 * Suporta tanto o quarto inicial quanto a casa inteira multicômodo.
 * Pure TypeScript (desacoplada de React / Three.js).
 */
export class GridMap {
  public readonly width: number;
  public readonly depth: number;
  public readonly cellSize: number;
  public readonly cols: number;
  public readonly rows: number;
  public readonly minX: number;
  public readonly minZ: number;
  public readonly isMultiRoom: boolean;
  private cells: GridCell[][];
  private dynamicObstacles: EnvironmentObstacle[] = [];

  constructor(
    width = 10,
    depth = 8,
    cellSize = 0.25,
    obstacles: EnvironmentObstacle[] = [],
    minX?: number,
    minZ?: number
  ) {
    this.width = width;
    this.depth = depth;
    this.cellSize = cellSize;
    this.minX = minX ?? -width / 2;
    this.minZ = minZ ?? -depth / 2;
    this.cols = Math.floor(width / cellSize);
    this.rows = Math.floor(depth / cellSize);
    this.isMultiRoom = width > 12;

    this.cells = [];
    this.initGrid(obstacles);
  }

  public setDynamicObstacles(dynamicObstacles: EnvironmentObstacle[]): void {
    this.dynamicObstacles = dynamicObstacles;
  }

  public worldToGrid(point: Vector2D): GridCellCoord {
    return {
      col: clamp(
        Math.floor((point.x - this.minX) / this.cellSize),
        0,
        this.cols - 1
      ),
      row: clamp(
        Math.floor((point.z - this.minZ) / this.cellSize),
        0,
        this.rows - 1
      ),
    };
  }

  public gridToWorld(cell: GridCellCoord): Vector2D {
    return {
      x: this.minX + (cell.col + 0.5) * this.cellSize,
      z: this.minZ + (cell.row + 0.5) * this.cellSize,
    };
  }

  private initGrid(obstacles: EnvironmentObstacle[]): void {
    const robotPadding = 0.22; // Margem de segurança de colisão

    for (let r = 0; r < this.rows; r++) {
      this.cells[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const worldPos = this.gridToWorld({ col: c, row: r });

        let isOccupied = false;

        if (!this.isMultiRoom) {
          // Modo Quarto Único (compatibilidade com suíte de testes original)
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
        } else {
          // Modo Residência Completa Multicômodo:
          // A célula deve estar dentro de algum cômodo da casa ou no vão de uma porta
          const isInRoom = Object.values(HOUSE_FLOOR_PLAN.rooms).some((room) =>
            isPointInsideBounds(worldPos, room.bounds, 0.05)
          );
          const isInDoor = HOUSE_FLOOR_PLAN.doors.some(
            (door) =>
              door.isOpen &&
              isPointInsideBounds(worldPos, door.traversableBounds, 0.05)
          );

          if (!isInRoom && !isInDoor) {
            isOccupied = true;
          }
        }

        // Móveis sólidos e alvenarias
        if (!isOccupied) {
          const inDoorway =
            this.isMultiRoom &&
            HOUSE_FLOOR_PLAN.doors.some(
              (door) =>
                door.isOpen &&
                isPointInsideBounds(worldPos, door.traversableBounds)
            );

          const effectivePadding = inDoorway ? 0.12 : robotPadding;

          for (const obs of obstacles) {
            if (!obs.collidable) continue;

            const distInfo = getDistanceToAABB(worldPos, obs.bounds);
            if (distInfo.distance < effectivePadding) {
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
    const { col, row } = this.worldToGrid(point);
    return this.getCell(col, row);
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
    const coord = this.worldToGrid(point);
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
