import { forwardRef } from 'react';
import * as THREE from 'three';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';
import type { RobotExpression, RobotOperationalState } from '@/types/robot';

interface RobotModelProps {
  wheelSpin?: number;
  pitch?: number;
  roll?: number;
  bobY?: number;
  bumperCompression?: number;
  state?: RobotOperationalState;
  expression?: RobotExpression;
}

/**
 * Modelo 3D Low-Poly do AspiToy (Estética PS2 / 6ª Geração de Consoles):
 * - Geometria facetada low-poly (12-14 segmentos) com acabamento plástico fosco (matte)
 * - Sombra redonda simples (Blob Drop Shadow) projetada diretamente sob o brinquedo
 * - Cores primárias vibrantes de brinquedo (Vermelho, Amarelo, Azul e Creme)
 * - Antena plástica flexível com ponta luminosa no topo
 * - Visor frontal com olhos expressivos estilo Toy Story PS2
 */
export const RobotModel = forwardRef<THREE.Group, RobotModelProps>(function RobotModel(
  {
    wheelSpin = 0,
    pitch = 0,
    roll = 0,
    bobY = 0,
    bumperCompression = 0,
    state = 'IDLE',
    expression = 'neutral',
  },
  ref
) {
  const statusColor =
    state === 'CLEANING'
      ? WORLD_PALETTE.robotCoral
      : state === 'AVOIDING' || state === 'PAUSED'
        ? WORLD_PALETTE.ledAmber
        : state === 'RETURNING'
          ? WORLD_PALETTE.sensorCyan
          : WORLD_PALETTE.ledEmerald;

  const eyeColor =
    state === 'AVOIDING'
      ? WORLD_PALETTE.ledAmber
      : state === 'CLEANING'
        ? '#7DD3FC'
        : WORLD_PALETTE.sensorCyan;

  const eyeScaleY =
    expression === 'sleepy' ? 0.28 : expression === 'focused' ? 0.72 : 1.0;
  const eyeAngle =
    expression === 'alert' ? 0.25 : expression === 'curious' ? -0.15 : 0;

  return (
    <group ref={ref} name="aspitoy-ps2-model">
      {/* ======================================================== */}
      {/* SOMBRA REDONDA CLÁSSICA DE PS2 (Simple Round Drop Shadow)*/}
      {/* ======================================================== */}
      <group position={[0, 0.008, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.33, 14]} />
          <meshBasicMaterial
            color="#1F0E03"
            transparent
            opacity={0.55}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.22, 12]} />
          <meshBasicMaterial
            color="#120701"
            transparent
            opacity={0.45}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Corpo articulado low-poly do brinquedo */}
      <group position={[0, 0.098 + bobY, 0]} rotation={[pitch, 0, roll]}>
        {/* 1. CHASSI LOW-POLY EM PLÁSTICO FOSCO (12 faces) */}
        <mesh castShadow receiveShadow material={sharedMaterials.robotShell}>
          <cylinderGeometry args={[0.26, 0.285, 0.13, 12]} />
        </mesh>

        {/* Aro superior vermelho vibrante */}
        <mesh
          castShadow
          position={[0, 0.068, 0]}
          material={sharedMaterials.robotCoralTrim}
        >
          <cylinderGeometry args={[0.21, 0.245, 0.026, 12]} />
        </mesh>

        {/* Botão amarelo de brinquedo no topo */}
        <mesh
          castShadow
          position={[0, 0.085, 0.11]}
          material={sharedMaterials.robotYellowTrim}
        >
          <cylinderGeometry args={[0.036, 0.04, 0.018, 8]} />
        </mesh>

        {/* 2. PARA-CHOQUE FRONTAL AZUL BRINQUEDO */}
        <group position={[0, 0.002, 0.075 - bumperCompression]}>
          <mesh castShadow material={sharedMaterials.robotBlueTrim}>
            <cylinderGeometry
              args={[0.29, 0.29, 0.105, 10, 1, false, -Math.PI * 0.42, Math.PI * 0.84]}
            />
          </mesh>
        </group>

        {/* 3. TORRE DO SENSOR E ANTENA DE BRINQUEDO */}
        <group position={[0, 0.085, -0.04]}>
          <mesh castShadow material={sharedMaterials.robotBlueTrim}>
            <cylinderGeometry args={[0.072, 0.088, 0.048, 10]} />
          </mesh>
          {/* Haste da antena plástica */}
          <mesh position={[0, 0.07, -0.01]} material={sharedMaterials.robotVisor}>
            <cylinderGeometry args={[0.008, 0.012, 0.11, 6]} />
          </mesh>
          {/* Bolinha luminosa no topo da antena */}
          <mesh position={[0, 0.13, -0.01]}>
            <sphereGeometry args={[0.024, 8, 8]} />
            <meshBasicMaterial color={statusColor} />
          </mesh>
        </group>

        {/* 4. VISOR FRONTAL E OLHOS EXPRESSIVOS LOW-POLY */}
        <group position={[0, 0.02, 0.255]}>
          <mesh material={sharedMaterials.robotVisor}>
            <boxGeometry args={[0.23, 0.078, 0.042]} />
          </mesh>
          {/* Olho Esquerdo */}
          <group
            position={[-0.052, 0.003, 0.022]}
            rotation={[0, 0, -eyeAngle]}
            scale={[1, eyeScaleY, 1]}
          >
            <mesh>
              <boxGeometry args={[0.034, 0.042, 0.008]} />
              <meshBasicMaterial color={eyeColor} />
            </mesh>
          </group>
          {/* Olho Direito */}
          <group
            position={[0.052, 0.003, 0.022]}
            rotation={[0, 0, eyeAngle]}
            scale={[1, eyeScaleY, 1]}
          >
            <mesh>
              <boxGeometry args={[0.034, 0.042, 0.008]} />
              <meshBasicMaterial color={eyeColor} />
            </mesh>
          </group>
        </group>

        {/* 5. RODAS ROBUSTAS DE BRINQUEDO COM CALOTAS AMARELAS */}
        <group position={[-0.26, -0.042, 0]} rotation={[wheelSpin, 0, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]} material={sharedMaterials.robotVisor}>
            <cylinderGeometry args={[0.056, 0.056, 0.044, 10]} />
          </mesh>
          <mesh
            position={[-0.024, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={sharedMaterials.robotYellowTrim}
          >
            <cylinderGeometry args={[0.032, 0.032, 0.008, 8]} />
          </mesh>
        </group>

        <group position={[0.26, -0.042, 0]} rotation={[wheelSpin, 0, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]} material={sharedMaterials.robotVisor}>
            <cylinderGeometry args={[0.056, 0.056, 0.044, 10]} />
          </mesh>
          <mesh
            position={[0.024, 0, 0]}
            rotation={[0, 0, Math.PI / 2]}
            material={sharedMaterials.robotYellowTrim}
          >
            <cylinderGeometry args={[0.032, 0.032, 0.008, 8]} />
          </mesh>
        </group>

        {/* 6. ESCOVAS LATERAIS GIRATÓRIAS */}
        {[-0.18, 0.18].map((bx, idx) => (
          <group
            key={idx}
            position={[bx, -0.074, 0.18]}
            rotation={[0, (idx === 0 ? -1 : 1) * wheelSpin * 2.2, 0]}
          >
            <mesh material={sharedMaterials.robotYellowTrim}>
              <cylinderGeometry args={[0.02, 0.02, 0.012, 8]} />
            </mesh>
            {[0, 1.57, 3.14, 4.71].map((ang, i) => (
              <mesh
                key={i}
                position={[Math.cos(ang) * 0.04, 0, Math.sin(ang) * 0.04]}
              >
                <boxGeometry args={[0.06, 0.004, 0.008]} />
                <meshBasicMaterial color="#FFFBEB" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
});
