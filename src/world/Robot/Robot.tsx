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

const ROOM_PATROL_POINTS: Record<string, Vector2D[]> = {
  bedroom: [
    { x: -1.8, z: -0.2 },
    { x: 2.3, z: -1.1 },
    { x: -0.2, z: -2.6 },
    { x: -2.2, z: 2.2 },
    { x: 2.4, z: 1.8 },
  ],
  hallway: [
    { x: 6.3, z: -1.5 },
    { x: 6.3, z: 2.2 },
    { x: 6.3, z: 6.5 },
  ],
  'living-room': [
    { x: 10.5, z: -0.8 },
    { x: 14.5, z: -1.2 },
    { x: 11.5, z: 1.5 },
    { x: 14.8, z: 1.8 },
  ],
  kitchen: [
    { x: 10.5, z: 5.5 },
    { x: 14.5, z: 5.8 },
    { x: 12.8, z: 7.0 },
  ],
  bathroom: [
    { x: 7.2, z: 9.8 },
    { x: 8.5, z: 10.5 },
    { x: 6.8, z: 11.8 },
    { x: 8.2, z: 12.2 },
  ],
};

const GLOBAL_HOUSE_PATROL_POINTS: Vector2D[] = [
  { x: 0.0, z: 0.0 },
  { x: 6.3, z: 1.5 },
  { x: 12.0, z: -0.5 },
  { x: 12.0, z: 5.5 },
  { x: 7.8, z: 10.5 },
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

    if (
      robotState.state === 'CLEANING' ||
      robotState.state === 'EXPLORING' ||
      robotState.state === 'AVOIDING'
    ) {
      const smartDustTarget = priorityManager.selectBestTarget(
        { x: loc.x, z: loc.z },
        envState.dustSpots,
        envState.selectedRegionId,
        envState.regions,
        robotState.battery,
        envState.dockPosition
      );

      targetPoint =
        robotState.targetPosition ??
        smartDustTarget ??
        patrolPool[patrolIdxRef.current % patrolPool.length];
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
        0.31
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
        robotState.state === 'IDLE' ||
        robotState.state === 'PAUSED' ||
        robotState.state === 'RECHARGING' ||
        robotState.state === 'COMPLETED'
      ) {
        loc.speed = damp(loc.speed, 0, 16.0, delta);
        loc.pitch = damp(loc.pitch, 0, 8.0, delta);
        loc.roll = damp(loc.roll, 0, 8.0, delta);
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
          } else if (
            robotState.state === 'AVOIDING' &&
            decision.nextState === 'CLEANING'
          ) {
            robotState.setOperationalState(
              'CLEANING',
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
              patrolIdxRef.current =
                (patrolIdxRef.current + 1) % patrolPool.length;
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
          0.31
        );

        loc.x = collisionResult.position.x;
        loc.z = collisionResult.position.z;

        if (collisionResult.collided) {
          loc.bumperCompression = 0.028;
          // Amortece velocidade linear para não insistir contra o obstáculo nem girar descontroladamente
          loc.speed = damp(loc.speed, 0, 16.0, delta);
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

      if (
        robotState.state === 'CLEANING' ||
        robotState.state === 'EXPLORING' ||
        robotState.state === 'AVOIDING' ||
        manualControlBridge.active
      ) {
        const nextProgress = envState.cleanDustNearPoint(point, 0.65, 0.14);
        robotState.setCleaningProgress(nextProgress);
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
        } else if (nextProgress >= 100 && robotState.state === 'CLEANING') {
          robotState.setOperationalState(
            'COMPLETED',
            'Limpeza da residência concluída com sucesso!'
          );
          cmdState.pushNotification(
            'Limpeza concluída!',
            'Todas as áreas prioritárias da residência foram higienizadas.',
            'success'
          );
        }
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
        isCleaning={state === 'CLEANING' || manualControlBridge.active}
        isRecharging={state === 'RECHARGING'}
      />
    </group>
  );
}
