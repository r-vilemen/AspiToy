import { create } from 'zustand';
import { soundManager } from '@/services/soundManager';

export interface SoundStoreState {
  isEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isSettingsOpen: boolean;

  // Actions
  toggleSound: () => boolean;
  enableSound: () => void;
  disableSound: () => void;
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;

  // Backwards compatibility alias for volume
  volume: number;
  setVolume: (v: number) => void;
}

export const useSoundStore = create<SoundStoreState>((set) => ({
  isEnabled: false,
  volume: 0.7,
  masterVolume: 0.7,
  musicVolume: 0.65,
  sfxVolume: 0.75,
  isSettingsOpen: false,

  toggleSound: () => {
    const nextState = soundManager.toggle();
    set({ isEnabled: nextState });
    return nextState;
  },

  enableSound: () => {
    soundManager.setEnabled(true);
    set({ isEnabled: true });
  },

  disableSound: () => {
    soundManager.setEnabled(false);
    set({ isEnabled: false });
  },

  setMasterVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setVolume(clamped);
    set({ masterVolume: clamped, volume: clamped });
  },

  setVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setVolume(clamped);
    set({ masterVolume: clamped, volume: clamped });
  },

  setMusicVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setMusicVolume(clamped);
    set({ musicVolume: clamped });
  },

  setSfxVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setSfxVolume(clamped);
    set({ sfxVolume: clamped });
  },

  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
}));
