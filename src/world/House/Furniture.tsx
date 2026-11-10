import { memo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';

/**
 * Mobiliário e Objetos Esculpidos (Seções 3.2, 3.3, 3.4 e 13 da Direção de Arte):
 * - Poltrona e Sofá/Banco com almofadas orgânicas arredondadas (RoundedBox), costuras e pés torneados
 * - Mesa de centro com tampo de vidro temperado e objetos cotidianos sobre ela (bandeja, caneca, livros, controle)
 * - Tapete redondo trançado com espessura têxtil e borda costurada
 * - Plantas com folhas individualizadas em camadas curvas
 * - Brinquedos 100% autorais estilizados com acabamento de produto real
 * - Base de carregamento Toy-Tech integrada ao cenário
 */
export const Furniture = memo(function Furniture() {
  return (
    <group name="house-furniture-sculpted">
      {/* ======================================================== */}
      {/* 1. TAPETE REDONDO TRANÇADO COM ESPESSURA E BORDA TÊXTIL  */}
      {/* ======================================================== */}
      <group position={[-0.75, 0.012, -1.1]}>
        {/* Corpo têxtil do tapete */}
        <mesh receiveShadow>
          <cylinderGeometry args={[1.92, 1.95, 0.022, 48]} />
          <primitive object={sharedMaterials.rugFabric} attach="material" />
        </mesh>
        {/* Borda externa debruada bem definida */}
        <mesh receiveShadow position={[0, 0.002, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.93, 0.022, 12, 48]} />
          <primitive object={sharedMaterials.rugBorder} attach="material" />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 2. POLTRONA VERDE-OLIVA COM ALMOFADAS ORGÂNICAS E COSTURA*/}
      {/* Centro ~ X: 0.95m, Z: -1.05m                             */}
      {/* ======================================================== */}
      <group position={[0.95, 0, -1.05]} rotation={[0, -0.18, 0]}>
        {/* Sombra de contato suave sob a poltrona */}
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.18, 28]} />
          <meshBasicMaterial
            color="#201004"
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </mesh>

        {/* Pés torneados de madeira escura (reforça a percepção de escala para o robô) */}
        {[
          [-0.64, 0.08, -0.58],
          [0.64, 0.08, -0.58],
          [-0.64, 0.08, 0.58],
          [0.64, 0.08, 0.58],
        ].map(([lx, ly, lz], idx) => (
          <mesh
            key={idx}
            castShadow
            position={[lx, ly, lz]}
            material={sharedMaterials.furnitureWoodDark}
          >
            <cylinderGeometry args={[0.055, 0.035, 0.16, 12]} />
          </mesh>
        ))}

        {/* Base inferior estofada arredondada */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.62, 0.44, 1.52]}
          radius={0.09}
          smoothness={4}
          position={[0, 0.36, 0]}
          material={sharedMaterials.sofaLinen}
        />

        {/* Almofada principal macia do assento */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.28, 0.34, 1.36]}
          radius={0.11}
          smoothness={4}
          position={[0, 0.7, 0.05]}
          material={sharedMaterials.sofaLinen}
        />

        {/* Debrum / Costura aparente na frente da almofada */}
        <mesh
          position={[0, 0.84, 0.71]}
          rotation={[0, 0, Math.PI / 2]}
          material={sharedMaterials.furnitureWoodDark}
        >
          <cylinderGeometry args={[0.012, 0.012, 1.18, 8]} />
        </mesh>

        {/* Braços estofados arredondados */}
        {[-0.68, 0.68].map((ax, idx) => (
          <group key={idx} position={[ax, 0.9, 0.02]}>
            <RoundedBox
              castShadow
              receiveShadow
              args={[0.38, 0.46, 1.5]}
              radius={0.12}
              smoothness={4}
              material={sharedMaterials.sofaLinen}
            />
          </group>
        ))}

        {/* Encosto alto anatômico em dois gomos macios */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.48, 0.68, 0.4]}
          radius={0.12}
          smoothness={4}
          position={[0, 1.22, -0.5]}
          rotation={[0.1, 0, 0]}
          material={sharedMaterials.sofaLinen}
        />
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.44, 0.62, 0.38]}
          radius={0.13}
          smoothness={4}
          position={[0, 1.74, -0.56]}
          rotation={[0.14, 0, 0]}
          material={sharedMaterials.sofaLinen}
        />

        {/* Almofada decorativa terracota apoiada naturalmente */}
        <RoundedBox
          castShadow
          args={[0.46, 0.44, 0.16]}
          radius={0.07}
          smoothness={4}
          position={[-0.28, 1.02, -0.18]}
          rotation={[-0.25, 0.22, 0.12]}
          material={sharedMaterials.sofaCushionAlt}
        />
      </group>

      {/* ======================================================== */}
      {/* 3. PUFE ESTOFADO COM COSTURA (Direita do primeiro plano) */}
      {/* Centro ~ X: 1.05m, Z: 0.75m                              */}
      {/* ======================================================== */}
      <group position={[1.05, 0, 0.75]} rotation={[0, -0.28, 0]}>
        <mesh position={[0.1, 0.006, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.48, 20]} />
          <meshBasicMaterial
            color="#1F0F04"
            transparent
            opacity={0.36}
            depthWrite={false}
          />
        </mesh>
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.62, 0.56, 0.62]}
          radius={0.09}
          smoothness={4}
          position={[0, 0.3, 0]}
          material={sharedMaterials.blockGrey}
        />
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.64, 0.18, 0.64]}
          radius={0.07}
          smoothness={4}
          position={[0, 0.62, 0]}
          material={sharedMaterials.blockGrey}
        />
      </group>

      {/* ======================================================== */}
      {/* 4. MESA DE CENTRO COM VIDRO E ESPAÇO LIVRE INFERIOR     */}
      {/* Centro ~ X: -1.45m, Z: -1.15m (Robô passa por baixo)     */}
      {/* ======================================================== */}
      <group position={[-1.45, 0, -1.15]} rotation={[0, 0, 0]}>
        {/* Moldura do tampo em madeira nobre arredondada */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[1.72, 0.07, 1.12]}
          radius={0.025}
          smoothness={3}
          position={[0, 0.65, 0]}
          material={sharedMaterials.furnitureWood}
        />
        {/* Painel central de vidro temperado translúcido */}
        <mesh position={[0, 0.688, 0]} material={sharedMaterials.tableGlass}>
          <boxGeometry args={[1.42, 0.012, 0.82]} />
        </mesh>
        {/* Saia estrutural no topo das pernas */}
        <RoundedBox
          castShadow
          args={[1.56, 0.06, 0.96]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.59, 0]}
          material={sharedMaterials.furnitureWoodDark}
        />
        {/* 4 Pés torneados finos nos 4 cantos da mesa */}
        {[
          [-0.72, 0.28, -0.44],
          [0.72, 0.28, -0.44],
          [-0.72, 0.28, 0.44],
          [0.72, 0.28, 0.44],
        ].map(([lx, ly, lz], idx) => (
          <mesh
            key={idx}
            castShadow
            position={[lx, ly, lz]}
            material={sharedMaterials.furnitureWoodDark}
          >
            <cylinderGeometry args={[0.038, 0.024, 0.56, 12]} />
          </mesh>
        ))}

        {/* OBJETOS COTIDIANOS SOBRE A MESA DE CENTRO (Seção 3.2) */}
        {/* 4.1. Bandeja decorativa com caneca de cerâmica */}
        <group position={[-0.32, 0.7, 0.05]} rotation={[0, 0.2, 0]}>
          <RoundedBox
            castShadow
            args={[0.42, 0.025, 0.28]}
            radius={0.01}
            smoothness={2}
            material={sharedMaterials.furnitureWoodDark}
          />
          {/* Caneca de cerâmica creme com café */}
          <group position={[-0.08, 0.065, 0.02]}>
            <mesh castShadow material={sharedMaterials.robotShell}>
              <cylinderGeometry args={[0.048, 0.042, 0.11, 16]} />
            </mesh>
            <mesh position={[0, 0.052, 0]}>
              <cylinderGeometry args={[0.042, 0.042, 0.008, 14]} />
              <meshStandardMaterial color="#3A1F0D" roughness={0.2} />
            </mesh>
            {/* Alça da caneca */}
            <mesh
              position={[0.05, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={sharedMaterials.robotShell}
            >
              <torusGeometry args={[0.028, 0.008, 8, 12]} />
            </mesh>
          </group>
          {/* Pequeno vaso suculenta sobre a bandeja */}
          <group position={[0.1, 0.045, -0.02]}>
            <mesh castShadow material={sharedMaterials.plantPotCeramic}>
              <cylinderGeometry args={[0.045, 0.035, 0.07, 12]} />
            </mesh>
            <mesh position={[0, 0.05, 0]} material={sharedMaterials.plantFoliageLight}>
              <dodecahedronGeometry args={[0.045, 1]} />
            </mesh>
          </group>
        </group>

        {/* 4.2. Livros ilustrados empilhados e controle remoto */}
        <group position={[0.34, 0.705, -0.06]} rotation={[0, -0.28, 0]}>
          <RoundedBox
            castShadow
            args={[0.32, 0.04, 0.24]}
            radius={0.008}
            smoothness={2}
            material={sharedMaterials.robotBlueTrim}
          />
          <RoundedBox
            castShadow
            args={[0.28, 0.036, 0.21]}
            radius={0.008}
            smoothness={2}
            position={[0.01, 0.038, 0]}
            rotation={[0, 0.18, 0]}
            material={sharedMaterials.robotCoralTrim}
          />
          {/* Controle remoto sobre a mesa */}
          <RoundedBox
            castShadow
            args={[0.16, 0.018, 0.052]}
            radius={0.006}
            smoothness={2}
            position={[-0.22, -0.005, 0.18]}
            rotation={[0, 0.45, 0]}
            material={sharedMaterials.dockBody}
          />
        </group>
      </group>

      {/* ======================================================== */}
      {/* 5. RACK DE CANTO + TV + PLANTA COM FOLHAS ORGÂNICAS      */}
      {/* Canto Noroeste ~ X: -3.1m, Z: -3.15m                     */}
      {/* ======================================================== */}
      <group position={[-3.1, 0, -3.15]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[2.1, 1.56, 1.1]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.78, 0]}
          material={sharedMaterials.furnitureWood}
        />
        {/* Nichos do rack com aparelhos e livros */}
        <mesh position={[-0.25, 0.75, 0.555]} material={sharedMaterials.robotVisor}>
          <boxGeometry args={[0.78, 1.15, 0.02]} />
        </mesh>
        {/* Puxadores de latão nas portas do gabinete */}
        {[0.32, 0.48].map((px, i) => (
          <mesh
            key={i}
            position={[px, 0.82, 0.565]}
            material={sharedMaterials.metalBrass}
          >
            <sphereGeometry args={[0.024, 10, 10]} />
          </mesh>
        ))}

        {/* TV Estilizada no topo esquerdo */}
        <group position={[-0.45, 2.02, 0]} rotation={[0, 0.35, 0]}>
          <RoundedBox
            castShadow
            args={[0.9, 0.92, 0.74]}
            radius={0.06}
            smoothness={4}
            material={sharedMaterials.tvCaseRetro}
          />
          <RoundedBox
            args={[0.7, 0.58, 0.05]}
            radius={0.03}
            smoothness={3}
            position={[0, 0.04, 0.365]}
            material={sharedMaterials.tvScreenOff}
          />
          {/* Botões giratórios metálicos da TV */}
          {[-0.18, -0.26].map((by, idx) => (
            <mesh
              key={idx}
              position={[0.28, by, 0.38]}
              rotation={[Math.PI / 2, 0, 0]}
              material={sharedMaterials.metalChrome}
            >
              <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
            </mesh>
          ))}
        </group>

        {/* Vaso de Cerâmica com Folhas Individualizadas (Seção 3.4) */}
        <group position={[0.52, 1.56, 0]}>
          {/* Corpo do vaso de terracota */}
          <mesh
            castShadow
            position={[0, 0.2, 0]}
            material={sharedMaterials.plantPotCeramic}
          >
            <cylinderGeometry args={[0.21, 0.14, 0.4, 18]} />
          </mesh>
          {/* Borda superior arredondada do vaso */}
          <mesh
            castShadow
            position={[0, 0.39, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={sharedMaterials.plantPotCeramic}
          >
            <torusGeometry args={[0.205, 0.022, 10, 24]} />
          </mesh>
          {/* Terra vegetal */}
          <mesh position={[0, 0.38, 0]} material={sharedMaterials.plantSoil}>
            <cylinderGeometry args={[0.19, 0.19, 0.02, 16]} />
          </mesh>

          {/* Folhas individualizadas dispostas radialmente com caimento orgânico */}
          {[0, 0.9, 1.8, 2.7, 3.6, 4.5, 5.4].map((angle, idx) => {
            const isInner = idx % 2 === 0;
            const tilt = isInner ? 0.42 : 0.68;
            const heightY = isInner ? 0.56 : 0.48;
            return (
              <group key={idx} position={[0, 0.38, 0]} rotation={[0, angle, 0]}>
                {/* Caule fino */}
                <mesh
                  position={[0, 0.12, 0.05]}
                  rotation={[tilt * 0.6, 0, 0]}
                  material={sharedMaterials.plantFoliage}
                >
                  <cylinderGeometry args={[0.01, 0.014, 0.24, 6]} />
                </mesh>
                {/* Lâmina da folha esculpida */}
                <mesh
                  castShadow
                  position={[0, heightY - 0.34, 0.16]}
                  rotation={[tilt, 0, 0]}
                  scale={[1, 0.18, 2.2]}
                  material={
                    isInner
                      ? sharedMaterials.plantFoliageLight
                      : sharedMaterials.plantFoliage
                  }
                >
                  <sphereGeometry args={[0.085, 10, 8]} />
                </mesh>
              </group>
            );
          })}
        </group>
      </group>

      {/* ======================================================== */}
      {/* 6. ESTANTE COM NICHOS, LIVROS E LUMINÁRIA (PAREDE LESTE) */}
      {/* ======================================================== */}
      <group position={[4.15, 0, -1.2]}>
        {/* Estante alta com prateleiras */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.95, 3.5, 1.45]}
          radius={0.03}
          smoothness={3}
          position={[0, 1.75, -1.35]}
          material={sharedMaterials.furnitureWoodDark}
        />
        {/* Aparador / Cômoda de madeira com gavetas esculpidas */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.92, 2.1, 1.95]}
          radius={0.035}
          smoothness={3}
          position={[0.05, 1.05, 0.55]}
          material={sharedMaterials.furnitureWood}
        />
        {/* Frentes das gavetas e puxadores de latão */}
        {[0.55, 1.15, 1.68].map((gy, idx) => (
          <group key={idx} position={[-0.41, gy, 0.55]}>
            <RoundedBox
              args={[0.03, 0.42, 1.72]}
              radius={0.01}
              smoothness={2}
              material={sharedMaterials.furnitureWoodDark}
            />
            {[-0.45, 0.45].map((gz, pIdx) => (
              <mesh
                key={pIdx}
                position={[-0.025, 0, gz]}
                material={sharedMaterials.metalBrass}
              >
                <sphereGeometry args={[0.028, 10, 10]} />
              </mesh>
            ))}
          </group>
        ))}

        {/* Luminária de mesa aquecida sobre a cômoda */}
        <group position={[0.05, 2.1, 0.85]}>
          <mesh
            castShadow
            position={[0, 0.03, 0]}
            material={sharedMaterials.metalBrass}
          >
            <cylinderGeometry args={[0.13, 0.15, 0.06, 16]} />
          </mesh>
          <mesh
            castShadow
            position={[0, 0.2, 0]}
            material={sharedMaterials.metalBrass}
          >
            <cylinderGeometry args={[0.035, 0.055, 0.34, 12]} />
          </mesh>
          <mesh
            castShadow
            position={[0, 0.44, 0]}
            material={sharedMaterials.robotCoralTrim}
          >
            <cylinderGeometry args={[0.15, 0.27, 0.38, 20]} />
          </mesh>
        </group>

        {/* Vaso decorativo azul na prateleira da estante */}
        <mesh
          castShadow
          position={[-0.35, 1.62, -1.1]}
          material={sharedMaterials.robotBlueTrim}
        >
          <cylinderGeometry args={[0.08, 0.11, 0.28, 14]} />
        </mesh>

        {/* Livros variados organizados nas prateleiras */}
        {WORLD_PALETTE.bookSpines.map((color, idx) => (
          <RoundedBox
            key={idx}
            castShadow
            args={[0.24, 0.34 + (idx % 2) * 0.04, 0.11]}
            radius={0.01}
            smoothness={2}
            position={[-0.36, 2.25, -1.72 + idx * 0.15]}
            rotation={[idx === 4 ? 0.22 : 0, 0, 0]}
          >
            <meshStandardMaterial color={color} roughness={0.48} />
          </RoundedBox>
        ))}
      </group>

      {/* ======================================================== */}
      {/* 7. CAIXA ORGANIZADORA CILÍNDRICA DE BRINQUEDOS           */}
      {/* (Os bonecos Toy Story e brinquedos móveis do chão estão  */}
      {/*  em ToyStoryFigures.tsx com física de empurrão em 60fps) */}
      {/* ======================================================== */}
      <group position={[2.35, 0, 2.45]}>
        <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 18]} />
          <meshBasicMaterial
            color="#1F0E03"
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </mesh>
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.21, 0]}
          material={sharedMaterials.plantFoliage}
        >
          <cylinderGeometry args={[0.21, 0.17, 0.42, 20]} />
        </mesh>
        <mesh
          castShadow
          position={[0.18, 0.04, 0.12]}
          rotation={[0.4, 0.2, 0.9]}
          material={sharedMaterials.robotShell}
        >
          <cylinderGeometry args={[0.22, 0.22, 0.03, 20]} />
        </mesh>
      </group>

      {/* ======================================================== */}
      {/* 8. SOFÁ / BANCO ESTOFADO COM BAÚ (Parede Sul ~ Z: 2.6m)  */}
      {/* ======================================================== */}
      <group position={[0, 0, 2.6]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[2.8, 0.68, 1.05]}
          radius={0.05}
          smoothness={3}
          position={[0, 0.34, 0]}
          material={sharedMaterials.furnitureWood}
        />
        {/* Assento acolchoado superior em tecido terracota com costuras */}
        <RoundedBox
          castShadow
          receiveShadow
          args={[2.88, 0.22, 1.1]}
          radius={0.06}
          smoothness={4}
          position={[0, 0.78, 0]}
          material={sharedMaterials.sofaCushionAlt}
        />
        {/* Duas almofadas laterais de linho verde-oliva */}
        {[-1.08, 1.08].map((px, idx) => (
          <RoundedBox
            key={idx}
            castShadow
            args={[0.44, 0.28, 0.44]}
            radius={0.07}
            smoothness={3}
            position={[px, 0.96, 0.12]}
            rotation={[0.15, idx === 0 ? 0.2 : -0.2, 0]}
            material={sharedMaterials.sofaLinen}
          />
        ))}
        {/* Fecho metálico frontal */}
        <RoundedBox
          args={[0.28, 0.16, 0.04]}
          radius={0.01}
          smoothness={2}
          position={[0, 0.66, -0.53]}
          material={sharedMaterials.metalBrass}
        />
      </group>

      {/* ======================================================== */}
      {/* 9. BASE DE CARREGAMENTO DO ASPITOY                       */}
      {/* ======================================================== */}
      <group position={[-0.15, 0.005, 0.85]}>
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.26, 0.33, 32]} />
          <meshBasicMaterial
            color={WORLD_PALETTE.sensorCyan}
            transparent
            opacity={0.45}
          />
        </mesh>
      </group>
      <group position={[-3.4, 0, -1.6]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox
          receiveShadow
          args={[0.78, 0.04, 0.82]}
          radius={0.015}
          smoothness={3}
          position={[0, 0.02, 0]}
          material={sharedMaterials.dockBody}
        />
        {[-0.15, 0.15].map((cx, idx) => (
          <mesh
            key={idx}
            position={[cx, 0.042, 0.08]}
            material={sharedMaterials.metalChrome}
          >
            <boxGeometry args={[0.055, 0.006, 0.28]} />
          </mesh>
        ))}
        <RoundedBox
          castShadow
          args={[0.58, 0.48, 0.2]}
          radius={0.04}
          smoothness={3}
          position={[0, 0.26, -0.3]}
          material={sharedMaterials.dockBody}
        />
        <RoundedBox
          args={[0.6, 0.055, 0.22]}
          radius={0.02}
          smoothness={2}
          position={[0, 0.48, -0.3]}
          material={sharedMaterials.robotCoralTrim}
        />
        <mesh position={[0, 0.34, -0.195]}>
          <boxGeometry args={[0.24, 0.04, 0.01]} />
          <meshBasicMaterial color={WORLD_PALETTE.ledEmerald} />
        </mesh>
      </group>
    </group>
  );
});
