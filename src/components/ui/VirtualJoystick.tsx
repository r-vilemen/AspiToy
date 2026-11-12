import { useState, useRef, useCallback, useEffect } from 'react';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';

export interface VirtualJoystickProps {
  /** Diâmetro total da base do joystick em pixels (padrão: 124) */
  size?: number;
  /** Diâmetro do analógico / manete em pixels (padrão: 56) */
  knobSize?: number;
  /** Raio máximo de deslocamento em pixels (padrão: 40) */
  maxRadius?: number;
  /** Zona morta mínima para evitar drift/jitter (padrão: 5) */
  deadzone?: number;
  /** Classes CSS adicionais para o container externo */
  className?: string;
  /** Se deve exibir rótulo textual e guias de direção */
  showGuides?: boolean;
  /** Callback opcional a cada atualização de movimento */
  onMove?: (forward: number, turn: number, active: boolean) => void;
}

/**
 * Analógico Virtual Estilo PlayStation 2 (DualShock 2 Thumbstick):
 * - Base circular rebaixada com moldura chanfrada e chanfros de alinhamento cardeais (Frente, Ré, Esquerda, Direita).
 * - Manete texturizada com anel concêntrico de tração emborrachada e concavidade central para o polegar.
 * - Suporte a toque contínuo em 360° com cálculo polar de direção e intensidade (deslocamento analógico proporcional).
 * - Mapeamento direto e sem atraso na `manualControlBridge` de 60 FPS (evita re-renderizações desnecessárias).
 * - Suporte a Pointer Events com setPointerCapture para não perder o arraste mesmo se o dedo sair da base.
 */
export function VirtualJoystick({
  size = 124,
  knobSize = 56,
  maxRadius = 40,
  deadzone = 5,
  className = '',
  showGuides = true,
  onMove,
}: VirtualJoystickProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const applyMovement = useCallback(
    (dx: number, dy: number) => {
      const dist = Math.hypot(dx, dy);

      if (dist < deadzone) {
        setKnobPos({ x: 0, y: 0 });
        manualControlBridge.forward = 0;
        manualControlBridge.turn = 0;
        manualControlBridge.active = false;
        onMove?.(0, 0, false);
        return;
      }

      // Limita o deslocamento visual do analógico ao raio máximo
      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);
      const visualX = Math.cos(angle) * clampedDist;
      const visualY = Math.sin(angle) * clampedDist;

      setKnobPos({ x: visualX, y: visualY });

      // Cálculo analógico normalizado (0.0 a 1.0) após a zona morta
      const normalizedMagnitude =
        (Math.min(dist, maxRadius) - deadzone) / (maxRadius - deadzone);

      // No sistema de coordenadas da tela:
      // - Arrasto para cima (dy < 0): forward positivo (+1)
      // - Arrasto para baixo (dy > 0): forward negativo (-1 / ré)
      // - Arrasto para esquerda (dx < 0): turn positivo (+1 / gira anti-horário)
      // - Arrasto para direita (dx > 0): turn negativo (-1 / gira horário)
      const forward = Number((-Math.sin(angle) * normalizedMagnitude).toFixed(3));
      const turn = Number((-Math.cos(angle) * normalizedMagnitude).toFixed(3));

      manualControlBridge.forward = forward;
      manualControlBridge.turn = turn;
      manualControlBridge.active = true;

      // Limpa navegação por clique e desacopla da base se necessário
      const currentRobot = useRobotStore.getState();
      if (currentRobot.targetPosition) {
        currentRobot.setTargetPosition(null);
      }
      if (currentRobot.state === 'RECHARGING') {
        currentRobot.setOperationalState('IDLE', 'Desacoplado da base manualmente');
      }

      onMove?.(forward, turn, true);
    },
    [deadzone, maxRadius, onMove]
  );

  const resetStick = useCallback(() => {
    setKnobPos({ x: 0, y: 0 });
    setIsActive(false);
    activePointerIdRef.current = null;
    manualControlBridge.forward = 0;
    manualControlBridge.turn = 0;
    manualControlBridge.active = false;
    onMove?.(0, 0, false);
  }, [onMove]);

  const getCoords = (e: React.PointerEvent<HTMLDivElement>) => {
    const clientX = typeof e.clientX === 'number' ? e.clientX : (e.nativeEvent as any)?.clientX ?? 0;
    const clientY = typeof e.clientY === 'number' ? e.clientY : (e.nativeEvent as any)?.clientY ?? 0;
    return { clientX, clientY };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    // Bloqueia múltiplos toques concorrentes no mesmo analógico
    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;

    if (typeof e.currentTarget.setPointerCapture === 'function') {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback silencioso para navegadores ou ambientes de teste sem suporte
      }
    }

    setIsActive(true);

    if (containerRef.current) {
      const { clientX, clientY } = getCoords(e);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width > 0 ? rect.left + rect.width / 2 : clientX;
      const centerY = rect.height > 0 ? rect.top + rect.height / 2 : clientY;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      applyMovement(dx, dy);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isActive || activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    if (containerRef.current) {
      const { clientX, clientY } = getCoords(e);
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width > 0 ? rect.left + rect.width / 2 : clientX;
      const centerY = rect.height > 0 ? rect.top + rect.height / 2 : clientY;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      applyMovement(dx, dy);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    if (typeof e.currentTarget.releasePointerCapture === 'function') {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback silencioso
      }
    }

    resetStick();
  };

  // Garante que o analógico se resete caso o componente desmonte durante o toque
  useEffect(() => {
    return () => {
      manualControlBridge.forward = 0;
      manualControlBridge.turn = 0;
      manualControlBridge.active = false;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Analógico Virtual Estilo PS2"
      data-testid="virtual-joystick"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        touchAction: 'none',
      }}
      className={`relative select-none rounded-full touch-none cursor-grab active:cursor-grabbing ${className}`}
    >
      {/* Moldura Externa Chanfrada (Soquete do Controle PS2) */}
      <div className="absolute inset-0 rounded-full border-3 border-[#2A211B] bg-linear-to-b from-[#251E1A] to-[#120E0C] shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_0_3px_6px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Anel de Relevo Interno com Textura Metálica/Plástica */}
        <div className="absolute inset-1.5 rounded-full border border-[#3E322A]/60 bg-linear-to-br from-[#1C1613] to-[#0A0807] shadow-inner" />

        {/* Linhas / Guias de Eixo Cardeal */}
        {showGuides && (
          <>
            {/* Eixo Vertical */}
            <div className="absolute top-1 bottom-1 left-1/2 -translate-x-1/2 w-[1px] bg-[#4A3B31]/30 pointer-events-none" />
            {/* Eixo Horizontal */}
            <div className="absolute left-1 right-1 top-1/2 -translate-y-1/2 h-[1px] bg-[#4A3B31]/30 pointer-events-none" />

            {/* Marcadores Cardeais de Direção (Frente / Ré / Esquerda / Direita) */}
            <span
              className={`absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black uppercase tracking-tighter ${
                manualControlBridge.forward > 0.1 ? 'text-[#E05A36]' : 'text-[#8C7565]'
              }`}
            >
              ▲
            </span>
            <span
              className={`absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black uppercase tracking-tighter ${
                manualControlBridge.forward < -0.1 ? 'text-[#E05A36]' : 'text-[#8C7565]'
              }`}
            >
              ▼
            </span>
            <span
              className={`absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-black uppercase tracking-tighter ${
                manualControlBridge.turn > 0.1 ? 'text-[#E05A36]' : 'text-[#8C7565]'
              }`}
            >
              ◄
            </span>
            <span
              className={`absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono font-black uppercase tracking-tighter ${
                manualControlBridge.turn < -0.1 ? 'text-[#E05A36]' : 'text-[#8C7565]'
              }`}
            >
              ►
            </span>
          </>
        )}
      </div>

      {/* Brilho / Halo Ativo ao Mover */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-full pointer-events-none transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle at ${50 + (knobPos.x / maxRadius) * 25}% ${
              50 + (knobPos.y / maxRadius) * 25
            }%, rgba(224, 90, 54, 0.28) 0%, transparent 65%)`,
          }}
        />
      )}

      {/* Manete / Thumbstick Central Estilo DualShock 2 */}
      <div
        className="absolute top-1/2 left-1/2 rounded-full pointer-events-none will-change-transform"
        style={{
          width: `${knobSize}px`,
          height: `${knobSize}px`,
          transform: `translate3d(calc(-50% + ${knobPos.x}px), calc(-50% + ${knobPos.y}px), 0)`,
          transition: isActive ? 'none' : 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        {/* Sombra Dinâmica Projetada pelo Analógico na Cavidade */}
        <div
          className="absolute inset-0 rounded-full bg-black/60 filter blur-[3px]"
          style={{
            transform: `translate3d(${knobPos.x * 0.15}px, ${4 + knobPos.y * 0.15}px, 0)`,
          }}
        />

        {/* Corpo Emborrachado do Thumbstick (Textura e Borda de Tração PS2) */}
        <div
          className={`relative w-full h-full rounded-full border-2 border-[#191411] bg-linear-to-b from-[#3E342D] via-[#2A221C] to-[#16120F] shadow-[0_4px_6px_rgba(0,0,0,0.6),inset_0_1.5px_2px_rgba(255,255,255,0.2)] flex items-center justify-center transition-transform duration-100 ${
            isActive ? 'scale-[0.96]' : 'scale-100'
          }`}
        >
          {/* Anel de Ranhuras Emborrachadas Externas (Grip Antiderrapante PS2) */}
          <div className="absolute inset-1 rounded-full border border-dashed border-[#57483E]/50 bg-radial from-transparent to-[#1D1714]/80" />

          {/* Concavidade Central Anatômica para o Polegar (Dish Rebaixado) */}
          <div className="relative w-7 h-7 rounded-full border border-[#191411] bg-linear-to-b from-[#1C1613] to-[#2B231D] shadow-[inset_0_2.5px_4px_rgba(0,0,0,0.7)] flex items-center justify-center">
            {/* Ponto Central Relevado (Micro-textura tátil do DualShock) */}
            <div
              className={`w-2 h-2 rounded-full border border-[#15100D] transition-colors duration-150 ${
                isActive
                  ? 'bg-linear-to-b from-[#F2724D] to-[#E05A36] shadow-[0_0_6px_#E05A36]'
                  : 'bg-linear-to-b from-[#4A3D34] to-[#251E19]'
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
