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
  targetMobileId?: string;
  badge: string;
  title: string;
  mobileTitle?: string;
  description: string;
  mobileDescription?: string;
  tip: string;
  mobileTip?: string;
  icon: typeof Play;
  iconBg: string;
  iconColor: string;
  radiusPadding: number;
  mobileRadiusPadding?: number;
}

const TOUR_STEPS: TourStepConfig[] = [
  {
    targetId: 'tour-cleaning-button',
    targetMobileId: 'tour-mobile-cleaning',
    badge: 'Passo 1 de 4',
    title: 'Iniciar / Pausar Limpeza',
    mobileTitle: 'Iniciar / Pausar Limpeza',
    description:
      'Clique no botão principal para iniciar a varredura autônoma da sala. O AspiToy navegará pelo chão limpando manchas de poeira e desviando dos móveis.',
    mobileDescription:
      'Toque no botão principal para iniciar a varredura autônoma da sala. O AspiToy navegará pelo chão limpando manchas e desviando dos obstáculos.',
    tip: 'Pode pausar a qualquer instante ou retomar a tarefa.',
    mobileTip: 'Toque para pausar a qualquer instante ou retomar a limpeza.',
    icon: Play,
    iconBg: 'bg-[#FFEDD5]',
    iconColor: 'text-[#C2410C]',
    radiusPadding: 22,
    mobileRadiusPadding: 14,
  },
  {
    targetId: 'tour-manual-controls',
    targetMobileId: 'tour-mobile-joystick',
    badge: 'Passo 2 de 4',
    title: 'Pilotagem Manual (WASD / Setas)',
    mobileTitle: 'Analógico Virtual PS2',
    description:
      'Pilote você mesmo pelo teclado usando as teclas W, A, S, D ou as Setas direcionais. Ao soltar as teclas, o robô para de imediato sem ativar a limpeza automática.',
    mobileDescription:
      'Pilote o robô em 360° com o polegar esquerdo arrastando o analógico virtual! Controle livre e ágil para navegar por toda a casa.',
    tip: 'W para avançar, S para ré, A/D para girar.',
    mobileTip: 'Solte o analógico para parar o robô na hora.',
    icon: Gamepad2,
    iconBg: 'bg-[#CCFBF1]',
    iconColor: 'text-[#0F766E]',
    radiusPadding: 20,
    mobileRadiusPadding: 12,
  },
  {
    targetId: 'tour-dock-button',
    targetMobileId: 'tour-mobile-dock',
    badge: 'Passo 3 de 4',
    title: 'Base de Carregamento 3D',
    mobileTitle: 'Retornar à Base',
    description:
      'Mande o robô voltar para a doca de energia. Você pode clicar neste botão ou clicar diretamente sobre a base 3D localizada no canto sudoeste da sala!',
    mobileDescription:
      'Toque no ícone da casinha para mandar o robô voltar direto à base de recarga (ou toque na própria doca 3D no chão do quarto)!',
    tip: 'O robô sobe a rampa e recarrega sua bateria na hora.',
    mobileTip: 'O robô recalcula a rota e recarrega a bateria na doca.',
    icon: BatteryCharging,
    iconBg: 'bg-[#D1FAE5]',
    iconColor: 'text-[#047857]',
    radiusPadding: 24,
    mobileRadiusPadding: 12,
  },
  {
    targetId: 'tour-camera-modes',
    badge: 'Passo 4 de 4',
    title: 'Câmeras e Exploração 3D',
    mobileTitle: 'Câmeras e Ângulos 3D',
    description:
      'Alterne entre os ângulos de câmera ("Acompanhar", "Visão geral" e "Personagem"). Arraste a tela com o mouse para girar o ângulo e use o scroll para aproximar o zoom!',
    mobileDescription:
      'Alterne entre os ângulos de câmera no topo da tela ("Acompanhar", "Visão geral" e "Personagem"). Arraste o dedo na tela 3D para orbitar livremente!',
    tip: 'Clique no chão para mover o robô e empurre os brinquedos da sala.',
    mobileTip: 'Toque no chão para mover o robô e empurre os brinquedos.',
    icon: Compass,
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#B45309]',
    radiusPadding: 18,
    mobileRadiusPadding: 14,
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

  const [isMobile, setIsMobile] = useState(false);
  const [spotlight, setSpotlight] = useState<SpotlightCoords>({
    cx: -999,
    cy: -999,
    r: 80,
    rect: null,
  });

  // Detecção contínua de modo mobile / viewport compacto
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        typeof window !== 'undefined' &&
          (window.innerWidth < 768 || window.innerHeight <= 550)
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const current = TOUR_STEPS[tutorialStep] ?? TOUR_STEPS[0];
  const Icon = current.icon;
  const isLast = tutorialStep === totalSteps - 1;

  // Medição e atualização das coordenadas do elemento destacado
  const updateSpotlight = useCallback(() => {
    if (!showTutorial) return;

    const checkIsMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.innerHeight <= 550);

    let el: HTMLElement | null = null;

    // Em mobile, busca primeiramente o elemento do HUD da página do jogo
    if (checkIsMobile && current.targetMobileId) {
      const mobileEl = document.getElementById(current.targetMobileId);
      if (
        mobileEl &&
        (mobileEl.offsetParent !== null ||
          mobileEl.getBoundingClientRect().width > 0)
      ) {
        el = mobileEl;
      }
    }

    if (!el) {
      el = document.getElementById(current.targetId);
    }

    if (!el && current.targetMobileId) {
      el = document.getElementById(current.targetMobileId);
    }

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

    // Garante que o elemento está visível no scroll do painel lateral (no Desktop)
    if (!checkIsMobile && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const padding = checkIsMobile
      ? (current.mobileRadiusPadding ?? current.radiusPadding)
      : current.radiusPadding;
    const r = Math.max(rect.width, rect.height) / 2 + padding;

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
  const isTargetInBottomHalf =
    spotlight.cy > (typeof window !== 'undefined' ? window.innerHeight * 0.5 : 350);
  const isTargetOnTop =
    spotlight.cy < (typeof window !== 'undefined' ? window.innerHeight * 0.35 : 200);

  let cardPositionClasses = '';
  if (isMobile) {
    // Em mobile, os controles estão no gamepad inferior (ou cabeçalho)
    // Se o alvo está na metade inferior da tela, posiciona o cartão no topo (top-14 sm:top-16)
    // Se o alvo está na metade superior da tela, posiciona o cartão na parte inferior (bottom-4)
    if (isTargetInBottomHalf) {
      cardPositionClasses = 'left-1/2 -translate-x-1/2 top-14 sm:top-16';
    } else {
      cardPositionClasses = 'left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6';
    }
  } else {
    // Em desktop, posiciona em relação ao painel lateral direito ou topo
    if (isTargetOnRight) {
      cardPositionClasses =
        'left-1/2 -translate-x-1/2 sm:left-auto sm:right-[380px] sm:translate-x-0 top-1/2 -translate-y-1/2';
    } else if (isTargetOnTop) {
      cardPositionClasses = 'left-1/2 -translate-x-1/2 top-[80px] sm:top-[120px]';
    } else {
      cardPositionClasses = 'left-1/2 -translate-x-1/2 bottom-4 sm:bottom-8';
    }
  }

  const currentTitle =
    isMobile && current.mobileTitle ? current.mobileTitle : current.title;
  const currentDescription =
    isMobile && current.mobileDescription
      ? current.mobileDescription
      : current.description;
  const currentTip =
    isMobile && current.mobileTip ? current.mobileTip : current.tip;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial interativo em jogo"
      className="fixed inset-0 z-50 select-none overflow-hidden"
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

      {/* CARTÃO EXPLICATIVO FLUTUANTE POSICIONADO PRÓXIMO AO ELEMENTO */}
      <div
        className={`absolute z-50 p-2 sm:p-4 transition-all duration-300 ease-out w-full max-w-[calc(100vw-20px)] sm:max-w-md ${cardPositionClasses}`}
      >
        <div className="rounded-3xl border-3 border-[#2A211B] bg-[#FFFDF8] p-4 sm:p-6 shadow-[5px_5px_0px_#2A211B] text-[#2A211B] space-y-3 sm:space-y-4 max-h-[76dvh] overflow-y-auto animate-scale-in">
          {/* Cabeçalho no Estilo Cartucho / Missão de Jogo */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-xl border-2 border-[#2A211B] bg-[#FFEDD5] px-3 py-1 font-mono text-xs font-black uppercase tracking-wider text-[#C2410C] shadow-[2px_2px_0px_#2A211B]">
                {current.badge}
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl border-2 border-[#2A211B] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[#92400E] shadow-[2px_2px_0px_#2A211B]">
                🎮 GUIA DO JOGO
              </span>
            </div>

            <button
              type="button"
              onClick={closeTutorial}
              aria-label="Fechar tutorial"
              className="h-8 w-8 rounded-full border-2 border-[#2A211B] bg-[#FEE2E2] hover:bg-[#FCA5A5] text-[#991B1B] shadow-[2px_2px_0px_#2A211B] active:shadow-none active:translate-y-0.5 flex items-center justify-center cursor-pointer transition"
            >
              <X className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
            </button>
          </div>

          {/* Conteúdo com Emblema e Tipografia Arcade */}
          <div className="space-y-3 sm:space-y-3.5">
            <div className="flex items-start gap-3 sm:gap-3.5">
              <div
                className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl border-2.5 border-[#2A211B] ${current.iconBg} ${current.iconColor} shadow-[3px_3px_0px_#2A211B]`}
              >
                <Icon className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.2]" aria-hidden="true" />
              </div>

              <div>
                <h3 className="font-display text-lg sm:text-xl font-black tracking-tight text-[#2A211B]">
                  {currentTitle}
                </h3>
                <p className="mt-1 text-xs sm:text-sm font-medium text-[#4B3B2F] leading-relaxed">
                  {currentDescription}
                </p>
              </div>
            </div>

            {/* Dica no Estilo Segredo / Manual de Brinquedo */}
            <div className="rounded-2xl border-2 border-dashed border-[#B45309] bg-[#FEF3C7] px-3.5 py-2 sm:py-2.5 text-xs text-[#78350F] shadow-[2px_2px_0px_rgba(180,83,9,0.25)]">
              <span className="font-black text-[#92400E] uppercase tracking-wider">💡 Dica do Jogo: </span>
              <span className="font-medium text-[#78350F]">{currentTip}</span>
            </div>
          </div>

          {/* Indicador de Passos no Estilo Moedas / Fichas de Fliperama */}
          <div className="flex items-center justify-center gap-2 pt-0.5 sm:pt-1">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTutorialStep(idx)}
                aria-label={`Ir para passo ${idx + 1}`}
                className={`h-3.5 rounded-full border-2 border-[#2A211B] transition-all cursor-pointer ${
                  tutorialStep === idx
                    ? 'w-9 bg-[#E05A36] shadow-[1px_1px_0px_#2A211B]'
                    : 'w-3.5 bg-[#E5D7C5] hover:bg-[#D5C2AA]'
                }`}
              />
            ))}
          </div>

          {/* Rodapé com Botões Táteis 3D de Jogo */}
          <div className="flex items-center justify-between pt-2.5 sm:pt-3 border-t-2 border-[#2A211B]/15">
            <button
              type="button"
              onClick={prevTutorialStep}
              disabled={tutorialStep === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl border-2 border-[#2A211B] bg-[#F5ECE0] px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-black uppercase tracking-wider text-[#2A211B] shadow-[0_3px_0px_#2A211B] hover:shadow-[0_1px_0px_#2A211B] hover:translate-y-[2px] active:shadow-none active:translate-y-[3px] transition cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0`}
            >
              <ArrowLeft className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <div className="flex items-center gap-2">
              {!isLast && (
                <button
                  type="button"
                  onClick={closeTutorial}
                  className="rounded-xl border-2 border-transparent hover:border-[#2A211B]/30 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-black uppercase tracking-wider text-[#785E46] hover:text-[#2A211B] transition cursor-pointer"
                >
                  Pular
                </button>
              )}

              <button
                type="button"
                onClick={nextTutorialStep}
                className="inline-flex items-center gap-2 rounded-2xl border-2.5 border-[#2A211B] bg-linear-to-b from-[#FF6B4A] to-[#E05A36] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white shadow-[0_4px_0px_#9A3412] hover:shadow-[0_2px_0px_#9A3412] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] transition cursor-pointer"
              >
                <span>{isLast ? 'Começar a Brincar!' : 'Próximo'}</span>
                <ArrowRight className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
