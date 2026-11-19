import { useEffect } from 'react';
import { useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
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
  ORGANIZING: {
    label: 'Guardando brinquedos',
    shortNote: 'Arrumando o quarto no tapete',
    dotColorClass: 'bg-[#F59E0B]',
    badgeClass: 'bg-[#F59E0B]/16 text-[#B45309] border-[#F59E0B]/40',
  },
  CHASING_CATS: {
    label: 'Arretando os gatos',
    shortNote: 'Perseguição lúdica e jatos de espuma',
    dotColorClass: 'bg-[#EA580C]',
    badgeClass: 'bg-[#EA580C]/18 text-[#C2410C] border-[#EA580C]/40',
  },
  FLYING: {
    label: 'Modo Aspi-Helicóptero',
    shortNote: 'Higienização aérea de mesas e sofás',
    dotColorClass: 'bg-[#0284C7]',
    badgeClass: 'bg-[#0284C7]/18 text-[#0369A1] border-[#0284C7]/40',
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

/**
 * Relógio do ciclo circadiano:
 * Avança o período do dia automaticamente a cada 60s quando em modo automático.
 * Quando o usuário seleciona um período manualmente, o relógio não altera o período.
 */
export function useCircadianClock(): void {
  useEffect(() => {
    const id = window.setInterval(() => {
      const nextTime = useEnvironmentStore.getState().tickCircadianTimer(1);
      if (nextTime) {
        const title =
          nextTime === 'day'
            ? 'Novo Período: Manhã'
            : nextTime === 'sunset'
              ? 'Novo Período: Entardecer'
              : 'Novo Período: Noite';
        const msg =
          nextTime === 'day'
            ? 'O sol nasceu na casa. Iluminação solar matinal com sombras nítidas.'
            : nextTime === 'sunset'
              ? 'O entardecer chegou. Luz dourada acolhedora entrando pelas janelas.'
              : 'A noite caiu. Luzes internas acesas e motor no modo silencioso.';

        useCommandStore.getState().pushNotification(title, msg, 'info');
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, []);
}

