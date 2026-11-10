import * as THREE from 'three';

/**
 * Paleta de Direção de Arte — "Mundo de Animação 3D Estilizado" (Referência: Toy Story 3 PS2):
 * Cores vivas, porém equilibradas e aconchegantes, com materiais PBR diferenciados
 * (madeira envernizada, linho tramado, metal acetinado, plásticos industriais fosco/brilhante e vidro).
 */
export const WORLD_PALETTE = {
  sunlitBackdrop: '#D8B888',
  fogWarm: '#D4B280',
  woodFloorBase: '#C87D32',
  woodFloorPlankAlt: '#B66C27',
  woodTrim: '#6A3815',
  woodFurniture: '#84481F',
  woodDark: '#4A240D',
  wallPlaster: '#E5CFAF',
  wallWainscot: '#F2E7D5',
  wallAccent: '#D1B892',
  armchairOlive: '#768732',
  armchairOliveDark: '#5A6722',
  rugBurgundy: '#84352B',
  rugForest: '#2E5639',
  rugMustard: '#D19A3E',
  rugCream: '#E5D1B0',
  sofaLinen: '#768732',
  sofaCushionAlt: '#BD4E3C',
  sofaWoodLegs: '#4A240D',
  tableTopGlass: '#A8D5E5',
  tableWood: '#753E19',
  plantPot: '#BF623C',
  plantLeaves: '#3B7337',
  plantLeavesLight: '#52944B',
  plantStem: '#284D24',
  bookSpines: ['#D93829', '#2563EB', '#F2B705', '#16A34A', '#9333EA'],
  lampBrass: '#DFA332',
  lampShade: '#FAF0D7',
  crtTvCase: '#5C6652',
  crtScreen: '#222B25',
  blockGrey: '#827E76',
  curtainFabric: '#E8A855',
  curtainRod: '#543018',
  robotShell: '#F7F2E6',
  robotCoral: '#E04332',
  robotYellow: '#F5BC16',
  robotBlue: '#2563EB',
  robotCharcoal: '#1E1B18',
  sensorCyan: '#38BDF8',
  ledEmerald: '#22C55E',
  ledAmber: '#F59E0B',
  dockBody: '#283140',
  windowFrame: '#F7EFE0',
  sunbeamGlow: '#FFF4C8',
} as const;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Gera DataTexture PBR (256x256) de piso de madeira com tábuas, veios orgânicos suaves e variação natural.
 */
function createWoodPlankTexture(): {
  map: THREE.DataTexture;
  bumpMap: THREE.DataTexture;
} {
  const size = 256;
  const colorData = new Uint8Array(size * size * 4);
  const bumpData = new Uint8Array(size * size * 4);

  const planks = [
    hexToRgb('#C97F38'),
    hexToRgb('#BD732D'),
    hexToRgb('#D18740'),
    hexToRgb('#B46A25'),
    hexToRgb('#C57B34'),
    hexToRgb('#BA702A'),
    hexToRgb('#CC823B'),
    hexToRgb('#B06622'),
  ];
  const seamRgb = hexToRgb('#5E3010');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const plankIdx = Math.floor(x / 32) % 8;
      const localX = x % 32;
      const jointY = (plankIdx * 73 + 28) % size;

      const base = planks[plankIdx];
      // Veios orgânicos senoidais suaves ao longo da tábua
      const grainWave =
        Math.sin((y * 0.14) + Math.sin(localX * 0.35 + plankIdx) * 2.2) * 0.5 +
        0.5;
      const fineGrain = Math.sin(localX * 1.1 + y * 0.05) * 6;

      let r = base[0] - grainWave * 14 + fineGrain;
      let g = base[1] - grainWave * 11 + fineGrain * 0.8;
      let b = base[2] - grainWave * 8 + fineGrain * 0.5;
      let heightVal = 180 - grainWave * 28;

      // Chanfro suave nas junções entre tábuas
      const distToVerticalSeam = Math.min(localX, 31 - localX);
      const distToHorizontalSeam = Math.min(
        Math.abs(y - jointY),
        size - Math.abs(y - jointY)
      );

      if (distToVerticalSeam === 0 || distToHorizontalSeam === 0) {
        r = seamRgb[0];
        g = seamRgb[1];
        b = seamRgb[2];
        heightVal = 45;
      } else if (distToVerticalSeam === 1 || distToHorizontalSeam === 1) {
        r = (r + seamRgb[0]) * 0.5;
        g = (g + seamRgb[1]) * 0.5;
        b = (b + seamRgb[2]) * 0.5;
        heightVal = 110;
      }

      const idx = (y * size + x) * 4;
      colorData[idx] = Math.max(0, Math.min(255, Math.round(r)));
      colorData[idx + 1] = Math.max(0, Math.min(255, Math.round(g)));
      colorData[idx + 2] = Math.max(0, Math.min(255, Math.round(b)));
      colorData[idx + 3] = 255;

      const hByte = Math.max(0, Math.min(255, Math.round(heightVal)));
      bumpData[idx] = hByte;
      bumpData[idx + 1] = hByte;
      bumpData[idx + 2] = hByte;
      bumpData[idx + 3] = 255;
    }
  }

  const map = new THREE.DataTexture(colorData, size, size, THREE.RGBAFormat);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(6, 5);
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const bumpMap = new THREE.DataTexture(bumpData, size, size, THREE.RGBAFormat);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 5);
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
  bumpMap.generateMipmaps = true;
  bumpMap.needsUpdate = true;

  return { map, bumpMap };
}

/**
 * Gera DataTexture PBR (256x256) para o tapete redondo trançado com textura têxtil perceptível.
 */
function createBraidedRugTexture(): {
  map: THREE.DataTexture;
  bumpMap: THREE.DataTexture;
} {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  const bump = new Uint8Array(size * size * 4);
  const center = size / 2;

  const cBurgundy = hexToRgb('#84352B');
  const cRust = hexToRgb('#A44F37');
  const cForest = hexToRgb('#2E5639');
  const cMoss = hexToRgb('#3F6E4A');
  const cMustard = hexToRgb('#D19A3E');
  const cCream = hexToRgb('#E2CCA8');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      const dist = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      let rgb = cBurgundy;
      if (dist < 28) rgb = cMustard;
      else if (dist < 34) rgb = cCream;
      else if (dist < 62) rgb = cMoss;
      else if (dist < 90) rgb = cForest;
      else if (dist < 96) rgb = cCream;
      else if (dist < 114) rgb = cRust;

      // Trama espiral têxtil do tapete
      const braidWeave =
        Math.sin(dist * 1.4 + angle * 18) * 9 +
        Math.cos(dist * 2.2 - angle * 12) * 5;

      const idx = (y * size + x) * 4;
      data[idx] = Math.max(0, Math.min(255, Math.round(rgb[0] + braidWeave)));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(rgb[1] + braidWeave)));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(rgb[2] + braidWeave)));
      data[idx + 3] = 255;

      const bVal = Math.max(0, Math.min(255, Math.round(140 + braidWeave * 4)));
      bump[idx] = bVal;
      bump[idx + 1] = bVal;
      bump[idx + 2] = bVal;
      bump[idx + 3] = 255;
    }
  }

  const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const bumpMap = new THREE.DataTexture(bump, size, size, THREE.RGBAFormat);
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
  bumpMap.generateMipmaps = true;
  bumpMap.needsUpdate = true;

  return { map, bumpMap };
}

/**
 * Gera DataTexture PBR (128x128) de tecido tramado (linho/chenille) para estofados.
 */
function createWovenFabricTexture(
  baseHex: string,
  weaveHex: string
): { map: THREE.DataTexture; bumpMap: THREE.DataTexture } {
  const size = 128;
  const data = new Uint8Array(size * size * 4);
  const bump = new Uint8Array(size * size * 4);
  const base = hexToRgb(baseHex);
  const weave = hexToRgb(weaveHex);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const warp = Math.sin(x * 1.57) * 0.5 + 0.5;
      const weft = Math.cos(y * 1.57) * 0.5 + 0.5;
      const mix = (warp * 0.55 + weft * 0.45) * 0.38;

      const r = base[0] * (1 - mix) + weave[0] * mix;
      const g = base[1] * (1 - mix) + weave[1] * mix;
      const b = base[2] * (1 - mix) + weave[2] * mix;

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(r);
      data[idx + 1] = Math.round(g);
      data[idx + 2] = Math.round(b);
      data[idx + 3] = 255;

      const hVal = Math.round(128 + (warp - weft) * 45);
      bump[idx] = hVal;
      bump[idx + 1] = hVal;
      bump[idx + 2] = hVal;
      bump[idx + 3] = 255;
    }
  }

  const map = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(8, 8);
  map.magFilter = THREE.LinearFilter;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.generateMipmaps = true;
  map.colorSpace = THREE.SRGBColorSpace;
  map.needsUpdate = true;

  const bumpMap = new THREE.DataTexture(bump, size, size, THREE.RGBAFormat);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(8, 8);
  bumpMap.magFilter = THREE.LinearFilter;
  bumpMap.minFilter = THREE.LinearMipmapLinearFilter;
  bumpMap.generateMipmaps = true;
  bumpMap.needsUpdate = true;

  return { map, bumpMap };
}

const woodTextures = createWoodPlankTexture();
const rugTextures = createBraidedRugTexture();
const oliveFabricTextures = createWovenFabricTexture('#768732', '#5C6A22');
const terracottaFabricTextures = createWovenFabricTexture('#BD4E3C', '#963828');

/**
 * Materiais PBR compartilhados com respostas físicas distintas:
 * - Madeira envernizada com veios sutis e reflexo controlado
 * - Estofados com trama têxtil e rugosidade elevada
 * - Plásticos industriais acetinados e brilhantes (clearcoat)
 * - Metais escovados e vidro translúcido
 */
export const sharedMaterials = {
  // Piso e madeiras arquitetônicas
  floorWood: new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: woodTextures.map,
    bumpMap: woodTextures.bumpMap,
    bumpScale: 0.008,
    roughness: 0.44,
    metalness: 0.04,
  }),
  floorPlankAlt: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodFloorPlankAlt,
    roughness: 0.46,
    metalness: 0.04,
  }),
  floorTrim: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodTrim,
    roughness: 0.42,
    metalness: 0.05,
  }),
  furnitureWood: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodFurniture,
    bumpMap: woodTextures.bumpMap,
    bumpScale: 0.004,
    roughness: 0.38,
    metalness: 0.05,
  }),
  furnitureWoodDark: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodDark,
    roughness: 0.35,
    metalness: 0.06,
  }),

  // Paredes e acabamentos de alvenaria/madeira pintada
  wallPlaster: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.wallPlaster,
    roughness: 0.84,
    metalness: 0.01,
  }),
  wallWainscot: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.wallWainscot,
    roughness: 0.48,
    metalness: 0.03,
  }),
  wallAccent: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.wallAccent,
    roughness: 0.55,
    metalness: 0.02,
  }),

  // Tapetes e tecidos
  rugFabric: new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: rugTextures.map,
    bumpMap: rugTextures.bumpMap,
    bumpScale: 0.016,
    roughness: 0.92,
    metalness: 0.01,
  }),
  rugBorder: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.rugBurgundy,
    bumpMap: rugTextures.bumpMap,
    bumpScale: 0.012,
    roughness: 0.9,
    metalness: 0.01,
  }),
  sofaLinen: new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: oliveFabricTextures.map,
    bumpMap: oliveFabricTextures.bumpMap,
    bumpScale: 0.012,
    roughness: 0.88,
    metalness: 0.01,
  }),
  sofaCushionAlt: new THREE.MeshStandardMaterial({
    color: '#FFFFFF',
    map: terracottaFabricTextures.map,
    bumpMap: terracottaFabricTextures.bumpMap,
    bumpScale: 0.01,
    roughness: 0.86,
    metalness: 0.01,
  }),
  curtainFabric: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.curtainFabric,
    bumpMap: oliveFabricTextures.bumpMap,
    bumpScale: 0.008,
    roughness: 0.82,
    metalness: 0.01,
    side: THREE.DoubleSide,
  }),

  // Cerâmica, plantas e natureza
  plantPotCeramic: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.plantPot,
    roughness: 0.58,
    metalness: 0.04,
  }),
  plantFoliage: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.plantLeaves,
    roughness: 0.48,
    metalness: 0.02,
    side: THREE.DoubleSide,
  }),
  plantFoliageLight: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.plantLeavesLight,
    roughness: 0.44,
    metalness: 0.02,
    side: THREE.DoubleSide,
  }),
  plantSoil: new THREE.MeshStandardMaterial({
    color: '#3B2313',
    roughness: 0.95,
    metalness: 0.0,
  }),

  // Vidros e superfícies translúcidas
  windowGlass: new THREE.MeshPhysicalMaterial({
    color: '#FFF9DE',
    emissive: '#FFE8A3',
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.82,
    roughness: 0.15,
    metalness: 0.05,
    clearcoat: 0.6,
  }),
  windowFrame: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.windowFrame,
    roughness: 0.42,
    metalness: 0.04,
  }),
  tableGlass: new THREE.MeshPhysicalMaterial({
    color: '#D8EEF5',
    transparent: true,
    opacity: 0.46,
    roughness: 0.12,
    metalness: 0.08,
    clearcoat: 0.85,
  }),

  // Metais e eletrônicos
  metalBrass: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.lampBrass,
    roughness: 0.26,
    metalness: 0.82,
  }),
  metalChrome: new THREE.MeshStandardMaterial({
    color: '#D8E0E8',
    roughness: 0.2,
    metalness: 0.88,
  }),
  tvCaseRetro: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.crtTvCase,
    roughness: 0.46,
    metalness: 0.12,
  }),
  tvScreenOff: new THREE.MeshPhysicalMaterial({
    color: WORLD_PALETTE.crtScreen,
    roughness: 0.14,
    metalness: 0.2,
    clearcoat: 0.8,
  }),
  blockGrey: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.blockGrey,
    bumpMap: oliveFabricTextures.bumpMap,
    bumpScale: 0.008,
    roughness: 0.84,
    metalness: 0.02,
  }),

  // Materiais industriais do protagonista AspiToy
  robotShell: new THREE.MeshPhysicalMaterial({
    color: WORLD_PALETTE.robotShell,
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.35,
    clearcoatRoughness: 0.25,
  }),
  robotCoralTrim: new THREE.MeshPhysicalMaterial({
    color: WORLD_PALETTE.robotCoral,
    roughness: 0.28,
    metalness: 0.06,
    clearcoat: 0.45,
  }),
  robotYellowTrim: new THREE.MeshPhysicalMaterial({
    color: WORLD_PALETTE.robotYellow,
    roughness: 0.3,
    metalness: 0.05,
    clearcoat: 0.4,
  }),
  robotBlueTrim: new THREE.MeshPhysicalMaterial({
    color: WORLD_PALETTE.robotBlue,
    roughness: 0.34,
    metalness: 0.06,
    clearcoat: 0.3,
  }),
  robotRubberBumper: new THREE.MeshStandardMaterial({
    color: '#2B3038',
    roughness: 0.78,
    metalness: 0.04,
  }),
  robotVisor: new THREE.MeshPhysicalMaterial({
    color: '#14181F',
    roughness: 0.1,
    metalness: 0.2,
    clearcoat: 0.95,
    clearcoatRoughness: 0.08,
  }),
  robotDustBin: new THREE.MeshPhysicalMaterial({
    color: '#93C5FD',
    transparent: true,
    opacity: 0.55,
    roughness: 0.16,
    metalness: 0.05,
    clearcoat: 0.7,
  }),
  dockBody: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.dockBody,
    roughness: 0.38,
    metalness: 0.22,
  }),
};
