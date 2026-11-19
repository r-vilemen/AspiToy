import { memo, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { robotMotionBridge } from '@/store/robotStore';
import {
  catMotionBridge,
  whiteCatMotionBridge,
  tuxedoCatMotionBridge,
  useEnvironmentStore,
} from '@/store/environmentStore';
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
const MAX_SPLATS = 64;
const BUBBLES_PER_SPLAT = 10;
const TOTAL_INSTANCES = MAX_PROJECTILES + MAX_SPLATS * BUBBLES_PER_SPLAT;

// Gera os deslocamentos relativos das bolhinhas em um montinho de espuma alinhado à superfície
function generateSplatBubbles(radius: number): ClumpBubble[] {
  const bubbles: ClumpBubble[] = [
    // Bolha central dominante e volumosa
    { u: 0, v: 0, outward: radius * 0.48, r: radius * 0.54, popDelay: 0.95 },
  ];
  // 9 bolhas periféricas irregulares criando aspecto orgânico de espuma de sabão
  for (let i = 0; i < 9; i++) {
    const ang = (i / 9) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    const dist = radius * (0.34 + Math.random() * 0.44);
    bubbles.push({
      u: Math.cos(ang) * dist,
      v: Math.sin(ang) * dist,
      outward: radius * (0.24 + Math.random() * 0.28),
      r: radius * (0.28 + Math.random() * 0.2),
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
 * Sistema Físico e Visual de Canhão de Espuma Lateral:
 * - Dispara jatos pneumáticos de bolhas volumosas em arco balístico
 * - Ao colidir em paredes, móveis ou chão, fixa montinhos tridimensionais densos de espuma
 * - Quando atinge qualquer gato, cobre o gato de espuma que se move junto com seu corpo
 * - Pool circular que recicla manchas antigas, garantindo que todo tiro sempre solte espuma
 * - frustumCulled={false} para visibilidade contínua em qualquer ângulo ou cômodo da casa
 */
export const FoamCannonSystem = memo(function FoamCannonSystem() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastTriggerRef = useRef(robotMotionBridge.foamCannonTrigger);
  const lastSplatTimeRef = useRef(0);

  // Pool de projéteis em trânsito
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

  // Pool de manchas de espuma persistentes nas superfícies (chão, móveis e paredes)
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
      maxLife: 10.0,
      radius: 0.34,
      seed: Math.random() * 100,
      bubbles: generateSplatBubbles(0.34),
    }))
  );

  // Material de espuma cremosa de sabão, perolada e ultra-visível (sem depthWrite para evitar artefatos de oclusão)
  const foamMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.15,
        metalness: 0.05,
        emissive: '#FFFFFF',
        emissiveIntensity: 0.32,
        transparent: true,
        opacity: 0.96,
        depthWrite: false,
      }),
    []
  );

  // Inicializa todos os instances invisíveis fora do campo de visão na montagem
  useEffect(() => {
    if (instancedMeshRef.current) {
      instancedMeshRef.current.frustumCulled = false;
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

      let targetX = robotMotionBridge.foamTargetX;
      let targetY = robotMotionBridge.foamTargetY;
      let targetZ = robotMotionBridge.foamTargetZ;

      // Fallback se o alvo estiver indefinido
      if (Math.hypot(targetX, targetZ) < 0.01) {
        targetX = robotMotionBridge.x + Math.sin(heading) * 2.8;
        targetY = (robotMotionBridge.y || 0) + 0.15;
        targetZ = robotMotionBridge.z + Math.cos(heading) * 2.8;
      }

      let normX = robotMotionBridge.foamTargetNormalX || 0;
      let normY = robotMotionBridge.foamTargetNormalY || 0;
      let normZ = robotMotionBridge.foamTargetNormalZ || 0;

      // Normal padrão para cima se não identificada
      if (Math.hypot(normX, normY, normZ) < 0.1) {
        normX = 0;
        normY = 1;
        normZ = 0;
      }

      const dist = Math.hypot(targetX - worldNozzleX, targetY - worldNozzleY, targetZ - worldNozzleZ);
      const flightDuration = Math.max(0.2, Math.min(0.48, dist / 8.5));

      // Dispara rajada contínua de 10 projéteis volumosos em jato sob pressão
      let spawned = 0;
      for (const p of projectilesPool.current) {
        if (!p.active && spawned < 10) {
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
          p.elapsed = -(spawned * 0.022); // Espaçamento contínuo em jato pressurizado
          p.duration = flightDuration;
          p.radius = 0.065 + Math.random() * 0.045;
          p.spreadOffset = {
            x: (Math.random() - 0.5) * 0.18,
            y: (Math.random() - 0.5) * 0.18,
            z: (Math.random() - 0.5) * 0.18,
          };
          spawned++;
        }
      }
    }

    const allCats = [
      catMotionBridge,
      whiteCatMotionBridge,
      tuxedoCatMotionBridge,
    ];

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
        const arcY = Math.sin(alpha * Math.PI) * 0.22;
        p.currentX = THREE.MathUtils.lerp(p.startX, p.targetX, alpha) + p.spreadOffset.x * alpha;
        p.currentY = THREE.MathUtils.lerp(p.startY, p.targetY, alpha) + arcY + p.spreadOffset.y * alpha;
        p.currentZ = THREE.MathUtils.lerp(p.startZ, p.targetZ, alpha) + p.spreadOffset.z * alpha;

        // Detecção contínua de colisão de projétil contra os gatos da casa
        for (const cat of allCats) {
          const catDist = Math.hypot(
            p.currentX - cat.x,
            p.currentY - (cat.y || 0) - 0.15,
            p.currentZ - cat.z
          );
          if (catDist < 0.5) {
            cat.foamAmount = 1.0;
            cat.foamTimer = 8.5; // Fica ensaboado por 8.5 segundos
            if (cat.state !== 'STARTLED' && cat.state !== 'JUMPING' && cat.state !== 'RUNNING') {
              cat.state = 'STARTLED';
              cat.stateTimer = 0.5;
              soundManager.playCatMeow();
            }
          }
        }

        // Se o projétil atingiu o alvo: cria o montinho de espuma na superfície
        if (alpha >= 1.0) {
          p.active = false;

          // Confere se o ponto de impacto acertou um dos gatos
          for (const cat of allCats) {
            const catDist = Math.hypot(
              p.targetX - cat.x,
              p.targetY - (cat.y || 0) - 0.15,
              p.targetZ - cat.z
            );
            if (catDist < 0.6) {
              cat.foamAmount = 1.0;
              cat.foamTimer = 8.5;
              if (cat.state !== 'STARTLED' && cat.state !== 'JUMPING') {
                cat.state = 'STARTLED';
                cat.stateTimer = 0.55;
                soundManager.playCatMeow();
              }
            }
          }

          // Controle de frequência de manchas para não duplicar exatamente no mesmo milésimo
          const nowSec = state.clock.elapsedTime;
          const canSpawnSplat = nowSec - lastSplatTimeRef.current > 0.045;

          if (canSpawnSplat) {
            lastSplatTimeRef.current = nowSec;

            // Busca vaga livre ou recicla a mancha mais antiga (FIFO ring buffer)
            let targetSplat = splatsPool.current.find((s) => !s.active);
            if (!targetSplat) {
              targetSplat = splatsPool.current.reduce((oldest, curr) =>
                curr.life > oldest.life ? curr : oldest
              );
            }

            if (targetSplat) {
              targetSplat.active = true;
              targetSplat.x = p.targetX + p.spreadOffset.x * 0.35;
              targetSplat.y = p.targetY + p.spreadOffset.y * 0.35;
              targetSplat.z = p.targetZ + p.spreadOffset.z * 0.35;

              // Invariante de piso: nunca deixa a espuma afundar abaixo do chão
              if (targetSplat.y <= 0.02) {
                targetSplat.y = 0.01;
                targetSplat.normalX = 0;
                targetSplat.normalY = 1;
                targetSplat.normalZ = 0;
              } else {
                targetSplat.normalX = p.normalX;
                targetSplat.normalY = p.normalY;
                targetSplat.normalZ = p.normalZ;
              }

              const basis = computeOrthonormalBasis(
                targetSplat.normalX,
                targetSplat.normalY,
                targetSplat.normalZ
              );
              targetSplat.tangentX = basis.tx;
              targetSplat.tangentY = basis.ty;
              targetSplat.tangentZ = basis.tz;
              targetSplat.bitangentX = basis.bx;
              targetSplat.bitangentY = basis.by;
              targetSplat.bitangentZ = basis.bz;

              targetSplat.life = 0;
              targetSplat.maxLife = 9.0 + Math.random() * 3.5;
              targetSplat.radius = 0.34 + Math.random() * 0.1;
              targetSplat.seed = Math.random() * 100;
              targetSplat.bubbles = generateSplatBubbles(targetSplat.radius);

              // Higienização de poeira/sujeira no ponto de impacto
              useEnvironmentStore
                .getState()
                .cleanDustNearPoint(
                  { x: targetSplat.x, z: targetSplat.z },
                  1.2,
                  0.5,
                  targetSplat.y
                );

              soundManager.playFoamSplat();
            }
          }

          dummy.position.set(0, -999, 0);
          dummy.scale.set(0, 0, 0);
          dummy.updateMatrix();
          instancedMeshRef.current?.setMatrixAt(instanceIndex, dummy.matrix);
        } else {
          dummy.position.set(p.currentX, p.currentY, p.currentZ);
          // Expansão e ondulação volumétrica da bolha em voo
          const grow = 0.7 + alpha * 0.6;
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

        let globalScale = 1.0;
        let flattenRatio = 1.0;
        let isDissolving = false;
        let dissolveProgress = 0;

        if (s.life < 0.25) {
          globalScale = (s.life / 0.25) * 1.1;
          flattenRatio = 1.0;
        } else if (s.life < s.maxLife - 3.0) {
          // Espuma fresca e borbulhante: ondula suavemente como espuma de verdade
          globalScale = 1.0 + Math.sin(t * 3.5 + s.seed) * 0.035;
          flattenRatio = 1.0 + Math.sin(t * 2.8 + s.seed) * 0.04;
        } else {
          isDissolving = true;
          dissolveProgress = Math.min(1.0, (s.life - (s.maxLife - 3.0)) / 3.0);
          globalScale = Math.max(0, 1.0 - dissolveProgress);
          flattenRatio = Math.max(0.2, 1.0 - dissolveProgress * 0.6);

          if (dissolveProgress >= 1.0) {
            s.active = false;
          }
        }

        s.bubbles.forEach((b, bIdx) => {
          const instanceIdx = splatBaseIndex + bIdx;

          const bubbleAlive = !isDissolving || dissolveProgress < b.popDelay;

          if (s.active && bubbleAlive && globalScale > 0.01) {
            const bubbleScale =
              globalScale *
              (isDissolving ? 1.0 - (dissolveProgress / b.popDelay) * 0.65 : 1.0);

            // Projeta a bolhinha para FORA da superfície ao longo da normal
            // Isso garante que NUNCA afunde na parede ou móvel!
            const outwardDist = Math.max(0.045, b.outward * flattenRatio);
            const posX =
              s.x +
              (s.tangentX * b.u + s.bitangentX * b.v) * bubbleScale +
              s.normalX * outwardDist;
            const posY =
              s.y +
              (s.tangentY * b.u + s.bitangentY * b.v) * bubbleScale +
              s.normalY * outwardDist;
            const posZ =
              s.z +
              (s.tangentZ * b.u + s.bitangentZ * b.v) * bubbleScale +
              s.normalZ * outwardDist;

            dummy.position.set(posX, posY, posZ);

            const r = Math.max(0.012, b.r * bubbleScale);
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
      frustumCulled={false}
      name="foam-cannon-system"
    >
      <sphereGeometry args={[1, 14, 14]} />
    </instancedMesh>
  );
});
