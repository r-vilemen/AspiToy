import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RobotModel } from './RobotModel';
import { RobotEffects } from './RobotEffects';
import { FoamCannonSystem } from './FoamCannonSystem';
import { FoamCannonAimingReticle } from './FoamCannonAimingReticle';
import { FoamCannonTargeting } from './FoamCannonTargeting';
import {
  updateRobotLocomotion,
  type RobotLocomotionState,
} from './RobotAnimations';
import {
  manualControlBridge,
  robotMotionBridge,
  useRobotStore,
} from '@/store/robotStore';
import {
  catMotionBridge,
  getDynamicAllCatsObstacles,
  pushableToysBridge,
  stepPushableToysPhysics,
  tuxedoCatMotionBridge,
  useEnvironmentStore,
  whiteCatMotionBridge,
} from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { AgentController } from '@/agent/AgentController';
import { PriorityManager } from '@/agent/decision/PriorityManager';
import { ToyOrganizer } from '@/agent/decision/ToyOrganizer';
import { distance2D, damp, dampAngle } from '@/utils/math';
import { isPointInsideBounds } from '@/utils/coordinates';
import type { Vector2D } from '@/types/robot';
import { soundManager } from '@/services/soundManager';
import {
  HOUSE_ELEVATED_SURFACES,
  getSurfaceLandingY,
  getOverheadObstacleAt,
} from '@/world/House/HouseObstacles';

const ROOM_PATROL_POINTS: Record<string, Vector2D[]> = {
  bedroom: [
    { x: -3.5, z: 2.2 },
    { x: -3.5, z: 0.0 },
    { x: -3.5, z: -1.8 },
    { x: -2.0, z: -2.4 },
    { x: 0.0, z: -2.5 },
    { x: 2.2, z: -2.4 },
    { x: 3.0, z: -1.2 },
    { x: 3.0, z: 0.8 },
    { x: 3.0, z: 2.2 },
    { x: 1.8, z: 2.4 },
    { x: 0.0, z: 1.5 },
    { x: -2.0, z: 1.8 },
    { x: -1.4, z: 0.2 },
    { x: -0.2, z: -0.2 },
  ],
  hallway: [
    { x: 6.3, z: -3.0 },
    { x: 6.3, z: -1.0 },
    { x: 6.8, z: 0.5 },
    { x: 5.8, z: 2.3 },
    { x: 6.3, z: 4.2 },
    { x: 6.8, z: 6.0 },
    { x: 6.3, z: 7.8 },
  ],
  'living-room': [
    { x: 8.8, z: 0.5 },
    { x: 8.8, z: -1.5 },
    { x: 8.8, z: -2.6 },
    { x: 10.8, z: -2.4 },
    { x: 13.0, z: -2.4 },
    { x: 15.5, z: -2.4 },
    { x: 16.5, z: 0.0 },
    { x: 15.5, z: 2.2 },
    { x: 13.0, z: 2.3 },
    { x: 10.2, z: 1.5 },
    { x: 10.5, z: -0.6 },
  ],
  kitchen: [
    { x: 9.2, z: 4.0 },
    { x: 15.5, z: 3.4 },
    { x: 15.8, z: 5.5 },
    { x: 15.8, z: 6.6 },
    { x: 14.2, z: 6.2 },
    { x: 12.0, z: 6.2 },
    { x: 9.8, z: 6.2 },
    { x: 8.6, z: 5.8 },
    { x: 9.5, z: 4.5 },
  ],
  bathroom: [
    { x: 6.5, z: 9.4 },
    { x: 7.6, z: 9.8 },
    { x: 8.6, z: 9.8 },
    { x: 8.2, z: 10.6 },
    { x: 8.2, z: 12.0 },
    { x: 7.2, z: 11.0 },
  ],
};

/**
 * Waypoints aéreos de superfícies elevadas (mesas e sofás) para o Modo Aspi-Helicóptero
 */
export const AERIAL_FURNITURE_WAYPOINTS = [
  { x: -1.45, z: -1.15, y: 0.87, label: 'Mesa de Centro do Quarto', regionId: 'bedroom' },
  { x: 0.0, z: 2.6, y: 1.07, label: 'Sofá-Baú do Quarto', regionId: 'bedroom' },
  { x: 0.95, z: -0.75, y: 1.06, label: 'Poltrona Verde do Quarto', regionId: 'bedroom' },
  { x: 12.8, z: -0.7, y: 0.67, label: 'Mesa de Centro da Sala', regionId: 'living-room' },
  { x: 13.2, z: 0.88, y: 0.77, label: 'Sofá da Sala', regionId: 'living-room' },
  { x: 12.0, z: 0.88, y: 0.77, label: 'Sofá da Sala (Esquerda)', regionId: 'living-room' },
  { x: 15.6, z: -0.10, y: 0.77, label: 'Chaise do Sofá', regionId: 'living-room' },
  { x: 12.8, z: 4.4, y: 1.34, label: 'Ilha da Cozinha', regionId: 'kitchen' },
];

const GLOBAL_HOUSE_PATROL_POINTS: Vector2D[] = [
  // Quarto
  { x: -2.0, z: 1.8 },
  { x: -3.5, z: 0.0 },
  { x: -2.0, z: -2.4 },
  { x: 2.2, z: -2.4 },
  { x: 2.8, z: 1.5 },
  // Transição para o Corredor
  { x: 4.6, z: 2.35 },
  { x: 6.3, z: 2.35 },
  { x: 6.3, z: -1.0 },
  // Sala de Estar
  { x: 8.8, z: -1.5 },
  { x: 12.5, z: -2.4 },
  { x: 15.5, z: -2.4 },
  { x: 16.5, z: 0.2 },
  { x: 13.0, z: 2.3 },
  { x: 9.5, z: 1.5 },
  // Cozinha
  { x: 9.5, z: 4.2 },
  { x: 15.5, z: 3.5 },
  { x: 15.5, z: 6.5 },
  { x: 12.0, z: 6.2 },
  { x: 8.6, z: 5.8 },
  // Corredor Sul e Banheiro
  { x: 6.3, z: 5.5 },
  { x: 6.3, z: 7.8 },
  { x: 6.5, z: 9.4 },
  { x: 8.6, z: 9.8 },
  { x: 8.2, z: 12.0 },
  { x: 7.4, z: 10.8 },
  // Retorno integrado pelo Corredor ao Quarto
  { x: 6.3, z: 5.0 },
  { x: 6.3, z: 2.35 },
  { x: 1.0, z: 0.2 },
];

/**
 * Ator robótico interativo.
 * Controla a movimentação contínua com interpolação de alta performance em `useFrame`,
 * desviando de todos os móveis fixos e também do gato dinâmico sem atravessá-los.
 */
export function Robot() {
  const rootRef = useRef<THREE.Group>(null);
  const patrolIdxRef = useRef(0);
  const syncTimerRef = useRef(0);
  const notifyCooldownRef = useRef(0);

  const state = useRobotStore((s) => s.state);
  const expression = useRobotStore((s) => s.expression);
  const obstacles = useEnvironmentStore((s) => s.obstacles);
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);

  const agent = useMemo(
    () =>
      new AgentController(
        obstacles,
        roomDimensions.width,
        roomDimensions.depth,
        roomDimensions.minX,
        roomDimensions.minZ
      ),
    [obstacles, roomDimensions]
  );

  const priorityManager = useMemo(() => new PriorityManager(), []);
  const toyOrganizer = useMemo(() => new ToyOrganizer(), []);
  const lastOrganizedCountRef = useRef(0);

  const locomotionRef = useRef<RobotLocomotionState>({
    x: robotMotionBridge.x,
    z: robotMotionBridge.z,
    rotationY: robotMotionBridge.rotationY,
    targetRotationY: robotMotionBridge.targetRotationY,
    speed: 0,
    wheelSpin: 0,
    bobPhase: 0,
    pitch: 0,
    roll: 0,
    bumperCompression: 0,
  });

  // Mecanismo anti-trava inteligente: detecta emperramento em quinas/batentes e executa desengate automático (ré + giro)
  const unstuckRef = useRef<{
    phase: 'IDLE' | 'REVERSE' | 'TURN';
    stuckTimer: number;
    phaseTimer: number;
    turnDirection: number;
  }>({
    phase: 'IDLE',
    stuckTimer: 0,
    phaseTimer: 0,
    turnDirection: 1,
  });

  // Alvo de cobertura dinâmica e memória de variação para 100% de área higienizada
  const coverageGoalRef = useRef<Vector2D | null>(null);
  const coverageTimerRef = useRef(0);
  const patrolReverseRef = useRef(false);
  const laneVariationIdxRef = useRef(0);

  // Navegação e patrulha aérea do Modo Aspi-Helicóptero
  const aerialWaypointIdxRef = useRef(0);
  const aerialHoverTimerRef = useRef(0);
  const flightPathRef = useRef<Vector2D[]>([]);
  const flightTargetRef = useRef<Vector2D | null>(null);

  // Orquestrador Autônomo Multimodal (Chão + Canhão + Móveis Voando)
  const autoCannonCooldownRef = useRef(7.0); // Dispara canhão a cada ~9s a 14s
  const autoAerialCooldownRef = useRef(18.0); // Alterna para voo após ~18s a 22s de chão
  const autoFlightDurationRef = useRef(0); // Tempo no ar
  const autoFurnitureVisitCountRef = useRef(0); // Quantos móveis higienizados na surtida aérea atual
  const catChaseShootCooldownRef = useRef(0.6); // Intervalo de disparo de espuma ao arretar os gatos

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const loc = locomotionRef.current;
    const robotState = useRobotStore.getState();
    const envState = useEnvironmentStore.getState();
    const cmdState = useCommandStore.getState();

    if (notifyCooldownRef.current > 0) {
      notifyCooldownRef.current -= delta;
    }

    // Sincroniza posição caso o robô tenha sido resetado
    if (
      robotState.state === 'IDLE' &&
      distance2D({ x: loc.x, z: loc.z }, robotState.position) > 0.5
    ) {
      loc.x = robotMotionBridge.x;
      loc.z = robotMotionBridge.z;
      loc.rotationY = robotMotionBridge.rotationY;
    }

    const selectedId = envState.selectedRegionId;
    const patrolPool =
      selectedId !== 'all' && ROOM_PATROL_POINTS[selectedId]
        ? ROOM_PATROL_POINTS[selectedId]
        : GLOBAL_HOUSE_PATROL_POINTS;

    let targetPoint: { x: number; z: number } | null = null;
    const isManualPointToPoint =
      robotState.state === 'PAUSED' && robotState.targetPosition !== null;

    if (robotState.state === 'ORGANIZING') {
      const orgPlan = toyOrganizer.planStep({ x: loc.x, z: loc.z }, pushableToysBridge);
      targetPoint = orgPlan.targetPoint;

      if (orgPlan.organizedCount !== lastOrganizedCountRef.current) {
        if (orgPlan.organizedCount > lastOrganizedCountRef.current) {
          soundManager.playToyCelebrationChime();
          cmdState.pushNotification(
            'Brinquedo guardado!',
            `${orgPlan.organizedCount} de ${orgPlan.totalToys} brinquedos agora estão organizados no tapete.`,
            'info'
          );
        }
        lastOrganizedCountRef.current = orgPlan.organizedCount;
        robotState.setOrganizedToysCount(orgPlan.organizedCount);
      }

      if (orgPlan.allDone) {
        robotState.setOperationalState(
          'COMPLETED',
          'Quarto 100% arrumado! Todos os 16 brinquedos foram guardados.'
        );
        soundManager.playToyCelebrationChime();
        cmdState.pushNotification(
          'Quarto Arrumado!',
          'Sensacional! Todos os 16 brinquedos foram colocados em segurança no tapete.',
          'success'
        );
      }
    } else if (robotState.state === 'CHASING_CATS') {
      // Persegue ativamente os gatos da casa e dispara jatos de espuma neles
      const candidateCats = [
        { bridge: catMotionBridge, name: 'Gato Laranja' },
        { bridge: whiteCatMotionBridge, name: 'Gato Branco' },
        { bridge: tuxedoCatMotionBridge, name: 'Gato Frajola' },
      ];

      // Seleciona o gato mais próximo
      let targetCat = candidateCats[0];
      let minCatDist = Infinity;
      for (const c of candidateCats) {
        const d = Math.hypot(c.bridge.x - loc.x, c.bridge.z - loc.z);
        if (d < minCatDist) {
          minCatDist = d;
          targetCat = c;
        }
      }

      // Se o gato estiver empoleirado e o robô estiver no chão com boa bateria, decola para ir atrás
      const catY = targetCat.bridge.y ?? 0;
      if (catY > 0.45 && !robotMotionBridge.isFlying && robotState.battery > 22 && minCatDist < 2.5) {
        const overhead = getOverheadObstacleAt({ x: loc.x, z: loc.z }, robotMotionBridge.y);
        if (!overhead) {
          robotState.toggleHelicopterMode();
        }
      }

      targetPoint = { x: targetCat.bridge.x, z: targetCat.bridge.z };

      // Mira e dispara o canhão de espuma lateral ao se aproximar do gato
      if (minCatDist <= 3.8) {
        robotMotionBridge.isCannonAiming = true;
        robotMotionBridge.cannonExtension = 0.8;
        robotMotionBridge.foamTargetX = targetCat.bridge.x;
        robotMotionBridge.foamTargetY = Math.max(0.06, (targetCat.bridge.y ?? 0) + 0.12);
        robotMotionBridge.foamTargetZ = targetCat.bridge.z;
        robotMotionBridge.foamTargetNormalX = 0;
        robotMotionBridge.foamTargetNormalY = 1;
        robotMotionBridge.foamTargetNormalZ = 0;

        catChaseShootCooldownRef.current -= delta;
        if (catChaseShootCooldownRef.current <= 0) {
          catChaseShootCooldownRef.current = 1.4 + Math.random() * 0.8;
          robotState.fireFoamCannon({
            x: targetCat.bridge.x,
            y: Math.max(0.06, (targetCat.bridge.y ?? 0) + 0.12),
            z: targetCat.bridge.z,
          });
          soundManager.playCatMeow();

          // Assusta o gato alvo imediatamente
          if (targetCat.bridge.state !== 'JUMPING') {
            targetCat.bridge.state = 'STARTLED';
            targetCat.bridge.stateTimer = 0.55;
            targetCat.bridge.speed = 0;
          }
        }
      }
    } else if (robotMotionBridge.isFlying) {
      if (robotState.targetPosition) {
        // Alvo manual específico selecionado pelo usuário no chão/móvel
        targetPoint = robotState.targetPosition;
      } else if (robotState.state === 'CLEANING') {
        const relevantAerialWps =
          selectedId !== 'all'
            ? AERIAL_FURNITURE_WAYPOINTS.filter((wp) => wp.regionId === selectedId)
            : AERIAL_FURNITURE_WAYPOINTS;
        const pool = relevantAerialWps.length > 0 ? relevantAerialWps : AERIAL_FURNITURE_WAYPOINTS;

        const isReadyToLand =
          autoFurnitureVisitCountRef.current >= 2 || autoFlightDurationRef.current > 20.0;
        const surfaceUnder = HOUSE_ELEVATED_SURFACES.find((s) =>
          isPointInsideBounds({ x: loc.x, z: loc.z }, s.bounds, 0.12)
        );

        if (isReadyToLand && surfaceUnder) {
          // Desloca para área de piso livre para pousar com segurança
          const safeLandingPoint = patrolPool[0];
          targetPoint = { x: safeLandingPoint.x, z: safeLandingPoint.z };
        } else {
          const currentWp = pool[aerialWaypointIdxRef.current % pool.length];
          targetPoint = { x: currentWp.x, z: currentWp.z };
          const distToWp = distance2D({ x: loc.x, z: loc.z }, targetPoint);
          if (distToWp < 0.55) {
            aerialHoverTimerRef.current += delta;
            // Limpeza aérea contínua sobre a mobília
            envState.cleanDustNearPoint({ x: loc.x, z: loc.z }, 0.85, 0.18, robotMotionBridge.y);

            // Disparo de espuma na mobília após 1.0s de pairada
            if (aerialHoverTimerRef.current > 1.0 && aerialHoverTimerRef.current - delta <= 1.0) {
              robotState.fireFoamCannon({ x: currentWp.x, y: currentWp.y, z: currentWp.z });
            }

            if (aerialHoverTimerRef.current > 3.5) {
              aerialHoverTimerRef.current = 0;
              aerialWaypointIdxRef.current =
                (aerialWaypointIdxRef.current + 1) % pool.length;
              autoFurnitureVisitCountRef.current += 1;
            }
          }
        }
      } else {
        // Sem solicitação de limpeza: helicóptero PAIRA ESTAVELMENTE NO LUGAR (zero movimento autônomo)
        targetPoint = null;
        flightPathRef.current = [];
        flightTargetRef.current = null;
      }
    } else if (
      robotState.state === 'CLEANING' ||
      robotState.state === 'EXPLORING' ||
      robotState.state === 'AVOIDING' ||
      isManualPointToPoint
    ) {
      if (isManualPointToPoint) {
        targetPoint = robotState.targetPosition;
      } else {
        coverageTimerRef.current += delta;
        const currentPos = { x: loc.x, z: loc.z };

        // Atualiza o alvo de cobertura inteligente quando o anterior foi atingido ou expirou (> 7.5s)
        const distToCoverage = coverageGoalRef.current
          ? distance2D(currentPos, coverageGoalRef.current)
          : 0;

        if (!coverageGoalRef.current || distToCoverage < 0.38 || coverageTimerRef.current > 7.5) {
          coverageTimerRef.current = 0;
          coverageGoalRef.current = agent.findBestCoverageTarget(currentPos, selectedId);
        }

        const smartDustTarget = priorityManager.selectBestTarget(
          currentPos,
          envState.dustSpots,
          envState.selectedRegionId,
          envState.regions,
          robotState.battery,
          envState.dockPosition,
          coverageGoalRef.current,
          robotMotionBridge.isFlying
        );

        if (robotState.targetPosition) {
          targetPoint = robotState.targetPosition;
        } else if (smartDustTarget) {
          targetPoint = smartDustTarget;
        } else {
          // Modo patrulha / varredura com variação contínua de faixas e alternância de sentido
          const poolLen = patrolPool.length;
          const rawIdx = patrolIdxRef.current % poolLen;
          const effectiveIdx = patrolReverseRef.current ? poolLen - 1 - rawIdx : rawIdx;
          const basePoint = patrolPool[effectiveIdx];

          // Variação de faixas (boustrophedon sweep lane variation): micro-deslocamento suave para cobrir 100% da área
          const laneOffset = ((laneVariationIdxRef.current % 3) - 1) * 0.12;
          targetPoint = {
            x: basePoint.x + laneOffset,
            z: basePoint.z + (laneVariationIdxRef.current % 2 === 0 ? 0.08 : -0.08),
          };
        }
      }
    } else if (robotState.state === 'RETURNING') {
      targetPoint = envState.dockPosition;
    }

    // =========================================================================
    // ORQUESTRADOR DA LIMPEZA AUTÔNOMA MULTIMODAL:
    // 1. Limpeza mecânica do piso com sucção contínua e escovas
    // 2. Disparo autônomo do Canhão de Espuma Lateral (Estilo Crash Kart)
    // 3. Decolagem em helicóptero para higienizar móveis elevados e pouso suave
    // =========================================================================
    if (robotState.state === 'CLEANING') {
      autoCannonCooldownRef.current -= delta;

      // --- PROCEDIMENTO 2: DISPARO DO CANHÃO DE ESPUMA LATERAL ---
      if (autoCannonCooldownRef.current <= 0) {
        autoCannonCooldownRef.current = 10.0 + Math.random() * 4.0;

        // Procura poeira ativa em um cone frontal ou raio de até 3.8m
        const candidateSpot = envState.dustSpots.find((s) => {
          if (s.intensity <= 0.05) return false;
          if (!robotMotionBridge.isFlying && (s.y ?? 0) > 0.35) return false;
          const dx = s.position.x - loc.x;
          const dz = s.position.z - loc.z;
          const dist = Math.hypot(dx, dz);
          return dist >= 0.8 && dist <= 3.8;
        });

        if (candidateSpot) {
          robotState.fireFoamCannon({
            x: candidateSpot.position.x,
            y: candidateSpot.y ?? 0.05,
            z: candidateSpot.position.z,
          });
        } else {
          // Dispara para a frente no sentido de locomoção
          const heading = robotMotionBridge.rotationY;
          const targetX = loc.x + Math.sin(heading) * 2.2;
          const targetY = robotMotionBridge.y > 0.1 ? robotMotionBridge.y : 0.05;
          const targetZ = loc.z + Math.cos(heading) * 2.2;
          robotState.fireFoamCannon({ x: targetX, y: targetY, z: targetZ });
        }
      }

      // --- PROCEDIMENTO 3: TRANSIÇÃO ENTRE CHÃO E VOO SOBRE OS MÓVEIS ---
      if (!robotMotionBridge.isFlying) {
        autoAerialCooldownRef.current -= delta;

        // Após ~18s a 22s de limpeza no solo, se tiver bateria > 20%:
        if (autoAerialCooldownRef.current <= 0 && robotState.battery > 20) {
          const overhead = getOverheadObstacleAt({ x: loc.x, z: loc.z }, robotMotionBridge.y);
          if (!overhead) {
            robotState.toggleHelicopterMode();
            autoFlightDurationRef.current = 0;
            autoFurnitureVisitCountRef.current = 0;
            autoAerialCooldownRef.current = 24.0;
            cmdState.pushNotification(
              'Decolagem Automática 🚁',
              'AspiToy levantou voo para higienizar mesas e sofás elevados.',
              'info'
            );
          }
        }
      } else {
        autoFlightDurationRef.current += delta;

        // Após visitar os móveis da rota (ou ~20s de voo):
        if (autoFurnitureVisitCountRef.current >= 2 || autoFlightDurationRef.current > 20.0) {
          const surfaceUnder = HOUSE_ELEVATED_SURFACES.find((s) =>
            isPointInsideBounds({ x: loc.x, z: loc.z }, s.bounds, 0.12)
          );
          const overhead = getOverheadObstacleAt({ x: loc.x, z: loc.z }, robotMotionBridge.y);

          if (!surfaceUnder && !overhead) {
            robotState.toggleHelicopterMode();
            autoAerialCooldownRef.current = 22.0;
            cmdState.pushNotification(
              'Pouso Automático Suave',
              'Móveis higienizados. AspiToy pousou no solo para continuar a varredura do piso.',
              'info'
            );
          }
        }
      }
    }

    // Obstáculos dinâmicos em tempo real dos gatos (Laranja e Branco) andando/dormindo pela casa
    const dynamicCats = getDynamicAllCatsObstacles();
    agent.setDynamicObstacles(dynamicCats);

    if (manualControlBridge.active) {
      // Controle manual direto (WASD / Setas / D-Pad)
      const manualTurn = manualControlBridge.turn * 3.2 * delta;
      loc.rotationY += manualTurn;
      loc.targetRotationY = loc.rotationY;

      // Velocidade do controle manual: frente positiva, ré negativa suave
      const targetManualSpeed = manualControlBridge.forward * robotState.speed;
      loc.speed = damp(
        loc.speed,
        targetManualSpeed,
        Math.abs(targetManualSpeed) > 0.05 ? 8.0 : 12.0,
        delta
      );

      // Giro visual das rodas e oscilação orgânica do modelo
      const wheelRadius = 0.045;
      const linearDist = loc.speed * delta;
      loc.wheelSpin += linearDist / wheelRadius;
      if (Math.abs(loc.speed) > 0.05 || Math.abs(manualControlBridge.turn) > 0) {
        loc.bobPhase += delta * 10.0;
        loc.pitch = damp(loc.pitch, loc.speed * 0.03, 6.0, delta);
        loc.roll = damp(loc.roll, -manualControlBridge.turn * 0.04, 7.0, delta);
      } else {
        loc.pitch = damp(loc.pitch, 0, 6.0, delta);
        loc.roll = damp(loc.roll, 0, 7.0, delta);
      }

      // Direção do deslocamento: para a frente do visor (sen/cos de rotationY)
      const desiredX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
      const desiredZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;

      // Se estiver pousado em cima de uma mesa, sofá ou baú, mantém o robô nos limites do tampo
      let targetX = desiredX;
      let targetZ = desiredZ;
      if (!robotMotionBridge.isFlying && robotMotionBridge.y > 0.3) {
        const currentSurf = HOUSE_ELEVATED_SURFACES.find((s) =>
          isPointInsideBounds({ x: loc.x, z: loc.z }, s.bounds, 0.08)
        );
        if (currentSurf) {
          targetX = Math.max(currentSurf.bounds.minX + 0.22, Math.min(currentSurf.bounds.maxX - 0.22, desiredX));
          targetZ = Math.max(currentSurf.bounds.minZ + 0.22, Math.min(currentSurf.bounds.maxZ - 0.22, desiredZ));
        }
      }

      // Resolução física contínua com altitude actorY:
      // Impede atravessar paredes, portas, gatos e móveis altos mesmo em voo!
      const collisionResult = agent.resolveSafeMovement(
        { x: loc.x, z: loc.z },
        { x: targetX, z: targetZ },
        0.315,
        robotMotionBridge.y
      );

      loc.x = collisionResult.position.x;
      loc.z = collisionResult.position.z;
      if (collisionResult.collided) {
        loc.bumperCompression = 0.028;
      }
    } else if (robotMotionBridge.isFlying && robotMotionBridge.y > 0.15) {
      // Voo autônomo com navegação por portas e prevenção absoluta de colisão
      if (targetPoint) {
        // Se o alvo mudou ou a rota terminou, recalcula rota A* segura que contorna paredes e usa as portas
        const targetChanged =
          !flightTargetRef.current ||
          distance2D(flightTargetRef.current, targetPoint) > 0.4;

        if (targetChanged) {
          flightTargetRef.current = { ...targetPoint };
          const calculatedPath = agent.findPath(
            { x: loc.x, z: loc.z },
            targetPoint
          );
          flightPathRef.current =
            calculatedPath && calculatedPath.length > 0
              ? calculatedPath
              : [targetPoint];
        }

        // Segue o próximo waypoint da rota aérea
        while (
          flightPathRef.current.length > 1 &&
          distance2D({ x: loc.x, z: loc.z }, flightPathRef.current[0]) < 0.35
        ) {
          flightPathRef.current.shift();
        }

        const nextFlightWp = flightPathRef.current[0] ?? targetPoint;
        const dx = nextFlightWp.x - loc.x;
        const dz = nextFlightWp.z - loc.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 0.08) {
          const targetHeading = Math.atan2(dx, dz);
          loc.targetRotationY = targetHeading;
          loc.rotationY = dampAngle(loc.rotationY, targetHeading, 5.0, delta);
          loc.speed = damp(loc.speed, Math.min(1.2, dist * 1.5), 3.5, delta);

          const desiredFlightX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
          const desiredFlightZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;

          // RESOLVE COLISÃO DE VOO CONTRA PAREDES, BATENTES, GATOS E MÓVEIS ALTOS
          const colRes = agent.resolveSafeMovement(
            { x: loc.x, z: loc.z },
            { x: desiredFlightX, z: desiredFlightZ },
            0.315,
            robotMotionBridge.y
          );

          loc.x = colRes.position.x;
          loc.z = colRes.position.z;
          if (colRes.collided) {
            loc.bumperCompression = 0.024;
            loc.speed = damp(loc.speed, 0, 10.0, delta);
          }

          loc.pitch = damp(loc.pitch, Math.min(0.12, loc.speed * 0.08), 5.0, delta);
          const turnDiff = Math.sin(loc.targetRotationY - loc.rotationY);
          loc.roll = damp(loc.roll, -turnDiff * 0.14, 6.0, delta);
        } else {
          // Chegou ao destino do ponto manual
          if (robotState.targetPosition) {
            loc.speed = 0;
            robotState.setTargetPosition(null);
            flightPathRef.current = [];
            flightTargetRef.current = null;
          }
          loc.speed = damp(loc.speed, 0, 8.0, delta);
          loc.pitch = damp(loc.pitch, 0, 5.0, delta);
          loc.roll = damp(loc.roll, 0, 5.0, delta);
        }
      } else {
        // MODO PAIRAR (HOVER): Sem alvo ativo de limpeza, o helicóptero fica parado no ar sem se mover sozinho
        loc.speed = damp(loc.speed, 0, 8.0, delta);
        loc.pitch = damp(loc.pitch, 0, 5.0, delta);
        loc.roll = damp(loc.roll, 0, 5.0, delta);
      }
    } else {
      // Quando não há controle manual ativo:
      // Se o robô estiver em repouso (IDLE, PAUSED, RECHARGING ou COMPLETED), garante parada imediata sem movimentação autônoma
      if (
        (robotState.state === 'IDLE' ||
          robotState.state === 'PAUSED' ||
          robotState.state === 'RECHARGING' ||
          robotState.state === 'COMPLETED') &&
        !isManualPointToPoint
      ) {
        unstuckRef.current.phase = 'IDLE';
        unstuckRef.current.stuckTimer = 0;
        loc.speed = damp(loc.speed, 0, 16.0, delta);
        loc.pitch = damp(loc.pitch, 0, 8.0, delta);
        loc.roll = damp(loc.roll, 0, 8.0, delta);
      } else {
        const unstuck = unstuckRef.current;

        // Manobra de desengate anti-trava ativa: marcha a ré e giro evasivo
        if (unstuck.phase === 'REVERSE') {
          unstuck.phaseTimer -= delta;
          loc.speed = damp(loc.speed, -0.30, 14.0, delta);
          const wheelRadius = 0.045;
          loc.wheelSpin += (loc.speed * delta) / wheelRadius;
          loc.pitch = damp(loc.pitch, -0.02, 6.0, delta);
          loc.roll = damp(loc.roll, 0, 7.0, delta);

          const revX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
          const revZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;
          const revResult = agent.resolveSafeMovement(
            { x: loc.x, z: loc.z },
            { x: revX, z: revZ },
            0.315,
            robotMotionBridge.y
          );
          loc.x = revResult.position.x;
          loc.z = revResult.position.z;

          if (unstuck.phaseTimer <= 0) {
            unstuck.phase = 'TURN';
            unstuck.phaseTimer = 0.38;
          }
        } else if (unstuck.phase === 'TURN') {
          unstuck.phaseTimer -= delta;
          loc.speed = damp(loc.speed, 0, 16.0, delta);
          loc.rotationY += unstuck.turnDirection * 3.4 * delta;
          loc.targetRotationY = loc.rotationY;
          loc.pitch = damp(loc.pitch, 0, 6.0, delta);
          loc.roll = damp(loc.roll, -unstuck.turnDirection * 0.03, 7.0, delta);

          if (unstuck.phaseTimer <= 0) {
            unstuck.phase = 'IDLE';
            unstuck.stuckTimer = 0;
            agent.notifyStuck({ x: loc.x, z: loc.z }, loc.rotationY);
          }
        } else {
          // Consulta de tomada de decisão autônoma do agente desacoplado (somente se em CLEANING, EXPLORING, RETURNING ou AVOIDING)
          const decision = agent.decide(
            robotState.state,
            { x: loc.x, z: loc.z },
            loc.rotationY,
            targetPoint,
            robotState.speed,
            envState.selectedRegionId,
            delta,
            dynamicCats
          );

          if (decision.nextState !== robotState.state) {
            if (decision.nextState === 'AVOIDING') {
              loc.bumperCompression = 0.024;
              robotState.setOperationalState('AVOIDING', decision.logAction);
              if (
                decision.detectedObstacleLabel === 'Gato Laranja' &&
                notifyCooldownRef.current <= 0
              ) {
                notifyCooldownRef.current = 4.5;
                cmdState.pushNotification(
                  'Gato no caminho!',
                  'O AspiToy detectou o gato pela casa e recalculou a rota para não incomodá-lo.',
                  'warning'
                );
              }
            } else if (robotState.state === 'AVOIDING') {
              const resumeState =
                robotState.previousActiveState === 'PAUSED' || isManualPointToPoint
                  ? 'PAUSED'
                  : decision.nextState;
              robotState.setOperationalState(
                resumeState,
                'Trajetória livre retomada após desvio'
              );
            }
          }

          if (targetPoint && decision.desiredSpeed > 0) {
            const currentPos = { x: loc.x, z: loc.z };
            const planned = decision.plannedPath;
            const effectiveTarget =
              planned && planned.length > 0
                ? planned[planned.length - 1]
                : targetPoint;
            const dist = Math.min(
              distance2D(currentPos, targetPoint),
              distance2D(currentPos, effectiveTarget)
            );

            if (dist < 0.28) {
              if (robotState.state === 'RETURNING') {
                loc.speed = 0;
                loc.x = envState.dockPosition.x;
                loc.z = envState.dockPosition.z;
                loc.rotationY = Math.PI / 2;
                loc.targetRotationY = Math.PI / 2;
                robotState.setTargetPosition(null);
                robotState.setOperationalState(
                  'RECHARGING',
                  'Acoplado na estação de carregamento'
                );
                cmdState.pushNotification(
                  'Acoplamento concluído',
                  'AspiToy conectado à base e recarregando bateria.',
                  'success'
                );
              } else if (isManualPointToPoint) {
                loc.speed = 0;
                robotState.setTargetPosition(null);
                robotState.setOperationalState(
                  'PAUSED',
                  'Chegou ao ponto selecionado. Limpeza permanece pausada.'
                );
              } else if (
                robotState.state === 'EXPLORING' &&
                robotState.targetPosition !== null
              ) {
                loc.speed = 0;
                robotState.setTargetPosition(null);
                robotState.setOperationalState(
                  'IDLE',
                  'Chegou ao ponto selecionado no chão'
                );
              } else {
                if (robotState.targetPosition) {
                  robotState.setTargetPosition(null);
                }
                const nextIdx = patrolIdxRef.current + 1;
                if (nextIdx >= patrolPool.length) {
                  patrolIdxRef.current = 0;
                  patrolReverseRef.current = !patrolReverseRef.current;
                  laneVariationIdxRef.current = (laneVariationIdxRef.current + 1) % 6;
                } else {
                  patrolIdxRef.current = nextIdx;
                }
                coverageGoalRef.current = null;
              }
            }
          }

          // Atualiza locomoção física com base nas diretrizes do AgentController
          const chaseSpeed =
            robotState.state === 'CHASING_CATS'
              ? Math.max(decision.desiredSpeed, 1.85)
              : decision.desiredSpeed;

          updateRobotLocomotion(
            loc,
            chaseSpeed,
            decision.desiredHeading,
            delta
          );

          // Avança posição linear com resolução física de colisão contra TODOS os objetos e o gato
          const desiredX = loc.x + Math.sin(loc.rotationY) * loc.speed * delta;
          const desiredZ = loc.z + Math.cos(loc.rotationY) * loc.speed * delta;

          // Se estiver pousado em cima de uma mesa, sofá ou baú, mantém o robô nos limites do tampo
          let targetAutonomousX = desiredX;
          let targetAutonomousZ = desiredZ;
          if (!robotMotionBridge.isFlying && robotMotionBridge.y > 0.3) {
            const currentSurf = HOUSE_ELEVATED_SURFACES.find((s) =>
              isPointInsideBounds({ x: loc.x, z: loc.z }, s.bounds, 0.08)
            );
            if (currentSurf) {
              targetAutonomousX = Math.max(
                currentSurf.bounds.minX + 0.22,
                Math.min(currentSurf.bounds.maxX - 0.22, desiredX)
              );
              targetAutonomousZ = Math.max(
                currentSurf.bounds.minZ + 0.22,
                Math.min(currentSurf.bounds.maxZ - 0.22, desiredZ)
              );
            }
          }

          const collisionResult = agent.resolveSafeMovement(
            { x: loc.x, z: loc.z },
            { x: targetAutonomousX, z: targetAutonomousZ },
            0.315,
            robotMotionBridge.y
          );

          const actualMovedDist = Math.hypot(
            collisionResult.position.x - loc.x,
            collisionResult.position.z - loc.z
          );
          const expectedDist = Math.max(0.0001, Math.abs(loc.speed) * delta);

          loc.x = collisionResult.position.x;
          loc.z = collisionResult.position.z;

          if (collisionResult.collided) {
            loc.bumperCompression = 0.028;
            // Se o robô estiver efetivamente bloqueado sem conseguir deslizar, amortece a velocidade
            if (actualMovedDist < expectedDist * 0.25) {
              loc.speed = damp(loc.speed, 0, 14.0, delta);
            } else {
              // Se estiver deslizando suavemente pela quina/parede, preserva o avanço
              loc.speed = damp(loc.speed, loc.speed * 0.88, 3.5, delta);
            }
          }

          // Monitoramento anti-trava inteligente: se estiver bloqueado em quina ou batente
          const isTryingToAdvance = decision.desiredSpeed > 0.08;
          const isBlocked =
            collisionResult.collided && actualMovedDist < expectedDist * 0.30;

          if (isTryingToAdvance && isBlocked) {
            unstuck.stuckTimer += delta;
            if (unstuck.stuckTimer > 0.65) {
              // Dispara manobra de desengate inteligente: ré para descolar + giro evasivo
              unstuck.phase = 'REVERSE';
              unstuck.phaseTimer = 0.35;
              unstuck.turnDirection = agent.notifyStuck(
                { x: loc.x, z: loc.z },
                loc.rotationY
              );
              loc.bumperCompression = 0.035;
            }
          } else if (actualMovedDist > 0.015) {
            unstuck.stuckTimer = Math.max(0, unstuck.stuckTimer - delta * 2.0);
          }
        }
      }
    }

    // Empurra objetos e brinquedos pequenos no chão caso estejam na frente do robô (apenas no modo chão)
    const pushResult = stepPushableToysPhysics(
      { x: loc.x, z: loc.z },
      0.32,
      delta,
      robotMotionBridge.y
    );
    if (pushResult.pushedToyLabel) {
      loc.bumperCompression = Math.max(loc.bumperCompression, 0.015);
    }

    // Mantém o robô perfeitamente acoplado no centro da base enquanto recarrega
    if (robotState.state === 'RECHARGING') {
      loc.x = envState.dockPosition.x;
      loc.z = envState.dockPosition.z;
      loc.speed = 0;
      loc.rotationY = Math.PI / 2;
    }

    // Sincroniza com a bridge mutável de 60fps para a câmera e o gato
    robotMotionBridge.x = loc.x;
    robotMotionBridge.z = loc.z;
    robotMotionBridge.rotationY = loc.rotationY;
    robotMotionBridge.currentSpeed = loc.speed;
    robotMotionBridge.wheelSpin = loc.wheelSpin;
    robotMotionBridge.pitch = loc.pitch;
    robotMotionBridge.roll = loc.roll;

    // Gerenciamento de física vertical e rotor do helicóptero
    if (robotMotionBridge.isFlying) {
      // 1. EXTENSÃO PROGRESSIVA DO MASTRO TELESCÓPICO (ergue suavemente em ~0.8s)
      robotMotionBridge.propellerExtension = damp(
        robotMotionBridge.propellerExtension,
        1.0,
        2.4,
        delta
      );

      // 2. ACELERAÇÃO PROGRESSIVA DA HÉLICE (spool-up com inércia angular)
      robotMotionBridge.propellerSpeed = damp(
        robotMotionBridge.propellerSpeed,
        45.0,
        2.2,
        delta
      );
      soundManager.startPropellerSound();
      soundManager.updatePropellerSpeed(robotMotionBridge.propellerSpeed);

      // Fator de sustentação aerodinâmica (Lift):
      // Enquanto as pás aceleram abaixo de 18 rad/s, o helicóptero não tem sustentação suficiente
      // e permanece no solo com vibração mecânica de decolagem. O lift cresce suavemente até 1.0.
      const lift = Math.max(0, Math.min(1.0, (robotMotionBridge.propellerSpeed - 18.0) / 22.0));

      const relevantAerialWps =
        selectedId !== 'all'
          ? AERIAL_FURNITURE_WAYPOINTS.filter((wp) => wp.regionId === selectedId)
          : AERIAL_FURNITURE_WAYPOINTS;
      const pool = relevantAerialWps.length > 0 ? relevantAerialWps : AERIAL_FURNITURE_WAYPOINTS;

      const currentWp = pool[aerialWaypointIdxRef.current % pool.length];

      // Gerenciamento de altitude inteligente para o Aspi-Helicóptero:
      // Altitude de cruzeiro segura (1.35m) para sobrevoar confortavelmente todos os móveis,
      // mesas, sofás, balcões e brinquedos da casa sem colidir em suas laterais.
      let targetAltitude = 1.35;

      let activeTarget: Vector2D | null = null;
      let targetDesiredHoverY: number | null = null;

      if (robotState.state === 'CLEANING' && currentWp) {
        activeTarget = { x: currentWp.x, z: currentWp.z };
        targetDesiredHoverY = currentWp.y;
      } else if (robotState.targetPosition) {
        activeTarget = robotState.targetPosition;
        const targetSurf = HOUSE_ELEVATED_SURFACES.find((s) =>
          isPointInsideBounds(activeTarget!, s.bounds, 0.08)
        );
        if (targetSurf) {
          targetDesiredHoverY = targetSurf.surfaceY + 0.18;
        } else {
          targetDesiredHoverY = 0.95;
        }
      }

      // Verifica se o robô já está posicionado diretamente sobre uma superfície elevada
      const surfaceUnderRobot = HOUSE_ELEVATED_SURFACES.find((s) =>
        isPointInsideBounds({ x: loc.x, z: loc.z }, s.bounds, 0.05)
      );

      if (activeTarget && targetDesiredHoverY !== null) {
        const distToTarget = distance2D({ x: loc.x, z: loc.z }, activeTarget);
        if (surfaceUnderRobot || distToTarget < 0.40) {
          targetAltitude = targetDesiredHoverY;
        } else {
          targetAltitude = 1.35;
        }
      } else if (surfaceUnderRobot) {
        targetAltitude = surfaceUnderRobot.surfaceY + 0.18;
      } else {
        targetAltitude = 1.30;
      }

      robotMotionBridge.targetY = targetAltitude;

      // Decolagem cadenciada e realista: a elevação vertical é governada pelo lift aerodinâmico
      const baseSurfaceY = surfaceUnderRobot ? surfaceUnderRobot.surfaceY : 0.0;
      const effectiveTargetY = baseSurfaceY + (targetAltitude - baseSurfaceY) * lift;

      const climbSpeed = 1.6 * (0.2 + 0.8 * lift);
      robotMotionBridge.y = damp(
        robotMotionBridge.y,
        effectiveTargetY,
        climbSpeed,
        delta
      );

      // Micro-vibração mecânica de pré-decolagem enquanto o rotor atinge RPM no solo
      if (lift < 0.8 && robotMotionBridge.y < baseSurfaceY + 0.04) {
        loc.pitch = damp(
          loc.pitch,
          Math.sin(loc.bobPhase * 4.0) * (robotMotionBridge.propellerSpeed / 45.0) * 0.006,
          8.0,
          delta
        );
      }
    } else {
      // ========================================================
      // POUSO REALISTA EM DUAS ETAPAS:
      // ETAPA 1: DESCIDA CONTROLADA COM HÉLICE GIRANDO E SUSTENTAÇÃO ATIVA
      // ETAPA 2: TOQUE SUAVE NA SUPERFÍCIE, CORTE DO MOTOR, INÉRCIA E RECOLHIMENTO
      // ========================================================
      const landingSurfaceY = getSurfaceLandingY(
        { x: loc.x, z: loc.z },
        robotMotionBridge.y
      );
      robotMotionBridge.targetY = landingSurfaceY;

      const isStillInAir = robotMotionBridge.y > landingSurfaceY + 0.015;

      if (isStillInAir) {
        // Etapa 1: Em descida aérea. A hélice continua girando em alta rotação para sustentar a descida!
        robotMotionBridge.propellerExtension = damp(
          robotMotionBridge.propellerExtension,
          1.0,
          2.5,
          delta
        );
        robotMotionBridge.propellerSpeed = damp(
          robotMotionBridge.propellerSpeed,
          36.0,
          2.5,
          delta
        );

        // Amortecimento de efeito solo: aproximação suave à medida que chega perto do piso/móvel
        const heightAboveSurface = robotMotionBridge.y - landingSurfaceY;
        const descentSpeed = heightAboveSurface > 0.35 ? 1.7 : 1.2;
        robotMotionBridge.y = damp(robotMotionBridge.y, landingSurfaceY, descentSpeed, delta);

        soundManager.updatePropellerSpeed(robotMotionBridge.propellerSpeed);
      } else {
        // Etapa 2: Toque realizado na superfície!
        robotMotionBridge.y = landingSurfaceY;

        // Desaceleração suave por inércia rotacional
        robotMotionBridge.propellerSpeed = damp(
          robotMotionBridge.propellerSpeed,
          0.0,
          2.2,
          delta
        );

        // O mastro telescópico só recolhe após a hélice desacelerar
        if (robotMotionBridge.propellerSpeed < 18.0) {
          robotMotionBridge.propellerExtension = damp(
            robotMotionBridge.propellerExtension,
            0.0,
            2.4,
            delta
          );
        }

        if (robotMotionBridge.propellerSpeed > 1.0) {
          soundManager.updatePropellerSpeed(robotMotionBridge.propellerSpeed);
        } else {
          soundManager.stopPropellerSound();
        }
      }
    }

    // Sincroniza áudio procedural do motor do aspirador em tempo real
    // Ativa tanto em navegação autônoma quanto em pilotagem manual ou clique de navegação
    const isManualMoving =
      manualControlBridge.active &&
      (Math.abs(loc.speed) > 0.02 ||
        Math.abs(manualControlBridge.forward) > 0.04 ||
        Math.abs(manualControlBridge.turn) > 0.04);

    const isAutonomousMoving =
      (robotState.state === 'CLEANING' ||
        robotState.state === 'ORGANIZING' ||
        robotState.state === 'CHASING_CATS' ||
        robotState.state === 'EXPLORING' ||
        robotState.state === 'AVOIDING' ||
        robotState.state === 'RETURNING' ||
        robotState.targetPosition !== null) &&
      Math.abs(loc.speed) > 0.03;

    const isOperating = isManualMoving || isAutonomousMoving;
    const currentSpeed = isManualMoving
      ? Math.max(
          Math.abs(loc.speed),
          Math.abs(manualControlBridge.forward) * 0.8,
          Math.abs(manualControlBridge.turn) * 0.65
        )
      : Math.abs(loc.speed);

    soundManager.setMotorOperating(isOperating, currentSpeed);

    // Altura vertical do piso: sobre a base de recarga (y = 0.04m) ou sobre o tapete (y = 0.023m)
    const dockDist = Math.hypot(loc.x - (-4.15), loc.z - 3.2);
    let floorY = 0.0;
    if (robotState.state === 'RECHARGING' || dockDist < 0.35) {
      floorY = 0.04;
    } else {
      const rugDist = Math.hypot(loc.x - (-0.75), loc.z - (-1.1));
      if (rugDist < 1.85) {
        floorY = 0.023;
      } else if (rugDist < 1.98) {
        floorY = 0.023 * ((1.98 - rugDist) / 0.13);
      }
    }

    // Se o robô estiver sobre uma superfície elevada ou em voo,
    // a altitude absoluta robotMotionBridge.y já define a cota correta da superfície
    const effectiveY = robotMotionBridge.y > 0.08 ? robotMotionBridge.y : floorY + robotMotionBridge.y;

    // Atualiza nós Three.js diretamente com a elevação de voo ou pouso
    if (rootRef.current) {
      rootRef.current.position.set(loc.x, effectiveY, loc.z);
      rootRef.current.rotation.y = loc.rotationY;
    }

    // Telemetria sincronizada com o React a cada 250ms (~4 Hz)
    syncTimerRef.current += delta;
    if (syncTimerRef.current >= 0.25) {
      syncTimerRef.current = 0;
      const point = { x: loc.x, z: loc.z };
      const region = envState.resolveRegionAtPoint(point);
      robotState.syncTelemetryFromBridge(region.id, region.label);

      if (robotState.state === 'CLEANING') {
        envState.cleanDustNearPoint(point, 0.65, 0.14, robotMotionBridge.y);
        robotState.updateBattery(-0.08);

        if (robotState.battery <= 18) {
          robotState.setTargetPosition(envState.dockPosition);
          robotState.setOperationalState(
            'RETURNING',
            'Bateria baixa (18%). Retornando automaticamente à base de recarga.'
          );
          cmdState.pushNotification(
            'Bateria baixa',
            'Nível crítico. Retorno automático à base acionado pelo agente.',
            'warning'
          );
        }
      } else if (robotState.state === 'ORGANIZING') {
        robotState.updateBattery(-0.06);

        if (robotState.battery <= 18) {
          robotState.setTargetPosition(envState.dockPosition);
          robotState.setOperationalState(
            'RETURNING',
            'Bateria baixa (18%). Retornando à base de recarga.'
          );
          cmdState.pushNotification(
            'Bateria baixa',
            'Nível crítico. Retorno automático à base acionado pelo agente.',
            'warning'
          );
        }
      } else if (robotState.state === 'CHASING_CATS') {
        robotState.updateBattery(-0.07);

        if (robotState.battery <= 18) {
          robotState.setTargetPosition(envState.dockPosition);
          robotState.setOperationalState(
            'RETURNING',
            'Bateria baixa (18%). Retornando à base de recarga.'
          );
          cmdState.pushNotification(
            'Bateria baixa',
            'Retornando à base para recarregar após arretar os gatos.',
            'warning'
          );
        }
      } else if (robotState.state === 'FLYING' || robotMotionBridge.isFlying) {
        robotState.updateBattery(-0.09);

        if (robotState.battery <= 18) {
          robotMotionBridge.isFlying = false;
          robotMotionBridge.targetY = 0;
          robotState.setTargetPosition(envState.dockPosition);
          robotState.setOperationalState(
            'RETURNING',
            'Bateria baixa em voo (18%). Pouso de emergência e retorno à base de recarga.'
          );
          cmdState.pushNotification(
            'Bateria baixa',
            'Pousando e retornando à base de recarga.',
            'warning'
          );
        }
      } else if (
        manualControlBridge.active ||
        isManualPointToPoint ||
        robotState.state === 'EXPLORING'
      ) {
        // Deslocamento manual ou navegação sem sucção consome menos bateria e não aspira poeira
        robotState.updateBattery(-0.02);
      } else if (
        robotState.state === 'RECHARGING' &&
        robotState.battery < 100
      ) {
        robotState.updateBattery(0.4);
      }
    }
  });

  return (
    <>
      <group
        ref={rootRef}
        position={[robotMotionBridge.x, 0.04, robotMotionBridge.z]}
        rotation={[0, robotMotionBridge.rotationY, 0]}
        name="aspitoy-actor"
      >
        <RobotModel
          wheelSpin={robotMotionBridge.wheelSpin}
          pitch={locomotionRef.current.pitch}
          roll={locomotionRef.current.roll}
          bobY={
            robotMotionBridge.isFlying
              ? Math.sin(locomotionRef.current.bobPhase * 1.5) * 0.012
              : Math.sin(locomotionRef.current.bobPhase) *
                (locomotionRef.current.speed > 0.1 ? 0.006 : 0.002)
          }
          bumperCompression={locomotionRef.current.bumperCompression}
          state={state}
          expression={expression}
        />
        <RobotEffects
          isCleaning={state === 'CLEANING' || state === 'ORGANIZING' || state === 'CHASING_CATS'}
          isRecharging={state === 'RECHARGING'}
        />
      </group>

      {/* Sistema de Espuma Tridimensional em Coordenadas Mundiais (Paredes, Móveis e Chão) */}
      <FoamCannonSystem />
      {/* Retículo Holográfico 3D de Mira do Canhão sobre Superfícies */}
      <FoamCannonAimingReticle />
      {/* Controlador Contínuo de Rastreamento de Mouse a 60 FPS */}
      <FoamCannonTargeting />
    </>
  );
}
