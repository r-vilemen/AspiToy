import { describe, expect, it } from 'vitest';
import { GridMap } from '../navigation/GridMap';
import { PathPlanner } from '../navigation/PathPlanner';
import { ObstacleDetector } from '../navigation/ObstacleDetector';
import { INITIAL_DOCK_POSITION, INITIAL_OBSTACLES, INITIAL_ROOM_DIMENSIONS } from '@/store/environmentStore';

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

  it('permite que o robô navegue livremente embaixo da mesa de centro', () => {
    // Ponto central debaixo da mesa de centro
    const underTablePoint = { x: -1.45, z: -1.15 };
    const underTableCell = grid.getCellAtWorld(underTablePoint);
    expect(underTableCell).not.toBeNull();
    expect(grid.isWalkable(underTableCell!.col, underTableCell!.row)).toBe(true);

    // Planeja rota partindo de fora da mesa diretamente para debaixo dela
    const outsidePoint = { x: -3.0, z: -1.15 };
    const pathToUnderTable = planner.findPath(outsidePoint, underTablePoint);
    expect(pathToUnderTable.length).toBeGreaterThan(1);

    // O último ponto da rota deve alcançar o destino embaixo da mesa
    const destination = pathToUnderTable[pathToUnderTable.length - 1];
    expect(Math.abs(destination.x - underTablePoint.x)).toBeLessThanOrEqual(0.35);
    expect(Math.abs(destination.z - underTablePoint.z)).toBeLessThanOrEqual(0.35);
  });

  it('permite que o robô navegue até a base de carregamento localizada no canto do quarto', () => {
    // A base no canto sudoeste (INITIAL_DOCK_POSITION) deve ser navegável no GridMap
    const dockCell = grid.getCellAtWorld(INITIAL_DOCK_POSITION);
    expect(dockCell).not.toBeNull();
    expect(grid.isWalkable(dockCell!.col, dockCell!.row)).toBe(true);

    // Rota de retorno à base partindo do centro da sala
    const startPos = { x: 0, z: 0 };
    const pathToDock = planner.findPath(startPos, INITIAL_DOCK_POSITION);
    expect(pathToDock.length).toBeGreaterThan(1);

    const endPoint = pathToDock[pathToDock.length - 1];
    expect(Math.abs(endPoint.x - INITIAL_DOCK_POSITION.x)).toBeLessThanOrEqual(0.35);
    expect(Math.abs(endPoint.z - INITIAL_DOCK_POSITION.z)).toBeLessThanOrEqual(0.35);
  });

  it('desliza suavemente em cantos e quinas de batentes de portas sem travar', () => {
    // Simula quina de batente de porta no corredor (parede em X=7.48, Z de 6.65 a 8.6)
    const doorCornerObstacles = [
      {
        id: 'door-jamb-wall',
        label: 'Batente da Porta da Cozinha',
        category: 'wall' as const,
        bounds: { minX: 7.48, maxX: 7.72, minZ: 6.65, maxZ: 8.6 },
        collidable: true,
        height: 3.0,
      },
    ];

    const detector = new ObstacleDetector(
      doorCornerObstacles,
      22.6,
      17.5
    );

    // Robô posicionado próximo à quina (7.20, 6.50), tentando avançar diagonalmente para (7.35, 6.68)
    const current = { x: 7.2, z: 6.5 };
    const desired = { x: 7.35, z: 6.68 };

    const result = detector.resolveSafeMovement(current, desired, 0.29);

    // Deve permitir deslocamento tangencial (deslizando pelo arco da quina) sem congelar na posição anterior
    const moved = Math.hypot(result.position.x - current.x, result.position.z - current.z);
    expect(moved).toBeGreaterThan(0.01);

    // E a distância da quina sólida deve ser estritamente segura (>= 0.28m)
    const distToCorner = Math.hypot(result.position.x - 7.48, result.position.z - 6.65);
    expect(distToCorner).toBeGreaterThanOrEqual(0.28);
  });
});

