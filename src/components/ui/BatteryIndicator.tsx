import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, AlertTriangle } from 'lucide-react';
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
      className={`rounded-xl bg-[#FFFDF8] px-3 py-2.5 border-2 transition-colors duration-200 ${
        isLow && !isCharging
          ? 'border-[#DC2626] shadow-[2px_2px_0px_#DC2626]'
          : 'border-[#2A211B] shadow-[2px_2px_0px_#2A211B]'
      }`}
      aria-label={`Bateria em ${Math.round(battery)}%${isLow && !isCharging ? ' - Bateria Fraca' : ''}`}
    >
      <div className="flex items-center justify-between text-xs text-[#6E5D4F]">
        <span className="inline-flex items-center gap-1.5 font-bold text-[#2A211B]">
          <Icon
            className={`h-4 w-4 stroke-[2.2] ${
              isLow && !isCharging ? 'text-[#DC2626] animate-pulse' : 'text-[#0F766E]'
            }`}
            aria-hidden="true"
          />
          Bateria
        </span>
        <div className="flex items-center gap-1.5">
          {isLow && !isCharging && (
            <span
              data-testid="battery-low-badge"
              className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-[#DC2626] bg-[#FEE2E2] px-1.5 py-0.5 rounded border border-[#DC2626]/40 animate-pulse"
            >
              Fraca
            </span>
          )}
          <span
            className={`font-mono font-black tabular-nums ${
              isLow && !isCharging ? 'text-[#DC2626]' : 'text-[#2A211B]'
            }`}
          >
            {Math.round(battery)}%
          </span>
        </div>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E5D7C5] border border-[#2A211B]/30">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(0, battery))}%` }}
        />
      </div>

      {isLow && !isCharging && (
        <div
          data-testid="battery-low-warning"
          className="mt-2 flex items-center justify-between text-[10px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-1 rounded-lg border border-[#FCA5A5]"
        >
          <span className="inline-flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
            <span>Bateria fraca — Voo bloqueado</span>
          </span>
          <span className="text-[9px] uppercase tracking-wider font-black text-[#991B1B]">
            Mín. 20%
          </span>
        </div>
      )}
    </div>
  );
}
