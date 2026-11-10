import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RobotModel } from './RobotModel';
import { RobotEffects } from './RobotEffects';
import { updateRobotLocomotion, type RobotLocomotionState } from './RobotAnimations';
import { robotMotionBridge, useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { AgentController } from '@/agent/AgentController';
import { clamp, distance2D } from '@/utils/math';

const PATROL_POINTS = [
  { x: -1.8, z: -1.6 },
  { x: 0.0, z: -1.3 },
  { x: 2.3, z: -1.2 },
  { x: 2.6, z: 0.9 },
  { x: 0.2, z: 1.1 },
  { x: -2.2, z: 0.8 },
];

/**
 * Ator robótico interativo.
 * Controla a movimentação contínua com interpolação de alta performance em `useFrame`,
 * sem chamar `setState` a cada frame (`perf-never-set-state-in-useframe`).
 */
export function Robot() {
  const rootRef = useRef<THREE.Group>(null);
  const patrolIdxRef = useRef(0);
  const syncTimerRef = useRef(0);

  const state = useRobotStore((s) => s.state);
  const expression = useRobotStore((s) => s.expression);
  const obstacles = useEnvironmentStore((s) => s.obstacles);
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);

  // Instância do controlador desacoplado
  const agent = useMemo(
    () => new AgentController(obstacles, roomDimensions.width, roomDimensions.depth),
    [obstacles, roomDimensions]
  );

  // Estado interno de locomoção em ref mutável
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

    let targetPoint: { x: number; z: number } | null = null;

    if (robotState.state === 'CLEANING' || robotState.state === 'EXPLORING') {
      targetPoint =
        robotState.targetPosition ??
        PATROL_POINTS[patrolIdxRef.current % PATROL_POINTS.length];
    } else if (robotState.state === 'RETURNING') {
      targetPoint = envState.dockPosition;
    }

    // Consulta de tomada de decisão autônoma do agente desacoplado
    const decision = agent.decide(
      robotState.state,
      { x: loc.x, z: loc.z },
      loc.rotationY,
      targetPoint,
      robotState.speed,
      robotState.currentRegionId,
      delta
    );

    // Se o agente detectar colisão e transicionar para desvio
    if (decision.nextState !== robotState.state && decision.nextState === 'AVOIDING') {
      robotState.setOperationalState('AVOIDING', decision.logAction);
    }

    if (targetPoint && decision.desiredSpeed > 0) {
      const currentPos = { x: loc.x, z: loc.z };
      const dist = distance2D(currentPos, targetPoint);

      if (dist < 0.22) {
        if (robotState.state === 'RETURNING') {
          loc.speed = 0;
          robotState.setOperationalState(
            'RECHARGING',
            'Acoplado na estação de carregamento'
          );
          cmdState.pushNotification(
            'Acoplamento concluído',
            'AspiToy conectado à base e recarregando bateria.',
            'success'
          );
        } else {
          if (robotState.targetPosition) {
            robotState.setTargetPosition(null);
          }
          patrolIdxRef.current = (patrolIdxRef.current + 1) % PATROL_POINTS.length;
        }
      }
    }

    // Atualiza locomoção física com base nas diretrizes do AgentController
    updateRobotLocomotion(loc, decision.desiredSpeed, decision.desiredHeading, delta);

    // Avança posição linear no plano horizontal
    if (loc.speed > 0.001) {
      loc.x = clamp(
        loc.x + Math.sin(loc.rotationY) * loc.speed * delta,
        -4.4,
        4.4
      );
      loc.z = clamp(
        loc.z + Math.cos(loc.rotationY) * loc.speed * delta,
        -3.4,
        1.5
      );
    }

    // Sincroniza com a bridge mutável de 60fps para a câmera
    robotMotionBridge.x = loc.x;
    robotMotionBridge.z = loc.z;
    robotMotionBridge.rotationY = loc.rotationY;
    robotMotionBridge.currentSpeed = loc.speed;
    robotMotionBridge.wheelSpin = loc.wheelSpin;

    // Atualiza nós Three.js diretamente
    if (rootRef.current) {
      rootRef.current.position.set(loc.x, 0, loc.z);
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
        const nextProgress = envState.cleanDustNearPoint(point, 0.65, 0.12);
        robotState.setCleaningProgress(nextProgress);
        robotState.updateBattery(-0.08);

        // Bateria crítica durante a operação -> Retorno automático à base
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
        } else if (nextProgress >= 100) {
          robotState.setOperationalState(
            'COMPLETED',
            'Limpeza da sala de estar concluída!'
          );
          cmdState.pushNotification(
            'Limpeza concluída!',
            'Todas as áreas prioritárias foram higienizadas.',
            'success'
          );
        }
      } else if (robotState.state === 'RECHARGING' && robotState.battery < 100) {
        robotState.updateBattery(0.4);
      }
    }
  });

  return (
    <group
      ref={rootRef}
      position={[robotMotionBridge.x, 0, robotMotionBridge.z]}
      rotation={[0, robotMotionBridge.rotationY, 0]}
      name="aspitoy-actor"
    >
      <RobotModel
        wheelSpin={robotMotionBridge.wheelSpin}
        pitch={locomotionRef.current.pitch}
        roll={locomotionRef.current.roll}
        bobY={Math.sin(locomotionRef.current.bobPhase) * (locomotionRef.current.speed > 0.1 ? 0.006 : 0.002)}
        bumperCompression={locomotionRef.current.bumperCompression}
        state={state}
        expression={expression}
      />
      <RobotEffects isCleaning={state === 'CLEANING'} />
    </group>
  );
}
