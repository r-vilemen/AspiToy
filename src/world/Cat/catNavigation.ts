import type { Vector2D } from '@/types/robot';
import type { RoomId } from '@/types/house';
import type { ObstacleDetector } from '@/agent/navigation/ObstacleDetector';
import { globalRoomGraph } from '@/agent/navigation/RoomGraph';
import { robotMotionBridge } from '@/store/robotStore';

export interface FurniturePerchSpot {
  id: string;
  name: string;
  room: RoomId;
  surfaceY: number;
  stagingPoint: Vector2D;
  perchWaypoints: Vector2D[];
}

/**
 * Catálogo rigoroso de móveis REAIS e EXISTENTES na cena 3D onde os gatos podem subir.
 * Todas as coordenadas de superfície e pontos de acesso foram extraídas dos modelos 3D físicos,
 * eliminando saltos no vazio, posições no ar ou sobreposição com paredes.
 */
export const ALL_HOUSE_CAT_PERCHES: FurniturePerchSpot[] = [
  // --- 1. QUARTO (Ambiente de Preferência Feline) ---
  {
    id: 'sofa-main',
    name: 'Sofá Baú Estofado (Quarto)',
    room: 'bedroom',
    surfaceY: 0.89,
    stagingPoint: { x: 0.0, z: 1.8 },
    perchWaypoints: [
      { x: -0.6, z: 2.6 },
      { x: 0.0, z: 2.6 },
      { x: 0.6, z: 2.6 },
    ],
  },
  {
    id: 'armchair-green',
    name: 'Poltrona Verde Acolchoada (Quarto)',
    room: 'bedroom',
    surfaceY: 0.87,
    stagingPoint: { x: 0.2, z: -0.9 },
    perchWaypoints: [{ x: 0.95, z: -1.05 }],
  },
  {
    id: 'ottoman-cushion',
    name: 'Pufe Estofado (Quarto)',
    room: 'bedroom',
    surfaceY: 0.71,
    stagingPoint: { x: 0.55, z: 0.75 },
    perchWaypoints: [{ x: 1.05, z: 0.75 }],
  },
  {
    id: 'coffee-table',
    name: 'Mesa de Centro de Madeira (Quarto)',
    room: 'bedroom',
    surfaceY: 0.68,
    stagingPoint: { x: -1.45, z: -0.4 },
    perchWaypoints: [{ x: -1.45, z: -1.15 }],
  },

  // --- 2. SALA DE ESTAR ---
  {
    id: 'living-sofa-chaise',
    name: 'Chaise do Sofá da Sala',
    room: 'living-room',
    surfaceY: 0.58,
    stagingPoint: { x: 14.4, z: -0.1 },
    perchWaypoints: [
      { x: 15.6, z: -0.1 },
      { x: 15.6, z: 0.4 },
    ],
  },
  {
    id: 'living-sofa-main',
    name: 'Assento do Sofá Principal da Sala',
    room: 'living-room',
    surfaceY: 0.58,
    stagingPoint: { x: 13.2, z: 0.2 },
    perchWaypoints: [
      { x: 12.0, z: 1.2 },
      { x: 13.2, z: 1.2 },
    ],
  },

  // --- 3. CORREDOR ---
  {
    id: 'hallway-console',
    name: 'Aparador Vintage do Corredor',
    room: 'hallway',
    surfaceY: 1.09,
    stagingPoint: { x: 6.0, z: -1.8 },
    perchWaypoints: [{ x: 5.35, z: -1.8 }],
  },

  // --- 4. COZINHA ---
  {
    id: 'kitchen-island',
    name: 'Tampo de Madeira da Ilha da Cozinha',
    room: 'kitchen',
    surfaceY: 1.22,
    stagingPoint: { x: 12.8, z: 3.3 },
    perchWaypoints: [{ x: 12.8, z: 4.4 }],
  },
  {
    id: 'kitchen-stool',
    name: 'Banqueta de Madeira da Ilha',
    room: 'kitchen',
    surfaceY: 0.85,
    stagingPoint: { x: 12.05, z: 2.7 },
    perchWaypoints: [{ x: 12.05, z: 3.5 }],
  },

  // --- 5. BANHEIRO ---
  {
    id: 'bathroom-hamper',
    name: 'Cesto de Roupas em Vime (Banheiro)',
    room: 'bathroom',
    surfaceY: 0.68,
    stagingPoint: { x: 6.3, z: 9.8 },
    perchWaypoints: [{ x: 5.6, z: 9.4 }],
  },
];

/**
 * Waypoints no chão para cada cômodo da residência.
 * 100% verificados contra colisão com móveis, chuveiros, balcões e alvenaria.
 */
export const HOUSE_CAT_WAYPOINTS_BY_ROOM: Record<RoomId, Vector2D[]> = {
  bedroom: [
    { x: -0.6, z: 0.1 }, // Piso livre entre tapete e baú
    { x: -0.6, z: -0.4 }, // Borda do tapete circular
    { x: -1.8, z: 0.4 }, // Piso oeste em frente à cama
    { x: 2.2, z: -0.5 }, // Piso leste perto da estante
    { x: 2.4, z: 1.5 }, // Canto sudeste ensolarado do quarto
    { x: -2.8, z: 0.0 }, // Piso livre entre mesa e brinquedos
    { x: 0.0, z: 1.2 }, // Ponto central em frente ao baú
    { x: 3.2, z: 2.2 }, // Acesso à porta de saída do quarto
  ],
  hallway: [
    { x: 6.3, z: -0.5 }, // Início do corredor (norte)
    { x: 6.3, z: 1.5 }, // Em frente à porta do quarto
    { x: 6.3, z: 3.2 }, // Meio do corredor
    { x: 6.3, z: 5.0 }, // Em frente à porta da cozinha
    { x: 6.3, z: 7.2 }, // Em frente à porta do banheiro
  ],
  'living-room': [
    { x: 9.5, z: -0.5 }, // Piso livre entre arco e mesa de centro
    { x: 9.5, z: 1.2 }, // Piso oeste da sala
    { x: 10.5, z: -1.8 }, // Piso em frente à estante de livros
    { x: 12.8, z: -2.0 }, // Piso entre mesa e TV
    { x: 15.2, z: -2.0 }, // Canto próximo à planta
    { x: 13.8, z: 2.4 }, // Piso sul conectando à cozinha
  ],
  kitchen: [
    { x: 9.5, z: 4.8 }, // Entrada da cozinha
    { x: 9.5, z: 6.2 }, // Piso entre geladeira e ilha
    { x: 12.8, z: 6.2 }, // Piso livre entre ilha e fogão
    { x: 15.5, z: 6.0 }, // Piso livre leste da ilha
    { x: 14.8, z: 4.2 }, // Circulação nordeste da cozinha
  ],
  bathroom: [
    { x: 6.3, z: 9.8 }, // Tapete do banheiro (entrada)
    { x: 7.8, z: 10.2 }, // Piso central em frente à pia
    { x: 8.0, z: 11.5 }, // Piso livre entre box e sanitário
    { x: 8.8, z: 10.5 }, // Frente do gabinete
  ],
};

/**
 * Escolhe um cômodo de destino com preferência expressiva pelo Quarto (~60% de probabilidade).
 * Se o gato já passou vários ciclos fora do quarto, o retorno ao quarto é acelerado (85%).
 */
export function pickWeightedCatRoom(outsideBedroomSteps = 0): RoomId {
  const bedroomChance = outsideBedroomSteps >= 2 ? 0.85 : 0.6;
  if (Math.random() < bedroomChance) {
    return 'bedroom';
  }

  const otherRooms: RoomId[] = ['hallway', 'living-room', 'kitchen', 'bathroom'];
  return otherRooms[Math.floor(Math.random() * otherRooms.length)];
}

/**
 * Escolhe um poleiro/móvel real com forte preferência pelo quarto.
 */
export function pickWeightedCatPerch(outsideBedroomSteps = 0): FurniturePerchSpot {
  const targetRoom = pickWeightedCatRoom(outsideBedroomSteps);
  const roomPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === targetRoom);

  if (roomPerches.length > 0) {
    return roomPerches[Math.floor(Math.random() * roomPerches.length)];
  }

  const bedroomPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'bedroom');
  return bedroomPerches[Math.floor(Math.random() * bedroomPerches.length)];
}

/**
 * Escolhe um ponto válido no chão sem colisão com móveis ou paredes e mantendo distância segura do robô.
 */
export function pickWeightedCatFloorDestination(
  catObstacleDetector: ObstacleDetector,
  outsideBedroomSteps = 0
): { target: Vector2D; targetRoom: RoomId } {
  const targetRoom = pickWeightedCatRoom(outsideBedroomSteps);
  const candidates =
    HOUSE_CAT_WAYPOINTS_BY_ROOM[targetRoom] ||
    HOUSE_CAT_WAYPOINTS_BY_ROOM.bedroom;

  const valid = candidates.filter((pt) => {
    const distToRobot = Math.hypot(
      pt.x - robotMotionBridge.x,
      pt.z - robotMotionBridge.z
    );
    return !catObstacleDetector.isColliding(pt, 0.28) && distToRobot > 0.75;
  });

  if (valid.length > 0) {
    return {
      target: valid[Math.floor(Math.random() * valid.length)],
      targetRoom,
    };
  }

  return {
    target: { x: -0.6, z: 0.1 },
    targetRoom: 'bedroom',
  };
}

/**
 * Planeja a rota intercômodos para o gato através dos vãos das portas abertas.
 */
export function planCatRoute(
  currentPos: Vector2D,
  destination: Vector2D
): Vector2D[] {
  const plan = globalRoomGraph.planMultiRoomNavigation(currentPos, destination);
  if (plan && plan.doorwayWaypoints.length > 0) {
    return [...plan.doorwayWaypoints, destination];
  }
  return [destination];
}
