import { Bell, X } from 'lucide-react';
import { Scene } from '@/world/Scene';
import { Header } from './Header';
import { StatusCard } from '@/components/ui/StatusCard';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { IntroAnimation } from '@/components/onboarding/IntroAnimation';
import { TutorialModal } from '@/components/onboarding/TutorialModal';
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

      {/* Tutorial Rápido Interativo */}
      <TutorialModal />

      {/* Protagonista: Cena 3D em tela cheia */}
      <main className="absolute inset-0" aria-label="Ambiente 3D da Sala de Estar">
        <Scene />
      </main>

      {/* Camada HUD Flutuante */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col justify-between">
        <Header />

        <div className="flex flex-1 flex-col justify-end gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          {/* Notificação contextual discreta no canto inferior esquerdo */}
          <div className="pointer-events-auto max-w-sm">
            {latestNotification && (
              <div
                role="status"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-2xl border border-[#8C6D4F]/20 bg-[#FBF7F0]/90 px-3.5 py-2.5 shadow-sm backdrop-blur-md"
              >
                <Bell
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#E05A36]"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-[#2A211B]">
                      {latestNotification.title}
                    </p>
                    <span className="font-mono text-[10px] tabular-nums text-[#6E5D4F]">
                      {latestNotification.timestamp}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[#54463B]">
                    {latestNotification.message}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissNotification(latestNotification.id)}
                  aria-label="Fechar notificação"
                  className="rounded-lg p-1 text-[#6E5D4F] hover:bg-[#EFE6D6] hover:text-[#2A211B] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Painel Lateral Tátil do Agente */}
          <aside
            aria-label="Painel de controle do AspiToy"
            className="pointer-events-auto w-full sm:w-[340px] rounded-2xl border border-[#8C6D4F]/22 bg-[#FBF7F0]/90 p-4 shadow-lg backdrop-blur-md space-y-4 max-h-[75dvh] overflow-y-auto"
          >
            <StatusCard />
            <hr className="border-[#8C6D4F]/15" />
            <ControlPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}

