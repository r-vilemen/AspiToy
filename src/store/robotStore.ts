import { create } from 'zustand';
import type {
  RobotExpression,
  RobotMotionBridge,
  RobotOperationalState,
  RobotTelemetry,
  Vector2D,
} from '@/types/robot';
import { INITIAL_DOCK_POSITION } from './environmentStore';
import { clamp } from '@/utils/math';

/**
 * Bridge mutável de alta frequência (60 FPS) lida/atualizada dentro de `useFrame`.
 * Evita chamadas a `setState` a cada frame (Regra `perf-never-set-state-in-useframe`).
 */
export const robotMotionBridge: RobotMotionBridge = {
  x: INITIAL_DOCK_POSITION.x,
  z: INITIAL_DOCK_POSITION.z,
  rotationY: Math.PI,
  targetRotationY: Math.PI,
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
  tickOperationTimer: () => void;
  setTargetPosition: (target: Vector2D | null) => void;
  resetRobot: () => void;
}

const INITIAL_TELEMETRY: RobotTelemetry = {
  name: 'AspiToy MK-I',
  state: 'IDLE',
  previousActiveState: null,
  expression: 'neutral',
  position: { ...INITIAL_DOCK_POSITION },
  rotationY: Math.PI,
  battery: 96,
  speed: 1.35,
  cleaningProgress: 0,
  currentRegionId: 'media-zone',
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

  tickOperationTimer: () => {
    const { state, operationSeconds } = get();
    if (
      state === 'EXPLORING' ||
      state === 'CLEANING' ||
      state === 'AVOIDING' ||
      state === 'RETURNING'
    ) {
      set({ operationSeconds: operationSeconds + 1 });
    }
  },

  setTargetPosition: (target) => set({ targetPosition: target }),

  resetRobot: () => {
    robotMotionBridge.x = INITIAL_DOCK_POSITION.x;
    robotMotionBridge.z = INITIAL_DOCK_POSITION.z;
    robotMotionBridge.rotationY = Math.PI;
    robotMotionBridge.targetRotationY = Math.PI;
    robotMotionBridge.currentSpeed = 0;
    robotMotionBridge.wheelSpin = 0;
    robotMotionBridge.bobPhase = 0;
    robotMotionBridge.bumperCompression = 0;

    set({
      ...INITIAL_TELEMETRY,
      position: { ...INITIAL_DOCK_POSITION },
    });
  },
}));

