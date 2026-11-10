import { Clock, MapPin } from 'lucide-react';
import { useRobotStore } from '@/store/robotStore';
import { formatDuration, STATE_DESCRIPTORS } from '@/hooks/useRobotState';
import { BatteryIndicator } from './BatteryIndicator';
import { ProgressBar } from './ProgressBar';

export function StatusCard() {
  const name = useRobotStore((s) => s.name);
  const state = useRobotStore((s) => s.state);
  const currentRegionLabel = useRobotStore((s) => s.currentRegionLabel);
  const operationSeconds = useRobotStore((s) => s.operationSeconds);
  const lastAction = useRobotStore((s) => s.lastAction);

  const descriptor = STATE_DESCRIPTORS[state];

  return (
    <section
      aria-label="Estado atual do AspiToy"
      className="space-y-3"
    >
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-black tracking-tight text-[#2A211B]">
            {name}
          </h2>
          <span className="inline-flex items-center gap-1 rounded-md border border-[#2A211B] bg-[#DCFCE7] px-2 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider text-[#15803D] shadow-[1px_1px_0px_#2A211B]">
            ONLINE
          </span>
        </div>
        <p className="mt-0.5 text-xs font-semibold text-[#6E5D4F]">{descriptor.shortNote}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <BatteryIndicator />
        <ProgressBar />
      </div>

      <dl className="grid grid-cols-2 gap-2 rounded-2xl bg-[#F5ECE0] p-3 text-xs border-2 border-[#2A211B] shadow-[2px_2px_0px_#2A211B]">
        <div>
          <dt className="flex items-center gap-1 font-bold text-[#6E5D4F]">
            <MapPin className="h-3.5 w-3.5 stroke-[2.2] text-[#E05A36]" aria-hidden="true" />
            Região atual
          </dt>
          <dd className="mt-0.5 font-black text-[#2A211B] truncate">
            {currentRegionLabel}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1 font-bold text-[#6E5D4F]">
            <Clock className="h-3.5 w-3.5 stroke-[2.2] text-[#0F766E]" aria-hidden="true" />
            Tempo ativo
          </dt>
          <dd className="mt-0.5 font-mono font-black tabular-nums text-[#2A211B]">
            {formatDuration(operationSeconds)}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border-2 border-[#2A211B] bg-[#FEF3C7] px-3 py-2 text-xs text-[#54463B] shadow-[2px_2px_0px_#2A211B]">
        <span className="font-black text-[#2A211B]">Última ação: </span>
        <span className="font-medium">{lastAction}</span>
      </div>
    </section>
  );
}
