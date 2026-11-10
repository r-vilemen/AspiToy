import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  tuxedoCatMotionBridge,
  useEnvironmentStore,
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

export { ALL_HOUSE_CAT_PERCHES as TUXEDO_CAT_PERCHES };

const tuxedoCatMaterials = {
  furBlack: new THREE.MeshStandardMaterial({
    color: '#1B1B1E', // Preto ébano lustroso
    roughness: 0.76,
    metalness: 0.02,
  }),
  furWhite: new THREE.MeshStandardMaterial({
    color: '#FFFFFF', // Branco puro da barriga, peito e luvinhas
    roughness: 0.72,
    metalness: 0.01,
  }),
  nosePink: new THREE.MeshStandardMaterial({
    color: '#F472B6',
    roughness: 0.45,
    metalness: 0.04,
  }),
  innerEarPink: new THREE.MeshStandardMaterial({
    color: '#FDA4AF',
    roughness: 0.65,
    metalness: 0.02,
  }),
  eyeGreen: new THREE.MeshBasicMaterial({
    color: '#10B981', // Olhos verdes esmeralda brilhantes
  }),
  eyePupil: new THREE.MeshBasicMaterial({
    color: '#0F172A',
  }),
  zzzMat: new THREE.MeshBasicMaterial({
    color: '#ECFDF5',
  }),
  frightExclamation: new THREE.MeshBasicMaterial({
    color: '#EF4444',
  }),
  dizzyStar: new THREE.MeshBasicMaterial({
    color: '#FBBF24',
  }),
};

const TUXEDO_CAT_STATES: CatBehaviorState[] = [
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
 * Gato Mesclado Preto e Branco (Frajola) com Olhos Verdes:
 * - Corpo preto com peitoral, barriga, máscara no focinho e patinhas brancas
 * - Olhos verde esmeralda luminosos
 * - Autonomia completa com física, saltos parabólicos e reatividade ao AspiToy
 */
export function TuxedoCat() {
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
      x: tuxedoCatMotionBridge.x,
      z: tuxedoCatMotionBridge.z,
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
    tuxedoCatMotionBridge.state = 'JUMPING';
    tuxedoCatMotionBridge.jumpStart = { ...start };
    tuxedoCatMotionBridge.jumpEnd = { ...end };
    tuxedoCatMotionBridge.jumpProgress = 0;
    tuxedoCatMotionBridge.jumpDuration = duration;
    tuxedoCatMotionBridge.jumpArcHeight = arcHeight;
    tuxedoCatMotionBridge.stateTimer = duration;

    const heading = Math.atan2(end.x - start.x, end.z - start.z);
    tuxedoCatMotionBridge.targetRotationY = heading;
    tuxedoCatMotionBridge.rotationY = heading;
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    tuxedoCatMotionBridge.animPhase += delta;
    tuxedoCatMotionBridge.stateTimer -= delta;
    startleCooldownRef.current -= delta;

    // Interação reativa com o robô
    if (!tuxedoCatMotionBridge.isPerched && (tuxedoCatMotionBridge.y ?? 0) < 0.25) {
      const distToRobot = Math.hypot(
        robotMotionBridge.x - tuxedoCatMotionBridge.x,
        robotMotionBridge.z - tuxedoCatMotionBridge.z
      );

      // Robô bate no gato mesclado dormindo -> acorda desnorteado
      if (
        tuxedoCatMotionBridge.state === 'SLEEPING' &&
        distToRobot < 0.58 &&
        startleCooldownRef.current <= 0
      ) {
        startleCooldownRef.current = 3.5;
        tuxedoCatMotionBridge.state = 'DISORIENTED';
        tuxedoCatMotionBridge.stateTimer = 1.4;
        tuxedoCatMotionBridge.speed = 0;
        useCommandStore
          .getState()
          .pushNotification(
            'Gato Frajola Desnorteado!',
            'O AspiToy acordou o gato mesclado de sobressalto!',
            'warning'
          );
      } else if (
        tuxedoCatMotionBridge.state !== 'JUMPING' &&
        tuxedoCatMotionBridge.state !== 'STARTLED' &&
        tuxedoCatMotionBridge.state !== 'DISORIENTED' &&
        distToRobot < 1.15 &&
        startleCooldownRef.current <= 0
      ) {
        const dx = robotMotionBridge.x - tuxedoCatMotionBridge.x;
        const dz = robotMotionBridge.z - tuxedoCatMotionBridge.z;
        const headingToRobot = Math.atan2(dx, dz);
        let angleDiff = Math.abs(headingToRobot - tuxedoCatMotionBridge.rotationY);
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        angleDiff = Math.abs(angleDiff);

        const robotInFov = angleDiff < 1.4;

        if (!robotInFov && distToRobot < 0.85) {
          // Susto! Salto vertical e disparada correndo
          startleCooldownRef.current = 4.0;
          tuxedoCatMotionBridge.state = 'STARTLED';
          tuxedoCatMotionBridge.stateTimer = 0.65;
          tuxedoCatMotionBridge.speed = 0;
          useCommandStore
            .getState()
            .pushNotification(
              'Gato Frajola Assustado!',
              'O gato mesclado levou um susto com a aproximação silenciosa!',
              'warning'
            );
        } else if (tuxedoCatMotionBridge.state !== 'RUNNING') {
          // Gato vê o robô -> afasta-se andando
          const escapeAngle = Math.atan2(-dx, -dz);
          tuxedoCatMotionBridge.targetRotationY = escapeAngle;
          tuxedoCatMotionBridge.targetX =
            tuxedoCatMotionBridge.x + Math.sin(escapeAngle) * 1.8;
          tuxedoCatMotionBridge.targetZ =
            tuxedoCatMotionBridge.z + Math.cos(escapeAngle) * 1.8;
          tuxedoCatMotionBridge.state = 'WALKING';
          tuxedoCatMotionBridge.speed = 1.1;
          tuxedoCatMotionBridge.stateTimer = 2.5;
        }
      }
    }

    // Transições autônomas da máquina de estados
    if (tuxedoCatMotionBridge.stateTimer <= 0) {
      if (tuxedoCatMotionBridge.state === 'STARTLED') {
        tuxedoCatMotionBridge.state = 'RUNNING';
        tuxedoCatMotionBridge.speed = 1.8;
        tuxedoCatMotionBridge.stateTimer = 3.5;
        const escapePoint = pickFreeFloorTarget();
        tuxedoCatMotionBridge.targetX = escapePoint.x;
        tuxedoCatMotionBridge.targetZ = escapePoint.z;
      } else if (tuxedoCatMotionBridge.state === 'DISORIENTED') {
        tuxedoCatMotionBridge.state = 'WALKING';
        tuxedoCatMotionBridge.speed = 0.6;
        tuxedoCatMotionBridge.stateTimer = 4.0;
        const safePoint = pickFreeFloorTarget();
        tuxedoCatMotionBridge.targetX = safePoint.x;
        tuxedoCatMotionBridge.targetZ = safePoint.z;
      } else if (tuxedoCatMotionBridge.isPerched) {
        if (perchCyclesRemainingRef.current <= 0) {
          const currentPerch = ALL_HOUSE_CAT_PERCHES.find(
            (p) => p.id === tuxedoCatMotionBridge.perchSurfaceId
          ) ?? ALL_HOUSE_CAT_PERCHES[0];
          startJump(
            {
              x: tuxedoCatMotionBridge.x,
              y: currentPerch.surfaceY,
              z: tuxedoCatMotionBridge.z,
            },
            {
              x: currentPerch.stagingPoint.x,
              y: 0,
              z: currentPerch.stagingPoint.z,
            },
            0.55,
            0.28
          );
          tuxedoCatMotionBridge.isPerched = false;
          tuxedoCatMotionBridge.perchSurfaceId = null;
        } else {
          perchCyclesRemainingRef.current -= 1;
          const nextState = pickRandomState(['SITTING', 'LYING', 'SLEEPING', 'GROOMING'], tuxedoCatMotionBridge.state);
          tuxedoCatMotionBridge.state = nextState;
          tuxedoCatMotionBridge.stateTimer = 4.5 + Math.random() * 4.0;
        }
      } else {
        // Chance comedida e realista de subir em um móvel (~15%)
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
            x: tuxedoCatMotionBridge.x,
            z: tuxedoCatMotionBridge.z,
          };
          const route = planCatRoute(currentPos, chosenPerch.stagingPoint);
          waypointQueueRef.current = route;
          const nextTarget = waypointQueueRef.current.shift() || chosenPerch.stagingPoint;
          tuxedoCatMotionBridge.targetX = nextTarget.x;
          tuxedoCatMotionBridge.targetZ = nextTarget.z;
          tuxedoCatMotionBridge.state = 'WALKING';
          tuxedoCatMotionBridge.speed = 0.8;
          tuxedoCatMotionBridge.stateTimer = 10.0;
        } else {
          const nextState = pickRandomState(TUXEDO_CAT_STATES, tuxedoCatMotionBridge.state);
          tuxedoCatMotionBridge.state = nextState;
          if (nextState === 'WALKING' || nextState === 'RUNNING') {
            const target = pickFreeFloorTarget();
            tuxedoCatMotionBridge.targetX = target.x;
            tuxedoCatMotionBridge.targetZ = target.z;
            tuxedoCatMotionBridge.stateTimer = 3.5 + Math.random() * 2.5;
          } else {
            tuxedoCatMotionBridge.stateTimer = 4.5 + Math.random() * 3.5;
          }
        }
      }
    }

    // Movimentação cinemática e navegação contínua
    const state = tuxedoCatMotionBridge.state;
    const targetSpeed =
      state === 'RUNNING'
        ? 1.85
        : state === 'WALKING'
        ? 0.72
        : 0;

    tuxedoCatMotionBridge.speed = damp(tuxedoCatMotionBridge.speed, targetSpeed, 6.0, delta);

    if (state === 'WALKING' || state === 'RUNNING') {
      const currentPos = { x: tuxedoCatMotionBridge.x, z: tuxedoCatMotionBridge.z };
      const targetPos = {
        x: tuxedoCatMotionBridge.targetX,
        z: tuxedoCatMotionBridge.targetZ,
      };
      const dist = distance2D(currentPos, targetPos);

      // Verificação de proximidade do móvel para salto de subida
      if (climbingTargetPerchRef.current && !tuxedoCatMotionBridge.isPerched) {
        if (dist < 0.42) {
          if (waypointQueueRef.current.length > 0) {
            const nextTarget = waypointQueueRef.current.shift()!;
            tuxedoCatMotionBridge.targetX = nextTarget.x;
            tuxedoCatMotionBridge.targetZ = nextTarget.z;
          } else {
            const perch = climbingTargetPerchRef.current;
            climbingTargetPerchRef.current = null;
            tuxedoCatMotionBridge.perchSurfaceId = perch.id;
            perchCyclesRemainingRef.current = 2 + Math.floor(Math.random() * 3);

            const wp =
              perch.perchWaypoints[
                Math.floor(Math.random() * perch.perchWaypoints.length)
              ];

            useCommandStore
              .getState()
              .pushNotification(
                'Gato Frajola no Móvel',
                `O gato mesclado saltou no(a) ${perch.name}!`,
                'info'
              );

            startJump(
              { x: tuxedoCatMotionBridge.x, y: 0, z: tuxedoCatMotionBridge.z },
              { x: wp.x, y: perch.surfaceY, z: wp.z },
              0.65,
              0.42
            );
          }
        }
      } else if (dist < 0.35) {
        if (waypointQueueRef.current.length > 0) {
          const nextTarget = waypointQueueRef.current.shift()!;
          tuxedoCatMotionBridge.targetX = nextTarget.x;
          tuxedoCatMotionBridge.targetZ = nextTarget.z;
        } else {
          const nextTarget = pickFreeFloorTarget();
          tuxedoCatMotionBridge.targetX = nextTarget.x;
          tuxedoCatMotionBridge.targetZ = nextTarget.z;
        }
      }

      if (tuxedoCatMotionBridge.state !== 'JUMPING') {
        const desiredHeading = Math.atan2(
          tuxedoCatMotionBridge.targetX - tuxedoCatMotionBridge.x,
          tuxedoCatMotionBridge.targetZ - tuxedoCatMotionBridge.z
        );

        tuxedoCatMotionBridge.targetRotationY = desiredHeading;
        tuxedoCatMotionBridge.rotationY = dampAngle(
          tuxedoCatMotionBridge.rotationY,
          tuxedoCatMotionBridge.targetRotationY,
          7.5,
          delta
        );

        const desiredX =
          tuxedoCatMotionBridge.x +
          Math.sin(tuxedoCatMotionBridge.rotationY) * tuxedoCatMotionBridge.speed * delta;
        const desiredZ =
          tuxedoCatMotionBridge.z +
          Math.cos(tuxedoCatMotionBridge.rotationY) * tuxedoCatMotionBridge.speed * delta;

        let actualMovedDist = 0;

        if (tuxedoCatMotionBridge.isPerched) {
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

          tuxedoCatMotionBridge.x = resolved.position.x;
          tuxedoCatMotionBridge.z = resolved.position.z;

          if (resolved.collided) {
            blockedTimerRef.current += delta;
            if (blockedTimerRef.current > 0.35 && !climbingTargetPerchRef.current) {
              blockedTimerRef.current = 0;
              tuxedoCatMotionBridge.speed = 0;
              tuxedoCatMotionBridge.state = Math.random() < 0.5 ? 'STANDING' : 'SITTING';
              tuxedoCatMotionBridge.stateTimer = 2.5 + Math.random() * 2.0;
              const altTarget = pickFreeFloorTarget();
              tuxedoCatMotionBridge.targetX = altTarget.x;
              tuxedoCatMotionBridge.targetZ = altTarget.z;
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
    let effectiveY = tuxedoCatMotionBridge.y;
    if (state === 'STARTLED') {
      const hopProgress = clamp(1 - tuxedoCatMotionBridge.stateTimer / 0.65, 0, 1);
      effectiveY = Math.sin(hopProgress * Math.PI) * 0.42;
    }

    // Sincronização dos nós da cena 3D (Refs mutáveis a 60 FPS sem React re-renders)
    if (rootRef.current) {
      rootRef.current.position.set(
        tuxedoCatMotionBridge.x,
        effectiveY,
        tuxedoCatMotionBridge.z
      );
      rootRef.current.rotation.y = tuxedoCatMotionBridge.rotationY;
    }

    if (state === 'JUMPING') {
      const dur = tuxedoCatMotionBridge.jumpDuration ?? 0.65;
      const p = clamp(1 - tuxedoCatMotionBridge.stateTimer / dur, 0, 1);
      tuxedoCatMotionBridge.jumpProgress = p;

      const s = tuxedoCatMotionBridge.jumpStart ?? { x: 0, y: 0, z: 0 };
      const e = tuxedoCatMotionBridge.jumpEnd ?? { x: 0, y: 0, z: 0 };

      tuxedoCatMotionBridge.x = lerp(s.x, e.x, p);
      tuxedoCatMotionBridge.z = lerp(s.z, e.z, p);
      const arc =
        Math.sin(p * Math.PI) * (tuxedoCatMotionBridge.jumpArcHeight ?? 0.38);
      tuxedoCatMotionBridge.y = lerp(s.y, e.y, p) + arc;

      if (p >= 1) {
        tuxedoCatMotionBridge.y = e.y;
        tuxedoCatMotionBridge.isPerched = e.y > 0.25;
        tuxedoCatMotionBridge.state = 'SITTING';
        tuxedoCatMotionBridge.stateTimer = 4.0;
        tuxedoCatMotionBridge.jumpProgress = 0;
      }
    }

    // Animação de patas, tronco, cabeça e rabo
    const t = tuxedoCatMotionBridge.animPhase;

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
      position={[tuxedoCatMotionBridge.x, tuxedoCatMotionBridge.y, tuxedoCatMotionBridge.z]}
      rotation={[0, tuxedoCatMotionBridge.rotationY, 0]}
    >
      {/* Sombra de Contato no Piso */}
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

      {/* Corpo articulado do Gato Mesclado (Frajola) */}
      <group ref={bodyRef} position={[0, 0.22, 0]}>
        {/* Dorso e laterais pretas */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.21, 0.17, 0.42]}
          radius={0.055}
          smoothness={4}
          material={tuxedoCatMaterials.furBlack}
        />

        {/* Barriga branca inferior */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.165, 0.05, 0.38]}
          radius={0.024}
          smoothness={3}
          position={[0, -0.072, -0.01]}
          material={tuxedoCatMaterials.furWhite}
        />

        {/* Peitoral branco clássico (Tuxedo Shirt) */}
        <RoundedBox
          args={[0.165, 0.14, 0.13]}
          radius={0.038}
          smoothness={3}
          position={[0, -0.015, 0.155]}
          material={tuxedoCatMaterials.furWhite}
        />

        {/* ======================================================== */}
        {/* CABEÇA ARTICULADA DO GATO MESCLADO                       */}
        {/* ======================================================== */}
        <group ref={headRef} position={[0, 0.11, 0.22]}>
          {/* Crânio preto */}
          <RoundedBox
            castShadow
            args={[0.2, 0.17, 0.18]}
            radius={0.05}
            smoothness={4}
            material={tuxedoCatMaterials.furBlack}
          />

          {/* Focinho branco proeminente */}
          <RoundedBox
            args={[0.125, 0.08, 0.05]}
            radius={0.02}
            smoothness={3}
            position={[0, -0.032, 0.095]}
            material={tuxedoCatMaterials.furWhite}
          />

          {/* Faixa branca estilizada entre os olhos (Blaze de Frajola) */}
          <mesh position={[0, 0.025, 0.093]} material={tuxedoCatMaterials.furWhite}>
            <boxGeometry args={[0.032, 0.065, 0.005]} />
          </mesh>

          {/* Narizinho rosado */}
          <mesh position={[0, -0.012, 0.12]} material={tuxedoCatMaterials.nosePink}>
            <boxGeometry args={[0.036, 0.026, 0.015]} />
          </mesh>

          {/* Orelha Esquerda preta com interior rosado */}
          <group position={[-0.068, 0.115, -0.01]} rotation={[0, 0, 0.15]}>
            <mesh castShadow material={tuxedoCatMaterials.furBlack}>
              <coneGeometry args={[0.045, 0.09, 4]} />
            </mesh>
            <mesh position={[0, -0.005, 0.012]} material={tuxedoCatMaterials.innerEarPink}>
              <coneGeometry args={[0.028, 0.065, 4]} />
            </mesh>
          </group>

          {/* Orelha Direita preta com interior rosado */}
          <group position={[0.068, 0.115, -0.01]} rotation={[0, 0, -0.15]}>
            <mesh castShadow material={tuxedoCatMaterials.furBlack}>
              <coneGeometry args={[0.045, 0.09, 4]} />
            </mesh>
            <mesh position={[0, -0.005, 0.012]} material={tuxedoCatMaterials.innerEarPink}>
              <coneGeometry args={[0.028, 0.065, 4]} />
            </mesh>
          </group>

          {/* Olhos Verdes Esmeralda com Pupila Vertical */}
          <group ref={eyesAwakeRef} position={[0, 0.02, 0.092]}>
            {/* Olho Esquerdo */}
            <mesh position={[-0.048, 0, 0]} material={tuxedoCatMaterials.eyeGreen}>
              <boxGeometry args={[0.038, 0.038, 0.008]} />
            </mesh>
            <mesh position={[-0.048, 0, 0.005]} material={tuxedoCatMaterials.eyePupil}>
              <boxGeometry args={[0.012, 0.032, 0.004]} />
            </mesh>

            {/* Olho Direito */}
            <mesh position={[0.048, 0, 0]} material={tuxedoCatMaterials.eyeGreen}>
              <boxGeometry args={[0.038, 0.038, 0.008]} />
            </mesh>
            <mesh position={[0.048, 0, 0.005]} material={tuxedoCatMaterials.eyePupil}>
              <boxGeometry args={[0.012, 0.032, 0.004]} />
            </mesh>
          </group>

          {/* Olhos Fechados (Dormindo) */}
          <group ref={eyesClosedRef} visible={false} position={[0, 0.018, 0.093]}>
            <mesh position={[-0.048, 0, 0]} material={tuxedoCatMaterials.furWhite}>
              <boxGeometry args={[0.04, 0.01, 0.008]} />
            </mesh>
            <mesh position={[0.048, 0, 0]} material={tuxedoCatMaterials.furWhite}>
              <boxGeometry args={[0.04, 0.01, 0.008]} />
            </mesh>
          </group>
        </group>

        {/* ======================================================== */}
        {/* RABO PRETO COM PONTA BRANCA                              */}
        {/* ======================================================== */}
        <group ref={tailRef} position={[0, 0.05, -0.21]} rotation={[0.45, 0, 0]}>
          <mesh
            castShadow
            position={[0, 0.11, -0.04]}
            rotation={[-0.35, 0, 0]}
            material={tuxedoCatMaterials.furBlack}
          >
            <cylinderGeometry args={[0.022, 0.028, 0.26, 6]} />
          </mesh>
          {/* Pontinha branca do rabo */}
          <mesh
            position={[0, 0.23, -0.09]}
            material={tuxedoCatMaterials.furWhite}
          >
            <sphereGeometry args={[0.026, 6, 6]} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 4 PATAS COM LUVAS / BOTINHAS BRANCAS                     */}
        {/* ======================================================== */}
        <group ref={legFLRef} position={[-0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={tuxedoCatMaterials.furBlack}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={tuxedoCatMaterials.furWhite}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legFRRef} position={[0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={tuxedoCatMaterials.furBlack}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={tuxedoCatMaterials.furWhite}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBLRef} position={[-0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={tuxedoCatMaterials.furBlack}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={tuxedoCatMaterials.furWhite}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBRRef} position={[0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={tuxedoCatMaterials.furBlack}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={tuxedoCatMaterials.furWhite}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>
      </group>

      {/* Partículas de Sono ("Zzz") */}
      <group ref={zzzGroupRef} visible={false} position={[0, 0.42, 0.18]}>
        <mesh position={[-0.04, 0, 0]} material={tuxedoCatMaterials.zzzMat}>
          <boxGeometry args={[0.032, 0.032, 0.01]} />
        </mesh>
        <mesh position={[0.02, 0.07, 0]} material={tuxedoCatMaterials.zzzMat}>
          <boxGeometry args={[0.044, 0.044, 0.01]} />
        </mesh>
        <mesh position={[0.09, 0.15, 0]} material={tuxedoCatMaterials.zzzMat}>
          <boxGeometry args={[0.056, 0.056, 0.01]} />
        </mesh>
      </group>

      {/* Balão de susto ("!") */}
      <group ref={frightBadgeRef} visible={false} position={[0, 0.48, 0.12]}>
        <mesh position={[0, 0.04, 0]} material={tuxedoCatMaterials.frightExclamation}>
          <boxGeometry args={[0.036, 0.1, 0.02]} />
        </mesh>
        <mesh position={[0, -0.04, 0]} material={tuxedoCatMaterials.frightExclamation}>
          <boxGeometry args={[0.036, 0.032, 0.02]} />
        </mesh>
      </group>

      {/* Estrelinhas de tontura */}
      <group ref={dizzyGroupRef} visible={false} position={[0, 0.42, 0.15]}>
        {[-0.09, 0, 0.09].map((ox, idx) => (
          <mesh
            key={idx}
            position={[ox, Math.sin(idx * 2) * 0.025, Math.cos(idx * 2) * 0.06]}
            material={tuxedoCatMaterials.dizzyStar}
          >
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

