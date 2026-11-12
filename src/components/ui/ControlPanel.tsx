import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bath,
  Bed,
  Compass,
  Home,
  Pause,
  Play,
  RotateCcw,
  Sofa,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';

function getRegionIcon(id: string) {
  switch (id) {
    case 'all':
      return Home;
    case 'bedroom':
      return Bed;
    case 'hallway':
      return Compass;
    case 'living-room':
      return Sofa;
    case 'kitchen':
      return Utensils;
    case 'bathroom':
      return Bath;
    default:
      return Sparkles;
  }
}

export function ControlPanel() {
  const state = useRobotStore((s) => s.state);
  const regions = useEnvironmentStore((s) => s.regions);
  const selectedRegionId = useEnvironmentStore((s) => s.selectedRegionId);
  const dispatchCommand = useCommandStore((s) => s.dispatchCommand);
  const keys = useKeyboardControls();

  const isRunning =
    state === 'CLEANING' ||
    state === 'EXPLORING' ||
    state === 'AVOIDING' ||
    state === 'RETURNING';
  const isPaused = state === 'PAUSED';
  const isReturning = state === 'RETURNING';

  const startManualMove = (forward: number, turn: number) => {
    manualControlBridge.forward = forward;
    manualControlBridge.turn = turn;
    manualControlBridge.active = true;
    const currentRobot = useRobotStore.getState();
    if (currentRobot.targetPosition) {
      currentRobot.setTargetPosition(null);
    }
    if (currentRobot.state === 'RECHARGING') {
      currentRobot.setOperationalState(
        'IDLE',
        'Desacoplado da base manualmente'
      );
    }
  };

  const stopManualMove = () => {
    manualControlBridge.forward = 0;
    manualControlBridge.turn = 0;
    manualControlBridge.active = false;
  };

  return (
    <section aria-label="Controles do agente" className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div id="tour-cleaning-button" className="col-span-2">
          {!isRunning && !isPaused ? (
            <button
              type="button"
              onClick={() => dispatchCommand('START_CLEANING')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#F2724D] to-[#E05A36] px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0px_#9A3412] hover:shadow-[0_2px_0px_#9A3412] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current stroke-[2]" aria-hidden="true" />
              Iniciar limpeza
            </button>
          ) : isPaused ? (
            <button
              type="button"
              onClick={() => dispatchCommand('RESUME_CLEANING')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#14B8A6] to-[#0F766E] px-4 py-3 text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0px_#042F2E] hover:shadow-[0_2px_0px_#042F2E] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current stroke-[2]" aria-hidden="true" />
              Retomar limpeza
            </button>
          ) : (
            <button
              type="button"
              onClick={() => dispatchCommand('PAUSE_CLEANING')}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#3F322A] to-[#2A211B] px-4 py-3 text-sm font-black uppercase tracking-wider text-[#FBF7F0] shadow-[0_4px_0px_#000000] hover:shadow-[0_2px_0px_#000000] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition cursor-pointer"
            >
              <Pause className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              Pausar operação
            </button>
          )}
        </div>

        <button
          id="tour-dock-button"
          type="button"
          disabled={isReturning || state === 'RECHARGING'}
          onClick={() => dispatchCommand('RETURN_TO_BASE')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#2A211B] bg-[#F3ECE0] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#2A211B] shadow-[0_3px_0px_#2A211B] hover:shadow-[0_1px_0px_#2A211B] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 transition cursor-pointer"
        >
          <Home className="h-3.5 w-3.5 stroke-[2.2] text-[#0F766E]" aria-hidden="true" />
          Retornar à base
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand('RESET_SIMULATION')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-[#2A211B] bg-[#F3ECE0] px-3 py-2 text-xs font-black uppercase tracking-wider text-[#6E5D4F] shadow-[0_3px_0px_#2A211B] hover:shadow-[0_1px_0px_#2A211B] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] hover:text-[#2A211B] transition cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5 stroke-[2.2]" aria-hidden="true" />
          Reiniciar cena
        </button>
      </div>

      {/* Controle direcional manual: Exclusivo para Desktop (Teclado WASD / Setas D-Pad) */}
      <div
        id="tour-manual-controls"
        className="hidden sm:block rounded-2xl border-2 border-[#2A211B]/20 bg-[#F3ECE0]/70 p-3 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs font-black uppercase tracking-wider text-[#2A211B]">
            Pilotagem Manual
          </span>
          <span className="font-mono text-[10px] font-bold text-[#6E5D4F]">
            {keys.forward || keys.backward || keys.left || keys.right ? (
              <span className="inline-flex items-center gap-1 rounded bg-[#E05A36] px-1.5 py-0.2 text-[10px] font-black uppercase text-white shadow-xs">
                ● ATIVO
              </span>
            ) : (
              'WASD / Teclado'
            )}
          </span>
        </div>

        {/* Setas direcionais clássicas e indicação de teclado para Desktop */}
        <div className="flex flex-col items-center gap-1.5 select-none">
          <div className="grid grid-cols-3 gap-1.5 max-w-[140px] select-none touch-none">
            <div />
            <button
              type="button"
              aria-label="Mover para frente"
              onPointerDown={() => startManualMove(1, 0)}
              onPointerUp={stopManualMove}
              onPointerLeave={stopManualMove}
              onPointerCancel={stopManualMove}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] shadow-[0_2.5px_0px_#2A211B] transition cursor-pointer select-none touch-none ${
                keys.forward
                  ? 'bg-[#E05A36] text-white translate-y-[2px] shadow-none'
                  : 'bg-[#FFFDF8] text-[#2A211B] hover:bg-[#F3ECE0] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              <ArrowUp className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            <div />
            <button
              type="button"
              aria-label="Girar para a esquerda"
              onPointerDown={() => startManualMove(0.35, 1)}
              onPointerUp={stopManualMove}
              onPointerLeave={stopManualMove}
              onPointerCancel={stopManualMove}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] shadow-[0_2.5px_0px_#2A211B] transition cursor-pointer select-none touch-none ${
                keys.left
                  ? 'bg-[#E05A36] text-white translate-y-[2px] shadow-none'
                  : 'bg-[#FFFDF8] text-[#2A211B] hover:bg-[#F3ECE0] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              <ArrowLeft className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              aria-label="Mover para trás"
              onPointerDown={() => startManualMove(-1, 0)}
              onPointerUp={stopManualMove}
              onPointerLeave={stopManualMove}
              onPointerCancel={stopManualMove}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] shadow-[0_2.5px_0px_#2A211B] transition cursor-pointer select-none touch-none ${
                keys.backward
                  ? 'bg-[#E05A36] text-white translate-y-[2px] shadow-none'
                  : 'bg-[#FFFDF8] text-[#2A211B] hover:bg-[#F3ECE0] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              <ArrowDown className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              aria-label="Girar para a direita"
              onPointerDown={() => startManualMove(0.35, -1)}
              onPointerUp={stopManualMove}
              onPointerLeave={stopManualMove}
              onPointerCancel={stopManualMove}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] shadow-[0_2.5px_0px_#2A211B] transition cursor-pointer select-none touch-none ${
                keys.right
                  ? 'bg-[#E05A36] text-white translate-y-[2px] shadow-none'
                  : 'bg-[#FFFDF8] text-[#2A211B] hover:bg-[#F3ECE0] active:translate-y-[2px] active:shadow-none'
              }`}
            >
              <ArrowRight className="h-4.5 w-4.5 stroke-[2.5]" />
            </button>
          </div>
          <span className="text-[10px] font-mono font-bold text-[#6E5D4F]">
            Use WASD ou Setas no teclado
          </span>
        </div>
      </div>

      {/* Seleção rápida de cômodos e regiões da residência */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor="region-select"
            className="block text-xs font-black uppercase tracking-wider text-[#2A211B]"
          >
            Cômodos e Regiões
          </label>
          <span className="font-mono text-[10px] font-bold text-[#8C6D4F]">
            {regions.length} ÁREAS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2" id="region-select">
          {regions.map((region) => {
            const active = selectedRegionId === region.id;
            const RegionIcon = getRegionIcon(region.id);
            return (
              <button
                key={region.id}
                type="button"
                onClick={() =>
                  dispatchCommand('CLEAN_REGION', { regionId: region.id })
                }
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-left text-xs font-bold transition cursor-pointer border-2 ${active
                    ? 'border-[#2A211B] bg-[#E05A36] text-white shadow-[2px_2px_0px_#2A211B] translate-y-0.5'
                    : 'border-[#2A211B]/25 bg-[#F5ECE0] text-[#54463B] shadow-[2px_2px_0px_#2A211B]/15 hover:border-[#2A211B] hover:text-[#2A211B] hover:bg-[#EBDDCB]'
                  }`}
              >
                <RegionIcon
                  className={`h-3.5 w-3.5 shrink-0 stroke-[2.2] ${active ? 'text-white' : 'text-[#8C6D4F]'
                    }`}
                  aria-hidden="true"
                />
                <span className="truncate">{region.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

