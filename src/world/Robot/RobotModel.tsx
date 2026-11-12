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
 * Protagonista AspiToy — Design Industrial de Personagem de Animação 3D (Seção 6 da Direção de Arte):
 * - Corpo circular suavemente esculpido (36 segmentos) com cúpula superior boleada
 * - Para-choque frontal articulado com faixa de amortecimento emborrachada
 * - Compartimento traseiro translúcido de coleta de pó com filtro visível
 * - Torre óptica de sensores ToF/LiDAR com anel luminoso de estado
 * - Visor OLED curvo integrado ao chassi comunicando 7 estados emocionais distintos
 * - Rodas emborrachadas integradas e escovas laterais giratórias funcionais
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
          ? '#F97316'
          : state === 'COMPLETED'
            ? WORLD_PALETTE.ledEmerald
            : WORLD_PALETTE.sensorCyan;

  const eyeColor =
    expression === 'alert'
      ? WORLD_PALETTE.ledAmber
      : expression === 'worried'
        ? '#FB923C'
        : expression === 'happy'
          ? '#4ADE80'
          : expression === 'focused'
            ? '#38BDF8'
            : WORLD_PALETTE.sensorCyan;

  // Parametrização das 7 expressões faciais integradas ao visor industrial
  const eyeScaleY =
    expression === 'sleepy'
      ? 0.22
      : expression === 'focused'
        ? 0.68
        : expression === 'happy'
          ? 0.55
          : expression === 'alert'
            ? 1.22
            : 1.0;

  const eyeScaleX =
    expression === 'alert' ? 1.15 : expression === 'curious' ? 1.08 : 1.0;

  const browTilt =
    expression === 'focused'
      ? 0.24
      : expression === 'worried'
        ? -0.28
        : expression === 'alert'
          ? -0.18
          : expression === 'curious'
            ? 0.14
            : 0;

  const leftEyeScaleY =
    expression === 'curious' ? eyeScaleY * 1.18 : eyeScaleY;
  const rightEyeScaleY =
    expression === 'curious' ? eyeScaleY * 0.82 : eyeScaleY;

  return (
    <group ref={ref} name="aspitoy-protagonist-model">
      {/* ======================================================== */}
      {/* SOMBRA DE CONTATO SUAVE EM DUAS CAMADAS                  */}
      {/* ======================================================== */}
      <group position={[0, 0.006, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.32, 32]} />
          <meshBasicMaterial
            color="#1B0C02"
            transparent
            opacity={0.44}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.23, 28]} />
          <meshBasicMaterial
            color="#0F0601"
            transparent
            opacity={0.38}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Corpo articulado com física de suspensão (pitch, roll, bobY) */}
      <group position={[0, 0.098 + bobY, 0]} rotation={[pitch, 0, roll]}>
        {/* 1. CHASSI PRINCIPAL ARREDONDADO DE ACABAMENTO INDUSTRIAL */}
        <mesh castShadow receiveShadow material={sharedMaterials.robotShell}>
          <cylinderGeometry args={[0.268, 0.284, 0.118, 36]} />
        </mesh>

        {/* Cúpula superior suavemente boleada */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.058, 0]}
          scale={[1, 0.22, 1]}
          material={sharedMaterials.robotShell}
        >
          <sphereGeometry args={[0.266, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>

        {/* Anel de acabamento superior coral acetinado */}
        <mesh
          castShadow
          position={[0, 0.064, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          material={sharedMaterials.robotCoralTrim}
        >
          <torusGeometry args={[0.22, 0.016, 14, 36]} />
        </mesh>

        {/* Painel de controle superior com botão de acionamento iluminado */}
        <group position={[0, 0.088, 0.095]}>
          <mesh castShadow material={sharedMaterials.robotYellowTrim}>
            <cylinderGeometry args={[0.038, 0.044, 0.016, 24]} />
          </mesh>
          <mesh position={[0, 0.0095, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.022, 0.03, 20]} />
            <meshBasicMaterial color={statusColor} />
          </mesh>
        </group>

        {/* 2. PARA-CHOQUE FRONTAL COM AMORTECIMENTO E BORRACHA PROTETORA */}
        <group position={[0, -0.004, 0.012 - bumperCompression]}>
          {/* Carenagem frontal azul do amortecedor */}
          <mesh castShadow material={sharedMaterials.robotBlueTrim}>
            <cylinderGeometry
              args={[
                0.292,
                0.292,
                0.092,
                32,
                1,
                false,
                -Math.PI * 0.44,
                Math.PI * 0.88,
              ]}
            />
          </mesh>
          {/* Faixa emborrachada de impacto na parte inferior do para-choque */}
          <mesh
            position={[0, -0.026, 0]}
            material={sharedMaterials.robotRubberBumper}
          >
            <cylinderGeometry
              args={[
                0.297,
                0.297,
                0.028,
                32,
                1,
                false,
                -Math.PI * 0.45,
                Math.PI * 0.9,
              ]}
            />
          </mesh>
          {/* Sensores infravermelhos laterais embutidos no para-choque */}
          {[-0.21, 0.21].map((sx, idx) => (
            <mesh
              key={idx}
              position={[sx, 0.01, 0.2]}
              rotation={[0, (idx === 0 ? -1 : 1) * 0.65, 0]}
              material={sharedMaterials.metalChrome}
            >
              <sphereGeometry args={[0.014, 12, 12]} />
            </mesh>
          ))}
        </group>

        {/* 3. COMPARTIMENTO TRASEIRO TRANSLÚCIDO DE LIMPEZA (DUSTBIN) */}
        <group position={[0, 0.012, -0.175]}>
          <RoundedBox
            castShadow
            args={[0.24, 0.086, 0.14]}
            radius={0.025}
            smoothness={3}
            material={sharedMaterials.robotDustBin}
          />
          {/* Filtro HEPA amarelo visível dentro do compartimento translúcido */}
          <RoundedBox
            args={[0.14, 0.048, 0.06]}
            radius={0.01}
            smoothness={2}
            position={[0, 0, 0.01]}
            material={sharedMaterials.robotYellowTrim}
          />
          {/* Alça metálica de liberação do reservatório */}
          <RoundedBox
            args={[0.09, 0.016, 0.02]}
            radius={0.005}
            smoothness={2}
            position={[0, 0.046, -0.05]}
            material={sharedMaterials.metalChrome}
          />
          {/* Aletas laterais de exaustão de ar */}
          {[-0.08, -0.04, 0.04, 0.08].map((vx, i) => (
            <mesh
              key={i}
              position={[vx, -0.01, -0.072]}
              material={sharedMaterials.robotRubberBumper}
            >
              <boxGeometry args={[0.018, 0.042, 0.008]} />
            </mesh>
          ))}
        </group>

        {/* 4. TORRE DE SENSORES LIDAR / TOF E INDICADOR LUMINOSO */}
        <group position={[0, 0.088, -0.035]}>
          {/* Base cônica da torre de navegação */}
          <mesh castShadow material={sharedMaterials.robotBlueTrim}>
            <cylinderGeometry args={[0.068, 0.086, 0.044, 28]} />
          </mesh>
          {/* Disco óptico giratório cromado */}
          <mesh
            position={[0, 0.026, 0]}
            rotation={[0, wheelSpin * 1.5, 0]}
            material={sharedMaterials.metalChrome}
          >
            <cylinderGeometry args={[0.058, 0.058, 0.016, 24]} />
          </mesh>
          {/* Capô protetor superior da torre com anel de status LED */}
          <mesh
            castShadow
            position={[0, 0.04, 0]}
            material={sharedMaterials.robotCoralTrim}
          >
            <cylinderGeometry args={[0.062, 0.066, 0.014, 28]} />
          </mesh>
          <mesh position={[0, 0.049, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.038, 0.054, 24]} />
            <meshBasicMaterial color={statusColor} />
          </mesh>
        </group>

        {/* 5. VISOR CURVO OLED INTEGRADO E FACE EXPRESSIVA (7 ESTADOS) */}
        <group position={[0, 0.018, 0.258]}>
          {/* Moldura externa do visor integrada ao chassi */}
          <RoundedBox
            args={[0.246, 0.086, 0.048]}
            radius={0.022}
            smoothness={4}
            material={sharedMaterials.robotRubberBumper}
          />
          {/* Tela vítrea escura de alto brilho (clearcoat) */}
          <RoundedBox
            args={[0.228, 0.072, 0.044]}
            radius={0.018}
            smoothness={4}
            position={[0, 0, 0.005]}
            material={sharedMaterials.robotVisor}
          />

          {/* Olho Esquerdo Expressivo */}
          <group
            position={[-0.054, 0.002, 0.028]}
            scale={[eyeScaleX, leftEyeScaleY, 1]}
          >
            <RoundedBox args={[0.04, 0.044, 0.006]} radius={0.012} smoothness={3}>
              <meshBasicMaterial color={eyeColor} />
            </RoundedBox>
            {/* Brilho especular vivo na pupila */}
            {expression !== 'sleepy' && (
              <mesh position={[0.009, 0.01, 0.004]}>
                <circleGeometry args={[0.006, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            )}
            {/* Sobrancelha luminosa expressiva */}
            {browTilt !== 0 && (
              <mesh
                position={[0, 0.027, 0.002]}
                rotation={[0, 0, -browTilt]}
              >
                <boxGeometry args={[0.046, 0.007, 0.004]} />
                <meshBasicMaterial color={eyeColor} />
              </mesh>
            )}
          </group>

          {/* Olho Direito Expressivo */}
          <group
            position={[0.054, 0.002, 0.028]}
            scale={[eyeScaleX, rightEyeScaleY, 1]}
          >
            <RoundedBox args={[0.04, 0.044, 0.006]} radius={0.012} smoothness={3}>
              <meshBasicMaterial color={eyeColor} />
            </RoundedBox>
            {expression !== 'sleepy' && (
              <mesh position={[0.009, 0.01, 0.004]}>
                <circleGeometry args={[0.006, 12]} />
                <meshBasicMaterial color="#FFFFFF" />
              </mesh>
            )}
            {browTilt !== 0 && (
              <mesh
                position={[0, 0.027, 0.002]}
                rotation={[0, 0, browTilt]}
              >
                <boxGeometry args={[0.046, 0.007, 0.004]} />
                <meshBasicMaterial color={eyeColor} />
              </mesh>
            )}
          </group>

          {/* Indicador central de boca/status no visor conforme a emoção */}
          {expression === 'happy' && (
            <mesh position={[0, -0.018, 0.029]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.018, 0.004, 8, 16, Math.PI]} />
              <meshBasicMaterial color="#4ADE80" />
            </mesh>
          )}
          {expression === 'alert' && (
            <mesh position={[0, -0.018, 0.029]}>
              <ringGeometry args={[0.006, 0.011, 16]} />
              <meshBasicMaterial color={WORLD_PALETTE.ledAmber} />
            </mesh>
          )}
          {expression === 'worried' && (
            <mesh position={[0, -0.02, 0.029]}>
              <torusGeometry args={[0.015, 0.0035, 8, 16, Math.PI]} />
              <meshBasicMaterial color="#FB923C" />
            </mesh>
          )}
        </group>

        {/* 6. RODAS INTEGRADA COM BANDA DE RODAGEM E CALOTAS */}
        {[-0.258, 0.258].map((wx, idx) => (
          <group key={idx} position={[wx, -0.042, 0]} rotation={[wheelSpin, 0, 0]}>
            <mesh
              castShadow
              rotation={[0, 0, Math.PI / 2]}
              material={sharedMaterials.robotRubberBumper}
            >
              <cylinderGeometry args={[0.056, 0.056, 0.044, 24]} />
            </mesh>
            {/* Calota amarela industrial */}
            <mesh
              position={[idx === 0 ? -0.023 : 0.023, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={sharedMaterials.robotYellowTrim}
            >
              <cylinderGeometry args={[0.034, 0.034, 0.008, 18]} />
            </mesh>
            {/* Parafuso central cromado */}
            <mesh
              position={[idx === 0 ? -0.028 : 0.028, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
              material={sharedMaterials.metalChrome}
            >
              <cylinderGeometry args={[0.01, 0.01, 0.006, 12]} />
            </mesh>
          </group>
        ))}

        {/* 7. ESCOVAS LATERAIS FUNCIONAIS DE 3 PONTAS */}
        {[-0.18, 0.18].map((bx, idx) => (
          <group
            key={idx}
            position={[bx, -0.074, 0.185]}
            rotation={[0, (idx === 0 ? -1 : 1) * wheelSpin * 2.4, 0]}
          >
            <mesh material={sharedMaterials.robotYellowTrim}>
              <cylinderGeometry args={[0.022, 0.022, 0.014, 14]} />
            </mesh>
            {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((ang, i) => (
              <mesh
                key={i}
                position={[Math.cos(ang) * 0.044, -0.002, Math.sin(ang) * 0.044]}
                rotation={[0, -ang, 0]}
              >
                <boxGeometry args={[0.068, 0.003, 0.007]} />
                <meshBasicMaterial color="#FFFBEB" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
});
