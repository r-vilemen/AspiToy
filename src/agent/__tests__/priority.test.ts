import { describe, expect, it } from 'vitest';
import { PriorityManager } from '../decision/PriorityManager';
import { INITIAL_DOCK_POSITION, INITIAL_REGIONS } from '@/store/environmentStore';
import type { DustSpot } from '@/types/environment';

describe('Sprint 3 — Limpeza Inteligente e Priorização', () => {
  const manager = new PriorityManager();

  const mockSpots: DustSpot[] = [
    { id: '1', position: { x: 0, z: 0 }, intensity: 0.9, radius: 0.4, regionId: 'bedroom' },
    { id: '2', position: { x: 12, z: 5 }, intensity: 0.8, radius: 0.4, regionId: 'kitchen' },
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
      'kitchen', // usuário escolheu a cozinha
      INITIAL_REGIONS,
      80,
      INITIAL_DOCK_POSITION
    );

    expect(target).toEqual({ x: 12, z: 5 });
  });

  it('retorna o alvo de cobertura sistemática quando não restarem manchas concentradas de sujeira', () => {
    const coverageTarget = { x: 3.5, z: 2.0 };
    const target = manager.selectBestTarget(
      { x: 0, z: 0 },
      [], // sem manchas ativas
      'bedroom',
      INITIAL_REGIONS,
      80,
      INITIAL_DOCK_POSITION,
      coverageTarget
    );

    expect(target).toEqual(coverageTarget);
  });

  it('no modo chão ignora sujeiras elevadas em mesas e sofás, mas no modo voo as considera', () => {
    const elevatedSpot: DustSpot = {
      id: 'elevated-table',
      position: { x: 1, z: 1 },
      intensity: 1.0,
      radius: 0.4,
      regionId: 'bedroom',
      y: 0.85,
    };

    // Modo chão (isFlying = false): não deve escolher o ponto em cima da mesa
    const groundTarget = manager.selectBestTarget(
      { x: 0, z: 0 },
      [elevatedSpot],
      'bedroom',
      INITIAL_REGIONS,
      80,
      INITIAL_DOCK_POSITION,
      null,
      false
    );
    expect(groundTarget).toBeNull();

    // Modo voo (isFlying = true): deve escolher o ponto na mesa para o helicóptero
    const flyingTarget = manager.selectBestTarget(
      { x: 0, z: 0 },
      [elevatedSpot],
      'bedroom',
      INITIAL_REGIONS,
      80,
      INITIAL_DOCK_POSITION,
      null,
      true
    );
    expect(flyingTarget).toEqual({ x: 1, z: 1 });
  });
});

