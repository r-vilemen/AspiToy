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
        <h2 className="font-display text-lg font-semibold tracking-tight text-[#2A211B]">
          {name}
        </h2>
        <p className="text-xs text-[#6E5D4F]">{descriptor.shortNote}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <BatteryIndicator />
        <ProgressBar />
      </div>

      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-[#F3ECE0]/75 p-3 text-xs border border-[#8C6D4F]/12">
        <div>
          <dt className="flex items-center gap-1 text-[#6E5D4F]">
            <MapPin className="h-3.5 w-3.5 text-[#E05A36]" aria-hidden="true" />
            Região atual
          </dt>
          <dd className="mt-0.5 font-medium text-[#2A211B] truncate">
            {currentRegionLabel}
          </dd>
        </div>

        <div>
          <dt className="flex items-center gap-1 text-[#6E5D4F]">
            <Clock className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
            Tempo ativo
          </dt>
          <dd className="mt-0.5 font-mono font-semibold tabular-nums text-[#2A211B]">
            {formatDuration(operationSeconds)}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl bg-[#EFE6D6]/85 px-3 py-2 text-xs text-[#54463B]">
        <span className="font-medium text-[#2A211B]">Última ação: </span>
        {lastAction}
      </div>
    </section>
  );
}
