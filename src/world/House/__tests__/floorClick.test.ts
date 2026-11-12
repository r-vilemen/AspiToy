import { describe, it, expect, beforeEach } from 'vitest';
import { useRobotStore } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { HOUSE_FLOOR_PLAN, getRoomAtPosition } from '../FloorPlan';

describe('Navegação Interativa por Clique no Chão da Casa Inteira', () => {
  beforeEach(() => {
    useRobotStore.getState().resetRobot();
  });

  it('permite clique e define destino correto em todos os 5 cômodos da residência', () => {
    const dispatchCommand = useCommandStore.getState().dispatchCommand;

    // 1. Quarto (x: 0, z: 0)
    dispatchCommand('MOVE_TO_POINT', { point: { x: 0, z: 0 } });
    expect(useRobotStore.getState().targetPosition).toEqual({ x: 0, z: 0 });
    expect(useRobotStore.getState().state).toBe('EXPLORING');

    // 2. Corredor Central (x: 6.3, z: 3.0)
    dispatchCommand('MOVE_TO_POINT', { point: { x: 6.3, z: 3.0 } });
    expect(useRobotStore.getState().targetPosition).toEqual({ x: 6.3, z: 3.0 });
    expect(getRoomAtPosition(useRobotStore.getState().targetPosition!)).toBe('hallway');

    // 3. Sala de Estar (x: 12.0, z: 0.0)
    dispatchCommand('MOVE_TO_POINT', { point: { x: 12.0, z: 0.0 } });
    expect(useRobotStore.getState().targetPosition).toEqual({ x: 12.0, z: 0.0 });
    expect(getRoomAtPosition(useRobotStore.getState().targetPosition!)).toBe('living-room');

    // 4. Cozinha Residencial (x: 13.0, z: 6.0)
    dispatchCommand('MOVE_TO_POINT', { point: { x: 13.0, z: 6.0 } });
    expect(useRobotStore.getState().targetPosition).toEqual({ x: 13.0, z: 6.0 });
    expect(getRoomAtPosition(useRobotStore.getState().targetPosition!)).toBe('kitchen');

    // 5. Banheiro Social (x: 7.8, z: 11.0)
    dispatchCommand('MOVE_TO_POINT', { point: { x: 7.8, z: 11.0 } });
    expect(useRobotStore.getState().targetPosition).toEqual({ x: 7.8, z: 11.0 });
    expect(getRoomAtPosition(useRobotStore.getState().targetPosition!)).toBe('bathroom');
  });

  it('valida que todos os cômodos possuem bounds definidos na planta global', () => {
    const rooms = HOUSE_FLOOR_PLAN.rooms;
    expect(rooms.bedroom.bounds).toBeDefined();
    expect(rooms.hallway.bounds).toBeDefined();
    expect(rooms['living-room'].bounds).toBeDefined();
    expect(rooms.kitchen.bounds).toBeDefined();
    expect(rooms.bathroom.bounds).toBeDefined();
  });

  it('assegura que ao selecionar o banheiro o robô permanece no cômodo sem migrar para outros ambientes', () => {
    const dispatchCommand = useCommandStore.getState().dispatchCommand;
    dispatchCommand('CLEAN_REGION', { regionId: 'bathroom' });

    expect(useRobotStore.getState().state).toBe('CLEANING');
    const target = useRobotStore.getState().targetPosition;
    expect(target).not.toBeNull();
    // Destino inicial deve ser o centro do banheiro
    expect(getRoomAtPosition(target!)).toBe('bathroom');
  });

  it('quando a limpeza está PAUSED, clique no chão preserva estritamente o estado PAUSED sem iniciar limpeza automaticamente', () => {
    const dispatchCommand = useCommandStore.getState().dispatchCommand;
    // Coloca o robô em PAUSED
    useRobotStore.getState().setOperationalState('PAUSED', 'Limpeza pausada pelo usuário');
    expect(useRobotStore.getState().state).toBe('PAUSED');

    // Usuário clica no chão da sala de estar para deslocar manualmente
    dispatchCommand('MOVE_TO_POINT', { point: { x: 12.0, z: 0.0 } });

    // Destino deve ser definido, mas estado operacional permanece estritamente PAUSED
    expect(useRobotStore.getState().targetPosition).toEqual({ x: 12.0, z: 0.0 });
    expect(useRobotStore.getState().state).toBe('PAUSED');
  });
});

