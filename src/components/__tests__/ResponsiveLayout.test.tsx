import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Header } from '../layout/Header';
import { ControlPanel } from '../ui/ControlPanel';
import { Dashboard } from '../layout/Dashboard';
import { useRobotStore, manualControlBridge } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useCommandStore } from '@/store/commandStore';

// Mock da Cena 3D para ambiente de teste jsdom
vi.mock('@/world/Scene', () => ({
  Scene: () => <div data-testid="mock-3d-scene">Cena 3D Mock</div>,
}));

describe('Responsividade Mobile e Desktop da Interface', () => {
  beforeEach(() => {
    useEnvironmentStore.getState().resetEnvironment();
    useRobotStore.getState().resetRobot();
    useCommandStore.setState({ notifications: [] });
    useOnboardingStore.setState({
      showIntro: false,
      showTutorial: false,
    });
  });

  it('Header renderiza botões de câmera compactos com aria-labels adequados para mobile e desktop', () => {
    render(<Header />);

    // Verifica presença da identidade da marca
    expect(screen.getByText('AspiToy')).toBeDefined();

    // Verifica se os 3 modos de câmera estão presentes
    const followBtn = screen.getByRole('button', { name: /Acompanhar/i });
    const overviewBtn = screen.getByRole('button', { name: /Visão geral/i });
    const closeupBtn = screen.getByRole('button', { name: /Personagem/i });

    expect(followBtn).toBeDefined();
    expect(overviewBtn).toBeDefined();
    expect(closeupBtn).toBeDefined();

    // Botão de guia/tutorial
    expect(screen.getByRole('button', { name: /Ver guia de tutorial/i })).toBeDefined();
  });

  it('ControlPanel suporta toques direcionais touch/pointer para pilotagem no celular', () => {
    render(<ControlPanel />);

    const upBtn = screen.getByRole('button', { name: /Mover para frente/i });
    const downBtn = screen.getByRole('button', { name: /Mover para trás/i });
    const leftBtn = screen.getByRole('button', { name: /Girar para a esquerda/i });
    const rightBtn = screen.getByRole('button', { name: /Girar para a direita/i });

    // Testa evento de toque/pressionamento para frente
    fireEvent.pointerDown(upBtn);
    expect(manualControlBridge.forward).toBe(1);
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(true);

    fireEvent.pointerUp(upBtn);
    expect(manualControlBridge.forward).toBe(0);
    expect(manualControlBridge.active).toBe(false);

    // Testa giro à esquerda
    fireEvent.pointerDown(leftBtn);
    expect(manualControlBridge.turn).toBe(1);
    expect(manualControlBridge.active).toBe(true);

    fireEvent.pointerLeave(leftBtn);
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(false);

    // Testa ré / recuo
    fireEvent.pointerDown(downBtn);
    expect(manualControlBridge.forward).toBe(-1);
    expect(manualControlBridge.active).toBe(true);

    fireEvent.pointerUp(downBtn);
    expect(manualControlBridge.forward).toBe(0);
    expect(manualControlBridge.active).toBe(false);

    // Testa giro à direita
    fireEvent.pointerDown(rightBtn);
    expect(manualControlBridge.turn).toBe(-1);
    expect(manualControlBridge.active).toBe(true);

    fireEvent.pointerUp(rightBtn);
    expect(manualControlBridge.turn).toBe(0);
    expect(manualControlBridge.active).toBe(false);
  });

  it('Dashboard renderiza barra de ação rápida mobile e abre/fecha o drawer de controles', () => {
    render(<Dashboard />);

    // Verifica que a cena 3D está ativa
    expect(screen.getByTestId('mock-3d-scene')).toBeDefined();

    // Verifica que o aside de desktop preserva as classes para PC (sm:block sm:w-[340px])
    const desktopAside = screen.getByRole('complementary', {
      name: /Painel de controle do AspiToy/i,
    });
    expect(desktopAside.className).toContain('hidden');
    expect(desktopAside.className).toContain('sm:block');
    expect(desktopAside.className).toContain('sm:w-[340px]');

    // Verifica o botão de expansão do Drawer Mobile
    const openDrawerBtn = screen.getByRole('button', {
      name: /Abrir painel de controles e direção manual/i,
    });
    expect(openDrawerBtn).toBeDefined();

    // Inicialmente, o drawer expandido não está visível
    expect(
      screen.queryByRole('dialog', {
        name: /Painel de controle expandido do AspiToy/i,
      })
    ).toBeNull();

    // Clica para abrir o Drawer no celular
    fireEvent.click(openDrawerBtn);

    // Agora o Drawer está visível com o diálogo e botão Fechar
    const mobileDrawer = screen.getByRole('dialog', {
      name: /Painel de controle expandido do AspiToy/i,
    });
    expect(mobileDrawer).toBeDefined();

    const closeBtn = screen.getByRole('button', { name: /Recolher painel/i });
    expect(closeBtn).toBeDefined();

    // Clica para fechar o Drawer
    fireEvent.click(closeBtn);

    // O Drawer é recolhido novamente
    expect(
      screen.queryByRole('dialog', {
        name: /Painel de controle expandido do AspiToy/i,
      })
    ).toBeNull();
  });
});
