import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../../Environment/Materials';
import { useHouseFloorClick } from '../useFloorClick';

/**
 * Banheiro Social Completo (Bathroom):
 * - Piso de azulejo cerâmico vitrificado em tom suave
 * - Box de vidro translúcido com chuveiro ducha inox
 * - Vaso sanitário de porcelana com caixa acoplada
 * - Gabinete com cuba, espelho bisotado e torneira
 * - Tapete felpudo de banheiro e toalhas penduradas
 * - Cesto de roupas e frascos de higiene
 */
export const Bathroom = memo(function Bathroom() {
  const handleFloorClick = useHouseFloorClick();

  return (
    <group name="room-bathroom">
      {/* 1. Piso Cerâmico do Banheiro (X: 5.0 a 10.6, Z: 8.5 a 13.5) */}
      <mesh
        receiveShadow
        position={[7.8, -0.01, 11.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[5.6, 5.0]} />
        <primitive object={sharedMaterials.floorBathroom} attach="material" />
      </mesh>

      {/* 2. Tapete Felpudo de Banheiro (Bathmat) */}
      <mesh
        receiveShadow
        position={[7.8, 0.008, 10.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleFloorClick}
      >
        <planeGeometry args={[1.8, 1.2]} />
        <primitive object={sharedMaterials.rugFabric} attach="material" />
      </mesh>

      {/* 3. Box de Vidro com Chuveiro (Canto Sudoeste: X = 6.2m, Z = 12.2m) */}
      <group position={[6.2, 0, 12.2]}>
        {/* Prato / Base do box no chão */}
        <RoundedBox
          args={[1.9, 0.08, 1.9]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.04, 0]}
          material={sharedMaterials.bathroomPorcelain}
        />
        {/* Painéis de vidro temperado do box */}
        <mesh position={[0, 1.6, -0.92]} material={sharedMaterials.bathroomGlass}>
          <boxGeometry args={[1.86, 3.0, 0.03]} />
        </mesh>
        <mesh position={[0.92, 1.6, 0]} material={sharedMaterials.bathroomGlass}>
          <boxGeometry args={[0.03, 3.0, 1.86]} />
        </mesh>

        {/* Perfis cromados do box */}
        <mesh position={[0.94, 1.6, -0.94]} material={sharedMaterials.metalChrome}>
          <boxGeometry args={[0.06, 3.1, 0.06]} />
        </mesh>

        {/* Chuveiro com ducha rain-shower cromada no alto */}
        <group position={[-0.6, 2.8, 0.6]}>
          <mesh material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.02, 0.02, 0.45, 12]} />
          </mesh>
          <mesh position={[0, -0.05, 0]} material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.18, 0.16, 0.03, 16]} />
          </mesh>
        </group>
      </group>

      {/* 4. Vaso Sanitário de Porcelana Branca (X = 9.8m, Z = 12.8m) */}
      <group position={[9.8, 0, 12.8]}>
        {/* Caixa acoplada */}
        <RoundedBox
          castShadow
          args={[0.65, 0.68, 0.32]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.64, 0.32]}
          material={sharedMaterials.bathroomPorcelain}
        />
        {/* Botão de descarga cromado */}
        <mesh position={[0, 0.99, 0.32]} material={sharedMaterials.metalChrome}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} />
        </mesh>

        {/* Bacia sanitária */}
        <group position={[0, 0.25, 0]}>
          <mesh castShadow material={sharedMaterials.bathroomPorcelain}>
            <cylinderGeometry args={[0.26, 0.22, 0.48, 18]} />
          </mesh>
        </group>
        {/* Tampa e assento sanitário */}
        <RoundedBox
          args={[0.48, 0.05, 0.52]}
          radius={0.06}
          smoothness={3}
          position={[0, 0.51, -0.04]}
          material={sharedMaterials.bathroomPorcelain}
        />

        {/* Suporte de papel higiênico ao lado */}
        <group position={[0.55, 0.65, 0]}>
          <mesh material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.015, 0.015, 0.22, 10]} />
          </mesh>
          <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sharedMaterials.wallWainscot}>
            <cylinderGeometry args={[0.07, 0.07, 0.16, 14]} />
          </mesh>
        </group>
      </group>

      {/* 5. Gabinete de Banheiro com Cuba e Espelho (X = 9.8m, Z = 9.8m) */}
      <group position={[9.8, 0, 9.8]}>
        {/* Gabinete de madeira / laca branca */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.75, 0.92, 1.25]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.46, 0]}
          material={sharedMaterials.kitchenCabinet}
        />
        {/* Cuba esculpida de porcelana sobre o gabinete */}
        <RoundedBox
          castShadow
          args={[0.65, 0.15, 0.95]}
          radius={0.06}
          smoothness={3}
          position={[0, 0.98, 0]}
          material={sharedMaterials.bathroomPorcelain}
        />
        {/* Torneira monocomando cromada */}
        <group position={[0.24, 1.08, 0]}>
          <mesh material={sharedMaterials.metalChrome}>
            <cylinderGeometry args={[0.02, 0.025, 0.22, 12]} />
          </mesh>
        </group>

        {/* Espelho Redondo Bisotado acima da pia */}
        <group position={[0.38, 2.15, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh material={sharedMaterials.metalBrass}>
            <torusGeometry args={[0.55, 0.025, 12, 32]} />
          </mesh>
          <mesh position={[0, 0, -0.01]} material={sharedMaterials.tvScreenOff}>
            <circleGeometry args={[0.54, 32]} />
          </mesh>
        </group>

        {/* Frascos de sabonete líquido e escova de dentes */}
        <group position={[-0.15, 1.08, 0.35]}>
          <mesh castShadow material={sharedMaterials.robotCoralTrim}>
            <cylinderGeometry args={[0.04, 0.04, 0.14, 12]} />
          </mesh>
        </group>
      </group>

      {/* 6. Cesto de Roupas em Vime (X = 5.6m, Z = 9.4m) */}
      <group position={[5.6, 0, 9.4]}>
        <mesh castShadow material={sharedMaterials.furnitureWood}>
          <cylinderGeometry args={[0.28, 0.24, 0.65, 16]} />
        </mesh>
        <mesh position={[0, 0.34, 0]} material={sharedMaterials.wallWainscot}>
          <cylinderGeometry args={[0.29, 0.29, 0.06, 16]} />
        </mesh>
      </group>
    </group>
  );
});

