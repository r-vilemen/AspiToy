import { describe, expect, it } from 'vitest';
import { computeWallOcclusion } from '../OcclusionWall';

describe('Transparência Dinâmica de Paredes por Ângulo de Câmera e Oclusão (Cutaway)', () => {
  it('torna translúcidas as paredes sul e oeste do banheiro, cozinha e quarto ao visualizar pelo sudoeste', () => {
    // Câmera no alto a Sudoeste (perspectiva isométrica da screenshot do usuário)
    const cameraPos = { x: 0, y: 18, z: 15 };
    const target = { x: 6.3, y: 0, z: 4.75 };
    const cameraDir = {
      x: target.x - cameraPos.x, // +6.3 (olhando para Leste)
      y: target.y - cameraPos.y, // -18
      z: target.z - cameraPos.z, // -10.25 (olhando para Norte)
    };
    const robotPos = { x: 0, y: 0.28, z: 0 }; // Robô no quarto

    // 1. Parede Sul do Banheiro (Z = 13.6, face voltada para o Sul)
    const bathSouth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 4.8, maxX: 10.8, minY: 0, maxY: 4.6, minZ: 13.5, maxZ: 13.7 },
      wallPos: { x: 7.8, z: 13.6 },
      wallNormal: { x: 0, z: 1 },
      robotPos,
    });
    expect(bathSouth.isAngleOccluding).toBe(true);
    expect(bathSouth.isObstructing).toBe(true);

    // 2. Parede Oeste do Banheiro (X = 4.9, face voltada para o Oeste)
    const bathWest = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 4.8, maxX: 5.0, minY: 0, maxY: 4.6, minZ: 8.5, maxZ: 13.5 },
      wallPos: { x: 4.9, z: 11.0 },
      wallNormal: { x: -1, z: 0 },
      robotPos,
    });
    expect(bathWest.isAngleOccluding).toBe(true);
    expect(bathWest.isObstructing).toBe(true);

    // 3. Parede Leste do Banheiro (X = 10.7, fundo da visão da câmera) -> deve ficar SÓLIDA/OPACA
    const bathEast = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 10.6, maxX: 10.8, minY: 0, maxY: 4.6, minZ: 8.5, maxZ: 13.5 },
      wallPos: { x: 10.7, z: 11.0 },
      wallNormal: { x: 1, z: 0 },
      robotPos,
    });
    expect(bathEast.isAngleOccluding).toBe(false);

    // 4. Parede Sul da Cozinha (Z = 8.6, face voltada para o Sul)
    const kitchenSouth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 10.6, maxX: 17.6, minY: 0, maxY: 4.6, minZ: 8.5, maxZ: 8.7 },
      wallPos: { x: 14.1, z: 8.6 },
      wallNormal: { x: 0, z: 1 },
      robotPos,
    });
    expect(kitchenSouth.isAngleOccluding).toBe(true);
    expect(kitchenSouth.isObstructing).toBe(true);

    // 5. Parede Sul do Quarto (Z = 4.1, face voltada para o Sul)
    const bedroomSouth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: -5.1, maxX: 5.1, minY: 0, maxY: 4.6, minZ: 4.0, maxZ: 4.2 },
      wallPos: { x: 0, z: 4.1 },
      wallNormal: { x: 0, z: 1 },
      robotPos,
    });
    expect(bedroomSouth.isAngleOccluding).toBe(true);

    // 6. Parede Norte do Quarto (Z = -4.1, fundo da casa) -> deve ficar SÓLIDA/OPACA
    const bedroomNorth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: -5.1, maxX: 5.1, minY: 0, maxY: 4.6, minZ: -4.2, maxZ: -4.0 },
      wallPos: { x: 0, z: -4.1 },
      wallNormal: { x: 0, z: -1 },
      robotPos,
    });
    expect(bedroomNorth.isAngleOccluding).toBe(false);

    // 7. Parede Leste Externa (X = 17.7, fundo da casa a leste) -> deve ficar SÓLIDA/OPACA
    const houseEast = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 17.6, maxX: 17.8, minY: 0, maxY: 4.6, minZ: -4.0, maxZ: 8.5 },
      wallPos: { x: 17.7, z: 2.25 },
      wallNormal: { x: 1, z: 0 },
      robotPos,
    });
    expect(houseEast.isAngleOccluding).toBe(false);
  });

  it('inverte a visibilidade das paredes quando a câmera gira 180 graus (Nordeste olhando para Sudoeste)', () => {
    // Câmera posicionada a Nordeste olhando para Sudoeste
    const cameraPos = { x: 22, y: 18, z: -12 };
    const target = { x: 6.3, y: 0, z: 4.75 };
    const cameraDir = {
      x: target.x - cameraPos.x, // -15.7 (olhando para Oeste)
      y: target.y - cameraPos.y, // -18
      z: target.z - cameraPos.z, // +16.75 (olhando para Sul)
    };
    const robotPos = { x: 6.3, y: 0.28, z: 2.35 };

    // Paredes Norte e Leste agora estão no primeiro plano voltadas para a câmera -> translúcidas!
    const houseNorth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 5.0, maxX: 17.6, minY: 0, maxY: 4.6, minZ: -4.2, maxZ: -4.0 },
      wallPos: { x: 11.3, z: -4.1 },
      wallNormal: { x: 0, z: -1 },
      robotPos,
    });
    expect(houseNorth.isAngleOccluding).toBe(true);

    const houseEast = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 17.6, maxX: 17.8, minY: 0, maxY: 4.6, minZ: -4.0, maxZ: 8.5 },
      wallPos: { x: 17.7, z: 2.25 },
      wallNormal: { x: 1, z: 0 },
      robotPos,
    });
    expect(houseEast.isAngleOccluding).toBe(true);

    // Paredes Sul e Oeste agora estão ao fundo -> sólidas/opacas!
    const bathSouth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 4.8, maxX: 10.8, minY: 0, maxY: 4.6, minZ: 13.5, maxZ: 13.7 },
      wallPos: { x: 7.8, z: 13.6 },
      wallNormal: { x: 0, z: 1 },
      robotPos,
    });
    expect(bathSouth.isAngleOccluding).toBe(false);

    const bathWest = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 4.8, maxX: 5.0, minY: 0, maxY: 4.6, minZ: 8.5, maxZ: 13.5 },
      wallPos: { x: 4.9, z: 11.0 },
      wallNormal: { x: -1, z: 0 },
      robotPos,
    });
    expect(bathWest.isAngleOccluding).toBe(false);
  });

  it('mantém paredes sólidas por ângulo quando a câmera está dentro do cômodo', () => {
    // Câmera dentro do banheiro
    const cameraPos = { x: 7.8, y: 1.2, z: 11.0 };
    const cameraDir = { x: 0, y: 0, z: 1 }; // Olhando para a parede sul do banheiro
    const robotPos = { x: 7.8, y: 0.28, z: 12.0 };

    // Câmera está no interior da parede sul (Z = 11 < Z_wall = 13.6)
    const bathSouth = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 4.8, maxX: 10.8, minY: 0, maxY: 4.6, minZ: 13.5, maxZ: 13.7 },
      wallPos: { x: 7.8, z: 13.6 },
      wallNormal: { x: 0, z: 1 },
      robotPos,
    });
    expect(bathSouth.isAngleOccluding).toBe(false);
  });

  it('ativa transparência por Linha de Visão Direta quando a parede obstrui o robô', () => {
    // Câmera no quarto [0, 1.2, 0], robô no corredor [6.3, 0.28, 2.35]
    // Parede divisória quarto-corredor em X = 5.0 intercepta a visão
    const cameraPos = { x: 0, y: 1.2, z: 0 };
    const cameraDir = { x: 1, y: 0, z: 0 };
    const robotPos = { x: 6.3, y: 0.28, z: 2.35 };

    const dividerWall = computeWallOcclusion({
      cameraPos,
      cameraDir,
      wallBounds: { minX: 4.9, maxX: 5.1, minY: 0, maxY: 4.6, minZ: -4.0, maxZ: 8.5 },
      wallPos: { x: 5.0, z: 2.25 },
      wallNormal: { x: -1, z: 0 },
      robotPos,
    });
    expect(dividerWall.isLineOfSightObstructing).toBe(true);
    expect(dividerWall.isObstructing).toBe(true);
  });
});
