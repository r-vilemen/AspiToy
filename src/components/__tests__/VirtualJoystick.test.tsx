import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { manualControlBridge, useRobotStore } from '@/store/robotStore';

// Polyfill PointerEvent em ambiente jsdom para suportar clientX/clientY
if (typeof window !== 'undefined' && !window.PointerEvent) {
  class MockPointerEvent extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 1;
    }
  }
  window.PointerEvent = MockPointerEvent as any;
}

describe('VirtualJoystick — Analógico Virtual Estilo PS2', () => {
  beforeEach(() => {
    useRobotStore.getState().resetRobot();
    manualControlBridge.forward = 0;
    manualControlBridge.turn = 0;
    manualControlBridge.active = false;
  });

  it('renderiza o analógico com acessibilidade, guias cardeais e data-testid', () => {
    render(<VirtualJoystick />);

    const joystick = screen.getByTestId('virtual-joystick');
    expect(joystick).toBeDefined();
    expect(joystick.getAttribute('aria-label')).toBe('Analógico Virtual Estilo PS2');

    // Marcadores cardeais de direção
    expect(screen.getByText('▲')).toBeDefined();
    expect(screen.getByText('▼')).toBeDefined();
    expect(screen.getByText('◄')).toBeDefined();
    expect(screen.getByText('►')).toBeDefined();
  });

  it('calcula movimento para frente ao arrastar para cima (dy < 0)', () => {
    render(<VirtualJoystick size={120} maxRadius={40} deadzone={5} />);

    const joystick = screen.getByTestId('virtual-joystick');

    // Simula toque no centro e arraste para cima (dy = -30)
    // Em jsdom, getBoundingClientRect() retorna zeros, então dx = clientX - centerX = clientX - clientX = 0
    // Para simular dx e dy, definimos getBoundingClientRect mock
    joystick.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 120,
      height: 120,
      right: 220,
      bottom: 220,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Centro está em (160, 160). Para ir para cima: clientX = 160, clientY = 125 (dy = -35)
    fireEvent.pointerDown(joystick, { clientX: 160, clientY: 125, pointerId: 1 });

    expect(manualControlBridge.forward).toBeGreaterThan(0.7);
    expect(Math.abs(manualControlBridge.turn)).toBeLessThan(0.1);
    expect(manualControlBridge.active).toBe(true);

    // Soltar o analógico retorna ao repouso
    fireEvent.pointerUp(joystick, { pointerId: 1 });
    expect(manualControlBridge.forward).toBe(0);
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(false);
  });

  it('calcula marcha ré ao arrastar para baixo (dy > 0)', () => {
    render(<VirtualJoystick size={120} maxRadius={40} deadzone={5} />);

    const joystick = screen.getByTestId('virtual-joystick');
    joystick.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 120,
      height: 120,
      right: 220,
      bottom: 220,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Centro (160, 160). Para ir para baixo: clientX = 160, clientY = 195 (dy = +35)
    fireEvent.pointerDown(joystick, { clientX: 160, clientY: 195, pointerId: 1 });

    expect(manualControlBridge.forward).toBeLessThan(-0.7);
    expect(manualControlBridge.active).toBe(true);

    fireEvent.pointerUp(joystick, { pointerId: 1 });
    expect(manualControlBridge.forward).toBe(0);
    expect(manualControlBridge.active).toBe(false);
  });

  it('calcula giro à esquerda (dx < 0) e giro à direita (dx > 0)', () => {
    render(<VirtualJoystick size={120} maxRadius={40} deadzone={5} />);

    const joystick = screen.getByTestId('virtual-joystick');
    joystick.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 120,
      height: 120,
      right: 220,
      bottom: 220,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Centro (160, 160). Para virar à esquerda: clientX = 125, clientY = 160 (dx = -35)
    fireEvent.pointerDown(joystick, { clientX: 125, clientY: 160, pointerId: 1 });
    expect(manualControlBridge.turn).toBeGreaterThan(0.7);
    expect(manualControlBridge.active).toBe(true);

    // Mover para a direita sem soltar: clientX = 195, clientY = 160 (dx = +35)
    fireEvent.pointerMove(joystick, { clientX: 195, clientY: 160, pointerId: 1 });
    expect(manualControlBridge.turn).toBeLessThan(-0.7);
    expect(manualControlBridge.active).toBe(true);

    fireEvent.pointerUp(joystick, { pointerId: 1 });
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(false);
  });

  it('ignora pequenos toques dentro da zona morta (deadzone)', () => {
    render(<VirtualJoystick size={120} maxRadius={40} deadzone={8} />);

    const joystick = screen.getByTestId('virtual-joystick');
    joystick.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 120,
      height: 120,
      right: 220,
      bottom: 220,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    // Centro (160, 160). Pequeno desvio de 3px (dentro da deadzone de 8px)
    fireEvent.pointerDown(joystick, { clientX: 162, clientY: 158, pointerId: 1 });
    expect(manualControlBridge.forward).toBe(0);
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(false);
  });

  it('desacopla da base de recarga se o robô estiver recarregando e limpa targetPosition', () => {
    useRobotStore.getState().setOperationalState('RECHARGING');
    useRobotStore.getState().setTargetPosition({ x: 5, z: 5 });

    render(<VirtualJoystick size={120} maxRadius={40} deadzone={5} />);
    const joystick = screen.getByTestId('virtual-joystick');
    joystick.getBoundingClientRect = () => ({
      left: 100,
      top: 100,
      width: 120,
      height: 120,
      right: 220,
      bottom: 220,
      x: 100,
      y: 100,
      toJSON: () => {},
    });

    fireEvent.pointerDown(joystick, { clientX: 160, clientY: 125, pointerId: 1 });

    const state = useRobotStore.getState();
    expect(state.state).toBe('IDLE');
    expect(state.targetPosition).toBeNull();
  });
});
