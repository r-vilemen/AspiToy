import type { Vector2D } from '@/types/robot';
import type { GridMap } from './GridMap';

interface AStarNode {
  col: number;
  row: number;
  g: number; // Custo do início até este nó
  h: number; // Heurística até o destino
  f: number; // g + h
  parent: AStarNode | null;
}

/**
 * Implementação do algoritmo A* para planejamento de trajetórias ótimas em 2D.
 */
export class PathPlanner {
  private grid: GridMap;

  constructor(grid: GridMap) {
    this.grid = grid;
  }

  public setGrid(grid: GridMap): void {
    this.grid = grid;
  }

  /**
   * Calcula rota A* entre start e target em coordenadas do mundo.
   * Retorna array de waypoints 2D navegáveis ou lista vazia se inalcançável.
   */
  public findPath(start: Vector2D, target: Vector2D): Vector2D[] {
    const startCell = this.grid.getCellAtWorld(start);
    const targetCell = this.grid.getCellAtWorld(target);

    if (!startCell || !targetCell) return [];
    if (!this.grid.isWalkable(targetCell.col, targetCell.row)) {
      // Se a célula alvo exata for parede/móvel, busca o vizinho livre mais próximo
      const neighbor = this.findNearestWalkableNeighbor(targetCell.col, targetCell.row);
      if (!neighbor) return [];
      return this.findPath(start, neighbor.worldPos);
    }

    const openList: AStarNode[] = [];
    const closedSet = new Set<string>();

    const startNode: AStarNode = {
      col: startCell.col,
      row: startCell.row,
      g: 0,
      h: this.heuristic(startCell.col, startCell.row, targetCell.col, targetCell.row),
      f: 0,
      parent: null,
    };
    startNode.f = startNode.g + startNode.h;
    openList.push(startNode);

    // 8 Direções (ortogonais + diagonais)
    const directions = [
      { dc: 0, dr: -1, cost: 1.0 },
      { dc: 0, dr: 1, cost: 1.0 },
      { dc: -1, dr: 0, cost: 1.0 },
      { dc: 1, dr: 0, cost: 1.0 },
      { dc: -1, dr: -1, cost: 1.414 },
      { dc: 1, dr: -1, cost: 1.414 },
      { dc: -1, dr: 1, cost: 1.414 },
      { dc: 1, dr: 1, cost: 1.414 },
    ];

    while (openList.length > 0) {
      // Nó com menor f
      openList.sort((a, b) => a.f - b.f);
      const current = openList.shift()!;
      const key = `${current.col},${current.row}`;

      if (current.col === targetCell.col && current.row === targetCell.row) {
        return this.reconstructPath(current);
      }

      closedSet.add(key);

      for (const dir of directions) {
        const nextCol = current.col + dir.dc;
        const nextRow = current.row + dir.dr;
        const nextKey = `${nextCol},${nextRow}`;

        if (closedSet.has(nextKey)) continue;
        if (!this.grid.isWalkable(nextCol, nextRow)) continue;

        // Evita cortar quinas entre obstáculos diagonais
        if (dir.dc !== 0 && dir.dr !== 0) {
          if (
            !this.grid.isWalkable(current.col + dir.dc, current.row) ||
            !this.grid.isWalkable(current.col, current.row + dir.dr)
          ) {
            continue;
          }
        }

        const tentativeG = current.g + dir.cost;
        let existingNode = openList.find((n) => n.col === nextCol && n.row === nextRow);

        if (!existingNode) {
          const h = this.heuristic(nextCol, nextRow, targetCell.col, targetCell.row);
          const newNode: AStarNode = {
            col: nextCol,
            row: nextRow,
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current,
          };
          openList.push(newNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    return []; // Sem caminho
  }

  private heuristic(c1: number, r1: number, c2: number, r2: number): number {
    const dc = Math.abs(c1 - c2);
    const dr = Math.abs(r1 - r2);
    // Heurística Octile
    return Math.max(dc, dr) + 0.414 * Math.min(dc, dr);
  }

  private reconstructPath(node: AStarNode): Vector2D[] {
    const path: Vector2D[] = [];
    let curr: AStarNode | null = node;

    while (curr) {
      const cell = this.grid.getCell(curr.col, curr.row);
      if (cell) {
        path.unshift(cell.worldPos);
      }
      curr = curr.parent;
    }

    // Suavização simples de caminho (remove pontos redundantes colineares)
    return this.smoothPath(path);
  }

  private smoothPath(path: Vector2D[]): Vector2D[] {
    if (path.length <= 2) return path;
    const smoothed: Vector2D[] = [path[0]];

    for (let i = 1; i < path.length - 1; i++) {
      const prev = smoothed[smoothed.length - 1];
      const next = path[i + 1];

      // Se a linha direta interceptar obstáculo, mantém o ponto intermediário
      const mid = path[i];
      const dir1 = { x: mid.x - prev.x, z: mid.z - prev.z };
      const dir2 = { x: next.x - mid.x, z: next.z - mid.z };

      // Ângulo de curva
      const dot = dir1.x * dir2.x + dir1.z * dir2.z;
      const mag1 = Math.hypot(dir1.x, dir1.z);
      const mag2 = Math.hypot(dir2.x, dir2.z);
      const cos = dot / (mag1 * mag2 + 1e-6);

      if (cos < 0.96) {
        smoothed.push(mid);
      }
    }

    smoothed.push(path[path.length - 1]);
    return smoothed;
  }

  private findNearestWalkableNeighbor(col: number, row: number) {
    for (let rad = 1; rad <= 6; rad++) {
      for (let dr = -rad; dr <= rad; dr++) {
        for (let dc = -rad; dc <= rad; dc++) {
          if (this.grid.isWalkable(col + dc, row + dr)) {
            return this.grid.getCell(col + dc, row + dr);
          }
        }
      }
    }
    return null;
  }
}

