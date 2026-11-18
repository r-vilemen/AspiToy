import { describe, expect, it } from 'vitest';
import { INITIAL_ROOM_DIMENSIONS, INITIAL_OBSTACLES, INITIAL_REGIONS } from '@/store/environmentStore';
import { sharedMaterials, WORLD_PALETTE } from '@/world/Environment/Materials';
import {
  ALL_HOUSE_OBSTACLES,
  getOverheadObstacleAt,
  getSurfaceLandingY,
} from '@/world/House/HouseObstacles';
import { ObstacleDetector } from '@/agent/navigation/ObstacleDetector';
import { robotMotionBridge, useRobotStore } from '@/store/robotStore';

describe('Construção da Casa 3D e Coerência Espacial (Dia 2)', () => {
  it('garante dimensões coerentes entre sala e limites de obstáculos', () => {
    const { width, depth, wallHeight } = INITIAL_ROOM_DIMENSIONS;
    expect(width).toBe(10);
    expect(depth).toBe(8);
    expect(wallHeight).toBeGreaterThanOrEqual(3.0);

    // Todos os obstáculos devem estar contidos na geometria da sala
    for (const obs of INITIAL_OBSTACLES) {
      expect(obs.bounds.minX).toBeGreaterThanOrEqual(-width / 2);
      expect(obs.bounds.maxX).toBeLessThanOrEqual(width / 2);
      expect(obs.bounds.minZ).toBeGreaterThanOrEqual(-depth / 2);
      expect(obs.bounds.maxZ).toBeLessThanOrEqual(depth / 2);
    }
  });

  it('verifica integridade dos materiais PBR compartilhados da casa', () => {
    expect(sharedMaterials.floorWood).toBeDefined();
    expect(sharedMaterials.floorPlankAlt).toBeDefined();
    expect(sharedMaterials.wallPlaster).toBeDefined();
    expect(sharedMaterials.wallAccent).toBeDefined();
    expect(sharedMaterials.sofaLinen).toBeDefined();
    expect(sharedMaterials.furnitureWood).toBeDefined();
    expect(sharedMaterials.plantPotCeramic).toBeDefined();
    expect(sharedMaterials.plantFoliage).toBeDefined();
    expect(sharedMaterials.windowGlass).toBeDefined();
    expect(sharedMaterials.tableGlass).toBeDefined();

    // Paleta de iluminação e ambiente PS2 Toy Story
    expect(WORLD_PALETTE.woodFloorBase).toBe('#C87D32');
    expect(WORLD_PALETTE.sunlitBackdrop).toBe('#D8B888');
  });

  it('valida cobertura de cômodos e regiões da residência', () => {
    const regionIds = INITIAL_REGIONS.map((r) => r.id);
    expect(regionIds).toEqual([
      'all',
      'bedroom',
      'hallway',
      'living-room',
      'kitchen',
      'bathroom',
    ]);
    expect(regionIds).not.toContain('living-center');
    expect(regionIds).not.toContain('reading-nook');
    expect(regionIds).not.toContain('media-zone');
  });

  it('impede decolagem do helicóptero quando o robô estiver no chão embaixo de mesas ou móveis', () => {
    // 1. Embaixo da mesa de centro do quarto (vão livre inferior de 56cm, robô no piso y = 0.0)
    const underCoffeeTable = getOverheadObstacleAt({ x: -1.45, z: -1.15 }, 0.0);
    expect(underCoffeeTable).not.toBeNull();
    expect(underCoffeeTable?.label).toBe('Mesa de Centro do Quarto');

    // 2. Embaixo do aparador do corredor
    const underConsole = getOverheadObstacleAt({ x: 5.35, z: -1.8 }, 0.0);
    expect(underConsole).not.toBeNull();
    expect(underConsole?.label).toBe('Aparador do Corredor');

    // 3. Embaixo do sofá da sala
    const underSofa = getOverheadObstacleAt({ x: 13.0, z: 1.0 }, 0.0);
    expect(underSofa).not.toBeNull();
    expect(underSofa?.label).toBe('Sofá da Sala');

    // 4. Em área aberta (chão livre do quarto), decolagem é liberada
    const inOpenArea = getOverheadObstacleAt({ x: 0.0, z: 0.0 }, 0.0);
    expect(inOpenArea).toBeNull();

    // 5. No topo da mesa de centro do quarto (y = 0.69m), decolagem para o ar é liberada
    const onTopOfTable = getOverheadObstacleAt({ x: -1.45, z: -1.15 }, 0.69);
    expect(onTopOfTable).toBeNull();
  });

  it('calcula cota de pouso sobre superfícies elevadas para o robô não afundar ou atravessar móveis', () => {
    // 1. Pouso sobre a mesa de centro do quarto
    const tableLandingY = getSurfaceLandingY({ x: -1.45, z: -1.15 }, 0.85);
    expect(tableLandingY).toBeCloseTo(0.69, 2);

    // 2. Pouso sobre o sofá da sala
    const sofaLandingY = getSurfaceLandingY({ x: 13.0, z: 1.0 }, 0.85);
    expect(sofaLandingY).toBeCloseTo(0.585, 2);

    // 3. Pouso sobre o sofá-baú do quarto
    const chestLandingY = getSurfaceLandingY({ x: 0.0, z: 2.5 }, 1.0);
    expect(chestLandingY).toBeCloseTo(0.89, 2);

    // 4. Pouso no solo aberto
    const floorLandingY = getSurfaceLandingY({ x: 0.0, z: 0.0 }, 0.85);
    expect(floorLandingY).toBe(0.0);
  });

  it('toggleHelicopterMode rejeita decolagem embaixo de mesa e pousa no topo do móvel', () => {
    const { toggleHelicopterMode } = useRobotStore.getState();

    // Posiciona o robô embaixo da mesa de centro do quarto
    robotMotionBridge.x = -1.45;
    robotMotionBridge.z = -1.15;
    robotMotionBridge.y = 0.0;
    robotMotionBridge.isFlying = false;

    // Tentativa de decolar embaixo da mesa deve ser bloqueada
    const takeoffResult = toggleHelicopterMode();
    expect(takeoffResult).toBe(false);
    expect(robotMotionBridge.isFlying).toBe(false);

    // Move para área aberta e decola com sucesso
    robotMotionBridge.x = 0.0;
    robotMotionBridge.z = 0.0;
    const openTakeoff = toggleHelicopterMode();
    expect(openTakeoff).toBe(true);
    expect(robotMotionBridge.isFlying).toBe(true);

    // Voa até sobre a mesa de centro e executa pouso
    robotMotionBridge.x = -1.45;
    robotMotionBridge.z = -1.15;
    robotMotionBridge.y = 0.85;

    const landResult = toggleHelicopterMode();
    expect(landResult).toBe(false);
    expect(robotMotionBridge.isFlying).toBe(false);
    // Cota de pouso deve ser o topo da mesa (0.69m), não 0.0
    expect(robotMotionBridge.targetY).toBeCloseTo(0.69, 2);
  });

  it('impede penetração física no encosto, almofadas e braço do sofá da sala em qualquer altitude de voo', () => {
    const detector = new ObstacleDetector(ALL_HOUSE_OBSTACLES, 22.6, 17.5);

    // 1. Em altitude de cruzeiro (Y = 1.25m), tentando voar para dentro do encosto do sofá
    const cruiseHit = detector.resolveSafeMovement(
      { x: 13.2, z: 0.88 },
      { x: 13.2, z: 1.50 },
      0.29,
      1.25
    );
    expect(cruiseHit.collided).toBe(true);
    expect(cruiseHit.obstacleId).toBe('living-sofa-backrest');
    // Robô deve parar com segurança antes das almofadas/encosto (minZ = 1.26 - raio 0.29 = 0.97)
    expect(cruiseHit.position.z).toBeLessThanOrEqual(0.98);

    // 2. Em altitude manual (Y = 0.85m), aproximando-se da almofada vermelha esquerda (X = 12.0)
    const pillowHit = detector.resolveSafeMovement(
      { x: 12.0, z: 0.88 },
      { x: 12.0, z: 1.40 },
      0.29,
      0.85
    );
    expect(pillowHit.collided).toBe(true);
    expect(pillowHit.obstacleId).toBe('living-sofa-backrest');
    expect(pillowHit.position.z).toBeLessThanOrEqual(0.98);

    // 3. Tentando penetrar lateralmente no braço esquerdo do sofá (Y = 0.90m)
    const armrestHit = detector.resolveSafeMovement(
      { x: 10.2, z: 1.0 },
      { x: 11.2, z: 1.0 },
      0.29,
      0.90
    );
    expect(armrestHit.collided).toBe(true);
    expect(armrestHit.obstacleId).toBe('living-sofa-armrest-left');
    expect(armrestHit.position.x).toBeLessThanOrEqual(10.65);

    // 4. Tentando voar de trás do sofá para a frente através do encosto (Y = 1.25m)
    const backHit = detector.resolveSafeMovement(
      { x: 13.2, z: 2.30 },
      { x: 13.2, z: 1.60 },
      0.29,
      1.25
    );
    expect(backHit.collided).toBe(true);
    expect(backHit.obstacleId).toBe('living-sofa-backrest');
    expect(backHit.position.z).toBeGreaterThanOrEqual(2.15);
  });

  it('impede penetração física nos braços e na almofada terracota da poltrona verde do quarto', () => {
    const detector = new ObstacleDetector(ALL_HOUSE_OBSTACLES, 22.6, 17.5);

    // 1. Pousado no assento da poltrona (Y = 0.88m), tentando avançar para dentro da almofada terracota
    const pillowHit = detector.resolveSafeMovement(
      { x: 0.75, z: -0.60 },
      { x: 0.75, z: -1.25 },
      0.315,
      0.88
    );
    expect(pillowHit.collided).toBe(true);
    expect(pillowHit.obstacleId).toBe('armchair-olive-pillow');
    expect(pillowHit.position.z).toBeGreaterThanOrEqual(-0.65);

    // 2. Em voo (Y = 1.05m), tentando penetrar no braço esquerdo da poltrona verde
    const armrestHit = detector.resolveSafeMovement(
      { x: 0.0, z: -0.80 },
      { x: 0.50, z: -0.80 },
      0.315,
      1.05
    );
    expect(armrestHit.collided).toBe(true);
    expect(armrestHit.obstacleId).toBe('armchair-olive-armrest-left');
    expect(armrestHit.position.x).toBeLessThanOrEqual(0.06);
  });
});
