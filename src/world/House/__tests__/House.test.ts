import { describe, expect, it } from 'vitest';
import { INITIAL_ROOM_DIMENSIONS, INITIAL_OBSTACLES, INITIAL_REGIONS } from '@/store/environmentStore';
import { sharedMaterials, WORLD_PALETTE } from '@/world/Environment/Materials';

describe('Construção da Casa 3D e Coerência Espacial (Dia 2)', () => {
  it('garante dimensões coerentes entre sala e limites de obstáculos', () => {
    const { width, depth, wallHeight } = INITIAL_ROOM_DIMENSIONS;
    expect(width).toBe(10);
    expect(depth).toBe(8);
    expect(wallHeight).toBeGreaterThanOrEqual(3.0);

    // Todos os obstáculos devem estar contidos na geometria da sala
    for (const obs of INITIAL_OBSTACLES) {
      expect(obs.bounds.minX).toBeGreaterThanOrEqual(-width / 2);
      expect(obs.bounds.maxX).toBeLessThanOrEqual(width / 2);
      expect(obs.bounds.minZ).toBeGreaterThanOrEqual(-depth / 2);
      expect(obs.bounds.maxZ).toBeLessThanOrEqual(depth / 2);
    }
  });

  it('verifica integridade dos materiais PBR compartilhados da casa', () => {
    expect(sharedMaterials.floorWood).toBeDefined();
    expect(sharedMaterials.floorPlankAlt).toBeDefined();
    expect(sharedMaterials.wallPlaster).toBeDefined();
    expect(sharedMaterials.wallAccent).toBeDefined();
    expect(sharedMaterials.sofaLinen).toBeDefined();
    expect(sharedMaterials.furnitureWood).toBeDefined();
    expect(sharedMaterials.plantPotCeramic).toBeDefined();
    expect(sharedMaterials.plantFoliage).toBeDefined();
    expect(sharedMaterials.windowGlass).toBeDefined();
    expect(sharedMaterials.tableGlass).toBeDefined();

    // Paleta de iluminação e ambiente PS2 Toy Story
    expect(WORLD_PALETTE.woodFloorBase).toBe('#C87D32');
    expect(WORLD_PALETTE.sunlitBackdrop).toBe('#D8B888');
  });

  it('valida cobertura de regiões da sala de estar', () => {
    const regionIds = INITIAL_REGIONS.map((r) => r.id);
    expect(regionIds).toContain('all');
    expect(regionIds).toContain('living-center');
    expect(regionIds).toContain('reading-nook');
    expect(regionIds).toContain('media-zone');
  });
});
