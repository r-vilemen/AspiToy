import * as THREE from 'three';

/**
 * Paleta de cores oficial do mundo 3D (Seção 7.3 do MASTER_PROMPT).
 */
export const WORLD_PALETTE = {
  sunlitBackdrop: '#EFE7DA',
  woodFloorBase: '#B9804E',
  woodFloorPlankAlt: '#A87040',
  woodTrim: '#7D4E28',
  woodFurniture: '#8A532B',
  woodDark: '#4A2A14',
  wallPlaster: '#F6EFE4',
  wallAccent: '#E8DEC8',
  rugCream: '#E9DFCF',
  rugBorder: '#CBB99F',
  sofaLinen: '#D9CEBE',
  sofaCushionAlt: '#C7B9A3',
  sofaWoodLegs: '#54361C',
  tableTopGlass: '#E2F1F8',
  tableWood: '#7C4B25',
  plantPot: '#D97A53', // Cerâmica terracota
  plantLeaves: '#2D6A4F', // Verde monstera natural
  plantStem: '#1B4332',
  bookSpines: ['#D64045', '#1D7874', '#F4A261', '#3D5A80'],
  lampBrass: '#D4AF37',
  lampShade: '#FFF9E6',
  robotShell: '#F8F4EC',
  robotCoral: '#E05A36',
  robotCharcoal: '#231F1D',
  sensorCyan: '#14B8A6',
  ledEmerald: '#10B981',
  ledAmber: '#F59E0B',
  dockBody: '#2D2622',
  windowFrame: '#FFFFFF',
} as const;

/**
 * Materiais PBR compartilhados para evitar realocação por componente (`material-reuse`).
 */
export const sharedMaterials = {
  floorWood: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodFloorBase,
    roughness: 0.55,
    metalness: 0.04,
  }),
  floorPlankAlt: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodFloorPlankAlt,
    roughness: 0.58,
    metalness: 0.04,
  }),
  floorTrim: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodTrim,
    roughness: 0.5,
    metalness: 0.05,
  }),
  wallPlaster: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.wallPlaster,
    roughness: 0.88,
    metalness: 0.01,
  }),
  wallAccent: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.wallAccent,
    roughness: 0.85,
    metalness: 0.01,
  }),
  rugFabric: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.rugCream,
    roughness: 0.94,
    metalness: 0.0,
  }),
  rugBorder: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.rugBorder,
    roughness: 0.9,
    metalness: 0.0,
  }),
  sofaLinen: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.sofaLinen,
    roughness: 0.86,
    metalness: 0.01,
  }),
  sofaCushionAlt: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.sofaCushionAlt,
    roughness: 0.88,
    metalness: 0.01,
  }),
  furnitureWood: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodFurniture,
    roughness: 0.45,
    metalness: 0.06,
  }),
  furnitureWoodDark: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodDark,
    roughness: 0.5,
    metalness: 0.05,
  }),
  plantPotCeramic: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.plantPot,
    roughness: 0.62,
    metalness: 0.05,
  }),
  plantFoliage: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.plantLeaves,
    roughness: 0.42,
    metalness: 0.02,
    side: THREE.DoubleSide,
  }),
  plantSoil: new THREE.MeshStandardMaterial({
    color: '#362215',
    roughness: 0.95,
    metalness: 0.0,
  }),
  windowGlass: new THREE.MeshPhysicalMaterial({
    color: '#FFFFFF',
    transparent: true,
    opacity: 0.28,
    roughness: 0.1,
    metalness: 0.05,
    transmission: 0.85,
    ior: 1.5,
  }),
  windowFrame: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.windowFrame,
    roughness: 0.35,
    metalness: 0.08,
  }),
  metalBrass: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.lampBrass,
    roughness: 0.28,
    metalness: 0.75,
  }),
  tableGlass: new THREE.MeshPhysicalMaterial({
    color: WORLD_PALETTE.tableTopGlass,
    transparent: true,
    opacity: 0.45,
    roughness: 0.15,
    transmission: 0.8,
    ior: 1.52,
  }),
  tvScreenOff: new THREE.MeshStandardMaterial({
    color: '#151312',
    roughness: 0.15,
    metalness: 0.85,
  }),
  robotShell: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.robotShell,
    roughness: 0.26,
    metalness: 0.08,
  }),
  robotCoralTrim: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.robotCoral,
    roughness: 0.34,
    metalness: 0.12,
  }),
  robotVisor: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.robotCharcoal,
    roughness: 0.16,
    metalness: 0.35,
  }),
  dockBody: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.dockBody,
    roughness: 0.4,
    metalness: 0.25,
  }),
};
