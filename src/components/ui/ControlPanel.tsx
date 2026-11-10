import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Home,
  Pause,
  Play,
  RotateCcw,
} from 'lucide-react';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';
import { CommandInput } from './CommandInput';

export function ControlPanel() {
  const state = useRobotStore((s) => s.state);
  const regions = useEnvironmentStore((s) => s.regions);
  const selectedRegionId = useEnvironmentStore((s) => s.selectedRegionId);
  const dispatchCommand = useCommandStore((s) => s.dispatchCommand);
  const keys = useKeyboardControls();

  const isRunning =
    state === 'CLEANING' || state === 'EXPLORING' || state === 'AVOIDING';
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
    if (
      currentRobot.state === 'IDLE' ||
      currentRobot.state === 'PAUSED' ||
      currentRobot.state === 'RECHARGING'
    ) {
      currentRobot.setOperationalState(
        'CLEANING',
        'Controle manual direto ativado'
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
        {!isRunning && !isPaused ? (
          <button
            type="button"
            onClick={() => dispatchCommand('START_CLEANING')}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#E05A36] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#C94B29] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E05A36] cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Iniciar limpeza
          </button>
        ) : isPaused ? (
          <button
            type="button"
            onClick={() => dispatchCommand('RESUME_CLEANING')}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#115E59] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F766E] cursor-pointer"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            Retomar limpeza
          </button>
        ) : (
          <button
            type="button"
            onClick={() => dispatchCommand('PAUSE_CLEANING')}
            className="col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2A211B] px-4 py-2.5 text-sm font-semibold text-[#FBF7F0] shadow-sm transition hover:bg-[#3F322A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2A211B] cursor-pointer"
          >
            <Pause className="h-4 w-4" aria-hidden="true" />
            Pausar operação
          </button>
        )}

        <button
          type="button"
          disabled={isReturning || state === 'RECHARGING'}
          onClick={() => dispatchCommand('RETURN_TO_BASE')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#8C6D4F]/25 bg-[#F3ECE0] px-3 py-2 text-xs font-semibold text-[#2A211B] transition hover:bg-[#E7DDD0] disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          <Home className="h-3.5 w-3.5 text-[#0F766E]" aria-hidden="true" />
          Retornar à base
        </button>

        <button
          type="button"
          onClick={() => dispatchCommand('RESET_SIMULATION')}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#8C6D4F]/25 bg-[#F3ECE0] px-3 py-2 text-xs font-semibold text-[#6E5D4F] transition hover:bg-[#E7DDD0] hover:text-[#2A211B] cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reiniciar cena
        </button>
      </div>

      {/* Controle direcional manual estilo Gamepad / WASD */}
      <div className="rounded-xl border border-[#8C6D4F]/18 bg-[#F3ECE0]/60 p-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-[#2A211B]">
            Direção manual (WASD / Setas)
          </span>
          <span className="text-[10px] font-medium text-[#6E5D4F]">
            {keys.forward || keys.backward || keys.left || keys.right ? (
              <span className="text-[#E05A36] font-semibold">● Ativo</span>
            ) : (
              'WASD ou Setas'
            )}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5 max-w-[180px] mx-auto">
          <div />
          <button
            type="button"
            aria-label="Mover para frente"
            onPointerDown={() => startManualMove(1, 0)}
            onPointerUp={stopManualMove}
            onPointerLeave={stopManualMove}
            onPointerCancel={stopManualMove}
            className={`flex h-8 items-center justify-center rounded-lg border border-[#8C6D4F]/25 shadow-2xs transition cursor-pointer ${
              keys.forward
                ? 'bg-[#E05A36] text-white ring-2 ring-[#E05A36] shadow-sm'
                : 'bg-[#FBF7F0] text-[#2A211B] active:bg-[#E05A36] active:text-white'
            }`}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <div />
          <button
            type="button"
            aria-label="Girar para a esquerda"
            onPointerDown={() => startManualMove(0.35, 1)}
            onPointerUp={stopManualMove}
            onPointerLeave={stopManualMove}
            onPointerCancel={stopManualMove}
            className={`flex h-8 items-center justify-center rounded-lg border border-[#8C6D4F]/25 shadow-2xs transition cursor-pointer ${
              keys.left
                ? 'bg-[#E05A36] text-white ring-2 ring-[#E05A36] shadow-sm'
                : 'bg-[#FBF7F0] text-[#2A211B] active:bg-[#E05A36] active:text-white'
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Mover para trás"
            onPointerDown={() => startManualMove(-1, 0)}
            onPointerUp={stopManualMove}
            onPointerLeave={stopManualMove}
            onPointerCancel={stopManualMove}
            className={`flex h-8 items-center justify-center rounded-lg border border-[#8C6D4F]/25 shadow-2xs transition cursor-pointer ${
              keys.backward
                ? 'bg-[#E05A36] text-white ring-2 ring-[#E05A36] shadow-sm'
                : 'bg-[#FBF7F0] text-[#2A211B] active:bg-[#E05A36] active:text-white'
            }`}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Girar para a direita"
            onPointerDown={() => startManualMove(0.35, -1)}
            onPointerUp={stopManualMove}
            onPointerLeave={stopManualMove}
            onPointerCancel={stopManualMove}
            className={`flex h-8 items-center justify-center rounded-lg border border-[#8C6D4F]/25 shadow-2xs transition cursor-pointer ${
              keys.right
                ? 'bg-[#E05A36] text-white ring-2 ring-[#E05A36] shadow-sm'
                : 'bg-[#FBF7F0] text-[#2A211B] active:bg-[#E05A36] active:text-white'
            }`}
          >
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Seleção rápida de região */}
      <div className="space-y-1.5 pt-1">
        <label
          htmlFor="region-select"
          className="block text-xs font-medium text-[#54463B]"
        >
          Priorizar região da sala
        </label>
        <div className="grid grid-cols-2 gap-1.5" id="region-select">
          {regions.map((region) => {
            const active = selectedRegionId === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() =>
                  dispatchCommand('CLEAN_REGION', { regionId: region.id })
                }
                className={`rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition cursor-pointer border ${
                  active
                    ? 'border-[#E05A36]/50 bg-[#E05A36]/12 text-[#9E3518]'
                    : 'border-[#8C6D4F]/15 bg-[#F3ECE0]/70 text-[#54463B] hover:bg-[#EAE0D0]'
                }`}
              >
                {region.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Entrada contextual de comando em linguagem natural */}
      <div className="pt-1 border-t border-[#8C6D4F]/12">
        <label className="block text-[11px] font-medium text-[#54463B]">
          Instrução rápida por texto
        </label>
        <CommandInput />
      </div>
    </section>
  );
}

