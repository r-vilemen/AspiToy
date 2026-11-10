import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IntroAnimation } from '../IntroAnimation';
import { TutorialModal } from '../TutorialModal';
import { useOnboardingStore } from '@/store/onboardingStore';

describe('Componentes de Onboarding (IntroAnimation e TutorialModal)', () => {
  beforeEach(() => {
    localStorage.clear();
    useOnboardingStore.setState({
      showIntro: true,
      showTutorial: false,
      tutorialStep: 0,
    });
  });

  it('renderiza a animação de introdução e permite pular', () => {
    render(<IntroAnimation />);

    expect(screen.getByText('AspiToy')).toBeDefined();
    expect(screen.getByText(/Toy-Tech Autonomous Agent/i)).toBeDefined();

    const skipBtn = screen.getByRole('button', { name: /Pular introdução/i });
    expect(skipBtn).toBeDefined();

    fireEvent.click(skipBtn);
    expect(useOnboardingStore.getState().showIntro).toBe(false);
    expect(useOnboardingStore.getState().showTutorial).toBe(true);
  });

  it('renderiza os passos do tutorial e avança até concluir', () => {
    useOnboardingStore.setState({
      showIntro: false,
      showTutorial: true,
      tutorialStep: 0,
    });

    render(<TutorialModal />);

    // Passo 1
    expect(screen.getByText(/Explore a Sala de Estar 3D/i)).toBeDefined();
    const nextBtn = screen.getByRole('button', { name: /Próximo/i });
    fireEvent.click(nextBtn);

    // Passo 2
    expect(screen.getByText(/Pilotagem Manual e Limpeza/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Passo 3
    expect(screen.getByText(/Base de Carregamento 3D/i)).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Passo 4 (último)
    expect(screen.getByText(/Gato Autônomo e Brinquedos/i)).toBeDefined();
    const finishBtn = screen.getByRole('button', { name: /Começar a Brincar!/i });
    expect(finishBtn).toBeDefined();

    fireEvent.click(finishBtn);
    expect(useOnboardingStore.getState().showTutorial).toBe(false);
  });
});
