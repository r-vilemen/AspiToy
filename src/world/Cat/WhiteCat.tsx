import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  useEnvironmentStore,
  whiteCatMotionBridge,
} from '@/store/environmentStore';
import { robotMotionBridge } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { ObstacleDetector } from '@/agent/navigation/ObstacleDetector';
import type { CatBehaviorState } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { clamp, damp, dampAngle, distance2D, lerp } from '@/utils/math';
import {
  ALL_HOUSE_CAT_PERCHES,
  pickWeightedCatFloorDestination,
  pickWeightedCatPerch,
  planCatRoute,
  type FurniturePerchSpot,
} from './catNavigation';

export { ALL_HOUSE_CAT_PERCHES as WHITE_CAT_PERCHES };

const whiteCatMaterials = {
  furWhite: new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    roughness: 0.72,
    metalness: 0.01,
  }),
  furWhiteShade: new THREE.MeshStandardMaterial({
    color: '#F1F5F9',
    roughness: 0.78,
    metalness: 0.01,
  }),
  nosePink: new THREE.MeshStandardMaterial({
    color: '#FCA5A5',
    roughness: 0.45,
    metalness: 0.04,
  }),
  innerEarPink: new THREE.MeshStandardMaterial({
    color: '#FECDD3',
    roughness: 0.65,
    metalness: 0.02,
  }),
  eyeBlue: new THREE.MeshBasicMaterial({
    color: '#0284C7', // Olhos azuis safira / cristalinos
  }),
  eyePupil: new THREE.MeshBasicMaterial({
    color: '#0F172A',
  }),
  zzzMat: new THREE.MeshBasicMaterial({
    color: '#E0F2FE',
  }),
  frightExclamation: new THREE.MeshBasicMaterial({
    color: '#EF4444',
  }),
  dizzyStar: new THREE.MeshBasicMaterial({
    color: '#FBBF24',
  }),
};

const WHITE_CAT_STATES: CatBehaviorState[] = [
  'WALKING',
  'RUNNING',
  'STANDING',
  'SITTING',
  'STRETCHING',
  'GROOMING',
  'LYING',
  'SLEEPING',
];

function pickRandomState(pool: CatBehaviorState[], current: CatBehaviorState): CatBehaviorState {
  const candidates = pool.filter((s) => s !== current);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
}

/**
 * Gato Branco Autônomo com Olhos Azuis:
 * - Totalmente branco puro com olhos azuis safira hipnotizantes
 * - Navega pela residência (com foco na Sala de Estar, Corredor e Cozinha)
 * - Sobe em móveis, dorme, toma banho de gato e interage com o AspiToy
 */
export function WhiteCat() {
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
    const currentPos = {
      x: whiteCatMotionBridge.x,
      z: whiteCatMotionBridge.z,
    };
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
    whiteCatMotionBridge.state = 'JUMPING';
    whiteCatMotionBridge.jumpStart = { ...start };
    whiteCatMotionBridge.jumpEnd = { ...end };
    whiteCatMotionBridge.jumpProgress = 0;
    whiteCatMotionBridge.jumpDuration = duration;
    whiteCatMotionBridge.jumpArcHeight = arcHeight;
    whiteCatMotionBridge.stateTimer = duration;

    const heading = Math.atan2(end.x - start.x, end.z - start.z);
    whiteCatMotionBridge.targetRotationY = heading;
    whiteCatMotionBridge.rotationY = heading;
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    whiteCatMotionBridge.animPhase += delta;
    whiteCatMotionBridge.stateTimer -= delta;
    startleCooldownRef.current -= delta;

    // Interação reativa com o robô
    if (!whiteCatMotionBridge.isPerched && (whiteCatMotionBridge.y ?? 0) < 0.25) {
      const distToRobot = Math.hypot(
        robotMotionBridge.x - whiteCatMotionBridge.x,
        robotMotionBridge.z - whiteCatMotionBridge.z
      );

      // Robô bate no gato branco dormindo -> acorda desnorteado
      if (
        whiteCatMotionBridge.state === 'SLEEPING' &&
        distToRobot < 0.58 &&
        startleCooldownRef.current <= 0
      ) {
        startleCooldownRef.current = 3.5;
        whiteCatMotionBridge.state = 'DISORIENTED';
        whiteCatMotionBridge.stateTimer = 1.4;
        whiteCatMotionBridge.speed = 0;
        useCommandStore
          .getState()
          .pushNotification(
            'Gato Branco Desnorteado!',
            'O AspiToy acordou o gato branco de sobressalto!',
            'warning'
          );
      } else if (
        whiteCatMotionBridge.state !== 'JUMPING' &&
        whiteCatMotionBridge.state !== 'STARTLED' &&
        whiteCatMotionBridge.state !== 'DISORIENTED' &&
        distToRobot < 1.15 &&
        startleCooldownRef.current <= 0
      ) {
        const dx = robotMotionBridge.x - whiteCatMotionBridge.x;
        const dz = robotMotionBridge.z - whiteCatMotionBridge.z;
        const headingToRobot = Math.atan2(dx, dz);
        let angleDiff = Math.abs(headingToRobot - whiteCatMotionBridge.rotationY);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        const robotInFov = angleDiff < 1.4;

        if (!robotInFov && distToRobot < 0.85) {
          // Susto! Salto vertical e disparada correndo
          startleCooldownRef.current = 4.0;
          whiteCatMotionBridge.state = 'STARTLED';
          whiteCatMotionBridge.stateTimer = 0.65;
          whiteCatMotionBridge.speed = 0;
          useCommandStore
            .getState()
            .pushNotification(
              'Gato Branco Assustado!',
              'O gato branco tomou um baita susto pelas costas!',
              'warning'
            );
        } else if (whiteCatMotionBridge.state !== 'RUNNING') {
          // Gato vê o robô -> afasta-se andando
          const escapeAngle = Math.atan2(-dx, -dz);
          whiteCatMotionBridge.targetRotationY = escapeAngle;
          whiteCatMotionBridge.targetX =
            whiteCatMotionBridge.x + Math.sin(escapeAngle) * 1.8;
          whiteCatMotionBridge.targetZ =
            whiteCatMotionBridge.z + Math.cos(escapeAngle) * 1.8;
          whiteCatMotionBridge.state = 'WALKING';
          whiteCatMotionBridge.speed = 1.1;
          whiteCatMotionBridge.stateTimer = 2.5;
        }
      }
    }

    // Transições autônomas da máquina de estados
    if (whiteCatMotionBridge.stateTimer <= 0) {
      if (whiteCatMotionBridge.state === 'STARTLED') {
        whiteCatMotionBridge.state = 'RUNNING';
        whiteCatMotionBridge.speed = 1.8;
        whiteCatMotionBridge.stateTimer = 3.5;
        const escapePoint = pickFreeFloorTarget();
        whiteCatMotionBridge.targetX = escapePoint.x;
        whiteCatMotionBridge.targetZ = escapePoint.z;
      } else if (whiteCatMotionBridge.state === 'DISORIENTED') {
        whiteCatMotionBridge.state = 'WALKING';
        whiteCatMotionBridge.speed = 0.6;
        whiteCatMotionBridge.stateTimer = 4.0;
        const safePoint = pickFreeFloorTarget();
        whiteCatMotionBridge.targetX = safePoint.x;
        whiteCatMotionBridge.targetZ = safePoint.z;
      } else if (whiteCatMotionBridge.isPerched) {
        if (perchCyclesRemainingRef.current <= 0) {
          const currentPerch = ALL_HOUSE_CAT_PERCHES.find(
            (p) => p.id === whiteCatMotionBridge.perchSurfaceId
          ) ?? ALL_HOUSE_CAT_PERCHES[0];
          startJump(
            {
              x: whiteCatMotionBridge.x,
              y: currentPerch.surfaceY,
              z: whiteCatMotionBridge.z,
            },
            {
              x: currentPerch.stagingPoint.x,
              y: 0,
              z: currentPerch.stagingPoint.z,
            },
            0.55,
            0.28
          );
          whiteCatMotionBridge.isPerched = false;
          whiteCatMotionBridge.perchSurfaceId = null;
        } else {
          perchCyclesRemainingRef.current -= 1;
          const nextState = pickRandomState(['SITTING', 'LYING', 'SLEEPING', 'GROOMING'], whiteCatMotionBridge.state);
          whiteCatMotionBridge.state = nextState;
          whiteCatMotionBridge.stateTimer = 5.5 + Math.random() * 4.0;
        }
      } else {
        // Chance comedida e realista de escolher subir em um móvel (~15%)
        const shouldClimb = Math.random() < 0.15;
        if (shouldClimb) {
          const chosenPerch = pickWeightedCatPerch(outsideBedroomStepsRef.current);
          if (chosenPerch.room === 'bedroom') {
            outsideBedroomStepsRef.current = 0;
          } else {
            outsideBedroomStepsRef.current += 1;
          }
          climbingTargetPerchRef.current = chosenPerch;
          const currentPos = {
            x: whiteCatMotionBridge.x,
            z: whiteCatMotionBridge.z,
          };
          const route = planCatRoute(currentPos, chosenPerch.stagingPoint);
          waypointQueueRef.current = route;
          const nextTarget = waypointQueueRef.current.shift() || chosenPerch.stagingPoint;
          whiteCatMotionBridge.targetX = nextTarget.x;
          whiteCatMotionBridge.targetZ = nextTarget.z;
          whiteCatMotionBridge.state = 'WALKING';
          whiteCatMotionBridge.speed = 0.8;
          whiteCatMotionBridge.stateTimer = 10.0;
        } else {
          const nextState = pickRandomState(WHITE_CAT_STATES, whiteCatMotionBridge.state);
          whiteCatMotionBridge.state = nextState;
          if (nextState === 'WALKING' || nextState === 'RUNNING') {
            const target = pickFreeFloorTarget();
            whiteCatMotionBridge.targetX = target.x;
            whiteCatMotionBridge.targetZ = target.z;
            whiteCatMotionBridge.stateTimer = 3.5 + Math.random() * 2.5;
          } else {
            whiteCatMotionBridge.stateTimer = 4.5 + Math.random() * 3.5;
          }
        }
      }
    }

    // Movimentação cinemática e navegação contínua
    const state = whiteCatMotionBridge.state;
    const targetSpeed =
      state === 'RUNNING'
        ? 1.85
        : state === 'WALKING'
        ? 0.72
        : 0;

    whiteCatMotionBridge.speed = damp(whiteCatMotionBridge.speed, targetSpeed, 6.0, delta);

    if (state === 'WALKING' || state === 'RUNNING') {
      const currentPos = { x: whiteCatMotionBridge.x, z: whiteCatMotionBridge.z };
      const targetPos = {
        x: whiteCatMotionBridge.targetX,
        z: whiteCatMotionBridge.targetZ,
      };
      const dist = distance2D(currentPos, targetPos);

      // Verificação de proximidade do móvel para salto de subida
      if (climbingTargetPerchRef.current && !whiteCatMotionBridge.isPerched) {
        if (dist < 0.42) {
          if (waypointQueueRef.current.length > 0) {
            const nextTarget = waypointQueueRef.current.shift()!;
            whiteCatMotionBridge.targetX = nextTarget.x;
            whiteCatMotionBridge.targetZ = nextTarget.z;
          } else {
            const perch = climbingTargetPerchRef.current;
            climbingTargetPerchRef.current = null;
            whiteCatMotionBridge.perchSurfaceId = perch.id;
            perchCyclesRemainingRef.current = 2 + Math.floor(Math.random() * 3);

            const wp =
              perch.perchWaypoints[
                Math.floor(Math.random() * perch.perchWaypoints.length)
              ];

            useCommandStore
              .getState()
              .pushNotification(
                'Gato Branco no Móvel',
                `O gato branco saltou no(a) ${perch.name}!`,
                'info'
              );

            startJump(
              { x: whiteCatMotionBridge.x, y: 0, z: whiteCatMotionBridge.z },
              { x: wp.x, y: perch.surfaceY, z: wp.z },
              0.65,
              0.42
            );
          }
        }
      } else if (dist < 0.35) {
        if (waypointQueueRef.current.length > 0) {
          const nextTarget = waypointQueueRef.current.shift()!;
          whiteCatMotionBridge.targetX = nextTarget.x;
          whiteCatMotionBridge.targetZ = nextTarget.z;
        } else {
          const nextTarget = pickFreeFloorTarget();
          whiteCatMotionBridge.targetX = nextTarget.x;
          whiteCatMotionBridge.targetZ = nextTarget.z;
        }
      }

      if (whiteCatMotionBridge.state !== 'JUMPING') {
        const desiredHeading = Math.atan2(
          whiteCatMotionBridge.targetX - whiteCatMotionBridge.x,
          whiteCatMotionBridge.targetZ - whiteCatMotionBridge.z
        );

        whiteCatMotionBridge.targetRotationY = desiredHeading;
        whiteCatMotionBridge.rotationY = dampAngle(
          whiteCatMotionBridge.rotationY,
          whiteCatMotionBridge.targetRotationY,
          7.5,
          delta
        );

        const desiredX =
          whiteCatMotionBridge.x +
          Math.sin(whiteCatMotionBridge.rotationY) * whiteCatMotionBridge.speed * delta;
        const desiredZ =
          whiteCatMotionBridge.z +
          Math.cos(whiteCatMotionBridge.rotationY) * whiteCatMotionBridge.speed * delta;

        let actualMovedDist = 0;

        if (whiteCatMotionBridge.isPerched) {
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

          whiteCatMotionBridge.x = resolved.position.x;
          whiteCatMotionBridge.z = resolved.position.z;

          if (resolved.collided) {
            blockedTimerRef.current += delta;
            if (blockedTimerRef.current > 0.35 && !climbingTargetPerchRef.current) {
              blockedTimerRef.current = 0;
              whiteCatMotionBridge.speed = 0;
              whiteCatMotionBridge.state = Math.random() < 0.5 ? 'STANDING' : 'SITTING';
              whiteCatMotionBridge.stateTimer = 2.5 + Math.random() * 2.0;
              const altTarget = pickFreeFloorTarget();
              whiteCatMotionBridge.targetX = altTarget.x;
              whiteCatMotionBridge.targetZ = altTarget.z;
            }
          } else {
            blockedTimerRef.current = 0;
          }
        }

        const actualSpeed = actualMovedDist / Math.max(delta, 0.0001);
        if (actualSpeed > 0.04) {
          walkPhaseRef.current += actualMovedDist * 14.0;
        }

        const targetLegActivity = actualSpeed > 0.04 ? 1.0 : 0.0;
        legActivityRef.current = damp(
          legActivityRef.current,
          targetLegActivity,
          14.0,
          delta
        );
      }
    } else {
      legActivityRef.current = damp(legActivityRef.current, 0, 16.0, delta);
    }

    // Posição vertical efetiva (considerando saltos e pulos de susto)
    let effectiveY = whiteCatMotionBridge.y;
    if (state === 'STARTLED') {
      const hopProgress = clamp(1 - whiteCatMotionBridge.stateTimer / 0.65, 0, 1);
      effectiveY = Math.sin(hopProgress * Math.PI) * 0.42;
    }

    // Sincronização dos nós da cena 3D (Refs mutáveis a 60 FPS sem React re-renders)
    if (rootRef.current) {
      rootRef.current.position.set(
        whiteCatMotionBridge.x,
        effectiveY,
        whiteCatMotionBridge.z
      );
      rootRef.current.rotation.y = whiteCatMotionBridge.rotationY;
    }

    if (state === 'JUMPING') {
      const dur = whiteCatMotionBridge.jumpDuration ?? 0.65;
      const p = clamp(1 - whiteCatMotionBridge.stateTimer / dur, 0, 1);
      whiteCatMotionBridge.jumpProgress = p;

      const s = whiteCatMotionBridge.jumpStart ?? { x: 0, y: 0, z: 0 };
      const e = whiteCatMotionBridge.jumpEnd ?? { x: 0, y: 0, z: 0 };

      whiteCatMotionBridge.x = lerp(s.x, e.x, p);
      whiteCatMotionBridge.z = lerp(s.z, e.z, p);
      const arc =
        Math.sin(p * Math.PI) * (whiteCatMotionBridge.jumpArcHeight ?? 0.38);
      whiteCatMotionBridge.y = lerp(s.y, e.y, p) + arc;

      if (p >= 1) {
        whiteCatMotionBridge.y = e.y;
        whiteCatMotionBridge.isPerched = e.y > 0.25;
        whiteCatMotionBridge.state = 'SITTING';
        whiteCatMotionBridge.stateTimer = 4.0;
        whiteCatMotionBridge.jumpProgress = 0;
      }
    }

    // Animação de patas, tronco, cabeça e rabo
    const t = whiteCatMotionBridge.animPhase;

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
        tailRef.current.rotation.set(0.65, 0, Math.sin(t * 2.5) * 0.22);

        legFLRef.current.rotation.set(0, 0, 0);
        legFRRef.current.rotation.set(0, 0, 0);
        legBLRef.current.rotation.set(0, 0, 0);
        legBRRef.current.rotation.set(0, 0, 0);
      } else if (state === 'SITTING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.16, 8, delta);
        bodyRef.current.rotation.set(-0.25, 0, 0);

        headRef.current.position.y = damp(headRef.current.position.y, 0.14, 8, delta);
        headRef.current.rotation.y = Math.sin(t * 1.5) * 0.25;
        tailRef.current.rotation.set(-0.35, 0, Math.sin(t * 1.8) * 0.15);

        legFLRef.current.rotation.set(0.18, 0, 0);
        legFRRef.current.rotation.set(0.18, 0, 0);
        legBLRef.current.rotation.set(-0.85, 0, 0);
        legBRRef.current.rotation.set(-0.85, 0, 0);
      } else if (state === 'LYING' || state === 'SLEEPING') {
        const breath = Math.sin(t * 2.1) * 0.008;
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.095 + breath, 7, delta);
        bodyRef.current.rotation.set(0.04, 0, 0);

        headRef.current.position.y = damp(headRef.current.position.y, 0.03, 7, delta);
        headRef.current.rotation.set(0.32, 0.28, 0);
        tailRef.current.rotation.set(-0.85, 0, Math.sin(t * 1.2) * 0.08);

        legFLRef.current.rotation.set(1.4, 0, 0);
        legFRRef.current.rotation.set(1.4, 0, 0);
        legBLRef.current.rotation.set(-1.4, 0, 0);
        legBRRef.current.rotation.set(-1.4, 0, 0);
      } else if (state === 'GROOMING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.15, 8, delta);
        bodyRef.current.rotation.set(-0.22, 0, 0);
        headRef.current.rotation.set(Math.sin(t * 6.5) * 0.25, -0.4, 0.2);
        tailRef.current.rotation.set(-0.2, 0, 0.3);
      } else if (state === 'STRETCHING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.14, 8, delta);
        bodyRef.current.rotation.set(-0.35, 0, 0);
        headRef.current.position.y = damp(headRef.current.position.y, 0.04, 8, delta);
        headRef.current.rotation.set(0.4, 0, 0);
        tailRef.current.rotation.set(0.85, 0, 0);
      }
    }

    // Olhos, Balão de Susto e Ícones de Sono
    const isSleeping = state === 'SLEEPING';
    const isStartled = state === 'STARTLED';
    const isDisoriented = state === 'DISORIENTED';

    if (eyesAwakeRef.current) eyesAwakeRef.current.visible = !isSleeping;
    if (eyesClosedRef.current) eyesClosedRef.current.visible = isSleeping;
    if (zzzGroupRef.current) zzzGroupRef.current.visible = isSleeping;
    if (frightBadgeRef.current) frightBadgeRef.current.visible = isStartled;
    if (dizzyGroupRef.current) {
      dizzyGroupRef.current.visible = isDisoriented;
      if (isDisoriented) {
        dizzyGroupRef.current.rotation.y += 6.0 * delta;
      }
    }
  });

  return (
    <group
      ref={rootRef}
      position={[whiteCatMotionBridge.x, whiteCatMotionBridge.y, whiteCatMotionBridge.z]}
      rotation={[0, whiteCatMotionBridge.rotationY, 0]}
    >
      {/* Sombra de Contato Suave no Piso */}
      <mesh
        ref={shadowRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.008, 0]}
      >
        <planeGeometry args={[0.34, 0.54]} />
        <meshBasicMaterial
          color="#1A1208"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Corpo articulado do Gato Branco (Volumes arredondados) */}
      <group ref={bodyRef} position={[0, 0.22, 0]}>
        {/* Tronco principal totalmente branco */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.21, 0.17, 0.42]}
          radius={0.055}
          smoothness={4}
          material={whiteCatMaterials.furWhite}
        />

        {/* Peito e barriga branca */}
        <RoundedBox
          args={[0.165, 0.14, 0.13]}
          radius={0.038}
          smoothness={3}
          position={[0, -0.015, 0.155]}
          material={whiteCatMaterials.furWhiteShade}
        />

        {/* ======================================================== */}
        {/* CABEÇA ARTICULADA DO GATO BRANCO                         */}
        {/* ======================================================== */}
        <group ref={headRef} position={[0, 0.11, 0.22]}>
          {/* Crânio arredondado branco */}
          <RoundedBox
            castShadow
            args={[0.2, 0.17, 0.18]}
            radius={0.05}
            smoothness={4}
            material={whiteCatMaterials.furWhite}
          />

          {/* Focinho branco fofo */}
          <RoundedBox
            args={[0.12, 0.075, 0.045]}
            radius={0.02}
            smoothness={3}
            position={[0, -0.032, 0.095]}
            material={whiteCatMaterials.furWhiteShade}
          />

          {/* Narizinho rosa fofo */}
          <mesh position={[0, -0.012, 0.118]} material={whiteCatMaterials.nosePink}>
            <boxGeometry args={[0.036, 0.026, 0.015]} />
          </mesh>

          {/* Orelha Esquerda com interior rosado */}
          <group position={[-0.068, 0.115, -0.01]} rotation={[0, 0, 0.15]}>
            <mesh castShadow material={whiteCatMaterials.furWhite}>
              <coneGeometry args={[0.045, 0.09, 4]} />
            </mesh>
            <mesh position={[0, -0.005, 0.012]} material={whiteCatMaterials.innerEarPink}>
              <coneGeometry args={[0.028, 0.065, 4]} />
            </mesh>
          </group>

          {/* Orelha Direita com interior rosado */}
          <group position={[0.068, 0.115, -0.01]} rotation={[0, 0, -0.15]}>
            <mesh castShadow material={whiteCatMaterials.furWhite}>
              <coneGeometry args={[0.045, 0.09, 4]} />
            </mesh>
            <mesh position={[0, -0.005, 0.012]} material={whiteCatMaterials.innerEarPink}>
              <coneGeometry args={[0.028, 0.065, 4]} />
            </mesh>
          </group>

          {/* Olhos Azuis Safira Cristalinos com Pupila Vertical */}
          <group ref={eyesAwakeRef} position={[0, 0.02, 0.092]}>
            {/* Olho Esquerdo */}
            <mesh position={[-0.048, 0, 0]} material={whiteCatMaterials.eyeBlue}>
              <boxGeometry args={[0.038, 0.038, 0.008]} />
            </mesh>
            <mesh position={[-0.048, 0, 0.005]} material={whiteCatMaterials.eyePupil}>
              <boxGeometry args={[0.012, 0.032, 0.004]} />
            </mesh>

            {/* Olho Direito */}
            <mesh position={[0.048, 0, 0]} material={whiteCatMaterials.eyeBlue}>
              <boxGeometry args={[0.038, 0.038, 0.008]} />
            </mesh>
            <mesh position={[0.048, 0, 0.005]} material={whiteCatMaterials.eyePupil}>
              <boxGeometry args={[0.012, 0.032, 0.004]} />
            </mesh>
          </group>

          {/* Olhos Fechados (Dormindo) */}
          <group ref={eyesClosedRef} visible={false} position={[0, 0.018, 0.093]}>
            <mesh position={[-0.048, 0, 0]} material={whiteCatMaterials.innerEarPink}>
              <boxGeometry args={[0.04, 0.01, 0.008]} />
            </mesh>
            <mesh position={[0.048, 0, 0]} material={whiteCatMaterials.innerEarPink}>
              <boxGeometry args={[0.04, 0.01, 0.008]} />
            </mesh>
          </group>
        </group>

        {/* ======================================================== */}
        {/* RABO FELPUDO BRANCO                                      */}
        {/* ======================================================== */}
        <group ref={tailRef} position={[0, 0.05, -0.21]} rotation={[0.45, 0, 0]}>
          <mesh
            castShadow
            position={[0, 0.11, -0.04]}
            rotation={[-0.35, 0, 0]}
            material={whiteCatMaterials.furWhite}
          >
            <cylinderGeometry args={[0.024, 0.03, 0.26, 6]} />
          </mesh>
          <mesh
            position={[0, 0.23, -0.09]}
            material={whiteCatMaterials.furWhite}
          >
            <sphereGeometry args={[0.028, 6, 6]} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 4 PATAS BRANCAS ARTICULADAS                              */}
        {/* ======================================================== */}
        <group ref={legFLRef} position={[-0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legFRRef} position={[0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBLRef} position={[-0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBRRef} position={[0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={whiteCatMaterials.furWhite}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>
      </group>

      {/* Partículas de Sono ("Zzz") */}
      <group ref={zzzGroupRef} visible={false} position={[0, 0.42, 0.18]}>
        <mesh position={[-0.04, 0, 0]} material={whiteCatMaterials.zzzMat}>
          <boxGeometry args={[0.032, 0.032, 0.01]} />
        </mesh>
        <mesh position={[0.02, 0.07, 0]} material={whiteCatMaterials.zzzMat}>
          <boxGeometry args={[0.044, 0.044, 0.01]} />
        </mesh>
        <mesh position={[0.09, 0.15, 0]} material={whiteCatMaterials.zzzMat}>
          <boxGeometry args={[0.056, 0.056, 0.01]} />
        </mesh>
      </group>

      {/* Balão de susto ("!") */}
      <group ref={frightBadgeRef} visible={false} position={[0, 0.48, 0.12]}>
        <mesh position={[0, 0.04, 0]} material={whiteCatMaterials.frightExclamation}>
          <boxGeometry args={[0.036, 0.1, 0.02]} />
        </mesh>
        <mesh position={[0, -0.04, 0]} material={whiteCatMaterials.frightExclamation}>
          <boxGeometry args={[0.036, 0.032, 0.02]} />
        </mesh>
      </group>

      {/* Estrelinhas de tontura */}
      <group ref={dizzyGroupRef} visible={false} position={[0, 0.42, 0.15]}>
        {[-0.09, 0, 0.09].map((ox, idx) => (
          <mesh
            key={idx}
            position={[ox, Math.sin(idx * 2) * 0.025, Math.cos(idx * 2) * 0.06]}
            material={whiteCatMaterials.dizzyStar}
          >
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
