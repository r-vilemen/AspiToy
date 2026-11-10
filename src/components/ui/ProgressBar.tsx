import { Sparkles } from 'lucide-react';
import { useRobotStore } from '@/store/robotStore';

export function ProgressBar() {
  const cleaningProgress = useRobotStore((s) => s.cleaningProgress);

  return (
    <div
      className="rounded-xl bg-[#FFFDF8] px-3 py-2.5 border-2 border-[#2A211B] shadow-[2px_2px_0px_#2A211B]"
      aria-label={`Progresso da limpeza em ${cleaningProgress}%`}
    >
      <div className="flex items-center justify-between text-xs text-[#6E5D4F]">
        <span className="inline-flex items-center gap-1.5 font-bold text-[#2A211B]">
          <Sparkles className="h-3.5 w-3.5 stroke-[2.2] text-[#E05A36]" aria-hidden="true" />
          Área higienizada
        </span>
        <span className="font-mono font-black tabular-nums text-[#2A211B]">
          {cleaningProgress}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5D7C5] border border-[#2A211B]/30">
        <div
          className="h-full rounded-full bg-[#E05A36] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, cleaningProgress))}%` }}
        />
      </div>
    </div>
  );
}

