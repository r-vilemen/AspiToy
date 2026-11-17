import { create } from 'zustand';
import type {
  RobotExpression,
  RobotMotionBridge,
  RobotOperationalState,
  RobotSkin,
  RobotSkinId,
  RobotTelemetry,
  Vector2D,
} from '@/types/robot';
import { INITIAL_DOCK_POSITION } from './environmentStore';
import { clamp } from '@/utils/math';

export const ROBOT_SKINS: Record<RobotSkinId, RobotSkin> = {
  classic: {
    id: 'classic',
    name: 'AspiToy Clássico',
    tagline: 'Edição de Fábrica MK-I',
    description: 'Pintura original inspirada em eletrodomésticos retrô de brinquedo.',
    requiredM2: 0,
    shellColor: '#F4EFE6',
    coralTrimColor: '#E05A36',
    blueTrimColor: '#0284C7',
    yellowTrimColor: '#FBBF24',
    eyeColor: '#06B6D4',
  },
  'space-ranger': {
    id: 'space-ranger',
    name: 'Patrulheiro Espacial',
    tagline: 'Ao Infinito e Além!',
    description: 'Armadura espacial branca e verde-limão com acabamento em roxo cósmico.',
    requiredM2: 25,
    shellColor: '#F8FAFC',
    coralTrimColor: '#7E22CE',
    blueTrimColor: '#84CC16',
    yellowTrimColor: '#EF4444',
    eyeColor: '#22C55E',
  },
  sheriff: {
    id: 'sheriff',
    name: 'Xerife do Quarto',
    tagline: 'Tem uma Cobra na Minha Bota!',
    description: 'Inspirado no traje do cowboy com amarelo xadrez, lenço vermelho e botas.',
    requiredM2: 50,
    shellColor: '#F5BC16',
    coralTrimColor: '#DC2626',
    blueTrimColor: '#78350F',
    yellowTrimColor: '#FBBF24',
    eyeColor: '#F59E0B',
  },
  'cyber-translucent': {
    id: 'cyber-translucent',
    name: 'Cyber Translúcido',
    tagline: 'Edição Especial Anos 2000',
    description: 'Chassi translúcido em acrílico neon com interior tecnológico de brinquedo.',
    requiredM2: 90,
    shellColor: '#06B6D4',
    coralTrimColor: '#EC4899',
    blueTrimColor: '#1E1E2E',
    yellowTrimColor: '#22D3EE',
    eyeColor: '#F43F5E',
    isTranslucent: true,
  },
};

/**
 * Bridge mutável de alta frequência (60 FPS) lida/atualizada dentro de `useFrame`.
 * Evita chamadas a `setState` a cada frame (Regra `perf-never-set-state-in-useframe`).
 */
export const robotMotionBridge: RobotMotionBridge = {
  x: INITIAL_DOCK_POSITION.x,
  z: INITIAL_DOCK_POSITION.z,
  rotationY: Math.PI / 2,
  targetRotationY: Math.PI / 2,
  currentSpeed: 0,
  wheelSpin: 0,
  bobPhase: 0,
  bumperCompression: 0,
};

/**
 * Bridge mutável de 60 FPS para controle manual direto (WASD / Setas / D-Pad)
 * sem disparar re-renderizações do React a cada frame.
 */
export const manualControlBridge = {
  forward: 0, // -1 (ré) a +1 (frente)
  turn: 0, // -1 (direita) a +1 (esquerda)
  active: false,
};

function mapStateToExpression(state: RobotOperationalState): RobotExpression {
  switch (state) {
    case 'IDLE':
      return 'neutral';
    case 'EXPLORING':
      return 'curious';
    case 'CLEANING':
      return 'focused';
    case 'ORGANIZING':
      return 'focused';
    case 'AVOIDING':
      return 'alert';
    case 'RETURNING':
      return 'worried';
    case 'RECHARGING':
      return 'sleepy';
    case 'PAUSED':
      return 'neutral';
    case 'COMPLETED':
      return 'happy';
  }
}

export interface RobotStoreState extends RobotTelemetry {
  setOperationalState: (nextState: RobotOperationalState, actionDescription?: string) => void;
  syncTelemetryFromBridge: (regionId: string, regionLabel: string) => void;
  updateBattery: (deltaPercent: number) => void;
  setCleaningProgress: (percent: number) => void;
  setSanitizedAreaTelemetry: (
    progress: number,
    roomProgress: number,
    cleanedM2: number,
    totalM2: number
  ) => void;
  setRobotSkin: (skinId: RobotSkinId) => void;
  setOrganizedToysCount: (count: number) => void;
  tickOperationTimer: () => void;
  setTargetPosition: (target: Vector2D | null) => void;
  resetRobot: () => void;
}

const INITIAL_TELEMETRY: RobotTelemetry = {
  name: 'AspiToy MK-I',
  state: 'IDLE',
  previousActiveState: null,
  expression: 'neutral',
  skin: 'classic',
  organizedToysCount: 0,
  totalToysToOrganize: 16,
  position: { ...INITIAL_DOCK_POSITION },
  rotationY: Math.PI / 2,
  battery: 96,
  speed: 1.35,
  cleaningProgress: 0,
  roomCleaningProgress: 0,
  cleanedAreaM2: 0,
  totalAreaM2: 122,
  currentRegionId: 'bedroom',
  currentRegionLabel: 'Base de Recarga',
  operationSeconds: 0,
  lastAction: 'Pronto na base de carregamento',
  targetPosition: null,
};

export const useRobotStore = create<RobotStoreState>((set, get) => ({
  ...INITIAL_TELEMETRY,

  setOperationalState: (nextState, actionDescription) => {
    const current = get();
    const isPausing = nextState === 'PAUSED' && current.state !== 'PAUSED';
    set({
      state: nextState,
      previousActiveState: isPausing ? current.state : current.previousActiveState,
      expression: mapStateToExpression(nextState),
      lastAction: actionDescription ?? current.lastAction,
    });
  },

  setRobotSkin: (skinId) => {
    set({ skin: skinId });
  },

  setOrganizedToysCount: (count) => {
    set({ organizedToysCount: clamp(count, 0, get().totalToysToOrganize) });
  },

  syncTelemetryFromBridge: (regionId, regionLabel) => {
    set({
      position: {
        x: Number(robotMotionBridge.x.toFixed(2)),
        z: Number(robotMotionBridge.z.toFixed(2)),
      },
      rotationY: Number(robotMotionBridge.rotationY.toFixed(2)),
      currentRegionId: regionId,
      currentRegionLabel: regionLabel,
    });
  },

  updateBattery: (deltaPercent) => {
    const nextBattery = clamp(Number((get().battery + deltaPercent).toFixed(1)), 0, 100);
    set({ battery: nextBattery });
  },

  setCleaningProgress: (percent) => {
    set({ cleaningProgress: clamp(Math.round(percent), 0, 100) });
  },

  setSanitizedAreaTelemetry: (progress, roomProgress, cleanedM2, totalM2) => {
    set({
      cleaningProgress: clamp(Math.round(progress), 0, 100),
      roomCleaningProgress: clamp(Math.round(roomProgress), 0, 100),
      cleanedAreaM2: Math.max(0, cleanedM2),
      totalAreaM2: Math.max(1, totalM2),
    });
  },

  tickOperationTimer: () => {
    const { state, operationSeconds } = get();
    if (
      state === 'EXPLORING' ||
      state === 'CLEANING' ||
      state === 'ORGANIZING' ||
      state === 'AVOIDING' ||
      state === 'RETURNING'
    ) {
      set({ operationSeconds: operationSeconds + 1 });
    }
  },

  setTargetPosition: (target) => set({ targetPosition: target }),

  resetRobot: () => {
    const currentSkin = get().skin;
    robotMotionBridge.x = INITIAL_DOCK_POSITION.x;
    robotMotionBridge.z = INITIAL_DOCK_POSITION.z;
    robotMotionBridge.rotationY = Math.PI / 2;
    robotMotionBridge.targetRotationY = Math.PI / 2;
    robotMotionBridge.currentSpeed = 0;
    robotMotionBridge.wheelSpin = 0;
    robotMotionBridge.bobPhase = 0;
    robotMotionBridge.bumperCompression = 0;

    set({
      ...INITIAL_TELEMETRY,
      skin: currentSkin,
      position: { ...INITIAL_DOCK_POSITION },
    });
  },
}));

