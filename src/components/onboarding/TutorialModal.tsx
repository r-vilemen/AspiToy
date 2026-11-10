import { useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BatteryCharging,
  Cat,
  Check,
  Compass,
  Gamepad2,
  X,
} from 'lucide-react';
import { useOnboardingStore } from '@/store/onboardingStore';

interface TutorialStepData {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  icon: typeof Compass;
  iconBg: string;
  iconColor: string;
}

const TUTORIAL_STEPS: TutorialStepData[] = [
  {
    badge: 'Passo 1 de 4',
    title: 'Explore a Sala de Estar 3D',
    subtitle: 'Navegação em escala de brinquedo inspirada em clássicos do PS2',
    description:
      'Você tem controle total da visão! Arraste com o botão esquerdo do mouse para girar a câmera orbital ao redor da sala, use a roda do scroll para zoom in/out e alterne os ângulos no topo da tela.',
    highlights: [
      'Clique em qualquer ponto livre do piso para mover o robô até lá.',
      'Alterne entre "Acompanhar", "Visão geral" e "Personagem" no menu superior.',
    ],
    icon: Compass,
    iconBg: 'bg-[#14B8A6]/15',
    iconColor: 'text-[#0F766E]',
  },
  {
    badge: 'Passo 2 de 4',
    title: 'Pilotagem Manual e Limpeza',
    subtitle: 'Controle total pelo teclado ou autonomia inteligente',
    description:
      'Pilote o robô com agilidade pelo teclado! Pressione W, A, S, D ou as setas direcionais. Ao soltar as teclas, o robô para de imediato sem ativar a limpeza automática.',
    highlights: [
      'Teclas W / S: acelerar e dar ré.',
      'Teclas A / D: girar para a esquerda e direita.',
      'Botão "Iniciar limpeza": ativa o algoritmo de cobertura e desvio autônomo.',
    ],
    icon: Gamepad2,
    iconBg: 'bg-[#E05A36]/15',
    iconColor: 'text-[#C2410C]',
  },
  {
    badge: 'Passo 3 de 4',
    title: 'Base de Carregamento 3D',
    subtitle: 'Doca interativa integrada no canto do quarto',
    description:
      'No canto sudoeste da sala fica a doca de energia do AspiToy. Ela possui anel luminoso de acoplamento e feedback interativo em tempo real.',
    highlights: [
      'Clique diretamente sobre a base 3D para chamar o robô para recarregar.',
      'Ou acione o botão "Retornar à base" no painel de controle.',
      'O robô sobe a rampa física e recarrega sua bateria automaticamente.',
    ],
    icon: BatteryCharging,
    iconBg: 'bg-[#10B981]/15',
    iconColor: 'text-[#047857]',
  },
  {
    badge: 'Passo 4 de 4',
    title: 'Gato Autônomo e Brinquedos',
    subtitle: 'Um cenário vivo com física e comportamentos autênticos',
    description:
      'A sala está cheia de vida! O gato laranja explora o ambiente, salta para cima do sofá e mesas de centro, espreguiça-se, toma banho de gato e tira sonecas.',
    highlights: [
      'O gato sobe e circula pelos móveis com saltos parabólicos em 3D.',
      'Empurre brinquedos e a bola de brinquedo pelo chão usando o para-choque.',
      'O robô desvia suavemente do gato quando ele está caminhando no piso.',
    ],
    icon: Cat,
    iconBg: 'bg-[#F59E0B]/15',
    iconColor: 'text-[#B45309]',
  },
];

export function TutorialModal() {
  const showTutorial = useOnboardingStore((s) => s.showTutorial);
  const tutorialStep = useOnboardingStore((s) => s.tutorialStep);
  const totalSteps = useOnboardingStore((s) => s.totalSteps);
  const closeTutorial = useOnboardingStore((s) => s.closeTutorial);
  const nextTutorialStep = useOnboardingStore((s) => s.nextTutorialStep);
  const prevTutorialStep = useOnboardingStore((s) => s.prevTutorialStep);
  const setTutorialStep = useOnboardingStore((s) => s.setTutorialStep);

  const current = TUTORIAL_STEPS[tutorialStep] ?? TUTORIAL_STEPS[0];
  const Icon = current.icon;
  const isLast = tutorialStep === totalSteps - 1;

  // Fechar com ESC ou avançar com Enter
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutorial do AspiToy"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2A211B]/65 backdrop-blur-sm animate-fade-in select-none"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-[#8C6D4F]/25 bg-[#FBF7F0] p-6 sm:p-8 shadow-2xl space-y-6 text-[#2A211B] animate-scale-in">
        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="rounded-full bg-[#E05A36]/15 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-[#C2410C]">
              {current.badge}
            </span>
            <span className="text-xs text-[#8C6D4F] font-mono">
              Tutorial Rápido
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

        {/* Visual e Conteúdo Principal do Passo */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${current.iconBg} ${current.iconColor} shadow-inner`}
            >
              <Icon className="h-7 w-7" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#2A211B]">
                {current.title}
              </h2>
              <p className="text-xs font-medium text-[#8C6D4F]">
                {current.subtitle}
              </p>
            </div>
          </div>

          <p className="text-sm text-[#54463B] leading-relaxed">
            {current.description}
          </p>

          {/* Destaques práticos */}
          <div className="rounded-2xl border border-[#8C6D4F]/15 bg-[#EFE6D6]/60 p-3.5 space-y-2">
            {current.highlights.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#3D3126]">
                <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#E05A36] text-white">
                  <Check className="h-2.5 w-2.5" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Indicador de Passos Interativo (Bolinhas) */}
        <div className="flex items-center justify-center gap-2 pt-2">
          {TUTORIAL_STEPS.map((_, idx) => (
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
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition cursor-pointer ${
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E05A36] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#C2410C] active:scale-95 transition cursor-pointer"
            >
              <span>{isLast ? 'Começar a Brincar!' : 'Próximo'}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
