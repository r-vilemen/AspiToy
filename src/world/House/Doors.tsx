import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../Environment/Materials';

/**
 * Portas e Passagens Funcionais da Residência:
 * - Batentes e guarnições entalhadas em relevo
 * - Folhas de madeira nobre abertas com ferragens de latão
 * - Espaço livre sem colisão física para navegação contínua do AspiToy
 */
export const Doors = memo(function Doors() {
  return (
    <group name="house-doors-system">
      {/* ======================================================== */}
      {/* 1. PORTA DO QUARTO -> CORREDOR (X = 5.0m, Z = 2.35m)     */}
      {/* ======================================================== */}
      <group position={[5.0, 0, 2.35]}>
        {/* Batente / Guarnição da porta */}
        <RoundedBox
          castShadow
          args={[0.24, 3.32, 1.56]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.66, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Vão interno oco */}
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.26, 3.2, 1.4]} />
          <meshBasicMaterial visible={false} />
        </mesh>

        {/* Folha da porta aberta a 80 graus encostada na parede do quarto */}
        <group position={[-0.08, 0, -0.68]} rotation={[0, -1.35, 0]}>
          <RoundedBox
            castShadow
            args={[0.065, 3.16, 1.36]}
            radius={0.015}
            smoothness={3}
            position={[0, 1.58, 0.68]}
            material={sharedMaterials.furnitureWood}
          />
          {/* Almofadas entalhadas na folha da porta */}
          {[
            [2.3, 0.68],
            [0.85, 0.68],
          ].map(([py, pz], idx) => (
            <RoundedBox
              key={idx}
              args={[0.08, 1.1, 0.48]}
              radius={0.01}
              smoothness={2}
              position={[0, py, pz]}
              material={sharedMaterials.furnitureWoodDark}
            />
          ))}
          {/* Maçaneta de latão polido */}
          <group position={[0.045, 1.42, 1.22]}>
            <mesh material={sharedMaterials.metalBrass}>
              <boxGeometry args={[0.02, 0.22, 0.06]} />
            </mesh>
            <mesh position={[0.04, 0, 0]} material={sharedMaterials.metalBrass}>
              <sphereGeometry args={[0.05, 12, 12]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 2. ARCO DE ENTRADA CORREDOR -> SALA (X = 7.6m, Z = 0.5m) */}
      {/* ======================================================== */}
      <group position={[7.6, 0, 0.5]}>
        <RoundedBox
          castShadow
          args={[0.26, 3.4, 1.96]}
          radius={0.03}
          smoothness={3}
          position={[0, 1.7, 0]}
          material={sharedMaterials.wallWainscot}
        />
        {/* Pilastras clássicas decorativas nas laterais do arco */}
        {[-0.92, 0.92].map((pz, idx) => (
          <group key={idx} position={[0, 0, pz]}>
            <RoundedBox
              castShadow
              args={[0.3, 3.4, 0.14]}
              radius={0.02}
              smoothness={2}
              position={[0, 1.7, 0]}
              material={sharedMaterials.wallAccent}
            />
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 3. PORTA CORREDOR -> COZINHA (X = 7.6m, Z = 6.0m)        */}
      {/* ======================================================== */}
      <group position={[7.6, 0, 6.0]}>
        <RoundedBox
          castShadow
          args={[0.24, 3.16, 1.46]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.58, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Folha aberta a 85 graus encostada na parede interna da cozinha */}
        <group position={[0.1, 0, 0.65]} rotation={[0, 1.48, 0]}>
          <RoundedBox
            castShadow
            args={[0.06, 3.02, 1.28]}
            radius={0.015}
            smoothness={3}
            position={[0, 1.51, -0.64]}
            material={sharedMaterials.kitchenCabinet}
          />
        </group>
      </group>

      {/* ======================================================== */}
      {/* 4. PORTA CORREDOR -> BANHEIRO (Z = 8.5m, X = 6.3m)       */}
      {/* ======================================================== */}
      <group position={[6.3, 0, 8.5]}>
        <RoundedBox
          castShadow
          args={[1.46, 3.16, 0.24]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.58, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Folha aberta a 80 graus para dentro do banheiro */}
        <group position={[-0.65, 0, 0.1]} rotation={[0, 1.38, 0]}>
          <RoundedBox
            castShadow
            args={[1.28, 3.02, 0.06]}
            radius={0.015}
            smoothness={3}
            position={[0.64, 1.51, 0]}
            material={sharedMaterials.wallWainscot}
          />
        </group>
      </group>
    </group>
  );
});

