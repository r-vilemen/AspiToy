import { describe, it, expect, beforeEach } from 'vitest';
import { soundManager } from '../soundManager';
import { useSoundStore } from '@/store/soundStore';

describe('AspiToy Sound System — Gerenciador de Áudio e Sons do Projeto', () => {
  beforeEach(() => {
    soundManager.setEnabled(false);
    useSoundStore.getState().disableSound();
  });

  it('inicia com som desativado por padrão respeitando políticas de autoplay', () => {
    expect(soundManager.getIsEnabled()).toBe(false);
    expect(useSoundStore.getState().isEnabled).toBe(false);
  });

  it('permite alternar entre ligado e desligado através do toggle', () => {
    const nextState = useSoundStore.getState().toggleSound();
    expect(nextState).toBe(true);
    expect(useSoundStore.getState().isEnabled).toBe(true);

    const turnedOff = useSoundStore.getState().toggleSound();
    expect(turnedOff).toBe(false);
    expect(useSoundStore.getState().isEnabled).toBe(false);
  });

  it('ajusta e limita o volume no intervalo [0, 1]', () => {
    useSoundStore.getState().setVolume(0.85);
    expect(useSoundStore.getState().volume).toBe(0.85);
    expect(useSoundStore.getState().masterVolume).toBe(0.85);

    // Deve limitar valores extremos
    useSoundStore.getState().setVolume(1.5);
    expect(useSoundStore.getState().volume).toBe(1.0);

    useSoundStore.getState().setVolume(-0.2);
    expect(useSoundStore.getState().volume).toBe(0.0);
  });

  it('permite configurar e limitar os volumes da trilha sonora e dos efeitos sonoros', () => {
    // Trilha Sonora (Música)
    useSoundStore.getState().setMusicVolume(0.45);
    expect(useSoundStore.getState().musicVolume).toBe(0.45);
    expect(soundManager.getMusicVolume()).toBe(0.45);

    useSoundStore.getState().setMusicVolume(1.8);
    expect(useSoundStore.getState().musicVolume).toBe(1.0);

    useSoundStore.getState().setMusicVolume(-0.5);
    expect(useSoundStore.getState().musicVolume).toBe(0.0);

    // Efeitos Sonoros (SFX)
    useSoundStore.getState().setSfxVolume(0.9);
    expect(useSoundStore.getState().sfxVolume).toBe(0.9);
    expect(soundManager.getSfxVolume()).toBe(0.9);

    useSoundStore.getState().setSfxVolume(2.0);
    expect(useSoundStore.getState().sfxVolume).toBe(1.0);

    useSoundStore.getState().setSfxVolume(-0.1);
    expect(useSoundStore.getState().sfxVolume).toBe(0.0);
  });

  it('controla a abertura e fechamento do painel de configurações de som', () => {
    expect(useSoundStore.getState().isSettingsOpen).toBe(false);

    useSoundStore.getState().openSettings();
    expect(useSoundStore.getState().isSettingsOpen).toBe(true);

    useSoundStore.getState().closeSettings();
    expect(useSoundStore.getState().isSettingsOpen).toBe(false);

    useSoundStore.getState().toggleSettings();
    expect(useSoundStore.getState().isSettingsOpen).toBe(true);

    useSoundStore.getState().toggleSettings();
    expect(useSoundStore.getState().isSettingsOpen).toBe(false);
  });

  it('gerencia o estado do motor de aspiração do robô', () => {
    soundManager.setEnabled(true);
    soundManager.setMotorOperating(true, 0.95);
    expect(soundManager.isMotorActive()).toBe(true);

    soundManager.setMotorOperating(false);
    expect(soundManager.isMotorActive()).toBe(false);
  });

  it('executa bipes de chime, cleanPop e click sem lançar exceções', () => {
    soundManager.setEnabled(true);
    expect(() => soundManager.playChime(true)).not.toThrow();
    expect(() => soundManager.playChime(false)).not.toThrow();
    expect(() => soundManager.playCleanPop()).not.toThrow();
    expect(() => soundManager.playClick()).not.toThrow();
  });

  it('permite silenciar e restaurar a trilha sonora mantendo intacto o volume configurado', () => {
    soundManager.setEnabled(true);
    soundManager.setMusicVolume(0.85);
    expect(soundManager.getMusicVolume()).toBe(0.85);
    expect(soundManager.getIsMusicMuted()).toBe(false);

    // Muta
    soundManager.setMusicMuted(true);
    expect(soundManager.getIsMusicMuted()).toBe(true);
    // Volume configurado permanece 0.85
    expect(soundManager.getMusicVolume()).toBe(0.85);
    expect(soundManager.getEffectiveMusicGain()).toBe(0);

    // Desmuta
    soundManager.setMusicMuted(false);
    expect(soundManager.getIsMusicMuted()).toBe(false);
    expect(soundManager.getMusicVolume()).toBe(0.85);
    expect(soundManager.getEffectiveMusicGain()).toBeCloseTo(0.85 * 0.75, 4);
  });

  it('salva e recupera as configurações de som do usuário no localStorage', () => {
    useSoundStore.getState().setMasterVolume(0.6);
    useSoundStore.getState().setMusicVolume(0.4);
    useSoundStore.getState().setSfxVolume(0.7);
    useSoundStore.getState().setMusicMuted(true);

    const savedRaw = localStorage.getItem('aspitoy_sound_settings_v1');
    expect(savedRaw).not.toBeNull();
    const parsed = JSON.parse(savedRaw!);

    expect(parsed.masterVolume).toBe(0.6);
    expect(parsed.musicVolume).toBe(0.4);
    expect(parsed.sfxVolume).toBe(0.7);
    expect(parsed.isMusicMuted).toBe(true);
  });
});
