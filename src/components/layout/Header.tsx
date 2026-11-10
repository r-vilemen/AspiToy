import { Bot, Eye, Scan, Video } from 'lucide-react';
import { useCommandStore, type CameraPreset } from '@/store/commandStore';

const CAMERA_OPTIONS: { id: CameraPreset; label: string; icon: typeof Video }[] = [
  { id: 'follow', label: 'Acompanhar', icon: Video },
  { id: 'overview', label: 'Visão geral', icon: Scan },
  { id: 'closeup', label: 'Personagem', icon: Eye },
];

export function Header() {
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const setCameraPreset = useCommandStore((s) => s.setCameraPreset);

  return (
    <header className="pointer-events-none flex items-center justify-between gap-4 px-4 pt-4 sm:px-6 sm:pt-5">
      {/* Identidade da experiência */}
      <div className="pointer-events-auto inline-flex items-center gap-3 rounded-2xl border border-[#8C6D4F]/20 bg-[#FBF7F0]/88 px-3.5 py-2 shadow-sm backdrop-blur-md">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E05A36] text-white shadow-inner">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-base font-bold leading-none text-[#2A211B]">
              AspiToy
            </h1>
            <span className="rounded-md bg-[#14B8A6]/15 px-1.5 py-0.5 text-[11px] font-medium text-[#0F766E]">
              Sala de Estar
            </span>
          </div>
          <p className="mt-0.5 text-xs text-[#6E5D4F]">
            Agente robótico doméstico autônomo
          </p>
        </div>
      </div>

      {/* Seletor de enquadramento da câmera 3D */}
      <nav
        aria-label="Modos de câmera"
        className="pointer-events-auto hidden sm:inline-flex items-center gap-1 rounded-2xl border border-[#8C6D4F]/20 bg-[#FBF7F0]/88 p-1.5 shadow-sm backdrop-blur-md"
      >
        {CAMERA_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isActive = cameraPreset === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setCameraPreset(option.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-[#2A211B] text-[#FBF7F0] shadow-xs'
                  : 'text-[#54463B] hover:bg-[#EFE6D6] hover:text-[#2A211B]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {option.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
}

