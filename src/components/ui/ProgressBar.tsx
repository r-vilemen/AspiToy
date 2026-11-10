import { Broom } from 'lucide-react';
import { useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';

export function ProgressBar() {
  const cleaningProgress = useRobotStore((s) => s.cleaningProgress);
  const cleanedAreaM2 = useRobotStore((s) => s.cleanedAreaM2);
  const totalAreaM2 = useRobotStore((s) => s.totalAreaM2);
  const selectedRegionId = useEnvironmentStore((s) => s.selectedRegionId);

  const scopeLabel = selectedRegionId === 'all' ? 'total' : 'cômodo';

  return (
    <div
      className="rounded-xl bg-[#FFFDF8] px-3 py-2 border-2 border-[#2A211B] shadow-[2px_2px_0px_#2A211B]"
      aria-label={`Progresso da limpeza em ${cleaningProgress}%`}
    >
      <div className="flex items-center justify-between text-xs text-[#6E5D4F]">
        <span className="inline-flex items-center gap-1.5 font-bold text-[#2A211B]">
          <Broom className="h-4 w-4 stroke-[2.2] text-[#E05A36]" aria-hidden="true" />
          Área higienizada
        </span>
        <span className="font-mono font-black tabular-nums text-[#2A211B]">
          {cleaningProgress}%
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#E5D7C5] border border-[#2A211B]/30">
        <div
          className="h-full rounded-full bg-[#E05A36] transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, cleaningProgress))}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between font-mono text-[10px] font-bold text-[#8C6D4F]">
        <span>{cleanedAreaM2.toFixed(1)} m² limpos</span>
        <span>{totalAreaM2.toFixed(0)} m² {scopeLabel}</span>
      </div>
    </div>
  );
}

