import { memo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEnvironmentStore } from '@/store/environmentStore';
import type { TimeOfDay } from '@/types/environment';
import { DustParticles } from './DustParticles';

interface LightingPreset {
  ambientColor: string;
  ambientIntensity: number;
  hemiSky: string;
  hemiGround: string;
  hemiIntensity: number;
  sunColor: string;
  sunIntensity: number;
  sunPosition: [number, number, number];
  readingLampColor: string;
  readingLampIntensity: number;
  beamColor: string;
  beamOpacity1: number;
  beamOpacity2: number;
  interiorLightsFactor: number;
  fogColor: string;
  bgColor: string;
}

const LIGHTING_PRESETS: Record<TimeOfDay, LightingPreset> = {
  day: {
    ambientColor: '#FFF6E6',
    ambientIntensity: 0.62,
    hemiSky: '#BAE6FD',
    hemiGround: '#8B6338',
    hemiIntensity: 1.0,
    sunColor: '#FFFDF2',
    sunIntensity: 2.5,
    sunPosition: [-6.4, 7.5, -2.2],
    readingLampColor: '#FFD9A0',
    readingLampIntensity: 0.75,
    beamColor: '#FFFEE5',
    beamOpacity1: 0.10,
    beamOpacity2: 0.075,
    interiorLightsFactor: 0.0,
    fogColor: '#F3DFBE',
    bgColor: '#E6D3B8',
  },
  sunset: {
    ambientColor: '#FDE8CE',
    ambientIntensity: 0.54,
    hemiSky: '#FED7AA',
    hemiGround: '#7C441A',
    hemiIntensity: 0.88,
    sunColor: '#FFBA75',
    sunIntensity: 2.15,
    sunPosition: [-7.0, 6.2, -2.0], // Sol ligeiramente mais baixo projetando luz dourada aconchegante
    readingLampColor: '#FFB86C',
    readingLampIntensity: 0.85,
    beamColor: '#FFD085',
    beamOpacity1: 0.085,
    beamOpacity2: 0.06,
    interiorLightsFactor: 0.35, // Ao entardecer, abajures e arandelas acendem suavemente num brilho dourado
    fogColor: '#E9C8A0',
    bgColor: '#D8B888',
  },
  night: {
    ambientColor: '#28344C',
    ambientIntensity: 0.35,
    hemiSky: '#3E4D68',
    hemiGround: '#1E1B18',
    hemiIntensity: 0.45,
    sunColor: '#93C5FD', // Luar azul suave e fresco pelas janelas
    sunIntensity: 0.52,
    sunPosition: [-6.0, 7.8, -2.4], // Luar alto suave através das janelas
    readingLampColor: '#FBBF24',
    readingLampIntensity: 1.15,
    beamColor: '#93C5FD',
    beamOpacity1: 0.04,
    beamOpacity2: 0.03,
    interiorLightsFactor: 1.0, // Luzes residenciais plenas
    fogColor: '#1D2435',
    bgColor: '#141824',
  },
};

const INTERIOR_LIGHT_CONFIGS = [
  { id: 'lamp-bedroom', position: [-1.4, 1.2, -1.8] as const, color: '#F59E0B', maxIntensity: 1.3, distance: 7.5, decay: 1.8 },
  { id: 'sconce-hallway', position: [6.3, 2.4, 2.25] as const, color: '#FBBF24', maxIntensity: 1.2, distance: 8.5, decay: 1.8 },
  { id: 'lamp-living', position: [12.6, 2.4, -0.4] as const, color: '#FDE68A', maxIntensity: 1.5, distance: 10, decay: 1.8 },
  { id: 'pendant-kitchen', position: [12.6, 2.6, 5.85] as const, color: '#FEF3C7', maxIntensity: 1.3, distance: 9, decay: 1.8 },
  { id: 'mirror-bathroom', position: [7.8, 2.2, 11.0] as const, color: '#BAE6FD', maxIntensity: 0.95, distance: 7, decay: 1.8 },
];

// Instâncias temporárias para interpolação sem alocação de memória por frame
const scratchAmbient = new THREE.Color();
const scratchHemiSky = new THREE.Color();
const scratchHemiGround = new THREE.Color();
const scratchSun = new THREE.Color();
const scratchReading = new THREE.Color();
const scratchBeam = new THREE.Color();
const scratchBg = new THREE.Color();
const scratchFog = new THREE.Color();

/**
 * Iluminação Cinematográfica de Animação 3D com Ciclo Circadiano Suave:
 * Realiza interpolação orgânica e contínua (damp/lerp a 60 FPS) entre Manhã, Tarde e Noite,
 * eliminando transições bruscas e preservando alta performance sem disparar re-renderizações React.
 */
export const Lighting = memo(function Lighting() {
  const { scene } = useThree();

  const ambientRef = useRef<THREE.AmbientLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const sunRef = useRef<THREE.DirectionalLight>(null);
  const readingLampRef = useRef<THREE.PointLight>(null);
  const beamMat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const beamMat2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const interiorLightsRef = useRef<(THREE.PointLight | null)[]>([]);

  // Interpolação suave em useFrame (60 FPS, sem re-renderizações React e sem recompilação de shaders)
  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const currentTime = useEnvironmentStore.getState().timeOfDay;
    const preset = LIGHTING_PRESETS[currentTime] ?? LIGHTING_PRESETS.sunset;

    // Fator de suavização cinematográfico (transição orgânica e imperceptível de 5 a 6 segundos)
    const smoothRate = 0.65;
    const colorAlpha = 1 - Math.exp(-smoothRate * delta);

    // 1. Luz ambiente
    if (ambientRef.current) {
      ambientRef.current.color.lerp(scratchAmbient.set(preset.ambientColor), colorAlpha);
      ambientRef.current.intensity = THREE.MathUtils.damp(
        ambientRef.current.intensity,
        preset.ambientIntensity,
        smoothRate,
        delta
      );
    }

    // 2. Luz hemisférica (céu e chão)
    if (hemiRef.current) {
      hemiRef.current.color.lerp(scratchHemiSky.set(preset.hemiSky), colorAlpha);
      hemiRef.current.groundColor.lerp(scratchHemiGround.set(preset.hemiGround), colorAlpha);
      hemiRef.current.intensity = THREE.MathUtils.damp(
        hemiRef.current.intensity,
        preset.hemiIntensity,
        smoothRate,
        delta
      );
    }

    // 3. Sol / Lua direcional com sombras suaves estáveis
    if (sunRef.current) {
      sunRef.current.color.lerp(scratchSun.set(preset.sunColor), colorAlpha);
      sunRef.current.intensity = THREE.MathUtils.damp(
        sunRef.current.intensity,
        preset.sunIntensity,
        smoothRate,
        delta
      );
      sunRef.current.position.x = THREE.MathUtils.damp(
        sunRef.current.position.x,
        preset.sunPosition[0],
        smoothRate,
        delta
      );
      sunRef.current.position.y = THREE.MathUtils.damp(
        sunRef.current.position.y,
        preset.sunPosition[1],
        smoothRate,
        delta
      );
      sunRef.current.position.z = THREE.MathUtils.damp(
        sunRef.current.position.z,
        preset.sunPosition[2],
        smoothRate,
        delta
      );
    }

    // 4. Luz de leitura do quarto
    if (readingLampRef.current) {
      readingLampRef.current.color.lerp(scratchReading.set(preset.readingLampColor), colorAlpha);
      readingLampRef.current.intensity = THREE.MathUtils.damp(
        readingLampRef.current.intensity,
        preset.readingLampIntensity,
        smoothRate,
        delta
      );
    }

    // 5. Feixes volumétricos de luz solar / luar
    if (beamMat1Ref.current && beamMat2Ref.current) {
      beamMat1Ref.current.color.lerp(scratchBeam.set(preset.beamColor), colorAlpha);
      beamMat2Ref.current.color.copy(beamMat1Ref.current.color);

      beamMat1Ref.current.opacity = THREE.MathUtils.damp(
        beamMat1Ref.current.opacity,
        preset.beamOpacity1,
        smoothRate,
        delta
      );
      beamMat2Ref.current.opacity = THREE.MathUtils.damp(
        beamMat2Ref.current.opacity,
        preset.beamOpacity2,
        smoothRate,
        delta
      );
    }

    // 6. Luzes residenciais internas (fade contínuo de intensidade - sem ligar/desligar visible)
    const interiorFactor = preset.interiorLightsFactor;
    INTERIOR_LIGHT_CONFIGS.forEach((cfg, idx) => {
      const light = interiorLightsRef.current[idx];
      if (!light) return;

      const targetIntensity = cfg.maxIntensity * interiorFactor;
      light.intensity = THREE.MathUtils.damp(
        light.intensity,
        targetIntensity,
        smoothRate,
        delta
      );
    });

    // 7. Background da cena 3D e Neblina (Fog)
    if (scene.background && scene.background instanceof THREE.Color) {
      scene.background.lerp(scratchBg.set(preset.bgColor), colorAlpha);
    }
    if (scene.fog && 'color' in scene.fog) {
      scene.fog.color.lerp(scratchFog.set(preset.fogColor), colorAlpha);
    }
  });

  const initialPresetRef = useRef(
    LIGHTING_PRESETS[useEnvironmentStore.getState().timeOfDay] ?? LIGHTING_PRESETS.sunset
  );
  const initialPreset = initialPresetRef.current;

  return (
    <group name="cinematic-animation-lighting">
      {/* Luz ambiente adaptativa */}
      <ambientLight
        ref={ambientRef}
        intensity={initialPreset.ambientIntensity}
        color={initialPreset.ambientColor}
      />

      {/* Luz hemisférica */}
      <hemisphereLight
        ref={hemiRef}
        args={[initialPreset.hemiSky, initialPreset.hemiGround, initialPreset.hemiIntensity]}
        position={[0, 6.5, 0]}
      />

      {/* Luz direcional vindo da janela alta oeste (sombras suaves e eficientes) */}
      <directionalLight
        ref={sunRef}
        castShadow
        position={initialPreset.sunPosition}
        intensity={initialPreset.sunIntensity}
        color={initialPreset.sunColor}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={24}
        shadow-camera-left={-6.5}
        shadow-camera-right={6.5}
        shadow-camera-top={6.5}
        shadow-camera-bottom={-6.5}
        shadow-bias={-0.0003}
        shadow-radius={2.0}
      />

      {/* Luz complementar constante da área de leitura do quarto */}
      <pointLight
        ref={readingLampRef}
        position={[2.6, 3.2, 1.2]}
        intensity={initialPreset.readingLampIntensity}
        distance={13}
        decay={1.6}
        color={initialPreset.readingLampColor}
      />

      {/* ======================================================== */}
      {/* LUZES RESIDENCIAIS INTERNAS PERMANENTES COM FADE SUAVE    */}
      {/* ======================================================== */}
      <group name="interior-residential-lights">
        {INTERIOR_LIGHT_CONFIGS.map((cfg, idx) => (
          <pointLight
            key={cfg.id}
            ref={(el) => {
              interiorLightsRef.current[idx] = el;
            }}
            position={cfg.position}
            intensity={cfg.maxIntensity * initialPreset.interiorLightsFactor}
            distance={cfg.distance}
            decay={cfg.decay}
            color={cfg.color}
            visible={true}
          />
        ))}
      </group>

      {/* Feixe volumétrico principal vindo da janela oeste */}
      <group position={[-3.5, 2.45, -1.25]} rotation={[0.1, 0, -0.46]}>
        <mesh>
          <cylinderGeometry args={[0.68, 1.65, 4.5, 18, 1, true]} />
          <meshBasicMaterial
            ref={beamMat1Ref}
            color={initialPreset.beamColor}
            transparent
            opacity={initialPreset.beamOpacity1}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Feixe volumétrico secundário vindo da janela norte (atrás da poltrona) */}
      <group position={[1.85, 2.35, -2.85]} rotation={[0.38, 0, 0.08]}>
        <mesh>
          <cylinderGeometry args={[0.45, 1.05, 3.8, 16, 1, true]} />
          <meshBasicMaterial
            ref={beamMat2Ref}
            color={initialPreset.beamColor}
            transparent
            opacity={initialPreset.beamOpacity2}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Poeira sutil flutuando nos feixes de luz */}
      <DustParticles />
    </group>
  );
});
