import { beforeEach, describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { StatusCard } from '../ui/StatusCard';
import { ControlPanel } from '../ui/ControlPanel';
import { Header } from '../layout/Header';
import { useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useSoundStore } from '@/store/soundStore';

describe('Componentes de Interface e Controles (Dia 1)', () => {
  beforeEach(() => {
    useEnvironmentStore.getState().resetEnvironment();
    useRobotStore.getState().resetRobot();
  });

  it('renderiza Header, StatusCard e ControlPanel com estado inicial consistente', () => {
    render(
      <div>
        <Header />
        <StatusCard />
        <ControlPanel />
      </div>
    );

    expect(screen.getByText('AspiToy')).toBeDefined();
    expect(screen.getByText('AspiToy MK-I')).toBeDefined();
    expect(screen.getByText('Pronto para iniciar na base')).toBeDefined();
    expect(screen.getByText('Iniciar limpeza')).toBeDefined();
  });

  it('alterna controles corretamente ao iniciar, pausar, retomar e retornar à base', () => {
    render(
      <div>
        <StatusCard />
        <ControlPanel />
      </div>
    );

    const startBtn = screen.getByRole('button', { name: /Iniciar limpeza/i });
    fireEvent.click(startBtn);
    expect(screen.getByText('Aspiração e sensores ativos')).toBeDefined();
    expect(useRobotStore.getState().state).toBe('CLEANING');

    const pauseBtn = screen.getByRole('button', { name: /Pausar operação/i });
    fireEvent.click(pauseBtn);
    expect(useRobotStore.getState().state).toBe('PAUSED');

    const resumeBtn = screen.getByRole('button', { name: /Retomar limpeza/i });
    fireEvent.click(resumeBtn);
    expect(screen.getByText('Aspiração e sensores ativos')).toBeDefined();
    expect(useRobotStore.getState().state).toBe('CLEANING');

    const returnBtn = screen.getByRole('button', { name: /Retornar à base/i });
    fireEvent.click(returnBtn);
    expect(screen.getByText('Rota direta para acoplamento')).toBeDefined();
    expect(useRobotStore.getState().state).toBe('RETURNING');

    // Durante o retorno à base, o usuário também pode pausar a operação
    const pauseWhileReturning = screen.getByRole('button', { name: /Pausar operação/i });
    fireEvent.click(pauseWhileReturning);
    expect(useRobotStore.getState().state).toBe('PAUSED');
  });

  it('permite reiniciar a limpeza e regenera poeira quando o robô conclui a tarefa', () => {
    render(
      <div>
        <StatusCard />
        <ControlPanel />
      </div>
    );

    // Simula conclusão anterior com 100%
    act(() => {
      useRobotStore.getState().setCleaningProgress(100);
      useRobotStore.getState().setOperationalState('COMPLETED');
    });

    const startBtn = screen.getByRole('button', { name: /Iniciar limpeza/i });
    act(() => {
      fireEvent.click(startBtn);
    });

    expect(useRobotStore.getState().state).toBe('CLEANING');
    expect(useRobotStore.getState().cleaningProgress).toBe(0);
    expect(useEnvironmentStore.getState().dustSpots.some((s) => s.intensity > 0.5)).toBe(true);
  });

  it('permite ligar e desligar o som através do botão no Header', () => {
    useSoundStore.getState().disableSound();
    render(<Header />);

    const soundBtn = screen.getByRole('button', { name: /Ligar som do projeto/i });
    expect(soundBtn).toBeDefined();

    fireEvent.click(soundBtn);
    expect(screen.getByRole('button', { name: /Desligar som do projeto/i })).toBeDefined();
    expect(useSoundStore.getState().isEnabled).toBe(true);

    fireEvent.click(soundBtn);
    expect(screen.getByRole('button', { name: /Ligar som do projeto/i })).toBeDefined();
    expect(useSoundStore.getState().isEnabled).toBe(false);
  });
});

