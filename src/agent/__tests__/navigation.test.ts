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

  it('impede penetração de paredes e batentes mesmo dentro da área de travessia de portas', () => {
    const wallObstacles = [
      {
        id: 'wall-hallway-east-2',
        label: 'Parede Leste do Corredor Norte',
        category: 'wall' as const,
        bounds: { minX: 7.5, maxX: 7.7, minZ: 1.4, maxZ: 5.35 },
        collidable: true,
        height: 4.6,
      },
      {
        id: 'wall-hallway-east-3',
        label: 'Parede Leste do Corredor Sul',
        category: 'wall' as const,
        bounds: { minX: 7.5, maxX: 7.7, minZ: 6.65, maxZ: 8.6 },
        collidable: true,
        height: 4.6,
      },
    ];

    const detector = new ObstacleDetector(wallObstacles, 22.6, 17.5);

    // Robô dentro de traversableBounds da porta da cozinha [minX: 6.8, maxX: 8.4, minZ: 5.35, maxZ: 6.65]
    // Tentando se mover contra a parede sólida em (7.6, 5.25)
    const current = { x: 7.2, z: 5.4 };
    const desired = { x: 7.6, z: 5.25 }; // Dentro do volume da parede

    const result = detector.resolveSafeMovement(current, desired, 0.29);

    // Não pode penetrar: deve colidir e ser repelido
    expect(result.collided).toBe(true);
    expect(result.position.x).toBeLessThan(7.5 - 0.28);
  });

  it('impede penetração do robô nas banquetas da cozinha', () => {
    const stoolObstacles = [
      {
        id: 'kitchen-stool-west',
        label: 'Cadeira / Banqueta da Ilha (Oeste)',
        category: 'furniture' as const,
        bounds: { minX: 11.9, maxX: 12.2, minZ: 3.35, maxZ: 3.65 },
        collidable: true,
        height: 0.85,
      },
    ];

    const detector = new ObstacleDetector(stoolObstacles, 22.6, 17.5);

    const current = { x: 11.4, z: 3.5 };
    const desired = { x: 12.05, z: 3.5 }; // Centro exato da banqueta

    const result = detector.resolveSafeMovement(current, desired, 0.29);

    expect(result.collided).toBe(true);
    // Robô deve ser bloqueado antes dos pés da banqueta com precisão
    expect(result.position.x).toBeLessThanOrEqual(11.9 - 0.28);
  });

  it('permite que o robô se aproxime com precisão do box de vidro do banheiro sem distância fantasma', () => {
    const showerObstacle = [
      {
        id: 'bathroom-shower-box',
        label: 'Box de Vidro com Chuveiro',
        category: 'furniture' as const,
        bounds: { minX: 5.0, maxX: 7.15, minZ: 11.25, maxZ: 13.5 },
        collidable: true,
        height: 3.0,
      },
    ];

    const detector = new ObstacleDetector(showerObstacle, 22.6, 17.5);

    // Robô vindo do lado leste do banheiro (X = 7.8) em direção ao vidro (X = 7.15)
    const current = { x: 7.8, z: 12.0 };
    const desired = { x: 7.3, z: 12.0 };

    const result = detector.resolveSafeMovement(current, desired, 0.29);

    expect(result.collided).toBe(true);
    // O robô deve parar encostado na face externa do vidro: X = 7.15 + 0.29 = 7.44m (e não a 7.89m com 45cm de ar!)
    expect(result.position.x).toBeCloseTo(7.44, 2);
  });

  it('impede penetração do robô nos pés finos da mesa de centro (Bedroom Coffee Table Leg)', () => {
    // Pé de mesa fino com apenas 8cm de espessura (X: -2.21 a -2.13, Z: -1.63 a -1.55)
    const legObstacle = [
      {
        id: 'coffee-table-leg-nw',
        label: 'Pé da Mesa (Noroeste)',
        category: 'furniture' as const,
        bounds: { minX: -2.21, maxX: -2.13, minZ: -1.63, maxZ: -1.55 },
        collidable: true,
        height: 0.65,
      },
    ];

    const detector = new ObstacleDetector(legObstacle, 10.0, 8.0);

    // O robô se move em direção ao pé vindo do sul: current em Z = -1.2, desired passando direto por dentro do pé em Z = -1.59
    const current = { x: -2.17, z: -1.2 };
    const desired = { x: -2.17, z: -1.59 };

    const result = detector.resolveSafeMovement(current, desired, 0.29);

    expect(result.collided).toBe(true);
    // O robô NUNCA deve penetrar nem atravessar o pé fino
    expect(result.position.z).toBeGreaterThanOrEqual(-1.55 + 0.285);
    // Verifica que não está dentro do AABB do obstáculo
    expect(
      result.position.x >= -2.21 &&
      result.position.x <= -2.13 &&
      result.position.z >= -1.63 &&
      result.position.z <= -1.55
    ).toBe(false);
  });
});

