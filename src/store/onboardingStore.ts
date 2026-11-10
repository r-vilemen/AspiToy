import { create } from 'zustand';

export interface OnboardingStoreState {
  showIntro: boolean;
  showTutorial: boolean;
  tutorialStep: number;
  totalSteps: number;
  startIntro: () => void;
  finishIntro: () => void;
  openTutorial: (step?: number) => void;
  closeTutorial: () => void;
  nextTutorialStep: () => void;
  prevTutorialStep: () => void;
  setTutorialStep: (step: number) => void;
}

const INTRO_STORAGE_KEY = 'aspitoy_intro_seen_v1';
const TUTORIAL_STORAGE_KEY = 'aspitoy_tutorial_seen_v1';

function isFirstVisit(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    return localStorage.getItem(INTRO_STORAGE_KEY) !== 'true';
  } catch {
    return false;
  }
}

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => {
  const firstVisit = isFirstVisit();

  return {
    showIntro: firstVisit,
    showTutorial: false,
    tutorialStep: 0,
    totalSteps: 4,

    startIntro: () => {
      set({ showIntro: true, showTutorial: false, tutorialStep: 0 });
    },

    finishIntro: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(INTRO_STORAGE_KEY, 'true');
        } catch {
          // ignore storage errors
        }
      }
      // Redireciona imediatamente para o tutorial rápido após a animação de introdução
      set({ showIntro: false, showTutorial: true, tutorialStep: 0 });
    },

    openTutorial: (step = 0) => {
      set({ showIntro: false, showTutorial: true, tutorialStep: step });
    },

    closeTutorial: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
          localStorage.setItem(INTRO_STORAGE_KEY, 'true');
        } catch {
          // ignore storage errors
        }
      }
      set({ showTutorial: false });
    },

    nextTutorialStep: () => {
      const { tutorialStep, totalSteps, closeTutorial } = get();
      if (tutorialStep >= totalSteps - 1) {
        closeTutorial();
      } else {
        set({ tutorialStep: tutorialStep + 1 });
      }
    },

    prevTutorialStep: () => {
      const { tutorialStep } = get();
      if (tutorialStep > 0) {
        set({ tutorialStep: tutorialStep - 1 });
      }
    },

    setTutorialStep: (step) => {
      const { totalSteps } = get();
      if (step >= 0 && step < totalSteps) {
        set({ tutorialStep: step });
      }
    },
  };
});
