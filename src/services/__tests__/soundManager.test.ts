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

    // Deve limitar valores extremos
    useSoundStore.getState().setVolume(1.5);
    expect(useSoundStore.getState().volume).toBe(1.0);

    useSoundStore.getState().setVolume(-0.2);
    expect(useSoundStore.getState().volume).toBe(0.0);
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
});
