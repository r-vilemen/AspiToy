import { useEffect, useState } from 'react';
import { Sparkles, FastForward } from 'lucide-react';
import { useOnboardingStore } from '@/store/onboardingStore';

const BOOT_STAGES = [
  'Calibrando sensores infravermelhos ToF...',
  'Carregando física dos brinquedos e móveis...',
  'Acordando o gato laranja...',
  'AspiToy pronto para brincar!',
];

export function IntroAnimation() {
  const finishIntro = useOnboardingStore((s) => s.finishIntro);
  const [progress, setProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [eyeState, setEyeState] = useState<'closed' | 'open' | 'blink'>('closed');

  // Controle de progresso e estágios da animação
  useEffect(() => {
    // Sequência de acordar os olhos do robô
    const eyeTimer1 = setTimeout(() => setEyeState('open'), 600);
    const eyeTimer2 = setTimeout(() => setEyeState('blink'), 1400);
    const eyeTimer3 = setTimeout(() => setEyeState('open'), 1600);

    const startTime = Date.now();
    const duration = 2800; // 2.8s

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(rawProgress);

      const stage = Math.min(
        BOOT_STAGES.length - 1,
        Math.floor((rawProgress / 100) * BOOT_STAGES.length)
      );
      setStageIndex(stage);

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(() => finishIntro(), 250);
      }
    }, 40);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finishIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(eyeTimer1);
      clearTimeout(eyeTimer2);
      clearTimeout(eyeTimer3);
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finishIntro]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação inicial do AspiToy"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#EFE7DA] text-[#2A211B] select-none transition-opacity duration-500"
      style={{
        backgroundImage:
          'radial-gradient(circle at center, #FFFDF8 0%, #F5ECE0 60%, #E8DCB8 100%)',
      }}
    >
      {/* Botão Superior para pular direto ao tutorial */}
      <div className="w-full max-w-2xl flex justify-end">
        <button
          type="button"
          onClick={finishIntro}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#8C6D4F]/25 bg-[#FBF7F0]/85 px-4 py-2 text-xs font-semibold text-[#6E5D4F] hover:bg-[#2A211B] hover:text-[#FFFDF8] hover:border-[#2A211B] transition cursor-pointer shadow-xs backdrop-blur-sm"
        >
          <span>Pular introdução</span>
          <FastForward className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* Núcleo Central: AspiToy Ilustrado e Animação de Inicialização */}
      <div className="flex flex-col items-center justify-center text-center max-w-md my-auto space-y-6">
        {/* Personagem AspiToy com efeito de flutuação e olhos animados */}
        <div className="relative flex items-center justify-center">
          {/* Ondas circulares de radar / sonar se expandindo */}
          <div className="absolute h-48 w-48 rounded-full border border-[#E05A36]/25 animate-ping opacity-40 pointer-events-none" />
          <div className="absolute h-64 w-64 rounded-full border border-[#14B8A6]/20 animate-pulse pointer-events-none" />

          {/* Sombra de chão */}
          <div className="absolute -bottom-4 h-6 w-36 rounded-full bg-[#2A211B]/15 blur-xs" />

          {/* Ilustração SVG do Robô AspiToy */}
          <div className="relative h-32 w-32 drop-shadow-xl transform transition-transform hover:scale-105 duration-300">
            <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
              <defs>
                <radialGradient id="introShellGrad" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="60%" stopColor="#FFFDF7" />
                  <stop offset="100%" stopColor="#EADDCB" />
                </radialGradient>
                <linearGradient id="introCoralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F2724D" />
                  <stop offset="100%" stopColor="#C2410C" />
                </linearGradient>
              </defs>

              {/* Bumper Coral */}
              <circle cx="32" cy="33" r="27" fill="url(#introCoralGrad)" />
              <circle cx="32" cy="33" r="25" fill="#9A3412" />

              {/* Corpo Creme */}
              <circle cx="32" cy="32" r="24" fill="url(#introShellGrad)" />
              <ellipse cx="30" cy="18" rx="14" ry="6" fill="#FFFFFF" opacity="0.6" />

              {/* Bumper Frontal */}
              <path
                d="M14 36 C19 46, 45 46, 50 36"
                stroke="#E05A36"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Visor */}
              <rect x="18" y="24" width="28" height="15" rx="7.5" fill="#181512" stroke="#3D342C" strokeWidth="1" />
              <path d="M21 26 L26 26 L22 37 L19 37 Z" fill="#FFFFFF" opacity="0.2" />

              {/* Olhos Robóticos com transição de acordar */}
              {eyeState === 'closed' || eyeState === 'blink' ? (
                <g stroke="#34D399" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="23" y1="31.5" x2="29" y2="31.5" />
                  <line x1="35" y1="31.5" x2="41" y2="31.5" />
                </g>
              ) : (
                <g>
                  <circle cx="26" cy="31.5" r="3.2" fill="#34D399" />
                  <circle cx="38" cy="31.5" r="3.2" fill="#34D399" />
                  <circle cx="27.2" cy="30.3" r="1.1" fill="#FFFFFF" />
                  <circle cx="39.2" cy="30.3" r="1.1" fill="#FFFFFF" />
                  <path
                    d="M28 35.8 Q32 38.5 36 35.8"
                    stroke="#34D399"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                </g>
              )}

              {/* Antena com Estrela Dourada Twinkle */}
              <rect x="30.5" y="3.5" width="3" height="6.5" rx="1.5" fill="#78350F" />
              <path
                d="M32 1.5 L33.6 5.2 L37.5 5.6 L34.6 8.2 L35.5 12 L32 10.1 L28.5 12 L29.4 8.2 L26.5 5.6 L30.4 5.2 Z"
                fill="#FBBF24"
                stroke="#B45309"
                strokeWidth="0.8"
              />
              <circle cx="31.4" cy="5.2" r="1" fill="#FEF08A" />
            </svg>
          </div>
        </div>

        {/* Título e Identidade */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E05A36]/15 px-3 py-1 text-xs font-semibold tracking-wider uppercase text-[#C2410C]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Toy-Tech Autonomous Agent</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-[#2A211B]">
            AspiToy
          </h1>

          <p className="text-sm text-[#6E5D4F] max-w-xs mx-auto">
            Agente robótico inteligente explorando o mundo em escala de brinquedo.
          </p>
        </div>

        {/* Barra de Progresso de Inicialização */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#E6D7C3] shadow-inner">
            <div
              className="h-full rounded-full bg-linear-to-r from-[#E05A36] to-[#F59E0B] transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-[#6E5D4F] font-mono">
            <span className="truncate pr-2">{BOOT_STAGES[stageIndex]}</span>
            <span className="tabular-nums font-semibold text-[#2A211B]">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      {/* Dica de Rodapé */}
      <footer className="text-center text-xs text-[#8C6D4F]">
        Pressione <kbd className="rounded border border-[#8C6D4F]/30 bg-[#FFFDF8] px-1.5 py-0.5 font-mono text-[11px] text-[#2A211B] shadow-xs">ESC</kbd> ou clique para pular
      </footer>
    </div>
  );
}
