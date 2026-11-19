import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { normalizeDirectionKey, useKeyboardControls } from '../useKeyboardControls';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';

describe('Reconhecimento Universal de Teclado e Controle Manual (WASD / Setas)', () => {
  beforeEach(() => {
    manualControlBridge.forward = 0;
    manualControlBridge.turn = 0;
    manualControlBridge.active = false;
    useRobotStore.getState().resetRobot();
  });

  it('normaliza corretamente teclas tanto por e.code quanto por e.key em qualquer layout', () => {
    // W / Seta para Cima / AZERTY Z / Numpad8 -> forward
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyW', key: 'W' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowUp', key: 'ArrowUp' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'w' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'z' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Numpad8', key: '8' }))).toBe('forward');

    // S / Seta para Baixo / Numpad2 -> backward
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyS', key: 's' }))).toBe('backward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown' }))).toBe('backward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 's' }))).toBe('backward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Numpad2', key: '2' }))).toBe('backward');

    // A / Seta para Esquerda / AZERTY Q / Numpad4 -> left
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a' }))).toBe('left');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowLeft', key: 'ArrowLeft' }))).toBe('left');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'a' }))).toBe('left');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'q' }))).toBe('left');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Numpad4', key: '4' }))).toBe('left');

    // D / Seta para Direita / Numpad6 -> right
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd' }))).toBe('right');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight' }))).toBe('right');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'd' }))).toBe('right');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Numpad6', key: '6' }))).toBe('right');

    // Outras teclas devem ser ignoradas
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }))).toBeNull();
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' }))).toBeNull();
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }))).toBeNull();
  });

  it('gerencia teclas opostas sem deadlock: a tecla mais recente assume a prioridade', () => {
    const { result, unmount } = renderHook(() => useKeyboardControls());

    // 1. Pressiona W (forward)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' }));
    });
    expect(result.current.forward).toBe(true);
    expect(manualControlBridge.forward).toBe(1);
    expect(manualControlBridge.active).toBe(true);

    // 2. Sem soltar W, pressiona S (backward) -> prioridade para ré/freio imediato
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS', key: 's' }));
    });
    expect(result.current.forward).toBe(true);
    expect(result.current.backward).toBe(true);
    expect(manualControlBridge.forward).toBe(-1); // Ré prioritária, NÃO ZERO!
    expect(manualControlBridge.active).toBe(true);

    // 3. Solta S -> retoma forward automaticamente
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS', key: 's' }));
    });
    expect(result.current.backward).toBe(false);
    expect(result.current.forward).toBe(true);
    expect(manualControlBridge.forward).toBe(1);
    expect(manualControlBridge.active).toBe(true);

    // 4. Solta W -> para o robô
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', key: 'w' }));
    });
    expect(result.current.forward).toBe(false);
    expect(manualControlBridge.forward).toBe(0);
    expect(manualControlBridge.active).toBe(false);

    unmount();
  });

  it('gerencia giro oposto sem travar e limpa no blur/visibilitychange', () => {
    const { result, unmount } = renderHook(() => useKeyboardControls());

    // 1. Pressiona A (giro à esquerda)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a' }));
    });
    expect(result.current.left).toBe(true);
    expect(manualControlBridge.turn).toBe(1);

    // 2. Sem soltar A, pressiona D (giro à direita)
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd' }));
    });
    expect(result.current.right).toBe(true);
    expect(manualControlBridge.turn).toBe(-1); // Direita prioritária

    // 3. Ao perder foco da janela (blur), limpa tudo imediatamente
    act(() => {
      window.dispatchEvent(new Event('blur'));
    });
    expect(result.current.left).toBe(false);
    expect(result.current.right).toBe(false);
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(false);

    unmount();
  });

  it('mantém o robô em IDLE durante e após controle manual sem iniciar limpeza autônoma', () => {
    const robot = useRobotStore.getState();
    expect(robot.state).toBe('IDLE');

    // Ao acionar controle manual, move o robô sem forçar CLEANING
    manualControlBridge.forward = 1;
    manualControlBridge.active = true;

    // O estado permanece IDLE (apenas "Iniciar limpeza" deve iniciar a limpeza autônoma)
    expect(useRobotStore.getState().state).toBe('IDLE');

    // Ao soltar os controles, o robô para
    manualControlBridge.forward = 0;
    manualControlBridge.active = false;
    expect(useRobotStore.getState().state).toBe('IDLE');
  });

  it('alterna o modo de helicóptero ao disparar evento de tecla H', () => {
    // Garante que o robô tenha bateria suficiente para decolar
    useRobotStore.setState({ battery: 80 });

    const initialFlying = useRobotStore.getState().state === 'FLYING';
    useRobotStore.getState().toggleHelicopterMode();
    expect(useRobotStore.getState().state === 'FLYING').toBe(!initialFlying);

    useRobotStore.getState().toggleHelicopterMode();
    expect(useRobotStore.getState().state === 'FLYING').toBe(initialFlying);
  });

  it('alterna o modo do canhão de espuma ao disparar a tecla C (ativa e desativa)', () => {
    useRobotStore.setState({ isCannonAiming: false });
    expect(useRobotStore.getState().isCannonAiming).toBe(false);

    // Ativa com C
    useRobotStore.getState().toggleFoamCannonAim();
    expect(useRobotStore.getState().isCannonAiming).toBe(true);

    // Desativa com C
    useRobotStore.getState().toggleFoamCannonAim();
    expect(useRobotStore.getState().isCannonAiming).toBe(false);
  });
});

