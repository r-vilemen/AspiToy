import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../Environment/Materials';

interface WallsProps {
  width?: number;
  depth?: number;
  height?: number;
}

/**
 * Paredes arquitetônicas com cortes cinematográficos, esquadrias brancas,
 * vidro físico, cortina decorativa e porta de acesso para outro cômodo.
 */
export const Walls = memo(function Walls({
  width = 10,
  depth = 8,
  height = 3.2,
}: WallsProps) {
  const halfW = width / 2;
  const halfD = depth / 2;
  const wallThick = 0.16;

  return (
    <group name="house-walls">
      {/* ======================================================== */}
      {/* 1. PAREDE NORTE (FUNDO DA SALA)                          */}
      {/* ======================================================== */}
      <group position={[0, height / 2, -halfD - wallThick / 2]}>
        {/* Painel de alvenaria em gesso quente */}
        <mesh
          castShadow
          receiveShadow
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[width + wallThick * 2, height, wallThick]} />
        </mesh>

        {/* Boiserie / Painel decorativo em gesso no terço central */}
        <mesh
          position={[0, 0, wallThick / 2 + 0.006]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[6.2, height * 0.75, 0.012]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. PAREDE OESTE COM PORTA DE ACESSO                      */}
      {/* ======================================================== */}
      <group position={[-halfW - wallThick / 2, height / 2, 0]}>
        {/* Seção norte da parede oeste */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, -2.1]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, 3.8]} />
        </mesh>

        {/* Verga superior acima da porta (vão livre: Z entre -0.2 e +1.2, altura 2.2m) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, (height - 2.2) / 2 + 2.2 / 2, 0.5]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height - 2.2, 1.4]} />
        </mesh>

        {/* Guarnição / Marco da porta de madeira escura */}
        <group position={[0, 1.1 - height / 2, 0.5]}>
          {/* Montante esquerdo */}
          <mesh castShadow position={[0, 0, -0.68]} material={sharedMaterials.floorTrim}>
            <boxGeometry args={[wallThick + 0.02, 2.2, 0.06]} />
          </mesh>
          {/* Montante direito */}
          <mesh castShadow position={[0, 0, 0.68]} material={sharedMaterials.floorTrim}>
            <boxGeometry args={[wallThick + 0.02, 2.2, 0.06]} />
          </mesh>
          {/* Travessa superior */}
          <mesh castShadow position={[0, 1.07, 0]} material={sharedMaterials.floorTrim}>
            <boxGeometry args={[wallThick + 0.02, 0.06, 1.42]} />
          </mesh>
          {/* Folha da porta semiaberta a 35 graus convidando o olhar */}
          <group position={[0, 0, -0.65]} rotation={[0, -0.6, 0]}>
            <mesh castShadow position={[0, 0, 0.6]} material={sharedMaterials.furnitureWood}>
              <boxGeometry args={[0.04, 2.14, 1.2]} />
            </mesh>
            {/* Maçaneta em latão */}
            <mesh position={[0.03, -0.05, 1.05]} material={sharedMaterials.metalBrass}>
              <cylinderGeometry args={[0.015, 0.015, 0.12, 12]} />
            </mesh>
          </group>
        </group>

        {/* Seção sul da parede oeste */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, 2.6]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, 2.8]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 3. PAREDE LESTE COM GRANDES JANELAS SOLARES              */}
      {/* ======================================================== */}
      <group position={[halfW + wallThick / 2, height / 2, 0]}>
        {/* Peitoril / Parede inferior abaixo da janela (altura 0.85m) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, -height / 2 + 0.425, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, 0.85, depth]} />
        </mesh>

        {/* Verga superior acima da janela (altura 0.65m) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, height / 2 - 0.325, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, 0.65, depth]} />
        </mesh>

        {/* Pilar frontal norte da janela */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, -halfD + 0.8]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, 1.6]} />
        </mesh>

        {/* Pilar sul da janela */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0, halfD - 0.8]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, 1.6]} />
        </mesh>

        {/* Montante central entre as duas grandes folhas de vidro */}
        <mesh
          castShadow
          position={[0, -height / 2 + 0.85 + 0.85, 0]}
          material={sharedMaterials.windowFrame}
        >
          <boxGeometry args={[wallThick + 0.02, 1.7, 0.12]} />
        </mesh>

        {/* Esquadrias e Vidro da Janela Norte */}
        <group position={[0, -height / 2 + 0.85 + 0.85, -1.25]}>
          {/* Moldura branca */}
          <mesh material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.08, 1.65, 2.38]} />
          </mesh>
          {/* Vidro translúcido físico */}
          <mesh material={sharedMaterials.windowGlass}>
            <boxGeometry args={[0.02, 1.55, 2.28]} />
          </mesh>
        </group>

        {/* Esquadrias e Vidro da Janela Sul */}
        <group position={[0, -height / 2 + 0.85 + 0.85, 1.25]}>
          {/* Moldura branca */}
          <mesh material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.08, 1.65, 2.38]} />
          </mesh>
          {/* Vidro translúcido físico */}
          <mesh material={sharedMaterials.windowGlass}>
            <boxGeometry args={[0.02, 1.55, 2.28]} />
          </mesh>
        </group>

        {/* Peitoril de madeira nobre para apoio decorativo */}
        <mesh
          position={[-0.04, -height / 2 + 0.86, 0]}
          material={sharedMaterials.floorTrim}
        >
          <boxGeometry args={[0.26, 0.04, depth - 2.8]} />
        </mesh>

        {/* Cortina de linho estilizada recolhida na lateral norte da janela */}
        <group position={[-0.14, 0.2, -halfD + 1.6]}>
          <RoundedBox
            args={[0.18, height * 0.75, 0.35]}
            radius={0.06}
            smoothness={3}
            material={sharedMaterials.rugFabric}
          />
        </group>
      </group>
    </group>
  );
});

