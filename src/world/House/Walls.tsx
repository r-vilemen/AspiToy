import { memo } from 'react';
import { sharedMaterials } from '../Environment/Materials';

interface WallsProps {
  width?: number;
  depth?: number;
  height?: number;
}

/**
 * Paredes em escala gigante (perspectiva de brinquedo no chão - Estilo PS2 Toy Story):
 * - Parede esquerda com lambris (wainscoting) frisado creme e janela alta iluminada
 * - Parede de fundo com lareira clássica (mantel) e janela vertical com divisórias
 * - Parede direita com porta gigante e rodapés altos
 */
export const Walls = memo(function Walls({
  width = 10,
  depth = 8,
  height = 4.6,
}: WallsProps) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallThick = 0.2;
  const wainscotHeight = 1.85;

  return (
    <group name="house-walls-ps2">
      {/* ======================================================== */}
      {/* 1. PAREDE ESQUERDA (OESTE): Lambris + Janela Alta Solar  */}
      {/* ======================================================== */}
      <group position={[-halfW - wallThick / 2, 0, 0]}>
        {/* Parede base completa */}
        <mesh
          castShadow
          receiveShadow
          position={[0, height / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, depth + wallThick * 2]} />
        </mesh>

        {/* Painel de Lambris (Wainscoting) inferior na face interna */}
        <mesh
          receiveShadow
          position={[wallThick / 2 + 0.02, wainscotHeight / 2, 0]}
          material={sharedMaterials.wallWainscot}
        >
          <boxGeometry args={[0.04, wainscotHeight, depth]} />
        </mesh>

        {/* Ripas verticais low-poly do lambris (como na imagem de referência) */}
        {[-3.4, -2.8, -2.2, -1.6, -1.0, -0.4, 0.2, 0.8, 1.4, 2.0, 2.6, 3.2].map(
          (zPos, idx) => (
            <mesh
              key={idx}
              position={[wallThick / 2 + 0.045, wainscotHeight / 2, zPos]}
              material={sharedMaterials.wallAccent}
            >
              <boxGeometry args={[0.02, wainscotHeight - 0.2, 0.04]} />
            </mesh>
          )
        )}

        {/* Moldura superior do lambris (Chair Rail) */}
        <mesh
          castShadow
          position={[wallThick / 2 + 0.06, wainscotHeight, 0]}
          material={sharedMaterials.wallWainscot}
        >
          <boxGeometry args={[0.1, 0.12, depth]} />
        </mesh>

        {/* Rodapé alto esculpido */}
        <mesh
          receiveShadow
          position={[wallThick / 2 + 0.05, 0.12, 0]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, depth]} />
        </mesh>

        {/* Janela Alta Brilhante (Fonte principal da luz solar na parede esquerda) */}
        <group position={[wallThick / 2 + 0.03, 3.15, -1.3]}>
          <mesh material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.08, 1.9, 1.9]} />
          </mesh>
          <mesh position={[0.03, 0, 0]} material={sharedMaterials.windowGlass}>
            <boxGeometry args={[0.04, 1.7, 1.7]} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 2. PAREDE DO FUNDO (NORTE): Lareira + Janela Quadriculada*/}
      {/* ======================================================== */}
      <group position={[0, 0, -halfD - wallThick / 2]}>
        <mesh
          castShadow
          receiveShadow
          position={[0, height / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[width + wallThick * 2, height, wallThick]} />
        </mesh>

        {/* Rodapé norte */}
        <mesh
          receiveShadow
          position={[0, 0.12, wallThick / 2 + 0.04]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[width, 0.24, 0.08]} />
        </mesh>

        {/* Lareira Clássica (Fireplace Mantel ao fundo, como na referência) */}
        <group position={[-0.2, 0, wallThick / 2 + 0.18]}>
          {/* Colunas e cornija da lareira */}
          <mesh castShadow receiveShadow position={[-0.75, 0.95, 0]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[0.32, 1.9, 0.36]} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.75, 0.95, 0]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[0.32, 1.9, 0.36]} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 1.72, 0]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[1.82, 0.36, 0.38]} />
          </mesh>
          {/* Prateleira superior da lareira (Mantelpiece) */}
          <mesh castShadow position={[0, 1.94, 0.04]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[2.05, 0.1, 0.48]} />
          </mesh>
          {/* Arco de tijolos avermelhados da lareira */}
          <mesh position={[0, 0.78, -0.02]} material={sharedMaterials.sofaCushionAlt}>
            <boxGeometry args={[1.2, 1.55, 0.28]} />
          </mesh>
          {/* Fundo escuro da fornalha */}
          <mesh position={[0, 0.62, 0.06]} material={sharedMaterials.robotVisor}>
            <boxGeometry args={[0.86, 1.15, 0.16]} />
          </mesh>
        </group>

        {/* Janela Vertical Quadriculada ao Fundo (atrás da poltrona verde) */}
        <group position={[1.95, 2.75, wallThick / 2 + 0.03]}>
          <mesh material={sharedMaterials.windowFrame}>
            <boxGeometry args={[1.25, 2.5, 0.08]} />
          </mesh>
          <mesh position={[0, 0, 0.02]} material={sharedMaterials.windowGlass}>
            <boxGeometry args={[1.08, 2.3, 0.04]} />
          </mesh>
          {/* Divisórias da janela (Muntins) */}
          <mesh position={[0, 0, 0.045]} material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.05, 2.3, 0.03]} />
          </mesh>
          {[-0.55, 0, 0.55].map((yBar, i) => (
            <mesh key={i} position={[0, yBar, 0.045]} material={sharedMaterials.windowFrame}>
              <boxGeometry args={[1.08, 0.05, 0.03]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. PAREDE DIREITA (LESTE): Porta Gigante e Molduras      */}
      {/* ======================================================== */}
      <group position={[halfW + wallThick / 2, 0, 0]}>
        <mesh
          castShadow
          receiveShadow
          position={[0, height / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, depth + wallThick * 2]} />
        </mesh>

        {/* Rodapé leste */}
        <mesh
          receiveShadow
          position={[-wallThick / 2 - 0.04, 0.12, 0]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, depth]} />
        </mesh>

        {/* Porta Gigante do Quarto/Sala (Perspectiva de Brinquedo) */}
        <group position={[-wallThick / 2 - 0.04, 1.65, 2.35]}>
          {/* Batente da porta */}
          <mesh castShadow material={sharedMaterials.floorTrim}>
            <boxGeometry args={[0.1, 3.3, 1.65]} />
          </mesh>
          {/* Folha da porta com almofadas esculpidas */}
          <mesh castShadow position={[-0.03, 0, 0]} material={sharedMaterials.furnitureWood}>
            <boxGeometry args={[0.06, 3.15, 1.48]} />
          </mesh>
          {/* Maçaneta redonda de latão no alto (escala gigante para o robô) */}
          <mesh position={[-0.1, -0.25, -0.55]} material={sharedMaterials.metalBrass}>
            <sphereGeometry args={[0.065, 8, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
