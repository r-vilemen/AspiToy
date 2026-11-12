import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusCard } from '@/components/ui/StatusCard';
import {
  ROOM_WALKABLE_AREAS,
  TOTAL_HOUSE_WALKABLE_AREA,
  ROOM_DISPLAY_NAMES,
} from '../FloorPlan';

describe('Telemetria Realista da Área Higienizada', () => {
  beforeEach(() => {
    useRobotStore.getState().resetRobot();
    useEnvironmentStore.getState().resetEnvironment();
  });

  it('possui áreas e nomes definidos para todos os cômodos da residência', () => {
    const rooms = ['bedroom', 'hallway', 'living-room', 'kitchen', 'bathroom'];
    let sumArea = 0;

    for (const room of rooms) {
      expect(ROOM_WALKABLE_AREAS[room]).toBeGreaterThan(0);
      expect(ROOM_DISPLAY_NAMES[room]).toBeDefined();
      sumArea += ROOM_WALKABLE_AREAS[room];
    }

    expect(sumArea).toBe(TOTAL_HOUSE_WALKABLE_AREA);
  });

  it('renderiza ProgressBar com porcentagem e área limpa em m²', () => {
    useRobotStore.getState().setSanitizedAreaTelemetry(35, 75, 42.7, 122);
    render(<ProgressBar />);

    expect(screen.getByText('35%')).toBeDefined();
    expect(screen.getByText(/42\.7 m² limpos/i)).toBeDefined();
    expect(screen.getByText(/122 m² total/i)).toBeDefined();
  });

  it('renderiza escopo por cômodo quando região específica é selecionada', () => {
    useEnvironmentStore.getState().setSelectedRegion('bedroom');
    useRobotStore.getState().setSanitizedAreaTelemetry(60, 60, 19.2, 32);
    render(<ProgressBar />);

    expect(screen.getByText('60%')).toBeDefined();
    expect(screen.getByText(/19\.2 m² limpos/i)).toBeDefined();
    expect(screen.getByText(/32 m² cômodo/i)).toBeDefined();
  });

  it('renderiza StatusCard exibindo a região atual e porcentagem higienizada daquele cômodo', () => {
    useRobotStore.getState().syncTelemetryFromBridge('bedroom', 'Quarto');
    useRobotStore.getState().setSanitizedAreaTelemetry(25, 80, 30.5, 122);
    render(<StatusCard />);

    expect(screen.getByText('Quarto')).toBeDefined();
    expect(screen.getByText('80%')).toBeDefined();
  });
});
