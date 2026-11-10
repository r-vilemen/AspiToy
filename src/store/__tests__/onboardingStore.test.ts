import { beforeEach, describe, expect, it } from 'vitest';
import { useOnboardingStore } from '../onboardingStore';

describe('Sistema de Onboarding (Animação Inicial e Tutorial Rápido)', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({
      showIntro: true,
      showTutorial: false,
      tutorialStep: 0,
    });
  });

  it('inicia com animação de introdução para novos visitantes', () => {
    const state = useOnboardingStore.getState();
    expect(state.showIntro).toBe(true);
    expect(state.showTutorial).toBe(false);
  });

  it('redireciona para o tutorial rápido ao concluir ou pular a animação inicial', () => {
    useOnboardingStore.getState().finishIntro();

    const state = useOnboardingStore.getState();
    expect(state.showIntro).toBe(false);
    expect(state.showTutorial).toBe(true);
    expect(state.tutorialStep).toBe(0);
    expect(localStorage.getItem('aspitoy_intro_seen_v1')).toBe('true');
  });

  it('avança, retrocede e navega entre os passos do tutorial', () => {
    useOnboardingStore.getState().openTutorial(0);
    expect(useOnboardingStore.getState().tutorialStep).toBe(0);

    useOnboardingStore.getState().nextTutorialStep();
    expect(useOnboardingStore.getState().tutorialStep).toBe(1);

    useOnboardingStore.getState().nextTutorialStep();
    expect(useOnboardingStore.getState().tutorialStep).toBe(2);

    useOnboardingStore.getState().prevTutorialStep();
    expect(useOnboardingStore.getState().tutorialStep).toBe(1);

    useOnboardingStore.getState().setTutorialStep(3);
    expect(useOnboardingStore.getState().tutorialStep).toBe(3);

    // Ao avançar além do último passo, fecha o tutorial
    useOnboardingStore.getState().nextTutorialStep();
    expect(useOnboardingStore.getState().showTutorial).toBe(false);
    expect(localStorage.getItem('aspitoy_tutorial_seen_v1')).toBe('true');
  });

  it('permite reabrir o tutorial a qualquer momento pelo botão de ajuda', () => {
    useOnboardingStore.getState().closeTutorial();
    expect(useOnboardingStore.getState().showTutorial).toBe(false);

    useOnboardingStore.getState().openTutorial(2);
    expect(useOnboardingStore.getState().showTutorial).toBe(true);
    expect(useOnboardingStore.getState().tutorialStep).toBe(2);
  });
});
