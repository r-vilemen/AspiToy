import { Cat as CatIcon, Clock, Compass, MapPin } from 'lucide-react';
import { useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import type { CatBehaviorState } from '@/types/environment';
import { formatDuration, STATE_DESCRIPTORS } from '@/hooks/useRobotState';
import { formatCoordinates } from '@/utils/coordinates';
import { BatteryIndicator } from './BatteryIndicator';
import { ProgressBar } from './ProgressBar';

const CAT_STATE_LABELS: Record<CatBehaviorState, string> = {
  WALKING: 'Andando pela casa',
  RUNNING: 'Correndo animado',
  STANDING: 'Em pé (acordado)',
  LYING: 'Deitado (acordado)',
  SLEEPING: 'Dormindo (Zzz)',
};

export function StatusCard() {
  const name = useRobotStore((s) => s.name);
  const state = useRobotStore((s) => s.state);
  const currentRegionLabel = useRobotStore((s) => s.currentRegionLabel);
  const operationSeconds = useRobotStore((s) => s.operationSeconds);
  const lastAction = useRobotStore((s) => s.lastAction);
  const position = useRobotStore((s) => s.position);

  const catState = useEnvironmentStore((s) => s.catState);
  const cycleCatBehavior = useEnvironmentStore((s) => s.cycleCatBehavior);

  const descriptor = STATE_DESCRIPTORS[state];

  return (
    <section
      aria-label="Estado atual do AspiToy"
      className="space-y-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#2A211B]">
            {name}
          </h2>
          <p className="text-xs text-[#6E5D4F]">{descriptor.shortNote}</p>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${descriptor.badgeClass}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${descriptor.dotColorClass}`}
            aria-hidden="true"
          />
          {descriptor.label}
        </span>
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

        <div className="col-span-2 pt-1.5 border-t border-[#8C6D4F]/12 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[#6E5D4F]">
            <Compass className="h-3.5 w-3.5 text-[#6E5D4F]" aria-hidden="true" />
            Posição na sala
          </span>
          <span className="font-mono text-[11px] tabular-nums text-[#2A211B]">
            {formatCoordinates(position)}
          </span>
        </div>

        <div className="col-span-2 pt-1.5 border-t border-[#8C6D4F]/12 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[#6E5D4F]">
            <CatIcon className="h-3.5 w-3.5 text-[#D96B27]" aria-hidden="true" />
            Gato Laranja
          </span>
          <button
            type="button"
            onClick={() => cycleCatBehavior()}
            title="Clique para alternar o comportamento do gato"
            className="rounded-md bg-[#D96B27]/15 px-2 py-0.5 text-[11px] font-semibold text-[#9C3E11] hover:bg-[#D96B27]/25 transition cursor-pointer"
          >
            {CAT_STATE_LABELS[catState]}
          </button>
        </div>
      </dl>

      <div className="rounded-xl bg-[#EFE6D6]/85 px-3 py-2 text-xs text-[#54463B]">
        <span className="font-medium text-[#2A211B]">Última ação: </span>
        {lastAction}
      </div>
    </section>
  );
}
