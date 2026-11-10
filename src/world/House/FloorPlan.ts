import type { HouseFloorPlan, RoomId } from '@/types/house';
import type { Vector2D } from '@/types/robot';

export const HOUSE_FLOOR_PLAN: HouseFloorPlan = {
  totalBounds: {
    minX: -5.0,
    maxX: 17.6,
    minZ: -4.0,
    maxZ: 13.5,
  },
  rooms: {
    bedroom: {
      id: 'bedroom',
      label: 'Quarto',
      category: 'bedroom',
      description: 'Quarto original do Andy com cama, lareira e brinquedos',
      bounds: { minX: -5.0, maxX: 5.0, minZ: -4.0, maxZ: 4.0 },
      center: { x: 0, z: 0 },
      spawnPoint: { x: -4.15, z: 3.2 },
      color: '#E05A36',
      connectedDoors: ['door-bedroom-hallway'],
    },
    hallway: {
      id: 'hallway',
      label: 'Corredor',
      category: 'hallway',
      description: 'Corredor central conectando todos os cômodos da residência',
      bounds: { minX: 5.0, maxX: 7.6, minZ: -4.0, maxZ: 8.5 },
      center: { x: 6.3, z: 2.25 },
      spawnPoint: { x: 6.3, z: 2.35 },
      color: '#D97706',
      connectedDoors: [
        'door-bedroom-hallway',
        'door-hallway-living',
        'door-hallway-kitchen',
        'door-hallway-bathroom',
      ],
    },
    'living-room': {
      id: 'living-room',
      label: 'Sala de Estar',
      category: 'living',
      description: 'Sala de estar ampla com TV CRT, sofá e estante de livros',
      bounds: { minX: 7.6, maxX: 17.6, minZ: -4.0, maxZ: 3.2 },
      center: { x: 12.6, z: -0.4 },
      spawnPoint: { x: 11.5, z: -0.4 },
      color: '#0F766E',
      connectedDoors: ['door-hallway-living', 'door-living-kitchen'],
    },
    kitchen: {
      id: 'kitchen',
      label: 'Cozinha',
      category: 'kitchen',
      description: 'Cozinha com armários, bancada em L, geladeira e fogão',
      bounds: { minX: 7.6, maxX: 17.6, minZ: 3.2, maxZ: 8.5 },
      center: { x: 12.6, z: 5.85 },
      spawnPoint: { x: 12.0, z: 5.5 },
      color: '#CA8A04',
      connectedDoors: ['door-hallway-kitchen', 'door-living-kitchen'],
    },
    bathroom: {
      id: 'bathroom',
      label: 'Banheiro',
      category: 'bathroom',
      description: 'Banheiro social com box de vidro, pia, espelho e sanitário',
      bounds: { minX: 5.0, maxX: 10.6, minZ: 8.5, maxZ: 13.5 },
      center: { x: 7.8, z: 11.0 },
      spawnPoint: { x: 7.5, z: 10.2 },
      color: '#0284C7',
      connectedDoors: ['door-hallway-bathroom'],
    },
  },
  doors: [
    {
      id: 'door-bedroom-hallway',
      label: 'Porta do Quarto',
      fromRoom: 'bedroom',
      toRoom: 'hallway',
      position: { x: 5.0, z: 2.35 },
      width: 1.4,
      orientation: 'z',
      traversableBounds: {
        minX: 4.6,
        maxX: 5.4,
        minZ: 1.65,
        maxZ: 3.05,
      },
      isOpen: true,
    },
    {
      id: 'door-hallway-living',
      label: 'Entrada da Sala de Estar',
      fromRoom: 'hallway',
      toRoom: 'living-room',
      position: { x: 7.6, z: 0.5 },
      width: 1.8,
      orientation: 'z',
      traversableBounds: {
        minX: 7.2,
        maxX: 8.0,
        minZ: -0.4,
        maxZ: 1.4,
      },
      isOpen: true,
    },
    {
      id: 'door-living-kitchen',
      label: 'Passagem Sala-Cozinha',
      fromRoom: 'living-room',
      toRoom: 'kitchen',
      position: { x: 13.5, z: 3.2 },
      width: 2.5,
      orientation: 'x',
      traversableBounds: {
        minX: 12.2,
        maxX: 14.8,
        minZ: 2.8,
        maxZ: 3.6,
      },
      isOpen: true,
    },
    {
      id: 'door-hallway-kitchen',
      label: 'Entrada da Cozinha',
      fromRoom: 'hallway',
      toRoom: 'kitchen',
      position: { x: 7.6, z: 6.0 },
      width: 1.3,
      orientation: 'z',
      traversableBounds: {
        minX: 7.2,
        maxX: 8.0,
        minZ: 5.35,
        maxZ: 6.65,
      },
      isOpen: true,
    },
    {
      id: 'door-hallway-bathroom',
      label: 'Porta do Banheiro',
      fromRoom: 'hallway',
      toRoom: 'bathroom',
      position: { x: 6.3, z: 8.5 },
      width: 1.3,
      orientation: 'x',
      traversableBounds: {
        minX: 5.65,
        maxX: 6.95,
        minZ: 8.1,
        maxZ: 8.9,
      },
      isOpen: true,
    },
  ],
};

/**
 * Determina em qual cômodo um ponto (X, Z) do mundo 3D se encontra.
 */
export function getRoomAtPosition(point: Vector2D): RoomId {
  const { rooms } = HOUSE_FLOOR_PLAN;

  for (const room of Object.values(rooms)) {
    const { bounds } = room;
    if (
      point.x >= bounds.minX &&
      point.x <= bounds.maxX &&
      point.z >= bounds.minZ &&
      point.z <= bounds.maxZ
    ) {
      return room.id;
    }
  }

  // Fallback seguro caso esteja exatamente nas bordas externas
  if (point.x < 5.0 && point.z < 4.5) return 'bedroom';
  if (point.x <= 7.6 && point.z >= 8.5) return 'bathroom';
  if (point.x > 7.6 && point.z > 3.2) return 'kitchen';
  if (point.x > 7.6) return 'living-room';
  return 'hallway';
}
