import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RobotModel } from './RobotModel';
import { RobotEffects } from './RobotEffects';
import {
  updateRobotLocomotion,
  type RobotLocomotionState,
} from './RobotAnimations';
import {
  manualControlBridge,
  robotMotionBridge,
  useRobotStore,
} from '@/store/robotStore';
import {
  getDynamicAllCatsObstacles,
  stepPushableToysPhysics,
  useEnvironmentStore,
} from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { AgentController } from '@/agent/AgentController';
import { PriorityManager } from '@/agent/decision/PriorityManager';
import { distance2D, damp } from '@/utils/math';
import type { Vector2D } from '@/types/robot';
import { soundManager } from '@/services/soundManager';

const ROOM_PATROL_POINTS: Record<string, Vector2D[]> = {
  bedroom: [
    { x: -3.5, z: 2.2 },
    { x: -3.5, z: 0.0 },
    { x: -3.5, z: -1.8 },
    { x: -2.0, z: -2.4 },
    { x: 0.0, z: -2.5 },
    { x: 2.2, z: -2.4 },
    { x: 3.0, z: -1.2 },
    { x: 3.0, z: 0.8 },
    { x: 3.0, z: 2.2 },
    { x: 1.8, z: 2.4 },
    { x: 0.0, z: 1.5 },
    { x: -2.0, z: 1.8 },
    { x: -1.4, z: 0.2 },
    { x: -0.2, z: -0.2 },
  ],
  hallway: [
    { x: 6.3, z: -3.0 },
    { x: 6.3, z: -1.0 },
    { x: 6.8, z: 0.5 },
    { x: 5.8, z: 2.3 },
    { x: 6.3, z: 4.2 },
    { x: 6.8, z: 6.0 },
    { x: 6.3, z: 7.8 },
  ],
  'living-room': [
    { x: 8.8, z: 0.5 },
    { x: 8.8, z: -1.5 },
    { x: 8.8, z: -2.6 },
    { x: 10.8, z: -2.4 },
    { x: 13.0, z: -2.4 },
    { x: 15.5, z: -2.4 },
    { x: 16.5, z: 0.0 },
    { x: 15.5, z: 2.2 },
    { x: 13.0, z: 2.3 },
    { x: 10.2, z: 1.5 },
    { x: 10.5, z: -0.6 },
  ],
  kitchen: [
    { x: 9.2, z: 4.0 },
    { x: 15.5, z: 3.4 },
    { x: 15.8, z: 5.5 },
    { x: 15.8, z: 6.6 },
    { x: 14.2, z: 6.2 },
    { x: 12.0, z: 6.2 },
    { x: 9.8, z: 6.2 },
    { x: 8.6, z: 5.8 },
    { x: 9.5, z: 4.5 },
  ],
  bathroom: [
    { x: 6.5, z: 9.4 },
    { x: 7.6, z: 9.8 },
    { x: 8.6, z: 9.8 },
    { x: 8.2, z: 10.6 },
    { x: 8.2, z: 12.0 },
    { x: 7.2, z: 11.0 },
  ],
};

const GLOBAL_HOUSE_PATROL_POINTS: Vector2D[] = [
  // Quarto
  { x: -2.0, z: 1.8 },
  { x: -3.5, z: 0.0 },
  { x: -2.0, z: -2.4 },
  { x: 2.2, z: -2.4 },
  { x: 2.8, z: 1.5 },
  // Transição para o Corredor
  { x: 4.6, z: 2.35 },
  { x: 6.3, z: 2.35 },
  { x: 6.3, z: -1.0 },
  // Sala de Estar
  { x: 8.8, z: -1.5 },
  { x: 12.5, z: -2.4 },
  { x: 15.5, z: -2.4 },
  { x: 16.5, z: 0.2 },
  { x: 13.0, z: 2.3 },
  { x: 9.5, z: 1.5 },
  // Cozinha
  { x: 9.5, z: 4.2 },
  { x: 15.5, z: 3.5 },
  { x: 15.5, z: 6.5 },
  { x: 12.0, z: 6.2 },
  { x: 8.6, z: 5.8 },
  // Corredor Sul e Banheiro
  { x: 6.3, z: 5.5 },
  { x: 6.3, z: 7.8 },
  { x: 6.5, z: 9.4 },
  { x: 8.6, z: 9.8 },
  { x: 8.2, z: 12.0 },
  { x: 7.4, z: 10.8 },
  // Retorno integrado pelo Corredor ao Quarto
  { x: 6.3, z: 5.0 },
  { x: 6.3, z: 2.35 },
  { x: 1.0, z: 0.2 },
];

/**
 * Ator robótico interativo.
 * Controla a movimentação contínua com interpolação de alta performance em `useFrame`,
 * desviando de todos os móveis fixos e também do gato dinâmico sem atravessá-los.
 */
export function Robot() {
  const rootRef = useRef<THREE.Group>(null);
  const patrolIdxRef = useRef(0);
  const syncTimerRef = useRef(0);
  const notifyCooldownRef = useRef(0);

  const state = useRobotStore((s) => s.state);
  const expression = useRobotStore((s) => s.expression);
  const obstacles = useEnvironmentStore((s) => s.obstacles);
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);

  const agent = useMemo(
    () =>
      new AgentController(
        obstacles,
        roomDimensions.width,
        roomDimensions.depth,
        roomDimensions.minX,
        roomDimensions.minZ
      ),
    [obstacles, roomDimensions]
  );

  const priorityManager = useMemo(() => new PriorityManager(), []);

  const locomotionRef = useRef<RobotLocomotionState>({
    x: robotMotionBridge.x,
    z: robotMotionBridge.z,
    rotationY: robotMotionBridge.rotationY,
    targetRotationY: robotMotionBridge.targetRotationY,
    speed: 0,
    wheelSpin: 0,
    bobPhase: 0,
    pitch: 0,
    roll: 0,
    bumperCompression: 0,
  });

  // Mecanismo anti-trava inteligente: detecta emperramento em quinas/batentes e executa desengate automático (ré + giro)
  const unstuckRef = useRef<{
    phase: 'IDLE' | 'REVERSE' | 'TURN';
    stuckTimer: number;
    phaseTimer: number;
    turnDirection: number;
  }>({
    phase: 'IDLE',
    stuckTimer: 0,
    phaseTimer: 0,
    turnDirection: 1,
  });

  // Alvo de cobertura dinâmica e memória de variação para 100% de área higienizada
  const coverageGoalRef = useRef<Vector2D | null>(null);
  const coverageTimerRef = useRef(0);
  const patrolReverseRef = useRef(false);
  const laneVariationIdxRef = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const loc = locomotionRef.current;
    const robotState = useRobotStore.getState();
    const envState = useEnvironmentStore.getState();
    const cmdState = useCommandStore.getState();

    if (notifyCooldownRef.current > 0) {
      notifyCooldownRef.current -= delta;
    }

    // Sincroniza posição caso o robô tenha sido resetado
    if (
      robotState.state === 'IDLE' &&
      distance2D({ x: loc.x, z: loc.z }, robotState.position) > 0.5
    ) {
      loc.x = robotMotionBridge.x;
      loc.z = robotMotionBridge.z;
      loc.rotationY = robotMotionBridge.rotationY;
    }

    const selectedId = envState.selectedRegionId;
    const patrolPool =
      selectedId !== 'all' && ROOM_PATROL_POINTS[selectedId]
        ? ROOM_PATROL_POINTS[selectedId]
        : GLOBAL_HOUSE_PATROL_POINTS;

    let targetPoint: { x: number; z: number } | null = null;
    const isManualPointToPoint =
      robotState.state === 'PAUSED' && robotState.targetPosition !== null;

    if (
      robotState.state === 'CLEANING' ||
      robotState.state === 'EXPLORING' ||
      robotState.state === 'AVOIDING' ||
      isManualPointToPoint
    ) {
      if (isManualPointToPoint) {
        targetPoint = robotState.targetPosition;
      } else {
        coverageTimerRef.current += delta;
        const currentPos = { x: loc.x, z: loc.z };

        // Atualiza o alvo de cobertura inteligente quando o anterior foi atingido ou expirou (> 7.5s)
        const distToCoverage = coverageGoalRef.current
          ? distance2D(currentPos, coverageGoalRef.current)
          : 0;

        if (!coverageGoalRef.current || distToCoverage < 0.38 || coverageTimerRef.current > 7.5) {
          coverageTimerRef.current = 0;
          coverageGoalRef.current = agent.findBestCoverageTarget(currentPos, selectedId);
        }

        const smartDustTarget = priorityManager.selectBestTarget(
          currentPos,
          envState.dustSpots,
          envState.selectedRegionId,
          envState.regions,
          robotState.battery,
          envState.dockPosition,
          coverageGoalRef.current
        );

        if (robotState.targetPosition) {
          targetPoint = robotState.targetPosition;
        } else if (smartDustTarget) {
          targetPoint = smartDustTarget;
        } else {
          // Modo patrulha / varredura com variação contínua de faixas e alternância de sentido
          const poolLen = patrolPool.length;
          const rawIdx = patrolIdxRef.current % poolLen;
          const effectiveIdx = patrolReverseRef.current ? poolLen - 1 - rawIdx : rawIdx;
          const basePoint = patrolPool[effectiveIdx];

          // Variação de faixas (boustrophedon sweep lane variation): micro-deslocamento suave para cobrir 100% da área
          const laneOffset = ((laneVariationIdxRef.current % 3) - 1) * 0.12;
          targetPoint = {
            x: basePoint.x + laneOffset,
            z: basePoint.z + (laneVariationIdxRef.current % 2 === 0 ? 0.08 : -0.08),
          };
        }
      }
    } else if (robotState.state === 'RETURNING') {
      targetPoint = envState.dockPosition;
    }

    // Obstáculos dinâmicos em tempo real dos gatos (Laranja e Branco) andando/dormindo pela casa
    const dynamicCats = getDynamicAllCatsObstacles();

    if (manualControlBridge.active) {
      // Controle manual direto (WASD / Setas / D-Pad)
      agent.setDynamicObstacles(dynamicCats);
      const manualTurn = manualControlBridge.turn * 3.2 * delta;
      loc.rotationY += manualTurn;
      loc.targetRotationY = loc.rotationY;

      // Velocidade do controle manual: frente positiva, ré negativa suave
      const targetManualSpeed = manualControlBridge.forward * robotState.speed;
      loc.speed = damp(
        loc.speed,
        targetManualSpeed,
        Math.abs(targetManualSpeed) > 0.05 ? 8.0 : 12.0,
        delta
      );

      // Giro visual das rodas e oscilação orgânica do modelo
      const wheelRadius = 0.045;
      const linearDist = loc.speed * delta;
      loc.wheelSpin += linearDist / wheelRadius;
      if (Math.abs(loc.speed) > 0.05 || Math.abs(manualControlBridge.turn) > 0) {
        loc.bobPhase += delta * 10.0;
        loc.pitch = damp(loc.pitch, loc.speed * 0.03, 6.0, delta);
        loc.roll = damp(loc.roll, -manualControlBridge.turn * 0.04, 7.0, delta);
      } else {
        loc.pitch = damp(loc.pitch, 0, 6.0, delta);
        loc.roll = damp(loc.roll, 0, 7.0, delta);
      }

      // Direção do deslocamento: para a frente do visor (sen/cos de rotationY)
      const desiredX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
      const desiredZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;

      const collisionResult = agent.resolveSafeMovement(
        { x: loc.x, z: loc.z },
        { x: desiredX, z: desiredZ },
        0.29
      );

      loc.x = collisionResult.position.x;
      loc.z = collisionResult.position.z;
      if (collisionResult.collided) {
        loc.bumperCompression = 0.028;
      }
    } else {
      // Quando não há controle manual ativo:
      // Se o robô estiver em repouso (IDLE, PAUSED, RECHARGING ou COMPLETED), garante parada imediata sem movimentação autônoma
      if (
        (robotState.state === 'IDLE' ||
          robotState.state === 'PAUSED' ||
          robotState.state === 'RECHARGING' ||
          robotState.state === 'COMPLETED') &&
        !isManualPointToPoint
      ) {
        unstuckRef.current.phase = 'IDLE';
        unstuckRef.current.stuckTimer = 0;
        loc.speed = damp(loc.speed, 0, 16.0, delta);
        loc.pitch = damp(loc.pitch, 0, 8.0, delta);
        loc.roll = damp(loc.roll, 0, 8.0, delta);
      } else {
        const unstuck = unstuckRef.current;

        // Manobra de desengate anti-trava ativa: marcha a ré e giro evasivo
        if (unstuck.phase === 'REVERSE') {
          unstuck.phaseTimer -= delta;
          loc.speed = damp(loc.speed, -0.30, 14.0, delta);
          const wheelRadius = 0.045;
          loc.wheelSpin += (loc.speed * delta) / wheelRadius;
          loc.pitch = damp(loc.pitch, -0.02, 6.0, delta);
          loc.roll = damp(loc.roll, 0, 7.0, delta);

          const revX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
          const revZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;
          const revResult = agent.resolveSafeMovement(
            { x: loc.x, z: loc.z },
            { x: revX, z: revZ },
            0.29
          );
          loc.x = revResult.position.x;
          loc.z = revResult.position.z;

          if (unstuck.phaseTimer <= 0) {
            unstuck.phase = 'TURN';
            unstuck.phaseTimer = 0.38;
          }
        } else if (unstuck.phase === 'TURN') {
          unstuck.phaseTimer -= delta;
          loc.speed = damp(loc.speed, 0, 16.0, delta);
          loc.rotationY += unstuck.turnDirection * 3.4 * delta;
          loc.targetRotationY = loc.rotationY;
          loc.pitch = damp(loc.pitch, 0, 6.0, delta);
          loc.roll = damp(loc.roll, -unstuck.turnDirection * 0.03, 7.0, delta);

          if (unstuck.phaseTimer <= 0) {
            unstuck.phase = 'IDLE';
            unstuck.stuckTimer = 0;
            agent.notifyStuck({ x: loc.x, z: loc.z }, loc.rotationY);
          }
        } else {
          // Consulta de tomada de decisão autônoma do agente desacoplado (somente se em CLEANING, EXPLORING, RETURNING ou AVOIDING)
          const decision = agent.decide(
            robotState.state,
            { x: loc.x, z: loc.z },
            loc.rotationY,
            targetPoint,
            robotState.speed,
            envState.selectedRegionId,
            delta,
            dynamicCats
          );

          if (decision.nextState !== robotState.state) {
            if (decision.nextState === 'AVOIDING') {
              loc.bumperCompression = 0.024;
              robotState.setOperationalState('AVOIDING', decision.logAction);
              if (
                decision.detectedObstacleLabel === 'Gato Laranja' &&
                notifyCooldownRef.current <= 0
              ) {
                notifyCooldownRef.current = 4.5;
                cmdState.pushNotification(
                  'Gato no caminho!',
                  'O AspiToy detectou o gato pela casa e recalculou a rota para não incomodá-lo.',
                  'warning'
                );
              }
            } else if (robotState.state === 'AVOIDING') {
              const resumeState =
                robotState.previousActiveState === 'PAUSED' || isManualPointToPoint
                  ? 'PAUSED'
                  : decision.nextState;
              robotState.setOperationalState(
                resumeState,
                'Trajetória livre retomada após desvio'
              );
            }
          }

          if (targetPoint && decision.desiredSpeed > 0) {
            const currentPos = { x: loc.x, z: loc.z };
            const planned = decision.plannedPath;
            const effectiveTarget =
              planned && planned.length > 0
                ? planned[planned.length - 1]
                : targetPoint;
            const dist = Math.min(
              distance2D(currentPos, targetPoint),
              distance2D(currentPos, effectiveTarget)
            );

            if (dist < 0.28) {
              if (robotState.state === 'RETURNING') {
                loc.speed = 0;
                loc.x = envState.dockPosition.x;
                loc.z = envState.dockPosition.z;
                loc.rotationY = Math.PI / 2;
                loc.targetRotationY = Math.PI / 2;
                robotState.setTargetPosition(null);
                robotState.setOperationalState(
                  'RECHARGING',
                  'Acoplado na estação de carregamento'
                );
                cmdState.pushNotification(
                  'Acoplamento concluído',
                  'AspiToy conectado à base e recarregando bateria.',
                  'success'
                );
              } else if (isManualPointToPoint) {
                loc.speed = 0;
                robotState.setTargetPosition(null);
                robotState.setOperationalState(
                  'PAUSED',
                  'Chegou ao ponto selecionado. Limpeza permanece pausada.'
                );
              } else if (
                robotState.state === 'EXPLORING' &&
                robotState.targetPosition !== null
              ) {
                loc.speed = 0;
                robotState.setTargetPosition(null);
                robotState.setOperationalState(
                  'IDLE',
                  'Chegou ao ponto selecionado no chão'
                );
              } else {
                if (robotState.targetPosition) {
                  robotState.setTargetPosition(null);
                }
                const nextIdx = patrolIdxRef.current + 1;
                if (nextIdx >= patrolPool.length) {
                  patrolIdxRef.current = 0;
                  patrolReverseRef.current = !patrolReverseRef.current;
                  laneVariationIdxRef.current = (laneVariationIdxRef.current + 1) % 6;
                } else {
                  patrolIdxRef.current = nextIdx;
                }
                coverageGoalRef.current = null;
              }
            }
          }

          // Atualiza locomoção física com base nas diretrizes do AgentController
          updateRobotLocomotion(
            loc,
            decision.desiredSpeed,
            decision.desiredHeading,
            delta
          );

          // Avança posição linear com resolução física de colisão contra TODOS os objetos e o gato
          const desiredX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
          const desiredZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;

          const collisionResult = agent.resolveSafeMovement(
            { x: loc.x, z: loc.z },
            { x: desiredX, z: desiredZ },
            0.29
          );

          const actualMovedDist = Math.hypot(
            collisionResult.position.x - loc.x,
            collisionResult.position.z - loc.z
          );
          const expectedDist = Math.max(0.0001, Math.abs(loc.speed) * delta);

          loc.x = collisionResult.position.x;
          loc.z = collisionResult.position.z;

          if (collisionResult.collided) {
            loc.bumperCompression = 0.028;
            // Se o robô estiver efetivamente bloqueado sem conseguir deslizar, amortece a velocidade
            if (actualMovedDist < expectedDist * 0.25) {
              loc.speed = damp(loc.speed, 0, 14.0, delta);
            } else {
              // Se estiver deslizando suavemente pela quina/parede, preserva o avanço
              loc.speed = damp(loc.speed, loc.speed * 0.88, 3.5, delta);
            }
          }

          // Monitoramento anti-trava inteligente: se estiver bloqueado em quina ou batente
          const isTryingToAdvance = decision.desiredSpeed > 0.08;
          const isBlocked =
            collisionResult.collided && actualMovedDist < expectedDist * 0.30;

          if (isTryingToAdvance && isBlocked) {
            unstuck.stuckTimer += delta;
            if (unstuck.stuckTimer > 0.65) {
              // Dispara manobra de desengate inteligente: ré para descolar + giro evasivo
              unstuck.phase = 'REVERSE';
              unstuck.phaseTimer = 0.35;
              unstuck.turnDirection = agent.notifyStuck(
                { x: loc.x, z: loc.z },
                loc.rotationY
              );
              loc.bumperCompression = 0.035;
            }
          } else if (actualMovedDist > 0.015) {
            unstuck.stuckTimer = Math.max(0, unstuck.stuckTimer - delta * 2.0);
          }
        }
      }
    }

    // Empurra objetos e brinquedos pequenos no chão caso estejam na frente do robô
    const pushResult = stepPushableToysPhysics(
      { x: loc.x, z: loc.z },
      0.32,
      delta
    );
    if (pushResult.pushedToyLabel) {
      loc.bumperCompression = Math.max(loc.bumperCompression, 0.015);
    }

    // Mantém o robô perfeitamente acoplado no centro da base enquanto recarrega
    if (robotState.state === 'RECHARGING') {
      loc.x = envState.dockPosition.x;
      loc.z = envState.dockPosition.z;
      loc.speed = 0;
      loc.rotationY = Math.PI / 2;
    }

    // Sincroniza com a bridge mutável de 60fps para a câmera e o gato
    robotMotionBridge.x = loc.x;
    robotMotionBridge.z = loc.z;
    robotMotionBridge.rotationY = loc.rotationY;
    robotMotionBridge.currentSpeed = loc.speed;
    robotMotionBridge.wheelSpin = loc.wheelSpin;

    // Sincroniza áudio procedural do motor do aspirador em tempo real (somente quando higienização está ativa)
    const isOperating =
      robotState.state === 'CLEANING' && Math.abs(loc.speed) > 0.03;
    soundManager.setMotorOperating(isOperating, Math.abs(loc.speed));

    // Altura vertical do piso: sobre a base de recarga (y = 0.04m) ou sobre o tapete (y = 0.023m)
    const dockDist = Math.hypot(loc.x - (-4.15), loc.z - 3.2);
    let floorY = 0.0;
    if (robotState.state === 'RECHARGING' || dockDist < 0.35) {
      floorY = 0.04;
    } else {
      const rugDist = Math.hypot(loc.x - (-0.75), loc.z - (-1.1));
      if (rugDist < 1.85) {
        floorY = 0.023;
      } else if (rugDist < 1.98) {
        floorY = 0.023 * ((1.98 - rugDist) / 0.13);
      }
    }

    // Atualiza nós Three.js diretamente
    if (rootRef.current) {
      rootRef.current.position.set(loc.x, floorY, loc.z);
      rootRef.current.rotation.y = loc.rotationY;
    }

    // Telemetria sincronizada com o React a cada 250ms (~4 Hz)
    syncTimerRef.current += delta;
    if (syncTimerRef.current >= 0.25) {
      syncTimerRef.current = 0;
      const point = { x: loc.x, z: loc.z };
      const region = envState.resolveRegionAtPoint(point);
      robotState.syncTelemetryFromBridge(region.id, region.label);

      if (robotState.state === 'CLEANING') {
        envState.cleanDustNearPoint(point, 0.65, 0.14);
        robotState.updateBattery(-0.08);

        if (robotState.battery <= 18) {
          robotState.setTargetPosition(envState.dockPosition);
          robotState.setOperationalState(
            'RETURNING',
            'Bateria baixa (18%). Retornando automaticamente à base de recarga.'
          );
          cmdState.pushNotification(
            'Bateria baixa',
            'Nível crítico. Retorno automático à base acionado pelo agente.',
            'warning'
          );
        }
      } else if (
        manualControlBridge.active ||
        isManualPointToPoint ||
        robotState.state === 'EXPLORING'
      ) {
        // Deslocamento manual ou navegação sem sucção consome menos bateria e não aspira poeira
        robotState.updateBattery(-0.02);
      } else if (
        robotState.state === 'RECHARGING' &&
        robotState.battery < 100
      ) {
        robotState.updateBattery(0.4);
      }
    }
  });

  return (
    <group
      ref={rootRef}
      position={[robotMotionBridge.x, 0.04, robotMotionBridge.z]}
      rotation={[0, robotMotionBridge.rotationY, 0]}
      name="aspitoy-actor"
    >
      <RobotModel
        wheelSpin={robotMotionBridge.wheelSpin}
        pitch={locomotionRef.current.pitch}
        roll={locomotionRef.current.roll}
        bobY={
          Math.sin(locomotionRef.current.bobPhase) *
          (locomotionRef.current.speed > 0.1 ? 0.006 : 0.002)
        }
        bumperCompression={locomotionRef.current.bumperCompression}
        state={state}
        expression={expression}
      />
      <RobotEffects
        isCleaning={state === 'CLEANING'}
        isRecharging={state === 'RECHARGING'}
      />
    </group>
  );
}
