import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../../Environment/Materials';
import { useHouseFloorClick } from '../useFloorClick';

interface SofaLegProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * Pé cônico escultural de madeira escura torneada com ponteira de latão dourado polido
 * (estilo Mid-Century Modern / Toy Story) - pernas altas, elegantes e bem destacadas.
 */
const SofaLeg = memo(function SofaLeg({
  position,
  rotation = [0, 0, 0],
}: SofaLegProps) {
  return (
    <group position={position} rotation={rotation}>
      {/* Placa metálica de fixação estrutural sob o chassi */}
      <mesh position={[0, 0.258, 0]} castShadow>
        <cylinderGeometry args={[0.052, 0.052, 0.012, 16]} />
        <primitive object={sharedMaterials.metalBrass} attach="material" />
      </mesh>
      {/* Corpo principal do pé em madeira escura nobre torneada */}
      <mesh position={[0, 0.155, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.046, 0.03, 0.2, 16]} />
        <primitive object={sharedMaterials.furnitureWoodDark} attach="material" />
      </mesh>
      {/* Ponteira metálica alta de latão dourado polido na base */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.032, 0.026, 0.06, 16]} />
        <primitive object={sharedMaterials.metalBrass} attach="material" />
      </mesh>
    </group>
  );
});

/**
 * Sala de Estar Completa (Living Room):
 * - Sofá em L espaçoso com almofadas acolchoadas
 * - Grande tapete aveludado e mesa de centro com livros/canecas
 * - Rack de TV com televisão CRT de tela plana e caixas de som
 * - Estante alta de livros com lombadas coloridas
 * - Plantas ornamentais de interior (Ficus/Monstera)
 * - Abajur de coluna clássico em latão
 */
export const LivingRoom = memo(function LivingRoom() {
  const handleFloorClick = useHouseFloorClick();

  return (
    <group name="room-living-room">
      {/* 1. Piso de Madeira da Sala de Estar (X: 7.6 a 17.6, Z: -4.0 a 3.2) */}
      <mesh
        receiveShadow
        position={[12.6, -0.01, -0.4]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[10.0, 7.2]} />
        <primitive object={sharedMaterials.floorWood} attach="material" />
      </mesh>

      {/* 2. Grande Tapete Retangular Aveludado */}
      <mesh
        receiveShadow
        position={[12.8, 0.008, -0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[6.2, 4.4]} />
        <primitive object={sharedMaterials.rugFabric} attach="material" />
      </mesh>

      {/* 3. Sofá em L (L-Shaped Couch) na Sala de Estar */}
      {/* Base Principal (corre no eixo X em Z = 1.2m) */}
      <group position={[13.2, 0, 1.2]}>
        {/* Chassi estrutural inferior de madeira maciça escura com 26cm de vão livre abaixo */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[4.22, 0.08, 1.26]}
          radius={0.03}
          smoothness={2}
          position={[0, 0.3, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />

        {/* 3 Almofadas de assento volumosas e fofas */}
        {[-1.38, 0, 1.38].map((cx, idx) => (
          <RoundedBox
            key={`sofa-seat-${idx}`}
            castShadow
            receiveShadow
            args={[1.36, 0.24, 1.22]}
            radius={0.08}
            smoothness={3}
            position={[cx, 0.46, 0]}
            material={sharedMaterials.livingSofaLinen}
          />
        ))}

        {/* Encosto acolchoado traseiro */}
        <RoundedBox
          castShadow
          args={[4.2, 0.72, 0.42]}
          radius={0.08}
          smoothness={3}
          position={[0, 0.82, 0.42]}
          material={sharedMaterials.livingSofaLinen}
        />

        {/* Braço esquerdo (extremidade aberta voltada para o centro da sala) */}
        <RoundedBox
          castShadow
          args={[0.38, 0.44, 1.28]}
          radius={0.06}
          smoothness={3}
          position={[-2.05, 0.58, 0.02]}
          material={sharedMaterials.livingSofaLinen}
        />

        {/* Pés de sustentação do corpo principal (estilo nórdico / mid-century altos e cônicos) */}
        <SofaLeg position={[-1.98, 0, -0.52]} rotation={[0.18, 0, -0.18]} />
        <SofaLeg position={[-0.65, 0, -0.52]} rotation={[0.18, 0, 0]} />
        <SofaLeg position={[0.7, 0, -0.52]} rotation={[0.18, 0, 0]} />
        <SofaLeg position={[1.82, 0, -0.52]} rotation={[0.18, 0, 0.18]} />
        <SofaLeg position={[-1.98, 0, 0.52]} rotation={[-0.18, 0, -0.18]} />
        <SofaLeg position={[-0.65, 0, 0.52]} rotation={[-0.18, 0, 0]} />
        <SofaLeg position={[0.7, 0, 0.52]} rotation={[-0.18, 0, 0]} />
        <SofaLeg position={[1.82, 0, 0.52]} rotation={[-0.18, 0, 0.18]} />

        {/* Almofadas decorativas sobre o encosto */}
        {[-1.2, -0.2, 0.8, 1.5].map((cx, idx) => (
          <RoundedBox
            key={`sofa-pillow-${idx}`}
            castShadow
            args={[0.55, 0.5, 0.22]}
            radius={0.06}
            smoothness={2}
            position={[cx, 0.8, 0.2]}
            rotation={[0.15, idx % 2 === 0 ? 0.1 : -0.1, 0]}
            material={
              idx % 2 === 0
                ? sharedMaterials.sofaCushionAlt
                : sharedMaterials.armchairOlive
            }
          />
        ))}
      </group>

      {/* Retorno em L do Sofá (Chaise lateral ao leste: X = 15.6m, Z de -0.8 a 1.2m) */}
      <group position={[15.6, 0, -0.1]}>
        {/* Chassi estrutural de madeira da chaise com acabamento nobre */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.16, 0.08, 1.82]}
          radius={0.03}
          smoothness={2}
          position={[0, 0.3, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />

        {/* Almofada inteiriça longa da chaise sobre o chassi */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.12, 0.24, 1.78]}
          radius={0.08}
          smoothness={3}
          position={[0, 0.46, 0]}
          material={sharedMaterials.livingSofaLinen}
        />

        {/* Rolinho almofadado de descanso na cabeceira da chaise */}
        <mesh position={[0, 0.68, -0.55]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.9, 16]} />
          <primitive object={sharedMaterials.armchairOlive} attach="material" />
        </mesh>

        {/* Pés de sustentação da Chaise proeminentes, abertos para fora e com ponteiras douradas */}
        {/* Canto frontal esquerdo (destacado no primeiro plano) */}
        <SofaLeg position={[-0.48, 0, -0.82]} rotation={[0.18, 0, -0.18]} />
        {/* Canto frontal direito */}
        <SofaLeg position={[0.48, 0, -0.82]} rotation={[0.18, 0, 0.18]} />
        {/* Apoio lateral direito */}
        <SofaLeg position={[0.48, 0, 0.05]} rotation={[0, 0, 0.18]} />
        {/* Canto traseiro direito */}
        <SofaLeg position={[0.48, 0, 0.82]} rotation={[-0.18, 0, 0.18]} />
        {/* Canto traseiro esquerdo */}
        <SofaLeg position={[-0.48, 0, 0.82]} rotation={[-0.18, 0, -0.18]} />
      </group>

      {/* 4. Mesa de Centro de Madeira Maciça da Sala */}
      <group position={[12.8, 0, -0.7]}>
        {/* Tampo oval/arredondado */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[2.1, 0.09, 1.15]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.42, 0]}
          material={sharedMaterials.furnitureWood}
        />
        {/* Prateleira inferior para revistas */}
        <RoundedBox
          args={[1.7, 0.04, 0.85]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.18, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />
        {/* 4 Pés torneados */}
        {[
          [-0.85, -0.42],
          [0.85, -0.42],
          [-0.85, 0.42],
          [0.85, 0.42],
        ].map(([px, pz], idx) => (
          <mesh
            key={idx}
            position={[px, 0.21, pz]}
            material={sharedMaterials.furnitureWoodDark}
          >
            <cylinderGeometry args={[0.035, 0.025, 0.42, 12]} />
          </mesh>
        ))}

        {/* Canecas e revista sobre a mesa */}
        <group position={[-0.45, 0.48, 0.15]}>
          <mesh castShadow material={sharedMaterials.plantPotCeramic}>
            <cylinderGeometry args={[0.065, 0.05, 0.12, 14]} />
          </mesh>
        </group>
        <group position={[0.3, 0.47, -0.1]}>
          <RoundedBox
            args={[0.32, 0.02, 0.42]}
            radius={0.01}
            smoothness={2}
            material={sharedMaterials.wallWainscot}
          />
        </group>
      </group>

      {/* 5. Rack de TV e Centro Multimídia Norte (X = 12.8m, Z = -3.4m) */}
      <group position={[12.8, 0, -3.45]}>
        {/* Rack de TV de madeira */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[3.4, 0.65, 0.75]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.36, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />
        {/* Prateleiras do rack com portas e aberturas */}
        <RoundedBox
          args={[3.2, 0.45, 0.7]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.35, 0.04]}
          material={sharedMaterials.furnitureWood}
        />

        {/* Televisão CRT Vintage Grande (Gabinete oliva/cinza) */}
        <group position={[0, 0.7, 0]}>
          <RoundedBox
            castShadow
            args={[1.55, 1.15, 0.85]}
            radius={0.06}
            smoothness={3}
            position={[0, 0.62, 0]}
            material={sharedMaterials.tvCaseRetro}
          />
          {/* Tela de vidro CRT curva com leve reflexo */}
          <RoundedBox
            args={[1.25, 0.88, 0.12]}
            radius={0.05}
            smoothness={3}
            position={[0, 0.62, 0.4]}
            material={sharedMaterials.tvScreenOff}
          />
          {/* Botões rotativos e grade de alto-falante */}
          <group position={[0.52, 0.35, 0.42]}>
            <mesh material={sharedMaterials.metalBrass}>
              <cylinderGeometry args={[0.04, 0.04, 0.03, 12]} />
            </mesh>
          </group>
        </group>

        {/* Caixas de Som Hi-Fi nas laterais do rack */}
        {[-1.35, 1.35].map((sx, idx) => (
          <group key={idx} position={[sx, 0.7, 0]}>
            <RoundedBox
              castShadow
              args={[0.42, 0.75, 0.38]}
              radius={0.03}
              smoothness={2}
              position={[0, 0.4, 0]}
              material={sharedMaterials.furnitureWoodDark}
            />
            {/* Cones de alto-falante */}
            <mesh position={[0, 0.52, 0.2]} material={sharedMaterials.robotCharcoal}>
              <cylinderGeometry args={[0.12, 0.08, 0.02, 16]} />
            </mesh>
            <mesh position={[0, 0.24, 0.2]} material={sharedMaterials.robotCharcoal}>
              <cylinderGeometry args={[0.15, 0.1, 0.02, 16]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* 6. Estante Alta de Livros (Parede Norte, X = 9.2m, Z = -3.55m) */}
      <group position={[9.2, 0, -3.55]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.65, 3.4, 0.52]}
          radius={0.03}
          smoothness={3}
          position={[0, 1.7, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />
        {/* Prateleiras com livros coloridos */}
        {[0.6, 1.25, 1.9, 2.55].map((py, sIdx) => (
          <group key={sIdx} position={[0, py, 0.06]}>
            <RoundedBox
              args={[1.5, 0.04, 0.42]}
              radius={0.01}
              smoothness={2}
              material={sharedMaterials.furnitureWood}
            />
            {/* Fileira de livros */}
            {[-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6].map((bx, bIdx) => (
              <mesh
                key={bIdx}
                castShadow
                position={[bx, 0.22, 0]}
                material={
                  bIdx % 2 === 0
                    ? sharedMaterials.sofaCushionAlt
                    : sharedMaterials.armchairOlive
                }
              >
                <boxGeometry args={[0.14, 0.38, 0.28]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 7. Planta Ornamental Grande de Interior (Ficus / Costela de Adão) */}
      <group position={[16.6, 0, -3.2]}>
        {/* Vaso cerâmico */}
        <mesh castShadow material={sharedMaterials.plantPotCeramic}>
          <cylinderGeometry args={[0.38, 0.28, 0.68, 20]} />
        </mesh>
        <mesh position={[0, 0.35, 0]} material={sharedMaterials.plantSoil}>
          <cylinderGeometry args={[0.36, 0.36, 0.05, 20]} />
        </mesh>
        {/* Folhagem em camadas volumétricas */}
        {[
          [0, 0.9, 0, 0.55],
          [-0.2, 1.25, 0.15, 0.48],
          [0.2, 1.45, -0.1, 0.52],
          [0, 1.75, 0.1, 0.45],
        ].map(([fx, fy, fz, fr], idx) => (
          <mesh
            key={idx}
            castShadow
            position={[fx, fy, fz]}
            material={sharedMaterials.plantFoliage}
          >
            <sphereGeometry args={[fr, 12, 12]} />
          </mesh>
        ))}
      </group>

      {/* 8. Abajur de Coluna Clássico de Sala */}
      <group position={[16.8, 0, 1.8]}>
        <mesh material={sharedMaterials.metalBrass}>
          <cylinderGeometry args={[0.22, 0.26, 0.08, 16]} />
        </mesh>
        <mesh position={[0, 1.1, 0]} material={sharedMaterials.metalBrass}>
          <cylinderGeometry args={[0.025, 0.025, 2.1, 12]} />
        </mesh>
        {/* Cúpula de tecido */}
        <mesh position={[0, 2.15, 0]} material={sharedMaterials.lampShade}>
          <cylinderGeometry args={[0.24, 0.42, 0.48, 20, 1, true]} />
        </mesh>
        <pointLight
          color="#FFF0D4"
          intensity={1.8}
          distance={6.5}
          decay={2}
          position={[0, 2.1, 0]}
        />
      </group>
    </group>
  );
});

