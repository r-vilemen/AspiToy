import { memo, useMemo, useRef, useEffect } from 'react';
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
  normalX: number;
  normalY: number;
  normalZ: number;
  currentX: number;
  currentY: number;
  currentZ: number;
  elapsed: number;
  duration: number;
  radius: number;
  spreadOffset: { x: number; y: number; z: number };
}

interface ClumpBubble {
  u: number; // deslocamento no plano tangente 1
  v: number; // deslocamento no plano tangente 2
  outward: number; // projeção para fora da superfície ao longo da normal
  r: number;
  popDelay: number; // tempo de estouro individual durante a dissolução
}

interface FoamSplatInstance {
  active: boolean;
  x: number;
  y: number;
  z: number;
  normalX: number;
  normalY: number;
  normalZ: number;
  tangentX: number;
  tangentY: number;
  tangentZ: number;
  bitangentX: number;
  bitangentY: number;
  bitangentZ: number;
  life: number;
  maxLife: number;
  radius: number;
  seed: number;
  bubbles: ClumpBubble[];
}

const MAX_PROJECTILES = 48;
const MAX_SPLATS = 32;
const BUBBLES_PER_SPLAT = 9;
const TOTAL_INSTANCES = MAX_PROJECTILES + MAX_SPLATS * BUBBLES_PER_SPLAT;

// Gera os deslocamentos relativos das bolhinhas em um montinho de espuma alinhado à superfície
function generateSplatBubbles(radius: number): ClumpBubble[] {
  const bubbles: ClumpBubble[] = [
    // Bolha central dominante e volumosa
    { u: 0, v: 0, outward: radius * 0.42, r: radius * 0.48, popDelay: 0.95 },
  ];
  // 8 bolhas periféricas irregulares criando aspecto orgânico de espuma de sabão
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.32;
    const dist = radius * (0.32 + Math.random() * 0.38);
    bubbles.push({
      u: Math.cos(ang) * dist,
      v: Math.sin(ang) * dist,
      outward: radius * (0.20 + Math.random() * 0.22),
      r: radius * (0.24 + Math.random() * 0.16),
      popDelay: 0.35 + Math.random() * 0.55,
    });
  }
  return bubbles;
}

// Calcula vetores tangentes ortogonais a uma normal arbitrária
function computeOrthonormalBasis(nx: number, ny: number, nz: number) {
  let tx = 0;
  let ty = 1;
  let tz = 0;
  if (Math.abs(ny) > 0.92) {
    tx = 1;
    ty = 0;
    tz = 0;
  }
  // Bitangent = N x T_approx
  let bx = ny * tz - nz * ty;
  let by = nz * tx - nx * tz;
  let bz = nx * ty - ny * tx;
  const bLen = Math.hypot(bx, by, bz) || 1;
  bx /= bLen;
  by /= bLen;
  bz /= bLen;

  // Tangent = B x N
  tx = by * nz - bz * ny;
  ty = bz * nx - bx * nz;
  tz = bx * ny - by * nx;
  const tLen = Math.hypot(tx, ty, tz) || 1;
  tx /= tLen;
  ty /= tLen;
  tz /= tLen;

  return { tx, ty, tz, bx, by, bz };
}

/**
 * Sistema Físico e Visual de Canhão de Espuma Lateral (Estilo Crash Kart):
 * - Dispara rajadas pneumáticas visíveis de jatos de espuma (projéteis volumosos brancos)
 * - Ao colidir em qualquer superfície (paredes, móveis e chão), projeta montinhos tridimensionais
 *   de espuma alinhados à normal da superfície para não afundar nas paredes
 * - A espuma permanece fixada no local por alguns segundos, borbulhando e dissolvendo gradualmente
 * - Remove a poeira/sujeira no raio do impacto
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
      normalX: 0,
      normalY: 1,
      normalZ: 0,
      currentX: 0,
      currentY: 0,
      currentZ: 0,
      elapsed: 0,
      duration: 0.32,
      radius: 0.08,
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
      normalX: 0,
      normalY: 1,
      normalZ: 0,
      tangentX: 1,
      tangentY: 0,
      tangentZ: 0,
      bitangentX: 0,
      bitangentY: 0,
      bitangentZ: 1,
      life: 0,
      maxLife: 8.5,
      radius: 0.28,
      seed: Math.random() * 100,
      bubbles: generateSplatBubbles(0.28),
    }))
  );

  // Material de espuma cremosa, perolada e nítida de sabão (sem transmission para máxima compatibilidade WebGL)
  const foamMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#FFFFFF',
        roughness: 0.22,
        metalness: 0.02,
        clearcoat: 0.85,
        clearcoatRoughness: 0.1,
        emissive: '#F0F9FF',
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.96,
        depthWrite: true,
      }),
    []
  );

  // Inicializa todos os instances invisíveis fora do campo de visão na montagem
  useEffect(() => {
    if (instancedMeshRef.current) {
      dummy.position.set(0, -999, 0);
      dummy.scale.set(0, 0, 0);
      dummy.updateMatrix();
      for (let i = 0; i < TOTAL_INSTANCES; i++) {
        instancedMeshRef.current.setMatrixAt(i, dummy.matrix);
      }
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    let matricesNeedUpdate = false;

    // 1. Detecção de novos disparos do Canhão de Espuma
    if (robotMotionBridge.foamCannonTrigger > lastTriggerRef.current) {
      lastTriggerRef.current = robotMotionBridge.foamCannonTrigger;

      // Calcula a posição mundial da ponta do bocal em corneta do canhão lateral
      const heading = robotMotionBridge.rotationY;
      const muzzleLocalX = 0.42; // canhão estendido para a lateral direita
      const muzzleLocalY = 0.025;
      const muzzleLocalZ = 0.22; // bocal frontal projetado para a frente

      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);
      const worldNozzleX = robotMotionBridge.x + sinH * muzzleLocalZ + cosH * muzzleLocalX;
      const worldNozzleY = (robotMotionBridge.y || 0) + muzzleLocalY + 0.035;
      const worldNozzleZ = robotMotionBridge.z + cosH * muzzleLocalZ - sinH * muzzleLocalX;

      const targetX = robotMotionBridge.foamTargetX;
      const targetY = robotMotionBridge.foamTargetY;
      const targetZ = robotMotionBridge.foamTargetZ;

      const normX = robotMotionBridge.foamTargetNormalX || 0;
      const normY = robotMotionBridge.foamTargetNormalY || 1;
      const normZ = robotMotionBridge.foamTargetNormalZ || 0;

      const dist = Math.hypot(targetX - worldNozzleX, targetY - worldNozzleY, targetZ - worldNozzleZ);
      const flightDuration = Math.max(0.22, Math.min(0.48, dist / 8.5));

      // Dispara uma rajada generosa e densa de 16 projéteis de espuma em jato contínuo
      let spawned = 0;
      for (const p of projectilesPool.current) {
        if (!p.active && spawned < 16) {
          p.active = true;
          p.startX = worldNozzleX;
          p.startY = worldNozzleY;
          p.startZ = worldNozzleZ;
          p.targetX = targetX;
          p.targetY = targetY;
          p.targetZ = targetZ;
          p.normalX = normX;
          p.normalY = normY;
          p.normalZ = normZ;
          p.currentX = worldNozzleX;
          p.currentY = worldNozzleY;
          p.currentZ = worldNozzleZ;
          p.elapsed = -(spawned * 0.016); // Espaçamento contínuo em jato pressurizado
          p.duration = flightDuration;
          p.radius = 0.055 + Math.random() * 0.055;
          p.spreadOffset = {
            x: (Math.random() - 0.5) * 0.18,
            y: (Math.random() - 0.5) * 0.18,
            z: (Math.random() - 0.5) * 0.18,
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
          // Em espera na fila de dispersão do jato
          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          instancedMeshRef.current?.setMatrixAt(instanceIndex, dummy.matrix);
          matricesNeedUpdate = true;
          return;
        }

        const alpha = Math.min(1.0, p.elapsed / p.duration);

        // Trajetória balística com arco aerodinâmico visível
        const arcY = Math.sin(alpha * Math.PI) * 0.18;
        p.currentX = THREE.MathUtils.lerp(p.startX, p.targetX, alpha) + p.spreadOffset.x * alpha;
        p.currentY = THREE.MathUtils.lerp(p.startY, p.targetY, alpha) + arcY + p.spreadOffset.y * alpha;
        p.currentZ = THREE.MathUtils.lerp(p.startZ, p.targetZ, alpha) + p.spreadOffset.z * alpha;

        // Se o projétil atingiu o alvo: cria o montinho de espuma na superfície
        if (alpha >= 1.0) {
          p.active = false;

          const freeSplat = splatsPool.current.find((s) => !s.active);
          if (freeSplat) {
            freeSplat.active = true;
            freeSplat.x = p.targetX + p.spreadOffset.x * 0.4;
            freeSplat.y = p.targetY + p.spreadOffset.y * 0.4;
            freeSplat.z = p.targetZ + p.spreadOffset.z * 0.4;
            freeSplat.normalX = p.normalX;
            freeSplat.normalY = p.normalY;
            freeSplat.normalZ = p.normalZ;

            const basis = computeOrthonormalBasis(p.normalX, p.normalY, p.normalZ);
            freeSplat.tangentX = basis.tx;
            freeSplat.tangentY = basis.ty;
            freeSplat.tangentZ = basis.tz;
            freeSplat.bitangentX = basis.bx;
            freeSplat.bitangentY = basis.by;
            freeSplat.bitangentZ = basis.bz;

            freeSplat.life = 0;
            freeSplat.maxLife = 8.0 + Math.random() * 1.5;
            freeSplat.radius = 0.26 + Math.random() * 0.08;
            freeSplat.seed = Math.random() * 100;
            freeSplat.bubbles = generateSplatBubbles(freeSplat.radius);

            // Higienização profunda de poeira/sujeira no ponto de impacto
            useEnvironmentStore.getState().cleanDustNearPoint(
              { x: freeSplat.x, z: freeSplat.z },
              1.2,
              0.5,
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
          // Expansão e ondulação volumétrica da bolha em voo
          const grow = 0.6 + alpha * 0.55;
          const wobble = 1 + Math.sin(t * 18.0 + idx) * 0.14;
          const currentR = p.radius * grow * wobble;
          dummy.scale.set(currentR, currentR, currentR);
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

    // 3. Atualização dos Montinhos de Espuma (Aderência em Paredes, Móveis e Chão com Dissolução Realista)
    let splatBaseIndex = MAX_PROJECTILES;

    splatsPool.current.forEach((s) => {
      if (s.active) {
        s.life += delta;

        // Fases do ciclo de vida da espuma de verdade:
        // 0.0s - 0.25s: Elastic pop-in de impacto
        // 0.25s - 4.5s: Espuma cheia, densa e espumando no local (com micro-fizzing de sabão)
        // 4.5s - 8.5s: Dissolução gradual! Bolhas estouram progressivamente, o montinho achata e some
        let globalScale = 1.0;
        let flattenRatio = 1.0;
        let isDissolving = false;
        let dissolveProgress = 0;

        if (s.life < 0.25) {
          globalScale = (s.life / 0.25) * 1.06;
          flattenRatio = 0.9;
        } else if (s.life < 4.5) {
          // Espuma fresca e borbulhante
          globalScale = 1.0 + Math.sin(t * 3.5 + s.seed) * 0.03;
          flattenRatio = 1.0 + Math.sin(t * 2.8 + s.seed) * 0.035;
        } else {
          isDissolving = true;
          dissolveProgress = Math.min(1.0, (s.life - 4.5) / (s.maxLife - 4.5));
          globalScale = Math.max(0, 1.0 - dissolveProgress * 0.95);
          flattenRatio = Math.max(0, 0.92 - dissolveProgress * 0.85);

          if (dissolveProgress >= 1.0) {
            s.active = false;
          }
        }

        s.bubbles.forEach((b, bIdx) => {
          const instanceIdx = splatBaseIndex + bIdx;

          // Durante a dissolução, bolhas individuais estouram em tempos ligeiramente diferentes
          const bubbleAlive = !isDissolving || dissolveProgress < b.popDelay;

          if (s.active && bubbleAlive && globalScale > 0.01) {
            const bubbleScale = globalScale * (isDissolving ? 1.0 - (dissolveProgress / b.popDelay) * 0.75 : 1.0);

            // Posiciona a bolhinha no espaço 3D usando a base ortonormal da superfície
            const posX =
              s.x +
              (s.tangentX * b.u + s.bitangentX * b.v) * bubbleScale +
              s.normalX * (b.outward * flattenRatio);
            const posY =
              s.y +
              (s.tangentY * b.u + s.bitangentY * b.v) * bubbleScale +
              s.normalY * (b.outward * flattenRatio);
            const posZ =
              s.z +
              (s.tangentZ * b.u + s.bitangentZ * b.v) * bubbleScale +
              s.normalZ * (b.outward * flattenRatio);

            dummy.position.set(posX, posY, posZ);

            const r = b.r * bubbleScale;
            dummy.scale.set(r, r, r);
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
      <sphereGeometry args={[1, 16, 16]} />
    </instancedMesh>
  );
});
