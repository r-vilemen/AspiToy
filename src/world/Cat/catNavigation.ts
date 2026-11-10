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
 * Catálogos de todos os poleiros/móveis da casa onde os gatos podem subir,
 * esticar-se, dormir ou observar o ambiente.
 */
export const ALL_HOUSE_CAT_PERCHES: FurniturePerchSpot[] = [
  // --- QUARTO (Lugar de Preferência Felina) ---
  {
    id: 'sofa-main',
    name: 'Sofá Baú (Quarto)',
    room: 'bedroom',
    surfaceY: 0.89,
    stagingPoint: { x: 0.0, z: 1.85 },
    perchWaypoints: [
      { x: -0.65, z: 2.55 },
      { x: 0.0, z: 2.6 },
      { x: 0.65, z: 2.55 },
    ],
  },
  {
    id: 'armchair-green',
    name: 'Poltrona Verde (Quarto)',
    room: 'bedroom',
    surfaceY: 0.87,
    stagingPoint: { x: 0.15, z: -0.95 },
    perchWaypoints: [
      { x: 0.95, z: -1.0 },
      { x: 0.8, z: -0.95 },
    ],
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
    name: 'Mesa de Centro (Quarto)',
    room: 'bedroom',
    surfaceY: 0.7,
    stagingPoint: { x: -0.45, z: -1.15 },
    perchWaypoints: [
      { x: -0.95, z: -1.1 },
      { x: -1.85, z: -1.1 },
    ],
  },

  // --- SALA DE ESTAR ---
  {
    id: 'living-sofa-chaise',
    name: 'Chaise do Sofá da Sala',
    room: 'living-room',
    surfaceY: 0.6,
    stagingPoint: { x: 15.6, z: -1.1 },
    perchWaypoints: [
      { x: 15.6, z: -0.2 },
      { x: 15.6, z: 0.5 },
    ],
  },
  {
    id: 'living-coffee-table',
    name: 'Mesa de Centro da Sala',
    room: 'living-room',
    surfaceY: 0.52,
    stagingPoint: { x: 12.8, z: -0.1 },
    perchWaypoints: [
      { x: 12.8, z: -0.7 },
      { x: 12.2, z: -0.7 },
    ],
  },

  // --- CORREDOR ---
  {
    id: 'hallway-console',
    name: 'Aparador do Corredor',
    room: 'hallway',
    surfaceY: 0.55,
    stagingPoint: { x: 6.3, z: 2.8 },
    perchWaypoints: [{ x: 6.3, z: 3.5 }],
  },

  // --- COZINHA ---
  {
    id: 'kitchen-counter',
    name: 'Bancada da Cozinha',
    room: 'kitchen',
    surfaceY: 0.95,
    stagingPoint: { x: 10.5, z: 5.6 },
    perchWaypoints: [
      { x: 10.5, z: 6.8 },
      { x: 11.8, z: 6.8 },
    ],
  },
  {
    id: 'kitchen-stool',
    name: 'Banqueta da Cozinha',
    room: 'kitchen',
    surfaceY: 0.85,
    stagingPoint: { x: 12.0, z: 4.2 },
    perchWaypoints: [{ x: 12.0, z: 4.8 }],
  },

  // --- BANHEIRO ---
  {
    id: 'bathroom-vanity',
    name: 'Gabinete da Pia do Banheiro',
    room: 'bathroom',
    surfaceY: 0.88,
    stagingPoint: { x: 6.8, z: 10.2 },
    perchWaypoints: [{ x: 6.8, z: 11.5 }],
  },
];

/**
 * Waypoints no chão para cada cômodo da residência.
 */
export const HOUSE_CAT_WAYPOINTS_BY_ROOM: Record<RoomId, Vector2D[]> = {
  bedroom: [
    { x: -0.6, z: -0.9 }, // Tapete central
    { x: -1.7, z: 0.35 }, // Frente da cama
    { x: 0.1, z: -0.2 }, // Área central
    { x: 2.1, z: -0.5 }, // Perto da estante
    { x: 2.2, z: 1.3 }, // Canto da janela
    { x: -2.1, z: -2.1 }, // Canto aconchegante
    { x: -0.4, z: -2.5 }, // Painel/lareira
    { x: -2.3, z: 0.6 }, // Lado da cômoda
    { x: -3.2, z: 1.8 }, // Área dos brinquedos
    { x: 3.6, z: 2.2 }, // Próximo à porta do quarto
  ],
  hallway: [
    { x: 6.3, z: 1.5 }, // Início do corredor
    { x: 6.3, z: 3.2 }, // Em frente ao quarto
    { x: 6.3, z: 5.0 }, // Meio do corredor
    { x: 6.3, z: 6.8 }, // Frente da cozinha
    { x: 6.3, z: 8.0 }, // Entrada do banheiro
  ],
  'living-room': [
    { x: 12.8, z: 0.2 }, // Tapete da sala
    { x: 10.5, z: -1.8 }, // Perto da estante de livros
    { x: 14.5, z: -1.5 }, // Perto da planta ornamental
    { x: 11.2, z: 1.2 }, // Frente do sofá
    { x: 13.8, z: 1.8 }, // Canto do abajur
    { x: 12.8, z: -2.2 }, // Frente do rack de TV
  ],
  kitchen: [
    { x: 10.5, z: 5.5 }, // Balcão
    { x: 12.8, z: 6.2 }, // Ilha central
    { x: 15.2, z: 5.8 }, // Geladeira retrô
    { x: 13.5, z: 7.2 }, // Mesa de refeições
    { x: 9.8, z: 4.8 }, // Próximo à porta da cozinha
  ],
  bathroom: [
    { x: 6.3, z: 9.8 }, // Tapete do banheiro
    { x: 8.2, z: 10.5 }, // Frente da pia
    { x: 6.5, z: 12.0 }, // Box de vidro
    { x: 7.5, z: 11.2 }, // Cesto de roupas
  ],
};

/**
 * Escolhe um cômodo de destino com preferência expressiva pelo Quarto (~60% de probabilidade).
 * Se o gato já passou vários ciclos fora do quarto, o retorno ao quarto é acelerado (85%).
 */
export function pickWeightedCatRoom(outsideBedroomSteps = 0): RoomId {
  // Probabilidade do quarto: base 60%, sobe para 85% se já caminhou 2+ vezes fora
  const bedroomChance = outsideBedroomSteps >= 2 ? 0.85 : 0.6;
  if (Math.random() < bedroomChance) {
    return 'bedroom';
  }

  // Se não for quarto, distribui igualmente entre os outros cômodos
  const otherRooms: RoomId[] = ['hallway', 'living-room', 'kitchen', 'bathroom'];
  return otherRooms[Math.floor(Math.random() * otherRooms.length)];
}

/**
 * Escolhe um poleiro/móvel com forte preferência pelo quarto.
 */
export function pickWeightedCatPerch(outsideBedroomSteps = 0): FurniturePerchSpot {
  const targetRoom = pickWeightedCatRoom(outsideBedroomSteps);
  const roomPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === targetRoom);

  if (roomPerches.length > 0) {
    return roomPerches[Math.floor(Math.random() * roomPerches.length)];
  }

  // Fallback para os poleiros do quarto
  const bedroomPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'bedroom');
  return bedroomPerches[Math.floor(Math.random() * bedroomPerches.length)];
}

/**
 * Escolhe um ponto válido no chão com preferência pelo quarto e sem colisão imediata.
 */
export function pickWeightedCatFloorDestination(
  catObstacleDetector: ObstacleDetector,
  outsideBedroomSteps = 0
): { target: Vector2D; targetRoom: RoomId } {
  const targetRoom = pickWeightedCatRoom(outsideBedroomSteps);
  const candidates = HOUSE_CAT_WAYPOINTS_BY_ROOM[targetRoom] || HOUSE_CAT_WAYPOINTS_BY_ROOM.bedroom;

  const valid = candidates.filter((pt) => {
    const distToRobot = Math.hypot(
      pt.x - robotMotionBridge.x,
      pt.z - robotMotionBridge.z
    );
    return !catObstacleDetector.isColliding(pt, 0.3) && distToRobot > 0.75;
  });

  if (valid.length > 0) {
    return {
      target: valid[Math.floor(Math.random() * valid.length)],
      targetRoom,
    };
  }

  // Fallback seguro no quarto
  return {
    target: { x: -0.6, z: -0.9 },
    targetRoom: 'bedroom',
  };
}

/**
 * Planeja a rota intercômodos para o gato, retornando a fila de waypoints a percorrer.
 * Se o destino for em outro cômodo, inclui os waypoints das portas para evitar colisão com paredes.
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
