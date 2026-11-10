import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { pushableToysBridge } from '@/store/environmentStore';
import { sharedMaterials } from '../Environment/Materials';
import type { PushableToyKind } from '@/types/environment';

const toyFigureMaterials = {
  cowboyHat: new THREE.MeshStandardMaterial({
    color: '#6E3B16',
    roughness: 0.45,
  }),
  cowboySkin: new THREE.MeshStandardMaterial({
    color: '#F3C39A',
    roughness: 0.42,
  }),
  cowboyShirt: new THREE.MeshStandardMaterial({
    color: '#F5BC16',
    roughness: 0.48,
  }),
  cowboyVest: new THREE.MeshStandardMaterial({
    color: '#FAF6EE',
    roughness: 0.55,
  }),
  cowboyJeans: new THREE.MeshStandardMaterial({
    color: '#2563EB',
    roughness: 0.62,
  }),
  spaceWhite: new THREE.MeshPhysicalMaterial({
    color: '#F8FAFC',
    roughness: 0.25,
    clearcoat: 0.5,
  }),
  spaceLime: new THREE.MeshPhysicalMaterial({
    color: '#84CC16',
    roughness: 0.28,
    clearcoat: 0.45,
  }),
  spacePurple: new THREE.MeshPhysicalMaterial({
    color: '#7E22CE',
    roughness: 0.32,
    clearcoat: 0.35,
  }),
  spaceVisor: new THREE.MeshPhysicalMaterial({
    color: '#E0F2FE',
    transparent: true,
    opacity: 0.38,
    roughness: 0.1,
    clearcoat: 0.9,
  }),
  alienGreen: new THREE.MeshPhysicalMaterial({
    color: '#A3E635',
    roughness: 0.32,
    clearcoat: 0.3,
  }),
  alienSuit: new THREE.MeshStandardMaterial({
    color: '#0284C7',
    roughness: 0.45,
  }),
  trexGreen: new THREE.MeshPhysicalMaterial({
    color: '#22C55E',
    roughness: 0.32,
    clearcoat: 0.4,
  }),
  piggyPink: new THREE.MeshPhysicalMaterial({
    color: '#F472B6',
    roughness: 0.26,
    clearcoat: 0.55,
  }),
  slinkyBrown: new THREE.MeshStandardMaterial({
    color: '#8B4513',
    roughness: 0.42,
  }),
  eyeWhite: new THREE.MeshBasicMaterial({ color: '#FFFFFF' }),
  eyePupil: new THREE.MeshBasicMaterial({ color: '#141414' }),
};

/**
 * 1. Boneco Cowboy Xerife (Chapéu marrom, camisa amarela, colete malhado, lenço vermelho, jeans e botas)
 */
export const CowboyDollMesh = memo(function CowboyDollMesh({
  sitting = false,
}: {
  sitting?: boolean;
}) {
  return (
    <group>
      {/* Botas e Pernas Jeans */}
      {sitting ? (
        <group position={[0, 0.06, 0.06]}>
          {[-0.036, 0.036].map((lx, i) => (
            <group key={i} position={[lx, 0, 0]}>
              <mesh
                castShadow
                rotation={[Math.PI / 2, 0, 0]}
                material={toyFigureMaterials.cowboyJeans}
              >
                <cylinderGeometry args={[0.022, 0.02, 0.14, 10]} />
              </mesh>
              <mesh
                castShadow
                position={[0, 0.01, 0.08]}
                material={toyFigureMaterials.cowboyHat}
              >
                <boxGeometry args={[0.042, 0.055, 0.045]} />
              </mesh>
            </group>
          ))}
        </group>
      ) : (
        <group>
          {[-0.036, 0.036].map((lx, i) => (
            <group key={i} position={[lx, 0, 0]}>
              {/* Bota de cowboy */}
              <mesh
                castShadow
                position={[0, 0.04, 0.01]}
                material={toyFigureMaterials.cowboyHat}
              >
                <boxGeometry args={[0.042, 0.08, 0.065]} />
              </mesh>
              {/* Perna jeans */}
              <mesh
                castShadow
                position={[0, 0.13, 0]}
                material={toyFigureMaterials.cowboyJeans}
              >
                <cylinderGeometry args={[0.022, 0.02, 0.12, 10]} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {/* Tronco: Camisa amarela + Colete malhado + Cinto */}
      <group position={[0, sitting ? 0.15 : 0.26, 0]}>
        <RoundedBox
          castShadow
          args={[0.11, 0.14, 0.068]}
          radius={0.018}
          smoothness={3}
          material={toyFigureMaterials.cowboyShirt}
        />
        {/* Colete branco com manchas */}
        <RoundedBox
          args={[0.116, 0.11, 0.072]}
          radius={0.012}
          smoothness={2}
          position={[0, 0.01, 0]}
          material={toyFigureMaterials.cowboyVest}
        />
        <mesh position={[-0.03, 0.02, 0.038]} material={toyFigureMaterials.eyePupil}>
          <circleGeometry args={[0.014, 8]} />
        </mesh>
        <mesh position={[0.028, -0.01, 0.038]} material={toyFigureMaterials.eyePupil}>
          <circleGeometry args={[0.012, 8]} />
        </mesh>
        {/* Estrela dourada de Xerife */}
        <mesh position={[-0.028, 0.032, 0.04]} material={sharedMaterials.metalBrass}>
          <circleGeometry args={[0.013, 5]} />
        </mesh>
        {/* Lenço vermelho no pescoço */}
        <mesh
          position={[0, 0.072, 0.01]}
          rotation={[Math.PI / 2, 0, 0]}
          material={sharedMaterials.robotCoralTrim}
        >
          <torusGeometry args={[0.036, 0.012, 8, 14]} />
        </mesh>
        {/* Cinto com fivela dourada */}
        <mesh position={[0, -0.058, 0]} material={toyFigureMaterials.cowboyHat}>
          <boxGeometry args={[0.114, 0.022, 0.072]} />
        </mesh>
        <mesh position={[0, -0.058, 0.038]} material={sharedMaterials.metalBrass}>
          <boxGeometry args={[0.032, 0.024, 0.006]} />
        </mesh>

        {/* Braços */}
        {[-0.072, 0.072].map((ax, i) => (
          <mesh
            key={i}
            castShadow
            position={[ax, 0.0, 0]}
            rotation={[0, 0, (i === 0 ? 1 : -1) * 0.22]}
            material={toyFigureMaterials.cowboyShirt}
          >
            <cylinderGeometry args={[0.018, 0.016, 0.13, 10]} />
          </mesh>
        ))}

        {/* Cabeça e Chapéu de Cowboy */}
        <group position={[0, 0.125, 0]}>
          <mesh castShadow material={toyFigureMaterials.cowboySkin}>
            <sphereGeometry args={[0.048, 16, 14]} />
          </mesh>
          {/* Olhos */}
          {[-0.016, 0.016].map((ex, i) => (
            <mesh key={i} position={[ex, 0.006, 0.044]} material={toyFigureMaterials.eyePupil}>
              <sphereGeometry args={[0.006, 8, 8]} />
            </mesh>
          ))}
          {/* Aba larga do chapéu de cowboy */}
          <mesh
            castShadow
            position={[0, 0.036, 0]}
            rotation={[0.06, 0, 0]}
            scale={[1.15, 0.22, 1.0]}
            material={toyFigureMaterials.cowboyHat}
          >
            <cylinderGeometry args={[0.088, 0.092, 0.04, 18]} />
          </mesh>
          {/* Copa do chapéu */}
          <mesh
            castShadow
            position={[0, 0.062, 0]}
            material={toyFigureMaterials.cowboyHat}
          >
            <cylinderGeometry args={[0.042, 0.052, 0.055, 14]} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

/**
 * 2. Boneco Patrulheiro Espacial (Armadura branca/verde-limão, detalhes roxos, capacete translúcido e asas)
 */
export const SpaceRangerMesh = memo(function SpaceRangerMesh() {
  return (
    <group>
      {/* Botas espaciais brancas com sola verde */}
      {[-0.046, 0.046].map((lx, i) => (
        <group key={i} position={[lx, 0, 0]}>
          <RoundedBox
            castShadow
            args={[0.052, 0.06, 0.078]}
            radius={0.012}
            smoothness={2}
            position={[0, 0.03, 0.01]}
            material={toyFigureMaterials.spaceWhite}
          />
          <mesh
            castShadow
            position={[0, 0.11, 0]}
            material={toyFigureMaterials.spaceWhite}
          >
            <cylinderGeometry args={[0.028, 0.024, 0.11, 12]} />
          </mesh>
        </group>
      ))}

      {/* Peitoral aerodinâmico branco e verde-limão */}
      <group position={[0, 0.23, 0]}>
        <RoundedBox
          castShadow
          args={[0.16, 0.13, 0.1]}
          radius={0.03}
          smoothness={3}
          material={toyFigureMaterials.spaceLime}
        />
        <RoundedBox
          castShadow
          args={[0.14, 0.09, 0.106]}
          radius={0.02}
          smoothness={3}
          position={[0, 0.015, 0]}
          material={toyFigureMaterials.spaceWhite}
        />
        {/* Botões coloridos no peito */}
        {[
          { x: -0.032, c: '#EF4444' },
          { x: -0.012, c: '#22C55E' },
          { x: 0.008, c: '#3B82F6' },
        ].map((btn, idx) => (
          <mesh key={idx} position={[btn.x, 0.015, 0.055]}>
            <circleGeometry args={[0.008, 10]} />
            <meshBasicMaterial color={btn.c} />
          </mesh>
        ))}

        {/* Jetpack e Asas Espaciais */}
        <RoundedBox
          castShadow
          args={[0.12, 0.11, 0.06]}
          radius={0.015}
          smoothness={2}
          position={[0, 0.01, -0.065]}
          material={toyFigureMaterials.spaceWhite}
        />
        {/* Asas abertas roxas com pontas vermelhas/brancas */}
        <mesh
          castShadow
          position={[0, 0.02, -0.08]}
          material={toyFigureMaterials.spacePurple}
        >
          <boxGeometry args={[0.34, 0.055, 0.014]} />
        </mesh>
        {[-0.17, 0.17].map((wx, i) => (
          <mesh
            key={i}
            position={[wx, 0.02, -0.08]}
            material={sharedMaterials.robotCoralTrim}
          >
            <boxGeometry args={[0.028, 0.06, 0.018]} />
          </mesh>
        ))}

        {/* Braços articulados */}
        {[-0.098, 0.098].map((ax, i) => (
          <mesh
            key={i}
            castShadow
            position={[ax, -0.005, 0.01]}
            rotation={[-0.25, 0, (i === 0 ? 1 : -1) * 0.25]}
            material={toyFigureMaterials.spaceWhite}
          >
            <cylinderGeometry args={[0.025, 0.022, 0.12, 12]} />
          </mesh>
        ))}

        {/* Cabeça com coifa roxa e cúpula de acrílico translúcida */}
        <group position={[0, 0.105, 0]}>
          <mesh castShadow material={toyFigureMaterials.spacePurple}>
            <sphereGeometry args={[0.048, 16, 14]} />
          </mesh>
          <mesh position={[0, -0.004, 0.018]} material={toyFigureMaterials.cowboySkin}>
            <sphereGeometry args={[0.036, 14, 12]} />
          </mesh>
          {/* Domo espacial transparente */}
          <mesh material={toyFigureMaterials.spaceVisor}>
            <sphereGeometry args={[0.068, 20, 16]} />
          </mesh>
        </group>
      </group>
    </group>
  );
});

/**
 * 3. Alienígena Verde de 3 Olhos (Traje azul, antena e 3 olhos expressivos)
 */
export const GreenAlienMesh = memo(function GreenAlienMesh() {
  return (
    <group>
      {/* Corpo em traje azul */}
      <RoundedBox
        castShadow
        args={[0.11, 0.11, 0.09]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.065, 0]}
        material={toyFigureMaterials.alienSuit}
      />
      {/* Cinto preto */}
      <mesh position={[0, 0.055, 0]} material={sharedMaterials.robotRubberBumper}>
        <cylinderGeometry args={[0.056, 0.056, 0.018, 16]} />
      </mesh>
      {/* Cabeça verde-limão achatada */}
      <group position={[0, 0.155, 0]}>
        <mesh
          castShadow
          scale={[1.18, 0.88, 0.95]}
          material={toyFigureMaterials.alienGreen}
        >
          <sphereGeometry args={[0.058, 18, 14]} />
        </mesh>
        {/* 3 Olhos Brancos com Pupilas */}
        {[
          [-0.026, 0.008, 0.048],
          [0, 0.016, 0.053],
          [0.026, 0.008, 0.048],
        ].map(([ex, ey, ez], idx) => (
          <group key={idx} position={[ex, ey, ez]}>
            <mesh material={toyFigureMaterials.eyeWhite}>
              <sphereGeometry args={[0.013, 10, 10]} />
            </mesh>
            <mesh position={[0, 0, 0.01]} material={toyFigureMaterials.eyePupil}>
              <sphereGeometry args={[0.005, 8, 8]} />
            </mesh>
          </group>
        ))}
        {/* Orelhas pontudas laterais */}
        {[-0.068, 0.068].map((ox, i) => (
          <mesh
            key={i}
            position={[ox, 0, 0]}
            rotation={[0, 0, (i === 0 ? 1 : -1) * 1.1]}
            material={toyFigureMaterials.alienGreen}
          >
            <coneGeometry args={[0.016, 0.04, 8]} />
          </mesh>
        ))}
        {/* Antena central no topo */}
        <mesh position={[0, 0.058, 0]} material={toyFigureMaterials.alienGreen}>
          <cylinderGeometry args={[0.005, 0.007, 0.045, 8]} />
        </mesh>
        <mesh position={[0, 0.082, 0]} material={toyFigureMaterials.alienGreen}>
          <sphereGeometry args={[0.012, 10, 10]} />
        </mesh>
      </group>
    </group>
  );
});

/**
 * 4. Dinossauro T-Rex Verde de Brinquedo
 */
export const TRexDinoMesh = memo(function TRexDinoMesh() {
  return (
    <group>
      {/* Pernas musculosas */}
      {[-0.055, 0.055].map((lx, i) => (
        <mesh
          key={i}
          castShadow
          position={[lx, 0.08, 0]}
          material={toyFigureMaterials.trexGreen}
        >
          <cylinderGeometry args={[0.032, 0.038, 0.16, 12]} />
        </mesh>
      ))}
      {/* Tronco inclinado */}
      <RoundedBox
        castShadow
        args={[0.14, 0.19, 0.22]}
        radius={0.05}
        smoothness={4}
        position={[0, 0.19, 0.02]}
        rotation={[-0.35, 0, 0]}
        material={toyFigureMaterials.trexGreen}
      />
      {/* Cauda longa */}
      <mesh
        castShadow
        position={[0, 0.14, -0.16]}
        rotation={[-1.25, 0, 0]}
        material={toyFigureMaterials.trexGreen}
      >
        <coneGeometry args={[0.055, 0.26, 12]} />
      </mesh>
      {/* Cabeça grande de T-Rex */}
      <RoundedBox
        castShadow
        args={[0.12, 0.11, 0.17]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.31, 0.11]}
        material={toyFigureMaterials.trexGreen}
      />
      {/* Olhos do T-Rex */}
      {[-0.058, 0.058].map((ex, i) => (
        <mesh key={i} position={[ex, 0.33, 0.14]} material={toyFigureMaterials.eyeWhite}>
          <sphereGeometry args={[0.014, 10, 10]} />
        </mesh>
      ))}
    </group>
  );
});

/**
 * 5. Cachorro de Mola (Slinky Dog)
 */
export const SlinkyDogMesh = memo(function SlinkyDogMesh() {
  return (
    <group>
      {/* Parte dianteira e cabeça */}
      <group position={[0, 0.09, 0.11]}>
        <RoundedBox
          castShadow
          args={[0.1, 0.1, 0.11]}
          radius={0.03}
          smoothness={3}
          material={toyFigureMaterials.slinkyBrown}
        />
        <RoundedBox
          castShadow
          args={[0.09, 0.09, 0.12]}
          radius={0.025}
          smoothness={3}
          position={[0, 0.08, 0.04]}
          material={toyFigureMaterials.slinkyBrown}
        />
        {/* Orelhas caídas */}
        {[-0.055, 0.055].map((ex, i) => (
          <RoundedBox
            key={i}
            args={[0.018, 0.08, 0.045]}
            radius={0.008}
            smoothness={2}
            position={[ex, 0.05, 0.03]}
            material={sharedMaterials.furnitureWoodDark}
          />
        ))}
      </group>

      {/* Mola central metálica */}
      {[-0.04, -0.01, 0.02, 0.05].map((mz, idx) => (
        <mesh
          key={idx}
          position={[0, 0.09, mz]}
          material={sharedMaterials.metalChrome}
        >
          <torusGeometry args={[0.038, 0.006, 8, 18]} />
        </mesh>
      ))}

      {/* Parte traseira */}
      <RoundedBox
        castShadow
        args={[0.1, 0.1, 0.1]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.09, -0.1]}
        material={toyFigureMaterials.slinkyBrown}
      />
    </group>
  );
});

/**
 * 6. Porquinho Cofrinho Rosa
 */
export const PiggyBankMesh = memo(function PiggyBankMesh() {
  return (
    <group>
      {/* Corpo roliço rosa */}
      <mesh
        castShadow
        position={[0, 0.11, 0]}
        scale={[0.92, 0.88, 1.22]}
        material={toyFigureMaterials.piggyPink}
      >
        <sphereGeometry args={[0.1, 20, 16]} />
      </mesh>
      {/* Focinho */}
      <mesh
        castShadow
        position={[0, 0.11, 0.12]}
        rotation={[Math.PI / 2, 0, 0]}
        material={toyFigureMaterials.piggyPink}
      >
        <cylinderGeometry args={[0.038, 0.042, 0.035, 14]} />
      </mesh>
      {/* Fenda de moedas nas costas */}
      <mesh position={[0, 0.195, 0]} material={sharedMaterials.robotVisor}>
        <boxGeometry args={[0.014, 0.01, 0.07]} />
      </mesh>
      {/* 4 Patinhas */}
      {[
        [-0.05, 0.03, 0.05],
        [0.05, 0.03, 0.05],
        [-0.05, 0.03, -0.05],
        [0.05, 0.03, -0.05],
      ].map(([px, py, pz], idx) => (
        <mesh
          key={idx}
          castShadow
          position={[px, py, pz]}
          material={toyFigureMaterials.piggyPink}
        >
          <cylinderGeometry args={[0.02, 0.016, 0.06, 10]} />
        </mesh>
      ))}
    </group>
  );
});

/**
 * Renderiza a malha correspondente a cada tipo de brinquedo empurrável no chão.
 */
function PushableToyVisual({ kind }: { kind: PushableToyKind }) {
  switch (kind) {
    case 'cowboy-doll':
      return <CowboyDollMesh />;
    case 'space-ranger':
      return <SpaceRangerMesh />;
    case 'green-alien':
      return <GreenAlienMesh />;
    case 'trex-dino':
      return <TRexDinoMesh />;
    case 'slinky-dog':
      return <SlinkyDogMesh />;
    case 'piggy-bank':
      return <PiggyBankMesh />;
    case 'planet-ball':
      return (
        <group position={[0, 0.21, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.21, 24, 20]} />
            <meshPhysicalMaterial
              color="#0EA5E9"
              roughness={0.25}
              clearcoat={0.5}
            />
          </mesh>
          <mesh
            rotation={[0.35, 0, 0.22]}
            material={sharedMaterials.robotCoralTrim}
          >
            <torusGeometry args={[0.206, 0.022, 10, 28]} />
          </mesh>
          <mesh
            rotation={[-0.85, 0.4, 0]}
            material={sharedMaterials.robotYellowTrim}
          >
            <torusGeometry args={[0.205, 0.018, 10, 28]} />
          </mesh>
        </group>
      );
    case 'block-red':
      return (
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.26, 0.26, 0.26]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.13, 0]}
          material={sharedMaterials.robotCoralTrim}
        />
      );
    case 'block-blue':
      return (
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.26, 0.26, 0.26]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.13, 0]}
          material={sharedMaterials.robotBlueTrim}
        />
      );
    case 'block-yellow':
      return (
        <RoundedBox
          castShadow
          receiveShadow
          args={[0.26, 0.26, 0.26]}
          radius={0.03}
          smoothness={3}
          position={[0, 0.13, 0]}
          material={sharedMaterials.robotYellowTrim}
        />
      );
    case 'wooden-train':
      return (
        <group>
          <RoundedBox
            castShadow
            args={[0.34, 0.08, 0.18]}
            radius={0.015}
            smoothness={2}
            position={[-0.04, 0.09, 0]}
            material={sharedMaterials.robotCoralTrim}
          />
          <RoundedBox
            castShadow
            args={[0.16, 0.16, 0.17]}
            radius={0.02}
            smoothness={3}
            position={[-0.1, 0.2, 0]}
            material={sharedMaterials.robotBlueTrim}
          />
          <mesh
            castShadow
            position={[0.05, 0.17, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={sharedMaterials.robotYellowTrim}
          >
            <cylinderGeometry args={[0.065, 0.065, 0.16, 14]} />
          </mesh>
        </group>
      );
    case 'ring-stacker':
      return (
        <group>
          <mesh
            castShadow
            position={[0, 0.03, 0]}
            material={sharedMaterials.robotShell}
          >
            <cylinderGeometry args={[0.16, 0.18, 0.05, 18]} />
          </mesh>
          {[
            { y: 0.08, r: 0.12, mat: sharedMaterials.robotBlueTrim },
            { y: 0.13, r: 0.1, mat: sharedMaterials.plantFoliage },
            { y: 0.18, r: 0.08, mat: sharedMaterials.robotYellowTrim },
            { y: 0.23, r: 0.06, mat: sharedMaterials.robotCoralTrim },
          ].map((ring, idx) => (
            <mesh
              key={idx}
              castShadow
              position={[0, ring.y, 0]}
              rotation={[Math.PI / 2, 0, 0]}
              material={ring.mat}
            >
              <torusGeometry args={[ring.r, 0.026, 10, 20]} />
            </mesh>
          ))}
        </group>
      );
    case 'rc-buggy':
      return (
        <group>
          <RoundedBox
            castShadow
            args={[0.4, 0.09, 0.22]}
            radius={0.02}
            smoothness={3}
            position={[0, 0.09, 0]}
            material={sharedMaterials.plantFoliage}
          />
          <RoundedBox
            castShadow
            args={[0.18, 0.08, 0.18]}
            radius={0.02}
            smoothness={3}
            position={[-0.03, 0.16, 0]}
            material={sharedMaterials.robotBlueTrim}
          />
          {[
            [0.13, 0.065, 0.13],
            [0.13, 0.065, -0.13],
            [-0.13, 0.075, 0.13],
            [-0.13, 0.075, -0.13],
          ].map(([wx, wy, wz], idx) => (
            <mesh
              key={idx}
              castShadow
              position={[wx, wy, wz]}
              rotation={[Math.PI / 2, 0, 0]}
              material={sharedMaterials.robotRubberBumper}
            >
              <cylinderGeometry args={[wy, wy, 0.055, 14]} />
            </mesh>
          ))}
        </group>
      );
    case 'bowling-pin':
      return (
        <group>
          <mesh
            castShadow
            position={[0, 0.13, 0]}
            material={sharedMaterials.robotShell}
          >
            <cylinderGeometry args={[0.036, 0.062, 0.26, 14]} />
          </mesh>
          <mesh
            castShadow
            position={[0, 0.29, 0]}
            material={sharedMaterials.robotShell}
          >
            <sphereGeometry args={[0.048, 12, 12]} />
          </mesh>
          <mesh
            position={[0, 0.22, 0]}
            material={sharedMaterials.robotCoralTrim}
          >
            <cylinderGeometry args={[0.04, 0.042, 0.03, 14]} />
          </mesh>
        </group>
      );
  }
}

/**
 * Brinquedos pequenos no chão que são fisicamente empurrados pelo AspiToy em 60 FPS.
 */
export const PushableFloorToys = memo(function PushableFloorToys() {
  const groupRefs = useRef<Array<THREE.Group | null>>([]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    for (let i = 0; i < pushableToysBridge.length; i++) {
      const toy = pushableToysBridge[i];
      const node = groupRefs.current[i];
      if (!node) continue;

      node.position.set(toy.x, 0, toy.z);
      node.rotation.y = toy.rotY;

      // Balanço elástico quando o brinquedo é empurrado pelo robô
      const wobbleSin = Math.sin(t * 18 + i) * toy.wobble;
      const wobbleCos = Math.cos(t * 16 + i) * toy.wobble;
      node.rotation.x =
        toy.kind === 'planet-ball' ? toy.rollPhase : wobbleSin;
      node.rotation.z = wobbleCos;
    }
  });

  return (
    <group name="pushable-floor-toys">
      {pushableToysBridge.map((toy, idx) => (
        <group
          key={toy.id}
          ref={(el) => {
            groupRefs.current[idx] = el;
          }}
          position={[toy.x, 0, toy.z]}
          rotation={[0, toy.rotY, 0]}
        >
          {/* Sombra de contato sob cada brinquedo */}
          <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[toy.radius * 0.95, 18]} />
            <meshBasicMaterial
              color="#1E0E03"
              transparent
              opacity={0.38}
              depthWrite={false}
            />
          </mesh>
          <PushableToyVisual kind={toy.kind} />
        </group>
      ))}
    </group>
  );
});

/**
 * Bonecos do universo Toy Story posicionados em cima dos móveis da sala/quarto
 * (poltrona, mesa de centro, gabinete da TV, lareira, cômoda e sofá-baú).
 */
export const PerchedFurnitureToys = memo(function PerchedFurnitureToys() {
  return (
    <group name="perched-furniture-toys">
      {/* 1. Boneco Cowboy sentado no braço da Poltrona Verde-Oliva */}
      <group position={[0.32, 1.12, -0.58]} rotation={[0, -0.65, 0]}>
        <CowboyDollMesh sitting />
      </group>

      {/* 2. Patrulheiro Espacial no topo do Gabinete da TV CRT (olhando o quarto) */}
      <group position={[-2.62, 1.56, -2.75]} rotation={[0, 0.55, 0]}>
        <SpaceRangerMesh />
      </group>

      {/* 3. Dupla de Alienígenas de 3 Olhos sobre a Mesa de Centro */}
      <group position={[-1.78, 0.69, -1.32]} rotation={[0, 0.65, 0]}>
        <GreenAlienMesh />
      </group>
      <group position={[-1.62, 0.69, -1.42]} rotation={[0, 0.35, 0]}>
        <GreenAlienMesh />
      </group>

      {/* 4. Boneco Cowboy e Alienígena sobre a Cornija da Lareira */}
      <group position={[0.52, 2.0, -3.72]} rotation={[0, -0.25, 0]}>
        <CowboyDollMesh />
      </group>
      <group position={[-0.42, 2.0, -3.72]} rotation={[0, 0.25, 0]}>
        <GreenAlienMesh />
      </group>

      {/* 5. Dinossauro T-Rex e Porquinho Cofrinho no topo da Cômoda Leste */}
      <group position={[4.12, 2.1, -0.05]} rotation={[0, -Math.PI / 2 - 0.2, 0]}>
        <TRexDinoMesh />
      </group>
      <group position={[4.12, 2.1, 0.42]} rotation={[0, -Math.PI / 2 + 0.3, 0]}>
        <PiggyBankMesh />
      </group>

      {/* 6. Patrulheiro Espacial e Cachorro de Mola sobre o Sofá-Baú Sul */}
      <group position={[-0.65, 0.89, 2.42]} rotation={[0, 2.85, 0]}>
        <SpaceRangerMesh />
      </group>
      <group position={[0.58, 0.89, 2.45]} rotation={[0, -2.6, 0]}>
        <SlinkyDogMesh />
      </group>
    </group>
  );
});
