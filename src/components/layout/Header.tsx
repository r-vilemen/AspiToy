import { Bot, Eye, HelpCircle, Scan, Video, Volume2, VolumeX } from 'lucide-react';
import { useCommandStore, type CameraPreset } from '@/store/commandStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useRobotStore } from '@/store/robotStore';
import { useSoundStore } from '@/store/soundStore';

const CAMERA_OPTIONS: { id: CameraPreset; label: string; icon: typeof Video }[] = [
  { id: 'follow', label: 'Acompanhar', icon: Video },
  { id: 'overview', label: 'Visão geral', icon: Scan },
  { id: 'closeup', label: 'Personagem', icon: Eye },
];

export function Header() {
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const setCameraPreset = useCommandStore((s) => s.setCameraPreset);
  const openTutorial = useOnboardingStore((s) => s.openTutorial);
  const currentRegionLabel = useRobotStore((s) => s.currentRegionLabel);
  const isSoundEnabled = useSoundStore((s) => s.isEnabled);
  const toggleSound = useSoundStore((s) => s.toggleSound);

  return (
    <header className="pointer-events-none flex items-center justify-between gap-2 px-2.5 pt-2.5 sm:gap-4 sm:px-6 sm:pt-5">
      {/* Identidade do Jogador 1 (HUD do Robô) */}
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-2xl border-2 sm:border-2.5 border-[#2A211B] bg-[#FFFDF8] p-1.5 sm:px-3.5 sm:py-2.5 shadow-[3px_3px_0px_#2A211B] sm:shadow-[4px_4px_0px_#2A211B]">
        <div className="relative flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border-1.5 sm:border-2 border-[#2A211B] bg-linear-to-b from-[#F2724D] to-[#E05A36] text-white shadow-[1.5px_1.5px_0px_#2A211B] sm:shadow-[2px_2px_0px_#2A211B]">
          <Bot className="h-4 w-4 sm:h-5 sm:w-5 stroke-[2.2]" aria-hidden="true" />
          <span
            title="Jogador 1 Ativo"
            className="absolute -top-1 -right-1 h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-[#10B981] border-1.5 sm:border-2 border-[#2A211B] shadow-xs animate-pulse"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="font-display text-sm sm:text-base font-black leading-none tracking-tight text-[#2A211B]">
              AspiToy
            </h1>
            <span className="rounded-md sm:rounded-lg border-1.5 sm:border-2 border-[#2A211B] bg-[#CCFBF1] px-1.5 sm:px-2 py-0.5 font-mono text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#0F766E] shadow-[1px_1px_0px_#2A211B] sm:shadow-[1.5px_1.5px_0px_#2A211B] max-w-[80px] sm:max-w-none truncate">
              {currentRegionLabel || 'Casa'}
            </span>
          </div>
          <p className="hidden sm:block mt-1 font-mono text-[11px] font-black text-[#6E5D4F] uppercase tracking-wide">
            P1 • AGENTE DE LIMPEZA 3D
          </p>
        </div>
      </div>

      {/* Ações da barra superior: Câmeras de Jogo e Tutorial */}
      <div className="pointer-events-auto inline-flex items-center gap-1.5 sm:gap-2.5">
        <nav
          id="tour-camera-modes"
          aria-label="Modos de câmera"
          className="inline-flex items-center gap-0.5 sm:gap-1 rounded-2xl border-2 sm:border-2.5 border-[#2A211B] bg-[#FFFDF8] p-1 sm:p-1.5 shadow-[3px_3px_0px_#2A211B] sm:shadow-[4px_4px_0px_#2A211B]"
        >
          {CAMERA_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = cameraPreset === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setCameraPreset(option.id)}
                title={option.label}
                aria-label={option.label}
                className={`inline-flex items-center gap-1.5 rounded-xl p-2 sm:px-3 sm:py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  isActive
                    ? 'border-2 border-[#2A211B] bg-[#2A211B] text-[#FFFDF8] shadow-[1px_1px_0px_#000] translate-y-0.5'
                    : 'border-2 border-transparent text-[#54463B] hover:border-[#2A211B]/30 hover:bg-[#F3ECE0]'
                }`}
              >
                <Icon className="h-4 w-4 sm:h-3.5 sm:w-3.5 stroke-[2.2]" aria-hidden="true" />
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Botão de Som Liga/Desliga */}
        <button
          id="sound-toggle-btn"
          type="button"
          onClick={toggleSound}
          title={
            isSoundEnabled
              ? 'Som do AspiToy: Ligado (Clique para desligar)'
              : 'Som do AspiToy: Desligado (Clique para ligar)'
          }
          aria-label={isSoundEnabled ? 'Desligar som do projeto' : 'Ligar som do projeto'}
          className={`inline-flex items-center gap-1.5 rounded-2xl border-2 sm:border-2.5 border-[#2A211B] p-2 sm:px-3 sm:py-2.5 text-xs font-black uppercase tracking-wider shadow-[2.5px_2.5px_0px_#2A211B] sm:shadow-[3px_3px_0px_#2A211B] hover:shadow-[1px_1px_0px_#2A211B] hover:translate-y-0.5 active:shadow-none active:translate-y-1 transition cursor-pointer ${
            isSoundEnabled
              ? 'bg-[#10B981] hover:bg-[#059669] text-white'
              : 'bg-[#FFFDF8] hover:bg-[#F3ECE0] text-[#78695D]'
          }`}
        >
          {isSoundEnabled ? (
            <Volume2 className="h-4 w-4 stroke-[2.5] animate-pulse" aria-hidden="true" />
          ) : (
            <VolumeX className="h-4 w-4 stroke-[2.2] opacity-70" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">
            {isSoundEnabled ? 'Som Ligado' : 'Som Desligado'}
          </span>
        </button>

        {/* Botão de Tutorial no Estilo Ficha / Cartucho */}
        <button
          type="button"
          onClick={() => openTutorial(0)}
          title="Ver guia rápido de controles e mecânicas"
          aria-label="Ver guia de tutorial"
          className="inline-flex items-center gap-1.5 rounded-2xl border-2 sm:border-2.5 border-[#2A211B] bg-[#FBBF24] hover:bg-[#F59E0B] p-2 sm:px-3.5 sm:py-2.5 text-xs font-black uppercase tracking-wider text-[#2A211B] shadow-[2.5px_2.5px_0px_#2A211B] sm:shadow-[3px_3px_0px_#2A211B] hover:shadow-[1px_1px_0px_#2A211B] hover:translate-y-0.5 active:shadow-none active:translate-y-1 transition cursor-pointer"
        >
          <HelpCircle className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span className="hidden sm:inline">Guia</span>
        </button>
      </div>
    </header>
  );
}

