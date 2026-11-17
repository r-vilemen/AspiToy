import { memo } from 'react';
import { useEnvironmentStore } from '@/store/environmentStore';
import { DustParticles } from './DustParticles';

/**
 * Iluminação Cinematográfica de Animação 3D com Ciclo Circadiano:
 * - 'day': Sol claro matinal com sombras nítidas e atmosfera arejada
 * - 'sunset': Golden hour dourado e acolhedor entrando pelas janelas
 * - 'night': Luar azulado nas janelas + luzes residenciais internas acesas (abajures, arandelas e pendentes)
 */
export const Lighting = memo(function Lighting() {
  const timeOfDay = useEnvironmentStore((s) => s.timeOfDay);

  const isNight = timeOfDay === 'night';
  const isDay = timeOfDay === 'day';

  // Cores dinâmicas de acordo com o ciclo dia/noite
  const ambientColor = isNight ? '#243048' : isDay ? '#FFF6E0' : '#FBE6C8';
  const ambientIntensity = isNight ? 0.32 : isDay ? 0.62 : 0.52;

  const hemiSky = isNight ? '#384860' : isDay ? '#BAE6FD' : '#FFF0CC';
  const hemiGround = isNight ? '#1E1B18' : isDay ? '#996B42' : '#7D4920';
  const hemiIntensity = isNight ? 0.42 : isDay ? 1.05 : 0.92;

  // Sol ou Luar direcional vindo da janela
  const sunColor = isNight ? '#60A5FA' : isDay ? '#FFFDF0' : '#FFF2C8';
  const sunIntensity = isNight ? 0.48 : isDay ? 2.6 : 2.25;

  // Feixes volumétricos
  const beamColor = isNight ? '#93C5FD' : isDay ? '#FFFEE5' : '#FFF5C8';
  const beamOpacity1 = isNight ? 0.04 : isDay ? 0.11 : 0.09;
  const beamOpacity2 = isNight ? 0.03 : isDay ? 0.08 : 0.065;

  return (
    <group name="cinematic-animation-lighting">
      {/* Luz ambiente adaptativa */}
      <ambientLight intensity={ambientIntensity} color={ambientColor} />

      {/* Luz hemisférica */}
      <hemisphereLight
        args={[hemiSky, hemiGround, hemiIntensity]}
        position={[0, 6.5, 0]}
      />

      {/* Luz direcional vindo da janela alta oeste (sombras suaves de alta resolução) */}
      <directionalLight
        castShadow
        position={[-6.2, 7.6, -2.4]}
        intensity={sunIntensity}
        color={sunColor}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0003}
        shadow-radius={2.5}
      />

      {/* Luz complementar constante da área de leitura do quarto */}
      <pointLight
        position={[2.6, 3.2, 1.2]}
        intensity={isNight ? 1.1 : 0.75}
        distance={13}
        decay={1.6}
        color={isNight ? '#FBBF24' : '#FFD9A0'}
      />

      {/* ======================================================== */}
      {/* LUZES RESIDENCIAIS INTERNAS ACESAS NO MODO NOTURNO       */}
      {/* ======================================================== */}
      {isNight && (
        <group name="night-interior-lights">
          {/* 1. Abajur quente do Quarto */}
          <pointLight
            position={[-1.4, 1.2, -1.8]}
            intensity={1.3}
            distance={7.5}
            decay={1.8}
            color="#F59E0B"
          />

          {/* 2. Arandela central do Corredor */}
          <pointLight
            position={[6.3, 2.4, 2.25]}
            intensity={1.2}
            distance={8.5}
            decay={1.8}
            color="#FBBF24"
          />

          {/* 3. Luminária e TV CRT da Sala de Estar */}
          <pointLight
            position={[12.6, 2.4, -0.4]}
            intensity={1.5}
            distance={10}
            decay={1.8}
            color="#FDE68A"
          />

          {/* 4. Pendentes da Cozinha sobre a ilha */}
          <pointLight
            position={[12.6, 2.6, 5.85]}
            intensity={1.3}
            distance={9}
            decay={1.8}
            color="#FEF3C7"
          />

          {/* 5. Luz suave do espelho do Banheiro */}
          <pointLight
            position={[7.8, 2.2, 11.0]}
            intensity={0.95}
            distance={7}
            decay={1.8}
            color="#BAE6FD"
          />
        </group>
      )}

      {/* Feixe volumétrico principal vindo da janela oeste */}
      <group position={[-3.5, 2.45, -1.25]} rotation={[0.1, 0, -0.46]}>
        <mesh>
          <cylinderGeometry args={[0.68, 1.65, 4.5, 18, 1, true]} />
          <meshBasicMaterial
            color={beamColor}
            transparent
            opacity={beamOpacity1}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Feixe volumétrico secundário vindo da janela norte (atrás da poltrona) */}
      <group position={[1.85, 2.35, -2.85]} rotation={[0.38, 0, 0.08]}>
        <mesh>
          <cylinderGeometry args={[0.45, 1.05, 3.8, 16, 1, true]} />
          <meshBasicMaterial
            color={beamColor}
            transparent
            opacity={beamOpacity2}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Poeira sutil flutuando nos feixes de luz */}
      <DustParticles />
    </group>
  );
});
