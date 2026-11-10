import { describe, expect, it } from 'vitest';
import { GridMap } from '../navigation/GridMap';
import { PathPlanner } from '../navigation/PathPlanner';
import { INITIAL_OBSTACLES, INITIAL_ROOM_DIMENSIONS } from '@/store/environmentStore';

describe('Inteligência e Navegação com Grade e Algoritmo A* (Sprint 2)', () => {
  const grid = new GridMap(
    INITIAL_ROOM_DIMENSIONS.width,
    INITIAL_ROOM_DIMENSIONS.depth,
    0.25,
    INITIAL_OBSTACLES
  );
  const planner = new PathPlanner(grid);

  it('inicializa grade discreta identificando células livres e ocupadas', () => {
    expect(grid.cols).toBe(40);
    expect(grid.rows).toBe(32);

    // Parede perimétrica deve ser bloqueada
    expect(grid.isWalkable(0, 0)).toBe(false);

    // Célula no meio da sala deve ser navegável
    const midCell = grid.getCellAtWorld({ x: 0, z: -1.5 });
    expect(midCell).not.toBeNull();
    expect(grid.isWalkable(midCell!.col, midCell!.row)).toBe(true);

    // Célula dentro do sofá deve ser bloqueada
    const sofaCell = grid.getCellAtWorld({ x: 0, z: 2.4 });
    expect(sofaCell).not.toBeNull();
    expect(grid.isWalkable(sofaCell!.col, sofaCell!.row)).toBe(false);
  });

  it('planeja rota A* livre de colisão contornando o sofá e a mesa', () => {
    // Rota da base de carregamento até o canto leste da sala
    const start = { x: -3.8, z: -2.5 };
    const target = { x: 2.5, z: 1.0 };

    const path = planner.findPath(start, target);
    expect(path.length).toBeGreaterThan(1);

    // Nenhum ponto da rota calculada pode estar dentro de obstáculos sólidos
    for (const point of path) {
      const cell = grid.getCellAtWorld(point);
      expect(cell).not.toBeNull();
      expect(cell!.state).not.toBe('OCCUPIED');
    }
  });

  it('marca células exploradas e computa áreas remanescentes', () => {
    const unvisitedBefore = grid.getUnexploredCells().length;
    grid.markExplored({ x: 0, z: 0 }, 1.2);
    const unvisitedAfter = grid.getUnexploredCells().length;

    expect(unvisitedAfter).toBeLessThan(unvisitedBefore);
  });
});
