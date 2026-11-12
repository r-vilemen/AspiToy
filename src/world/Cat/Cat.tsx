import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  catMotionBridge,
  useEnvironmentStore,
} from '@/store/environmentStore';
import { robotMotionBridge } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { ObstacleDetector } from '@/agent/navigation/ObstacleDetector';
import type { CatBehaviorState } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { clamp, damp, dampAngle, distance2D, lerp } from '@/utils/math';

const catMaterials = {
  furOrange: new THREE.MeshStandardMaterial({
    color: '#DC6E29',
    roughness: 0.78,
    metalness: 0.02,
  }),
  furStripe: new THREE.MeshStandardMaterial({
    color: '#9C3E11',
    roughness: 0.82,
    metalness: 0.02,
  }),
  furCream: new THREE.MeshStandardMaterial({
    color: '#F6F0E2',
    roughness: 0.76,
    metalness: 0.02,
  }),
  furWhite: new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.72,
    metalness: 0.01,
  }),
  nosePink: new THREE.MeshStandardMaterial({
    color: '#F28B82',
    roughness: 0.45,
    metalness: 0.04,
  }),
  eyeAwake: new THREE.MeshBasicMaterial({
    color: '#C97A24', // Olhos caramelo quentes
  }),
  eyePupil: new THREE.MeshBasicMaterial({
    color: '#171412',
  }),
  zzzMat: new THREE.MeshBasicMaterial({
    color: '#FFFBEB',
  }),
  frightExclamation: new THREE.MeshBasicMaterial({
    color: '#EF4444',
  }),
  dizzyStar: new THREE.MeshBasicMaterial({
    color: '#FBBF24',
  }),
};

import {
  ALL_HOUSE_CAT_PERCHES,
  pickWeightedCatFloorDestination,
  pickWeightedCatPerch,
  planCatRoute,
  type FurniturePerchSpot,
} from './catNavigation';

export type { FurniturePerchSpot };

const FLOOR_CAT_STATES: CatBehaviorState[] = [
  'WALKING',
  'RUNNING',
  'STANDING',
  'SITTING',
  'STRETCHING',
  'GROOMING',
  'LYING',
  'SLEEPING',
];

const PERCHED_CAT_STATES: CatBehaviorState[] = [
  'SITTING',
  'STANDING',
  'GROOMING',
  'STRETCHING',
  'LYING',
  'SLEEPING',
];

function pickRandomState(pool: CatBehaviorState[], current: CatBehaviorState): CatBehaviorState {
  const candidates = pool.filter((s) => s !== current);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

/**
 * Gato Doméstico Autônomo com Comportamentos Felinos Completos:
 * - Anda, corre, fica em pé, senta, alonga-se, toma banho de gato, deita e dorme.
 * - Sobe e desce de móveis (Sofá, Poltrona, Pufe, Mesa de Centro) com saltos parabólicos 3D.
 * - Reatividade ao Robô:
 *   1. Se o robô aproxima-se e o gato está vendo -> sai calmamente da frente andando.
 *   2. Se o robô aproxima-se e o gato NÃO está vendo -> toma um susto daqueles (salto vertical com dorso arqueado) e sai em disparada correndo!
 *   3. Se o robô bate no gato enquanto ele está dormindo -> acorda todo desnorteado (com estrelinhas/balançando a cabeça atordoado) e sai da frente andando.
 */
export function Cat() {
  const rootRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const legFLRef = useRef<THREE.Group>(null);
  const legFRRef = useRef<THREE.Group>(null);
  const legBLRef = useRef<THREE.Group>(null);
  const legBRRef = useRef<THREE.Group>(null);
  const eyesAwakeRef = useRef<THREE.Group>(null);
  const eyesClosedRef = useRef<THREE.Group>(null);
  const zzzGroupRef = useRef<THREE.Group>(null);
  const frightBadgeRef = useRef<THREE.Group>(null);
  const dizzyGroupRef = useRef<THREE.Group>(null);

  const syncTimerRef = useRef(0);
  const climbingTargetPerchRef = useRef<FurniturePerchSpot | null>(null);
  const perchCyclesRemainingRef = useRef(0);
  const startleCooldownRef = useRef(0);
  const outsideBedroomStepsRef = useRef(0);
  const waypointQueueRef = useRef<Vector2D[]>([]);
  const walkPhaseRef = useRef(0);
  const legActivityRef = useRef(0);
  const blockedTimerRef = useRef(0);

  const obstacles = useEnvironmentStore((s) => s.obstacles);
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);

  const catObstacleDetector = useMemo(
    () =>
      new ObstacleDetector(
        obstacles,
        roomDimensions.width,
        roomDimensions.depth
      ),
    [obstacles, roomDimensions]
  );

  const pickFreeFloorTarget = (): Vector2D => {
    const { target, targetRoom } = pickWeightedCatFloorDestination(
      catObstacleDetector,
      outsideBedroomStepsRef.current
    );
    if (targetRoom === 'bedroom') {
      outsideBedroomStepsRef.current = 0;
    } else {
      outsideBedroomStepsRef.current += 1;
    }
    const currentPos = { x: catMotionBridge.x, z: catMotionBridge.z };
    const route = planCatRoute(currentPos, target);
    waypointQueueRef.current = route;
    return waypointQueueRef.current.shift() || target;
  };

  const startJump = (
    start: { x: number; y: number; z: number },
    end: { x: number; y: number; z: number },
    duration = 0.65,
    arcHeight = 0.38
  ) => {
    catMotionBridge.state = 'JUMPING';
    catMotionBridge.jumpStart = { ...start };
    catMotionBridge.jumpEnd = { ...end };
    catMotionBridge.jumpProgress = 0;
    catMotionBridge.jumpDuration = duration;
    catMotionBridge.jumpArcHeight = arcHeight;
    catMotionBridge.stateTimer = duration;

    const heading = Math.atan2(end.x - start.x, end.z - start.z);
    catMotionBridge.targetRotationY = heading;
    catMotionBridge.rotationY = heading;
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    catMotionBridge.animPhase += delta;
    catMotionBridge.stateTimer -= delta;
    startleCooldownRef.current -= delta;

    // Invariante de piso: quando o gato não está empoleirado nem saltando, seu Y no chão é ESTRITAMENTE 0
    if (!catMotionBridge.isPerched && catMotionBridge.state !== 'STARTLED' && catMotionBridge.state !== 'JUMPING') {
      catMotionBridge.y = 0;
    }

    // ================================================================
    // INTERAÇÃO REATIVA COM O ROBÔ (SUSTO, DESVIO E ACORDAR DESNORTEADO)
    // ================================================================
    if (!catMotionBridge.isPerched && (catMotionBridge.y ?? 0) < 0.25) {
      const distToRobot = Math.hypot(
        robotMotionBridge.x - catMotionBridge.x,
        robotMotionBridge.z - catMotionBridge.z
      );

      // CASO 1: Robô bate no gato enquanto ele está dormindo
      if (
        catMotionBridge.state === 'SLEEPING' &&
        distToRobot < 0.58 &&
        startleCooldownRef.current <= 0
      ) {
        startleCooldownRef.current = 3.5;
        catMotionBridge.state = 'DISORIENTED';
        catMotionBridge.stateTimer = 1.4;
        catMotionBridge.speed = 0;

        useCommandStore
          .getState()
          .pushNotification(
            'Gato Acordado!',
            'O AspiToy esbarrou no gato dormindo! Ele acordou todo desnorteado e vai sair da frente.',
            'info'
          );
      }
      // CASO 2: Robô aproxima-se do gato acordado no chão
      else if (
        catMotionBridge.state !== 'JUMPING' &&
        catMotionBridge.state !== 'STARTLED' &&
        catMotionBridge.state !== 'DISORIENTED' &&
        catMotionBridge.state !== 'SLEEPING' &&
        distToRobot < 0.88 &&
        startleCooldownRef.current <= 0
      ) {
        // Cálculo do campo de visão felino (FOV)
        const catDirX = Math.sin(catMotionBridge.rotationY);
        const catDirZ = Math.cos(catMotionBridge.rotationY);
        const toRobX = robotMotionBridge.x - catMotionBridge.x;
        const toRobZ = robotMotionBridge.z - catMotionBridge.z;
        const dot = (catDirX * toRobX + catDirZ * toRobZ) / (distToRobot || 1);

        const seesRobot = dot > 0.25; // Dentro do campo frontal visual

        if (!seesRobot && distToRobot < 0.76) {
          // Gato NÃO estava vendo o robô se aproximar -> TOMA SUSTO!
          startleCooldownRef.current = 3.2;
          catMotionBridge.state = 'STARTLED';
          catMotionBridge.stateTimer = 0.65;
          catMotionBridge.speed = 0;

          const toRobotAngle = Math.atan2(toRobX, toRobZ);
          catMotionBridge.targetRotationY = toRobotAngle;

          useCommandStore
            .getState()
            .pushNotification(
              'Gato Assustado!',
              'O robô veio por trás e o gato levou um susto daqueles!',
              'warning'
            );
        } else if (seesRobot && distToRobot < 0.85) {
          // Gato ESTÁ VENDO o robô se aproximar -> sai calmamente da frente andando
          startleCooldownRef.current = 1.6;
          catMotionBridge.state = 'WALKING';
          catMotionBridge.speed = 0.95;

          const escapeTarget = pickFreeFloorTarget();
          const walkAwayAngle = Math.atan2(
            escapeTarget.x - catMotionBridge.x,
            escapeTarget.z - catMotionBridge.z
          );

          catMotionBridge.rotationY = walkAwayAngle;
          catMotionBridge.targetRotationY = walkAwayAngle;
          catMotionBridge.targetX = escapeTarget.x;
          catMotionBridge.targetZ = escapeTarget.z;
          catMotionBridge.stateTimer = 3.5;
        }
      }
    }

    // ================================================================
    // MÁQUINA DE ESTADOS DO GATO (CHÃO, SUBIR EM MÓVEIS, POLEIRO, DESCER)
    // ================================================================
    if (catMotionBridge.state === 'JUMPING') {
      const duration = catMotionBridge.jumpDuration || 0.65;
      catMotionBridge.jumpProgress = clamp(
        (catMotionBridge.jumpProgress ?? 0) + delta / duration,
        0,
        1
      );

      const p = catMotionBridge.jumpProgress;
      const smoothP = p * p * (3 - 2 * p);
      const start = catMotionBridge.jumpStart ?? {
        x: catMotionBridge.x,
        y: catMotionBridge.y,
        z: catMotionBridge.z,
      };
      const end = catMotionBridge.jumpEnd ?? {
        x: catMotionBridge.x,
        y: catMotionBridge.y,
        z: catMotionBridge.z,
      };

      catMotionBridge.x = lerp(start.x, end.x, smoothP);
      catMotionBridge.z = lerp(start.z, end.z, smoothP);
      const baseHeight = lerp(start.y, end.y, smoothP);
      const arc = Math.sin(p * Math.PI) * (catMotionBridge.jumpArcHeight ?? 0.38);
      catMotionBridge.y = baseHeight + arc;

      // Pouso concluído
      if (p >= 1) {
        catMotionBridge.x = end.x;
        catMotionBridge.y = end.y;
        catMotionBridge.z = end.z;
        catMotionBridge.jumpProgress = 1;

        if (end.y > 0.3) {
          catMotionBridge.isPerched = true;
          perchCyclesRemainingRef.current = 2 + Math.floor(Math.random() * 3);
          const nextState = pickRandomState(
            ['SITTING', 'STANDING', 'GROOMING', 'LYING', 'SLEEPING'],
            'STANDING'
          );
          catMotionBridge.state = nextState;
          catMotionBridge.stateTimer = 5.0 + Math.random() * 4.5;
        } else {
          catMotionBridge.isPerched = false;
          catMotionBridge.perchSurfaceId = null;
          climbingTargetPerchRef.current = null;
          catMotionBridge.y = 0;
          catMotionBridge.state = 'STANDING';
          catMotionBridge.stateTimer = 3.5 + Math.random() * 3.0;
        }

        useEnvironmentStore
          .getState()
          .setCatTelemetry(catMotionBridge.state, {
            x: catMotionBridge.x,
            z: catMotionBridge.z,
          });
      }
    } else if (catMotionBridge.state === 'STARTLED') {
      if (catMotionBridge.stateTimer <= 0) {
        // Após o susto vertical, sai em disparada correndo para longe do robô!
        const escapeAngle = Math.atan2(
          catMotionBridge.x - robotMotionBridge.x,
          catMotionBridge.z - robotMotionBridge.z
        );
        catMotionBridge.state = 'RUNNING';
        catMotionBridge.rotationY = escapeAngle;
        catMotionBridge.targetRotationY = escapeAngle;
        catMotionBridge.speed = 1.85;

        const escapeTarget = pickFreeFloorTarget();
        catMotionBridge.targetX = escapeTarget.x;
        catMotionBridge.targetZ = escapeTarget.z;
        catMotionBridge.stateTimer = 3.5;
      }
    } else if (catMotionBridge.state === 'DISORIENTED') {
      if (catMotionBridge.stateTimer <= 0) {
        // Após acordar desnorteado, sai da frente andando
        const walkAwayAngle = Math.atan2(
          catMotionBridge.x - robotMotionBridge.x,
          catMotionBridge.z - robotMotionBridge.z
        );
        catMotionBridge.state = 'WALKING';
        catMotionBridge.rotationY = walkAwayAngle;
        catMotionBridge.targetRotationY = walkAwayAngle;
        catMotionBridge.speed = 0.68;

        const altTarget = pickFreeFloorTarget();
        catMotionBridge.targetX = altTarget.x;
        catMotionBridge.targetZ = altTarget.z;
        catMotionBridge.stateTimer = 5.0;
      }
    } else if (catMotionBridge.stateTimer <= 0) {
      if (catMotionBridge.isPerched) {
        // Gato está no topo de um móvel
        perchCyclesRemainingRef.current -= 1;

        if (perchCyclesRemainingRef.current <= 0) {
          const perch = ALL_HOUSE_CAT_PERCHES.find(
            (p) => p.id === catMotionBridge.perchSurfaceId
          ) ?? ALL_HOUSE_CAT_PERCHES[0];

          startJump(
            { x: catMotionBridge.x, y: catMotionBridge.y, z: catMotionBridge.z },
            { x: perch.stagingPoint.x, y: 0, z: perch.stagingPoint.z },
            0.55,
            0.18
          );
        } else {
          const nextState = pickRandomState(
            PERCHED_CAT_STATES,
            catMotionBridge.state
          );
          catMotionBridge.state = nextState;

          if (nextState === 'SLEEPING') {
            catMotionBridge.stateTimer = 9.0 + Math.random() * 6.0;
          } else if (nextState === 'LYING') {
            catMotionBridge.stateTimer = 7.0 + Math.random() * 4.0;
          } else if (nextState === 'STRETCHING') {
            catMotionBridge.stateTimer = 3.5 + Math.random() * 1.5;
          } else if (nextState === 'GROOMING') {
            catMotionBridge.stateTimer = 5.0 + Math.random() * 3.0;
          } else {
            catMotionBridge.stateTimer = 4.5 + Math.random() * 3.0;
          }
        }
      } else {
        // Gato está no chão - probabilidade comedida e realista de subir em móvel (~15%)
        const wantsToClimb = Math.random() < 0.15 && !climbingTargetPerchRef.current;

        if (wantsToClimb) {
          const chosenPerch = pickWeightedCatPerch(outsideBedroomStepsRef.current);
          if (chosenPerch.room === 'bedroom') {
            outsideBedroomStepsRef.current = 0;
          } else {
            outsideBedroomStepsRef.current += 1;
          }
          climbingTargetPerchRef.current = chosenPerch;
          const currentPos = { x: catMotionBridge.x, z: catMotionBridge.z };
          const route = planCatRoute(currentPos, chosenPerch.stagingPoint);
          waypointQueueRef.current = route;
          const nextTarget = waypointQueueRef.current.shift() || chosenPerch.stagingPoint;
          catMotionBridge.targetX = nextTarget.x;
          catMotionBridge.targetZ = nextTarget.z;
          catMotionBridge.state = 'WALKING';
          catMotionBridge.stateTimer = 10.0;
        } else {
          const nextState = pickRandomState(
            FLOOR_CAT_STATES,
            catMotionBridge.state
          );
          catMotionBridge.state = nextState;

          if (nextState === 'WALKING') {
            catMotionBridge.stateTimer = 5.5 + Math.random() * 4.0;
            const target = pickFreeFloorTarget();
            catMotionBridge.targetX = target.x;
            catMotionBridge.targetZ = target.z;
          } else if (nextState === 'RUNNING') {
            catMotionBridge.stateTimer = 3.5 + Math.random() * 2.5;
            const target = pickFreeFloorTarget();
            catMotionBridge.targetX = target.x;
            catMotionBridge.targetZ = target.z;
          } else if (nextState === 'STANDING') {
            catMotionBridge.stateTimer = 3.5 + Math.random() * 2.5;
          } else if (nextState === 'SITTING') {
            catMotionBridge.stateTimer = 4.5 + Math.random() * 3.5;
          } else if (nextState === 'STRETCHING') {
            catMotionBridge.stateTimer = 3.0 + Math.random() * 1.5;
          } else if (nextState === 'GROOMING') {
            catMotionBridge.stateTimer = 4.5 + Math.random() * 3.0;
          } else if (nextState === 'LYING') {
            catMotionBridge.stateTimer = 5.5 + Math.random() * 3.5;
          } else {
            // SLEEPING
            catMotionBridge.stateTimer = 7.0 + Math.random() * 5.0;
          }
        }
      }

      useEnvironmentStore
        .getState()
        .setCatTelemetry(catMotionBridge.state, {
          x: catMotionBridge.x,
          z: catMotionBridge.z,
        });
    }

    // ================================================================
    // MOVIMENTAÇÃO ESPACIAL E DESVIO DE OBSTÁCULOS
    // ================================================================
    const state = catMotionBridge.state;
    const isMovingState =
      state === 'WALKING' || state === 'RUNNING';

    const targetSpeed =
      state === 'RUNNING' ? 1.85 : state === 'WALKING' ? 0.68 : 0;
    catMotionBridge.speed = damp(catMotionBridge.speed, targetSpeed, 6.0, delta);

    if (isMovingState) {
      const currentPos = { x: catMotionBridge.x, z: catMotionBridge.z };
      const targetPos = {
        x: catMotionBridge.targetX,
        z: catMotionBridge.targetZ,
      };
      const dist = distance2D(currentPos, targetPos);

      // Checa se estava a caminho de um móvel para subir
      if (climbingTargetPerchRef.current && !catMotionBridge.isPerched) {
        if (dist < 0.42) {
          if (waypointQueueRef.current.length > 0) {
            const nextTarget = waypointQueueRef.current.shift()!;
            catMotionBridge.targetX = nextTarget.x;
            catMotionBridge.targetZ = nextTarget.z;
          } else {
            const perch = climbingTargetPerchRef.current;
            climbingTargetPerchRef.current = null;
            catMotionBridge.perchSurfaceId = perch.id;

            const landingTarget =
              perch.perchWaypoints[
                Math.floor(Math.random() * perch.perchWaypoints.length)
              ] ?? { x: perch.stagingPoint.x, z: perch.stagingPoint.z };

            useCommandStore
              .getState()
              .pushNotification(
                'Gato Laranja',
                `O gato laranja subiu no(a) ${perch.name}!`,
                'info'
              );

            startJump(
              { x: catMotionBridge.x, y: 0, z: catMotionBridge.z },
              { x: landingTarget.x, y: perch.surfaceY, z: landingTarget.z },
              0.68,
              0.4
            );
          }
        }
      } else if (dist < 0.35) {
        if (waypointQueueRef.current.length > 0) {
          const nextTarget = waypointQueueRef.current.shift()!;
          catMotionBridge.targetX = nextTarget.x;
          catMotionBridge.targetZ = nextTarget.z;
        } else if (catMotionBridge.isPerched) {
          const perch = ALL_HOUSE_CAT_PERCHES.find(
            (p) => p.id === catMotionBridge.perchSurfaceId
          );
          if (perch && perch.perchWaypoints.length > 0) {
            const nextTarget =
              perch.perchWaypoints[
                Math.floor(Math.random() * perch.perchWaypoints.length)
              ];
            catMotionBridge.targetX = nextTarget.x;
            catMotionBridge.targetZ = nextTarget.z;
          }
        } else {
          const nextTarget = pickFreeFloorTarget();
          catMotionBridge.targetX = nextTarget.x;
          catMotionBridge.targetZ = nextTarget.z;
        }
      }

      if (catMotionBridge.state !== 'JUMPING') {
        const desiredHeading = Math.atan2(
          targetPos.x - currentPos.x,
          targetPos.z - currentPos.z
        );
        catMotionBridge.targetRotationY = desiredHeading;
        catMotionBridge.rotationY = dampAngle(
          catMotionBridge.rotationY,
          desiredHeading,
          8.5,
          delta
        );

        const desiredX =
          catMotionBridge.x +
          Math.sin(catMotionBridge.rotationY) * catMotionBridge.speed * delta;
        const desiredZ =
          catMotionBridge.z +
          Math.cos(catMotionBridge.rotationY) * catMotionBridge.speed * delta;

        let actualMovedDist = 0;

        if (catMotionBridge.isPerched) {
          // Gato empoleirado em móvel permanece seguro sobre o assento (sem andar pelas bordas)
          actualMovedDist = 0;
        } else {
          const resolved = catObstacleDetector.resolveSafeMovement(
            currentPos,
            { x: desiredX, z: desiredZ },
            0.28
          );

          actualMovedDist = Math.hypot(
            resolved.position.x - currentPos.x,
            resolved.position.z - currentPos.z
          );

          catMotionBridge.x = resolved.position.x;
          catMotionBridge.z = resolved.position.z;

          if (resolved.collided) {
            blockedTimerRef.current += delta;
            // Se colidiu ou ficou bloqueado por mais de 0.35s:
            if (blockedTimerRef.current > 0.35 && !climbingTargetPerchRef.current) {
              blockedTimerRef.current = 0;
              catMotionBridge.speed = 0;
              // Para calmamente e senta/fica em pé em vez de girar ou andar no mesmo lugar
              catMotionBridge.state = Math.random() < 0.5 ? 'STANDING' : 'SITTING';
              catMotionBridge.stateTimer = 2.5 + Math.random() * 2.0;
              const altTarget = pickFreeFloorTarget();
              catMotionBridge.targetX = altTarget.x;
              catMotionBridge.targetZ = altTarget.z;
            }
          } else {
            blockedTimerRef.current = 0;
          }
        }

        // Avança o ciclo de passos APENAS se houver deslocamento físico real pelo piso
        const actualSpeed = actualMovedDist / Math.max(delta, 0.0001);
        if (isMovingState && actualSpeed > 0.04) {
          walkPhaseRef.current += actualMovedDist * 14.0;
        }

        const targetLegActivity = isMovingState && actualSpeed > 0.04 ? 1.0 : 0.0;
        legActivityRef.current = damp(
          legActivityRef.current,
          targetLegActivity,
          14.0,
          delta
        );
      }
    } else {
      // Quando não está em estado de movimento, as patas ficam paradas imediatamente
      legActivityRef.current = damp(legActivityRef.current, 0, 16.0, delta);
    }

    // ================================================================
    // SINCRONIZAÇÃO DA RAIZ 3D E SOMBRA PROJETADA
    // ================================================================
    let effectiveY = (catMotionBridge.isPerched || state === 'JUMPING') ? catMotionBridge.y : 0;
    if (state === 'STARTLED') {
      const hopProgress = clamp(1 - (catMotionBridge.stateTimer / 0.65), 0, 1);
      const hopY = Math.sin(hopProgress * Math.PI) * 0.32;
      effectiveY = hopY;
    }

    if (rootRef.current) {
      rootRef.current.position.set(
        catMotionBridge.x,
        effectiveY,
        catMotionBridge.z
      );
      rootRef.current.rotation.y = catMotionBridge.rotationY;
    }

    if (shadowRef.current) {
      if (state === 'JUMPING') {
        const p = catMotionBridge.jumpProgress ?? 0;
        const arc = Math.sin(p * Math.PI) * (catMotionBridge.jumpArcHeight ?? 0.38);
        shadowRef.current.position.y = -arc + 0.007;
        const scaleVal = Math.max(0.45, 1 - arc * 0.85);
        shadowRef.current.scale.set(scaleVal, scaleVal, scaleVal);
      } else if (state === 'STARTLED') {
        const hopProgress = clamp(1 - (catMotionBridge.stateTimer / 0.65), 0, 1);
        const hopY = Math.sin(hopProgress * Math.PI) * 0.32;
        shadowRef.current.position.y = -hopY + 0.007;
        const scaleVal = Math.max(0.45, 1 - hopY * 1.2);
        shadowRef.current.scale.set(scaleVal, scaleVal, scaleVal);
      } else {
        shadowRef.current.position.y = 0.007;
        shadowRef.current.scale.set(1, 1, 1);
      }
    }

    // ================================================================
    // ANIMAÇÕES PROCEDURAIS REALISTAS DE COMPORTAMENTO FELINO
    // ================================================================
    const t = catMotionBridge.animPhase;

    if (
      bodyRef.current &&
      headRef.current &&
      tailRef.current &&
      legFLRef.current &&
      legFRRef.current &&
      legBLRef.current &&
      legBRRef.current
    ) {
      if (state === 'WALKING' || state === 'RUNNING') {
        const bounce =
          Math.abs(Math.sin(walkPhaseRef.current)) *
          (state === 'RUNNING' ? 0.038 : 0.015) *
          legActivityRef.current;

        bodyRef.current.position.y = damp(
          bodyRef.current.position.y,
          0.22 + bounce,
          10,
          delta
        );
        bodyRef.current.rotation.x =
          state === 'RUNNING'
            ? Math.sin(walkPhaseRef.current) * 0.14 * legActivityRef.current
            : 0;
        bodyRef.current.rotation.z =
          Math.sin(walkPhaseRef.current) * 0.03 * legActivityRef.current;

        headRef.current.position.y = damp(headRef.current.position.y, 0.1, 8, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, 0, 8, delta);
        headRef.current.rotation.y = Math.sin(t * 3.0) * 0.08;
        headRef.current.rotation.z = 0;

        tailRef.current.rotation.x = damp(
          tailRef.current.rotation.x,
          state === 'RUNNING' ? -0.45 : 0.35,
          8,
          delta
        );
        tailRef.current.rotation.z = Math.sin(walkPhaseRef.current * 0.5) * 0.35;

        legFLRef.current.position.set(-0.068, -0.07, 0.14);
        legFRRef.current.position.set(0.068, -0.07, 0.14);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        const stride =
          (state === 'RUNNING' ? 0.68 : 0.42) * legActivityRef.current;
        legFLRef.current.rotation.set(Math.sin(walkPhaseRef.current) * stride, 0, 0);
        legBRRef.current.rotation.set(Math.sin(walkPhaseRef.current) * stride, 0, 0);
        legFRRef.current.rotation.set(-Math.sin(walkPhaseRef.current) * stride, 0, 0);
        legBLRef.current.rotation.set(-Math.sin(walkPhaseRef.current) * stride, 0, 0);
      } else if (state === 'STANDING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.22, 8, delta);
        bodyRef.current.rotation.set(0, 0, 0);

        headRef.current.position.y = damp(headRef.current.position.y, 0.11, 8, delta);
        headRef.current.rotation.y = Math.sin(t * 2.2) * 0.42;
        headRef.current.rotation.x = Math.cos(t * 1.6) * 0.08;
        headRef.current.rotation.z = 0;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, 0.55, 6, delta);
        tailRef.current.rotation.z = Math.sin(t * 3.5) * 0.28;

        legFLRef.current.position.set(-0.068, -0.07, 0.14);
        legFRRef.current.position.set(0.068, -0.07, 0.14);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        legFLRef.current.rotation.set(0, 0, 0);
        legFRRef.current.rotation.set(0, 0, 0);
        legBLRef.current.rotation.set(0, 0, 0);
        legBRRef.current.rotation.set(0, 0, 0);
      } else if (state === 'STARTLED') {
        // Pulo de susto súbito: dorso muito arqueado e rabo arrepiado para cima!
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.28, 12, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, -0.38, 12, delta);
        bodyRef.current.rotation.z = Math.sin(t * 24.0) * 0.05;

        headRef.current.position.y = damp(headRef.current.position.y, 0.15, 12, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, -0.28, 12, delta);
        headRef.current.rotation.y = Math.sin(t * 18.0) * 0.15;
        headRef.current.rotation.z = 0;

        // Rabo em alerta máximo com tremor de arrepio
        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, 1.35, 12, delta);
        tailRef.current.rotation.z = Math.sin(t * 28.0) * 0.35;

        legFLRef.current.rotation.set(-0.65, 0, 0);
        legFRRef.current.rotation.set(-0.65, 0, 0);
        legBLRef.current.rotation.set(0.85, 0, 0);
        legBRRef.current.rotation.set(0.85, 0, 0);
      } else if (state === 'DISORIENTED') {
        // Acordando desnorteado: cabeça sacudindo tonta e corpo bambo
        const prog = clamp(1 - (catMotionBridge.stateTimer / 1.4), 0, 1);
        bodyRef.current.position.y = damp(
          bodyRef.current.position.y,
          lerp(0.12, 0.21, prog),
          7,
          delta
        );
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, -0.15, 7, delta);
        bodyRef.current.rotation.z = Math.sin(t * 8.0) * 0.09;

        // Cabeça rodopiando/sacudindo atordoada
        headRef.current.position.y = damp(headRef.current.position.y, 0.12, 8, delta);
        headRef.current.rotation.y = Math.sin(t * 12.0) * 0.45;
        headRef.current.rotation.z = Math.cos(t * 9.0) * 0.32;
        headRef.current.rotation.x = Math.sin(t * 6.0) * 0.18;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, 0.1, 7, delta);
        tailRef.current.rotation.z = Math.sin(t * 5.0) * 0.35;

        legFLRef.current.rotation.set(Math.sin(t * 8.0) * 0.25, 0, 0);
        legFRRef.current.rotation.set(-Math.sin(t * 8.0) * 0.25, 0, 0);
        legBLRef.current.rotation.set(Math.sin(t * 6.0) * 0.3, 0, 0);
        legBRRef.current.rotation.set(-Math.sin(t * 6.0) * 0.3, 0, 0);
      } else if (state === 'SITTING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.16, 7, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, -0.36, 7, delta);
        bodyRef.current.rotation.z = 0;

        headRef.current.position.y = damp(headRef.current.position.y, 0.14, 7, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, 0.28, 7, delta);
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.28;
        headRef.current.rotation.z = 0;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, -0.85, 7, delta);
        tailRef.current.rotation.z = 0.65 + Math.sin(t * 2.5) * 0.18;

        legFLRef.current.position.set(-0.068, -0.05, 0.14);
        legFRRef.current.position.set(0.068, -0.05, 0.14);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        legFLRef.current.rotation.set(0.36, 0, 0);
        legFRRef.current.rotation.set(0.36, 0, 0);
        legBLRef.current.rotation.set(1.35, 0, 0);
        legBRRef.current.rotation.set(1.35, 0, 0);
      } else if (state === 'STRETCHING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.14, 6, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, 0.35, 6, delta);
        bodyRef.current.rotation.z = 0;

        headRef.current.position.y = damp(headRef.current.position.y, 0.04, 6, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, -0.22, 6, delta);
        headRef.current.rotation.y = 0;
        headRef.current.rotation.z = 0;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, 1.15, 6, delta);
        tailRef.current.rotation.z = Math.sin(t * 3.5) * 0.18;

        legFLRef.current.position.set(-0.068, -0.07, 0.2);
        legFRRef.current.position.set(0.068, -0.07, 0.2);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        legFLRef.current.rotation.set(-0.85, 0, 0);
        legFRRef.current.rotation.set(-0.85, 0, 0);
        legBLRef.current.rotation.set(0.25, 0, 0);
        legBRRef.current.rotation.set(0.25, 0, 0);
      } else if (state === 'GROOMING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.16, 7, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, -0.3, 7, delta);
        bodyRef.current.rotation.z = -0.06;

        headRef.current.position.y = damp(headRef.current.position.y, 0.11, 7, delta);
        headRef.current.rotation.x = 0.15 + Math.sin(t * 5.5) * 0.18;
        headRef.current.rotation.y = 0.22;
        headRef.current.rotation.z = -0.25;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, -0.8, 7, delta);
        tailRef.current.rotation.z = Math.sin(t * 3.0) * 0.35;

        legFLRef.current.position.set(-0.068, -0.05, 0.14);
        legFRRef.current.position.set(0.068, 0.02, 0.16);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        legFLRef.current.rotation.set(0.3, 0, 0);
        legFRRef.current.rotation.set(-1.05 + Math.sin(t * 5.5) * 0.25, 0, -0.32);
        legBLRef.current.rotation.set(1.35, 0, 0);
        legBRRef.current.rotation.set(1.35, 0, 0);
      } else if (state === 'LYING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.11, 7, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, -0.05, 7, delta);
        bodyRef.current.rotation.z = 0;

        headRef.current.position.y = damp(headRef.current.position.y, 0.09, 7, delta);
        headRef.current.rotation.y = Math.sin(t * 1.8) * 0.35;
        headRef.current.rotation.x = damp(headRef.current.rotation.x, -0.08, 7, delta);
        headRef.current.rotation.z = 0;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, -0.75, 7, delta);
        tailRef.current.rotation.z = Math.sin(t * 4.0) * 0.22;

        legFLRef.current.position.set(-0.068, -0.07, 0.14);
        legFRRef.current.position.set(0.068, -0.07, 0.14);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        legFLRef.current.rotation.set(-1.25, 0, 0);
        legFRRef.current.rotation.set(-1.25, 0, 0);
        legBLRef.current.rotation.set(1.25, 0, 0);
        legBRRef.current.rotation.set(1.25, 0, 0);
      } else if (state === 'SLEEPING') {
        const breath = Math.sin(t * 2.1) * 0.008;
        bodyRef.current.position.y = damp(
          bodyRef.current.position.y,
          0.095 + breath,
          7,
          delta
        );
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, 0.04, 7, delta);
        bodyRef.current.rotation.z = 0;

        headRef.current.position.y = damp(headRef.current.position.y, 0.03, 7, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, 0.32, 7, delta);
        headRef.current.rotation.y = damp(headRef.current.rotation.y, 0.28, 7, delta);
        headRef.current.rotation.z = 0;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, -0.85, 7, delta);
        tailRef.current.rotation.z = Math.sin(t * 1.2) * 0.08;

        legFLRef.current.position.set(-0.068, -0.07, 0.14);
        legFRRef.current.position.set(0.068, -0.07, 0.14);
        legBLRef.current.position.set(-0.068, -0.07, -0.14);
        legBRRef.current.position.set(0.068, -0.07, -0.14);

        legFLRef.current.rotation.set(-1.35, 0, 0);
        legFRRef.current.rotation.set(-1.35, 0, 0);
        legBLRef.current.rotation.set(1.35, 0, 0);
        legBRRef.current.rotation.set(1.35, 0, 0);
      } else if (state === 'JUMPING') {
        const p = catMotionBridge.jumpProgress ?? 0;
        const pitch =
          p < 0.35 ? -0.45 : p > 0.7 ? 0.38 : -0.05;

        bodyRef.current.position.y = 0.22;
        bodyRef.current.rotation.set(pitch, 0, 0);

        headRef.current.position.y = 0.12;
        headRef.current.rotation.set(pitch * 0.5, 0, 0);

        tailRef.current.rotation.set(0.75, 0, Math.sin(t * 10) * 0.2);

        legFLRef.current.position.set(-0.068, -0.07, 0.18);
        legFRRef.current.position.set(0.068, -0.07, 0.18);
        legBLRef.current.position.set(-0.068, -0.07, -0.18);
        legBRRef.current.position.set(0.068, -0.07, -0.18);

        legFLRef.current.rotation.set(-0.85, 0, 0);
        legFRRef.current.rotation.set(-0.85, 0, 0);
        legBLRef.current.rotation.set(0.95, 0, 0);
        legBRRef.current.rotation.set(0.95, 0, 0);
      }
    }

    // Piscada dos olhos e sono
    const isBlinking = Math.sin(t * 3.7) > 0.96;
    const eyesClosed = state === 'SLEEPING' || isBlinking;
    if (eyesAwakeRef.current && eyesClosedRef.current) {
      eyesAwakeRef.current.visible = !eyesClosed;
      eyesClosedRef.current.visible = eyesClosed;
    }

    // Partículas "Zzz" ao dormir
    if (zzzGroupRef.current) {
      zzzGroupRef.current.visible = state === 'SLEEPING';
      if (state === 'SLEEPING') {
        zzzGroupRef.current.position.y = 0.42 + Math.sin(t * 2.5) * 0.04;
      }
    }

    // Ícone de Exclamação de susto ("!")
    if (frightBadgeRef.current) {
      frightBadgeRef.current.visible = state === 'STARTLED';
      if (state === 'STARTLED') {
        frightBadgeRef.current.position.y = 0.48 + Math.sin(t * 20.0) * 0.03;
      }
    }

    // Estrelinhas orbitando a cabeça desnorteada
    if (dizzyGroupRef.current) {
      dizzyGroupRef.current.visible = state === 'DISORIENTED';
      if (state === 'DISORIENTED') {
        dizzyGroupRef.current.rotation.y += delta * 6.0;
        dizzyGroupRef.current.position.y = 0.42 + Math.sin(t * 6.0) * 0.02;
      }
    }

    // Sincronização discreta com store (~2 Hz)
    syncTimerRef.current += delta;
    if (syncTimerRef.current >= 0.5) {
      syncTimerRef.current = 0;
      useEnvironmentStore
        .getState()
        .setCatTelemetry(catMotionBridge.state, {
          x: catMotionBridge.x,
          z: catMotionBridge.z,
        });
    }
  });

  return (
    <group
      ref={rootRef}
      position={[catMotionBridge.x, catMotionBridge.y, catMotionBridge.z]}
      rotation={[0, catMotionBridge.rotationY, 0]}
      name="ps2-autonomous-cat"
    >
      {/* Sombra Redonda Simples estilo PS2 (Blob Shadow sob o gato) */}
      <mesh
        ref={shadowRef}
        position={[0, 0.007, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.29, 12]} />
        <meshBasicMaterial
          color="#1F0E03"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>

      {/* Corpo articulado do Gato com Volumes Arredondados */}
      <group ref={bodyRef} position={[0, 0.22, 0]}>
        {/* Tronco principal laranja arredondado */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.21, 0.17, 0.42]}
          radius={0.055}
          smoothness={4}
          material={catMaterials.furOrange}
        />

        {/* Barriga branca inferior (Underbelly) */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.165, 0.05, 0.38]}
          radius={0.024}
          smoothness={3}
          position={[0, -0.072, -0.01]}
          material={catMaterials.furWhite}
        />

        {/* Peito branco frontal conectando à barriga */}
        <RoundedBox
          args={[0.165, 0.14, 0.13]}
          radius={0.038}
          smoothness={3}
          position={[0, -0.015, 0.155]}
          material={catMaterials.furWhite}
        />

        {/* Listras tigradas nas costas */}
        {[-0.08, 0.02, 0.12].map((zStripe, idx) => (
          <RoundedBox
            key={idx}
            args={[0.19, 0.014, 0.045]}
            radius={0.005}
            smoothness={2}
            position={[0, 0.086, -zStripe]}
            material={catMaterials.furStripe}
          />
        ))}

        {/* ======================================================== */}
        {/* CABEÇA ARTICULADA DO GATO                                */}
        {/* ======================================================== */}
        <group ref={headRef} position={[0, 0.11, 0.22]}>
          {/* Crânio arredondado */}
          <RoundedBox
            castShadow
            args={[0.2, 0.17, 0.18]}
            radius={0.05}
            smoothness={4}
            material={catMaterials.furOrange}
          />

          {/* Focinho branco */}
          <RoundedBox
            args={[0.12, 0.075, 0.045]}
            radius={0.02}
            smoothness={3}
            position={[0, -0.032, 0.095]}
            material={catMaterials.furWhite}
          />

          {/* Nariz rosa triangular */}
          <mesh position={[0, -0.012, 0.118]} material={catMaterials.nosePink}>
            <boxGeometry args={[0.036, 0.026, 0.015]} />
          </mesh>

          {/* Orelha Esquerda */}
          <mesh
            castShadow
            position={[-0.068, 0.115, -0.01]}
            rotation={[0, 0, 0.15]}
            material={catMaterials.furOrange}
          >
            <coneGeometry args={[0.045, 0.09, 4]} />
          </mesh>
          {/* Orelha Direita */}
          <mesh
            castShadow
            position={[0.068, 0.115, -0.01]}
            rotation={[0, 0, -0.15]}
            material={catMaterials.furOrange}
          >
            <coneGeometry args={[0.045, 0.09, 4]} />
          </mesh>

          {/* Olhos Abertos (Verdes brilhantes com pupila vertical) */}
          <group ref={eyesAwakeRef} position={[0, 0.02, 0.092]}>
            <mesh position={[-0.048, 0, 0]} material={catMaterials.eyeAwake}>
              <boxGeometry args={[0.038, 0.038, 0.008]} />
            </mesh>
            <mesh position={[-0.048, 0, 0.005]} material={catMaterials.eyePupil}>
              <boxGeometry args={[0.012, 0.032, 0.004]} />
            </mesh>

            <mesh position={[0.048, 0, 0]} material={catMaterials.eyeAwake}>
              <boxGeometry args={[0.038, 0.038, 0.008]} />
            </mesh>
            <mesh position={[0.048, 0, 0.005]} material={catMaterials.eyePupil}>
              <boxGeometry args={[0.012, 0.032, 0.004]} />
            </mesh>
          </group>

          {/* Olhos Fechados (Dormindo / Piscando) */}
          <group ref={eyesClosedRef} visible={false} position={[0, 0.018, 0.093]}>
            <mesh position={[-0.048, 0, 0]} material={catMaterials.furStripe}>
              <boxGeometry args={[0.04, 0.01, 0.008]} />
            </mesh>
            <mesh position={[0.048, 0, 0]} material={catMaterials.furStripe}>
              <boxGeometry args={[0.04, 0.01, 0.008]} />
            </mesh>
          </group>
        </group>

        {/* ======================================================== */}
        {/* RABO EXPRESSIVO DO GATO                                  */}
        {/* ======================================================== */}
        <group ref={tailRef} position={[0, 0.05, -0.21]} rotation={[0.45, 0, 0]}>
          <mesh
            castShadow
            position={[0, 0.11, -0.04]}
            rotation={[-0.35, 0, 0]}
            material={catMaterials.furOrange}
          >
            <cylinderGeometry args={[0.022, 0.028, 0.26, 6]} />
          </mesh>
          <mesh
            position={[0, 0.23, -0.09]}
            material={catMaterials.furWhite}
          >
            <sphereGeometry args={[0.026, 6, 6]} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 4 PATAS ARTICULADAS COM BOTINHAS BRANCAS                 */}
        {/* ======================================================== */}
        <group ref={legFLRef} position={[-0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furWhite}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legFRRef} position={[0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furWhite}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBLRef} position={[-0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furWhite}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBRRef} position={[0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furWhite}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>
      </group>

      {/* Partículas Low-Poly de Sono ("Zzz") quando o gato está dormindo */}
      <group ref={zzzGroupRef} visible={false} position={[0, 0.42, 0.18]}>
        <mesh position={[-0.04, 0, 0]} material={catMaterials.zzzMat}>
          <boxGeometry args={[0.032, 0.032, 0.01]} />
        </mesh>
        <mesh position={[0.02, 0.07, 0]} material={catMaterials.zzzMat}>
          <boxGeometry args={[0.044, 0.044, 0.01]} />
        </mesh>
        <mesh position={[0.09, 0.15, 0]} material={catMaterials.zzzMat}>
          <boxGeometry args={[0.056, 0.056, 0.01]} />
        </mesh>
      </group>

      {/* Balão estilizado de susto ("!") quando o gato toma susto */}
      <group ref={frightBadgeRef} visible={false} position={[0, 0.48, 0.12]}>
        {/* Haste do ponto de exclamação */}
        <mesh position={[0, 0.04, 0]} material={catMaterials.frightExclamation}>
          <boxGeometry args={[0.036, 0.1, 0.02]} />
        </mesh>
        {/* Ponto da exclamação */}
        <mesh position={[0, -0.04, 0]} material={catMaterials.frightExclamation}>
          <boxGeometry args={[0.036, 0.032, 0.02]} />
        </mesh>
      </group>

      {/* Estrelinhas de tontura orbitando a cabeça desnorteada */}
      <group ref={dizzyGroupRef} visible={false} position={[0, 0.42, 0.15]}>
        {[-0.09, 0, 0.09].map((ox, idx) => (
          <mesh
            key={idx}
            position={[ox, Math.sin(idx * 2) * 0.025, Math.cos(idx * 2) * 0.06]}
            rotation={[0, idx * 1.2, 0.4]}
            material={catMaterials.dizzyStar}
          >
            <dodecahedronGeometry args={[0.026, 0]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
