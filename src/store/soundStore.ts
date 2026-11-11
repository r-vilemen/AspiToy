import { create } from 'zustand';
import { soundManager } from '@/services/soundManager';

export interface SoundStoreState {
  isEnabled: boolean;
  volume: number;
  toggleSound: () => boolean;
  setVolume: (v: number) => void;
  enableSound: () => void;
  disableSound: () => void;
}

export const useSoundStore = create<SoundStoreState>((set) => ({
  isEnabled: false,
  volume: 0.6,

  toggleSound: () => {
    const nextState = soundManager.toggle();
    set({ isEnabled: nextState });
    return nextState;
  },

  setVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setVolume(clamped);
    set({ volume: clamped });
  },

  enableSound: () => {
    soundManager.setEnabled(true);
    set({ isEnabled: true });
  },

  disableSound: () => {
    soundManager.setEnabled(false);
    set({ isEnabled: false });
  },
}));
