import { memo, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { robotMotionBridge } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { soundManager } from '@/services/soundManager';

interface FoamProjectile {
  active: boolean;
  startX: number;
  startY: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  elapsed: number;
  duration: number;
  radius: number;
  spreadOffset: { x: number; y: number; z: number };
}

interface ClumpBubble {
  dx: number;
  dy: number;
  dz: number;
  r: number;
}

interface FoamSplatInstance {
  active: boolean;
  x: number;
  y: number;
  z: number;
  life: number;
  maxLife: number;
  radius: number;
  seed: number;
  bubbles: ClumpBubble[];
}

const MAX_PROJECTILES = 36;
const MAX_SPLATS = 24;
const BUBBLES_PER_SPLAT = 7;
const TOTAL_INSTANCES = MAX_PROJECTILES + MAX_SPLATS * BUBBLES_PER_SPLAT;

// Gera os deslocamentos relativos orgânicos das bolhinhas em um montinho de espuma
function generateSplatBubbles(radius: number): ClumpBubble[] {
  const bubbles: ClumpBubble[] = [
    // Bolha central dominante
    { dx: 0, dy: radius * 0.25, dz: 0, r: radius * 0.42 },
  ];
  // 6 bolhas periféricas criando formato fofo e irregular
  for (let i = 0; i < 6; i++) {
    const ang = (i / 6) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const dist = radius * (0.35 + Math.random() * 0.35);
    bubbles.push({
      dx: Math.cos(ang) * dist,
      dy: radius * (0.12 + Math.random() * 0.16),
      dz: Math.sin(ang) * dist,
      r: radius * (0.28 + Math.random() * 0.15),
    });
  }
  return bubbles;
}

/**
 * Sistema Físico de Canhão de Espuma Lateral (Estilo Crash Kart):
 * - Dispara rajadas pneumáticas de projéteis de espuma em direção ao ponto mirado (parede, móvel ou chão)
 * - Ao colidir, cria montinhos de espuma tridimensional fofa no ponto de impacto exato
 * - A espuma permanece grudada no local por alguns segundos e vai sumindo aos poucos com o tempo (dissolvendo)
 * - Higieniza e remove a sujeira/poeira no raio de impacto com discriminação de altitude
 */
export const FoamCannonSystem = memo(function FoamCannonSystem() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastTriggerRef = useRef(robotMotionBridge.foamCannonTrigger);

  // Pool de projéteis de jatos de espuma em trânsito
  const projectilesPool = useRef<FoamProjectile[]>(
    Array.from({ length: MAX_PROJECTILES }, () => ({
      active: false,
      startX: 0,
      startY: 0,
      startZ: 0,
      targetX: 0,
      targetY: 0,
      targetZ: 0,
      currentX: 0,
      currentY: 0,
      currentZ: 0,
      elapsed: 0,
      duration: 0.25,
      radius: 0.05,
      spreadOffset: { x: 0, y: 0, z: 0 },
    }))
  );

  // Pool de manchas de espuma persistentes nas superfícies
  const splatsPool = useRef<FoamSplatInstance[]>(
    Array.from({ length: MAX_SPLATS }, () => ({
      active: false,
      x: 0,
      y: 0,
      z: 0,
      life: 0,
      maxLife: 7.2,
      radius: 0.24,
      seed: Math.random() * 100,
      bubbles: generateSplatBubbles(0.24),
    }))
  );

  // Material de espuma cremosa, perolada e semi-translúcida de sabão
  const foamMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.18,
        metalness: 0.02,
        clearcoat: 0.95,
        clearcoatRoughness: 0.12,
        transmission: 0.42,
        opacity: 0.92,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    let matricesNeedUpdate = false;

    // 1. Detecção de novos disparos do Canhão de Espuma
    if (robotMotionBridge.foamCannonTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = robotMotionBridge.foamCannonTrigger;

      // Calcula a posição mundial da ponta do cano lateral (lado direito do robô)
      const heading = robotMotionBridge.rotationY;
      const muzzleLocalX = 0.34;
      const muzzleLocalY = 0.03;
      const muzzleLocalZ = 0.16;

      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);
      const worldNozzleX = robotMotionBridge.x + sinH * muzzleLocalZ + cosH * muzzleLocalX;
      const worldNozzleY = (robotMotionBridge.y || 0) + muzzleLocalY + 0.04;
      const worldNozzleZ = robotMotionBridge.z + cosH * muzzleLocalZ - sinH * muzzleLocalX;

      const targetX = robotMotionBridge.foamTargetX;
      const targetY = robotMotionBridge.foamTargetY;
      const targetZ = robotMotionBridge.foamTargetZ;

      const dist = Math.hypot(targetX - worldNozzleX, targetY - worldNozzleY, targetZ - worldNozzleZ);
      const flightDuration = Math.max(0.12, Math.min(0.38, dist / 11.5));

      // Dispara uma rajada compacta de 8 projéteis de espuma
      let spawned = 0;
      for (const p of projectilesPool.current) {
        if (!p.active && spawned < 8) {
          p.active = true;
          p.startX = worldNozzleX;
          p.startY = worldNozzleY;
          p.startZ = worldNozzleZ;
          p.targetX = targetX;
          p.targetY = targetY;
          p.targetZ = targetZ;
          p.currentX = worldNozzleX;
          p.currentY = worldNozzleY;
          p.currentZ = worldNozzleZ;
          p.elapsed = -(spawned * 0.022); // Disparo cadenciado em jato contínuo
          p.duration = flightDuration;
          p.radius = 0.038 + Math.random() * 0.028;
          p.spreadOffset = {
            x: (Math.random() - 0.5) * 0.14,
            y: (Math.random() - 0.5) * 0.14,
            z: (Math.random() - 0.5) * 0.14,
          };
          spawned++;
        }
      }
    }

    // 2. Atualização dos Projéteis em voo
    projectilesPool.current.forEach((p, idx) => {
      const instanceIndex = idx;
      if (p.active) {
        p.elapsed += delta;

        if (p.elapsed < 0) {
          // Em espera na fila da rajada
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          instancedMeshRef.current?.setMatrixAt(instanceIndex, dummy.matrix);
          matricesNeedUpdate = true;
          return;
        }

        const alpha = Math.min(1.0, p.elapsed / p.duration);

        // Trajetória balística com leve arco de pressurização
        const arcY = Math.sin(alpha * Math.PI) * 0.12;
        p.currentX = THREE.MathUtils.lerp(p.startX, p.targetX, alpha) + p.spreadOffset.x * alpha;
        p.currentY = THREE.MathUtils.lerp(p.startY, p.targetY, alpha) + arcY + p.spreadOffset.y * alpha;
        p.currentZ = THREE.MathUtils.lerp(p.startZ, p.targetZ, alpha) + p.spreadOffset.z * alpha;

        // Se chegou ao alvo: impacto e criação do splat de espuma!
        if (alpha >= 1.0) {
          p.active = false;

          // Cria uma nova poça de espuma persistente no ponto de impacto
          const freeSplat = splatsPool.current.find((s) => !s.active);
          if (freeSplat) {
            freeSplat.active = true;
            freeSplat.x = p.targetX + p.spreadOffset.x * 0.5;
            freeSplat.y = p.targetY;
            freeSplat.z = p.targetZ + p.spreadOffset.z * 0.5;
            freeSplat.life = 0;
            freeSplat.maxLife = 6.8 + Math.random() * 1.0;
            freeSplat.radius = 0.22 + Math.random() * 0.08;
            freeSplat.seed = Math.random() * 100;
            freeSplat.bubbles = generateSplatBubbles(freeSplat.radius);

            // Higienização de sujeira/poeira no local atingido
            useEnvironmentStore.getState().cleanDustNearPoint(
              { x: freeSplat.x, z: freeSplat.z },
              1.1,
              0.45,
              freeSplat.y
            );

            soundManager.playFoamSplat();
          }

          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          instancedMeshRef.current?.setMatrixAt(instanceIndex, dummy.matrix);
        } else {
          dummy.position.set(p.currentX, p.currentY, p.currentZ);
          const wobble = 1 + Math.sin(t * 14.0 + idx) * 0.12;
          dummy.scale.set(p.radius * wobble, p.radius, p.radius * wobble);
          dummy.updateMatrix();
          instancedMeshRef.current?.setMatrixAt(instanceIndex, dummy.matrix);
        }
        matricesNeedUpdate = true;
      } else {
        dummy.position.set(0, -999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        instancedMeshRef.current?.setMatrixAt(instanceIndex, dummy.matrix);
      }
    });

    // 3. Atualização das Poças de Espuma (Ciclo de Vida Realista e Dissolução Gradual)
    let splatBaseIndex = MAX_PROJECTILES;

    splatsPool.current.forEach((s) => {
      if (s.active) {
        s.life += delta;

        // Fases do ciclo da espuma:
        // 0.0s - 0.25s: Pop-in elástico no impacto
        // 0.25s - 3.2s: Espuma cheia, densa e espumando no local
        // 3.2s - 7.5s: Dissolução gradual! Encolhe de diâmetro e achata como sabão real até sumir
        let scaleFactor = 1.0;
        let flattenY = 1.0;

        if (s.life < 0.25) {
          scaleFactor = (s.life / 0.25) * 1.08;
          flattenY = 0.85;
        } else if (s.life < 3.2) {
          scaleFactor = 1.0 + Math.sin(t * 3.0 + s.seed) * 0.035;
          flattenY = 0.95 + Math.sin(t * 2.2 + s.seed) * 0.04;
        } else {
          // Dissolução gradual
          const dissolveProgress = Math.min(1.0, (s.life - 3.2) / (s.maxLife - 3.2));
          scaleFactor = Math.max(0, 1.0 - dissolveProgress * 0.92);
          // O sabão derrete e achata ainda mais rápido na vertical
          flattenY = Math.max(0, 0.9 - dissolveProgress * 0.88);

          if (dissolveProgress >= 1.0) {
            s.active = false;
          }
        }

        s.bubbles.forEach((b, bIdx) => {
          const instanceIdx = splatBaseIndex + bIdx;
          if (s.active && scaleFactor > 0.01) {
            dummy.position.set(
              s.x + b.dx * scaleFactor,
              s.y + b.dy * flattenY,
              s.z + b.dz * scaleFactor
            );
            const r = b.r * scaleFactor;
            dummy.scale.set(r, r * flattenY, r);
            dummy.updateMatrix();
            instancedMeshRef.current?.setMatrixAt(instanceIdx, dummy.matrix);
          } else {
            dummy.position.set(0, -999, 0);
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();
            instancedMeshRef.current?.setMatrixAt(instanceIdx, dummy.matrix);
          }
        });
        matricesNeedUpdate = true;
      } else {
        for (let bIdx = 0; bIdx < BUBBLES_PER_SPLAT; bIdx++) {
          const instanceIdx = splatBaseIndex + bIdx;
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          instancedMeshRef.current?.setMatrixAt(instanceIdx, dummy.matrix);
        }
      }
      splatBaseIndex += BUBBLES_PER_SPLAT;
    });

    if (matricesNeedUpdate && instancedMeshRef.current) {
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[undefined, undefined, TOTAL_INSTANCES]}
      material={foamMaterial}
    >
      <sphereGeometry args={[1, 14, 14]} />
    </instancedMesh>
  );
});
