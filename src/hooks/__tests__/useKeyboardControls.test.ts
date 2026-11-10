import { describe, expect, it, beforeEach } from 'vitest';
import { normalizeDirectionKey } from '../useKeyboardControls';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';

describe('Reconhecimento Universal de Teclado e Controle Manual (WASD / Setas)', () => {
  beforeEach(() => {
    manualControlBridge.forward = 0;
    manualControlBridge.turn = 0;
    manualControlBridge.active = false;
    useRobotStore.getState().resetRobot();
  });

  it('normaliza corretamente teclas tanto por e.code quanto por e.key em qualquer layout', () => {
    // W / Seta para Cima -> forward
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyW', key: 'w' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyW', key: 'W' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowUp', key: 'ArrowUp' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'w' }))).toBe('forward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }))).toBe('forward');

    // S / Seta para Baixo -> backward
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyS', key: 's' }))).toBe('backward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowDown', key: 'ArrowDown' }))).toBe('backward');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 's' }))).toBe('backward');

    // A / Seta para Esquerda -> left
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a' }))).toBe('left');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowLeft', key: 'ArrowLeft' }))).toBe('left');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'a' }))).toBe('left');

    // D / Seta para Direita -> right
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd' }))).toBe('right');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'ArrowRight', key: 'ArrowRight' }))).toBe('right');
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { key: 'd' }))).toBe('right');

    // Outras teclas devem ser ignoradas
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Space', key: ' ' }))).toBeNull();
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'Enter', key: 'Enter' }))).toBeNull();
    expect(normalizeDirectionKey(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e' }))).toBeNull();
  });
});

