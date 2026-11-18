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

  it('garante que sujeiras limpas não retornam durante o ciclo circadiano e apenas no reset explícito', () => {
    const env = useEnvironmentStore.getState();
    env.resetEnvironment();

    const initialVersion = useEnvironmentStore.getState().dustVersion;
    const firstSpot = useEnvironmentStore.getState().dustSpots[0];
    const initialIntensity = firstSpot.intensity;

    // 1. Limpa o ponto de poeira
    env.cleanDustNearPoint(firstSpot.position, 0.6, 0.5);
    const cleanedIntensity = useEnvironmentStore.getState().dustSpots[0].intensity;
    expect(cleanedIntensity).toBeLessThan(initialIntensity);
    expect(useEnvironmentStore.getState().dustVersion).toBe(initialVersion);

    // 2. Simula o avanço contínuo do ciclo circadiano (60s, mudanças de período) e telemetria
    for (let i = 0; i < 10; i++) {
      env.tickCircadianTimer(1);
    }
    // A sujeira NÃO pode retornar nem o dustVersion ser alterado
    expect(useEnvironmentStore.getState().dustSpots[0].intensity).toBe(cleanedIntensity);
    expect(useEnvironmentStore.getState().dustVersion).toBe(initialVersion);

    // 3. Apenas em respawnDustSpots ou resetEnvironment a poeira é regenerada com novo dustVersion
    env.respawnDustSpots();
    expect(useEnvironmentStore.getState().dustVersion).toBe(initialVersion + 1);
    expect(useEnvironmentStore.getState().dustSpots[0].intensity).toBe(0.9);
  });

  it('define destino no piso ao clicar no chão (MOVE_TO_POINT)', () => {
    const cmd = useCommandStore.getState();
    expect(
      cmd.dispatchCommand('MOVE_TO_POINT', { point: { x: 1.25, z: -0.85 } })
    ).toBe(true);
    expect(useRobotStore.getState().targetPosition).toEqual({
      x: 1.25,
      z: -0.85,
    });
    expect(useRobotStore.getState().state).toBe('EXPLORING');
  });

  it('atualiza telemetria realista da área higienizada em m² e porcentagem', () => {
    const robot = useRobotStore.getState();
    expect(robot.cleaningProgress).toBe(0);
    expect(robot.roomCleaningProgress).toBe(0);
    expect(robot.cleanedAreaM2).toBe(0);

    robot.setSanitizedAreaTelemetry(45, 80, 24.5, 122);
    const updated = useRobotStore.getState();
    expect(updated.cleaningProgress).toBe(45);
    expect(updated.roomCleaningProgress).toBe(80);
    expect(updated.cleanedAreaM2).toBe(24.5);
    expect(updated.totalAreaM2).toBe(122);

    robot.resetRobot();
    const reset = useRobotStore.getState();
    expect(reset.cleaningProgress).toBe(0);
    expect(reset.roomCleaningProgress).toBe(0);
    expect(reset.cleanedAreaM2).toBe(0);
  });

  it('deve alternar o modo helicóptero e atualizar isFlying na bridge', () => {
    const { toggleHelicopterMode } = useRobotStore.getState();
    expect(robotMotionBridge.isFlying).toBe(false);
    toggleHelicopterMode();
    expect(robotMotionBridge.isFlying).toBe(true);
    expect(robotMotionBridge.targetY).toBeGreaterThan(0.5);
    toggleHelicopterMode();
    expect(robotMotionBridge.isFlying).toBe(false);
    expect(robotMotionBridge.targetY).toBe(0);
  });

  it('deve impedir decolagem do helicóptero quando a bateria estiver fraca (<= 20%)', () => {
    const robot = useRobotStore.getState();
    const cmd = useCommandStore.getState();

    // 1. Reduz a bateria para nível fraco (15%)
    useRobotStore.setState({ battery: 15 });
    expect(useRobotStore.getState().battery).toBe(15);
    expect(robotMotionBridge.isFlying).toBe(false);

    // 2. Tenta acionar o modo helicóptero diretamente pelo store
    const takeoffSuccess = robot.toggleHelicopterMode();
    expect(takeoffSuccess).toBe(false);
    expect(robotMotionBridge.isFlying).toBe(false);
    expect(useRobotStore.getState().state).not.toBe('FLYING');
    expect(useRobotStore.getState().lastAction).toContain('Bateria fraca');

    // 3. Tenta acionar o modo helicóptero via comando TOGGLE_HELICOPTER
    const cmdResult = cmd.dispatchCommand('TOGGLE_HELICOPTER');
    expect(cmdResult).toBe(false);
    expect(robotMotionBridge.isFlying).toBe(false);

    const notifications = useCommandStore.getState().notifications;
    expect(notifications.some((n) => n.title.includes('Bateria Fraca'))).toBe(true);
  });

  it('deve incrementar bubbleBurstTrigger ao disparar o canhão de bolhas', () => {
    const initialTrigger = robotMotionBridge.bubbleBurstTrigger;
    const { fireBubbleCannon } = useRobotStore.getState();
    fireBubbleCannon();
    expect(robotMotionBridge.bubbleBurstTrigger).toBe(initialTrigger + 1);
  });

  it('deve gerenciar o modo do farol óptico (auto, on, off)', () => {
    const robot = useRobotStore.getState();
    expect(robot.headlightMode).toBe('auto');

    robot.setHeadlightMode('on');
    expect(useRobotStore.getState().headlightMode).toBe('on');

    const nextMode = robot.toggleHeadlightMode();
    expect(nextMode).toBe('off');
    expect(useRobotStore.getState().headlightMode).toBe('off');

    const autoMode = robot.toggleHeadlightMode();
    expect(autoMode).toBe('auto');
    expect(useRobotStore.getState().headlightMode).toBe('auto');
  });

  it('deve incluir sujeira em mesas e sofás e respeitar a discriminação vertical de altitude', () => {
    const env = useEnvironmentStore.getState();
    const tableSpot = env.dustSpots.find((s) => s.id === 'dust-table-bedroom');
    expect(tableSpot).toBeDefined();
    expect(tableSpot!.y).toBeGreaterThan(0.5);
    expect(tableSpot!.surfaceLabel).toBe('Mesa de Vidro');

    const initialIntensity = tableSpot!.intensity;

    // Robô no chão (actorY = 0) NÃO deve conseguir limpar sujeira em cima da mesa
    env.cleanDustNearPoint(tableSpot!.position, 0.6, 0.4, 0.0);
    const unchangedSpot = useEnvironmentStore
      .getState()
      .dustSpots.find((s) => s.id === 'dust-table-bedroom');
    expect(unchangedSpot!.intensity).toBe(initialIntensity);

    // Robô voando próximo à mesa (actorY = 0.82) DEVE limpar a sujeira na mesa
    env.cleanDustNearPoint(tableSpot!.position, 0.6, 0.4, 0.82);
    const cleanedSpot = useEnvironmentStore
      .getState()
      .dustSpots.find((s) => s.id === 'dust-table-bedroom');
    expect(cleanedSpot!.intensity).toBeLessThan(initialIntensity);
  });
});

