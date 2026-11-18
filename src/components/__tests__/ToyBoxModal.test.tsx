import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ToyBoxModal } from '../ui/ToyBoxModal';
import { useRobotStore } from '@/store/robotStore';

describe('Oficina Toy Box e Preview do Robô', () => {
  beforeEach(() => {
    useRobotStore.getState().resetRobot();
  });

  it('renderiza o modal da oficina com preview lateral e catálogo de skins livres', () => {
    render(<ToyBoxModal isOpen={true} onClose={() => {}} />);

    // Deve exibir o cabeçalho
    expect(screen.getByText('Oficina Toy Box')).toBeDefined();
    expect(screen.getByText(/LIVRE ESCOLHA/i)).toBeDefined();

    // Deve renderizar a área de preview na lateral
    expect(screen.getByTestId('robot-3d-preview')).toBeDefined();
    expect(screen.getByText(/Preview 3D/i)).toBeDefined();

    // NÃO deve exibir a barra de Área Total Higienizada
    expect(screen.queryByText(/Área Total Higienizada/i)).toBeNull();

    // Deve listar todas as skins disponíveis para escolha
    expect(screen.getAllByText('AspiToy Clássico').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Patrulheiro Espacial')).toBeDefined();
    expect(screen.getByText('Xerife do Quarto')).toBeDefined();
    expect(screen.getByText('Cyber Translúcido')).toBeDefined();
  });

  it('permite equipar qualquer skin diretamente sem ter limpado nada', () => {
    // Área limpa é 0m²
    expect(useRobotStore.getState().cleanedAreaM2).toBe(0);

    render(<ToyBoxModal isOpen={true} onClose={() => {}} />);

    // Clica no card do Patrulheiro Espacial
    const rangerCard = screen.getByText('Patrulheiro Espacial');
    fireEvent.click(rangerCard);

    // Clica em Equipar Esta Pintura no botão de ação do preview
    const equipBtn = screen.getByRole('button', { name: /Equipar Esta Pintura/i });
    fireEvent.click(equipBtn);

    // A skin deve ter sido equipada no robô
    expect(useRobotStore.getState().skin).toBe('space-ranger');
  });
});
