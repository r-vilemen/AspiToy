import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium } from 'lucide-react';
import { useRobotStore } from '@/store/robotStore';

export function BatteryIndicator() {
  const battery = useRobotStore((s) => s.battery);
  const state = useRobotStore((s) => s.state);

  const isCharging = state === 'RECHARGING';
  const isLow = battery <= 20;

  const Icon = isCharging
    ? BatteryCharging
    : isLow
      ? BatteryLow
      : battery <= 65
        ? BatteryMedium
        : BatteryFull;

  const barColor = isCharging
    ? 'bg-[#10B981]'
    : isLow
      ? 'bg-[#DC2626]'
      : 'bg-[#14B8A6]';

  return (
    <div
      className="rounded-xl bg-[#FFFDF8] px-3 py-2.5 border-2 border-[#2A211B] shadow-[2px_2px_0px_#2A211B]"
      aria-label={`Bateria em ${Math.round(battery)}%`}
    >
      <div className="flex items-center justify-between text-xs text-[#6E5D4F]">
        <span className="inline-flex items-center gap-1.5 font-bold text-[#2A211B]">
          <Icon className="h-4 w-4 stroke-[2.2] text-[#0F766E]" aria-hidden="true" />
          Bateria
        </span>
        <span className="font-mono font-black tabular-nums text-[#2A211B]">
          {Math.round(battery)}%
        </span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5D7C5] border border-[#2A211B]/30">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, battery))}%` }}
        />
      </div>
    </div>
  );
}

