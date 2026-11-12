import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SoundSettingsModal } from '../ui/SoundSettingsModal';
import { useSoundStore } from '@/store/soundStore';
import { soundManager } from '@/services/soundManager';

describe('SoundSettingsModal — Configurações de Áudio e Volume', () => {
  beforeEach(() => {
    useSoundStore.getState().disableSound();
    useSoundStore.getState().setMasterVolume(0.7);
    useSoundStore.getState().setMusicVolume(0.65);
    useSoundStore.getState().setSfxVolume(0.75);
    useSoundStore.getState().openSettings();
  });

  it('renderiza o diálogo com controles de Master, Trilha Sonora e Efeitos', () => {
    render(<SoundSettingsModal />);

    expect(screen.getByRole('dialog', { name: /configurações de áudio/i })).toBeDefined();
    expect(screen.getByText('Trilha Sonora')).toBeDefined();
    expect(screen.getByText('Efeitos Sonoros')).toBeDefined();
    expect(screen.getByText('Volume Geral (Master)')).toBeDefined();

    const musicSlider = screen.getByLabelText(/volume da trilha sonora/i) as HTMLInputElement;
    const sfxSlider = screen.getByLabelText(/volume dos efeitos sonoros/i) as HTMLInputElement;
    const masterSlider = screen.getByLabelText(/volume master geral/i) as HTMLInputElement;

    expect(musicSlider.value).toBe('65');
    expect(sfxSlider.value).toBe('75');
    expect(masterSlider.value).toBe('70');
  });

  it('permite ajustar o volume da trilha sonora via slider', () => {
    render(<SoundSettingsModal />);

    const musicSlider = screen.getByLabelText(/volume da trilha sonora/i);
    fireEvent.change(musicSlider, { target: { value: '40' } });

    expect(useSoundStore.getState().musicVolume).toBe(0.4);
    expect(soundManager.getMusicVolume()).toBe(0.4);
  });

  it('permite ajustar o volume dos efeitos sonoros via slider', () => {
    render(<SoundSettingsModal />);

    const sfxSlider = screen.getByLabelText(/volume dos efeitos sonoros/i);
    fireEvent.change(sfxSlider, { target: { value: '90' } });

    expect(useSoundStore.getState().sfxVolume).toBe(0.9);
    expect(soundManager.getSfxVolume()).toBe(0.9);
  });

  it('permite testar efeitos sonoros pelo botão de teste', () => {
    const playCleanPopSpy = vi.spyOn(soundManager, 'playCleanPop');
    render(<SoundSettingsModal />);

    const testBtn = screen.getByRole('button', { name: /testar/i });
    fireEvent.click(testBtn);

    expect(playCleanPopSpy).toHaveBeenCalledTimes(1);
    playCleanPopSpy.mockRestore();
  });

  it('fecha o painel ao clicar no botão fechar ou pressionar Escape', () => {
    render(<SoundSettingsModal />);

    const closeBtn = screen.getByRole('button', { name: /fechar painel/i });
    fireEvent.click(closeBtn);

    expect(useSoundStore.getState().isSettingsOpen).toBe(false);

    // Reabre e testa Escape
    useSoundStore.getState().openSettings();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(useSoundStore.getState().isSettingsOpen).toBe(false);
  });

  it('ao clicar no botão de silenciar a trilha sonora, preserva o volume configurado e apenas muta/desmuta', () => {
    render(<SoundSettingsModal />);

    // Inicialmente musicVolume = 0.65 (65%) e não está mutado
    expect(useSoundStore.getState().musicVolume).toBe(0.65);
    expect(useSoundStore.getState().isMusicMuted).toBe(false);
    expect(soundManager.getIsMusicMuted()).toBe(false);

    const muteBtn = screen.getByRole('button', { name: /silenciar trilha sonora/i });
    expect(muteBtn).toBeDefined();

    // 1. Clica para mutar
    fireEvent.click(muteBtn);

    // O volume deve SE MANTER em 0.65 (65%), mudando apenas o estado mutado
    expect(useSoundStore.getState().musicVolume).toBe(0.65);
    expect(useSoundStore.getState().isMusicMuted).toBe(true);
    expect(soundManager.getIsMusicMuted()).toBe(true);
    expect(soundManager.getEffectiveMusicGain()).toBe(0);

    const musicSlider = screen.getByLabelText(/volume da trilha sonora/i) as HTMLInputElement;
    expect(musicSlider.value).toBe('65');
    expect(screen.getByText('(Mudo)')).toBeDefined();

    // 2. Clica novamente para desmutar
    const unmuteBtn = screen.getByRole('button', { name: /restaurar trilha sonora/i });
    fireEvent.click(unmuteBtn);

    expect(useSoundStore.getState().musicVolume).toBe(0.65);
    expect(useSoundStore.getState().isMusicMuted).toBe(false);
    expect(soundManager.getIsMusicMuted()).toBe(false);
    expect(soundManager.getEffectiveMusicGain()).toBeCloseTo(0.65 * 0.75, 4);
    expect(musicSlider.value).toBe('65');
  });

  it('desmuta automaticamente a trilha sonora se o usuário arrastar o slider de volume', () => {
    useSoundStore.getState().setMusicMuted(true);
    render(<SoundSettingsModal />);

    expect(useSoundStore.getState().isMusicMuted).toBe(true);

    const musicSlider = screen.getByLabelText(/volume da trilha sonora/i);
    fireEvent.change(musicSlider, { target: { value: '80' } });

    expect(useSoundStore.getState().musicVolume).toBe(0.8);
    expect(useSoundStore.getState().isMusicMuted).toBe(false);
    expect(soundManager.getIsMusicMuted()).toBe(false);
  });
});
