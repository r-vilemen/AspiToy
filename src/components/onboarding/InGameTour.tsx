import { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Compass,
  Gamepad2,
  Play,
  X,
} from 'lucide-react';
import { useOnboardingStore } from '@/store/onboardingStore';

interface TourStepConfig {
  targetId: string;
  badge: string;
  title: string;
  description: string;
  tip: string;
  icon: typeof Play;
  iconBg: string;
  iconColor: string;
  radiusPadding: number;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    targetId: 'tour-cleaning-button',
    badge: 'Passo 1 de 4',
    title: 'Iniciar / Pausar Limpeza',
    description:
      'Clique no botão principal para iniciar a varredura autônoma da sala. O AspiToy navegará pelo chão limpando manchas de poeira e desviando dos móveis.',
    tip: 'Pode pausar a qualquer instante ou retomar a tarefa.',
    icon: Play,
    iconBg: 'bg-[#E05A36]/15',
    iconColor: 'text-[#C2410C]',
    radiusPadding: 22,
  },
  {
    targetId: 'tour-manual-controls',
    badge: 'Passo 2 de 4',
    title: 'Pilotagem Manual (WASD / Setas)',
    description:
      'Pilote você mesmo pelo teclado usando as teclas W, A, S, D ou as Setas direcionais. Ao soltar as teclas, o robô para de imediato sem ativar a limpeza automática.',
    tip: 'W para avançar, S para ré, A/D para girar.',
    icon: Gamepad2,
    iconBg: 'bg-[#0F766E]/15',
    iconColor: 'text-[#0F766E]',
    radiusPadding: 20,
  },
  {
    targetId: 'tour-dock-button',
    badge: 'Passo 3 de 4',
    title: 'Base de Carregamento 3D',
    description:
      'Mande o robô voltar para a doca de energia. Você pode clicar neste botão ou clicar diretamente sobre a base 3D localizada no canto sudoeste da sala!',
    tip: 'O robô sobe a rampa e recarrega sua bateria na hora.',
    icon: BatteryCharging,
    iconBg: 'bg-[#10B981]/15',
    iconColor: 'text-[#047857]',
    radiusPadding: 24,
  },
  {
    targetId: 'tour-camera-modes',
    badge: 'Passo 4 de 4',
    title: 'Câmeras e Exploração 3D',
    description:
      'Alterne entre os ângulos de câmera ("Acompanhar", "Visão geral" e "Personagem"). Arraste a tela com o mouse para girar o ângulo e use o scroll para aproximar o zoom!',
    tip: 'Clique no chão para mover o robô e empurre os brinquedos da sala.',
    icon: Compass,
    iconBg: 'bg-[#F59E0B]/15',
    iconColor: 'text-[#B45309]',
    radiusPadding: 18,
  },
];

interface SpotlightCoords {
  cx: number;
  cy: number;
  r: number;
  rect: DOMRect | null;
}

export function InGameTour() {
  const showTutorial = useOnboardingStore((s) => s.showTutorial);
  const tutorialStep = useOnboardingStore((s) => s.tutorialStep);
  const totalSteps = useOnboardingStore((s) => s.totalSteps);
  const closeTutorial = useOnboardingStore((s) => s.closeTutorial);
  const nextTutorialStep = useOnboardingStore((s) => s.nextTutorialStep);
  const prevTutorialStep = useOnboardingStore((s) => s.prevTutorialStep);
  const setTutorialStep = useOnboardingStore((s) => s.setTutorialStep);

  const [spotlight, setSpotlight] = useState<SpotlightCoords>({
    cx: -999,
    cy: -999,
    r: 80,
    rect: null,
  });

  const current = TOUR_STEPS[tutorialStep] ?? TOUR_STEPS[0];
  const Icon = current.icon;
  const isLast = tutorialStep === totalSteps - 1;

  // Medição e atualização das coordenadas do elemento destacado
  const updateSpotlight = useCallback(() => {
    if (!showTutorial) return;

    const el = document.getElementById(current.targetId);
    if (!el) {
      // Fallback para o centro da tela se o elemento não for encontrado
      setSpotlight({
        cx: window.innerWidth / 2,
        cy: window.innerHeight / 2,
        r: 90,
        rect: null,
      });
      return;
    }

    // Garante que o elemento está visível no scroll do painel lateral
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = Math.max(rect.width, rect.height) / 2 + current.radiusPadding;

    setSpotlight({ cx, cy, r, rect });
  }, [showTutorial, current]);

  useEffect(() => {
    updateSpotlight();

    const handleResizeOrScroll = () => updateSpotlight();
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);

    const timer = setTimeout(updateSpotlight, 120);

    return () => {
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
      clearTimeout(timer);
    };
  }, [updateSpotlight]);

  // Teclado: ESC para fechar, setas e enter para navegar
  useEffect(() => {
    if (!showTutorial) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeTutorial();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        nextTutorialStep();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevTutorialStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTutorial, closeTutorial, nextTutorialStep, prevTutorialStep]);

  if (!showTutorial) return null;

  // Cálculo da posição do cartão explicativo flutuante
  const isTargetOnRight = spotlight.cx > window.innerWidth / 2;
  const isTargetOnTop = spotlight.cy < window.innerHeight / 3;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial interativo em jogo"
      className="fixed inset-0 z-40 select-none overflow-hidden"
    >
      {/* SVG MASK DE RECORTE COM SPOTLIGHT CIRCULAR */}
      <svg
        className="fixed inset-0 h-full w-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="in-game-spotlight-mask">
            {/* Máscara branca cobrindo a tela toda */}
            <rect width="100%" height="100%" fill="white" />
            {/* Buraco circular transparente sobre a parte destacada */}
            <circle
              cx={spotlight.cx}
              cy={spotlight.cy}
              r={spotlight.r}
              fill="black"
              className="transition-all duration-300 ease-out"
            />
          </mask>
        </defs>

        {/* Fundo escuro semitransparente vazado pelo spotlight */}
        <rect
          width="100%"
          height="100%"
          fill="rgba(20, 14, 10, 0.74)"
          mask="url(#in-game-spotlight-mask)"
        />

        {/* Anel de borda luminosa sutil ao redor da parte destacada */}
        <circle
          cx={spotlight.cx}
          cy={spotlight.cy}
          r={spotlight.r}
          stroke="#FBBF24"
          strokeWidth="3.5"
          fill="none"
          opacity="0.9"
          className="transition-all duration-300 ease-out animate-pulse"
        />
      </svg>

      {/* MÃOZINHA APONTANDO ANIMADA (Estilo do vídeo do usuário) */}
      <div
        className="absolute pointer-events-none z-50 transition-all duration-300 ease-out"
        style={{
          left: `${spotlight.cx}px`,
          top: `${spotlight.cy}px`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div className="relative animate-bounce">
          {/* Ícone de mão apontando estilo luva branca com contorno escuro */}
          <svg
            viewBox="0 0 24 24"
            className="h-10 w-10 drop-shadow-lg text-white fill-white stroke-[#1E1A17] stroke-[1.8]"
          >
            <path d="M9 3a1.5 1.5 0 0 1 3 0v6.2l.8-.7a2.1 2.1 0 0 1 3 0 2 2 0 0 1 .4 2.2l-2.4 5.3a4.5 4.5 0 0 1-4.1 2.8H8.5A4.5 4.5 0 0 1 4 14.3v-4.5a1.5 1.5 0 0 1 3 0V11h2V3z" />
          </svg>
        </div>
      </div>

      {/* CARTÃO EXPLICATIVO FLUTUANTE POSICIONADO PRÓXIMO AO ELEMENTO */}
      <div
        className={`absolute z-50 p-4 transition-all duration-300 ease-out ${
          isTargetOnRight
            ? 'left-4 sm:left-auto sm:right-[380px] top-1/2 -translate-y-1/2'
            : isTargetOnTop
            ? 'left-1/2 -translate-x-1/2 top-[120px]'
            : 'left-1/2 -translate-x-1/2 bottom-8'
        } w-full max-w-sm sm:max-w-md`}
      >
        <div className="rounded-3xl border border-[#8C6D4F]/25 bg-[#FBF7F0] p-5 sm:p-6 shadow-2xl text-[#2A211B] space-y-4 animate-scale-in">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="rounded-full bg-[#E05A36]/15 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
                {current.badge}
              </span>
              <span className="text-xs text-[#8C6D4F] font-mono">
                Tutorial em Jogo
              </span>
            </div>

            <button
              type="button"
              onClick={closeTutorial}
              aria-label="Fechar tutorial"
              className="rounded-full p-1.5 text-[#6E5D4F] hover:bg-[#EFE6D6] hover:text-[#2A211B] transition cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="space-y-3">
            <div className="flex items-start gap-3.5">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${current.iconBg} ${current.iconColor} shadow-inner`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div>
                <h3 className="font-display text-lg font-bold text-[#2A211B]">
                  {current.title}
                </h3>
                <p className="mt-1 text-xs text-[#54463B] leading-relaxed">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Dica do passo */}
            <div className="rounded-xl border border-[#8C6D4F]/15 bg-[#EFE6D6]/70 px-3 py-2 text-xs text-[#54463B]">
              <span className="font-semibold text-[#2A211B]">💡 Dica: </span>
              {current.tip}
            </div>
          </div>

          {/* Indicador de Passos (Bolinhas) */}
          <div className="flex items-center justify-center gap-2 pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTutorialStep(idx)}
                aria-label={`Ir para passo ${idx + 1}`}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  tutorialStep === idx
                    ? 'w-8 bg-[#E05A36]'
                    : 'w-2 bg-[#D9CAB7] hover:bg-[#B8A38E]'
                }`}
              />
            ))}
          </div>

          {/* Rodapé com Navegação */}
          <div className="flex items-center justify-between pt-2 border-t border-[#8C6D4F]/15">
            <button
              type="button"
              onClick={prevTutorialStep}
              disabled={tutorialStep === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition cursor-pointer ${
                tutorialStep === 0
                  ? 'opacity-30 cursor-not-allowed text-[#8C6D4F]'
                  : 'text-[#54463B] hover:bg-[#EFE6D6] hover:text-[#2A211B]'
              }`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              {!isLast && (
                <button
                  type="button"
                  onClick={closeTutorial}
                  className="rounded-xl px-3 py-2 text-xs font-medium text-[#8C6D4F] hover:text-[#2A211B] transition cursor-pointer"
                >
                  Pular
                </button>
              )}

              <button
                type="button"
                onClick={nextTutorialStep}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#E05A36] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#C2410C] active:scale-95 transition cursor-pointer"
              >
                <span>{isLast ? 'Começar a Brincar!' : 'Próximo'}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
