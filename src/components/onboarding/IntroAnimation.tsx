import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useOnboardingStore } from '@/store/onboardingStore';

export function IntroAnimation() {
  const finishIntro = useOnboardingStore((s) => s.finishIntro);
  const [animStage, setAnimStage] = useState<number>(0);
  const [eyeState, setEyeState] = useState<'closed' | 'open' | 'blink'>('closed');

  useEffect(() => {
    // Linha do tempo da animação da Logo e Nome do Projeto
    const t1 = setTimeout(() => setAnimStage(1), 80); // Logo entra com bounce
    const t2 = setTimeout(() => setEyeState('open'), 450); // Olhos abrem
    const t3 = setTimeout(() => setAnimStage(2), 700); // Nome "AspiToy" entra
    const t4 = setTimeout(() => setEyeState('blink'), 1200); // Piscada amigável
    const t5 = setTimeout(() => setEyeState('open'), 1350);
    const t6 = setTimeout(() => setAnimStage(3), 1300); // Subtítulo e badge revelam
    const t7 = setTimeout(() => finishIntro(), 2800); // Conclusão e entrada no jogo

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        finishIntro();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(t7);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [finishIntro]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Apresentação da marca AspiToy"
      onClick={finishIntro}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 bg-[#EFE7DA] text-[#2A211B] select-none transition-opacity duration-700 cursor-pointer"
      style={{
        backgroundImage:
          'radial-gradient(circle at center, #FFFDF8 0%, #F5ECE0 60%, #E8DCB8 100%)',
      }}
    >
      {/* Botão Superior para Pular / Entrar direto */}
      <div className="w-full max-w-2xl flex justify-end">
        <button
          type="button"
          aria-label="Pular introdução"
          onClick={(e) => {
            e.stopPropagation();
            finishIntro();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#8C6D4F]/25 bg-[#FBF7F0]/85 px-4 py-2 text-xs font-semibold text-[#6E5D4F] hover:bg-[#2A211B] hover:text-[#FFFDF8] hover:border-[#2A211B] transition cursor-pointer shadow-xs backdrop-blur-sm"
        >
          <span>Pular introdução</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {/* NÚCLEO CENTRAL: ANIMAÇÃO DA LOGO E DO NOME DO PROJETO */}
      <div className="flex flex-col items-center justify-center text-center max-w-lg my-auto space-y-6">
        {/* 1. EMBLEMA DA LOGO DO ASPITOY */}
        <div className="relative flex items-center justify-center">
          {/* Anéis de brilho e ondas luminosas */}
          <div
            className={`absolute h-48 w-48 rounded-full border border-[#E05A36]/30 transition-all duration-1000 ${
              animStage >= 1 ? 'scale-100 opacity-60 animate-ping' : 'scale-50 opacity-0'
            } pointer-events-none`}
          />
          <div
            className={`absolute h-60 w-60 rounded-full border border-[#14B8A6]/25 transition-all duration-1000 ${
              animStage >= 2 ? 'scale-100 opacity-40 animate-pulse' : 'scale-50 opacity-0'
            } pointer-events-none`}
          />

          {/* Sombra de contato do emblema */}
          <div
            className={`absolute -bottom-3 h-5 w-32 rounded-full bg-[#2A211B]/18 blur-xs transition-all duration-700 ${
              animStage >= 1 ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
            }`}
          />

          {/* O Emblema / Rosto da Logo */}
          <div
            className={`relative h-36 w-36 drop-shadow-2xl transition-all duration-700 ease-out transform ${
              animStage >= 1 ? 'scale-100 translate-y-0 opacity-100' : 'scale-40 -translate-y-8 opacity-0'
            }`}
          >
            <svg viewBox="0 0 64 64" className="h-full w-full" fill="none">
              <defs>
                <linearGradient id="introChassisGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFFFFF" />
                  <stop offset="70%" stopColor="#FFFDF7" />
                  <stop offset="100%" stopColor="#E8DAC7" />
                </linearGradient>
                <linearGradient id="introCoralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#F2724D" />
                  <stop offset="100%" stopColor="#C2410C" />
                </linearGradient>
                <linearGradient id="introVisorGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#231E1A" />
                  <stop offset="100%" stopColor="#120F0D" />
                </linearGradient>
                <filter id="introGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#34D399" floodOpacity="0.9" />
                </filter>
              </defs>

              {/* Bumper Externo Coral da Cabeça */}
              <rect x="4" y="8" width="56" height="50" rx="22" fill="url(#introCoralGrad)" />
              <rect x="5.5" y="9.5" width="53" height="47" rx="20.5" fill="#9A3412" />

              {/* Cabeça / Chassi Creme */}
              <rect x="6" y="9" width="52" height="46" rx="20" fill="url(#introChassisGrad)" />
              <path d="M16 11 C24 9.5, 40 9.5, 48 11 C42 15, 22 15, 16 11 Z" fill="#FFFFFF" opacity="0.65" />

              {/* Moldura do visor facial */}
              <rect x="9" y="14" width="46" height="36" rx="16" fill="#2E2620" />

              {/* Tela Curva OLED do Visor */}
              <rect
                x="10.5"
                y="15.5"
                width="43"
                height="33"
                rx="14.5"
                fill="url(#introVisorGrad)"
                stroke="#453B32"
                strokeWidth="0.8"
              />
              <path d="M14 17 L21 17 L15 47 L12 47 Z" fill="#FFFFFF" opacity="0.12" />

              {/* Olhos e Sorriso da Logo */}
              {eyeState === 'closed' ? (
                <g stroke="#34D399" strokeWidth="2" strokeLinecap="round" opacity="0.7">
                  <line x1="20" y1="29.5" x2="26" y2="29.5" />
                  <line x1="38" y1="29.5" x2="44" y2="29.5" />
                </g>
              ) : eyeState === 'blink' ? (
                <g stroke="#34D399" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="19" y1="29.5" x2="27" y2="29.5" />
                  <line x1="37" y1="29.5" x2="45" y2="29.5" />
                </g>
              ) : (
                <g filter="url(#introGlow)">
                  <rect x="17.5" y="22.5" width="11" height="13.5" rx="4.5" fill="#34D399" />
                  <rect x="35.5" y="22.5" width="11" height="13.5" rx="4.5" fill="#34D399" />
                  <path
                    d="M26.5 40.5 Q32 45 37.5 40.5"
                    stroke="#34D399"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="24.5" cy="25.5" r="1.8" fill="#FFFFFF" />
                  <circle cx="42.5" cy="25.5" r="1.8" fill="#FFFFFF" />
                </g>
              )}

              {/* Antena no Topo com Estrela Dourada */}
              <rect x="30.5" y="2.5" width="3" height="6.5" rx="1.5" fill="#78350F" />
              <path
                d="M32 0.5 L33.6 4.2 L37.5 4.6 L34.6 7.2 L35.5 11 L32 9.1 L28.5 11 L29.4 7.2 L26.5 4.6 L30.4 4.2 Z"
                fill="#FBBF24"
                stroke="#B45309"
                strokeWidth="0.8"
              />
              <circle cx="31.4" cy="4.2" r="1" fill="#FEF08A" />
            </svg>
          </div>
        </div>

        {/* 2. REVELAÇÃO DO NOME DO PROJETO "AspiToy" */}
        <div className="space-y-3">
          <div
            className={`transition-all duration-700 ease-out transform ${
              animStage >= 2 ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-6 opacity-0 scale-95'
            }`}
          >
            <h1
              aria-label="AspiToy"
              className="font-display text-5xl sm:text-6xl font-black tracking-tight text-[#2A211B] drop-shadow-xs"
            >
              Aspi<span className="text-[#E05A36]">Toy</span>
            </h1>
          </div>

          {/* 3. TAGLINE E BADGE DE IDENTIDADE DO PROJETO */}
          <div
            className={`space-y-2 transition-all duration-700 ease-out delay-150 transform ${
              animStage >= 3 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E05A36]/15 px-3.5 py-1 text-xs font-semibold tracking-wider uppercase text-[#C2410C]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Agente Inteligente de Limpeza 3D</span>
            </div>

            <p className="text-sm font-medium text-[#6E5D4F] max-w-sm mx-auto">
              Exploração robótica autônoma em escala de brinquedo.
            </p>
          </div>
        </div>
      </div>

      {/* DICA DE RODAPÉ / CALL TO ACTION */}
      <footer className="text-center text-xs text-[#8C6D4F]">
        <span>Clique em qualquer lugar ou pressione <kbd className="rounded border border-[#8C6D4F]/30 bg-[#FFFDF8] px-1.5 py-0.5 font-mono text-[11px] text-[#2A211B] shadow-xs">ENTER</kbd> para entrar</span>
      </footer>
    </div>
  );
}
