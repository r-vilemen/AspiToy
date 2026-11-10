import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { StatusCard } from '../ui/StatusCard';
import { ControlPanel } from '../ui/ControlPanel';
import { Header } from '../layout/Header';
import { useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';

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
    expect(screen.getByText('Aguardando comando')).toBeDefined();
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
    expect(screen.getByText('Limpando ambiente')).toBeDefined();

    const pauseBtn = screen.getByRole('button', { name: /Pausar operação/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByText('Operação pausada')).toBeDefined();

    const resumeBtn = screen.getByRole('button', { name: /Retomar limpeza/i });
    fireEvent.click(resumeBtn);
    expect(screen.getByText('Limpando ambiente')).toBeDefined();

    const returnBtn = screen.getByRole('button', { name: /Retornar à base/i });
    fireEvent.click(returnBtn);
    expect(screen.getByText('Retornando à base')).toBeDefined();
  });
});

