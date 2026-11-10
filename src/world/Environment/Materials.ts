import * as THREE from 'three';

/**
 * Paleta de cores oficial do mundo 3D (Seção 7.3 do MASTER_PROMPT).
 */
export const WORLD_PALETTE = {
  sunlitBackdrop: '#EFE7DA',
  woodFloorBase: '#B9804E',
  woodFloorPlankAlt: '#A87040',
  woodTrim: '#7D4E28',
  wallPlaster: '#F6EFE4',
  wallAccent: '#E8DEC8',
  rugCream: '#E9DFCF',
  rugBorder: '#CBB99F',
  sofaLinen: '#D9CEBE',
  sofaWood: '#6E4726',
  robotShell: '#F8F4EC',
  robotCoral: '#E05A36',
  robotCharcoal: '#231F1D',
  sensorCyan: '#14B8A6',
  ledEmerald: '#10B981',
  ledAmber: '#F59E0B',
  dockBody: '#2D2622',
} as const;

/**
 * Materiais PBR compartilhados para evitar realocação por componente (`material-reuse`).
 */
export const sharedMaterials = {
  floorWood: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.woodFloorBase,
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
  rugFabric: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.rugCream,
    roughness: 0.92,
    metalness: 0.0,
  }),
  rugBorder: new THREE.MeshStandardMaterial({
    color: WORLD_PALETTE.rugBorder,
    roughness: 0.88,
    metalness: 0.0,
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

