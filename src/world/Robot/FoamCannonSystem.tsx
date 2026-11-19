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
  shotId: number;
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
  u: number; // deslocamento tangente U
  v: number; // deslocamento tangente V
  outward: number; // projeção suave para fora da face
  r: number;
  popDelay: number;
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
const BUBBLES_PER_SPLAT = 9;
const TOTAL_INSTANCES = MAX_PROJECTILES + MAX_SPLATS * BUBBLES_PER_SPLAT;

// Gera bolhas com dimensões proporcionais e delicadas de espuma de sabão (respingo orgânico)
function generateSplatBubbles(radius: number): ClumpBubble[] {
  return [
    // Bolha central principal fofa
    { u: 0, v: 0, outward: 0.022, r: radius * 0.28, popDelay: 0.95 },
    // Bolhas periféricas médias
    { u: radius * 0.32, v: radius * 0.18, outward: 0.018, r: radius * 0.22, popDelay: 0.85 },
    { u: -radius * 0.28, v: radius * 0.24, outward: 0.019, r: radius * 0.21, popDelay: 0.78 },
    { u: radius * 0.16, v: -radius * 0.34, outward: 0.017, r: radius * 0.20, popDelay: 0.70 },
    { u: -radius * 0.24, v: -radius * 0.26, outward: 0.017, r: radius * 0.19, popDelay: 0.65 },
    // Gotículas externas menores criando respingo natural de espuma
    { u: radius * 0.52, v: -radius * 0.12, outward: 0.013, r: radius * 0.15, popDelay: 0.52 },
    { u: -radius * 0.48, v: radius * 0.14, outward: 0.014, r: radius * 0.14, popDelay: 0.46 },
    { u: radius * 0.12, v: radius * 0.50, outward: 0.014, r: radius * 0.13, popDelay: 0.42 },
    { u: -radius * 0.10, v: -radius * 0.54, outward: 0.012, r: radius * 0.13, popDelay: 0.36 },
  ];
}

// Calcula vetores tangentes ortogonais robustos a uma normal arbitrária
function computeOrthonormalBasis(nx: number, ny: number, nz: number) {
  let len = Math.hypot(nx, ny, nz);
  let normX = len > 0.001 ? nx / len : 0;
  let normY = len > 0.001 ? ny / len : 1;
  let normZ = len > 0.001 ? nz / len : 0;

  // Vetor de referência não paralelo à normal
  let rx = 0;
  let ry = 1;
  let rz = 0;
  if (Math.abs(normY) > 0.92) {
    rx = 1;
    ry = 0;
    rz = 0;
  }

  // Bitangent = Normal x Reference
  let bx = normY * rz - normZ * ry;
  let by = normZ * rx - normX * rz;
  let bz = normX * ry - normY * rx;
  const bLen = Math.hypot(bx, by, bz) || 1;
  bx /= bLen;
  by /= bLen;
  bz /= bLen;

  // Tangent = Bitangent x Normal
  let tx = by * normZ - bz * normY;
  let ty = bz * normX - bx * normZ;
  let tz = bx * normY - by * normX;
  const tLen = Math.hypot(tx, ty, tz) || 1;
  tx /= tLen;
  ty /= tLen;
  tz /= tLen;

  return {
    tx,
    ty,
    tz,
    bx,
    by,
    bz,
    nx: normX,
    ny: normY,
    nz: normZ,
  };
}

/**
 * Sistema Físico e Visual de Canhão de Espuma Lateral:
 * - Dispara jatos pneumáticos de bolhas volumosas em arco balístico
 * - Ao colidir em paredes, móveis ou chão, fixa montinhos tridimensionais achatados contra a face
 * - Cada disparo gera exatamente 1 mancha no ponto de impacto (sem empilhamentos gigantescos)
 * - Quando atinge qualquer gato, cobre o gato de espuma que se move junto com seu corpo
 * - Pool circular que recicla manchas antigas, garantindo que todo tiro sempre solte espuma
 * - frustumCulled={false} para visibilidade contínua em qualquer ângulo ou cômodo da casa
 */
export const FoamCannonSystem = memo(function FoamCannonSystem() {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const matrixBasis = useMemo(() => new THREE.Matrix4(), []);
  const vecT = useMemo(() => new THREE.Vector3(), []);
  const vecB = useMemo(() => new THREE.Vector3(), []);
  const vecN = useMemo(() => new THREE.Vector3(), []);

  const lastTriggerRef = useRef(robotMotionBridge.foamCannonTrigger);
  const lastShotSplatIdRef = useRef(-1);

  // Pool de projéteis em trânsito
  const projectilesPool = useRef<FoamProjectile[]>(
    Array.from({ length: MAX_PROJECTILES }, () => ({
      active: false,
      shotId: 0,
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
      radius: 0.045,
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
      maxLife: 9.0,
      radius: 0.18,
      seed: Math.random() * 100,
      bubbles: generateSplatBubbles(0.18),
    }))
  );

  // Material de espuma cremosa de sabão, perolada e brilhante (com leve emissivo para máxima nitidez)
  const foamMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FFFFFF',
        roughness: 0.16,
        metalness: 0.04,
        emissive: '#FFFFFF',
        emissiveIntensity: 0.28,
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
      const currentShotId = robotMotionBridge.foamCannonTrigger;
      lastTriggerRef.current = currentShotId;

      // Calcula a posição mundial da ponta do bocal em corneta do canhão lateral considerando a rotação e a mira angular
      const heading = robotMotionBridge.rotationY;
      const cosH = Math.cos(heading);
      const sinH = Math.sin(heading);

      // Posição local do pivô do canhão no chassi direito
      const pivotLocalX = 0.46;
      const pivotLocalY = 0.005;
      const pivotLocalZ = 0.09;

      // Direção tridimensional da mira angular ativa do canhão (yaw e pitch)
      const aimYaw = robotMotionBridge.cannonAimYaw || 0;
      const aimPitch = robotMotionBridge.cannonAimPitch || 0;
      const barrelDirX = Math.sin(aimYaw) * Math.cos(aimPitch);
      const barrelDirY = -Math.sin(aimPitch);
      const barrelDirZ = Math.cos(aimYaw) * Math.cos(aimPitch);

      // Ponta do bocal alargado em corneta (0.125m ao longo do cano)
      const nozzleTipDist = 0.125;
      const muzzleLocalX = pivotLocalX + barrelDirX * nozzleTipDist;
      const muzzleLocalY = pivotLocalY + barrelDirY * nozzleTipDist;
      const muzzleLocalZ = pivotLocalZ + barrelDirZ * nozzleTipDist;

      const worldNozzleX = robotMotionBridge.x + sinH * muzzleLocalZ + cosH * muzzleLocalX;
      const worldNozzleY = (robotMotionBridge.y || 0) + muzzleLocalY + 0.04;
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

      // Dispara rajada contínua de 8 projéteis em jato pressurizado
      let spawned = 0;
      for (const p of projectilesPool.current) {
        if (!p.active && spawned < 8) {
          p.active = true;
          p.shotId = currentShotId;
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
          p.elapsed = -(spawned * 0.022); // Espaçamento contínuo em fluxo sob pressão
          p.duration = flightDuration;
          p.radius = 0.042 + Math.random() * 0.022;
          p.spreadOffset = {
            x: (Math.random() - 0.5) * 0.08,
            y: (Math.random() - 0.5) * 0.08,
            z: (Math.random() - 0.5) * 0.08,
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

        // Detecção contínua de colisão com gatos em voo
        for (const cat of allCats) {
          const catDist = Math.hypot(
            p.currentX - cat.x,
            p.currentY - (cat.y || 0) - 0.15,
            p.currentZ - cat.z
          );
          if (catDist < 0.48) {
            cat.foamAmount = 1.0;
            cat.foamTimer = 8.5;
            if (cat.state !== 'STARTLED' && cat.state !== 'JUMPING' && cat.state !== 'RUNNING') {
              cat.state = 'STARTLED';
              cat.stateTimer = 0.5;
              soundManager.playCatMeow();
            }
          }
        }

        // Se o projétil atingiu o alvo: cria a mancha de espuma na superfície
        if (alpha >= 1.0) {
          p.active = false;

          // Confere se o ponto de impacto acertou um dos gatos
          for (const cat of allCats) {
            const catDist = Math.hypot(
              p.targetX - cat.x,
              p.targetY - (cat.y || 0) - 0.15,
              p.targetZ - cat.z
            );
            if (catDist < 0.55) {
              cat.foamAmount = 1.0;
              cat.foamTimer = 8.5;
              if (cat.state !== 'STARTLED' && cat.state !== 'JUMPING') {
                cat.state = 'STARTLED';
                cat.stateTimer = 0.55;
                soundManager.playCatMeow();
              }
            }
          }

          // REGRA DE OURO: Apenas 1 mancha por tiro! O primeiro projétil da rajada cria a mancha
          if (lastShotSplatIdRef.current !== p.shotId) {
            lastShotSplatIdRef.current = p.shotId;

            // Busca vaga livre ou recicla a mancha mais antiga (FIFO ring buffer)
            let targetSplat = splatsPool.current.find((s) => !s.active);
            if (!targetSplat) {
              targetSplat = splatsPool.current.reduce((oldest, curr) =>
                curr.life > oldest.life ? curr : oldest
              );
            }

            if (targetSplat) {
              targetSplat.active = true;
              targetSplat.x = p.targetX;
              targetSplat.y = p.targetY;
              targetSplat.z = p.targetZ;

              // Invariante de piso: superfícies horizontais no nível do solo ficam rente ao piso
              if (targetSplat.y <= 0.03 && Math.abs(p.normalY) > 0.7) {
                targetSplat.y = 0.005;
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
              targetSplat.normalX = basis.nx;
              targetSplat.normalY = basis.ny;
              targetSplat.normalZ = basis.nz;

              targetSplat.life = 0;
              targetSplat.maxLife = 8.5 + Math.random() * 2.5;
              targetSplat.radius = 0.16 + Math.random() * 0.04;
              targetSplat.seed = Math.random() * 100;
              targetSplat.bubbles = generateSplatBubbles(targetSplat.radius);

              // Higienização de poeira no ponto de impacto
              useEnvironmentStore
                .getState()
                .cleanDustNearPoint(
                  { x: targetSplat.x, z: targetSplat.z },
                  1.0,
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
          // Bolha aerodinâmica em voo
          const grow = 0.8 + alpha * 0.4;
          const wobble = 1 + Math.sin(t * 18.0 + idx) * 0.12;
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

        if (s.life < 0.22) {
          globalScale = (s.life / 0.22) * 1.08;
          flattenRatio = 1.0;
        } else if (s.life < s.maxLife - 2.5) {
          // Espuma fresca e borbulhante: ondula suavemente como espuma de verdade
          globalScale = 1.0 + Math.sin(t * 3.5 + s.seed) * 0.03;
          flattenRatio = 1.0 + Math.sin(t * 2.8 + s.seed) * 0.035;
        } else {
          isDissolving = true;
          dissolveProgress = Math.min(1.0, (s.life - (s.maxLife - 2.5)) / 2.5);
          globalScale = Math.max(0, 1.0 - dissolveProgress);
          flattenRatio = Math.max(0.25, 1.0 - dissolveProgress * 0.65);

          if (dissolveProgress >= 1.0) {
            s.active = false;
          }
        }

        // Matriz de rotação local alinhada com a superfície:
        // Eixo X local = Tangente, Eixo Y local = Bitangente, Eixo Z local = Normal (para fora da face)
        vecT.set(s.tangentX, s.tangentY, s.tangentZ);
        vecB.set(s.bitangentX, s.bitangentY, s.bitangentZ);
        vecN.set(s.normalX, s.normalY, s.normalZ);
        matrixBasis.makeBasis(vecT, vecB, vecN);
        dummy.quaternion.setFromRotationMatrix(matrixBasis);

        s.bubbles.forEach((b, bIdx) => {
          const instanceIdx = splatBaseIndex + bIdx;

          const bubbleAlive = !isDissolving || dissolveProgress < b.popDelay;

          if (s.active && bubbleAlive && globalScale > 0.01) {
            const bubbleScale =
              globalScale *
              (isDissolving ? 1.0 - (dissolveProgress / b.popDelay) * 0.65 : 1.0);

            // Projeta a bolhinha suavemente para fora da face para não afundar
            const outwardDist = Math.max(0.012, b.outward * flattenRatio);
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

            // Achatamento suave ao longo da normal (formato abobadado/lenticular aderido à superfície)
            const r = Math.max(0.008, b.r * bubbleScale);
            dummy.scale.set(r, r, r * 0.48);
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
      <sphereGeometry args={[1, 12, 12]} />
    </instancedMesh>
  );
});
