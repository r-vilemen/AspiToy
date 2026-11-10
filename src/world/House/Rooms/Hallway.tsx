import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../../Environment/Materials';
import { useHouseFloorClick } from '../useFloorClick';

/**
 * Corredor Central (Hallway):
 * - Conector de todos os ambientes da residência
 * - Piso de taco de madeira em espinha-de-peixe
 * - Aparador vintage com telefone de disco e abajur
 * - Tapete passadeira (runner rug) estilizado
 * - Iluminação aconchegante de arandelas
 */
export const Hallway = memo(function Hallway() {
  const handleFloorClick = useHouseFloorClick();

  return (
    <group name="room-hallway">
      {/* 1. Piso de Parquet do Corredor (X: 5.0 a 7.6, Z: -4.0 a 8.5) */}
      <mesh
        receiveShadow
        position={[6.3, -0.01, 2.25]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[2.6, 12.5]} />
        <primitive object={sharedMaterials.floorParquet} attach="material" />
      </mesh>

      {/* 2. Tapete Passadeira (Runner Rug) ao longo do corredor */}
      <mesh
        receiveShadow
        position={[6.3, 0.008, 2.25]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[1.4, 10.0]} />
        <primitive object={sharedMaterials.rugFabric} attach="material" />
      </mesh>
      {/* Borda do tapete passadeira */}
      <mesh
        receiveShadow
        position={[6.3, 0.01, 2.25]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.65, 0.72, 32]} />
        <primitive object={sharedMaterials.rugBorder} attach="material" />
      </mesh>

      {/* 3. Aparador / Console Vintage de Corredor (X = 5.35m, Z = -1.8m) */}
      <group position={[5.35, 0, -1.8]}>
        {/* Tampo do aparador */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.45, 0.08, 1.35]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.05, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />
        {/* Gaveteiro central */}
        <RoundedBox
          castShadow
          args={[0.42, 0.28, 1.25]}
          radius={0.015}
          smoothness={2}
          position={[0, 0.88, 0]}
          material={sharedMaterials.furnitureWood}
        />
        {/* Puxadores de latão */}
        {[-0.32, 0.32].map((pz, idx) => (
          <mesh
            key={idx}
            position={[0.22, 0.88, pz]}
            material={sharedMaterials.metalBrass}
          >
            <sphereGeometry args={[0.025, 10, 10]} />
          </mesh>
        ))}
        {/* 4 Pés torneados */}
        {[
          [-0.16, -0.55],
          [0.16, -0.55],
          [-0.16, 0.55],
          [0.16, 0.55],
        ].map(([px, pz], idx) => (
          <mesh
            key={idx}
            position={[px, 0.37, pz]}
            material={sharedMaterials.furnitureWoodDark}
          >
            <cylinderGeometry args={[0.03, 0.022, 0.74, 12]} />
          </mesh>
        ))}

        {/* Telefone de disco vintage sobre o aparador */}
        <group position={[0, 1.12, -0.28]}>
          <RoundedBox
            castShadow
            args={[0.22, 0.08, 0.22]}
            radius={0.02}
            smoothness={2}
            material={sharedMaterials.robotCharcoal}
          />
          <mesh position={[0, 0.06, 0]} material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.06, 0.06, 0.02, 16]} />
          </mesh>
          {/* Monofone */}
          <mesh
            position={[0, 0.12, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={sharedMaterials.robotCharcoal}
          >
            <capsuleGeometry args={[0.035, 0.18, 8, 12]} />
          </mesh>
        </group>

        {/* Vaso de flor pequeno sobre o aparador */}
        <group position={[0, 1.12, 0.3]}>
          <mesh castShadow material={sharedMaterials.plantPotCeramic}>
            <cylinderGeometry args={[0.08, 0.05, 0.22, 16]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={sharedMaterials.plantFoliage}>
            <sphereGeometry args={[0.12, 12, 12]} />
          </mesh>
        </group>
      </group>

      {/* 4. Arandelas de Parede com Luz Suave ao longo de todo o corredor */}
      {[-2.0, 3.5, 6.2].map((zPos, idx) => (
        <group key={idx} position={[5.08, 2.6, zPos]}>
          <mesh material={sharedMaterials.metalBrass}>
            <cylinderGeometry args={[0.04, 0.06, 0.08, 12]} />
          </mesh>
          <mesh position={[0.06, 0, 0]} material={sharedMaterials.lampShade}>
            <sphereGeometry args={[0.09, 14, 14]} />
          </mesh>
          <pointLight
            color="#FFE6B0"
            intensity={1.2}
            distance={5.0}
            decay={2}
          />
        </group>
      ))}

      {/* 5. Quadros decorativos no corredor */}
      <group position={[5.06, 2.2, 0.2]}>
        <RoundedBox
          args={[0.04, 0.8, 0.6]}
          radius={0.01}
          smoothness={2}
          material={sharedMaterials.furnitureWoodDark}
        />
        <mesh position={[0.022, 0, 0]}>
          <boxGeometry args={[0.01, 0.65, 0.45]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
});

