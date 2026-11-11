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
  isEnabled: true, // Som e música ativos por padrão!
  volume: 0.75,
  masterVolume: 0.75,
  musicVolume: 0.7,
  sfxVolume: 0.8,
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

  openSettings: () => {
    soundManager.ensureAudioRunning();
    set({ isSettingsOpen: true });
  },

  closeSettings: () => set({ isSettingsOpen: false }),
  toggleSettings: () => {
    soundManager.ensureAudioRunning();
    set((state) => ({ isSettingsOpen: !state.isSettingsOpen }));
  },
}));

// Desbloqueia e inicia o áudio na primeira interação do usuário (clique, toque ou tecla)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (useSoundStore.getState().isEnabled) {
      soundManager.ensureAudioRunning();
    }
  };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
  window.addEventListener('touchstart', unlockAudio, { once: true });
}
