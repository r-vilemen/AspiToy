import { memo, useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { robotMotionBridge, useRobotStore, manualControlBridge } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { ALL_HOUSE_OBSTACLES } from './HouseObstacles';
import { soundManager } from '@/services/soundManager';

interface DustSeed {
  x: number;
  z: number;
  y: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotY: number;
  color: THREE.Color;
  regionId: string;
}

interface GroundPatchSeed {
  x: number;
  z: number;
  y: number;
  radius: number;
  opacity: number;
  regionId: string;
}

function pseudoRandom(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Verifica se um ponto no piso colide com móveis pesados e paredes intransitáveis.
 */
function isInsideObstacle(x: number, z: number): boolean {
  for (let i = 0; i < ALL_HOUSE_OBSTACLES.length; i++) {
    const obs = ALL_HOUSE_OBSTACLES[i];
    if (!obs.collidable) continue;
    const b = obs.bounds;
    if (
      x >= b.minX - 0.08 &&
      x <= b.maxX + 0.08 &&
      z >= b.minZ - 0.08 &&
      z <= b.maxZ + 0.08
    ) {
      return true;
    }
  }
  return false;
}

const DUST_PALETTE = [
  '#C7BAA7', // Fiapo de poeira claro
  '#B8A894', // Tufo de poeira bege
  '#A39482', // Poeira acinzentada suave
  '#948473', // Fiapo médio
  '#D6C2A8', // Farelo / penugem quente
  '#8A7B6B', // Poeira densa de canto
];

/**
 * Gera sementes de poeira espalhadas uniformemente pelas áreas caminháveis de cada cômodo.
 */
function generateDustSeeds(): { seeds: DustSeed[]; patches: GroundPatchSeed[] } {
  const prng = pseudoRandom(42);
  const seeds: DustSeed[] = [];
  const patches: GroundPatchSeed[] = [];

  const roomDefs: Array<{
    regionId: string;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    targetCount: number;
    patchCount: number;
  }> = [
    // Quarto
    { regionId: 'bedroom', minX: -4.3, maxX: 4.3, minZ: -3.3, maxZ: 3.3, targetCount: 120, patchCount: 12 },
    // Corredor
    { regionId: 'hallway', minX: 5.3, maxX: 7.3, minZ: -3.3, maxZ: 7.8, targetCount: 65, patchCount: 7 },
    // Sala de Estar
    { regionId: 'living-room', minX: 8.2, maxX: 16.8, minZ: -3.3, maxZ: 2.5, targetCount: 115, patchCount: 11 },
    // Cozinha
    { regionId: 'kitchen', minX: 8.2, maxX: 16.8, minZ: 3.6, maxZ: 7.8, targetCount: 95, patchCount: 9 },
    // Banheiro
    { regionId: 'bathroom', minX: 5.4, maxX: 10.0, minZ: 8.8, maxZ: 12.8, targetCount: 65, patchCount: 7 },
  ];

  for (const def of roomDefs) {
    let generated = 0;
    let attempts = 0;
    const maxAttempts = def.targetCount * 8;

    while (generated < def.targetCount && attempts < maxAttempts) {
      attempts++;
      const x = def.minX + prng() * (def.maxX - def.minX);
      const z = def.minZ + prng() * (def.maxZ - def.minZ);

      if (isInsideObstacle(x, z)) continue;

      // Determina altura base dependendo do tapete do quarto
      let y = 0.015;
      if (def.regionId === 'bedroom') {
        const rugDist = Math.hypot(x - (-0.75), z - (-1.1));
        if (rugDist < 2.05) {
          y = 0.026;
        }
      }

      // Escala orgânica variada: alguns farelos pequenos, outros tufos fofos
      const sizeType = prng();
      let sx = 0.03;
      let sy = 0.012;
      let sz = 0.028;

      if (sizeType > 0.75) {
        // Tufo grande (dust bunny)
        sx = 0.055 + prng() * 0.035;
        sy = 0.018 + prng() * 0.012;
        sz = 0.05 + prng() * 0.03;
      } else if (sizeType > 0.35) {
        // Tufo médio
        sx = 0.035 + prng() * 0.02;
        sy = 0.014 + prng() * 0.008;
        sz = 0.032 + prng() * 0.018;
      } else {
        // Farelinho / grão de poeira
        sx = 0.02 + prng() * 0.012;
        sy = 0.008 + prng() * 0.005;
        sz = 0.018 + prng() * 0.01;
      }

      const colorHex = DUST_PALETTE[Math.floor(prng() * DUST_PALETTE.length)];
      const color = new THREE.Color(colorHex);

      seeds.push({
        x,
        y,
        z,
        scaleX: sx,
        scaleY: sy,
        scaleZ: sz,
        rotY: prng() * Math.PI * 2,
        color,
        regionId: def.regionId,
      });

      generated++;
    }

    // Gera manchas de poeira suaves no piso
    let pGen = 0;
    let pAttempts = 0;
    while (pGen < def.patchCount && pAttempts < def.patchCount * 6) {
      pAttempts++;
      const px = def.minX + prng() * (def.maxX - def.minX);
      const pz = def.minZ + prng() * (def.maxZ - def.minZ);
      if (isInsideObstacle(px, pz)) continue;

      let py = 0.006;
      if (def.regionId === 'bedroom') {
        const rDist = Math.hypot(px - (-0.75), pz - (-1.1));
        if (rDist < 2.05) py = 0.024;
      }

      patches.push({
        x: px,
        z: pz,
        y: py,
        radius: 0.22 + prng() * 0.26,
        opacity: 0.18 + prng() * 0.14,
        regionId: def.regionId,
      });
      pGen++;
    }
  }

  return { seeds, patches };
}

export const ROOM_WALKABLE_AREAS: Record<string, number> = {
  bedroom: 32.0,
  hallway: 18.0,
  'living-room': 36.0,
  kitchen: 24.0,
  bathroom: 12.0,
};
export const TOTAL_HOUSE_WALKABLE_AREA = 122.0;

export const ROOM_DISPLAY_NAMES: Record<string, string> = {
  bedroom: 'Quarto',
  hallway: 'Corredor',
  'living-room': 'Sala de Estar',
  kitchen: 'Cozinha',
  bathroom: 'Banheiro',
};

/**
 * Sistema de Poeira Dinâmica no Piso do AspiToy:
 * - Centenas de tufos, fiapos e farelos de poeira 3D orgânicos distribuídos pela residência inteira.
 * - Renderizado em 1 única chamada de desenho (InstancedMesh) em 60 FPS com zero alocação de memória por frame.
 * - Quando o robô passa (autônomo ou controle manual), a sucção do aspirador atrai e remove os tufos em tempo real.
 * - Manchas suaves de poeira no chão também desaparecem, revelando o piso brilhando e higienizado.
 * - Sincroniza o progresso da limpeza em tempo real com o Dashboard e o AgentController.
 */
export const FloorDust = memo(function FloorDust() {
  const clumpsMeshRef = useRef<THREE.InstancedMesh>(null);
  const patchesMeshRef = useRef<THREE.InstancedMesh>(null);
  const syncTimerRef = useRef(0);

  const { seeds, patches } = useMemo(() => generateDustSeeds(), []);

  // Mapeamento pré-calculado de índices por cômodo para performance máxima de cálculo
  const roomIndices = useMemo(() => {
    const map: Record<string, { clumps: number[]; patches: number[] }> = {
      bedroom: { clumps: [], patches: [] },
      hallway: { clumps: [], patches: [] },
      'living-room': { clumps: [], patches: [] },
      kitchen: { clumps: [], patches: [] },
      bathroom: { clumps: [], patches: [] },
    };
    seeds.forEach((s, idx) => {
      if (map[s.regionId]) map[s.regionId].clumps.push(idx);
    });
    patches.forEach((p, idx) => {
      if (map[p.regionId]) map[p.regionId].patches.push(idx);
    });
    return map;
  }, [seeds, patches]);

  // Estado mutável por partícula para animação suave de sucção
  const clumpsStateRef = useRef<
    Array<{
      isCleaned: boolean;
      animScale: number; // 1.0 (visível) -> 0.0 (aspirado)
      curX: number;
      curZ: number;
      curY: number;
    }>
  >([]);

  const patchesStateRef = useRef<
    Array<{
      isCleaned: boolean;
      animScale: number;
    }>
  >([]);

  // Inicializa estados mutáveis
  useEffect(() => {
    clumpsStateRef.current = seeds.map((s) => ({
      isCleaned: false,
      animScale: 1.0,
      curX: s.x,
      curZ: s.z,
      curY: s.y,
    }));

    patchesStateRef.current = patches.map(() => ({
      isCleaned: false,
      animScale: 1.0,
    }));
  }, [seeds, patches]);

  // Aplica cores e matrizes iniciais nos InstancedMeshes
  useEffect(() => {
    const clumpsMesh = clumpsMeshRef.current;
    if (!clumpsMesh) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < seeds.length; i++) {
      const s = seeds[i];
      dummy.position.set(s.x, s.y, s.z);
      dummy.rotation.set(0, s.rotY, 0);
      dummy.scale.set(s.scaleX, s.scaleY, s.scaleZ);
      dummy.updateMatrix();

      clumpsMesh.setMatrixAt(i, dummy.matrix);
      clumpsMesh.setColorAt(i, s.color);
    }
    clumpsMesh.instanceMatrix.needsUpdate = true;
    if (clumpsMesh.instanceColor) {
      clumpsMesh.instanceColor.needsUpdate = true;
    }
  }, [seeds]);

  useEffect(() => {
    const patchesMesh = patchesMeshRef.current;
    if (!patchesMesh) return;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < patches.length; i++) {
      const p = patches[i];
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(p.radius, p.radius, 1);
      dummy.updateMatrix();

      patchesMesh.setMatrixAt(i, dummy.matrix);
    }
    patchesMesh.instanceMatrix.needsUpdate = true;
  }, [patches]);

  // Listener para repor a poeira quando o usuário clica em reiniciar/recarregar
  useEffect(() => {
    const unsubscribe = useEnvironmentStore.subscribe((state, prevState) => {
      // Se a quantidade ou intensidade dos dustSpots aumentou substancialmente (respawn)
      const currentAvg =
        state.dustSpots.reduce((acc, s) => acc + s.intensity, 0) /
        state.dustSpots.length;
      const prevAvg =
        prevState.dustSpots.reduce((acc, s) => acc + s.intensity, 0) /
        prevState.dustSpots.length;

      if (currentAvg > prevAvg + 0.35 || state.dustSpots.every((s) => s.intensity > 0.8)) {
        // Restaura todos os tufos e manchas do piso
        const dummy = new THREE.Object3D();
        const clumpsMesh = clumpsMeshRef.current;
        const patchesMesh = patchesMeshRef.current;

        for (let i = 0; i < clumpsStateRef.current.length; i++) {
          const item = clumpsStateRef.current[i];
          const s = seeds[i];
          item.isCleaned = false;
          item.animScale = 1.0;
          item.curX = s.x;
          item.curZ = s.z;
          item.curY = s.y;

          if (clumpsMesh) {
            dummy.position.set(s.x, s.y, s.z);
            dummy.rotation.set(0, s.rotY, 0);
            dummy.scale.set(s.scaleX, s.scaleY, s.scaleZ);
            dummy.updateMatrix();
            clumpsMesh.setMatrixAt(i, dummy.matrix);
          }
        }
        if (clumpsMesh) clumpsMesh.instanceMatrix.needsUpdate = true;

        for (let i = 0; i < patchesStateRef.current.length; i++) {
          const pItem = patchesStateRef.current[i];
          const p = patches[i];
          pItem.isCleaned = false;
          pItem.animScale = 1.0;

          if (patchesMesh) {
            dummy.position.set(p.x, p.y, p.z);
            dummy.rotation.set(-Math.PI / 2, 0, 0);
            dummy.scale.set(p.radius, p.radius, 1);
            dummy.updateMatrix();
            patchesMesh.setMatrixAt(i, dummy.matrix);
          }
        }
        if (patchesMesh) patchesMesh.instanceMatrix.needsUpdate = true;
        useRobotStore.getState().setSanitizedAreaTelemetry(0, 0, 0, TOTAL_HOUSE_WALKABLE_AREA);
      }
    });

    return () => unsubscribe();
  }, [seeds, patches]);

  // Dummy reutilizável para cálculos de matriz em useFrame
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const lastPopTimeRef = useRef(0);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const clumpsMesh = clumpsMeshRef.current;
    const patchesMesh = patchesMeshRef.current;
    if (!clumpsMesh || !clumpsStateRef.current.length) return;

    const robotX = robotMotionBridge.x;
    const robotZ = robotMotionBridge.z;
    const robotSpeed = robotMotionBridge.currentSpeed ?? 0;
    const robotState = useRobotStore.getState();

    // O aspirador opera ativamente em modo CLEANING, EXPLORING, AVOIDING ou controle manual (ou se o robô estiver em deslocamento)
    const isVacuumActive =
      robotState.state === 'CLEANING' ||
      robotState.state === 'EXPLORING' ||
      robotState.state === 'AVOIDING' ||
      manualControlBridge.active ||
      robotSpeed > 0.04;

    const vacuumReach = 0.38; // Raio efetivo do chassi circular e escovas giratórias laterais
    let clumpsNeedUpdate = false;
    let patchesNeedUpdate = false;

    // 1. Atualização dos tufos 3D de poeira
    for (let i = 0; i < clumpsStateRef.current.length; i++) {
      const item = clumpsStateRef.current[i];
      const s = seeds[i];

      if (!item.isCleaned && isVacuumActive) {
        const dx = s.x - robotX;
        const dz = s.z - robotZ;
        const dist = Math.hypot(dx, dz);

        if (dist <= vacuumReach) {
          item.isCleaned = true;
          const now = performance.now();
          if (now - lastPopTimeRef.current > 180) {
            lastPopTimeRef.current = now;
            soundManager.playCleanPop();
          }
        }
      }

      // Animação de sucção: o tufo é puxado para o bocal do robô e encolhe até sumir
      if (item.isCleaned && item.animScale > 0) {
        item.animScale = Math.max(0, item.animScale - delta * 5.5);
        clumpsNeedUpdate = true;

        const pullRatio = 1 - item.animScale;
        item.curX = THREE.MathUtils.lerp(s.x, robotX, pullRatio * 0.45);
        item.curZ = THREE.MathUtils.lerp(s.z, robotZ, pullRatio * 0.45);
        item.curY = s.y + pullRatio * 0.03;

        dummy.position.set(item.curX, item.curY, item.curZ);
        dummy.rotation.set(0, s.rotY, 0);
        dummy.scale.set(
          s.scaleX * item.animScale,
          s.scaleY * item.animScale,
          s.scaleZ * item.animScale
        );
        dummy.updateMatrix();
        clumpsMesh.setMatrixAt(i, dummy.matrix);
      }
    }

    if (clumpsNeedUpdate) {
      clumpsMesh.instanceMatrix.needsUpdate = true;
    }

    // 2. Atualização das manchas suaves de poeira no chão
    if (patchesMesh && patchesStateRef.current.length) {
      for (let i = 0; i < patchesStateRef.current.length; i++) {
        const pItem = patchesStateRef.current[i];
        const p = patches[i];

        if (!pItem.isCleaned && isVacuumActive) {
          const dist = Math.hypot(p.x - robotX, p.z - robotZ);
          if (dist <= vacuumReach + p.radius * 0.4) {
            pItem.isCleaned = true;
          }
        }

        if (pItem.isCleaned && pItem.animScale > 0) {
          pItem.animScale = Math.max(0, pItem.animScale - delta * 3.5);
          patchesNeedUpdate = true;

          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          const currentR = p.radius * pItem.animScale;
          dummy.scale.set(currentR, currentR, 1);
          dummy.updateMatrix();
          patchesMesh.setMatrixAt(i, dummy.matrix);
        }
      }

      if (patchesNeedUpdate) {
        patchesMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // 3. Sincroniza telemetria realista da área higienizada a cada 200ms
    syncTimerRef.current += delta;
    if (syncTimerRef.current >= 0.2) {
      syncTimerRef.current = 0;

      const envState = useEnvironmentStore.getState();
      const currentSelectedRegion = envState.selectedRegionId;
      const robotRegion = robotState.currentRegionId || 'bedroom';

      let totalCleanedHouse = 0;
      let totalCleanedM2 = 0;
      const totalItemsHouse = seeds.length + patches.length;

      const roomPcts: Record<string, number> = {};
      const roomIds = ['bedroom', 'hallway', 'living-room', 'kitchen', 'bathroom'];

      for (let r = 0; r < roomIds.length; r++) {
        const id = roomIds[r];
        const indices = roomIndices[id];
        if (!indices) continue;

        const totalInRoom = indices.clumps.length + indices.patches.length;
        if (totalInRoom === 0) continue;

        let cleanedInRoom = 0;
        for (let c = 0; c < indices.clumps.length; c++) {
          if (clumpsStateRef.current[indices.clumps[c]]?.isCleaned) cleanedInRoom++;
        }
        for (let p = 0; p < indices.patches.length; p++) {
          if (patchesStateRef.current[indices.patches[p]]?.isCleaned) cleanedInRoom++;
        }

        totalCleanedHouse += cleanedInRoom;

        // Normalização de alcance: rodapés e cantos estreitos ocupam ~8% de margem
        const reachableTotal = totalInRoom * 0.92;
        const pct = Math.min(100, Math.round((cleanedInRoom / Math.max(1, reachableTotal)) * 100));
        roomPcts[id] = pct;

        const roomArea = ROOM_WALKABLE_AREAS[id] ?? 20;
        totalCleanedM2 += (pct / 100) * roomArea;
      }

      const totalHouseReachable = totalItemsHouse * 0.92;
      const housePct = Math.min(
        100,
        Math.round((totalCleanedHouse / Math.max(1, totalHouseReachable)) * 100)
      );

      const currentRoomPct = roomPcts[robotRegion] ?? 0;

      let activeProgress: number;
      let cleanedM2: number;
      let totalM2: number;

      if (currentSelectedRegion && currentSelectedRegion !== 'all') {
        activeProgress = roomPcts[currentSelectedRegion] ?? 0;
        totalM2 = ROOM_WALKABLE_AREAS[currentSelectedRegion] ?? 20;
        cleanedM2 = Number(((activeProgress / 100) * totalM2).toFixed(1));
      } else {
        activeProgress = housePct;
        cleanedM2 = Number(totalCleanedM2.toFixed(1));
        totalM2 = TOTAL_HOUSE_WALKABLE_AREA;
      }

      if (
        robotState.cleaningProgress !== activeProgress ||
        robotState.roomCleaningProgress !== currentRoomPct ||
        robotState.cleanedAreaM2 !== cleanedM2
      ) {
        robotState.setSanitizedAreaTelemetry(
          activeProgress,
          currentRoomPct,
          cleanedM2,
          totalM2
        );

        if (activeProgress >= 100 && robotState.state === 'CLEANING') {
          const isHouse = !currentSelectedRegion || currentSelectedRegion === 'all';
          const targetName = isHouse
            ? 'Toda a residência'
            : ROOM_DISPLAY_NAMES[currentSelectedRegion] ?? 'Região selecionada';

          robotState.setOperationalState(
            'COMPLETED',
            `Limpeza concluída! ${targetName} foi totalmente higienizada.`
          );

          useCommandStore.getState().pushNotification(
            'Higienização concluída!',
            `100% da área planejada (${targetName}) foi aspirada e higienizada com sucesso.`,
            'success'
          );
        }
      }
    }
  });

  return (
    <group name="house-floor-dust-system">
      {/* 1. Tufos e fiapos de poeira 3D fofos espalhados pelo chão */}
      <instancedMesh
        ref={clumpsMeshRef}
        args={[undefined, undefined, seeds.length]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 7, 5]} />
        <meshStandardMaterial
          roughness={0.92}
          metalness={0.02}
          bumpScale={0.02}
        />
      </instancedMesh>

      {/* 2. Manchas suaves de poeira acumulada sob o chão */}
      <instancedMesh
        ref={patchesMeshRef}
        args={[undefined, undefined, patches.length]}
        frustumCulled={false}
      >
        <circleGeometry args={[1, 20]} />
        <meshBasicMaterial
          color="#8A7A66"
          transparent
          opacity={0.22}
          depthWrite={false}
        />
      </instancedMesh>
    </group>
  );
});

