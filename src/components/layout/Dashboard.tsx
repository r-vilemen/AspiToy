import { Bell, X } from 'lucide-react';
import { Scene } from '@/world/Scene';
import { Header } from './Header';
import { StatusCard } from '@/components/ui/StatusCard';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { IntroAnimation } from '@/components/onboarding/IntroAnimation';
import { InGameTour } from '@/components/onboarding/InGameTour';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useCommandStore } from '@/store/commandStore';
import { useOperationClock } from '@/hooks/useRobotState';

export function Dashboard() {
  useOperationClock();
  const showIntro = useOnboardingStore((s) => s.showIntro);
  const notifications = useCommandStore((s) => s.notifications);
  const dismissNotification = useCommandStore((s) => s.dismissNotification);

  const latestNotification = notifications[0];

  return (
    <div className="relative h-dvh w-screen overflow-hidden select-none bg-[#EFE7DA]">
      {/* Apresentação Inicial Animada na Primeira Visita */}
      {showIntro && <IntroAnimation />}

      {/* Tutorial em Jogo com Spotlight Circular e Mãozinha Apontando */}
      <InGameTour />

      {/* Protagonista: Cena 3D em tela cheia */}
      <main className="absolute inset-0" aria-label="Ambiente 3D da Sala de Estar">
        <Scene />
      </main>

      {/* Camada HUD Flutuante */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between">
        <Header />

        <div className="flex flex-1 flex-col justify-end gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          {/* Notificação de Evento no Estilo Alerta de Jogo */}
          <div className="pointer-events-auto max-w-sm sm:max-w-md">
            {latestNotification && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-3 rounded-2xl border-2.5 border-[#2A211B] bg-[#FFFDF8] p-3 sm:p-3.5 shadow-[4px_4px_0px_#2A211B] animate-bounce-in"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#2A211B] bg-[#FFEDD5] text-[#C2410C] shadow-[2px_2px_0px_#2A211B]">
                  <Bell
                    className="h-4 w-4 stroke-[2.2] fill-[#FDBA74]"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-block rounded-md border border-[#2A211B] bg-[#FEF08A] px-1.5 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#854D0E] shadow-[1px_1px_0px_#2A211B]">
                        ALERTA
                      </span>
                      <p className="font-display font-black text-xs text-[#2A211B] truncate">
                        {latestNotification.title}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] font-bold tabular-nums text-[#6E5D4F] rounded border border-[#2A211B]/20 bg-[#F5ECE0] px-1.5 py-0.5 shrink-0">
                      {latestNotification.timestamp}
                    </span>
                  </div>
                  <p className="mt-1 font-semibold text-xs text-[#4B3B2F] leading-snug">
                    {latestNotification.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(latestNotification.id)}
                  aria-label="Fechar notificação"
                  className="rounded-lg border-1.5 border-[#2A211B] bg-[#F5ECE0] p-1 text-[#2A211B] shadow-[1px_1px_0px_#2A211B] hover:bg-[#E8DAC7] active:shadow-none active:translate-y-0.5 cursor-pointer transition shrink-0"
                >
                  <X className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Painel Lateral Tátil do Console do Agente */}
          <aside
            aria-label="Painel de controle do AspiToy"
            className="pointer-events-auto w-full sm:w-[340px] rounded-3xl border-2.5 border-[#2A211B] bg-[#FFFDF8]/96 p-4 sm:p-5 shadow-[5px_5px_0px_#2A211B] backdrop-blur-md space-y-4 max-h-[78dvh] overflow-y-auto"
          >
            <StatusCard />
            <hr className="border-t-2 border-[#2A211B]/15" />
            <ControlPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}

