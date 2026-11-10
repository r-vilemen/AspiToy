import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';

interface WallsProps {
  width?: number;
  depth?: number;
  height?: number;
}

/**
 * Arquitetura da Sala de Estar (Seção 3.1 da Direção de Arte):
 * - Paredes com acabamento em gesso quente, lambris (wainscoting) frisados e rodapés altos
 * - Janelas com iluminação externa, vidro PBR e cortinas volumétricas em varão de latão
 * - Lareira clássica com prateleira decorada e lenha interna
 * - Quadros emoldurados compondo a narrativa visual do ambiente
 * - Porta residencial detalhada com painéis em relevo e ferragens em latão
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
    <group name="house-walls-cinematic">
      {/* ======================================================== */}
      {/* 1. PAREDE ESQUERDA (OESTE): Lambris, Janela, Cortinas    */}
      {/* ======================================================== */}
      <group position={[-halfW - wallThick / 2, 0, 0]}>
        {/* Parede estrutural */}
        <mesh
          castShadow
          receiveShadow
          position={[0, height / 2, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[wallThick, height, depth + wallThick * 2]} />
        </mesh>

        {/* Painel de Lambris (Wainscoting) */}
        <mesh
          receiveShadow
          position={[wallThick / 2 + 0.02, wainscotHeight / 2, 0]}
          material={sharedMaterials.wallWainscot}
        >
          <boxGeometry args={[0.04, wainscotHeight, depth]} />
        </mesh>

        {/* Ripas verticais de madeira pintada */}
        {[-3.4, -2.8, -2.2, -1.6, -1.0, -0.4, 0.2, 0.8, 1.4, 2.0, 2.6, 3.2].map(
          (zPos, idx) => (
            <mesh
              key={idx}
              position={[wallThick / 2 + 0.045, wainscotHeight / 2, zPos]}
              material={sharedMaterials.wallAccent}
            >
              <boxGeometry args={[0.022, wainscotHeight - 0.22, 0.045]} />
            </mesh>
          )
        )}

        {/* Cornija do lambris (Chair Rail) */}
        <RoundedBox
          castShadow
          args={[0.1, 0.11, depth]}
          radius={0.02}
          smoothness={3}
          position={[wallThick / 2 + 0.06, wainscotHeight, 0]}
          material={sharedMaterials.wallWainscot}
        />

        {/* Rodapé duplo com moldura superior */}
        <mesh
          receiveShadow
          position={[wallThick / 2 + 0.05, 0.12, 0]}
          material={sharedMaterials.wallAccent}
        >
          <boxGeometry args={[0.08, 0.24, depth]} />
        </mesh>
        <mesh
          position={[wallThick / 2 + 0.075, 0.25, 0]}
          material={sharedMaterials.floorTrim}
        >
          <boxGeometry args={[0.04, 0.03, depth]} />
        </mesh>

        {/* Janela Panorâmica Oeste + Cortinas com Dobras Orgânicas */}
        <group position={[wallThick / 2 + 0.03, 3.1, -1.3]}>
          {/* Moldura externa da janela */}
          <RoundedBox
            args={[0.09, 1.96, 1.96]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.windowFrame}
          />
          {/* Vidro translúcido iluminado pelo sol */}
          <mesh position={[0.03, 0, 0]} material={sharedMaterials.windowGlass}>
            <boxGeometry args={[0.04, 1.74, 1.74]} />
          </mesh>
          {/* Divisórias internas da esquadria */}
          <mesh position={[0.055, 0, 0]} material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.03, 1.74, 0.05]} />
          </mesh>
          <mesh position={[0.055, 0.15, 0]} material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.03, 0.05, 1.74]} />
          </mesh>

          {/* Varão de cortina em latão escovado com ponteiras */}
          <group position={[0.14, 1.08, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} material={sharedMaterials.metalBrass}>
              <cylinderGeometry args={[0.022, 0.022, 2.45, 12]} />
            </mesh>
            {[-1.24, 1.24].map((zEnd, idx) => (
              <mesh
                key={idx}
                position={[0, 0, zEnd]}
                material={sharedMaterials.metalBrass}
              >
                <sphereGeometry args={[0.048, 12, 12]} />
              </mesh>
            ))}
          </group>

          {/* Cortinas laterais com pregas cilíndricas suaves */}
          {[-1.02, 1.02].map((sideZ, sideIdx) => (
            <group key={sideIdx} position={[0.13, -0.1, sideZ]}>
              {[-0.14, -0.05, 0.05, 0.14].map((foldZ, fIdx) => (
                <mesh
                  key={fIdx}
                  castShadow
                  position={[
                    (fIdx % 2 === 0 ? 0.015 : -0.01),
                    0,
                    foldZ,
                  ]}
                  material={sharedMaterials.curtainFabric}
                >
                  <cylinderGeometry args={[0.065, 0.085, 2.32, 12]} />
                </mesh>
              ))}
              {/* Braçadeira de tecido prendendo a cortina */}
              <mesh
                position={[0.02, -0.35, 0]}
                material={sharedMaterials.sofaCushionAlt}
              >
                <cylinderGeometry args={[0.18, 0.17, 0.07, 12]} />
              </mesh>
            </group>
          ))}
        </group>

        {/* Quadro Decorativo 1 (Parede Oeste, lado sul) */}
        <group position={[wallThick / 2 + 0.06, 2.65, 1.65]}>
          <RoundedBox
            castShadow
            args={[0.05, 0.92, 1.18]}
            radius={0.015}
            smoothness={3}
            material={sharedMaterials.furnitureWoodDark}
          />
          {/* Passe-partout creme */}
          <mesh position={[0.028, 0, 0]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[0.01, 0.78, 1.04]} />
          </mesh>
          {/* Arte estilizada (pôr do sol e colinas) */}
          <mesh position={[0.035, 0.06, 0]}>
            <boxGeometry args={[0.008, 0.52, 0.88]} />
            <meshStandardMaterial color="#E89954" roughness={0.6} />
          </mesh>
          <mesh position={[0.04, -0.14, 0]}>
            <boxGeometry args={[0.008, 0.24, 0.88]} />
            <meshStandardMaterial color="#3B6E4C" roughness={0.65} />
          </mesh>
          <mesh
            position={[0.042, 0.1, -0.15]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[0.11, 0.11, 0.01, 16]} />
            <meshStandardMaterial color="#F5C438" roughness={0.5} />
          </mesh>
        </group>
      </group>

      {/* ======================================================== */}
      {/* 2. PAREDE DO FUNDO (NORTE): Lareira, Janela e Quadros    */}
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

        {/* Lareira Clássica Esculpida (Fireplace Mantel) */}
        <group position={[-0.2, 0, wallThick / 2 + 0.18]}>
          {/* Colunas laterais chanfradas */}
          <RoundedBox
            castShadow
            receiveShadow
            args={[0.34, 1.9, 0.38]}
            radius={0.03}
            smoothness={3}
            position={[-0.75, 0.95, 0]}
            material={sharedMaterials.wallWainscot}
          />
          <RoundedBox
            castShadow
            receiveShadow
            args={[0.34, 1.9, 0.38]}
            radius={0.03}
            smoothness={3}
            position={[0.75, 0.95, 0]}
            material={sharedMaterials.wallWainscot}
          />
          {/* Frontão superior */}
          <RoundedBox
            castShadow
            receiveShadow
            args={[1.86, 0.38, 0.4]}
            radius={0.03}
            smoothness={3}
            position={[0, 1.72, 0]}
            material={sharedMaterials.wallWainscot}
          />
          {/* Prateleira superior (Mantelpiece) */}
          <RoundedBox
            castShadow
            args={[2.12, 0.11, 0.5]}
            radius={0.025}
            smoothness={3}
            position={[0, 1.95, 0.04]}
            material={sharedMaterials.wallWainscot}
          />
          {/* Revestimento interno em tijolo terracota */}
          <mesh
            position={[0, 0.78, -0.02]}
            material={sharedMaterials.sofaCushionAlt}
          >
            <boxGeometry args={[1.22, 1.55, 0.28]} />
          </mesh>
          {/* Fornalha escura com toras de lenha e grelha */}
          <mesh position={[0, 0.62, 0.05]} material={sharedMaterials.robotVisor}>
            <boxGeometry args={[0.88, 1.15, 0.18]} />
          </mesh>
          {/* Toras de madeira decorativas dentro da lareira */}
          {[-0.12, 0.12].map((lx, idx) => (
            <mesh
              key={idx}
              position={[lx, 0.16, 0.1]}
              rotation={[0, 0.2 * (idx === 0 ? 1 : -1), Math.PI / 2]}
              material={sharedMaterials.furnitureWoodDark}
            >
              <cylinderGeometry args={[0.06, 0.065, 0.52, 10]} />
            </mesh>
          ))}
          {/* Objetos decorativos sobre o mantel (Relógio de mesa e vaso) */}
          <group position={[0, 2.12, 0.04]}>
            <mesh castShadow material={sharedMaterials.furnitureWoodDark}>
              <cylinderGeometry args={[0.16, 0.18, 0.26, 16]} />
            </mesh>
            <mesh position={[0, 0.02, 0.17]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.11, 0.11, 0.02, 16]} />
              <meshStandardMaterial color="#FAF3E3" roughness={0.3} />
            </mesh>
          </group>
          <mesh
            castShadow
            position={[-0.68, 2.14, 0.04]}
            material={sharedMaterials.plantPotCeramic}
          >
            <cylinderGeometry args={[0.07, 0.09, 0.28, 12]} />
          </mesh>
        </group>

        {/* Quadro Acima da Lareira */}
        <group position={[-0.2, 3.15, wallThick / 2 + 0.05]}>
          <RoundedBox
            castShadow
            args={[1.35, 0.95, 0.05]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.metalBrass}
          />
          <mesh position={[0, 0, 0.028]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[1.18, 0.78, 0.01]} />
          </mesh>
          <mesh position={[0, 0, 0.035]}>
            <boxGeometry args={[1.02, 0.62, 0.01]} />
            <meshStandardMaterial color="#2E5A6B" roughness={0.55} />
          </mesh>
        </group>

        {/* Janela Vertical Norte com Cortina */}
        <group position={[1.95, 2.75, wallThick / 2 + 0.03]}>
          <RoundedBox
            args={[1.28, 2.52, 0.09]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.windowFrame}
          />
          <mesh position={[0, 0, 0.02]} material={sharedMaterials.windowGlass}>
            <boxGeometry args={[1.08, 2.3, 0.04]} />
          </mesh>
          <mesh position={[0, 0, 0.045]} material={sharedMaterials.windowFrame}>
            <boxGeometry args={[0.05, 2.3, 0.03]} />
          </mesh>
          {[-0.55, 0, 0.55].map((yBar, i) => (
            <mesh
              key={i}
              position={[0, yBar, 0.045]}
              material={sharedMaterials.windowFrame}
            >
              <boxGeometry args={[1.08, 0.05, 0.03]} />
            </mesh>
          ))}
          {/* Varão e cortinas da janela norte */}
          <mesh
            position={[0, 1.32, 0.12]}
            rotation={[0, 0, Math.PI / 2]}
            material={sharedMaterials.metalBrass}
          >
            <cylinderGeometry args={[0.02, 0.02, 1.68, 12]} />
          </mesh>
          {[-0.68, 0.68].map((cx, idx) => (
            <mesh
              key={idx}
              castShadow
              position={[cx, -0.05, 0.11]}
              material={sharedMaterials.curtainFabric}
            >
              <cylinderGeometry args={[0.11, 0.14, 2.55, 14]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 3. PAREDE DIREITA (LESTE): Porta Residencial e Quadro    */}
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

        {/* Porta Residencial Esculpida com Almofadas e Maçaneta */}
        <group position={[-wallThick / 2 - 0.04, 1.65, 2.35]}>
          {/* Guarnição / Batente da porta */}
          <RoundedBox
            castShadow
            args={[0.1, 3.32, 1.66]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.floorTrim}
          />
          {/* Folha principal de madeira nobre */}
          <RoundedBox
            castShadow
            args={[0.065, 3.16, 1.48]}
            radius={0.015}
            smoothness={3}
            position={[-0.03, 0, 0]}
            material={sharedMaterials.furnitureWood}
          />
          {/* 4 Almofadas entalhadas na porta */}
          {[
            [0.72, -0.34],
            [0.72, 0.34],
            [-0.68, -0.34],
            [-0.68, 0.34],
          ].map(([py, pz], idx) => (
            <RoundedBox
              key={idx}
              args={[0.025, 1.05, 0.48]}
              radius={0.01}
              smoothness={2}
              position={[-0.065, py, pz]}
              material={sharedMaterials.furnitureWoodDark}
            />
          ))}
          {/* Espelho e maçaneta de latão polido */}
          <mesh
            position={[-0.068, -0.22, -0.55]}
            material={sharedMaterials.metalBrass}
          >
            <boxGeometry args={[0.015, 0.26, 0.07]} />
          </mesh>
          <mesh
            position={[-0.115, -0.22, -0.55]}
            material={sharedMaterials.metalBrass}
          >
            <sphereGeometry args={[0.06, 14, 14]} />
          </mesh>
        </group>

        {/* Quadro Decorativo 3 (Parede Leste, ao lado da porta) */}
        <group position={[-wallThick / 2 - 0.05, 2.45, 0.85]}>
          <RoundedBox
            castShadow
            args={[0.045, 0.78, 0.65]}
            radius={0.015}
            smoothness={3}
            material={sharedMaterials.furnitureWoodDark}
          />
          <mesh position={[-0.026, 0, 0]} material={sharedMaterials.wallWainscot}>
            <boxGeometry args={[0.01, 0.64, 0.52]} />
          </mesh>
          <mesh position={[-0.032, 0, 0]}>
            <boxGeometry args={[0.008, 0.46, 0.36]} />
            <meshStandardMaterial color={WORLD_PALETTE.robotCoral} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </group>
  );
});
