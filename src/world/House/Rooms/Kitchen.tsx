import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../../Environment/Materials';
import { useHouseFloorClick } from '../useFloorClick';

/**
 * Cozinha Residencial (Kitchen):
 * - Piso de ladrilho cerâmico xadrez (checkered tile)
 * - Geladeira vintage retrô com puxador cromado
 * - Fogão 4 bocas com coifa de exaustão e panelas de cobre/inox
 * - Bancada de granito em L com pia e torneira
 * - Ilha / balcão de refeições rápidas com banquetas
 * - Fruteira, chaleira e lixeira de pedal
 */
export const Kitchen = memo(function Kitchen() {
  const handleFloorClick = useHouseFloorClick();

  return (
    <group name="room-kitchen">
      {/* 1. Piso Cerâmico Xadrez da Cozinha (X: 7.6 a 17.6, Z: 3.2 a 8.5) */}
      <mesh
        receiveShadow
        position={[12.6, 0.005, 5.85]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[10.0, 5.3]} />
        <primitive object={sharedMaterials.floorKitchen} attach="material" />
      </mesh>

      {/* 2. Geladeira Retrô Vintage (X = 8.4m, Z = 7.6m) */}
      <group position={[8.4, 0, 7.6]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.15, 2.7, 1.05]}
          radius={0.12}
          smoothness={3}
          position={[0, 1.35, 0]}
          material={sharedMaterials.kitchenFridge}
        />
        {/* Divisória da porta do freezer */}
        <mesh position={[0, 1.85, 0.53]} material={sharedMaterials.metalChrome}>
          <boxGeometry args={[1.12, 0.02, 0.02]} />
        </mesh>
        {/* Puxadores cromados horizontais */}
        {[1.95, 1.65].map((py, idx) => (
          <group key={idx} position={[0.38, py, 0.58]}>
            <mesh material={sharedMaterials.metalChrome}>
              <cylinderGeometry args={[0.02, 0.02, 0.28, 12]} />
            </mesh>
          </group>
        ))}
        {/* Emblema vintage da geladeira */}
        <mesh position={[0, 2.45, 0.54]} material={sharedMaterials.metalChrome}>
          <boxGeometry args={[0.22, 0.05, 0.01]} />
        </mesh>
      </group>

      {/* 3. Fogão 4 Bocas com Coifa (X = 11.2m, Z = 7.7m) */}
      <group position={[11.2, 0, 7.7]}>
        {/* Corpo do fogão */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.1, 1.15, 0.95]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.58, 0]}
          material={sharedMaterials.kitchenCabinet}
        />
        {/* Tampo de inox do fogão */}
        <RoundedBox
          args={[1.12, 0.06, 0.97]}
          radius={0.02}
          smoothness={2}
          position={[0, 1.18, 0]}
          material={sharedMaterials.metalChrome}
        />
        {/* 4 Bocas com grelhas circulares pretas */}
        {[
          [-0.32, -0.22],
          [0.32, -0.22],
          [-0.32, 0.22],
          [0.32, 0.22],
        ].map(([gx, gz], idx) => (
          <mesh
            key={idx}
            position={[gx, 1.22, gz]}
            material={sharedMaterials.robotCharcoal}
          >
            <cylinderGeometry args={[0.14, 0.14, 0.02, 16]} />
          </mesh>
        ))}
        {/* Panela com tampa sobre uma das bocas */}
        <group position={[-0.32, 1.25, 0.22]}>
          <mesh castShadow material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.13, 0.12, 0.16, 16]} />
          </mesh>
          <mesh position={[0, 0.09, 0]} material={sharedMaterials.metalBrass}>
            <cylinderGeometry args={[0.14, 0.14, 0.03, 16]} />
          </mesh>
        </group>

        {/* Coifa de Exaustão sobre o fogão */}
        <group position={[0, 2.5, 0]}>
          {/* Campânula da coifa */}
          <mesh castShadow material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.25, 0.62, 0.55, 4, 1, false, Math.PI / 4]} />
          </mesh>
          {/* Duto vertical */}
          <mesh position={[0, 0.7, 0]} material={sharedMaterials.metalChrome}>
            <boxGeometry args={[0.35, 1.1, 0.35]} />
          </mesh>
        </group>
      </group>

      {/* 4. Bancada Principal em L com Pia e Armários (X = 14.8m, Z = 7.7m e volta em X = 17.0m) */}
      <group position={[14.8, 0, 7.7]}>
        {/* Gabinete inferior */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[3.4, 1.12, 0.95]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.56, 0]}
          material={sharedMaterials.kitchenCabinet}
        />
        {/* Tampo de granito verde escuro polido */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[3.5, 0.09, 1.05]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.16, 0]}
          material={sharedMaterials.kitchenCountertop}
        />

        {/* Cuba da pia em inox escovado */}
        <group position={[0.2, 1.16, 0]}>
          <mesh material={sharedMaterials.metalChrome}>
            <boxGeometry args={[0.95, 0.02, 0.65]} />
          </mesh>
          {/* Torneira de bica alta em latão polido */}
          <group position={[0, 0.15, -0.22]}>
            <mesh material={sharedMaterials.metalBrass}>
              <cylinderGeometry args={[0.025, 0.03, 0.28, 12]} />
            </mesh>
            <mesh position={[0, 0.16, 0.08]} rotation={[0.6, 0, 0]} material={sharedMaterials.metalBrass}>
              <cylinderGeometry args={[0.022, 0.022, 0.18, 12]} />
            </mesh>
          </group>
        </group>

        {/* Puxadores dos armários */}
        {[-1.2, -0.6, 0.6, 1.2].map((px, idx) => (
          <mesh
            key={idx}
            position={[px, 0.65, -0.5]}
            material={sharedMaterials.metalBrass}
          >
            <boxGeometry args={[0.12, 0.02, 0.02]} />
          </mesh>
        ))}
      </group>

      {/* 5. Ilha / Balcão Americano Central (X = 12.8m, Z = 4.4m) */}
      <group position={[12.8, 0, 4.4]}>
        {/* Base da ilha */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[2.6, 1.15, 1.1]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.58, 0]}
          material={sharedMaterials.kitchenCabinet}
        />
        {/* Tampo de madeira nobre (açougueiro / butcher block) */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[2.85, 0.09, 1.3]}
          radius={0.03}
          smoothness={3}
          position={[0, 1.18, 0]}
          material={sharedMaterials.furnitureWood}
        />

        {/* Fruteira com frutas sobre o balcão */}
        <group position={[-0.45, 1.25, 0]}>
          <mesh castShadow material={sharedMaterials.plantPotCeramic}>
            <cylinderGeometry args={[0.24, 0.14, 0.12, 16]} />
          </mesh>
          {/* Frutas estilizadas coloridas */}
          {[-0.08, 0.08].map((fx, idx) => (
            <mesh key={idx} position={[fx, 0.08, 0]} material={sharedMaterials.sofaCushionAlt}>
              <sphereGeometry args={[0.065, 10, 10]} />
            </mesh>
          ))}
          <mesh position={[0, 0.12, 0]} material={sharedMaterials.armchairOlive}>
            <sphereGeometry args={[0.07, 10, 10]} />
          </mesh>
        </group>

        {/* Banquetas altas de madeira na frente da ilha */}
        {[-0.75, 0.75].map((bx, idx) => (
          <group key={idx} position={[bx, 0, -0.9]}>
            {/* Assento redondo */}
            <mesh castShadow position={[0, 0.82, 0]} material={sharedMaterials.furnitureWoodDark}>
              <cylinderGeometry args={[0.22, 0.22, 0.06, 16]} />
            </mesh>
            {/* 4 Pés da banqueta */}
            {[
              [-0.12, -0.12],
              [0.12, -0.12],
              [-0.12, 0.12],
              [0.12, 0.12],
            ].map(([lx, lz], pIdx) => (
              <mesh key={pIdx} position={[lx, 0.4, lz]} material={sharedMaterials.furnitureWood}>
                <cylinderGeometry args={[0.02, 0.015, 0.8, 10]} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* 6. Lixeira de Cozinha com Pedal (X = 16.8m, Z = 6.8m) */}
      <group position={[16.8, 0, 6.8]}>
        <mesh castShadow material={sharedMaterials.metalChrome}>
          <cylinderGeometry args={[0.22, 0.2, 0.58, 16]} />
        </mesh>
        {/* Pedal */}
        <mesh position={[0, 0.04, -0.22]} material={sharedMaterials.robotCharcoal}>
          <boxGeometry args={[0.1, 0.03, 0.08]} />
        </mesh>
      </group>
    </group>
  );
});

