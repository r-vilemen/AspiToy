import { Bot, Eye, HelpCircle, Scan, Video } from 'lucide-react';
import { useCommandStore, type CameraPreset } from '@/store/commandStore';
import { useOnboardingStore } from '@/store/onboardingStore';

const CAMERA_OPTIONS: { id: CameraPreset; label: string; icon: typeof Video }[] = [
  { id: 'follow', label: 'Acompanhar', icon: Video },
  { id: 'overview', label: 'Visão geral', icon: Scan },
  { id: 'closeup', label: 'Personagem', icon: Eye },
];

export function Header() {
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const setCameraPreset = useCommandStore((s) => s.setCameraPreset);
  const openTutorial = useOnboardingStore((s) => s.openTutorial);

  return (
    <header className="pointer-events-none flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
      {/* Identidade do Jogador 1 (HUD do Robô) */}
      <div className="pointer-events-auto inline-flex items-center gap-3 rounded-2xl border-2.5 border-[#2A211B] bg-[#FFFDF8] px-3.5 py-2.5 shadow-[4px_4px_0px_#2A211B]">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[#2A211B] bg-linear-to-b from-[#F2724D] to-[#E05A36] text-white shadow-[2px_2px_0px_#2A211B]">
          <Bot className="h-5 w-5 stroke-[2.2]" aria-hidden="true" />
          <span
            title="Jogador 1 Ativo"
            className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#10B981] border-2 border-[#2A211B] shadow-xs"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-base font-black leading-none tracking-tight text-[#2A211B]">
              AspiToy
            </h1>
            <span className="rounded-md border border-[#0F766E] bg-[#CCFBF1] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#0F766E] shadow-[1px_1px_0px_#0F766E]">
              SALA DE ESTAR
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] font-bold text-[#6E5D4F] uppercase tracking-wide">
            P1 • AGENTE DE LIMPEZA 3D
          </p>
        </div>
      </div>

      {/* Ações da barra superior: Câmeras de Jogo e Tutorial */}
      <div className="pointer-events-auto inline-flex items-center gap-2.5">
        <nav
          id="tour-camera-modes"
          aria-label="Modos de câmera"
          className="inline-flex items-center gap-1 rounded-2xl border-2.5 border-[#2A211B] bg-[#FFFDF8] p-1.5 shadow-[4px_4px_0px_#2A211B]"
        >
          {CAMERA_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = cameraPreset === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setCameraPreset(option.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider transition cursor-pointer ${
                  isActive
                    ? 'border-2 border-[#2A211B] bg-[#2A211B] text-[#FFFDF8] shadow-[1px_1px_0px_#000] translate-y-0.5'
                    : 'border-2 border-transparent text-[#54463B] hover:border-[#2A211B]/30 hover:bg-[#F3ECE0]'
                }`}
              >
                <Icon className="h-3.5 w-3.5 stroke-[2.2]" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </nav>

        {/* Botão de Tutorial no Estilo Ficha / Cartucho */}
        <button
          type="button"
          onClick={() => openTutorial(0)}
          title="Ver guia rápido de controles e mecânicas"
          className="inline-flex items-center gap-1.5 rounded-2xl border-2.5 border-[#2A211B] bg-[#FBBF24] hover:bg-[#F59E0B] px-3.5 py-2.5 text-xs font-black uppercase tracking-wider text-[#2A211B] shadow-[3px_3px_0px_#2A211B] hover:shadow-[1px_1px_0px_#2A211B] hover:translate-y-0.5 active:shadow-none active:translate-y-1 transition cursor-pointer"
        >
          <HelpCircle className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
          <span className="hidden sm:inline">Guia</span>
        </button>
      </div>
    </header>
  );
}

