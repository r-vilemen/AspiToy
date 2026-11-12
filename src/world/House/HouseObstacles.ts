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
    bounds: { minX: -1.44, maxX: 1.44, minZ: 2.05, maxZ: 3.15 },
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
    bounds: { minX: -2.21, maxX: -2.13, minZ: -1.63, maxZ: -1.55 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'coffee-table-leg-ne',
    label: 'Pé da Mesa (Nordeste)',
    category: 'furniture',
    bounds: { minX: -0.77, maxX: -0.69, minZ: -1.63, maxZ: -1.55 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'coffee-table-leg-sw',
    label: 'Pé da Mesa (Sudoeste)',
    category: 'furniture',
    bounds: { minX: -2.21, maxX: -2.13, minZ: -0.75, maxZ: -0.67 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'coffee-table-leg-se',
    label: 'Pé da Mesa (Sudeste)',
    category: 'furniture',
    bounds: { minX: -0.77, maxX: -0.69, minZ: -0.75, maxZ: -0.67 },
    collidable: true,
    height: 0.65,
  },
  {
    id: 'grey-block',
    label: 'Bloco Cinza',
    category: 'decor',
    bounds: { minX: 0.66, maxX: 1.44, minZ: 0.36, maxZ: 1.14 },
    collidable: true,
    height: 0.72,
  },
  {
    id: 'media-console',
    label: 'Gabinete da TV CRT',
    category: 'furniture',
    bounds: { minX: -4.15, maxX: -2.05, minZ: -3.7, maxZ: -2.6 },
    collidable: true,
    height: 2.4,
  },
  {
    id: 'fireplace-hearth',
    label: 'Lareira Clássica',
    category: 'furniture',
    bounds: { minX: -1.12, maxX: 0.72, minZ: -4.0, maxZ: -3.63 },
    collidable: true,
    height: 1.95,
  },
  {
    id: 'bookcase-east',
    label: 'Estante e Cômoda',
    category: 'furniture',
    bounds: { minX: 3.68, maxX: 4.66, minZ: -3.28, maxZ: 0.33 },
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
    id: 'wall-hallway-west-south',
    label: 'Parede Corredor Oeste (Sul Completo)',
    category: 'wall',
    bounds: { minX: 4.88, maxX: 5.12, minZ: 3.05, maxZ: 8.55 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bedroom-south',
    label: 'Parede Sul do Quarto',
    category: 'wall',
    bounds: { minX: -5.1, maxX: 5.1, minZ: 3.92, maxZ: 4.15 },
    collidable: true,
    height: 4.6,
  },

  // Parede Norte (Corredor e Sala de Estar, Z = -4.0m)
  {
    id: 'wall-house-north-extended',
    label: 'Parede Norte da Casa',
    category: 'wall',
    bounds: { minX: 5.0, maxX: 17.75, minZ: -4.15, maxZ: -3.92 },
    collidable: true,
    height: 4.6,
  },

  // Parede Leste Externa (X = 17.6m, Z de -4.0 a 8.5m)
  {
    id: 'wall-house-east-outer',
    label: 'Parede Leste Externa',
    category: 'wall',
    bounds: { minX: 17.52, maxX: 17.75, minZ: -4.0, maxZ: 8.6 },
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
    bounds: { minX: 7.48, maxX: 7.72, minZ: 6.65, maxZ: 8.55 },
    collidable: true,
    height: 4.6,
  },

  // Divisória / Balcão entre Sala de Estar e Cozinha (Z = 3.2m, X in [7.6, 12.0])
  {
    id: 'wall-counter-living-kitchen',
    label: 'Balcão Divisor Sala/Cozinha',
    category: 'furniture',
    bounds: { minX: 7.6, maxX: 12.0, minZ: 3.06, maxZ: 3.34 },
    collidable: true,
    height: 1.15,
  },

  // Parede Sul da Cozinha (Z = 8.5m, X in [10.6, 17.6])
  {
    id: 'wall-kitchen-south',
    label: 'Parede Sul da Cozinha',
    category: 'wall',
    bounds: { minX: 10.6, maxX: 17.75, minZ: 8.42, maxZ: 8.65 },
    collidable: true,
    height: 4.6,
  },

  // Parede Norte do Banheiro (Z = 8.5m) - Vão da Porta em X in [5.65, 6.95]
  {
    id: 'wall-bathroom-north-west',
    label: 'Parede Banheiro (Norte Oeste)',
    category: 'wall',
    bounds: { minX: 4.9, maxX: 5.65, minZ: 8.38, maxZ: 8.52 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bathroom-north-east',
    label: 'Parede Banheiro (Norte Leste)',
    category: 'wall',
    bounds: { minX: 6.95, maxX: 10.75, minZ: 8.38, maxZ: 8.52 },
    collidable: true,
    height: 4.6,
  },

  // Paredes Oeste, Sul e Leste do Banheiro
  {
    id: 'wall-bathroom-west',
    label: 'Parede Oeste do Banheiro',
    category: 'wall',
    bounds: { minX: 4.85, maxX: 5.02, minZ: 8.5, maxZ: 13.65 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bathroom-south',
    label: 'Parede Sul do Banheiro',
    category: 'wall',
    bounds: { minX: 4.9, maxX: 10.75, minZ: 13.48, maxZ: 13.65 },
    collidable: true,
    height: 4.6,
  },
  {
    id: 'wall-bathroom-east',
    label: 'Parede Leste do Banheiro',
    category: 'wall',
    bounds: { minX: 10.58, maxX: 10.75, minZ: 8.5, maxZ: 13.65 },
    collidable: true,
    height: 4.6,
  },
];

/**
 * Mobiliário Sólido dos Novos Cômodos (Sala, Cozinha, Banheiro e Corredor):
 */
export const NEW_ROOMS_FURNITURE_OBSTACLES: EnvironmentObstacle[] = [
  // --- CORREDOR ---
  // Aparador vintage elevado (vão livre inferior de 74cm - o robô passa livremente por baixo entre os pés)
  {
    id: 'hallway-console-leg-nw',
    label: 'Pé do Aparador (Noroeste)',
    category: 'furniture',
    bounds: { minX: 5.15, maxX: 5.23, minZ: -2.39, maxZ: -2.31 },
    collidable: true,
    height: 1.1,
  },
  {
    id: 'hallway-console-leg-ne',
    label: 'Pé do Aparador (Nordeste)',
    category: 'furniture',
    bounds: { minX: 5.47, maxX: 5.55, minZ: -2.39, maxZ: -2.31 },
    collidable: true,
    height: 1.1,
  },
  {
    id: 'hallway-console-leg-sw',
    label: 'Pé do Aparador (Sudoeste)',
    category: 'furniture',
    bounds: { minX: 5.15, maxX: 5.23, minZ: -1.29, maxZ: -1.21 },
    collidable: true,
    height: 1.1,
  },
  {
    id: 'hallway-console-leg-se',
    label: 'Pé do Aparador (Sudeste)',
    category: 'furniture',
    bounds: { minX: 5.47, maxX: 5.55, minZ: -1.29, maxZ: -1.21 },
    collidable: true,
    height: 1.1,
  },

  // --- SALA DE ESTAR ---
  // Sofá em L com 26cm de vão livre abaixo (o robô entra e limpa toda a poeira debaixo do sofá)
  // Pés frontais (Z = 0.68m):
  {
    id: 'sofa-leg-f1',
    label: 'Pé do Sofá Frontal 1',
    category: 'furniture',
    bounds: { minX: 11.17, maxX: 11.27, minZ: 0.63, maxZ: 0.73 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'sofa-leg-f2',
    label: 'Pé do Sofá Frontal 2',
    category: 'furniture',
    bounds: { minX: 12.50, maxX: 12.60, minZ: 0.63, maxZ: 0.73 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'sofa-leg-f3',
    label: 'Pé do Sofá Frontal 3',
    category: 'furniture',
    bounds: { minX: 13.85, maxX: 13.95, minZ: 0.63, maxZ: 0.73 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'sofa-leg-f4',
    label: 'Pé do Sofá Frontal 4',
    category: 'furniture',
    bounds: { minX: 14.97, maxX: 15.07, minZ: 0.63, maxZ: 0.73 },
    collidable: true,
    height: 0.8,
  },
  // Pés traseiros (Z = 1.72m):
  {
    id: 'sofa-leg-b1',
    label: 'Pé do Sofá Traseiro 1',
    category: 'furniture',
    bounds: { minX: 11.17, maxX: 11.27, minZ: 1.67, maxZ: 1.77 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'sofa-leg-b2',
    label: 'Pé do Sofá Traseiro 2',
    category: 'furniture',
    bounds: { minX: 12.50, maxX: 12.60, minZ: 1.67, maxZ: 1.77 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'sofa-leg-b3',
    label: 'Pé do Sofá Traseiro 3',
    category: 'furniture',
    bounds: { minX: 13.85, maxX: 13.95, minZ: 1.67, maxZ: 1.77 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'sofa-leg-b4',
    label: 'Pé do Sofá Traseiro 4',
    category: 'furniture',
    bounds: { minX: 14.97, maxX: 15.07, minZ: 1.67, maxZ: 1.77 },
    collidable: true,
    height: 0.8,
  },

  // Chaise do Sofá com 26cm de vão livre abaixo
  {
    id: 'chaise-leg-front-w',
    label: 'Pé da Chaise (Frontal Oeste)',
    category: 'furniture',
    bounds: { minX: 15.07, maxX: 15.17, minZ: -0.97, maxZ: -0.87 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'chaise-leg-front-e',
    label: 'Pé da Chaise (Frontal Leste)',
    category: 'furniture',
    bounds: { minX: 16.03, maxX: 16.13, minZ: -0.97, maxZ: -0.87 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'chaise-leg-mid-e',
    label: 'Pé da Chaise (Lateral Leste)',
    category: 'furniture',
    bounds: { minX: 16.03, maxX: 16.13, minZ: -0.10, maxZ: 0.00 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'chaise-leg-back-e',
    label: 'Pé da Chaise (Traseiro Leste)',
    category: 'furniture',
    bounds: { minX: 16.03, maxX: 16.13, minZ: 0.67, maxZ: 0.77 },
    collidable: true,
    height: 0.8,
  },
  {
    id: 'chaise-leg-back-w',
    label: 'Pé da Chaise (Traseiro Oeste)',
    category: 'furniture',
    bounds: { minX: 15.07, maxX: 15.17, minZ: 0.67, maxZ: 0.77 },
    collidable: true,
    height: 0.8,
  },

  // Mesa de Centro da Sala com 20cm de vão livre abaixo (o robô passa por baixo)
  {
    id: 'living-coffee-table-leg-nw',
    label: 'Pé da Mesa de Centro (Noroeste)',
    category: 'furniture',
    bounds: { minX: 11.91, maxX: 11.99, minZ: -1.16, maxZ: -1.08 },
    collidable: true,
    height: 0.45,
  },
  {
    id: 'living-coffee-table-leg-ne',
    label: 'Pé da Mesa de Centro (Nordeste)',
    category: 'furniture',
    bounds: { minX: 13.61, maxX: 13.69, minZ: -1.16, maxZ: -1.08 },
    collidable: true,
    height: 0.45,
  },
  {
    id: 'living-coffee-table-leg-sw',
    label: 'Pé da Mesa de Centro (Sudoeste)',
    category: 'furniture',
    bounds: { minX: 11.91, maxX: 11.99, minZ: -0.32, maxZ: -0.24 },
    collidable: true,
    height: 0.45,
  },
  {
    id: 'living-coffee-table-leg-se',
    label: 'Pé da Mesa de Centro (Sudeste)',
    category: 'furniture',
    bounds: { minX: 13.61, maxX: 13.69, minZ: -0.32, maxZ: -0.24 },
    collidable: true,
    height: 0.45,
  },
  {
    id: 'living-tv-rack',
    label: 'Rack com TV CRT',
    category: 'furniture',
    bounds: { minX: 11.1, maxX: 14.5, minZ: -3.83, maxZ: -3.08 },
    collidable: true,
    height: 2.2,
  },
  {
    id: 'living-bookcase',
    label: 'Estante de Livros da Sala',
    category: 'furniture',
    bounds: { minX: 8.38, maxX: 10.02, minZ: -3.81, maxZ: -3.29 },
    collidable: true,
    height: 3.4,
  },
  {
    id: 'living-plant-pot',
    label: 'Vaso de Planta Ficus',
    category: 'decor',
    bounds: { minX: 16.22, maxX: 16.98, minZ: -3.58, maxZ: -2.82 },
    collidable: true,
    height: 1.8,
  },

  // --- COZINHA ---
  {
    id: 'kitchen-fridge',
    label: 'Geladeira Retrô',
    category: 'furniture',
    bounds: { minX: 7.82, maxX: 8.98, minZ: 7.08, maxZ: 8.18 },
    collidable: true,
    height: 2.7,
  },
  {
    id: 'kitchen-stove',
    label: 'Fogão 4 Bocas',
    category: 'furniture',
    bounds: { minX: 10.65, maxX: 11.75, minZ: 7.23, maxZ: 8.18 },
    collidable: true,
    height: 1.5,
  },
  {
    id: 'kitchen-counter',
    label: 'Bancada e Pia em L',
    category: 'furniture',
    bounds: { minX: 13.1, maxX: 16.5, minZ: 7.23, maxZ: 8.18 },
    collidable: true,
    height: 1.25,
  },
  {
    id: 'kitchen-island',
    label: 'Ilha da Cozinha (Balcão Central)',
    category: 'furniture',
    bounds: { minX: 11.5, maxX: 14.1, minZ: 3.85, maxZ: 4.95 },
    collidable: true,
    height: 1.25,
  },
  {
    id: 'kitchen-stool-west',
    label: 'Cadeira / Banqueta da Ilha (Oeste)',
    category: 'furniture',
    bounds: { minX: 11.83, maxX: 12.27, minZ: 3.28, maxZ: 3.72 },
    collidable: true,
    height: 0.85,
  },
  {
    id: 'kitchen-stool-east',
    label: 'Cadeira / Banqueta da Ilha (Leste)',
    category: 'furniture',
    bounds: { minX: 13.33, maxX: 13.77, minZ: 3.28, maxZ: 3.72 },
    collidable: true,
    height: 0.85,
  },
  {
    id: 'kitchen-trash',
    label: 'Lixeira de Pedal',
    category: 'furniture',
    bounds: { minX: 16.59, maxX: 17.01, minZ: 6.54, maxZ: 7.01 },
    collidable: true,
    height: 0.6,
  },

  // --- BANHEIRO ---
  {
    id: 'bathroom-shower-box',
    label: 'Box de Vidro com Chuveiro',
    category: 'furniture',
    bounds: { minX: 5.0, maxX: 7.15, minZ: 11.24, maxZ: 13.5 },
    collidable: true,
    height: 3.0,
  },
  {
    id: 'bathroom-toilet',
    label: 'Vaso Sanitário',
    category: 'furniture',
    bounds: { minX: 9.48, maxX: 10.12, minZ: 12.42, maxZ: 13.28 },
    collidable: true,
    height: 1.0,
  },
  {
    id: 'bathroom-vanity',
    label: 'Gabinete e Pia do Banheiro',
    category: 'furniture',
    bounds: { minX: 9.42, maxX: 10.18, minZ: 9.17, maxZ: 10.43 },
    collidable: true,
    height: 1.2,
  },
  {
    id: 'bathroom-hamper',
    label: 'Cesto de Roupas',
    category: 'furniture',
    bounds: { minX: 5.35, maxX: 5.85, minZ: 9.15, maxZ: 9.65 },
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
