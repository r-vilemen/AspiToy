import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';

/**
 * Mobiliário completo e estilizado da sala de estar:
 * - Sofá em linho bege com almofadas e pés em madeira inclinados
 * - Mesa de centro contemporânea com tampo de vidro e base em madeira
 * - Tapete amplo texturizado com orla geométrica
 * - Estante/Rack de TV com nichos, livros coloridos, TV e planta pequena
 * - Vaso cerâmico com Monstera Deliciosa (Costela-de-Adão)
 * - Luminária de piso em latão escovado
 * - Base de recarga do AspiToy com sinalização luminosa
 */
export const Furniture = memo(function Furniture() {
  return (
    <group name="house-furniture">
      {/* ======================================================== */}
      {/* 1. TAPETE CENTRAL (Área de Convivência)                  */}
      {/* ======================================================== */}
      <group position={[0, 0.008, 0.2]}>
        {/* Orla exterior do tapete */}
        <RoundedBox
          receiveShadow
          args={[4.4, 0.018, 3.3]}
          radius={0.015}
          smoothness={2}
          material={sharedMaterials.rugBorder}
        />
        {/* Corpo principal felpudo em linho cru */}
        <RoundedBox
          receiveShadow
          position={[0, 0.005, 0]}
          args={[4.1, 0.015, 3.0]}
          radius={0.012}
          smoothness={2}
          material={sharedMaterials.rugFabric}
        />
      </group>

      {/* ======================================================== */}
      {/* 2. SOFÁ PRINCIPAL DE TRÊS LUGARES EM LINHO               */}
      {/* Centro ~ Z: 2.5m, largura: 3.4m, profundidade: 1.15m     */}
      {/* ======================================================== */}
      <group position={[0, 0, 2.5]}>
        {/* 4 Pés cônicos de madeira com leve inclinação */}
        {[
          [-1.5, 0.06, -0.42],
          [1.5, 0.06, -0.42],
          [-1.5, 0.06, 0.42],
          [1.5, 0.06, 0.42],
        ].map(([px, py, pz], idx) => (
          <mesh
            key={idx}
            castShadow
            position={[px, py, pz]}
            material={sharedMaterials.floorTrim}
          >
            <cylinderGeometry args={[0.032, 0.02, 0.12, 12]} />
          </mesh>
        ))}

        {/* Chassi estrutural estofado inferior */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.18, 0]}
          args={[3.3, 0.16, 1.05]}
          radius={0.04}
          smoothness={3}
          material={sharedMaterials.sofaLinen}
        />

        {/* 3 Almofadas de assento macias */}
        {[-1.02, 0, 1.02].map((cx, i) => (
          <RoundedBox
            key={i}
            castShadow
            receiveShadow
            position={[cx, 0.32, -0.06]}
            args={[0.98, 0.18, 0.82]}
            radius={0.07}
            smoothness={4}
            material={sharedMaterials.sofaLinen}
          />
        ))}

        {/* Encosto traseiro acolchoado */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.58, 0.38]}
          args={[3.3, 0.48, 0.28]}
          radius={0.08}
          smoothness={3}
          material={sharedMaterials.sofaLinen}
        />

        {/* Braço Esquerdo */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[-1.72, 0.44, 0]}
          args={[0.26, 0.42, 1.08]}
          radius={0.08}
          smoothness={3}
          material={sharedMaterials.sofaLinen}
        />

        {/* Braço Direito */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[1.72, 0.44, 0]}
          args={[0.26, 0.42, 1.08]}
          radius={0.08}
          smoothness={3}
          material={sharedMaterials.sofaLinen}
        />

        {/* Almofadas decorativas complementares */}
        <group position={[-1.35, 0.45, 0.22]} rotation={[0.2, 0.3, 0.1]}>
          <RoundedBox
            castShadow
            args={[0.38, 0.35, 0.14]}
            radius={0.06}
            smoothness={3}
            material={sharedMaterials.sofaCushionAlt}
          />
        </group>
        <group position={[1.35, 0.45, 0.22]} rotation={[0.2, -0.3, -0.1]}>
          <RoundedBox
            castShadow
            args={[0.38, 0.35, 0.14]}
            radius={0.06}
            smoothness={3}
            material={sharedMaterials.sofaCushionAlt}
          />
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. MESA DE CENTRO DESIGN                                 */}
      {/* Centro ~ X: 0, Z: 0.2m, altura: 0.42m                    */}
      {/* ======================================================== */}
      <group position={[0, 0, 0.2]}>
        {/* Base / Pés de madeira com travessa */}
        <mesh castShadow position={[-0.72, 0.18, -0.32]} material={sharedMaterials.furnitureWood}>
          <cylinderGeometry args={[0.024, 0.024, 0.36, 12]} />
        </mesh>
        <mesh castShadow position={[0.72, 0.18, -0.32]} material={sharedMaterials.furnitureWood}>
          <cylinderGeometry args={[0.024, 0.024, 0.36, 12]} />
        </mesh>
        <mesh castShadow position={[-0.72, 0.18, 0.32]} material={sharedMaterials.furnitureWood}>
          <cylinderGeometry args={[0.024, 0.024, 0.36, 12]} />
        </mesh>
        <mesh castShadow position={[0.72, 0.18, 0.32]} material={sharedMaterials.furnitureWood}>
          <cylinderGeometry args={[0.024, 0.024, 0.36, 12]} />
        </mesh>

        {/* Prateleira inferior para revistas */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.12, 0]}
          args={[1.35, 0.02, 0.58]}
          radius={0.008}
          smoothness={2}
          material={sharedMaterials.furnitureWoodDark}
        />

        {/* Tampo de Vidro Biselado Flutuante */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.38, 0]}
          args={[1.6, 0.024, 0.78]}
          radius={0.025}
          smoothness={3}
          material={sharedMaterials.tableGlass}
        />

        {/* Livro de arte decorativo sobre a mesa */}
        <group position={[-0.32, 0.405, 0.08]} rotation={[0, 0.15, 0]}>
          <RoundedBox
            castShadow
            args={[0.26, 0.026, 0.34]}
            radius={0.005}
            smoothness={2}
            material={sharedMaterials.robotCoralTrim}
          />
        </group>

        {/* Xícara de cerâmica com café */}
        <group position={[0.35, 0.42, -0.1]}>
          <mesh castShadow material={sharedMaterials.plantPotCeramic}>
            <cylinderGeometry args={[0.042, 0.032, 0.065, 16]} />
          </mesh>
          <mesh position={[0, 0.026, 0]}>
            <circleGeometry args={[0.038, 16]} />
            <meshStandardMaterial color="#2B180C" roughness={0.2} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 4. RACK / ESTANTE DE TV E ENTRETENIMENTO                 */}
      {/* Centro ~ Z: -3.5m, largura: 3.4m, altura: 0.52m          */}
      {/* ======================================================== */}
      <group position={[0, 0, -3.5]}>
        {/* Corpo principal do aparador em carvalho e nogueira */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.3, 0]}
          args={[3.4, 0.48, 0.56]}
          radius={0.03}
          smoothness={3}
          material={sharedMaterials.furnitureWood}
        />

        {/* 4 Pés curtos em latão escovado */}
        {[
          [-1.5, 0.03, -0.2],
          [1.5, 0.03, -0.2],
          [-1.5, 0.03, 0.2],
          [1.5, 0.03, 0.2],
        ].map(([px, py, pz], i) => (
          <mesh key={i} castShadow position={[px, py, pz]} material={sharedMaterials.metalBrass}>
            <cylinderGeometry args={[0.02, 0.02, 0.06, 12]} />
          </mesh>
        ))}

        {/* Gavetas com puxadores metálicos */}
        {[-0.85, 0.85].map((gx, i) => (
          <group key={i} position={[gx, 0.3, 0.285]}>
            <mesh material={sharedMaterials.furnitureWoodDark}>
              <boxGeometry args={[1.5, 0.4, 0.01]} />
            </mesh>
            <mesh position={[0, 0, 0.015]} material={sharedMaterials.metalBrass}>
              <boxGeometry args={[0.18, 0.015, 0.015]} />
            </mesh>
          </group>
        ))}

        {/* Televisão estilizada fixada/apoiada */}
        <group position={[0, 1.05, 0]}>
          {/* Base do suporte */}
          <mesh castShadow position={[0, -0.48, 0]} material={sharedMaterials.tvScreenOff}>
            <boxGeometry args={[0.7, 0.02, 0.28]} />
          </mesh>
          <mesh castShadow position={[0, -0.32, 0]} material={sharedMaterials.tvScreenOff}>
            <boxGeometry args={[0.08, 0.32, 0.08]} />
          </mesh>
          {/* Moldura da tela ultrafina */}
          <RoundedBox
            castShadow
            args={[2.2, 1.25, 0.04]}
            radius={0.01}
            smoothness={2}
            material={sharedMaterials.tvScreenOff}
          />
        </group>

        {/* Livros decorativos organizados no rack */}
        <group position={[-1.25, 0.62, 0.06]}>
          {WORLD_PALETTE.bookSpines.map((color, idx) => (
            <mesh
              key={idx}
              castShadow
              position={[idx * 0.045, 0.08, 0]}
              rotation={[0, 0, idx === 3 ? -0.2 : 0]}
            >
              <boxGeometry args={[0.035, 0.18, 0.2]} />
              <meshStandardMaterial color={color} roughness={0.5} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 5. PLANTA DECORATIVA: VASO COM MONSTERA (Costela-de-Adão)*/}
      {/* Posicionada junto ao canto leste ensolarado ~ [3.6, 0, -2.8] */}
      {/* ======================================================== */}
      <group position={[3.6, 0, -2.8]}>
        {/* Suporte de pés tripé de madeira */}
        <mesh position={[0, 0.15, 0]} material={sharedMaterials.furnitureWood}>
          <cylinderGeometry args={[0.26, 0.28, 0.3, 16]} />
        </mesh>

        {/* Vaso em cerâmica terracota cônica */}
        <mesh castShadow position={[0, 0.52, 0]} material={sharedMaterials.plantPotCeramic}>
          <cylinderGeometry args={[0.34, 0.24, 0.52, 24]} />
        </mesh>
        {/* Terra preta orgânica */}
        <mesh position={[0, 0.77, 0]} material={sharedMaterials.plantSoil}>
          <cylinderGeometry args={[0.32, 0.32, 0.02, 24]} />
        </mesh>

        {/* Caules e Folhagem escultórica da Monstera */}
        {[
          { rot: [0.35, 0.4, 0.2], pos: [0.08, 1.05, 0.06], scale: [0.38, 0.48, 0.02] },
          { rot: [0.2, 1.8, 0.3], pos: [-0.12, 1.15, -0.05], scale: [0.42, 0.54, 0.02] },
          { rot: [0.4, -1.2, 0.15], pos: [0.15, 1.1, -0.14], scale: [0.36, 0.46, 0.02] },
          { rot: [0.15, 3.1, 0.35], pos: [-0.08, 1.25, 0.12], scale: [0.45, 0.58, 0.02] },
          { rot: [0.55, 0.0, 0.1], pos: [0.0, 0.95, 0.18], scale: [0.32, 0.42, 0.02] },
        ].map((leaf, idx) => (
          <group key={idx} position={leaf.pos as [number, number, number]} rotation={leaf.rot as [number, number, number]}>
            <mesh castShadow material={sharedMaterials.plantFoliage}>
              <boxGeometry args={leaf.scale as [number, number, number]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 6. LUMINÁRIA DE PISO EM LATÃO ESCOVADO (Floor Lamp)      */}
      {/* Posicionada atrás do sofá à esquerda ~ [-2.2, 0, 2.8]   */}
      {/* ======================================================== */}
      <group position={[-2.2, 0, 2.8]}>
        {/* Base pesada circular */}
        <mesh castShadow material={sharedMaterials.metalBrass}>
          <cylinderGeometry args={[0.18, 0.18, 0.024, 24]} />
        </mesh>
        {/* Haste metálica esguia */}
        <mesh castShadow position={[0, 0.85, 0]} material={sharedMaterials.metalBrass}>
          <cylinderGeometry args={[0.012, 0.012, 1.7, 12]} />
        </mesh>
        {/* Cúpula cônica elegante */}
        <mesh position={[0, 1.62, 0]} material={sharedMaterials.sofaLinen}>
          <cylinderGeometry args={[0.16, 0.28, 0.32, 24]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 7. ESTAÇÃO DE RECARGA (CHARGING DOCK)                    */}
      {/* Centro ~ [-3.8, 0, -3.2]                                 */}
      {/* ======================================================== */}
      <group position={[-3.8, 0, -3.2]}>
        {/* Plataforma de acoplamento do robô no piso */}
        <RoundedBox
          receiveShadow
          position={[0, 0.015, 0]}
          args={[0.76, 0.03, 0.82]}
          radius={0.012}
          smoothness={2}
          material={sharedMaterials.dockBody}
        />
        {/* Faixas guias de contato elétrico */}
        <mesh position={[-0.14, 0.031, 0.08]} material={sharedMaterials.metalBrass}>
          <boxGeometry args={[0.04, 0.002, 0.22]} />
        </mesh>
        <mesh position={[0.14, 0.031, 0.08]} material={sharedMaterials.metalBrass}>
          <boxGeometry args={[0.04, 0.002, 0.22]} />
        </mesh>
        {/* Torre vertical da estação de energia */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.24, -0.32]}
          args={[0.54, 0.46, 0.18]}
          radius={0.05}
          smoothness={3}
          material={sharedMaterials.dockBody}
        />
        {/* Sensor de alinhamento infravermelho escurecido */}
        <mesh position={[0, 0.26, -0.225]}>
          <boxGeometry args={[0.34, 0.06, 0.01]} />
          <meshStandardMaterial color="#0A0908" roughness={0.1} />
        </mesh>
        {/* LED indicador de status de energia */}
        <mesh position={[0, 0.41, -0.225]}>
          <boxGeometry args={[0.18, 0.02, 0.01]} />
          <meshStandardMaterial
            color={WORLD_PALETTE.ledEmerald}
            emissive={WORLD_PALETTE.ledEmerald}
            emissiveIntensity={1.8}
          />
        </mesh>
      </group>
    </group>
  );
});
