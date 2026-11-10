import { describe, expect, it } from 'vitest';
import { ObstacleDetector } from '../navigation/ObstacleDetector';
import { SensorSystem } from '../perception/SensorSystem';
import { AgentController } from '../AgentController';
import { INITIAL_OBSTACLES, INITIAL_ROOM_DIMENSIONS } from '@/store/environmentStore';

describe('Agente Inteligente Desacoplado (Sprint 1 - Dia 5)', () => {
  const detector = new ObstacleDetector(
    INITIAL_OBSTACLES,
    INITIAL_ROOM_DIMENSIONS.width,
    INITIAL_ROOM_DIMENSIONS.depth
  );

  it('detecta colisão contra paredes e contra o sofá', () => {
    // Ponto além da parede leste (X = 6)
    expect(detector.isColliding({ x: 5.5, z: 0 })).toBe(true);
    // Ponto seguro no meio da sala
    expect(detector.isColliding({ x: 0, z: -1.5 })).toBe(false);
    // Ponto dentro do sofá (Z: 2.2, X: 0)
    expect(detector.isColliding({ x: 0, z: 2.2 })).toBe(true);
  });

  it('sensor simula raios ToF e identifica obstáculo frontal', () => {
    const sensor = new SensorSystem(detector);
    // Robô apontando para o sofá (Z positivo, rotação 0)
    const scan = sensor.scan({ x: 0, z: 1.0 }, 0, 'living-center');
    expect(scan.rays.length).toBeGreaterThan(0);
    expect(scan.nearestObstacleDistance).toBeLessThan(1.5);
  });

  it('AgentController transiciona para AVOIDING quando detecta proximidade', () => {
    const controller = new AgentController(
      INITIAL_OBSTACLES,
      INITIAL_ROOM_DIMENSIONS.width,
      INITIAL_ROOM_DIMENSIONS.depth
    );

    // Próximo à parede norte (Z: -3.8)
    const decision = controller.decide(
      'CLEANING',
      { x: 0, z: -3.6 },
      Math.PI, // virado para a parede
      null,
      1.2,
      'media-zone',
      0.016
    );

    expect(decision.nextState).toBe('AVOIDING');
    expect(decision.desiredSpeed).toBeGreaterThan(0);
  });
});
