import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../Environment/Materials';

interface ArchitectureProps {
  wallHeight?: number;
}

/**
 * Estrutura Arquitetônica Global da Residência:
 * - Paredes externas perimétricas com espessura e acabamento em gesso nobre
 * - Paredes divisórias internas com vãos precisos para as portas (passagem livre sem colisão)
 * - Corte arquitetônico frontal (dollhouse cutaway) preservando a visibilidade interna da câmera
 * - Rodapés entalhados e guarnições acompanhando todos os cômodos
 */
export const Architecture = memo(function Architecture({
  wallHeight = 4.6,
}: ArchitectureProps) {
  const wallThick = 0.2;

  return (
    <group name="house-architecture-global">
      {/* ======================================================== */}
      {/* 1. PAREDE NORTE UNIFICADA DA CASA (Z = -4.0m)             */}
      {/* Quarto original já renderiza sua parte Norte [-5, 5].    */}
      {/* Aqui estendemos para Corredor [5, 7.6] e Sala [7.6, 17.6] */}
      {/* ======================================================== */}
      <group position={[11.3, 0, -4.0 - wallThick / 2]}>
        {/* Parede de alvenaria Norte (Corredor + Sala de Estar) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[12.6 + wallThick, wallHeight, wallThick]} />
        </mesh>

        {/* Rodapé Norte da Sala e Corredor */}
        <mesh
          receiveShadow
          position={[0, 0.12, wallThick / 2 + 0.04]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[12.6, 0.24, 0.08]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. PAREDE LESTE EXTERNA DA CASA (X = +17.6m)             */}
      {/* Abrange Sala de Estar e Cozinha (Z de -4.0 até 8.5m)     */}
      {/* ======================================================== */}
      <group position={[17.6 + wallThick / 2, 0, 2.25]}>
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight, 12.5 + wallThick * 2]} />
        </mesh>

        {/* Rodapé leste */}
        <mesh
          receiveShadow
          position={[-wallThick / 2 - 0.04, 0.12, 0]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, 12.5]} />
        </mesh>

        {/* Janela Panorâmica Leste da Sala de Estar (Z = -0.5m) */}
        <group position={[-wallThick / 2 - 0.03, 2.8, -2.75]}>
          <RoundedBox
            args={[0.09, 2.4, 2.6]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.windowFrame}
          />
          <mesh position={[-0.02, 0, 0]} material={sharedMaterials.windowGlass}>
            <boxGeometry args={[0.04, 2.18, 2.38]} />
          </mesh>
        </group>

        {/* Janela de Ventilação da Cozinha (Z = 5.8m) */}
        <group position={[-wallThick / 2 - 0.03, 3.0, 3.55]}>
          <RoundedBox
            args={[0.09, 1.6, 1.8]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.windowFrame}
          />
          <mesh position={[-0.02, 0, 0]} material={sharedMaterials.windowGlass}>
            <boxGeometry args={[0.04, 1.4, 1.6]} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. PAREDE DIVISÓRIA ENTRE QUARTO E CORREDOR (X = 5.0m)    */}
      {/* Possui vão aberto para a porta em Z in [1.65, 3.05]      */}
      {/* ======================================================== */}
      <group position={[5.0, 0, 0]}>
        {/* Segmento Norte da parede divisória (Z de -4.0 a 1.65) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, -1.175]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight, 5.65]} />
        </mesh>
        {/* Rodapé no lado do corredor */}
        <mesh
          receiveShadow
          position={[wallThick / 2 + 0.04, 0.12, -1.175]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, 5.65]} />
        </mesh>

        {/* Verga superior acima do vão da porta (Z de 1.65 a 3.05, Y de 3.32 a wallHeight) */}
        <mesh
          castShadow
          receiveShadow
          position={[
            0,
            3.32 + (wallHeight - 3.32) / 2,
            2.35,
          ]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight - 3.32, 1.4]} />
        </mesh>

        {/* Segmento Sul da parede divisória (Z de 3.05 a 4.0) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, 3.525]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight, 0.95]} />
        </mesh>
        <mesh
          receiveShadow
          position={[wallThick / 2 + 0.04, 0.12, 3.525]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, 0.95]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 4. PAREDE DIVISÓRIA ENTRE CORREDOR E SALA/COZINHA (X=7.6) */}
      {/* Possui vão da Sala (Z=0.5m) e vão da Cozinha (Z=6.0m)    */}
      {/* ======================================================== */}
      <group position={[7.6, 0, 0]}>
        {/* Segmento Norte (Z de -4.0 a -0.4) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, -2.2]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight, 3.6]} />
        </mesh>
        <mesh
          receiveShadow
          position={[-wallThick / 2 - 0.04, 0.12, -2.2]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, 3.6]} />
        </mesh>

        {/* Verga sobre o arco de entrada da Sala (Z de -0.4 a 1.4) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 3.32 + (wallHeight - 3.32) / 2, 0.5]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight - 3.32, 1.8]} />
        </mesh>

        {/* Segmento Central entre Sala e Cozinha (Z de 1.4 a 5.35) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, 3.375]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight, 3.95]} />
        </mesh>
        <mesh
          receiveShadow
          position={[-wallThick / 2 - 0.04, 0.12, 3.375]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, 3.95]} />
        </mesh>

        {/* Verga sobre a porta da Cozinha (Z de 5.35 a 6.65) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 3.1 + (wallHeight - 3.1) / 2, 6.0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight - 3.1, 1.3]} />
        </mesh>

        {/* Segmento Sul até o Banheiro (Z de 6.65 a 8.5) */}
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, 7.575]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, wallHeight, 1.85]} />
        </mesh>
        <mesh
          receiveShadow
          position={[-wallThick / 2 - 0.04, 0.12, 7.575]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, 1.85]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 5. DIVISÓRIA INTERNA SALA / COZINHA (Z = 3.2m, X in [7.6, 12]) */}
      {/* Balcão divisor em meia-altura com passagem aberta [12, 17.6] */}
      {/* ======================================================== */}
      <group position={[9.8, 0, 3.2]}>
        {/* Mureta decorativa de integração em meia-altura */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 1.15 / 2, 0]}
          material={sharedMaterials.wallWainscot}
        >
          <boxGeometry args={[4.4, 1.15, 0.28]} />
        </mesh>
        {/* Tampo de madeira do balcão divisor */}
        <RoundedBox
          castShadow
          args={[4.6, 0.08, 0.42]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.15, 0]}
          material={sharedMaterials.furnitureWood}
        />
      </group>

      {/* ======================================================== */}
      {/* 6. PAREDES DO BANHEIRO SOCIAL (X in [5.0, 10.6], Z in [8.5, 13.5]) */}
      {/* ======================================================== */}
      <group name="bathroom-walls">
        {/* Parede Norte do Banheiro (Z = 8.5m) com vão de porta em X = 6.3m */}
        <group position={[0, 0, 8.5]}>
          {/* Lado Oeste (X de 5.0 a 5.65) */}
          <mesh
            castShadow
            receiveShadow
            position={[5.325, wallHeight / 2, 0]}
            material={sharedMaterials.wallPlaster}
          >
            <boxGeometry args={[0.65, wallHeight, wallThick]} />
          </mesh>
          {/* Verga sobre a porta do Banheiro (X de 5.65 a 6.95) */}
          <mesh
            castShadow
            receiveShadow
            position={[6.3, 3.0 + (wallHeight - 3.0) / 2, 0]}
            material={sharedMaterials.wallPlaster}
          >
            <boxGeometry args={[1.3, wallHeight - 3.0, wallThick]} />
          </mesh>
          {/* Lado Leste (X de 6.95 a 10.6) */}
          <mesh
            castShadow
            receiveShadow
            position={[8.775, wallHeight / 2, 0]}
            material={sharedMaterials.wallPlaster}
          >
            <boxGeometry args={[3.65, wallHeight, wallThick]} />
          </mesh>
        </group>

        {/* Parede Oeste do Banheiro (X = 5.0m, Z de 8.5 a 13.5) */}
        <mesh
          castShadow
          receiveShadow
          position={[5.0 - wallThick / 2, wallHeight / 2, 11.0]}
          material={sharedMaterials.bathroomWallTile}
        >
          <boxGeometry args={[wallThick, wallHeight, 5.0 + wallThick]} />
        </mesh>

        {/* Parede Sul do Banheiro (Z = 13.5m, X de 5.0 a 10.6) */}
        <mesh
          castShadow
          receiveShadow
          position={[7.8, wallHeight / 2, 13.5 + wallThick / 2]}
          material={sharedMaterials.bathroomWallTile}
        >
          <boxGeometry args={[5.6 + wallThick * 2, wallHeight, wallThick]} />
        </mesh>

        {/* Parede Leste do Banheiro (X = 10.6m, Z de 8.5 a 13.5) */}
        <mesh
          castShadow
          receiveShadow
          position={[10.6 + wallThick / 2, wallHeight / 2, 11.0]}
          material={sharedMaterials.bathroomWallTile}
        >
          <boxGeometry args={[wallThick, wallHeight, 5.0]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 7. PAREDE SUL DA COZINHA (Z = 8.5m, X in [10.6, 17.6])   */}
      {/* Divisória com corte arquitetônico suave                   */}
      {/* ======================================================== */}
      <group position={[14.1, 0, 8.5 + wallThick / 2]}>
        <mesh
          castShadow
          receiveShadow
          position={[0, wallHeight / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[7.0, wallHeight, wallThick]} />
        </mesh>
        <mesh
          receiveShadow
          position={[0, 0.12, -wallThick / 2 - 0.04]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[7.0, 0.24, 0.08]} />
        </mesh>
      </group>
    </group>
  );
});
