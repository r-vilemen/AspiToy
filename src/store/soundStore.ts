import { create } from 'zustand';
import { soundManager } from '@/services/soundManager';

export const SOUND_SETTINGS_STORAGE_KEY = 'aspitoy_sound_settings_v1';

export interface SavedSoundSettings {
  isEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMusicMuted: boolean;
}

export function loadSavedSoundSettings(): SavedSoundSettings {
  const defaults: SavedSoundSettings = {
    isEnabled: true, // Som e música ativos por padrão
    masterVolume: 0.75,
    musicVolume: 0.75,
    sfxVolume: 0.8,
    isMusicMuted: false,
  };

  if (typeof window === 'undefined' || !window.localStorage) {
    return defaults;
  }

  try {
    const raw = localStorage.getItem(SOUND_SETTINGS_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    return {
      isEnabled: typeof parsed.isEnabled === 'boolean' ? parsed.isEnabled : defaults.isEnabled,
      masterVolume:
        typeof parsed.masterVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.masterVolume))
          : defaults.masterVolume,
      musicVolume:
        typeof parsed.musicVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.musicVolume))
          : defaults.musicVolume,
      sfxVolume:
        typeof parsed.sfxVolume === 'number'
          ? Math.max(0, Math.min(1, parsed.sfxVolume))
          : defaults.sfxVolume,
      isMusicMuted:
        typeof parsed.isMusicMuted === 'boolean' ? parsed.isMusicMuted : defaults.isMusicMuted,
    };
  } catch {
    return defaults;
  }
}

export function persistSoundSettings(settings: SavedSoundSettings): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    localStorage.setItem(SOUND_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Erro ao salvar configurações de som no localStorage:', err);
  }
}

export interface SoundStoreState {
  isEnabled: boolean;
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  isMusicMuted: boolean;
  isSettingsOpen: boolean;

  // Actions
  toggleSound: () => boolean;
  enableSound: () => void;
  disableSound: () => void;
  setMasterVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  toggleMusicMute: () => boolean;
  setMusicMuted: (muted: boolean) => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleSettings: () => void;

  // Backwards compatibility alias for volume
  volume: number;
  setVolume: (v: number) => void;
}

const initialSettings = loadSavedSoundSettings();

// Sincroniza o SoundManager com as configurações persistidas no boot
soundManager.setEnabled(initialSettings.isEnabled);
soundManager.setVolume(initialSettings.masterVolume);
soundManager.setMusicVolume(initialSettings.musicVolume);
soundManager.setSfxVolume(initialSettings.sfxVolume);
soundManager.setMusicMuted(initialSettings.isMusicMuted);

export const useSoundStore = create<SoundStoreState>((set, get) => ({
  isEnabled: initialSettings.isEnabled,
  volume: initialSettings.masterVolume,
  masterVolume: initialSettings.masterVolume,
  musicVolume: initialSettings.musicVolume,
  sfxVolume: initialSettings.sfxVolume,
  isMusicMuted: initialSettings.isMusicMuted,
  isSettingsOpen: false,

  toggleSound: () => {
    const nextState = soundManager.toggle();
    set({ isEnabled: nextState });
    persistSoundSettings({
      isEnabled: nextState,
      masterVolume: get().masterVolume,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: get().isMusicMuted,
    });
    return nextState;
  },

  enableSound: () => {
    soundManager.setEnabled(true);
    set({ isEnabled: true });
    persistSoundSettings({
      isEnabled: true,
      masterVolume: get().masterVolume,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: get().isMusicMuted,
    });
  },

  disableSound: () => {
    soundManager.setEnabled(false);
    set({ isEnabled: false });
    persistSoundSettings({
      isEnabled: false,
      masterVolume: get().masterVolume,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: get().isMusicMuted,
    });
  },

  setMasterVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setVolume(clamped);
    set({ masterVolume: clamped, volume: clamped });
    persistSoundSettings({
      isEnabled: get().isEnabled,
      masterVolume: clamped,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: get().isMusicMuted,
    });
  },

  setVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setVolume(clamped);
    set({ masterVolume: clamped, volume: clamped });
    persistSoundSettings({
      isEnabled: get().isEnabled,
      masterVolume: clamped,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: get().isMusicMuted,
    });
  },

  setMusicVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setMusicVolume(clamped);
    set({ musicVolume: clamped });
    persistSoundSettings({
      isEnabled: get().isEnabled,
      masterVolume: get().masterVolume,
      musicVolume: clamped,
      sfxVolume: get().sfxVolume,
      isMusicMuted: get().isMusicMuted,
    });
  },

  setSfxVolume: (val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    soundManager.setSfxVolume(clamped);
    set({ sfxVolume: clamped });
    persistSoundSettings({
      isEnabled: get().isEnabled,
      masterVolume: get().masterVolume,
      musicVolume: get().musicVolume,
      sfxVolume: clamped,
      isMusicMuted: get().isMusicMuted,
    });
  },

  toggleMusicMute: () => {
    const nextMuted = !get().isMusicMuted;
    soundManager.setMusicMuted(nextMuted);
    set({ isMusicMuted: nextMuted });
    persistSoundSettings({
      isEnabled: get().isEnabled,
      masterVolume: get().masterVolume,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: nextMuted,
    });
    return nextMuted;
  },

  setMusicMuted: (muted: boolean) => {
    soundManager.setMusicMuted(muted);
    set({ isMusicMuted: muted });
    persistSoundSettings({
      isEnabled: get().isEnabled,
      masterVolume: get().masterVolume,
      musicVolume: get().musicVolume,
      sfxVolume: get().sfxVolume,
      isMusicMuted: muted,
    });
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
