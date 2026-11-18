import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WORLD_PALETTE } from '../Environment/Materials';
import { robotMotionBridge } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { soundManager } from '@/services/soundManager';

interface RobotEffectsProps {
  isCleaning?: boolean;
  isRecharging?: boolean;
}

interface BubbleInstance {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  wobblePhase: number;
  life: number;
  maxLife: number;
  radius: number;
}

interface ConfettiSpark {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  maxLife: number;
}

const MAX_BUBBLES = 16;
const MAX_CONFETTI = 48;

/**
 * Feedback Visual e Efeitos Especiais do AspiToy:
 * - Vórtice de sucção e halo de recarga sob o chassi
 * - Anel aerodinâmico de vento descendente (downwash) durante o Modo Aspi-Helicóptero
 * - Canhão de Bolhas Anti-Gravitacionais com material iridescente furta-cor e explosão de confetes cintilantes
 */
export const RobotEffects = memo(function RobotEffects({
  isCleaning = false,
  isRecharging = false,
}: RobotEffectsProps) {
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const downwashRingRef = useRef<THREE.Mesh>(null);

  const bubbleMeshRef = useRef<THREE.InstancedMesh>(null);
  const confettiPointsRef = useRef<THREE.Points>(null);

  const lastTriggerRef = useRef(robotMotionBridge.bubbleBurstTrigger);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Pool de bolhas anti-gravidade pré-alocadas
  const bubblesPool = useRef<BubbleInstance[]>(
    Array.from({ length: MAX_BUBBLES }, () => ({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      wobblePhase: 0,
      life: 0,
      maxLife: 2.5,
      radius: 0.08,
    }))
  );

  // Pool de confetes cintilantes de estouro de bolha
  const confettiPool = useRef<ConfettiSpark[]>(
    Array.from({ length: MAX_CONFETTI }, () => ({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      maxLife: 0.8,
    }))
  );

  const confettiPositions = useMemo(() => new Float32Array(MAX_CONFETTI * 3), []);
  const confettiColors = useMemo(() => {
    const arr = new Float32Array(MAX_CONFETTI * 3);
    const palette = [
      [1.0, 0.85, 0.2], // Dourado
      [0.2, 0.8, 1.0],  // Turquesa
      [1.0, 0.4, 0.7],  // Rosa brilhante
      [0.3, 1.0, 0.5],  // Verde esmeralda
    ];
    for (let i = 0; i < MAX_CONFETTI; i++) {
      const col = palette[i % palette.length];
      arr[i * 3] = col[0];
      arr[i * 3 + 1] = col[1];
      arr[i * 3 + 2] = col[2];
    }
    return arr;
  }, []);

  const bubbleMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#E0F2FE',
        roughness: 0.08,
        metalness: 0.05,
        transmission: 0.88,
        ior: 1.33,
        transparent: true,
        opacity: 0.75,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        iridescence: 0.95,
        iridescenceIOR: 1.3,
        depthWrite: false,
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // 1. Anéis normais de limpeza e recarga
    if (outerRingRef.current) {
      const pulse = 1 + Math.sin(t * 6.5) * 0.06;
      outerRingRef.current.scale.set(pulse, pulse, 1);
    }
    if (innerRingRef.current) {
      const inward = 1 - ((t * 1.4) % 0.35);
      innerRingRef.current.scale.set(inward, inward, 1);
    }

    // 2. Anel de vento descendente do Modo Helicóptero (Downwash)
    if (downwashRingRef.current) {
      if ((robotMotionBridge.isFlying || robotMotionBridge.propellerSpeed > 15.0) && robotMotionBridge.y > 0.06) {
        const expand = 1.0 + ((t * 4.0) % 1.0) * 0.8;
        const fade = Math.max(0, 0.35 - ((t * 4.0) % 1.0) * 0.35);
        downwashRingRef.current.scale.set(expand, expand, 1);
        const mat = downwashRingRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = fade;
        downwashRingRef.current.position.y = -robotMotionBridge.y + 0.005;
      } else {
        const mat = downwashRingRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0;
      }
    }

    // 3. Detecção de disparo do Canhão de Bolhas Anti-Gravitacionais
    if (robotMotionBridge.bubbleBurstTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = robotMotionBridge.bubbleBurstTrigger;
      soundManager.playBubbleShoot();

      // Dispara 5 bolhas com velocidades ascendentes e espalhamento radial
      let spawned = 0;
      for (const b of bubblesPool.current) {
        if (!b.active && spawned < 5) {
          b.active = true;
          b.x = (Math.random() - 0.5) * 0.15;
          b.y = 0.18;
          b.z = 0.08 + (Math.random() - 0.5) * 0.15;
          b.vx = (Math.random() - 0.5) * 0.35;
          b.vy = 0.45 + Math.random() * 0.35;
          b.vz = (Math.random() - 0.5) * 0.35;
          b.wobblePhase = Math.random() * Math.PI * 2;
          b.life = 0;
          b.maxLife = 2.0 + Math.random() * 1.0;
          b.radius = 0.055 + Math.random() * 0.035;
          spawned++;
        }
      }
    }

    // 4. Atualização das Bolhas
    let matricesNeedUpdate = false;
    bubblesPool.current.forEach((b, idx) => {
      if (b.active) {
        b.life += delta;
        b.y += b.vy * delta;
        b.x += (b.vx + Math.sin(t * 4.0 + b.wobblePhase) * 0.06) * delta;
        b.z += (b.vz + Math.cos(t * 4.0 + b.wobblePhase) * 0.06) * delta;

        // Estouro da bolha ao atingir vida útil máxima
        if (b.life >= b.maxLife) {
          b.active = false;
          soundManager.playBubblePop();

          // Limpa poeira local onde a bolha estourou
          const worldBubbleX = robotMotionBridge.x + b.x;
          const worldBubbleY = robotMotionBridge.y + b.y;
          const worldBubbleZ = robotMotionBridge.z + b.z;
          useEnvironmentStore.getState().cleanDustNearPoint(
            { x: worldBubbleX, z: worldBubbleZ },
            0.85,
            0.24,
            worldBubbleY
          );

          // Efeito de confetes no local do estouro
          let sparksSpawned = 0;
          for (const c of confettiPool.current) {
            if (!c.active && sparksSpawned < 8) {
              c.active = true;
              c.x = b.x;
              c.y = b.y;
              c.z = b.z;
              const angle = (sparksSpawned / 8) * Math.PI * 2 + Math.random() * 0.4;
              const speed = 0.4 + Math.random() * 0.4;
              c.vx = Math.cos(angle) * speed;
              c.vy = (Math.random() - 0.2) * 0.5;
              c.vz = Math.sin(angle) * speed;
              c.life = 0;
              c.maxLife = 0.5 + Math.random() * 0.3;
              sparksSpawned++;
            }
          }
        }

        dummy.position.set(b.x, b.y, b.z);
        const wobble = 1 + Math.sin(t * 8.0 + b.wobblePhase) * 0.07;
        dummy.scale.set(b.radius * wobble, b.radius / wobble, b.radius * wobble);
        dummy.updateMatrix();
        bubbleMeshRef.current?.setMatrixAt(idx, dummy.matrix);
        matricesNeedUpdate = true;
      } else {
        dummy.position.set(0, -999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        bubbleMeshRef.current?.setMatrixAt(idx, dummy.matrix);
      }
    });

    if (matricesNeedUpdate && bubbleMeshRef.current) {
      bubbleMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 5. Atualização dos Confetes
    let confettiActiveCount = 0;
    confettiPool.current.forEach((c, idx) => {
      if (c.active) {
        c.life += delta;
        c.x += c.vx * delta;
        c.y += c.vy * delta;
        c.z += c.vz * delta;
        c.vy -= 1.2 * delta; // Gravidade suave

        if (c.life >= c.maxLife) {
          c.active = false;
        }

        confettiPositions[idx * 3] = c.x;
        confettiPositions[idx * 3 + 1] = c.y;
        confettiPositions[idx * 3 + 2] = c.z;
        confettiActiveCount++;
      } else {
        confettiPositions[idx * 3] = 0;
        confettiPositions[idx * 3 + 1] = -999;
        confettiPositions[idx * 3 + 2] = 0;
      }
    });

    if (confettiPointsRef.current) {
      confettiPointsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const effectColor = isRecharging
    ? WORLD_PALETTE.ledEmerald
    : WORLD_PALETTE.sensorCyan;

  return (
    <group position={[0, 0.015, 0]}>
      {/* Anel de vento descendente do helicóptero projetado no piso */}
      <mesh ref={downwashRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.26, 0.52, 32]} />
        <meshBasicMaterial
          color="#94A3B8"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      {/* Anel externo pulsante de limpeza/recarga */}
      {(isCleaning || isRecharging) && (
        <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.28, 0.34, 36]} />
          <meshBasicMaterial
            color={effectColor}
            transparent
            opacity={0.26}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* Ondas concêntricas de sucção */}
      {isCleaning && (
        <mesh ref={innerRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.22, 0.25, 32]} />
          <meshBasicMaterial
            color={WORLD_PALETTE.robotYellow}
            transparent
            opacity={0.22}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* InstancedMesh para as 16 Bolhas Iridescentes Anti-Gravidade */}
      <instancedMesh
        ref={bubbleMeshRef}
        args={[undefined, undefined, MAX_BUBBLES]}
        material={bubbleMaterial}
      >
        <sphereGeometry args={[1, 16, 16]} />
      </instancedMesh>

      {/* Confetes cintilantes de estouro de bolhas */}
      <points ref={confettiPointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[confettiPositions, 3]}
          />
          <bufferAttribute
            attach="attributes-color"
            args={[confettiColors, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.024}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
});
