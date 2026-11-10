import { create } from 'zustand';
import type {
  CatBehaviorState,
  CatMotionBridge,
  DustSpot,
  EnvironmentObstacle,
  RoomDimensions,
  RoomRegion,
} from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { isPointInsideBounds } from '@/utils/coordinates';

export const INITIAL_DOCK_POSITION: Vector2D = { x: -0.15, z: 0.85 };

export const INITIAL_CAT_POSITION: Vector2D = { x: -1.65, z: 0.35 };

export const INITIAL_ROOM_DIMENSIONS: RoomDimensions = {
  width: 10,
  depth: 8,
  wallHeight: 4.6,
};

/**
 * Bridge mutável de 60 FPS para o Gato doméstico autônomo.
 * Permite que o robô leia a posição exata do gato em tempo real sem `setState` por frame.
 */
export const catMotionBridge: CatMotionBridge = {
  x: INITIAL_CAT_POSITION.x,
  z: INITIAL_CAT_POSITION.z,
  rotationY: 0.6,
  targetRotationY: 0.6,
  speed: 0.65,
  state: 'WALKING',
  animPhase: 0,
  stateTimer: 4.5,
  targetX: 0.1,
  targetZ: -0.4,
  radius: 0.34,
};

/**
 * Retorna o obstáculo dinâmico representando a posição instantânea do gato.
 */
export function getDynamicCatObstacle(): EnvironmentObstacle {
  const r = catMotionBridge.radius;
  return {
    id: 'dynamic-cat',
    label: 'Gato Laranja',
    category: 'pet',
    bounds: {
      minX: catMotionBridge.x - r,
      maxX: catMotionBridge.x + r,
      minZ: catMotionBridge.z - r,
      maxZ: catMotionBridge.z + r,
    },
    collidable: true,
    height: 0.42,
  };
}

export const INITIAL_REGIONS: RoomRegion[] = [
  {
    id: 'all',
    label: 'Quarto Completo',
    description: 'Cobertura integral do quarto/sala em escala gigante',
    bounds: { minX: -4.6, maxX: 4.6, minZ: -3.6, maxZ: 3.6 },
    center: { x: -0.4, z: 0.2 },
  },
  {
    id: 'living-center',
    label: 'Tapete Redondo',
    description: 'Área ensolarada entre a mesa de madeira e a poltrona verde',
    bounds: { minX: -2.4, maxX: 0.6, minZ: -2.4, maxZ: 0.4 },
    center: { x: -0.6, z: -1.1 },
  },
  {
    id: 'reading-nook',
    label: 'Lado da Estante',
    description: 'Corredor direito próximo à estante de livros e cômoda',
    bounds: { minX: 1.6, maxX: 3.6, minZ: -2.8, maxZ: 2.2 },
    center: { x: 2.5, z: 0.2 },
  },
  {
    id: 'media-zone',
    label: 'Canto da TV Tubo',
    description: 'Zona próxima ao gabinete da TV CRT, lareira e blocos ABC',
    bounds: { minX: -4.2, maxX: -0.4, minZ: -2.8, maxZ: 1.8 },
    center: { x: -2.2, z: 0.4 },
  },
];

export const INITIAL_OBSTACLES: EnvironmentObstacle[] = [
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
    id: 'coffee-table',
    label: 'Mesa de Madeira',
    category: 'furniture',
    bounds: { minX: -2.15, maxX: -0.75, minZ: -1.6, maxZ: -0.7 },
    collidable: true,
    height: 0.68,
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
    collidable: true,
    height: 0.65,
  },
  {
    id: 'toy-luxo-ball',
    label: 'Bola Estrela Toy',
    category: 'decor',
    bounds: { minX: -1.62, maxX: -1.14, minZ: 0.28, maxZ: 0.76 },
    collidable: true,
    height: 0.42,
  },
  {
    id: 'toy-wooden-train',
    label: 'Trenzinho Colorido',
    category: 'decor',
    bounds: { minX: 1.28, maxX: 1.96, minZ: -2.92, maxZ: -2.44 },
    collidable: true,
    height: 0.38,
  },
  {
    id: 'toy-ring-stacker',
    label: 'Torre de Argolas',
    category: 'decor',
    bounds: { minX: -1.16, maxX: -0.72, minZ: -2.92, maxZ: -2.48 },
    collidable: true,
    height: 0.48,
  },
  {
    id: 'toy-rc-buggy',
    label: 'Carrinho RC Verde',
    category: 'decor',
    bounds: { minX: 2.66, maxX: 3.34, minZ: 1.66, maxZ: 2.24 },
    collidable: true,
    height: 0.36,
  },
  {
    id: 'toy-bowling-pins',
    label: 'Pinos de Boliche',
    category: 'decor',
    bounds: { minX: -3.14, maxX: -2.56, minZ: -0.92, maxZ: -0.38 },
    collidable: true,
    height: 0.45,
  },
  {
    id: 'toy-green-bucket',
    label: 'Baldinho de Soldados',
    category: 'decor',
    bounds: { minX: 2.08, maxX: 2.62, minZ: 2.18, maxZ: 2.72 },
    collidable: true,
    height: 0.46,
  },
  {
    id: 'charging-dock-tower',
    label: 'Torre de Energia Toy-Tech',
    category: 'furniture',
    bounds: { minX: -3.85, maxX: -3.15, minZ: -2.0, maxZ: -1.2 },
    collidable: true,
    height: 0.48,
  },
  {
    id: 'charging-dock',
    label: 'Base Toy-Tech',
    category: 'dock',
    bounds: { minX: -0.45, maxX: 0.15, minZ: 0.55, maxZ: 1.15 },
    collidable: false,
    height: 0.02,
  },
];

const INITIAL_DUST_SPOTS: DustSpot[] = [
  { id: 'dust-1', position: { x: -0.4, z: 0.2 }, radius: 0.48, intensity: 0.95, regionId: 'living-center' },
  { id: 'dust-2', position: { x: -0.2, z: -1.35 }, radius: 0.44, intensity: 0.9, regionId: 'living-center' },
  { id: 'dust-3', position: { x: 2.3, z: -0.6 }, radius: 0.5, intensity: 1.0, regionId: 'reading-nook' },
  { id: 'dust-4', position: { x: 2.4, z: 1.2 }, radius: 0.45, intensity: 0.85, regionId: 'reading-nook' },
  { id: 'dust-5', position: { x: -2.2, z: 0.3 }, radius: 0.46, intensity: 0.85, regionId: 'media-zone' },
];

const CAT_BEHAVIOR_ORDER: CatBehaviorState[] = [
  'WALKING',
  'RUNNING',
  'STANDING',
  'LYING',
  'SLEEPING',
];

export interface EnvironmentStoreState {
  roomDimensions: RoomDimensions;
  dockPosition: Vector2D;
  regions: RoomRegion[];
  obstacles: EnvironmentObstacle[];
  dustSpots: DustSpot[];
  selectedRegionId: string;
  catState: CatBehaviorState;
  catPosition: Vector2D;
  setSelectedRegion: (regionId: string) => void;
  setCatTelemetry: (state: CatBehaviorState, position: Vector2D) => void;
  cycleCatBehavior: () => CatBehaviorState;
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
  catState: 'WALKING',
  catPosition: { ...INITIAL_CAT_POSITION },

  setSelectedRegion: (regionId) => {
    const exists = get().regions.some((r) => r.id === regionId);
    if (exists) {
      set({ selectedRegionId: regionId });
    }
  },

  setCatTelemetry: (catState, catPosition) => {
    set({
      catState,
      catPosition: {
        x: Number(catPosition.x.toFixed(2)),
        z: Number(catPosition.z.toFixed(2)),
      },
    });
  },

  cycleCatBehavior: () => {
    const current = get().catState;
    const idx = CAT_BEHAVIOR_ORDER.indexOf(current);
    const next = CAT_BEHAVIOR_ORDER[(idx + 1) % CAT_BEHAVIOR_ORDER.length];
    catMotionBridge.state = next;
    catMotionBridge.stateTimer = next === 'RUNNING' ? 4.0 : 6.0;
    catMotionBridge.speed =
      next === 'RUNNING' ? 1.85 : next === 'WALKING' ? 0.68 : 0;
    set({ catState: next });
    return next;
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

  resetEnvironment: () => {
    catMotionBridge.x = INITIAL_CAT_POSITION.x;
    catMotionBridge.z = INITIAL_CAT_POSITION.z;
    catMotionBridge.rotationY = 0.6;
    catMotionBridge.targetRotationY = 0.6;
    catMotionBridge.speed = 0.65;
    catMotionBridge.state = 'WALKING';
    catMotionBridge.stateTimer = 4.5;

    set({
      dustSpots: INITIAL_DUST_SPOTS.map((spot) => ({ ...spot })),
      selectedRegionId: 'all',
      catState: 'WALKING',
      catPosition: { ...INITIAL_CAT_POSITION },
    });
  },
}));
