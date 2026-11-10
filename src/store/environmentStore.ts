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
import { ALL_HOUSE_OBSTACLES, INITIAL_BEDROOM_OBSTACLES } from '@/world/House/HouseObstacles';

export const INITIAL_DOCK_POSITION: Vector2D = { x: -4.15, z: 3.2 };

export const INITIAL_CAT_POSITION: Vector2D = { x: -1.65, z: 0.35 };
export const INITIAL_WHITE_CAT_POSITION: Vector2D = { x: 12.8, z: 0.2 };
export const INITIAL_TUXEDO_CAT_POSITION: Vector2D = { x: 10.5, z: 5.5 };

export const INITIAL_ROOM_DIMENSIONS: RoomDimensions = {
  width: 10,
  depth: 8,
  wallHeight: 4.6,
};

export const HOUSE_DIMENSIONS: RoomDimensions = {
  width: 23,
  depth: 18,
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
 * Retorna o obstáculo dinâmico representando a posição instantânea do gato laranja.
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

/**
 * Bridge mutável de 60 FPS para o Gato Branco de Olhos Azuis.
 */
export const whiteCatMotionBridge: CatMotionBridge = {
  x: INITIAL_WHITE_CAT_POSITION.x,
  y: 0,
  z: INITIAL_WHITE_CAT_POSITION.z,
  rotationY: -1.2,
  targetRotationY: -1.2,
  speed: 0.6,
  state: 'SITTING',
  animPhase: 1.5,
  stateTimer: 5.0,
  targetX: 12.8,
  targetY: 0,
  targetZ: 0.2,
  radius: 0.34,
  isPerched: false,
  perchSurfaceId: null,
  jumpProgress: 0,
};

/**
 * Retorna o obstáculo dinâmico representando a posição instantânea do gato branco.
 */
export function getDynamicWhiteCatObstacle(): EnvironmentObstacle {
  const r = whiteCatMotionBridge.radius;
  const isPerched = (whiteCatMotionBridge.y ?? 0) > 0.35 || whiteCatMotionBridge.isPerched;
  return {
    id: 'dynamic-white-cat',
    label: 'Gato Branco',
    category: 'pet',
    bounds: {
      minX: whiteCatMotionBridge.x - r,
      maxX: whiteCatMotionBridge.x + r,
      minZ: whiteCatMotionBridge.z - r,
      maxZ: whiteCatMotionBridge.z + r,
    },
    collidable: !isPerched,
    height: 0.42,
  };
}

/**
 * Bridge mutável de 60 FPS para o Gato Mesclado Preto e Branco (Frajola) de Olhos Verdes.
 */
export const tuxedoCatMotionBridge: CatMotionBridge = {
  x: INITIAL_TUXEDO_CAT_POSITION.x,
  y: 0,
  z: INITIAL_TUXEDO_CAT_POSITION.z,
  rotationY: 2.1,
  targetRotationY: 2.1,
  speed: 0.65,
  state: 'WALKING',
  animPhase: 2.8,
  stateTimer: 4.0,
  targetX: 11.5,
  targetY: 0,
  targetZ: 6.2,
  radius: 0.34,
  isPerched: false,
  perchSurfaceId: null,
  jumpProgress: 0,
};

/**
 * Retorna o obstáculo dinâmico representando a posição instantânea do gato mesclado (Frajola).
 */
export function getDynamicTuxedoCatObstacle(): EnvironmentObstacle {
  const r = tuxedoCatMotionBridge.radius;
  const isPerched = (tuxedoCatMotionBridge.y ?? 0) > 0.35 || tuxedoCatMotionBridge.isPerched;
  return {
    id: 'dynamic-tuxedo-cat',
    label: 'Gato Mesclado',
    category: 'pet',
    bounds: {
      minX: tuxedoCatMotionBridge.x - r,
      maxX: tuxedoCatMotionBridge.x + r,
      minZ: tuxedoCatMotionBridge.z - r,
      maxZ: tuxedoCatMotionBridge.z + r,
    },
    collidable: !isPerched,
    height: 0.42,
  };
}

/**
 * Retorna os obstáculos dinâmicos de todos os gatos da residência.
 */
export function getDynamicAllCatsObstacles(): EnvironmentObstacle[] {
  return [
    getDynamicCatObstacle(),
    getDynamicWhiteCatObstacle(),
    getDynamicTuxedoCatObstacle(),
  ];
}

export const INITIAL_REGIONS: RoomRegion[] = [
  {
    id: 'all',
    label: 'Casa Completa',
    description: 'Varredura integral de todos os cômodos conectados da residência',
    bounds: { minX: -5.0, maxX: 17.6, minZ: -4.0, maxZ: 13.5 },
    center: { x: 6.3, z: 2.25 },
  },
  {
    id: 'bedroom',
    label: 'Quarto',
    description: 'Quarto principal com cama/baú, lareira e base de recarga',
    bounds: { minX: -5.0, maxX: 5.0, minZ: -4.0, maxZ: 4.0 },
    center: { x: 0, z: 0 },
  },
  {
    id: 'hallway',
    label: 'Corredor',
    description: 'Corredor central conectando todos os ambientes da casa',
    bounds: { minX: 5.0, maxX: 7.6, minZ: -4.0, maxZ: 8.5 },
    center: { x: 6.3, z: 2.25 },
  },
  {
    id: 'living-room',
    label: 'Sala de Estar',
    description: 'Sala de estar ampla com TV CRT, sofá em L e estante de livros',
    bounds: { minX: 7.6, maxX: 17.6, minZ: -4.0, maxZ: 3.2 },
    center: { x: 12.6, z: -0.4 },
  },
  {
    id: 'kitchen',
    label: 'Cozinha',
    description: 'Cozinha com armários, bancada em L, geladeira e fogão',
    bounds: { minX: 7.6, maxX: 17.6, minZ: 3.2, maxZ: 8.5 },
    center: { x: 12.6, z: 5.85 },
  },
  {
    id: 'bathroom',
    label: 'Banheiro',
    description: 'Banheiro social com box de vidro, pia, espelho e sanitário',
    bounds: { minX: 5.0, maxX: 10.6, minZ: 8.5, maxZ: 13.5 },
    center: { x: 7.8, z: 11.0 },
  },
];

export const INITIAL_OBSTACLES: EnvironmentObstacle[] = INITIAL_BEDROOM_OBSTACLES;

const INITIAL_DUST_SPOTS: DustSpot[] = [
  // Quarto
  { id: 'dust-1', position: { x: -0.4, z: 0.2 }, radius: 0.48, intensity: 0.95, regionId: 'bedroom' },
  { id: 'dust-2', position: { x: -0.15, z: -1.25 }, radius: 0.44, intensity: 0.9, regionId: 'bedroom' },
  { id: 'dust-3', position: { x: 2.3, z: -0.6 }, radius: 0.5, intensity: 1.0, regionId: 'bedroom' },
  { id: 'dust-4', position: { x: 2.4, z: 1.2 }, radius: 0.45, intensity: 0.85, regionId: 'bedroom' },
  { id: 'dust-5', position: { x: -2.15, z: -2.25 }, radius: 0.46, intensity: 0.85, regionId: 'bedroom' },
  // Corredor
  { id: 'dust-hall-1', position: { x: 6.3, z: 0.0 }, radius: 0.42, intensity: 0.9, regionId: 'hallway' },
  { id: 'dust-hall-2', position: { x: 6.3, z: 4.5 }, radius: 0.45, intensity: 0.85, regionId: 'hallway' },
  // Sala de Estar
  { id: 'dust-living-1', position: { x: 11.5, z: -0.8 }, radius: 0.46, intensity: 0.95, regionId: 'living-room' },
  { id: 'dust-living-2', position: { x: 14.5, z: -1.2 }, radius: 0.44, intensity: 0.9, regionId: 'living-room' },
  { id: 'dust-living-3', position: { x: 10.2, z: 1.5 }, radius: 0.45, intensity: 0.85, regionId: 'living-room' },
  // Cozinha
  { id: 'dust-kitchen-1', position: { x: 10.0, z: 5.5 }, radius: 0.48, intensity: 1.0, regionId: 'kitchen' },
  { id: 'dust-kitchen-2', position: { x: 15.0, z: 5.8 }, radius: 0.44, intensity: 0.9, regionId: 'kitchen' },
  { id: 'dust-kitchen-3', position: { x: 12.8, z: 6.8 }, radius: 0.46, intensity: 0.85, regionId: 'kitchen' },
  // Banheiro
  { id: 'dust-bath-1', position: { x: 7.8, z: 9.8 }, radius: 0.42, intensity: 0.9, regionId: 'bathroom' },
  { id: 'dust-bath-2', position: { x: 8.5, z: 11.5 }, radius: 0.44, intensity: 0.85, regionId: 'bathroom' },
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

  // 1. Empurrão causado pelo Robô e pelos Gatos
  const pushers = [
    { x: robotPos.x, z: robotPos.z, r: robotRadius, isRobot: true },
    { x: catMotionBridge.x, z: catMotionBridge.z, r: 0.26, isRobot: false },
    { x: whiteCatMotionBridge.x, z: whiteCatMotionBridge.z, r: 0.26, isRobot: false },
    { x: tuxedoCatMotionBridge.x, z: tuxedoCatMotionBridge.z, r: 0.26, isRobot: false },
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
  respawnDustSpots: () => void;
  resetEnvironment: () => void;
}

export const useEnvironmentStore = create<EnvironmentStoreState>((set, get) => ({
  roomDimensions: HOUSE_DIMENSIONS,
  dockPosition: INITIAL_DOCK_POSITION,
  regions: INITIAL_REGIONS,
  obstacles: ALL_HOUSE_OBSTACLES,
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
    const { dustSpots, selectedRegionId } = get();
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

    // Calcula progresso específico do cômodo selecionado (ou da casa toda se 'all')
    const relevantSpots =
      selectedRegionId && selectedRegionId !== 'all'
        ? updated.filter((s) => s.regionId === selectedRegionId)
        : updated;

    const totalInitial = relevantSpots.length;
    if (totalInitial === 0) return 100;
    const remaining = relevantSpots.reduce((acc, spot) => acc + spot.intensity, 0);
    const cleanedRatio = 1 - remaining / totalInitial;
    return Math.round(Math.min(100, Math.max(0, cleanedRatio * 100)));
  },

  respawnDustSpots: () => {
    set({
      dustSpots: INITIAL_DUST_SPOTS.map((spot) => ({ ...spot, intensity: 0.9 })),
    });
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

    whiteCatMotionBridge.x = INITIAL_WHITE_CAT_POSITION.x;
    whiteCatMotionBridge.y = 0;
    whiteCatMotionBridge.z = INITIAL_WHITE_CAT_POSITION.z;
    whiteCatMotionBridge.targetX = 12.8;
    whiteCatMotionBridge.targetY = 0;
    whiteCatMotionBridge.targetZ = 0.2;
    whiteCatMotionBridge.rotationY = -1.2;
    whiteCatMotionBridge.targetRotationY = -1.2;
    whiteCatMotionBridge.speed = 0.6;
    whiteCatMotionBridge.state = 'SITTING';
    whiteCatMotionBridge.stateTimer = 5.0;
    whiteCatMotionBridge.isPerched = false;
    whiteCatMotionBridge.perchSurfaceId = null;
    whiteCatMotionBridge.jumpProgress = 0;

    tuxedoCatMotionBridge.x = INITIAL_TUXEDO_CAT_POSITION.x;
    tuxedoCatMotionBridge.y = 0;
    tuxedoCatMotionBridge.z = INITIAL_TUXEDO_CAT_POSITION.z;
    tuxedoCatMotionBridge.targetX = 11.5;
    tuxedoCatMotionBridge.targetY = 0;
    tuxedoCatMotionBridge.targetZ = 6.2;
    tuxedoCatMotionBridge.rotationY = 2.1;
    tuxedoCatMotionBridge.targetRotationY = 2.1;
    tuxedoCatMotionBridge.speed = 0.65;
    tuxedoCatMotionBridge.state = 'WALKING';
    tuxedoCatMotionBridge.stateTimer = 4.0;
    tuxedoCatMotionBridge.isPerched = false;
    tuxedoCatMotionBridge.perchSurfaceId = null;
    tuxedoCatMotionBridge.jumpProgress = 0;

    resetPushableToys();

    set({
      dustSpots: INITIAL_DUST_SPOTS.map((spot) => ({ ...spot })),
      obstacles: ALL_HOUSE_OBSTACLES,
      selectedRegionId: 'all',
      catState: 'WALKING',
      catPosition: { ...INITIAL_CAT_POSITION },
    });
  },
}));
