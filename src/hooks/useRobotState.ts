import { useEffect } from 'react';
import { useRobotStore } from '@/store/robotStore';
import type { RobotOperationalState } from '@/types/robot';

export interface OperationalStateDescriptor {
  label: string;
  shortNote: string;
  dotColorClass: string;
  badgeClass: string;
}

export const STATE_DESCRIPTORS: Record<RobotOperationalState, OperationalStateDescriptor> = {
  IDLE: {
    label: 'Aguardando comando',
    shortNote: 'Pronto para iniciar na base',
    dotColorClass: 'bg-[#10B981]',
    badgeClass: 'bg-[#10B981]/14 text-[#0D6E52] border-[#10B981]/30',
  },
  EXPLORING: {
    label: 'Explorando sala',
    shortNote: 'Mapeando regiões e passagem',
    dotColorClass: 'bg-[#14B8A6]',
    badgeClass: 'bg-[#14B8A6]/15 text-[#0F766E] border-[#14B8A6]/35',
  },
  CLEANING: {
    label: 'Limpando ambiente',
    shortNote: 'Aspiração e sensores ativos',
    dotColorClass: 'bg-[#E05A36]',
    badgeClass: 'bg-[#E05A36]/15 text-[#B43E1E] border-[#E05A36]/35',
  },
  AVOIDING: {
    label: 'Desviando de obstáculo',
    shortNote: 'Ajustando trajetória segura',
    dotColorClass: 'bg-[#D97706]',
    badgeClass: 'bg-[#D97706]/15 text-[#92400E] border-[#D97706]/35',
  },
  RETURNING: {
    label: 'Retornando à base',
    shortNote: 'Rota direta para acoplamento',
    dotColorClass: 'bg-[#0284C7]',
    badgeClass: 'bg-[#0284C7]/15 text-[#075985] border-[#0284C7]/35',
  },
  RECHARGING: {
    label: 'Recarregando bateria',
    shortNote: 'Acoplado na estação de energia',
    dotColorClass: 'bg-[#10B981]',
    badgeClass: 'bg-[#10B981]/15 text-[#065F46] border-[#10B981]/35',
  },
  PAUSED: {
    label: 'Operação pausada',
    shortNote: 'Aguardando retomada manual',
    dotColorClass: 'bg-[#78716C]',
    badgeClass: 'bg-[#78716C]/15 text-[#44403C] border-[#78716C]/35',
  },
  COMPLETED: {
    label: 'Missão concluída',
    shortNote: 'Sala higienizada com sucesso',
    dotColorClass: 'bg-[#10B981]',
    badgeClass: 'bg-[#10B981]/18 text-[#065F46] border-[#10B981]/40',
  },
};

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useOperationClock(): void {
  const tickOperationTimer = useRobotStore((s) => s.tickOperationTimer);

  useEffect(() => {
    const id = window.setInterval(() => {
      tickOperationTimer();
    }, 1000);
    return () => window.clearInterval(id);
  }, [tickOperationTimer]);
}

