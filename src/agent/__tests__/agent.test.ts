import { describe, expect, it } from 'vitest';
import { ObstacleDetector } from '../navigation/ObstacleDetector';
import { SensorSystem } from '../perception/SensorSystem';
import { AgentController } from '../AgentController';
import {
  catMotionBridge,
  getDynamicCatObstacle,
  INITIAL_OBSTACLES,
  INITIAL_ROOM_DIMENSIONS,
  useEnvironmentStore,
} from '@/store/environmentStore';

describe('Agente Inteligente, Colisão Física e Desvio do Gato Dinâmico', () => {
  const detector = new ObstacleDetector(
    INITIAL_OBSTACLES,
    INITIAL_ROOM_DIMENSIONS.width,
    INITIAL_ROOM_DIMENSIONS.depth
  );

  it('detecta colisão contra paredes e contra móveis fixos', () => {
    expect(detector.isColliding({ x: 5.5, z: 0 })).toBe(true);
    expect(detector.isColliding({ x: 0, z: -1.5 })).toBe(false);
    expect(detector.isColliding({ x: 0, z: 2.2 })).toBe(true);
  });

  it('resolveSafeMovement impede o robô de atravessar móveis ou o gato', () => {
    catMotionBridge.x = 0.0;
    catMotionBridge.z = -1.0;
    detector.setDynamicObstacles([getDynamicCatObstacle()]);

    // Tentativa de avançar diretamente para dentro da posição do gato
    const result = detector.resolveSafeMovement(
      { x: 0.0, z: -0.2 },
      { x: 0.0, z: -0.8 },
      0.31
    );

    expect(result.collided).toBe(true);
    expect(result.obstacleId).toBe('dynamic-cat');
    expect(result.obstacleLabel).toBe('Gato Laranja');
    // Não avança para dentro do gato
    expect(result.position.z).toBeGreaterThan(-0.7);
  });

  it('sensor simula raios ToF e identifica obstáculo frontal', () => {
    detector.setDynamicObstacles([]);
    const sensor = new SensorSystem(detector);
    const scan = sensor.scan({ x: 0, z: 1.0 }, 0, 'living-center');
    expect(scan.rays.length).toBeGreaterThan(0);
    expect(scan.nearestObstacleDistance).toBeLessThan(1.5);
  });

  it('AgentController desvia quando o Gato Laranja cruza o caminho do robô', () => {
    const controller = new AgentController(
      INITIAL_OBSTACLES,
      INITIAL_ROOM_DIMENSIONS.width,
      INITIAL_ROOM_DIMENSIONS.depth
    );

    // Posiciona o gato logo à frente do robô
    catMotionBridge.x = 0.0;
    catMotionBridge.z = -0.55;
    const dynamicCat = getDynamicCatObstacle();

    const decision = controller.decide(
      'CLEANING',
      { x: 0.0, z: -0.1 },
      Math.PI, // olhando para -Z (direto para o gato)
      { x: 0.0, z: -2.0 },
      1.35,
      'living-center',
      0.016,
      [dynamicCat]
    );

    expect(decision.nextState).toBe('AVOIDING');
    expect(decision.detectedObstacleLabel).toBe('Gato Laranja');
  });

  it('alterna entre todos os estados de comportamento do gato (andando, correndo, em pé, deitado, dormindo)', () => {
    useEnvironmentStore.getState().resetEnvironment();
    const seenStates = new Set<string>();
    seenStates.add(useEnvironmentStore.getState().catState);

    for (let i = 0; i < 5; i++) {
      const next = useEnvironmentStore.getState().cycleCatBehavior();
      seenStates.add(next);
    }

    expect(seenStates.has('WALKING')).toBe(true);
    expect(seenStates.has('RUNNING')).toBe(true);
    expect(seenStates.has('STANDING')).toBe(true);
    expect(seenStates.has('LYING')).toBe(true);
    expect(seenStates.has('SLEEPING')).toBe(true);
  });
});
