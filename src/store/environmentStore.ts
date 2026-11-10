import { create } from 'zustand';
import type {
  CatBehaviorState,
  CatMotionBridge,
  DustSpot,
  EnvironmentObstacle,
  PushableToyState,
  RoomDimensions,
  RoomRegion,
} from '@/types/environment';
import type { Vector2D } from '@/types/robot';
import { isPointInsideBounds } from '@/utils/coordinates';
import { clamp } from '@/utils/math';

export const INITIAL_DOCK_POSITION: Vector2D = { x: -4.15, z: 3.2 };

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
  y: 0,
  z: INITIAL_CAT_POSITION.z,
  rotationY: 0.6,
  targetRotationY: 0.6,
  speed: 0.65,
  state: 'WALKING',
  animPhase: 0,
  stateTimer: 4.5,
  targetX: 0.1,
  targetY: 0,
  targetZ: -0.4,
  radius: 0.34,
  isPerched: false,
  perchSurfaceId: null,
  jumpProgress: 0,
};

/**
 * Retorna o obstáculo dinâmico representando a posição instantânea do gato.
 * Quando o gato está empoleirado nos móveis (sofá, poltrona, mesa com y > 0.35m),
 * ele deixa de ser um obstáculo no piso para o robô.
 */
export function getDynamicCatObstacle(): EnvironmentObstacle {
  const r = catMotionBridge.radius;
  const isPerched = (catMotionBridge.y ?? 0) > 0.35 || catMotionBridge.isPerched;
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
    collidable: !isPerched,
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
    center: { x: -0.15, z: -1.15 },
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
    center: { x: -2.15, z: -2.25 },
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

const INITIAL_DUST_SPOTS: DustSpot[] = [
  { id: 'dust-1', position: { x: -0.4, z: 0.2 }, radius: 0.48, intensity: 0.95, regionId: 'living-center' },
  { id: 'dust-2', position: { x: -0.15, z: -1.25 }, radius: 0.44, intensity: 0.9, regionId: 'living-center' },
  { id: 'dust-3', position: { x: 2.3, z: -0.6 }, radius: 0.5, intensity: 1.0, regionId: 'reading-nook' },
  { id: 'dust-4', position: { x: 2.4, z: 1.2 }, radius: 0.45, intensity: 0.85, regionId: 'reading-nook' },
  { id: 'dust-5', position: { x: -2.15, z: -2.25 }, radius: 0.46, intensity: 0.85, regionId: 'media-zone' },
];

const INITIAL_PUSHABLE_TOY_SEEDS: Array<
  Pick<PushableToyState, 'id' | 'label' | 'kind' | 'x' | 'z' | 'rotY' | 'radius'>
> = [
  {
    id: 'push-cowboy',
    label: 'Boneco Cowboy Xerife',
    kind: 'cowboy-doll',
    x: -0.55,
    z: -0.35,
    rotY: 0.35,
    radius: 0.18,
  },
  {
    id: 'push-spaceranger',
    label: 'Patrulheiro Espacial',
    kind: 'space-ranger',
    x: 0.35,
    z: 0.15,
    rotY: -0.45,
    radius: 0.2,
  },
  {
    id: 'push-alien-1',
    label: 'Alienígena de 3 Olhos',
    kind: 'green-alien',
    x: -1.05,
    z: -0.18,
    rotY: 0.5,
    radius: 0.15,
  },
  {
    id: 'push-alien-2',
    label: 'Alienígena de 3 Olhos',
    kind: 'green-alien',
    x: 1.85,
    z: -0.65,
    rotY: -0.8,
    radius: 0.15,
  },
  {
    id: 'push-trex',
    label: 'Dinossauro T-Rex Verde',
    kind: 'trex-dino',
    x: -2.15,
    z: 0.55,
    rotY: 0.75,
    radius: 0.22,
  },
  {
    id: 'push-slinky',
    label: 'Cachorro de Mola',
    kind: 'slinky-dog',
    x: 1.65,
    z: 1.25,
    rotY: -0.6,
    radius: 0.22,
  },
  {
    id: 'push-piggy',
    label: 'Porquinho Cofrinho',
    kind: 'piggy-bank',
    x: 2.35,
    z: 0.15,
    rotY: -1.1,
    radius: 0.18,
  },
  {
    id: 'push-ball',
    label: 'Bola de Brinquedo',
    kind: 'planet-ball',
    x: -1.38,
    z: 0.52,
    rotY: 0,
    radius: 0.21,
  },
  {
    id: 'push-block-red',
    label: 'Bloco A Vermelho',
    kind: 'block-red',
    x: -3.28,
    z: 1.58,
    rotY: 0.1,
    radius: 0.17,
  },
  {
    id: 'push-block-blue',
    label: 'Bloco B Azul',
    kind: 'block-blue',
    x: -2.92,
    z: 1.68,
    rotY: 0.4,
    radius: 0.17,
  },
  {
    id: 'push-block-yellow',
    label: 'Bloco C Amarelo',
    kind: 'block-yellow',
    x: -3.08,
    z: 1.28,
    rotY: -0.3,
    radius: 0.17,
  },
  {
    id: 'push-train',
    label: 'Trenzinho Colorido',
    kind: 'wooden-train',
    x: 1.62,
    z: -2.68,
    rotY: -0.35,
    radius: 0.23,
  },
  {
    id: 'push-rings',
    label: 'Torre de Argolas',
    kind: 'ring-stacker',
    x: -0.94,
    z: -2.65,
    rotY: 0,
    radius: 0.19,
  },
  {
    id: 'push-buggy',
    label: 'Carrinho RC Buggy',
    kind: 'rc-buggy',
    x: 2.95,
    z: 1.9,
    rotY: -2.2,
    radius: 0.24,
  },
  {
    id: 'push-pin-1',
    label: 'Pino de Boliche',
    kind: 'bowling-pin',
    x: -2.85,
    z: -0.65,
    rotY: 0,
    radius: 0.13,
  },
  {
    id: 'push-pin-2',
    label: 'Pino de Boliche',
    kind: 'bowling-pin',
    x: -2.62,
    z: -0.58,
    rotY: 0.3,
    radius: 0.13,
  },
];

function createInitialPushableToys(): PushableToyState[] {
  return INITIAL_PUSHABLE_TOY_SEEDS.map((seed) => ({
    ...seed,
    initialX: seed.x,
    initialZ: seed.z,
    initialRotY: seed.rotY,
    vx: 0,
    vz: 0,
    angVel: 0,
    rollPitch: 0,
    rollRoll: 0,
    wobble: 0,
  }));
}

/**
 * Bridge mutável de 60 FPS para todos os brinquedos pequenos no chão que podem ser
 * empurrados pelo AspiToy (ou pelo gato) sem bloquear a passagem do robô.
 */
export const pushableToysBridge: PushableToyState[] = createInitialPushableToys();

export function resetPushableToys(): void {
  for (const toy of pushableToysBridge) {
    toy.x = toy.initialX;
    toy.z = toy.initialZ;
    toy.rotY = toy.initialRotY;
    toy.vx = 0;
    toy.vz = 0;
    toy.angVel = 0;
    toy.rollPitch = 0;
    toy.rollRoll = 0;
    toy.wobble = 0;
  }
}

/**
 * Simula física leve em 60 FPS para brinquedos pequenos no chão:
 * Quando o robô (ou o gato) passa por eles, empurra-os suavemente para o lado/frente
 * permitindo que o robô atravesse o quarto inteiro sem ficar preso.
 */
export function stepPushableToysPhysics(
  robotPos: Vector2D,
  robotRadius: number,
  delta: number
): { pushedToyLabel: string | null } {
  let pushedToyLabel: string | null = null;
  const halfW = INITIAL_ROOM_DIMENSIONS.width / 2 - 0.28;
  const halfD = INITIAL_ROOM_DIMENSIONS.depth / 2 - 0.28;
  const solidFurniture = INITIAL_OBSTACLES.filter((o) => o.collidable);

  // 1. Empurrão causado pelo Robô e pelo Gato
  const pushers = [
    { x: robotPos.x, z: robotPos.z, r: robotRadius, isRobot: true },
    { x: catMotionBridge.x, z: catMotionBridge.z, r: 0.26, isRobot: false },
  ];

  for (const toy of pushableToysBridge) {
    for (const pusher of pushers) {
      const dx = toy.x - pusher.x;
      const dz = toy.z - pusher.z;
      const dist = Math.hypot(dx, dz);
      const minDist = pusher.r + toy.radius;

      if (dist < minDist) {
        const nx = dist > 0.0001 ? dx / dist : 1;
        const nz = dist > 0.0001 ? dz / dist : 0;
        const overlap = minDist - dist;

        // Desloca imediatamente o brinquedo para fora do raio do robô para liberar passagem
        toy.x += nx * (overlap + 0.012);
        toy.z += nz * (overlap + 0.012);

        // Aplica impulso de velocidade e giro
        const impulse = 1.45 + overlap * 5.0;
        toy.vx = nx * impulse;
        toy.vz = nz * impulse;
        toy.angVel = (nx * dz - nz * dx) * 9.0 + (nx - nz) * 1.8;
        toy.wobble = Math.min(0.42, toy.wobble + 0.22);

        if (pusher.isRobot) {
          pushedToyLabel = toy.label;
        }
      }
    }
  }

  // 2. Colisão elástica leve entre brinquedos pequenos (efeito dominó / boliche)
  for (let i = 0; i < pushableToysBridge.length; i++) {
    for (let j = i + 1; j < pushableToysBridge.length; j++) {
      const a = pushableToysBridge[i];
      const b = pushableToysBridge[j];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dist = Math.hypot(dx, dz);
      const minDist = a.radius + b.radius;

      if (dist < minDist && dist > 0.0001) {
        const nx = dx / dist;
        const nz = dz / dist;
        const halfOverlap = (minDist - dist) * 0.52;
        a.x -= nx * halfOverlap;
        a.z -= nz * halfOverlap;
        b.x += nx * halfOverlap;
        b.z += nz * halfOverlap;

        const relVx = a.vx - b.vx;
        const relVz = a.vz - b.vz;
        const sepVel = relVx * nx + relVz * nz;
        if (sepVel > 0) {
          a.vx -= nx * sepVel * 0.5;
          a.vz -= nz * sepVel * 0.5;
          b.vx += nx * sepVel * 0.5;
          b.vz += nz * sepVel * 0.5;
          b.wobble = Math.min(0.35, b.wobble + 0.15);
        }
      }
    }
  }

  // 3. Integração de movimento, atrito com o piso e repulsão de móveis pesados/paredes
  const friction = Math.exp(-5.2 * delta);
  for (const toy of pushableToysBridge) {
    toy.x += toy.vx * delta;
    toy.z += toy.vz * delta;
    toy.rotY += toy.angVel * delta;

    // Rotação física de rolamento da esfera proporcional à velocidade vetorial
    if (toy.kind === 'planet-ball') {
      const ballR = Math.max(0.05, toy.radius);
      toy.rollPitch += (toy.vz * delta) / ballR;
      toy.rollRoll -= (toy.vx * delta) / ballR;
    }

    toy.vx *= friction;
    toy.vz *= friction;
    toy.angVel *= friction;
    toy.wobble *= Math.exp(-6.5 * delta);

    // Impede que o brinquedo empurrado atravesse paredes
    toy.x = clamp(toy.x, -halfW, halfW);
    toy.z = clamp(toy.z, -halfD, halfD);

    // Impede que o brinquedo empurrado entre dentro de móveis fixos pesados
    for (const furn of solidFurniture) {
      const b = furn.bounds;
      const r = toy.radius;
      if (
        toy.x + r > b.minX &&
        toy.x - r < b.maxX &&
        toy.z + r > b.minZ &&
        toy.z - r < b.maxZ
      ) {
        const dLeft = Math.abs(toy.x + r - b.minX);
        const dRight = Math.abs(b.maxX - (toy.x - r));
        const dTop = Math.abs(toy.z + r - b.minZ);
        const dBottom = Math.abs(b.maxZ - (toy.z - r));
        const minPen = Math.min(dLeft, dRight, dTop, dBottom);

        if (minPen === dLeft) {
          toy.x = b.minX - r - 0.01;
          toy.vx = -Math.abs(toy.vx) * 0.4;
        } else if (minPen === dRight) {
          toy.x = b.maxX + r + 0.01;
          toy.vx = Math.abs(toy.vx) * 0.4;
        } else if (minPen === dTop) {
          toy.z = b.minZ - r - 0.01;
          toy.vz = -Math.abs(toy.vz) * 0.4;
        } else {
          toy.z = b.maxZ + r + 0.01;
          toy.vz = Math.abs(toy.vz) * 0.4;
        }
      }
    }
  }

  return { pushedToyLabel };
}

const CAT_BEHAVIOR_ORDER: CatBehaviorState[] = [
  'WALKING',
  'RUNNING',
  'STANDING',
  'LYING',
  'SLEEPING',
  'SITTING',
  'STRETCHING',
  'GROOMING',
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
    catMotionBridge.y = 0;
    catMotionBridge.z = INITIAL_CAT_POSITION.z;
    catMotionBridge.targetX = 0.1;
    catMotionBridge.targetY = 0;
    catMotionBridge.targetZ = -0.4;
    catMotionBridge.rotationY = 0.6;
    catMotionBridge.targetRotationY = 0.6;
    catMotionBridge.speed = 0.65;
    catMotionBridge.state = 'WALKING';
    catMotionBridge.stateTimer = 4.5;
    catMotionBridge.isPerched = false;
    catMotionBridge.perchSurfaceId = null;
    catMotionBridge.jumpProgress = 0;
    resetPushableToys();

    set({
      dustSpots: INITIAL_DUST_SPOTS.map((spot) => ({ ...spot })),
      selectedRegionId: 'all',
      catState: 'WALKING',
      catPosition: { ...INITIAL_CAT_POSITION },
    });
  },
}));
