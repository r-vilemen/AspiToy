import type { EnvironmentObstacle } from '@/types/environment';

/**
 * Obstáculos Originais do Quarto do AspiToy:
 * Preservados 100% integralmente com seus identificadores e bounds exatos.
 */
export const INITIAL_BEDROOM_OBSTACLES: EnvironmentObstacle[] = [
  {
    id: 'sofa-main',
    label: 'Baú de Brinquedos',
    category: 'furniture',
    bounds: { minX: -1.5, maxX: 1.5, minZ: 2.0, maxZ: 3.2 },
    collidable: true,
    height: 0.95,
  },
  {
    id: 'armchair-olive',
    label: 'Poltrona Verde',
    category: 'furniture',
    bounds: { minX: 0.4, maxX: 1.75, minZ: -1.75, maxZ: -0.35 },
    collidable: true,
    height: 1.8,
  },
  {
    id: 'coffee-table-leg-nw',
    label: 'Pé da Mesa (Noroeste)',
    category: 'furniture',
    bounds: { minX: -2.25, maxX: -2.09, minZ: -1.67, maxZ: -1.51 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'coffee-table-leg-ne',
    label: 'Pé da Mesa (Nordeste)',
    category: 'furniture',
    bounds: { minX: -0.81, maxX: -0.65, minZ: -1.67, maxZ: -1.51 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'coffee-table-leg-sw',
    label: 'Pé da Mesa (Sudoeste)',
    category: 'furniture',
    bounds: { minX: -2.25, maxX: -2.09, minZ: -0.79, maxZ: -0.63 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'coffee-table-leg-se',
    label: 'Pé da Mesa (Sudeste)',
    category: 'furniture',
    bounds: { minX: -0.81, maxX: -0.65, minZ: -0.79, maxZ: -0.63 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'grey-block',
    label: 'Bloco Cinza',
    category: 'decor',
    bounds: { minX: 0.7, maxX: 1.4, minZ: 0.4, maxZ: 1.1 },
    collidable: true,
    height: 0.72,
  },
  {
    id: 'media-console',
    label: 'Gabinete da TV CRT',
    category: 'furniture',
    bounds: { minX: -4.15, maxX: -2.25, minZ: -3.85, maxZ: -2.85 },
    collidable: true,
    height: 2.4,
  },
  {
    id: 'fireplace-hearth',
    label: 'Lareira Clássica',
    category: 'furniture',
    bounds: { minX: -1.15, maxX: 0.75, minZ: -4.0, maxZ: -3.45 },
    collidable: true,
    height: 1.95,
  },
  {
    id: 'bookcase-east',
    label: 'Estante e Cômoda',
    category: 'furniture',
    bounds: { minX: 3.65, maxX: 4.65, minZ: -2.9, maxZ: 0.4 },
    collidable: true,
    height: 3.5,
  },
  {
    id: 'toy-blocks-abc',
    label: 'Blocos ABC',
    category: 'decor',
    bounds: { minX: -3.65, maxX: -2.75, minZ: 1.25, maxZ: 1.95 },
    collidable: false,
    height: 0.32,
  },
  {
    id: 'toy-luxo-ball',
    label: 'Bola Planeta Toy',
    category: 'decor',
    bounds: { minX: -1.62, maxX: -1.14, minZ: 0.28, maxZ: 0.76 },
    collidable: false,
    height: 0.42,
  },
  {
    id: 'toy-wooden-train',
    label: 'Trenzinho Colorido',
    category: 'decor',
    bounds: { minX: 1.28, maxX: 1.96, minZ: -2.92, maxZ: -2.44 },
    collidable: false,
    height: 0.38,
  },
  {
    id: 'toy-ring-stacker',
    label: 'Torre de Argolas',
    category: 'decor',
    bounds: { minX: -1.16, maxX: -0.72, minZ: -2.92, maxZ: -2.48 },
    collidable: false,
    height: 0.48,
  },
  {
    id: 'toy-rc-buggy',
    label: 'Carrinho RC Verde',
    category: 'decor',
    bounds: { minX: 2.66, maxX: 3.34, minZ: 1.66, maxZ: 2.24 },
    collidable: false,
    height: 0.36,
  },
  {
    id: 'toy-bowling-pins',
    label: 'Pinos de Boliche',
    category: 'decor',
    bounds: { minX: -3.14, maxX: -2.56, minZ: -0.92, maxZ: -0.38 },
    collidable: false,
    height: 0.45,
  },
  {
    id: 'toy-green-bucket',
    label: 'Baldinho de Soldados',
    category: 'decor',
    bounds: { minX: 2.08, maxX: 2.62, minZ: 2.18, maxZ: 2.72 },
    collidable: false,
    height: 0.46,
  },
  {
    id: 'charging-dock-tower',
    label: 'Torre de Energia Toy-Tech',
    category: 'furniture',
    bounds: { minX: -4.8, maxX: -4.48, minZ: 2.85, maxZ: 3.55 },
    collidable: true,
    height: 0.48,
  },
  {
    id: 'charging-dock',
    label: 'Base Toy-Tech',
    category: 'dock',
    bounds: { minX: -4.55, maxX: -3.75, minZ: 2.8, maxZ: 3.6 },
    collidable: false,
    height: 0.04,
  },
];

export const INITIAL_OBSTACLES = INITIAL_BEDROOM_OBSTACLES;

/**
 * Obstáculos de Alvenaria e Paredes com vãos precisos de portas:
 * Permitem que o GridMap e o ObstacleDetector bloqueiem paredes reais
 * mas liberem completamente a passagem pelas portas.
 */
export const HOUSE_WALL_OBSTACLES: EnvironmentObstacle[] = [
  // Parede divisória Quarto / Corredor (X = 5.0m) - Vão da Porta em Z in [1.65, 3.05]
  {
    id: 'wall-bedroom-east-north',
    label: 'Parede Quarto/Corredor (Norte)',
    category: 'wall',
    bounds: { minX: 4.88, maxX: 5.12, minZ: -4.0, maxZ: 1.65 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bedroom-east-south',
    label: 'Parede Quarto/Corredor (Sul)',
    category: 'wall',
    bounds: { minX: 4.88, maxX: 5.12, minZ: 3.05, maxZ: 4.1 },
    collidable: true,
    height: 4.6,
  },

  // Parede Norte (Corredor e Sala de Estar, Z = -4.0m)
  {
    id: 'wall-house-north-extended',
    label: 'Parede Norte da Casa',
    category: 'wall',
    bounds: { minX: 5.0, maxX: 17.75, minZ: -4.15, maxZ: -3.88 },
    collidable: true,
    height: 4.6,
  },

  // Parede Leste Externa (X = 17.6m, Z de -4.0 a 8.5m)
  {
    id: 'wall-house-east-outer',
    label: 'Parede Leste Externa',
    category: 'wall',
    bounds: { minX: 17.5, maxX: 17.75, minZ: -4.0, maxZ: 8.6 },
    collidable: true,
    height: 4.6,
  },

  // Parede Divisória Corredor / Sala & Cozinha (X = 7.6m)
  // Vão da Sala em Z in [-0.4, 1.4], Vão da Cozinha em Z in [5.35, 6.65]
  {
    id: 'wall-hallway-east-1',
    label: 'Parede Corredor/Sala (Norte)',
    category: 'wall',
    bounds: { minX: 7.48, maxX: 7.72, minZ: -4.0, maxZ: -0.4 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-hallway-east-2',
    label: 'Parede Corredor/Divisória Central',
    category: 'wall',
    bounds: { minX: 7.48, maxX: 7.72, minZ: 1.4, maxZ: 5.35 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-hallway-east-3',
    label: 'Parede Corredor/Cozinha (Sul)',
    category: 'wall',
    bounds: { minX: 7.48, maxX: 7.72, minZ: 6.65, maxZ: 8.6 },
    collidable: true,
    height: 4.6,
  },

  // Divisória / Balcão entre Sala de Estar e Cozinha (Z = 3.2m, X in [7.6, 12.0])
  {
    id: 'wall-counter-living-kitchen',
    label: 'Balcão Divisor Sala/Cozinha',
    category: 'furniture',
    bounds: { minX: 7.6, maxX: 12.0, minZ: 3.05, maxZ: 3.35 },
    collidable: true,
    height: 1.15,
  },

  // Parede Sul da Cozinha (Z = 8.5m, X in [10.6, 17.6])
  {
    id: 'wall-kitchen-south',
    label: 'Parede Sul da Cozinha',
    category: 'wall',
    bounds: { minX: 10.6, maxX: 17.75, minZ: 8.4, maxZ: 8.65 },
    collidable: true,
    height: 4.6,
  },

  // Parede Norte do Banheiro (Z = 8.5m) - Vão da Porta em X in [5.65, 6.95]
  {
    id: 'wall-bathroom-north-west',
    label: 'Parede Banheiro (Norte Oeste)',
    category: 'wall',
    bounds: { minX: 4.9, maxX: 5.65, minZ: 8.38, maxZ: 8.62 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bathroom-north-east',
    label: 'Parede Banheiro (Norte Leste)',
    category: 'wall',
    bounds: { minX: 6.95, maxX: 10.75, minZ: 8.38, maxZ: 8.62 },
    collidable: true,
    height: 4.6,
  },

  // Paredes Oeste, Sul e Leste do Banheiro
  {
    id: 'wall-bathroom-west',
    label: 'Parede Oeste do Banheiro',
    category: 'wall',
    bounds: { minX: 4.85, maxX: 5.12, minZ: 8.5, maxZ: 13.65 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bathroom-south',
    label: 'Parede Sul do Banheiro',
    category: 'wall',
    bounds: { minX: 4.9, maxX: 10.75, minZ: 13.4, maxZ: 13.65 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bathroom-east',
    label: 'Parede Leste do Banheiro',
    category: 'wall',
    bounds: { minX: 10.5, maxX: 10.75, minZ: 8.5, maxZ: 13.65 },
    collidable: true,
    height: 4.6,
  },
];

/**
 * Mobiliário Sólido dos Novos Cômodos (Sala, Cozinha, Banheiro e Corredor):
 */
export const NEW_ROOMS_FURNITURE_OBSTACLES: EnvironmentObstacle[] = [
  // --- CORREDOR ---
  {
    id: 'hallway-console',
    label: 'Aparador do Corredor',
    category: 'furniture',
    bounds: { minX: 5.1, maxX: 5.6, minZ: -2.5, maxZ: -1.1 },
    collidable: true,
    height: 1.15,
  },

  // --- SALA DE ESTAR ---
  {
    id: 'living-sofa-main',
    label: 'Sofá em L da Sala',
    category: 'furniture',
    bounds: { minX: 11.0, maxX: 15.4, minZ: 0.55, maxZ: 1.85 },
    collidable: true,
    height: 1.4,
  },
  {
    id: 'living-sofa-chaise',
    label: 'Chaise do Sofá',
    category: 'furniture',
    bounds: { minX: 15.0, maxX: 16.25, minZ: -1.0, maxZ: 0.9 },
    collidable: true,
    height: 0.9,
  },
  {
    id: 'living-coffee-table',
    label: 'Mesa de Centro da Sala',
    category: 'furniture',
    bounds: { minX: 11.7, maxX: 13.9, minZ: -1.3, maxZ: -0.1 },
    collidable: true,
    height: 0.52,
  },
  {
    id: 'living-tv-rack',
    label: 'Rack com TV CRT',
    category: 'furniture',
    bounds: { minX: 11.0, maxX: 14.6, minZ: -3.9, maxZ: -3.0 },
    collidable: true,
    height: 2.2,
  },
  {
    id: 'living-bookcase',
    label: 'Estante de Livros da Sala',
    category: 'furniture',
    bounds: { minX: 8.35, maxX: 10.05, minZ: -3.9, maxZ: -3.25 },
    collidable: true,
    height: 3.4,
  },
  {
    id: 'living-plant-pot',
    label: 'Vaso de Planta Ficus',
    category: 'decor',
    bounds: { minX: 16.2, maxX: 17.0, minZ: -3.6, maxZ: -2.8 },
    collidable: true,
    height: 1.8,
  },

  // --- COZINHA ---
  {
    id: 'kitchen-fridge',
    label: 'Geladeira Retrô',
    category: 'furniture',
    bounds: { minX: 7.8, maxX: 9.0, minZ: 7.05, maxZ: 8.15 },
    collidable: true,
    height: 2.7,
  },
  {
    id: 'kitchen-stove',
    label: 'Fogão 4 Bocas',
    category: 'furniture',
    bounds: { minX: 10.6, maxX: 11.8, minZ: 7.2, maxZ: 8.2 },
    collidable: true,
    height: 1.5,
  },
  {
    id: 'kitchen-counter',
    label: 'Bancada e Pia em L',
    category: 'furniture',
    bounds: { minX: 13.0, maxX: 16.6, minZ: 7.15, maxZ: 8.25 },
    collidable: true,
    height: 1.25,
  },
  {
    id: 'kitchen-island',
    label: 'Ilha da Cozinha com Banquetas',
    category: 'furniture',
    bounds: { minX: 11.35, maxX: 14.25, minZ: 3.8, maxZ: 5.0 },
    collidable: true,
    height: 1.25,
  },
  {
    id: 'kitchen-trash',
    label: 'Lixeira de Pedal',
    category: 'furniture',
    bounds: { minX: 16.55, maxX: 17.05, minZ: 6.55, maxZ: 7.05 },
    collidable: true,
    height: 0.6,
  },

  // --- BANHEIRO ---
  {
    id: 'bathroom-shower-box',
    label: 'Box de Vidro com Chuveiro',
    category: 'furniture',
    bounds: { minX: 5.2, maxX: 7.2, minZ: 11.2, maxZ: 13.2 },
    collidable: true,
    height: 3.0,
  },
  {
    id: 'bathroom-toilet',
    label: 'Vaso Sanitário',
    category: 'furniture',
    bounds: { minX: 9.45, maxX: 10.15, minZ: 12.45, maxZ: 13.15 },
    collidable: true,
    height: 1.0,
  },
  {
    id: 'bathroom-vanity',
    label: 'Gabinete e Pia do Banheiro',
    category: 'furniture',
    bounds: { minX: 9.4, maxX: 10.2, minZ: 9.15, maxZ: 10.45 },
    collidable: true,
    height: 1.2,
  },
  {
    id: 'bathroom-hamper',
    label: 'Cesto de Roupas',
    category: 'furniture',
    bounds: { minX: 5.3, maxX: 5.9, minZ: 9.1, maxZ: 9.7 },
    collidable: true,
    height: 0.7,
  },
];

/**
 * Lista Completa de Obstáculos da Casa do AspiToy:
 */
export const ALL_HOUSE_OBSTACLES: EnvironmentObstacle[] = [
  ...INITIAL_OBSTACLES,
  ...HOUSE_WALL_OBSTACLES,
  ...NEW_ROOMS_FURNITURE_OBSTACLES,
];
