import { beforeEach, describe, expect, it } from 'vitest';
import { ToyOrganizer, TOY_STORAGE_ZONE } from '../decision/ToyOrganizer';
import { useRobotStore, ROBOT_SKINS } from '@/store/robotStore';
import { useEnvironmentStore, pushableToysBridge } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';

describe('Modo Guarda-Brinquedos (ToyOrganizer) e Ciclo Circadiano', () => {
  beforeEach(() => {
    useRobotStore.getState().resetRobot();
    useEnvironmentStore.getState().resetEnvironment();
  });

  describe('ToyOrganizer (Planejamento de Empurrão dos Brinquedos)', () => {
    const organizer = new ToyOrganizer();

    it('identifica corretamente se um brinquedo está dentro ou fora da zona do tapete', () => {
      const insideToy = {
        ...pushableToysBridge[0],
        x: TOY_STORAGE_ZONE.center.x,
        z: TOY_STORAGE_ZONE.center.z,
      };
      const outsideToy = {
        ...pushableToysBridge[0],
        x: TOY_STORAGE_ZONE.center.x + 3.0,
        z: TOY_STORAGE_ZONE.center.z + 3.0,
      };

      expect(organizer.isToyOrganized(insideToy)).toBe(true);
      expect(organizer.isToyOrganized(outsideToy)).toBe(false);
    });

    it('calcula o ponto de aproximação atrás do brinquedo para empurrá-lo em direção ao tapete', () => {
      const mockRobotPos = { x: 3.0, z: 2.0 };
      const plan = organizer.planStep(mockRobotPos, pushableToysBridge);

      expect(plan.allDone).toBe(false);
      expect(plan.targetToy).not.toBeNull();
      expect(plan.targetPoint).toBeDefined();
    });

    it('declara allDone como true quando todos os brinquedos estão organizados', () => {
      const allInsideToys = pushableToysBridge.map((toy) => ({
        ...toy,
        x: TOY_STORAGE_ZONE.center.x + 0.1,
        z: TOY_STORAGE_ZONE.center.z + 0.1,
      }));

      const plan = organizer.planStep({ x: 0, z: 0 }, allInsideToys);
      expect(plan.allDone).toBe(true);
      expect(plan.organizedCount).toBe(allInsideToys.length);
    });
  });

  describe('Ciclo Circadiano Dia / Pôr do Sol / Noite', () => {
    it('alterna o ciclo diurno em sequência: sunset -> night -> day -> sunset', () => {
      const env = useEnvironmentStore.getState();
      expect(env.timeOfDay).toBe('sunset');

      const night = env.cycleTimeOfDay();
      expect(night).toBe('night');
      expect(useEnvironmentStore.getState().timeOfDay).toBe('night');

      const day = env.cycleTimeOfDay();
      expect(day).toBe('day');
      expect(useEnvironmentStore.getState().timeOfDay).toBe('day');

      const sunset = env.cycleTimeOfDay();
      expect(sunset).toBe('sunset');
      expect(useEnvironmentStore.getState().timeOfDay).toBe('sunset');
    });

    it('permite definir diretamente o período do dia via setTimeOfDay', () => {
      const env = useEnvironmentStore.getState();
      env.setTimeOfDay('night');
      expect(useEnvironmentStore.getState().timeOfDay).toBe('night');
      env.setTimeOfDay('day');
      expect(useEnvironmentStore.getState().timeOfDay).toBe('day');
    });
  });

  describe('Oficina Toy Box e Customização de Skins', () => {
    it('inicia com a skin classic equipada por padrão', () => {
      const robot = useRobotStore.getState();
      expect(robot.skin).toBe('classic');
      expect(ROBOT_SKINS.classic.requiredM2).toBe(0);
    });

    it('permite equipar novas skins e preserva a skin equipada ao reiniciar a simulação', () => {
      const robot = useRobotStore.getState();
      robot.setRobotSkin('space-ranger');
      expect(useRobotStore.getState().skin).toBe('space-ranger');

      robot.resetRobot();
      expect(useRobotStore.getState().skin).toBe('space-ranger');
    });
  });

  describe('Comando START_ORGANIZING', () => {
    it('inicia o modo ORGANIZING e direciona para o quarto', () => {
      const cmd = useCommandStore.getState();
      expect(cmd.dispatchCommand('START_ORGANIZING')).toBe(true);
      expect(useRobotStore.getState().state).toBe('ORGANIZING');
      expect(useEnvironmentStore.getState().selectedRegionId).toBe('bedroom');

      // Não deve aceitar comando duplicado se já está organizando
      expect(cmd.dispatchCommand('START_ORGANIZING')).toBe(false);
    });
  });
});
