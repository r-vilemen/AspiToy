import { create } from 'zustand';
import type {
  DustSpot,
  EnvironmentObstacle,
  RoomDimensions,
  RoomRegion,
} from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { isPointInsideBounds } from '@/utils/coordinates';

export const INITIAL_DOCK_POSITION: Vector2D = { x: -3.8, z: -3.2 };

export const INITIAL_ROOM_DIMENSIONS: RoomDimensions = {
  width: 10,
  depth: 8,
  wallHeight: 3.2,
};

export const INITIAL_REGIONS: RoomRegion[] = [
  {
    id: 'all',
    label: 'Sala Completa',
    description: 'Cobertura integral da sala de estar',
    bounds: { minX: -4.6, maxX: 4.6, minZ: -3.6, maxZ: 3.6 },
    center: { x: 0, z: 0 },
  },
  {
    id: 'living-center',
    label: 'Tapete Central',
    description: 'Área de convivência entre o sofá e a mesa de centro',
    bounds: { minX: -2.2, maxX: 2.2, minZ: -1.6, maxZ: 1.8 },
    center: { x: 0, z: 0.2 },
  },
  {
    id: 'reading-nook',
    label: 'Canto da Janela',
    description: 'Zona iluminada próxima às janelas e plantas',
    bounds: { minX: 1.8, maxX: 4.5, minZ: -3.5, maxZ: 2.5 },
    center: { x: 3.1, z: -0.5 },
  },
  {
    id: 'media-zone',
    label: 'Área da Estante',
    description: 'Corredor frontal próximo ao rack e base de recarga',
    bounds: { minX: -4.5, maxX: 1.5, minZ: -3.5, maxZ: -1.2 },
    center: { x: -1.5, z: -2.4 },
  },
];

export const INITIAL_OBSTACLES: EnvironmentObstacle[] = [
  {
    id: 'sofa-main',
    label: 'Sofá de Linho',
    category: 'furniture',
    bounds: { minX: -2.1, maxX: 2.1, minZ: 1.8, maxZ: 3.2 },
    collidable: true,
    height: 0.9,
  },
  {
    id: 'coffee-table',
    label: 'Mesa de Centro',
    category: 'furniture',
    bounds: { minX: -1.1, maxX: 1.1, minZ: -0.4, maxZ: 0.7 },
    collidable: true,
    height: 0.45,
  },
  {
    id: 'media-console',
    label: 'Estante Principal',
    category: 'furniture',
    bounds: { minX: -1.8, maxX: 1.8, minZ: -3.85, maxZ: -3.1 },
    collidable: true,
    height: 1.4,
  },
  {
    id: 'plant-monstera',
    label: 'Vaso Decorativo',
    category: 'decor',
    bounds: { minX: 3.2, maxX: 4.1, minZ: -3.2, maxZ: -2.3 },
    collidable: true,
    height: 1.2,
  },
  {
    id: 'charging-dock',
    label: 'Base de Carregamento',
    category: 'dock',
    bounds: { minX: -4.2, maxX: -3.4, minZ: -3.75, maxZ: -2.9 },
    collidable: false,
    height: 0.35,
  },
];

const INITIAL_DUST_SPOTS: DustSpot[] = [
  { id: 'dust-1', position: { x: -2.4, z: -0.8 }, radius: 0.45, intensity: 0.9, regionId: 'living-center' },
  { id: 'dust-2', position: { x: 0.2, z: 1.15 }, radius: 0.4, intensity: 0.85, regionId: 'living-center' },
  { id: 'dust-3', position: { x: 2.6, z: -1.1 }, radius: 0.5, intensity: 1.0, regionId: 'reading-nook' },
  { id: 'dust-4', position: { x: 3.1, z: 1.4 }, radius: 0.42, intensity: 0.8, regionId: 'reading-nook' },
  { id: 'dust-5', position: { x: -1.8, z: -2.1 }, radius: 0.4, intensity: 0.75, regionId: 'media-zone' },
];

export interface EnvironmentStoreState {
  roomDimensions: RoomDimensions;
  dockPosition: Vector2D;
  regions: RoomRegion[];
  obstacles: EnvironmentObstacle[];
  dustSpots: DustSpot[];
  selectedRegionId: string;
  setSelectedRegion: (regionId: string) => void;
  resolveRegionAtPoint: (point: Vector2D) => RoomRegion;
  cleanDustNearPoint: (point: Vector2D, reachRadius?: number, power?: number) => number;
  resetEnvironment: () => void;
}

export const useEnvironmentStore = create<EnvironmentStoreState>((set, get) => ({
  roomDimensions: INITIAL_ROOM_DIMENSIONS,
  dockPosition: INITIAL_DOCK_POSITION,
  regions: INITIAL_REGIONS,
  obstacles: INITIAL_OBSTACLES,
  dustSpots: INITIAL_DUST_SPOTS,
  selectedRegionId: 'all',

  setSelectedRegion: (regionId) => {
    const exists = get().regions.some((r) => r.id === regionId);
    if (exists) {
      set({ selectedRegionId: regionId });
    }
  },

  resolveRegionAtPoint: (point) => {
    const { regions } = get();
    const specific = regions.find(
      (region) => region.id !== 'all' && isPointInsideBounds(point, region.bounds)
    );
    return specific ?? regions[0];
  },

  cleanDustNearPoint: (point, reachRadius = 0.55, power = 0.35) => {
    const { dustSpots } = get();
    let changed = false;

    const updated = dustSpots.map((spot) => {
      if (spot.intensity <= 0) return spot;
      const dist = Math.hypot(spot.position.x - point.x, spot.position.z - point.z);
      if (dist <= reachRadius + spot.radius * 0.5) {
        changed = true;
        const nextIntensity = Math.max(0, Number((spot.intensity - power).toFixed(2)));
        return { ...spot, intensity: nextIntensity };
      }
      return spot;
    });

    if (changed) {
      set({ dustSpots: updated });
    }

    const totalInitial = updated.length;
    if (totalInitial === 0) return 100;
    const remaining = updated.reduce((acc, spot) => acc + spot.intensity, 0);
    const cleanedRatio = 1 - remaining / totalInitial;
    return Math.round(Math.min(100, Math.max(0, cleanedRatio * 100)));
  },

  resetEnvironment: () =>
    set({
      dustSpots: INITIAL_DUST_SPOTS.map((spot) => ({ ...spot })),
      selectedRegionId: 'all',
    }),
}));

