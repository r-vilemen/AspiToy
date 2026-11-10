import { create } from 'zustand';
import type {
  CommandRecord,
  NotificationTone,
  SystemNotification,
  UserCommandType,
} from '@/types/commands';
import { useRobotStore } from './robotStore';
import { useEnvironmentStore } from './environmentStore';

export type CameraPreset = 'follow' | 'overview' | 'closeup';

export interface CommandStoreState {
  currentCommand: CommandRecord | null;
  commandHistory: CommandRecord[];
  notifications: SystemNotification[];
  cameraPreset: CameraPreset;
  dispatchCommand: (type: UserCommandType, options?: { regionId?: string }) => boolean;
  pushNotification: (title: string, message: string, tone?: NotificationTone) => void;
  dismissNotification: (id: string) => void;
  setCameraPreset: (preset: CameraPreset) => void;
}

function formatTimeNow(): string {
  return new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export const useCommandStore = create<CommandStoreState>((set, get) => ({
  currentCommand: null,
  commandHistory: [],
  notifications: [
    {
      id: 'welcome-notif',
      title: 'AspiToy conectado',
      message: 'Sensores calibrados na sala de estar. Pronto para iniciar a limpeza.',
      tone: 'info',
      timestamp: formatTimeNow(),
    },
  ],
  cameraPreset: 'follow',

  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  pushNotification: (title, message, tone = 'info') => {
    const newItem: SystemNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      tone,
      timestamp: formatTimeNow(),
    };
    set((state) => ({
      notifications: [newItem, ...state.notifications].slice(0, 5),
    }));
  },

  dismissNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  dispatchCommand: (type, options) => {
    const robot = useRobotStore.getState();
    const env = useEnvironmentStore.getState();
    const timestamp = formatTimeNow();

    let accepted = true;
    let label = '';
    let reason: string | undefined;

    switch (type) {
      case 'START_CLEANING': {
        if (robot.state === 'CLEANING' || robot.state === 'EXPLORING') {
          accepted = false;
          label = 'Iniciar limpeza';
          reason = 'O AspiToy já está em operação.';
          break;
        }
        label = 'Iniciar limpeza autônoma';
        robot.setOperationalState(
          'CLEANING',
          'Iniciando varredura inteligente da sala de estar'
        );
        get().pushNotification(
          'Limpeza iniciada',
          'O AspiToy deixou a base e iniciou a varredura da sala.',
          'success'
        );
        break;
      }

      case 'PAUSE_CLEANING': {
        if (
          robot.state !== 'CLEANING' &&
          robot.state !== 'EXPLORING' &&
          robot.state !== 'RETURNING' &&
          robot.state !== 'AVOIDING'
        ) {
          accepted = false;
          label = 'Pausar operação';
          reason = 'Não há operação ativa para pausar.';
          break;
        }
        label = 'Pausar operação';
        robot.setOperationalState('PAUSED', 'Operação pausada pelo usuário');
        get().pushNotification(
          'Operação em pausa',
          'Motores em espera. Aguardando comando para retomar.',
          'warning'
        );
        break;
      }

      case 'RESUME_CLEANING': {
        if (robot.state !== 'PAUSED') {
          accepted = false;
          label = 'Retomar operação';
          reason = 'O robô não está pausado.';
          break;
        }
        const targetState = robot.previousActiveState ?? 'CLEANING';
        label = 'Retomar operação';
        robot.setOperationalState(targetState, 'Operação retomada pelo usuário');
        get().pushNotification(
          'Limpeza retomada',
          'O AspiToy retomou sua trajetória planejada.',
          'info'
        );
        break;
      }

      case 'RETURN_TO_BASE': {
        if (robot.state === 'RECHARGING') {
          accepted = false;
          label = 'Retornar à base';
          reason = 'O AspiToy já está acoplado na base.';
          break;
        }
        label = 'Retornar à base de recarga';
        robot.setTargetPosition(env.dockPosition);
        robot.setOperationalState(
          'RETURNING',
          'Interrompendo tarefa atual e retornando à base'
        );
        get().pushNotification(
          'Retorno à base iniciado',
          'Rota recalculada em direção à estação de carregamento.',
          'info'
        );
        break;
      }

      case 'CLEAN_REGION': {
        const regionId = options?.regionId ?? env.selectedRegionId;
        const region = env.regions.find((r) => r.id === regionId) ?? env.regions[0];
        env.setSelectedRegion(region.id);
        label = `Limpar região: ${region.label}`;
        robot.setTargetPosition(region.center);
        robot.setOperationalState(
          'CLEANING',
          `Priorizando limpeza em ${region.label}`
        );
        get().pushNotification(
          'Nova região selecionada',
          `Destino ajustado para ${region.label}.`,
          'info'
        );
        break;
      }

      case 'RESET_SIMULATION': {
        label = 'Reiniciar simulação';
        env.resetEnvironment();
        robot.resetRobot();
        get().pushNotification(
          'Ambiente restaurado',
          'AspiToy reposicionado na base com bateria carregada.',
          'info'
        );
        break;
      }
    }

    const record: CommandRecord = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      label,
      regionId: options?.regionId,
      timestamp,
      accepted,
      reason,
    };

    set((state) => ({
      currentCommand: accepted ? record : state.currentCommand,
      commandHistory: [record, ...state.commandHistory].slice(0, 8),
    }));

    return accepted;
  },
}));

