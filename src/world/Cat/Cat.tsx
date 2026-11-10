import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import {
  catMotionBridge,
  useEnvironmentStore,
} from '@/store/environmentStore';
import { robotMotionBridge } from '@/store/robotStore';
import { ObstacleDetector } from '@/agent/navigation/ObstacleDetector';
import type { CatBehaviorState } from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { damp, dampAngle, distance2D } from '@/utils/math';

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
  nosePink: new THREE.MeshStandardMaterial({
    color: '#F28B82',
    roughness: 0.45,
    metalness: 0.04,
  }),
  eyeAwake: new THREE.MeshBasicMaterial({
    color: '#4ADE80',
  }),
  eyePupil: new THREE.MeshBasicMaterial({
    color: '#171412',
  }),
  zzzMat: new THREE.MeshBasicMaterial({
    color: '#FFFBEB',
  }),
};

const CAT_WAYPOINTS: Vector2D[] = [
  { x: -0.6, z: -0.9 },
  { x: -1.7, z: 0.35 },
  { x: 0.1, z: -0.2 },
  { x: 2.1, z: -0.5 },
  { x: 2.2, z: 1.3 },
  { x: -2.1, z: -2.1 },
  { x: -0.4, z: -2.5 },
  { x: -2.3, z: 0.6 },
];

const ALL_CAT_STATES: CatBehaviorState[] = [
  'WALKING',
  'RUNNING',
  'STANDING',
  'LYING',
  'SLEEPING',
];

function pickRandomCatState(current: CatBehaviorState): CatBehaviorState {
  const candidates = ALL_CAT_STATES.filter((s) => s !== current);
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Gato Doméstico Autônomo em Estilo Low-Poly PS2:
 * Alterna aleatoriamente entre Andando (WALKING), Correndo (RUNNING),
 * Em Pé Acordado (STANDING), Deitado Acordado (LYING) e Dormindo (SLEEPING).
 * Atualiza `catMotionBridge` a 60 FPS para que o AspiToy desvie dele em tempo real.
 */
export function Cat() {
  const rootRef = useRef<THREE.Group>(null);
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

  const syncTimerRef = useRef(0);

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

  const pickFreeTarget = (): Vector2D => {
    const valid = CAT_WAYPOINTS.filter((pt) => {
      const distToRobot = Math.hypot(
        pt.x - robotMotionBridge.x,
        pt.z - robotMotionBridge.z
      );
      return !catObstacleDetector.isColliding(pt, 0.34) && distToRobot > 0.75;
    });
    if (valid.length === 0) return { x: -0.6, z: -0.8 };
    return valid[Math.floor(Math.random() * valid.length)];
  };

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    catMotionBridge.animPhase += delta;
    catMotionBridge.stateTimer -= delta;

    // Transição aleatória de comportamento do gato quando o timer expira
    if (catMotionBridge.stateTimer <= 0) {
      const nextState = pickRandomCatState(catMotionBridge.state);
      catMotionBridge.state = nextState;

      if (nextState === 'WALKING') {
        catMotionBridge.stateTimer = 5.5 + Math.random() * 4.0;
        const target = pickFreeTarget();
        catMotionBridge.targetX = target.x;
        catMotionBridge.targetZ = target.z;
      } else if (nextState === 'RUNNING') {
        catMotionBridge.stateTimer = 3.5 + Math.random() * 2.5;
        const target = pickFreeTarget();
        catMotionBridge.targetX = target.x;
        catMotionBridge.targetZ = target.z;
      } else if (nextState === 'STANDING') {
        catMotionBridge.stateTimer = 3.2 + Math.random() * 2.5;
      } else if (nextState === 'LYING') {
        catMotionBridge.stateTimer = 4.5 + Math.random() * 3.5;
      } else {
        // SLEEPING
        catMotionBridge.stateTimer = 5.5 + Math.random() * 4.0;
      }

      useEnvironmentStore
        .getState()
        .setCatTelemetry(nextState, { x: catMotionBridge.x, z: catMotionBridge.z });
    }

    const state = catMotionBridge.state;
    const isMovingState = state === 'WALKING' || state === 'RUNNING';
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

      if (dist < 0.28) {
        const nextTarget = pickFreeTarget();
        catMotionBridge.targetX = nextTarget.x;
        catMotionBridge.targetZ = nextTarget.z;
      } else {
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
      }

      const desiredX =
        catMotionBridge.x +
        Math.sin(catMotionBridge.rotationY) * catMotionBridge.speed * delta;
      const desiredZ =
        catMotionBridge.z +
        Math.cos(catMotionBridge.rotationY) * catMotionBridge.speed * delta;

      // Evita colidir com móveis ou com o próprio robô
      const distToRobot = Math.hypot(
        desiredX - robotMotionBridge.x,
        desiredZ - robotMotionBridge.z
      );

      if (distToRobot < 0.62) {
        // O gato desvia ou troca de alvo se chegar muito perto do robô
        catMotionBridge.rotationY += 2.4 * delta;
        const altTarget = pickFreeTarget();
        catMotionBridge.targetX = altTarget.x;
        catMotionBridge.targetZ = altTarget.z;
      } else {
        const resolved = catObstacleDetector.resolveSafeMovement(
          currentPos,
          { x: desiredX, z: desiredZ },
          0.28
        );
        catMotionBridge.x = resolved.position.x;
        catMotionBridge.z = resolved.position.z;

        if (resolved.collided) {
          const altTarget = pickFreeTarget();
          catMotionBridge.targetX = altTarget.x;
          catMotionBridge.targetZ = altTarget.z;
          catMotionBridge.rotationY += 1.8 * delta;
        }
      }
    }

    // Atualiza posição e rotação da raiz 3D
    if (rootRef.current) {
      rootRef.current.position.set(catMotionBridge.x, 0, catMotionBridge.z);
      rootRef.current.rotation.y = catMotionBridge.rotationY;
    }

    const t = catMotionBridge.animPhase;

    // Animação procedural de acordo com o estado do gato
    if (bodyRef.current && headRef.current && tailRef.current) {
      if (state === 'WALKING' || state === 'RUNNING') {
        const freq = state === 'RUNNING' ? 15.0 : 8.5;
        const stride = state === 'RUNNING' ? 0.68 : 0.42;
        const bounce =
          Math.abs(Math.sin(t * freq)) * (state === 'RUNNING' ? 0.038 : 0.015);

        bodyRef.current.position.y = damp(
          bodyRef.current.position.y,
          0.22 + bounce,
          10,
          delta
        );
        bodyRef.current.rotation.x =
          state === 'RUNNING' ? Math.sin(t * freq) * 0.14 : 0;

        headRef.current.position.y = damp(headRef.current.position.y, 0.1, 8, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, 0, 8, delta);
        headRef.current.rotation.y = Math.sin(t * 3.0) * 0.08;

        tailRef.current.rotation.x = damp(
          tailRef.current.rotation.x,
          state === 'RUNNING' ? -0.45 : 0.35,
          8,
          delta
        );
        tailRef.current.rotation.z = Math.sin(t * freq * 0.5) * 0.35;

        if (legFLRef.current && legFRRef.current && legBLRef.current && legBRRef.current) {
          legFLRef.current.rotation.x = Math.sin(t * freq) * stride;
          legBRRef.current.rotation.x = Math.sin(t * freq) * stride;
          legFRRef.current.rotation.x = -Math.sin(t * freq) * stride;
          legBLRef.current.rotation.x = -Math.sin(t * freq) * stride;
        }
      } else if (state === 'STANDING') {
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.22, 8, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, 0, 8, delta);

        // Olha curiosamente para os lados
        headRef.current.position.y = damp(headRef.current.position.y, 0.11, 8, delta);
        headRef.current.rotation.y = Math.sin(t * 2.2) * 0.42;
        headRef.current.rotation.x = Math.cos(t * 1.6) * 0.08;

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, 0.55, 6, delta);
        tailRef.current.rotation.z = Math.sin(t * 3.5) * 0.28;

        if (legFLRef.current && legFRRef.current && legBLRef.current && legBRRef.current) {
          legFLRef.current.rotation.x = damp(legFLRef.current.rotation.x, 0, 8, delta);
          legFRRef.current.rotation.x = damp(legFRRef.current.rotation.x, 0, 8, delta);
          legBLRef.current.rotation.x = damp(legBLRef.current.rotation.x, 0, 8, delta);
          legBRRef.current.rotation.x = damp(legBRRef.current.rotation.x, 0, 8, delta);
        }
      } else if (state === 'LYING') {
        // Deitado acordado no chão, patas dobradas e cabeça erguida observando
        bodyRef.current.position.y = damp(bodyRef.current.position.y, 0.11, 7, delta);
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, -0.05, 7, delta);

        headRef.current.position.y = damp(headRef.current.position.y, 0.09, 7, delta);
        headRef.current.rotation.y = Math.sin(t * 1.8) * 0.35;
        headRef.current.rotation.x = damp(headRef.current.rotation.x, -0.08, 7, delta);

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, -0.75, 7, delta);
        tailRef.current.rotation.z = Math.sin(t * 4.0) * 0.22;

        if (legFLRef.current && legFRRef.current && legBLRef.current && legBRRef.current) {
          legFLRef.current.rotation.x = damp(legFLRef.current.rotation.x, -1.25, 8, delta);
          legFRRef.current.rotation.x = damp(legFRRef.current.rotation.x, -1.25, 8, delta);
          legBLRef.current.rotation.x = damp(legBLRef.current.rotation.x, 1.25, 8, delta);
          legBRRef.current.rotation.x = damp(legBRRef.current.rotation.x, 1.25, 8, delta);
        }
      } else {
        // SLEEPING: Deitado dormindo com cabeça abaixada e respiração suave
        const breath = Math.sin(t * 2.1) * 0.008;
        bodyRef.current.position.y = damp(
          bodyRef.current.position.y,
          0.095 + breath,
          7,
          delta
        );
        bodyRef.current.rotation.x = damp(bodyRef.current.rotation.x, 0.04, 7, delta);

        headRef.current.position.y = damp(headRef.current.position.y, 0.03, 7, delta);
        headRef.current.rotation.x = damp(headRef.current.rotation.x, 0.32, 7, delta);
        headRef.current.rotation.y = damp(headRef.current.rotation.y, 0.28, 7, delta);

        tailRef.current.rotation.x = damp(tailRef.current.rotation.x, -0.85, 7, delta);
        tailRef.current.rotation.z = Math.sin(t * 1.2) * 0.08;

        if (legFLRef.current && legFRRef.current && legBLRef.current && legBRRef.current) {
          legFLRef.current.rotation.x = damp(legFLRef.current.rotation.x, -1.35, 8, delta);
          legFRRef.current.rotation.x = damp(legFRRef.current.rotation.x, -1.35, 8, delta);
          legBLRef.current.rotation.x = damp(legBLRef.current.rotation.x, 1.35, 8, delta);
          legBRRef.current.rotation.x = damp(legBRRef.current.rotation.x, 1.35, 8, delta);
        }
      }
    }

    // Controle de piscada / olhos fechados ao dormir
    const isBlinking = Math.sin(t * 3.7) > 0.96;
    const eyesClosed = state === 'SLEEPING' || isBlinking;
    if (eyesAwakeRef.current && eyesClosedRef.current) {
      eyesAwakeRef.current.visible = !eyesClosed;
      eyesClosedRef.current.visible = eyesClosed;
    }

    // Indicador "Zzz" flutuante quando está dormindo
    if (zzzGroupRef.current) {
      zzzGroupRef.current.visible = state === 'SLEEPING';
      if (state === 'SLEEPING') {
        zzzGroupRef.current.position.y = 0.42 + Math.sin(t * 2.5) * 0.04;
      }
    }

    // Sincronização discreta com o store para o HUD (~2 Hz)
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
      position={[catMotionBridge.x, 0, catMotionBridge.z]}
      rotation={[0, catMotionBridge.rotationY, 0]}
      name="ps2-autonomous-cat"
    >
      {/* Sombra Redonda Simples estilo PS2 (Blob Shadow sob o gato) */}
      <mesh position={[0, 0.007, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

        {/* Peito creme frontal */}
        <RoundedBox
          args={[0.17, 0.14, 0.12]}
          radius={0.04}
          smoothness={3}
          position={[0, -0.01, 0.16]}
          material={catMaterials.furCream}
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

          {/* Focinho claro */}
          <RoundedBox
            args={[0.12, 0.075, 0.045]}
            radius={0.02}
            smoothness={3}
            position={[0, -0.032, 0.095]}
            material={catMaterials.furCream}
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
            material={catMaterials.furCream}
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
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furCream}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legFRRef} position={[0.068, -0.07, 0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.052, 0.12, 0.052]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furCream}>
            <boxGeometry args={[0.056, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBLRef} position={[-0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furCream}>
            <boxGeometry args={[0.058, 0.04, 0.065]} />
          </mesh>
        </group>

        <group ref={legBRRef} position={[0.068, -0.07, -0.14]}>
          <mesh castShadow position={[0, -0.055, 0]} material={catMaterials.furOrange}>
            <boxGeometry args={[0.054, 0.12, 0.056]} />
          </mesh>
          <mesh position={[0, -0.125, 0.01]} material={catMaterials.furCream}>
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
    </group>
  );
}

