import * as THREE from 'three';

/**
 * Paleta de cores "Early 2000s PS2 Toy Game" (6th Gen Console Aesthetic):
 * Tons vibrantes, plásticos foscos (matte), madeira mel saturada e iluminação nostálgica.
 */
export const WORLD_PALETTE = {
  sunlitBackdrop: '#D8B888',
  fogWarm: '#C9A26B',
  woodFloorBase: '#C87D32',
  woodFloorPlankAlt: '#B36A22',
  woodTrim: '#6E3B16',
  woodFurniture: '#82461D',
  woodDark: '#4D260D',
  wallPlaster: '#DEC7A4',
  wallWainscot: '#EBE0CC',
  wallAccent: '#C9B08A',
  armchairOlive: '#78862E',
  armchairOliveDark: '#5C6820',
  rugBurgundy: '#7D3228',
  rugForest: '#2D5236',
  rugMustard: '#C9933B',
  rugCream: '#DFC9A6',
  sofaLinen: '#78862E',
  sofaCushionAlt: '#B84A39',
  sofaWoodLegs: '#4D260D',
  tableTopGlass: '#8C4E22',
  tableWood: '#733D18',
  plantPot: '#B85D38',
  plantLeaves: '#386B34',
  plantStem: '#264A23',
  bookSpines: ['#D93829', '#2563EB', '#F2B705', '#16A34A'],
  lampBrass: '#D99B26',
  lampShade: '#F7E3B5',
  crtTvCase: '#5C6652',
  crtScreen: '#2B332B',
  blockGrey: '#78756E',
  robotShell: '#F5EFE0',
  robotCoral: '#D93829',
  robotYellow: '#F2B705',
  robotBlue: '#2563EB',
  robotCharcoal: '#24201D',
  sensorCyan: '#38BDF8',
  ledEmerald: '#22C55E',
  ledAmber: '#F59E0B',
  dockBody: '#2D3748',
  windowFrame: '#F5EAD6',
  sunbeamGlow: '#FFF3C4',
} as const;

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Cria DataTexture low-res (64x64) de tábuas de madeira no estilo PS2 (NearestFilter).
 */
function createPs2WoodDataTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const plankColors = [
    hexToRgb('#C87D32'),
    hexToRgb('#BE732B'),
    hexToRgb('#CF843A'),
    hexToRgb('#B66B24'),
  ];
  const seamColor = hexToRgb('#592D0E');
  const grainColor = hexToRgb('#9E5A1E');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const plankIdx = Math.floor(x / 16) % 4;
      const localX = x % 16;
      const jointY = (plankIdx * 23 + 12) % size;

      let rgb = plankColors[plankIdx];
      if (localX === 0 || y === jointY) {
        rgb = seamColor;
      } else if (localX === 5 || localX === 11) {
        rgb = grainColor;
      }

      const idx = (y * size + x) * 4;
      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 6);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Cria DataTexture low-res (64x64) de tapete redondo trançado concêntrico estilo PS2.
 */
function createPs2RugDataTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const center = size / 2;

  const cBurgundy = hexToRgb('#7D3228');
  const cRust = hexToRgb('#9C4B34');
  const cForest = hexToRgb('#2D5236');
  const cMoss = hexToRgb('#3B6946');
  const cMustard = hexToRgb('#C9933B');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dist = Math.hypot(x - center, y - center);
      let rgb = cBurgundy;
      if (dist < 8) rgb = cMustard;
      else if (dist < 15) rgb = cMoss;
      else if (dist < 22) rgb = cForest;
      else if (dist < 27) rgb = cRust;

      const idx = (y * size + x) * 4;
      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Cria DataTexture low-res (32x32) de tecido tramado para a poltrona verde-oliva PS2.
 */
function createPs2FabricDataTexture(): THREE.DataTexture {
  const size = 32;
  const data = new Uint8Array(size * size * 4);
  const base = hexToRgb('#78862E');
  const weave = hexToRgb('#657224');

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const isLine = y % 3 === 0 || x % 6 === 0;
      const rgb = isLine ? weave : base;
      const idx = (y * size + x) * 4;
      data[idx] = rgb[0];
      data[idx + 1] = rgb[1];
      data[idx + 2] = rgb[2];
      data[idx + 3] = 255;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const woodTex = createPs2WoodDataTexture();
const rugTex = createPs2RugDataTexture();
const armchairTex = createPs2FabricDataTexture();

/**
 * Materiais compartilhados com acabamento Matte / Flat Low-Poly (PS2 Aesthetic).
 */
export const sharedMaterials = {
  floorWood: new THREE.MeshLambertMaterial({
    color: '#FFFFFF',
    map: woodTex,
  }),
  floorPlankAlt: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.woodFloorPlankAlt,
  }),
  floorTrim: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.woodTrim,
  }),
  wallPlaster: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.wallPlaster,
  }),
  wallWainscot: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.wallWainscot,
  }),
  wallAccent: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.wallAccent,
  }),
  rugFabric: new THREE.MeshLambertMaterial({
    color: '#FFFFFF',
    map: rugTex,
  }),
  rugBorder: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.rugBurgundy,
  }),
  sofaLinen: new THREE.MeshLambertMaterial({
    color: '#FFFFFF',
    map: armchairTex,
  }),
  sofaCushionAlt: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.sofaCushionAlt,
  }),
  furnitureWood: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.woodFurniture,
  }),
  furnitureWoodDark: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.woodDark,
  }),
  plantPotCeramic: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.plantPot,
    flatShading: true,
  }),
  plantFoliage: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.plantLeaves,
    side: THREE.DoubleSide,
    flatShading: true,
  }),
  plantSoil: new THREE.MeshLambertMaterial({
    color: '#3B2313',
  }),
  windowGlass: new THREE.MeshBasicMaterial({
    color: '#FFF9D6',
    transparent: true,
    opacity: 0.88,
  }),
  windowFrame: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.windowFrame,
  }),
  metalBrass: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.lampBrass,
    flatShading: true,
  }),
  tableGlass: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.tableWood,
  }),
  tvCaseRetro: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.crtTvCase,
    flatShading: true,
  }),
  tvScreenOff: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.crtScreen,
  }),
  blockGrey: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.blockGrey,
    flatShading: true,
  }),
  robotShell: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.robotShell,
    flatShading: true,
  }),
  robotCoralTrim: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.robotCoral,
    flatShading: true,
  }),
  robotYellowTrim: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.robotYellow,
    flatShading: true,
  }),
  robotBlueTrim: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.robotBlue,
    flatShading: true,
  }),
  robotVisor: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.robotCharcoal,
    flatShading: true,
  }),
  dockBody: new THREE.MeshLambertMaterial({
    color: WORLD_PALETTE.dockBody,
    flatShading: true,
  }),
};
