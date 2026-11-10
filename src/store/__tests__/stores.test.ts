import { beforeEach, describe, expect, it } from 'vitest';
import { useRobotStore, robotMotionBridge } from '../robotStore';
import { useEnvironmentStore } from '../environmentStore';
import { useCommandStore } from '../commandStore';
import { clamp, damp, distance2D, shortestAngleDiff } from '@/utils/math';
import { gridToWorld, isPointInsideBounds, worldToGrid } from '@/utils/coordinates';

describe('Utilitários Matemáticos e de Coordenadas (Dia 1)', () => {
  it('calcula clamp, distância 2D e menor diferença angular corretamente', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(distance2D({ x: 0, z: 0 }, { x: 3, z: 4 })).toBe(5);
    expect(Math.abs(shortestAngleDiff(0, Math.PI * 2))).toBeLessThan(1e-5);
    expect(damp(0, 10, 5, 0.1)).toBeGreaterThan(0);
  });

  it('converte coordenadas do mundo para grade e vice-versa', () => {
    const cell = worldToGrid({ x: 0, z: 0 }, 10, 8, 0.5);
    const world = gridToWorld(cell, 10, 8, 0.5);
    expect(Math.abs(world.x)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(world.z)).toBeLessThanOrEqual(0.5);
    expect(
      isPointInsideBounds(
        { x: 0, z: 0 },
        { minX: -2, maxX: 2, minZ: -2, maxZ: 2 }
      )
    ).toBe(true);
  });
});

describe('Arquitetura de Estado Zustand (robotStore, environmentStore, commandStore)', () => {
  beforeEach(() => {
    useEnvironmentStore.getState().resetEnvironment();
    useRobotStore.getState().resetRobot();
  });

  it('inicia no estado IDLE na base de carregamento', () => {
    const robot = useRobotStore.getState();
    expect(robot.state).toBe('IDLE');
    expect(robot.battery).toBeGreaterThan(90);
    expect(robotMotionBridge.x).toBeCloseTo(robot.position.x, 2);
  });

  it('executa transição consistente para CLEANING, PAUSED, RESUME e RETURNING', () => {
    const cmd = useCommandStore.getState();

    expect(cmd.dispatchCommand('START_CLEANING')).toBe(true);
    expect(useRobotStore.getState().state).toBe('CLEANING');

    // Não deve aceitar START_CLEANING duplicado quando já está limpando
    expect(cmd.dispatchCommand('START_CLEANING')).toBe(false);

    // Pausar operação
    expect(cmd.dispatchCommand('PAUSE_CLEANING')).toBe(true);
    expect(useRobotStore.getState().state).toBe('PAUSED');

    // Retomar operação deve voltar para CLEANING
    expect(cmd.dispatchCommand('RESUME_CLEANING')).toBe(true);
    expect(useRobotStore.getState().state).toBe('CLEANING');

    // Retornar à base interrompe tarefa atual
    expect(cmd.dispatchCommand('RETURN_TO_BASE')).toBe(true);
    expect(useRobotStore.getState().state).toBe('RETURNING');
  });

  it('reduz sujeira e atualiza porcentagem de limpeza ao passar por pontos sujos', () => {
    const env = useEnvironmentStore.getState();
    const firstSpot = env.dustSpots[0];
    const progress = env.cleanDustNearPoint(firstSpot.position, 0.6, 0.5);
    expect(progress).toBeGreaterThan(0);
  });
});

