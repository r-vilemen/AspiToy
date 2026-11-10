import { memo } from 'react';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';

/**
 * Mobiliário Low-Poly / Matte em Escala Gigante (Estilo Toy Story PS2 / 6ª Geração):
 * - Poltrona Verde-Oliva Gigante (inspirada diretamente na referência)
 * - Tapete Redondo Trançado Concêntrico (Bordô, Verde-Floresta e Mostarda)
 * - Mesa de Centro de Madeira Maciça
 * - Cubo Cinza / Pufe Lateral com sombra marcada no piso
 * - Gabinete Esquerdo com TV de Tubo (CRT) anos 2000 e Vaso de Planta Low-Poly
 * - Estante Alta de Livros e Cômoda de Madeira na Parede Direita
 * - Blocos de Brinquedo Coloridos (ABC) espalhados pelo piso
 * - Estação de Recarga Toy-Tech do AspiToy
 */
export const Furniture = memo(function Furniture() {
  return (
    <group name="house-furniture-ps2">
      {/* ======================================================== */}
      {/* 1. TAPETE REDONDO TRANÇADO (Braided Target Rug PS2)      */}
      {/* ======================================================== */}
      <group position={[-0.75, 0.012, -1.1]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.95, 1.98, 0.016, 24]} />
          <primitive object={sharedMaterials.rugFabric} attach="material" />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. POLTRONA GIGANTE VERDE-OLIVA (Iconic PS2 Armchair)    */}
      {/* Centro ~ X: 0.95m, Z: -1.05m                             */}
      {/* ======================================================== */}
      <group position={[0.95, 0, -1.05]} rotation={[0, -0.18, 0]}>
        {/* Sombra de oclusão sob a poltrona */}
        <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.25, 16]} />
          <meshBasicMaterial color="#241205" transparent opacity={0.45} depthWrite={false} />
        </mesh>

        {/* Base inferior estofada */}
        <mesh castShadow receiveShadow position={[0, 0.34, 0]} material={sharedMaterials.sofaLinen}>
          <boxGeometry args={[1.65, 0.56, 1.55]} />
        </mesh>

        {/* Almofada grossa do assento */}
        <mesh castShadow receiveShadow position={[0, 0.72, 0.06]} material={sharedMaterials.sofaLinen}>
          <boxGeometry args={[1.38, 0.36, 1.38]} />
        </mesh>

        {/* Braço volumoso esquerdo (visto de frente na referência) */}
        <mesh castShadow receiveShadow position={[-0.68, 0.92, 0.02]} material={sharedMaterials.sofaLinen}>
          <boxGeometry args={[0.42, 0.44, 1.52]} />
        </mesh>

        {/* Braço volumoso direito */}
        <mesh castShadow receiveShadow position={[0.68, 0.92, 0.02]} material={sharedMaterials.sofaLinen}>
          <boxGeometry args={[0.42, 0.44, 1.52]} />
        </mesh>

        {/* Encosto alto inclinado em dois gomos low-poly */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 1.48, -0.52]}
          rotation={[0.12, 0, 0]}
          material={sharedMaterials.sofaLinen}
        >
          <boxGeometry args={[1.56, 1.25, 0.42]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 3. BLOCO / PUFE CINZA LOW-POLY (Direita do primeiro plano)*/}
      {/* Centro ~ X: 1.05m, Z: 0.75m                              */}
      {/* ======================================================== */}
      <group position={[1.05, 0, 0.75]} rotation={[0, -0.28, 0]}>
        {/* Sombra projetada marcante estilo PS2 */}
        <mesh position={[0.22, 0.014, 0.16]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.85, 0.85]} />
          <meshBasicMaterial color="#1F0F04" transparent opacity={0.48} depthWrite={false} />
        </mesh>
        <mesh castShadow receiveShadow position={[0, 0.36, 0]} material={sharedMaterials.blockGrey}>
          <boxGeometry args={[0.62, 0.72, 0.62]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 4. MESA DE CENTRO DE MADEIRA (Esquerda do Tapete)        */}
      {/* Centro ~ X: -1.45m, Z: -1.15m                            */}
      {/* ======================================================== */}
      <group position={[-1.45, 0, -1.15]} rotation={[0, 0.1, 0]}>
        {/* Tampo chanfrado low-poly */}
        <mesh castShadow receiveShadow position={[0, 0.66, 0]} material={sharedMaterials.furnitureWood}>
          <boxGeometry args={[1.55, 0.08, 0.95]} />
        </mesh>
        {/* Saia sob o tampo */}
        <mesh castShadow position={[0, 0.58, 0]} material={sharedMaterials.furnitureWoodDark}>
          <boxGeometry args={[1.36, 0.1, 0.78]} />
        </mesh>
        {/* 4 Pernas finas altas (o robô consegue passar ao redor) */}
        {[
          [-0.64, 0.31, -0.36],
          [0.64, 0.31, -0.36],
          [-0.64, 0.31, 0.36],
          [0.64, 0.31, 0.36],
        ].map(([lx, ly, lz], idx) => (
          <mesh key={idx} castShadow position={[lx, ly, lz]} material={sharedMaterials.furnitureWoodDark}>
            <cylinderGeometry args={[0.035, 0.022, 0.62, 8]} />
          </mesh>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 5. GABINETE DE CANTO + TV DE TUBO (CRT) + PLANTA         */}
      {/* Canto Noroeste ~ X: -3.1m, Z: -3.15m                     */}
      {/* ======================================================== */}
      <group position={[-3.1, 0, -3.15]}>
        {/* Móvel gabinete de madeira */}
        <mesh castShadow receiveShadow position={[0, 0.78, 0]} material={sharedMaterials.furnitureWood}>
          <boxGeometry args={[2.1, 1.56, 1.1]} />
        </mesh>
        {/* Nicho escuro interno */}
        <mesh position={[-0.25, 0.75, 0.56]} material={sharedMaterials.robotVisor}>
          <boxGeometry args={[0.75, 1.15, 0.02]} />
        </mesh>

        {/* TV de Tubo (CRT) Anos 2000 no topo esquerdo */}
        <group position={[-0.45, 2.02, 0]} rotation={[0, 0.35, 0]}>
          <mesh castShadow material={sharedMaterials.tvCaseRetro}>
            <boxGeometry args={[0.88, 0.92, 0.74]} />
          </mesh>
          {/* Tela abaulada escura */}
          <mesh position={[0, 0.04, 0.38]} material={sharedMaterials.tvScreenOff}>
            <boxGeometry args={[0.68, 0.58, 0.04]} />
          </mesh>
        </group>

        {/* Vaso com Planta Low-Poly no topo direito do gabinete */}
        <group position={[0.52, 1.56, 0]}>
          <mesh castShadow position={[0, 0.2, 0]} material={sharedMaterials.plantPotCeramic}>
            <cylinderGeometry args={[0.2, 0.14, 0.4, 8]} />
          </mesh>
          {[
            [0, 0.58, 0, 0, 0, 0],
            [-0.14, 0.52, 0.06, 0.2, 0, 0.45],
            [0.14, 0.52, -0.06, -0.2, 0, -0.45],
            [0.05, 0.54, 0.14, 0.45, 0, -0.15],
            [-0.05, 0.54, -0.14, -0.45, 0, 0.15],
          ].map(([fx, fy, fz, rx, ry, rz], idx) => (
            <mesh
              key={idx}
              castShadow
              position={[fx, fy, fz]}
              rotation={[rx, ry, rz]}
              material={sharedMaterials.plantFoliage}
            >
              <coneGeometry args={[0.14, 0.58, 5]} />
            </mesh>
          ))}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 6. ESTANTE ALTA E CÔMODA NA PAREDE DIREITA (LESTE)       */}
      {/* ======================================================== */}
      <group position={[4.15, 0, -1.2]}>
        {/* Estante de livros alta ao fundo */}
        <mesh castShadow receiveShadow position={[0, 1.75, -1.35]} material={sharedMaterials.furnitureWoodDark}>
          <boxGeometry args={[0.95, 3.5, 1.45]} />
        </mesh>
        {/* Cômoda / Aparador de madeira com gavetas à direita */}
        <mesh castShadow receiveShadow position={[0.05, 1.05, 0.55]} material={sharedMaterials.furnitureWood}>
          <boxGeometry args={[0.92, 2.1, 1.95]} />
        </mesh>
        {/* Abajur vermelho retrô sobre a cômoda */}
        <group position={[0.05, 2.1, 0.85]}>
          <mesh position={[0, 0.15, 0]} material={sharedMaterials.metalBrass}>
            <cylinderGeometry args={[0.06, 0.1, 0.3, 8]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={sharedMaterials.robotCoralTrim}>
            <cylinderGeometry args={[0.14, 0.26, 0.38, 10]} />
          </mesh>
        </group>

        {/* Livros coloridos low-poly nas prateleiras */}
        {WORLD_PALETTE.bookSpines.map((color, idx) => (
          <mesh
            key={idx}
            position={[-0.38, 2.25, -1.65 + idx * 0.18]}
          >
            <boxGeometry args={[0.22, 0.34, 0.12]} />
            <meshLambertMaterial color={color} flatShading />
          </mesh>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 7. BRINQUEDOS LOW-POLY ESPALHADOS PELO CHÃO              */}
      {/* ======================================================== */}
      {/* Blocos ABC empilhados perto do lambris esquerdo */}
      <group position={[-3.3, 0, 1.55]}>
        <mesh castShadow receiveShadow position={[0, 0.16, 0]} material={sharedMaterials.robotCoralTrim}>
          <boxGeometry args={[0.32, 0.32, 0.32]} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.34, 0.16, 0.12]} rotation={[0, 0.3, 0]} material={sharedMaterials.robotBlueTrim}>
          <boxGeometry args={[0.32, 0.32, 0.32]} />
        </mesh>
        <mesh castShadow receiveShadow position={[0.15, 0.48, 0.05]} rotation={[0, -0.25, 0]} material={sharedMaterials.robotYellowTrim}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 8. BAÚ GIGANTE DE BRINQUEDOS (Parede Sul ~ Z: 2.6m)      */}
      {/* ======================================================== */}
      <group position={[0, 0, 2.6]}>
        <mesh castShadow receiveShadow position={[0, 0.42, 0]} material={sharedMaterials.furnitureWood}>
          <boxGeometry args={[2.8, 0.84, 1.05]} />
        </mesh>
        {/* Tampa vermelha brinquedo do baú */}
        <mesh castShadow position={[0, 0.88, 0]} material={sharedMaterials.robotCoralTrim}>
          <boxGeometry args={[2.92, 0.12, 1.12]} />
        </mesh>
        {/* Fecho dourado */}
        <mesh position={[0, 0.78, -0.54]} material={sharedMaterials.metalBrass}>
          <boxGeometry args={[0.28, 0.18, 0.04]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 9. ESTAÇÃO DE RECARGA TOY-TECH DO ASPITOY                */}
      {/* Tapete de indução discreto sob o AspiToy + Torre lateral */}
      {/* ======================================================== */}
      <group position={[-0.15, 0.005, 0.85]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.34, 16]} />
          <meshBasicMaterial color={WORLD_PALETTE.robotYellow} transparent opacity={0.55} />
        </mesh>
      </group>
      <group position={[-3.4, 0, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        {/* Base plástica chanfrada */}
        <mesh receiveShadow position={[0, 0.02, 0]} material={sharedMaterials.dockBody}>
          <boxGeometry args={[0.78, 0.04, 0.82]} />
        </mesh>
        {/* Faixas de contato amarelas estilo brinquedo */}
        <mesh position={[-0.15, 0.042, 0.08]} material={sharedMaterials.robotYellowTrim}>
          <boxGeometry args={[0.06, 0.005, 0.28]} />
        </mesh>
        <mesh position={[0.15, 0.042, 0.08]} material={sharedMaterials.robotYellowTrim}>
          <boxGeometry args={[0.06, 0.005, 0.28]} />
        </mesh>
        {/* Torre da base com detalhes em vermelho e LED verde */}
        <mesh castShadow position={[0, 0.26, -0.3]} material={sharedMaterials.dockBody}>
          <boxGeometry args={[0.58, 0.48, 0.2]} />
        </mesh>
        <mesh position={[0, 0.48, -0.3]} material={sharedMaterials.robotCoralTrim}>
          <boxGeometry args={[0.62, 0.06, 0.22]} />
        </mesh>
        <mesh position={[0, 0.34, -0.19]}>
          <boxGeometry args={[0.24, 0.05, 0.02]} />
          <meshBasicMaterial color={WORLD_PALETTE.ledEmerald} />
        </mesh>
      </group>
    </group>
  );
});
