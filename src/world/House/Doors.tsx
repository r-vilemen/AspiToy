import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials } from '../Environment/Materials';

/**
 * Portas e Passagens Funcionais da Residência:
 * - Batentes vazados (ombreiras laterais e verga superior) sem qualquer obstáculo visual no vão
 * - Vão livre 100% desobstruído com visibilidade total do cômodo adjacente
 * - Folhas de madeira nobre 100% abertas, encostadas rentes à parede com ferragens e maçanetas de latão
 * - Circulação contínua e sem colisões para o AspiToy
 */
export const Doors = memo(function Doors() {
  return (
    <group name="house-doors-system">
      {/* ======================================================== */}
      {/* 1. PORTA DO QUARTO -> CORREDOR (X = 5.0m, Z = 2.35m)     */}
      {/* ======================================================== */}
      <group position={[5.0, 0, 2.35]}>
        {/* Batente: Ombreira Norte */}
        <RoundedBox
          castShadow
          args={[0.24, 3.32, 0.08]}
          radius={0.015}
          smoothness={3}
          position={[0, 1.66, -0.68]}
          material={sharedMaterials.floorTrim}
        />
        {/* Batente: Ombreira Sul */}
        <RoundedBox
          castShadow
          args={[0.24, 3.32, 0.08]}
          radius={0.015}
          smoothness={3}
          position={[0, 1.66, 0.68]}
          material={sharedMaterials.floorTrim}
        />
        {/* Batente: Verga Superior */}
        <RoundedBox
          castShadow
          args={[0.25, 0.08, 1.44]}
          radius={0.015}
          smoothness={3}
          position={[0, 3.28, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Soleira sutil no piso */}
        <mesh position={[0, 0.005, 0]} receiveShadow material={sharedMaterials.floorTrim}>
          <boxGeometry args={[0.24, 0.01, 1.36]} />
        </mesh>

        {/* Folha da porta 100% aberta, encostada rente à parede interna do quarto (ao Norte, Z < 1.65) */}
        <group position={[-0.13, 0, -1.32]}>
          {/* Painel da folha da porta */}
          <RoundedBox
            castShadow
            receiveShadow
            args={[0.05, 3.16, 1.24]}
            radius={0.015}
            smoothness={3}
            position={[0, 1.58, 0]}
            material={sharedMaterials.furnitureWood}
          />
          {/* Almofadas entalhadas em relevo na folha da porta */}
          {[-0.32, 0.32].map((pz, idx) => (
            <group key={idx} position={[-0.015, 0, pz]}>
              <RoundedBox
                args={[0.03, 1.05, 0.44]}
                radius={0.01}
                smoothness={2}
                position={[0, 2.25, 0]}
                material={sharedMaterials.furnitureWoodDark}
              />
              <RoundedBox
                args={[0.03, 1.05, 0.44]}
                radius={0.01}
                smoothness={2}
                position={[0, 0.9, 0]}
                material={sharedMaterials.furnitureWoodDark}
              />
            </group>
          ))}
          {/* Maçaneta e espelho de latão polido voltados para o quarto */}
          <group position={[-0.035, 1.42, 0.48]}>
            <mesh material={sharedMaterials.metalBrass}>
              <boxGeometry args={[0.015, 0.22, 0.06]} />
            </mesh>
            <mesh position={[-0.035, 0, 0]} material={sharedMaterials.metalBrass}>
              <sphereGeometry args={[0.045, 12, 12]} />
            </mesh>
          </group>
          {/* Dobradiças de latão no ponto de giro */}
          {[0.4, 1.6, 2.8].map((hy, idx) => (
            <mesh
              key={idx}
              position={[0.02, hy, 0.61]}
              material={sharedMaterials.metalBrass}
            >
              <cylinderGeometry args={[0.016, 0.016, 0.12, 10]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 2. ARCO DE ENTRADA CORREDOR -> SALA (X = 7.6m, Z = 0.5m) */}
      {/* ======================================================== */}
      <group position={[7.6, 0, 0.5]}>
        {/* Pilastra / Moldura Norte */}
        <RoundedBox
          castShadow
          args={[0.26, 3.32, 0.1]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.66, -0.9]}
          material={sharedMaterials.wallWainscot}
        />
        {/* Pilastra / Moldura Sul */}
        <RoundedBox
          castShadow
          args={[0.26, 3.32, 0.1]}
          radius={0.02}
          smoothness={3}
          position={[0, 1.66, 0.9]}
          material={sharedMaterials.wallWainscot}
        />
        {/* Verga superior do portal */}
        <RoundedBox
          castShadow
          args={[0.28, 0.12, 1.9]}
          radius={0.02}
          smoothness={3}
          position={[0, 3.26, 0]}
          material={sharedMaterials.wallWainscot}
        />
        {/* Soleira de transição sutil no piso */}
        <mesh position={[0, 0.005, 0]} receiveShadow material={sharedMaterials.floorTrim}>
          <boxGeometry args={[0.26, 0.01, 1.7]} />
        </mesh>
        {/* Frisos decorativos nas laterais do arco */}
        {[-0.9, 0.9].map((pz, idx) => (
          <group key={idx} position={[0, 0, pz]}>
            <RoundedBox
              args={[0.3, 3.32, 0.05]}
              radius={0.015}
              smoothness={2}
              position={[0, 1.66, 0]}
              material={sharedMaterials.wallAccent}
            />
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 3. PORTA CORREDOR -> COZINHA (X = 7.6m, Z = 6.0m)        */}
      {/* ======================================================== */}
      <group position={[7.6, 0, 6.0]}>
        {/* Batente: Ombreira Norte */}
        <RoundedBox
          castShadow
          args={[0.24, 3.1, 0.08]}
          radius={0.015}
          smoothness={3}
          position={[0, 1.55, -0.63]}
          material={sharedMaterials.floorTrim}
        />
        {/* Batente: Ombreira Sul */}
        <RoundedBox
          castShadow
          args={[0.24, 3.1, 0.08]}
          radius={0.015}
          smoothness={3}
          position={[0, 1.55, 0.63]}
          material={sharedMaterials.floorTrim}
        />
        {/* Batente: Verga Superior */}
        <RoundedBox
          castShadow
          args={[0.25, 0.08, 1.34]}
          radius={0.015}
          smoothness={3}
          position={[0, 3.06, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Soleira sutil no piso */}
        <mesh position={[0, 0.005, 0]} receiveShadow material={sharedMaterials.floorTrim}>
          <boxGeometry args={[0.24, 0.01, 1.22]} />
        </mesh>

        {/* Folha da porta 100% aberta, encostada rente à parede interna da cozinha (ao Sul, Z > 6.65) */}
        <group position={[0.13, 0, 1.22]}>
          <RoundedBox
            castShadow
            receiveShadow
            args={[0.05, 2.96, 1.18]}
            radius={0.015}
            smoothness={3}
            position={[0, 1.48, 0]}
            material={sharedMaterials.kitchenCabinet}
          />
          {/* Molduras decorativas na folha */}
          {[-0.28, 0.28].map((pz, idx) => (
            <RoundedBox
              key={idx}
              args={[0.065, 1.0, 0.4]}
              radius={0.01}
              smoothness={2}
              position={[0, idx === 0 ? 0.85 : 2.15, pz]}
              material={sharedMaterials.wallWainscot}
            />
          ))}
          {/* Maçaneta e espelho em latão */}
          <group position={[0.035, 1.38, -0.44]}>
            <mesh material={sharedMaterials.metalBrass}>
              <boxGeometry args={[0.015, 0.2, 0.05]} />
            </mesh>
            <mesh position={[0.03, 0, 0]} material={sharedMaterials.metalBrass}>
              <sphereGeometry args={[0.04, 12, 12]} />
            </mesh>
          </group>
          {/* Dobradiças */}
          {[0.35, 1.5, 2.65].map((hy, idx) => (
            <mesh
              key={idx}
              position={[-0.02, hy, -0.58]}
              material={sharedMaterials.metalBrass}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.1, 10]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 4. PORTA CORREDOR -> BANHEIRO (Z = 8.5m, X = 6.3m)       */}
      {/* ======================================================== */}
      <group position={[6.3, 0, 8.5]}>
        {/* Batente: Ombreira Oeste */}
        <RoundedBox
          castShadow
          args={[0.08, 3.0, 0.24]}
          radius={0.015}
          smoothness={3}
          position={[-0.63, 1.5, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Batente: Ombreira Leste */}
        <RoundedBox
          castShadow
          args={[0.08, 3.0, 0.24]}
          radius={0.015}
          smoothness={3}
          position={[0.63, 1.5, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Batente: Verga Superior */}
        <RoundedBox
          castShadow
          args={[1.34, 0.08, 0.25]}
          radius={0.015}
          smoothness={3}
          position={[0, 2.96, 0]}
          material={sharedMaterials.floorTrim}
        />
        {/* Soleira sutil no piso */}
        <mesh position={[0, 0.005, 0]} receiveShadow material={sharedMaterials.floorTrim}>
          <boxGeometry args={[1.22, 0.01, 0.24]} />
        </mesh>

        {/* Folha da porta 100% aberta, encostada rente à parede interna do banheiro (ao Leste, X > 6.95) */}
        <group position={[1.22, 0, 0.13]}>
          <RoundedBox
            castShadow
            receiveShadow
            args={[1.18, 2.88, 0.05]}
            radius={0.015}
            smoothness={3}
            position={[0, 1.44, 0]}
            material={sharedMaterials.wallWainscot}
          />
          {/* Molduras decorativas na folha */}
          {[-0.28, 0.28].map((px, idx) => (
            <RoundedBox
              key={idx}
              args={[0.4, 1.0, 0.065]}
              radius={0.01}
              smoothness={2}
              position={[px, idx === 0 ? 0.85 : 2.1, 0]}
              material={sharedMaterials.floorTrim}
            />
          ))}
          {/* Maçaneta e espelho em latão */}
          <group position={[-0.44, 1.35, 0.035]}>
            <mesh material={sharedMaterials.metalBrass}>
              <boxGeometry args={[0.05, 0.2, 0.015]} />
            </mesh>
            <mesh position={[0, 0, 0.03]} material={sharedMaterials.metalBrass}>
              <sphereGeometry args={[0.04, 12, 12]} />
            </mesh>
          </group>
          {/* Dobradiças */}
          {[0.35, 1.45, 2.55].map((hy, idx) => (
            <mesh
              key={idx}
              position={[-0.58, hy, -0.02]}
              material={sharedMaterials.metalBrass}
            >
              <cylinderGeometry args={[0.015, 0.015, 0.1, 10]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
});
