import { useEffect, useState } from 'react';
import { manualControlBridge, robotMotionBridge, useRobotStore } from '@/store/robotStore';
import { soundManager } from '@/services/soundManager';

export type DirectionKey = 'forward' | 'backward' | 'left' | 'right';

/**
 * Normaliza eventos de teclado capturando tanto `e.code` quanto `e.key` (case-insensitive),
 * garantindo compatibilidade total com teclados ABNT2, QWERTY, AZERTY, Dvorak, teclado numérico e navegadores variados.
 */
export function normalizeDirectionKey(e: KeyboardEvent): DirectionKey | null {
  const code = e.code;
  const key = e.key ? e.key.toLowerCase() : '';

  if (
    code === 'KeyW' ||
    key === 'w' ||
    key === 'z' || // Suporte nativo ao layout francês AZERTY (Z é a tecla superior)
    code === 'ArrowUp' ||
    key === 'arrowup' ||
    key === 'up' ||
    code === 'Numpad8'
  ) {
    return 'forward';
  }
  if (
    code === 'KeyS' ||
    key === 's' ||
    code === 'ArrowDown' ||
    key === 'arrowdown' ||
    key === 'down' ||
    code === 'Numpad2'
  ) {
    return 'backward';
  }
  if (
    code === 'KeyA' ||
    key === 'a' ||
    key === 'q' || // Suporte nativo ao layout francês AZERTY (Q é a tecla esquerda)
    code === 'ArrowLeft' ||
    key === 'arrowleft' ||
    key === 'left' ||
    code === 'Numpad4'
  ) {
    return 'left';
  }
  if (
    code === 'KeyD' ||
    key === 'd' ||
    code === 'ArrowRight' ||
    key === 'arrowright' ||
    key === 'right' ||
    code === 'Numpad6'
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
// Evita duplicidade de disparos ou alternância indesejada por repetição do SO
let lastCannonToggleTimestamp = 0;
let lastSpaceFireTimestamp = 0;
let lastHelicopterToggleTimestamp = 0;

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
    // Rastreia teclas físicas ativas individualmente por código/key
    const activeKeyMap = new Map<string, DirectionKey>();
    // Pilhas de precedência para evitar travamentos em 0 quando teclas opostas são pressionadas simultaneamente
    let verticalStack: DirectionKey[] = [];
    let horizontalStack: DirectionKey[] = [];

    const updateBridge = () => {
      const activeVertical =
        verticalStack.length > 0 ? verticalStack[verticalStack.length - 1] : null;
      const activeHorizontal =
        horizontalStack.length > 0
          ? horizontalStack[horizontalStack.length - 1]
          : null;

      const forward =
        activeVertical === 'forward' ? 1 : activeVertical === 'backward' ? -1 : 0;
      const turn =
        activeHorizontal === 'left' ? 1 : activeHorizontal === 'right' ? -1 : 0;

      manualControlBridge.forward = forward;
      manualControlBridge.turn = turn;
      manualControlBridge.active = forward !== 0 || turn !== 0;

      const hasForward = Array.from(activeKeyMap.values()).includes('forward');
      const hasBackward = Array.from(activeKeyMap.values()).includes('backward');
      const hasLeft = Array.from(activeKeyMap.values()).includes('left');
      const hasRight = Array.from(activeKeyMap.values()).includes('right');

      setActiveDirections({
        forward: hasForward,
        backward: hasBackward,
        left: hasLeft,
        right: hasRight,
      });

      if (manualControlBridge.active) {
        const currentRobot = useRobotStore.getState();
        if (currentRobot.targetPosition) {
          currentRobot.setTargetPosition(null);
        }
        // Se estiver recarregando na base, desacopla para IDLE sem ativar limpeza autônoma
        if (currentRobot.state === 'RECHARGING') {
          currentRobot.setOperationalState(
            'IDLE',
            'Desacoplado da base manualmente'
          );
        }
      }
    };

    const resetAll = () => {
      activeKeyMap.clear();
      verticalStack = [];
      horizontalStack = [];
      manualControlBridge.forward = 0;
      manualControlBridge.turn = 0;
      manualControlBridge.active = false;
      setActiveDirections({
        forward: false,
        backward: false,
        left: false,
        right: false,
      });
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

      const keyLower = e.key ? e.key.toLowerCase() : '';

      // Atalho rápido de teclado para o Modo Helicóptero: 'H' para ativar/desativar
      if (e.code === 'KeyH' || keyLower === 'h') {
        if (e.repeat) return;
        const now = Date.now();
        if (now - lastHelicopterToggleTimestamp < 220) return;
        lastHelicopterToggleTimestamp = now;

        soundManager.ensureAudioRunning();
        e.preventDefault();
        useRobotStore.getState().toggleHelicopterMode();
        return;
      }

      // Atalho rápido de teclado para o Canhão de Espuma Lateral: 'C' para ativar e desativar o canhão
      if (e.code === 'KeyC' || keyLower === 'c') {
        if (e.repeat) return;
        const now = Date.now();
        if (now - lastCannonToggleTimestamp < 220) return;
        lastCannonToggleTimestamp = now;

        soundManager.ensureAudioRunning();
        e.preventDefault();
        useRobotStore.getState().toggleFoamCannonAim();
        return;
      }

      if (e.code === 'Space') {
        if (e.repeat) return;
        const now = Date.now();
        if (now - lastSpaceFireTimestamp < 120) return;
        lastSpaceFireTimestamp = now;

        soundManager.ensureAudioRunning();
        e.preventDefault();

        const store = useRobotStore.getState();

        // Se o canhão de espuma estiver recolhido, estende e arma o modo de mira imediatamente
        if (!store.isCannonAiming && !robotMotionBridge.isCannonAiming) {
          store.toggleFoamCannonAim(true);
        }

        // Garante que o disparo com a tecla espaço sempre acompanhe com precisão a mira 3D do mouse
        store.fireFoamCannon({
          x: robotMotionBridge.foamTargetX,
          y: robotMotionBridge.foamTargetY,
          z: robotMotionBridge.foamTargetZ,
          nx: robotMotionBridge.foamTargetNormalX,
          ny: robotMotionBridge.foamTargetNormalY,
          nz: robotMotionBridge.foamTargetNormalZ,
        });
        return;
      }

      const dir = normalizeDirectionKey(e);
      if (!dir) return;

      // Desperta o contexto de áudio em navegadores que exigem interação do usuário
      soundManager.ensureAudioRunning();

      // Evita rolagem da janela pelas setas direcionais
      e.preventDefault();

      const keyIdentifier = e.code || e.key;
      const isAlreadyRegistered = activeKeyMap.has(keyIdentifier);
      activeKeyMap.set(keyIdentifier, dir);

      if (dir === 'forward' || dir === 'backward') {
        verticalStack = verticalStack.filter((d) => d !== dir).concat(dir);
      } else if (dir === 'left' || dir === 'right') {
        horizontalStack = horizontalStack.filter((d) => d !== dir).concat(dir);
      }

      if (!isAlreadyRegistered || !manualControlBridge.active) {
        updateBridge();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const keyIdentifier = e.code || e.key;
      if (activeKeyMap.has(keyIdentifier)) {
        activeKeyMap.delete(keyIdentifier);

        const hasForward = Array.from(activeKeyMap.values()).includes('forward');
        const hasBackward = Array.from(activeKeyMap.values()).includes('backward');
        const hasLeft = Array.from(activeKeyMap.values()).includes('left');
        const hasRight = Array.from(activeKeyMap.values()).includes('right');

        if (!hasForward) {
          verticalStack = verticalStack.filter((d) => d !== 'forward');
        }
        if (!hasBackward) {
          verticalStack = verticalStack.filter((d) => d !== 'backward');
        }
        if (!hasLeft) {
          horizontalStack = horizontalStack.filter((d) => d !== 'left');
        }
        if (!hasRight) {
          horizontalStack = horizontalStack.filter((d) => d !== 'right');
        }

        updateBridge();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        resetAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', resetAll);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', resetAll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return activeDirections;
}

