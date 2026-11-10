import { Sparkles } from 'lucide-react';
import { useRobotStore } from '@/store/robotStore';

export function ProgressBar() {
  const cleaningProgress = useRobotStore((s) => s.cleaningProgress);

  return (
    <div
      className="rounded-xl bg-[#F3ECE0]/90 px-3.5 py-2.5 border border-[#8C6D4F]/15"
      aria-label={`Progresso da limpeza em ${cleaningProgress}%`}
    >
      <div className="flex items-center justify-between text-xs text-[#6E5D4F]">
        <span className="inline-flex items-center gap-1.5 font-medium text-[#2A211B]">
          <Sparkles className="h-3.5 w-3.5 text-[#E05A36]" aria-hidden="true" />
          Área higienizada
        </span>
        <span className="font-mono font-semibold tabular-nums text-[#2A211B]">
          {cleaningProgress}%
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#DED3C1]">
        <div
          className="h-full rounded-full bg-[#E05A36] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, cleaningProgress))}%` }}
        />
      </div>
    </div>
  );
}

