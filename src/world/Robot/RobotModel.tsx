import { forwardRef } from 'react';
import { RoundedBox } from '@react-three/drei';
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
 * Modelo 3D expressivo do AspiToy:
 * - Chassi circular chanfrado em marfim acetinado
 * - Para-choque frontal articulado com compressão
 * - Rodas laterais funcionais com pneus de borracha texturizada
 * - Rodízio frontal estabilizador
 * - Torre LIDAR de navegação com anel de status pulsante
 * - Visor com olhos digitais dinâmicos (reagem a humor/estado operacional)
 * - Escovas laterais giratórias
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
  // Cor do LED indicador central
  const statusColor =
    state === 'CLEANING'
      ? WORLD_PALETTE.robotCoral
      : state === 'AVOIDING'
        ? WORLD_PALETTE.ledAmber
        : state === 'PAUSED'
          ? WORLD_PALETTE.ledAmber
          : state === 'RETURNING'
            ? WORLD_PALETTE.sensorCyan
            : state === 'COMPLETED'
              ? WORLD_PALETTE.ledEmerald
              : WORLD_PALETTE.ledEmerald;

  // Olhos digitais expressivos
  const eyeColor =
    state === 'AVOIDING'
      ? WORLD_PALETTE.ledAmber
      : state === 'CLEANING'
        ? '#38BDF8'
        : WORLD_PALETTE.sensorCyan;

  // Expressão dos olhos
  const eyeScaleY = expression === 'sleepy' ? 0.25 : expression === 'focused' ? 0.7 : 1.0;
  const eyeAngle = expression === 'alert' ? 0.25 : expression === 'curious' ? -0.15 : 0;

  return (
    <group ref={ref} name="aspitoy-model">
      {/* Corpo articulado com bob e inclinação de aceleração */}
      <group position={[0, 0.095 + bobY, 0]} rotation={[pitch, 0, roll]}>
        {/* ======================================================== */}
        {/* 1. CHASSI PRINCIPAL (Corpo arredondado chanfrado)        */}
        {/* ======================================================== */}
        <mesh castShadow receiveShadow material={sharedMaterials.robotShell}>
          <cylinderGeometry args={[0.27, 0.29, 0.13, 40]} />
        </mesh>

        {/* Tampa superior com aro de ventilação estético */}
        <mesh
          castShadow
          position={[0, 0.068, 0]}
          material={sharedMaterials.robotCoralTrim}
        >
          <cylinderGeometry args={[0.22, 0.25, 0.022, 40]} />
        </mesh>

        {/* Botão liga/desliga físico estilizado no topo */}
        <group position={[0, 0.082, 0.12]}>
          <mesh castShadow material={sharedMaterials.robotVisor}>
            <cylinderGeometry args={[0.028, 0.028, 0.012, 20]} />
          </mesh>
          <mesh position={[0, 0.007, 0]}>
            <ringGeometry args={[0.012, 0.018, 16]} />
            <meshStandardMaterial color={statusColor} emissive={statusColor} emissiveIntensity={1.5} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 2. PARA-CHOQUE FRONTAL (BUMPER ARTICULADO)              */}
        {/* ======================================================== */}
        <group position={[0, 0.005, 0.08 - bumperCompression]}>
          <mesh castShadow receiveShadow material={sharedMaterials.robotShell}>
            {/* Semicírculo frontal protetor */}
            <cylinderGeometry
              args={[0.295, 0.295, 0.115, 28, 1, false, -Math.PI * 0.45, Math.PI * 0.9]}
            />
          </mesh>
          {/* Fita de borracha protetora no meio do bumper */}
          <mesh position={[0, -0.01, 0.21]}>
            <boxGeometry args={[0.38, 0.03, 0.015]} />
            <meshStandardMaterial color="#1C1816" roughness={0.9} />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 3. TORRE DO SENSOR LIDAR / VISOR SUPERIOR                */}
        {/* ======================================================== */}
        <group position={[0, 0.082, -0.04]}>
          <mesh castShadow material={sharedMaterials.robotVisor}>
            <cylinderGeometry args={[0.075, 0.088, 0.044, 28]} />
          </mesh>
          {/* Fresta horizontal do scanner óptico 360 */}
          <mesh position={[0, 0.005, 0]}>
            <cylinderGeometry args={[0.079, 0.079, 0.015, 24]} />
            <meshStandardMaterial color="#0A0807" roughness={0.1} metalness={0.8} />
          </mesh>
          {/* Anel luminoso com halo */}
          <mesh position={[0, 0.023, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.042, 0.068, 28]} />
            <meshStandardMaterial
              color={statusColor}
              emissive={statusColor}
              emissiveIntensity={2.1}
            />
          </mesh>
        </group>

        {/* ======================================================== */}
        {/* 4. VISOR FRONTAL E OLHOS DIGITAIS EXPRESSIVOS            */}
        {/* ======================================================== */}
        <group position={[0, 0.018, 0.26]}>
          {/* Vidro protetor curvo do visor */}
          <RoundedBox
            args={[0.24, 0.075, 0.04]}
            radius={0.022}
            smoothness={3}
            material={sharedMaterials.robotVisor}
          />
          {/* Olho Esquerdo */}
          <group position={[-0.052, 0.003, 0.021]} rotation={[0, 0, -eyeAngle]} scale={[1, eyeScaleY, 1]}>
            <mesh>
              <capsuleGeometry args={[0.014, 0.016, 8, 14]} />
              <meshStandardMaterial
                color={eyeColor}
                emissive={eyeColor}
                emissiveIntensity={2.6}
              />
            </mesh>
          </group>
          {/* Olho Direito */}
          <group position={[0.052, 0.003, 0.021]} rotation={[0, 0, eyeAngle]} scale={[1, eyeScaleY, 1]}>
            <mesh>
              <capsuleGeometry args={[0.014, 0.016, 8, 14]} />
              <meshStandardMaterial
                color={eyeColor}
                emissive={eyeColor}
                emissiveIntensity={2.6}
              />
            </mesh>
          </group>
        </group>

        {/* ======================================================== */}
        {/* 5. RODAS LATERAIS FUNCIONAIS COM PNEUS DE BORRACHA       */}
        {/* ======================================================== */}
        {/* Roda Esquerda (X: -0.25) */}
        <group position={[-0.26, -0.045, 0]} rotation={[wheelSpin, 0, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.052, 0.052, 0.038, 20]} />
            <meshStandardMaterial color="#2B2623" roughness={0.88} />
          </mesh>
          {/* Calota com detalhe coral */}
          <mesh position={[-0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.028, 0.028, 0.008, 16]} />
            <meshStandardMaterial color={WORLD_PALETTE.robotCoral} roughness={0.4} />
          </mesh>
        </group>

        {/* Roda Direita (X: +0.25) */}
        <group position={[0.26, -0.045, 0]} rotation={[wheelSpin, 0, 0]}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.052, 0.052, 0.038, 20]} />
            <meshStandardMaterial color="#2B2623" roughness={0.88} />
          </mesh>
          {/* Calota com detalhe coral */}
          <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.028, 0.028, 0.008, 16]} />
            <meshStandardMaterial color={WORLD_PALETTE.robotCoral} roughness={0.4} />
          </mesh>
        </group>

        {/* Rodízio omnidirecional frontal central */}
        <mesh position={[0, -0.07, 0.18]} castShadow>
          <sphereGeometry args={[0.022, 16, 16]} />
          <meshStandardMaterial color="#4A443F" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* ======================================================== */}
        {/* 6. ESCOVAS LATERAIS ROTATIVAS                            */}
        {/* ======================================================== */}
        {/* Escova Esquerda */}
        <group position={[-0.18, -0.075, 0.19]} rotation={[0, -wheelSpin * 2.2, 0]}>
          <mesh material={sharedMaterials.furnitureWoodDark}>
            <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} />
          </mesh>
          {[0, 1.2, 2.4, 3.6, 4.8].map((ang, i) => (
            <mesh key={i} position={[Math.cos(ang) * 0.04, 0, Math.sin(ang) * 0.04]}>
              <boxGeometry args={[0.06, 0.003, 0.006]} />
              <meshStandardMaterial color="#F3EFE6" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Escova Direita */}
        <group position={[0.18, -0.075, 0.19]} rotation={[0, wheelSpin * 2.2, 0]}>
          <mesh material={sharedMaterials.furnitureWoodDark}>
            <cylinderGeometry args={[0.018, 0.018, 0.01, 12]} />
          </mesh>
          {[0, 1.2, 2.4, 3.6, 4.8].map((ang, i) => (
            <mesh key={i} position={[Math.cos(ang) * 0.04, 0, Math.sin(ang) * 0.04]}>
              <boxGeometry args={[0.06, 0.003, 0.006]} />
              <meshStandardMaterial color="#F3EFE6" roughness={0.6} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
});
