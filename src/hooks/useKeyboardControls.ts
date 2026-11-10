import { useEffect, useState } from 'react';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';

export type DirectionKey = 'forward' | 'backward' | 'left' | 'right';

/**
 * Normaliza eventos de teclado capturando tanto `e.code` quanto `e.key` (case-insensitive),
 * garantindo compatibilidade total com teclados ABNT2, QWERTY, AZERTY, Dvorak e navegadores variados.
 */
export function normalizeDirectionKey(e: KeyboardEvent): DirectionKey | null {
  const code = e.code;
  const key = e.key ? e.key.toLowerCase() : '';

  if (
    code === 'KeyW' ||
    key === 'w' ||
    code === 'ArrowUp' ||
    key === 'arrowup' ||
    key === 'up'
  ) {
    return 'forward';
  }
  if (
    code === 'KeyS' ||
    key === 's' ||
    code === 'ArrowDown' ||
    key === 'arrowdown' ||
    key === 'down'
  ) {
    return 'backward';
  }
  if (
    code === 'KeyA' ||
    key === 'a' ||
    code === 'ArrowLeft' ||
    key === 'arrowleft' ||
    key === 'left'
  ) {
    return 'left';
  }
  if (
    code === 'KeyD' ||
    key === 'd' ||
    code === 'ArrowRight' ||
    key === 'arrowright' ||
    key === 'right'
  ) {
    return 'right';
  }
  return null;
}

/**
 * Hook global de escuta de teclado para controle manual direto do AspiToy (WASD e Setas direcionais).
 * - Desacoplado do Canvas Three.js, ativo a partir do carregamento inicial da aplicação.
 * - Impede rolagem acidental da página pelo navegador com `e.preventDefault()`.
 * - Sincroniza em tempo real com `manualControlBridge` para movimentação a 60 FPS no `useFrame`.
 */
export function useKeyboardControls() {
  const [activeDirections, setActiveDirections] = useState<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
  });

  useEffect(() => {
    const pressed = new Set<DirectionKey>();

    const updateBridge = () => {
      const forward =
        (pressed.has('forward') ? 1 : 0) - (pressed.has('backward') ? 1 : 0);
      const turn =
        (pressed.has('left') ? 1 : 0) - (pressed.has('right') ? 1 : 0);

      manualControlBridge.forward = forward;
      manualControlBridge.turn = turn;
      manualControlBridge.active = forward !== 0 || turn !== 0;

      setActiveDirections({
        forward: pressed.has('forward'),
        backward: pressed.has('backward'),
        left: pressed.has('left'),
        right: pressed.has('right'),
      });

      if (manualControlBridge.active) {
        const currentRobot = useRobotStore.getState();
        if (currentRobot.targetPosition) {
          currentRobot.setTargetPosition(null);
        }
        // Ativa modo manual imediatamente a partir de qualquer estado inativo/acoplado/pausado
        if (
          currentRobot.state !== 'CLEANING' &&
          currentRobot.state !== 'EXPLORING' &&
          currentRobot.state !== 'AVOIDING'
        ) {
          currentRobot.setOperationalState(
            'CLEANING',
            'Controle manual direto (WASD / Setas) ativado'
          );
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const dir = normalizeDirectionKey(e);
      if (!dir) return;

      // Evita rolagem da janela pelas setas direcionais
      e.preventDefault();

      if (!pressed.has(dir)) {
        pressed.add(dir);
        updateBridge();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const dir = normalizeDirectionKey(e);
      if (dir && pressed.delete(dir)) {
        updateBridge();
      }
    };

    const handleBlur = () => {
      pressed.clear();
      updateBridge();
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return activeDirections;
}

