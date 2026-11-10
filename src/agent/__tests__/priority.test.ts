import { describe, expect, it } from 'vitest';
import { PriorityManager } from '../decision/PriorityManager';
import { INITIAL_DOCK_POSITION, INITIAL_REGIONS } from '@/store/environmentStore';
import type { DustSpot } from '@/types/environment';

describe('Sprint 3 — Limpeza Inteligente e Priorização', () => {
  const manager = new PriorityManager();

  const mockSpots: DustSpot[] = [
    { id: '1', position: { x: 0, z: 0 }, intensity: 0.9, radius: 0.4, regionId: 'living-center' },
    { id: '2', position: { x: 3, z: 2 }, intensity: 0.8, radius: 0.4, regionId: 'reading-nook' },
  ];

  it('prioriza retorno à base quando bateria estiver em nível crítico (<= 18%)', () => {
    const target = manager.selectBestTarget(
      { x: 0, z: 0 },
      mockSpots,
      'all',
      INITIAL_REGIONS,
      15, // 15% de bateria
      INITIAL_DOCK_POSITION
    );

    expect(target).toEqual(INITIAL_DOCK_POSITION);
  });

  it('prioriza pontos de sujeira localizados dentro da região selecionada', () => {
    const target = manager.selectBestTarget(
      { x: 0, z: 0 },
      mockSpots,
      'reading-nook', // usuário escolheu o canto de leitura
      INITIAL_REGIONS,
      80,
      INITIAL_DOCK_POSITION
    );

    expect(target).toEqual({ x: 3, z: 2 });
  });
});

