import { useEffect, useRef } from 'react';
import {
  AudioLines,
  Music,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useSoundStore } from '@/store/soundStore';
import { soundManager } from '@/services/soundManager';

export function SoundSettingsModal() {
  const isEnabled = useSoundStore((s) => s.isEnabled);
  const masterVolume = useSoundStore((s) => s.masterVolume);
  const musicVolume = useSoundStore((s) => s.musicVolume);
  const sfxVolume = useSoundStore((s) => s.sfxVolume);
  const isMusicMuted = useSoundStore((s) => s.isMusicMuted);
  const toggleSound = useSoundStore((s) => s.toggleSound);
  const enableSound = useSoundStore((s) => s.enableSound);
  const setMasterVolume = useSoundStore((s) => s.setMasterVolume);
  const setMusicVolume = useSoundStore((s) => s.setMusicVolume);
  const setSfxVolume = useSoundStore((s) => s.setSfxVolume);
  const toggleMusicMute = useSoundStore((s) => s.toggleMusicMute);
  const setMusicMuted = useSoundStore((s) => s.setMusicMuted);
  const closeSettings = useSoundStore((s) => s.closeSettings);

  const containerRef = useRef<HTMLDivElement>(null);

  // Fecha ao pressionar ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeSettings]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        const soundBtn = document.getElementById('sound-toggle-btn');
        const soundSettingsBtn = document.getElementById('sound-settings-btn');
        if (
          soundBtn?.contains(e.target as Node) ||
          soundSettingsBtn?.contains(e.target as Node)
        ) {
          return;
        }
        closeSettings();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeSettings]);

  const handleTestSfx = () => {
    if (!isEnabled) {
      enableSound();
    }
    soundManager.ensureAudioRunning();
    soundManager.playCleanPop();
  };

  const handleMusicChange = (val: number) => {
    if (!isEnabled && val > 0) {
      enableSound();
    }
    soundManager.ensureAudioRunning();
    setMusicVolume(val);
  };

  const handleSfxChange = (val: number) => {
    if (!isEnabled && val > 0) {
      enableSound();
    }
    soundManager.ensureAudioRunning();
    setSfxVolume(val);
  };

  const handleMasterChange = (val: number) => {
    if (!isEnabled && val > 0) {
      enableSound();
    }
    soundManager.ensureAudioRunning();
    setMasterVolume(val);
  };

  return (
    <>
      {/* Backdrop transparente para capturar cliques no mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/25 sm:hidden"
        onClick={closeSettings}
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Configurações de Áudio do AspiToy"
        className="pointer-events-auto fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-88 md:w-96 max-w-sm rounded-2xl border-2 sm:border-2.5 border-[#2A211B] bg-[#FFFDF8] p-4 sm:p-5 shadow-[4px_4px_0px_#2A211B] sm:shadow-[5px_5px_0px_#2A211B] z-50 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b-2 border-[#2A211B]/15 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border-1.5 border-[#2A211B] bg-[#FBBF24] text-[#2A211B] shadow-[1.5px_1.5px_0px_#2A211B]">
              <SlidersHorizontal className="h-4 w-4 stroke-[2.4]" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-display text-sm font-black tracking-tight text-[#2A211B]">
                Áudio do Projeto
              </h2>
              <p className="font-mono text-[10px] font-bold text-[#78695D] uppercase tracking-wider">
                Música & Efeitos Sonoros
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeSettings}
            title="Fechar configurações"
            aria-label="Fechar painel de som"
            className="flex h-7 w-7 items-center justify-center rounded-lg border-1.5 border-[#2A211B] bg-[#FFFDF8] text-[#2A211B] hover:bg-[#F3ECE0] shadow-[1.5px_1.5px_0px_#2A211B] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>

        {/* Interruptor Master (Som Ligado / Desligado) */}
        <div
          className={`mt-4 flex items-center justify-between rounded-xl border-2 border-[#2A211B] p-2.5 shadow-[2px_2px_0px_#2A211B] transition ${
            isEnabled ? 'bg-[#ECFDF5]' : 'bg-[#FEF2F2]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg border-1.5 border-[#2A211B] transition ${
                isEnabled
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[#EF4444] text-white'
              }`}
            >
              {isEnabled ? (
                <Volume2 className="h-4 w-4 stroke-[2.5] animate-pulse" aria-hidden="true" />
              ) : (
                <VolumeX className="h-4 w-4 stroke-[2.2]" aria-hidden="true" />
              )}
            </div>
            <div>
              <span className="block font-display text-xs font-black text-[#2A211B]">
                Som Geral
              </span>
              <span className="block font-mono text-[10px] font-bold text-[#78695D]">
                {isEnabled ? 'Áudio e trilha sonora ativos' : 'Áudio desativado'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              toggleSound();
              soundManager.ensureAudioRunning();
            }}
            aria-pressed={isEnabled}
            className={`rounded-xl border-2 border-[#2A211B] px-3.5 py-1.5 font-mono text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#2A211B] active:shadow-none active:translate-y-0.5 transition cursor-pointer ${
              isEnabled
                ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                : 'bg-[#F2724D] hover:bg-[#E05A36] text-white animate-bounce'
            }`}
          >
            {isEnabled ? 'Ligado' : 'Ligar Som'}
          </button>
        </div>

        {/* Sliders de Configuração */}
        <div className="mt-4 space-y-4">
          {/* 1. Trilha Sonora (Música / BGM) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="music-volume-slider"
                className="flex items-center gap-1.5 font-display text-xs font-black text-[#2A211B]"
              >
                <Music className="h-3.5 w-3.5 text-[#F2724D] stroke-[2.5]" aria-hidden="true" />
                <span>Trilha Sonora</span>
              </label>
              <div className="flex items-center gap-2">
                <span
                  className={`font-mono text-xs font-black tabular-nums transition-colors ${
                    isMusicMuted ? 'text-[#78695D]' : 'text-[#F2724D]'
                  }`}
                >
                  {Math.round(musicVolume * 100)}%
                  {isMusicMuted && (
                    <span className="ml-1 text-[10px] font-bold uppercase tracking-wider text-[#EF4444]">
                      (Mudo)
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEnabled) {
                      enableSound();
                    }
                    soundManager.ensureAudioRunning();
                    toggleMusicMute();
                  }}
                  title={isMusicMuted ? 'Restaurar trilha sonora' : 'Silenciar trilha sonora'}
                  aria-label={isMusicMuted ? 'Restaurar trilha sonora' : 'Silenciar trilha sonora'}
                  aria-pressed={isMusicMuted}
                  className={`flex h-6 w-6 items-center justify-center rounded-lg border transition cursor-pointer shadow-[1px_1px_0px_#2A211B] active:translate-y-0.5 active:shadow-none ${
                    isMusicMuted
                      ? 'border-[#EF4444] bg-[#FEF2F2] text-[#EF4444]'
                      : 'border-[#2A211B]/40 bg-[#FFFDF8] hover:bg-[#F3ECE0] text-[#F2724D]'
                  }`}
                >
                  {isMusicMuted ? (
                    <VolumeX className="h-3.5 w-3.5 stroke-[2.4]" aria-hidden="true" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 stroke-[2.4]" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <p className="font-mono text-[10px] text-[#78695D]">
              Musiquinha animada e saltitante de brinquedo (128 BPM)
            </p>
            <input
              id="music-volume-slider"
              type="range"
              min="0"
              max="100"
              value={Math.round(musicVolume * 100)}
              onChange={(e) => {
                const val = Number(e.target.value) / 100;
                if (isMusicMuted && val > 0) {
                  setMusicMuted(false);
                }
                handleMusicChange(val);
              }}
              aria-label="Volume da trilha sonora"
              className={`h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E5DCD0] ${
                isMusicMuted ? 'accent-[#78695D] opacity-60' : 'accent-[#F2724D]'
              }`}
            />
          </div>

          {/* 2. Efeitos Sonoros (SFX) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="sfx-volume-slider"
                className="flex items-center gap-1.5 font-display text-xs font-black text-[#2A211B]"
              >
                <AudioLines className="h-3.5 w-3.5 text-[#0F766E] stroke-[2.5]" aria-hidden="true" />
                <span>Efeitos Sonoros</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#0F766E] tabular-nums">
                  {Math.round(sfxVolume * 100)}%
                </span>
                <button
                  type="button"
                  onClick={handleTestSfx}
                  title="Tocar efeito sonoro de teste"
                  className="rounded-md border border-[#2A211B]/40 bg-[#FFFDF8] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-[#2A211B] hover:bg-[#F3ECE0] shadow-[1px_1px_0px_#2A211B] active:translate-y-0.5 active:shadow-none cursor-pointer"
                >
                  Testar
                </button>
              </div>
            </div>
            <p className="font-mono text-[10px] text-[#78695D]">
              Motor do aspirador, sucção de poeira e bipes
            </p>
            <input
              id="sfx-volume-slider"
              type="range"
              min="0"
              max="100"
              value={Math.round(sfxVolume * 100)}
              onChange={(e) => handleSfxChange(Number(e.target.value) / 100)}
              aria-label="Volume dos efeitos sonoros"
              className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E5DCD0] accent-[#0F766E]"
            />
          </div>

          {/* 3. Volume Geral (Master) */}
          <div className="space-y-1.5 border-t border-[#2A211B]/10 pt-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="master-volume-slider"
                className="font-display text-xs font-black text-[#2A211B]"
              >
                Volume Geral (Master)
              </label>
              <span className="font-mono text-xs font-black text-[#2A211B] tabular-nums">
                {Math.round(masterVolume * 100)}%
              </span>
            </div>
            <input
              id="master-volume-slider"
              type="range"
              min="0"
              max="100"
              value={Math.round(masterVolume * 100)}
              onChange={(e) => handleMasterChange(Number(e.target.value) / 100)}
              aria-label="Volume master geral"
              className="h-2.5 w-full cursor-pointer appearance-none rounded-lg bg-[#E5DCD0] accent-[#2A211B]"
            />
          </div>
        </div>

        {/* Rodapé explicativo */}
        <div className="mt-4 rounded-xl border border-[#2A211B]/20 bg-[#F3ECE0]/60 p-2 text-center">
          <p className="font-mono text-[9px] font-bold text-[#6E5D4F]">
            Trilha sonora original e efeitos em síntese procedural Web Audio API
          </p>
        </div>
      </div>
    </>
  );
}
