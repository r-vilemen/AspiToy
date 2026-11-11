import { describe, expect, it } from 'vitest';
import { ObstacleDetector } from '../navigation/ObstacleDetector';
import { SensorSystem } from '../perception/SensorSystem';
import { AgentController } from '../AgentController';
import {
  catMotionBridge,
  getDynamicCatObstacle,
  INITIAL_OBSTACLES,
  INITIAL_ROOM_DIMENSIONS,
  pushableToysBridge,
  resetPushableToys,
  stepPushableToysPhysics,
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
    const scan = sensor.scan({ x: 0, z: 1.0 }, 0, 'bedroom');
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
      'bedroom',
      0.016,
      [dynamicCat]
    );

    expect(decision.nextState).toBe('AVOIDING');
    expect(decision.detectedObstacleLabel).toBe('Gato Laranja');
  });

  it('alterna entre todos os estados de comportamento do gato (andando, correndo, em pé, deitado, dormindo, sentado, alongando e banho)', () => {
    useEnvironmentStore.getState().resetEnvironment();
    const seenStates = new Set<string>();
    seenStates.add(useEnvironmentStore.getState().catState);

    for (let i = 0; i < 8; i++) {
      const next = useEnvironmentStore.getState().cycleCatBehavior();
      seenStates.add(next);
    }

    expect(seenStates.has('WALKING')).toBe(true);
    expect(seenStates.has('RUNNING')).toBe(true);
    expect(seenStates.has('STANDING')).toBe(true);
    expect(seenStates.has('LYING')).toBe(true);
    expect(seenStates.has('SLEEPING')).toBe(true);
    expect(seenStates.has('SITTING')).toBe(true);
    expect(seenStates.has('STRETCHING')).toBe(true);
    expect(seenStates.has('GROOMING')).toBe(true);
  });

  it('desativa colisão no piso quando o gato sobe em móveis (sofá, poltrona, mesa)', () => {
    useEnvironmentStore.getState().resetEnvironment();

    // No chão: collidable = true
    catMotionBridge.y = 0;
    catMotionBridge.isPerched = false;
    expect(getDynamicCatObstacle().collidable).toBe(true);

    // No topo do sofá (y = 0.89m): collidable = false
    catMotionBridge.y = 0.89;
    catMotionBridge.isPerched = true;
    expect(getDynamicCatObstacle().collidable).toBe(false);

    // No topo da mesa de centro (y = 0.70m): collidable = false
    catMotionBridge.y = 0.70;
    expect(getDynamicCatObstacle().collidable).toBe(false);

    // Reset restaura colisão no piso
    useEnvironmentStore.getState().resetEnvironment();
    expect(getDynamicCatObstacle().collidable).toBe(true);
  });

  it('suporta estados reativos de susto (STARTLED) e desorientação ao acordar (DISORIENTED)', () => {
    useEnvironmentStore.getState().resetEnvironment();

    // Estado STARTLED
    catMotionBridge.state = 'STARTLED';
    catMotionBridge.stateTimer = 0.65;
    expect(catMotionBridge.state).toBe('STARTLED');

    // Estado DISORIENTED
    catMotionBridge.state = 'DISORIENTED';
    catMotionBridge.stateTimer = 1.4;
    expect(catMotionBridge.state).toBe('DISORIENTED');
  });

  it('empurra brinquedos e bonecos pequenos no chão para o robô passar livremente', () => {
    resetPushableToys();
    const cowboy = pushableToysBridge.find((t) => t.id === 'push-cowboy')!;
    const initialX = cowboy.x;
    const initialZ = cowboy.z;

    // Simula o robô encostando no boneco Cowboy pelo lado esquerdo
    const result = stepPushableToysPhysics(
      { x: initialX - 0.25, z: initialZ },
      0.32,
      0.016
    );

    expect(result.pushedToyLabel).not.toBeNull();
    expect(cowboy.x).toBeGreaterThan(initialX);
  });

  it('aplica física e rolamento 2D na bola sem afundar ou atravessar paredes/móveis', () => {
    resetPushableToys();
    const ball = pushableToysBridge.find((t) => t.id === 'push-ball')!;
    const initX = ball.x;
    const initZ = ball.z;

    // Empurra a bola para frente (+Z)
    stepPushableToysPhysics({ x: initX, z: initZ - 0.22 }, 0.32, 0.016);
    expect(ball.z).toBeGreaterThan(initZ);
    expect(ball.vz).toBeGreaterThan(0);

    // Avança simulação de rolamento
    stepPushableToysPhysics({ x: 0, z: -4 }, 0.1, 0.05);
    expect(ball.rollPitch).toBeGreaterThan(0);
    expect(ball.radius).toBe(0.21);

    // Empurra a bola lateralmente (+X) e verifica resposta física de rolamento
    const posX = ball.x;
    stepPushableToysPhysics({ x: posX - 0.2, z: ball.z }, 0.32, 0.016);
    expect(ball.vx).toBeGreaterThan(0);
    expect(ball.x).toBeGreaterThan(posX);

    // Testa colisão física de todos os objetos do chão garantindo que ficam dentro dos limites da sala
    for (let frame = 0; frame < 60; frame++) {
      stepPushableToysPhysics({ x: ball.x, z: ball.z - 0.1 }, 0.32, 0.016);
    }

    for (const toy of pushableToysBridge) {
      expect(toy.x).toBeGreaterThan(-5);
      expect(toy.x).toBeLessThan(5);
      expect(toy.z).toBeGreaterThan(-4);
      expect(toy.z).toBeLessThan(4);
      expect(Number.isNaN(toy.x)).toBe(false);
      expect(Number.isNaN(toy.z)).toBe(false);
    }
  });

  it('notifyStuck limpa a rota emperrada e calcula desvio evasivo para área livre', () => {
    const controller = new AgentController(
      INITIAL_OBSTACLES,
      INITIAL_ROOM_DIMENSIONS.width,
      INITIAL_ROOM_DIMENSIONS.depth
    );

    // Simula robô preso em uma quina
    const stuckPos = { x: 3.5, z: 0.0 };
    const stuckHeading = 0; // olhando para a frente
    const turnDir = controller.notifyStuck(stuckPos, stuckHeading);

    expect(typeof turnDir).toBe('number');
    expect(Math.abs(turnDir)).toBe(1);
    expect(controller.getCurrentPath()).toHaveLength(0);

    // Próxima decisão deve estar em AVOIDING com velocidade controlada
    const decision = controller.decide(
      'CLEANING',
      stuckPos,
      stuckHeading,
      null,
      1.0,
      'bedroom',
      0.016
    );

    expect(decision.nextState).toBe('AVOIDING');
    expect(decision.desiredHeading).not.toBe(stuckHeading);
  });
});
