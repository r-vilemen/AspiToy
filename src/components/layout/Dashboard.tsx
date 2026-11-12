import { useState, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  Eye,
  Home,
  Pause,
  Play,
  Scan,
  SlidersHorizontal,
  Video,
  X,
} from 'lucide-react';
import { Scene } from '@/world/Scene';
import { Header } from './Header';
import { StatusCard } from '@/components/ui/StatusCard';
import { ControlPanel } from '@/components/ui/ControlPanel';
import { VirtualJoystick } from '@/components/ui/VirtualJoystick';
import { IntroAnimation } from '@/components/onboarding/IntroAnimation';
import { InGameTour } from '@/components/onboarding/InGameTour';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useCommandStore, type CameraPreset } from '@/store/commandStore';
import { useRobotStore } from '@/store/robotStore';
import { useOperationClock } from '@/hooks/useRobotState';

export function Dashboard() {
  useOperationClock();
  const showIntro = useOnboardingStore((s) => s.showIntro);
  const showTutorial = useOnboardingStore((s) => s.showTutorial);
  const notifications = useCommandStore((s) => s.notifications);
  const dismissNotification = useCommandStore((s) => s.dismissNotification);
  const dispatchCommand = useCommandStore((s) => s.dispatchCommand);
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const setCameraPreset = useCommandStore((s) => s.setCameraPreset);
  const robotState = useRobotStore((s) => s.state);
  const battery = useRobotStore((s) => s.battery);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Quando o tutorial abre, abre o painel mobile para destacar os botões
  useEffect(() => {
    if (showTutorial) {
      setIsMobileDrawerOpen(true);
    }
  }, [showTutorial]);

  const cycleCamera = () => {
    const presets: CameraPreset[] = ['follow', 'overview', 'closeup'];
    const currentIndex = presets.indexOf(cameraPreset);
    const nextPreset = presets[(currentIndex + 1) % presets.length];
    setCameraPreset(nextPreset);
  };

  const isRunning =
    robotState === 'CLEANING' ||
    robotState === 'EXPLORING' ||
    robotState === 'AVOIDING' ||
    robotState === 'RETURNING';
  const isPaused = robotState === 'PAUSED';

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

        {/* Notificação Flutuante (estilo toast de jogo, compacta no topo em mobile e desktop) */}
        {latestNotification && (
          <div className="pointer-events-auto px-2.5 sm:px-6 pt-1 max-w-sm sm:max-w-md w-full">
            <div
              role="status"
              aria-live="polite"
              className="flex items-start gap-2.5 rounded-2xl border-2 sm:border-2.5 border-[#2A211B] bg-[#FFFDF8] p-2.5 sm:p-3.5 shadow-[3px_3px_0px_#2A211B] sm:shadow-[4px_4px_0px_#2A211B] animate-bounce-in"
            >
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border-1.5 sm:border-2 border-[#2A211B] bg-[#FFEDD5] text-[#C2410C] shadow-[1.5px_1.5px_0px_#2A211B] sm:shadow-[2px_2px_0px_#2A211B]">
                <Bell
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.2] fill-[#FDBA74]"
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className="flex items-center justify-between gap-1.5">
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
          </div>
        )}

        {/* CONTAINER INFERIOR: HUD DE CONTROLE MOBILE (ANALÓGICO PS2 + AÇÕES) & ASIDE DESKTOP */}
        <div className="flex flex-1 flex-col justify-end p-2.5 pb-8 sm:pb-6 sm:gap-3 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          
          {/* CONTROLE MOBILE FLUTUANTE ESTILO GAMEPAD PS2 (SMARTPHONE) */}
          <div className="pointer-events-auto sm:hidden w-full flex items-end justify-between gap-2">
            {/* Polegar Esquerdo: Analógico Virtual PS2 */}
            <div className="flex flex-col items-center gap-1">
              <VirtualJoystick
                size={116}
                knobSize={52}
                maxRadius={38}
                deadzone={5}
                className="shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
              />
              <span className="rounded-md border border-[#2A211B]/30 bg-[#2A211B]/80 px-1.5 py-0.5 font-mono text-[8px] font-black uppercase tracking-wider text-[#FBF7F0] shadow-xs backdrop-blur-xs">
                Analógico PS2
              </span>
            </div>

            {/* Centro: Pílula Compacta de Status & Bateria */}
            <div className="flex flex-col items-center gap-1.5 mb-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#FFFDF8]/90 border-2 border-[#2A211B] shadow-[2px_2px_0px_#2A211B] backdrop-blur-md">
                <span
                  className={`h-2.5 w-2.5 rounded-full border border-[#2A211B] ${
                    isRunning
                      ? 'bg-[#10B981] animate-pulse'
                      : isPaused
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#6B7280]'
                  }`}
                />
                <span className="font-mono text-[11px] font-black tabular-nums text-[#2A211B]">
                  {Math.round(battery)}%
                </span>
                <span className="text-[10px] text-[#6E5D4F] font-black uppercase truncate max-w-[65px]">
                  {robotState}
                </span>
              </div>
            </div>

            {/* Polegar Direito: Painel de Ações Rápidas do Jogo */}
            <div className="flex flex-col items-end gap-2">
              {/* Botões Auxiliares Superiores (Dock, Câmera, Menu Drawer) */}
              <div className="flex items-center gap-1.5">
                {/* Botão de Retornar à Base */}
                <button
                  type="button"
                  title="Retornar à Base"
                  aria-label="Retornar à base de recarga"
                  onClick={() => dispatchCommand('RETURN_TO_BASE')}
                  disabled={robotState === 'RETURNING' || robotState === 'RECHARGING'}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] bg-[#FFFDF8] text-[#0F766E] shadow-[2px_2px_0px_#2A211B] active:translate-y-0.5 active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  <Home className="h-4 w-4 stroke-[2.4]" />
                </button>

                {/* Botão de Alternar Câmera no Celular */}
                <button
                  type="button"
                  title={`Câmera atual: ${cameraPreset} (Clique para alternar)`}
                  aria-label="Alternar modo de câmera"
                  onClick={cycleCamera}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] bg-[#FFFDF8] text-[#2A211B] shadow-[2px_2px_0px_#2A211B] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
                >
                  {cameraPreset === 'follow' ? (
                    <Video className="h-4 w-4 stroke-[2.4] text-[#E05A36]" />
                  ) : cameraPreset === 'overview' ? (
                    <Scan className="h-4 w-4 stroke-[2.4] text-[#0F766E]" />
                  ) : (
                    <Eye className="h-4 w-4 stroke-[2.4] text-[#F59E0B]" />
                  )}
                </button>

                {/* Botão de Abrir Drawer de Detalhes / Opções */}
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(true)}
                  aria-label="Abrir painel de controles e direção manual"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#2A211B] bg-[#FBBF24] hover:bg-[#F59E0B] text-[#2A211B] shadow-[2px_2px_0px_#2A211B] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4 stroke-[2.4]" />
                </button>
              </div>

              {/* Botão de Ação Primária Principal (Grande e Tátil para o Polegar Direito) */}
              <div>
                {!isRunning && !isPaused ? (
                  <button
                    type="button"
                    onClick={() => dispatchCommand('START_CLEANING')}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#F2724D] to-[#E05A36] px-4 py-3 text-xs font-black uppercase text-white shadow-[0_3px_0px_#9A3412] active:translate-y-0.5 active:shadow-none transition cursor-pointer min-w-[124px]"
                  >
                    <Play className="h-4 w-4 fill-current stroke-[2]" />
                    <span>Limpar</span>
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={() => dispatchCommand('RESUME_CLEANING')}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#14B8A6] to-[#0F766E] px-4 py-3 text-xs font-black uppercase text-white shadow-[0_3px_0px_#042F2E] active:translate-y-0.5 active:shadow-none transition cursor-pointer min-w-[124px]"
                  >
                    <Play className="h-4 w-4 fill-current stroke-[2]" />
                    <span>Retomar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => dispatchCommand('PAUSE_CLEANING')}
                    className="flex items-center justify-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#3F322A] to-[#2A211B] px-4 py-3 text-xs font-black uppercase text-white shadow-[0_3px_0px_#000000] active:translate-y-0.5 active:shadow-none transition cursor-pointer min-w-[124px]"
                  >
                    <Pause className="h-4 w-4 stroke-[2.5]" />
                    <span>Pausar</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* PAINEL LATERAL DESKTOP (Inalterado para PC conforme solicitado) */}
          <aside
            aria-label="Painel de controle do AspiToy"
            className="pointer-events-auto hidden sm:block sm:w-[340px] rounded-3xl border-2.5 border-[#2A211B] bg-[#FFFDF8]/96 p-4 sm:p-5 shadow-[5px_5px_0px_#2A211B] backdrop-blur-md space-y-4 max-h-[78dvh] overflow-y-auto"
          >
            <StatusCard />
            <hr className="border-t-2 border-[#2A211B]/15" />
            <ControlPanel />
          </aside>
        </div>
      </div>

      {/* DRAWER / BOTTOM SHEET EXPANSÍVEL PARA DISPOSITIVOS MÓVEIS */}
      {isMobileDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Painel de controle expandido do AspiToy"
          className="fixed inset-0 z-40 sm:hidden bg-[#2A211B]/40 backdrop-blur-xs flex flex-col justify-end pointer-events-auto"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="w-full rounded-t-3xl border-t-3 border-x-3 border-[#2A211B] bg-[#FFFDF8] p-4 shadow-[0_-6px_0px_#2A211B] max-h-[82dvh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Puxador tátil do Drawer e botão Fechar */}
            <div className="flex items-center justify-between pb-2 border-b border-[#2A211B]/15">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1.5 rounded-full bg-[#2A211B]/30" />
                <span className="font-display font-black text-sm text-[#2A211B]">
                  Controles do AspiToy
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                aria-label="Recolher painel"
                className="flex items-center gap-1 rounded-xl border-1.5 border-[#2A211B] bg-[#F5ECE0] px-2.5 py-1 text-xs font-black uppercase text-[#2A211B] shadow-[1.5px_1.5px_0px_#2A211B] active:translate-y-0.5 active:shadow-none transition cursor-pointer"
              >
                <ChevronDown className="h-4 w-4 stroke-[3]" />
                <span>Fechar</span>
              </button>
            </div>

            {/* Conteúdo completo dos cartões */}
            <StatusCard />
            <hr className="border-t-2 border-[#2A211B]/15" />
            <ControlPanel />
          </div>
        </div>
      )}

      {/* Rodapé fixo e compacto com créditos do desenvolvedor */}
      <footer className="pointer-events-auto fixed bottom-1.5 sm:bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
        <div className="flex items-center gap-1 rounded-full border border-[#2A211B]/25 bg-[#FFFDF8]/90 px-3 py-0.5 text-[10px] sm:text-[11px] font-bold text-[#6E5D4F] shadow-[1.5px_1.5px_0px_#2A211B] backdrop-blur-xs transition hover:bg-[#FFFDF8]">
          <span>Projeto desenvolvido por</span>
          <a
            href="https://www.linkedin.com/in/rodrigo-vilemen/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Perfil no LinkedIn de Rodrigo Vilemen (RVACODE)"
            className="font-black text-[#E05A36] hover:text-[#C2410C] hover:underline underline-offset-2 transition"
          >
            RVACODE
          </a>
        </div>
      </footer>
    </div>
  );
}
