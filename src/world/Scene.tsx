import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Lighting } from './Environment/Lighting';
import { WORLD_PALETTE } from './Environment/Materials';
import { House } from './House/House';
import { Robot } from './Robot/Robot';
import { Cat } from './Cat/Cat';
import { WhiteCat } from './Cat/WhiteCat';
import { TuxedoCat } from './Cat/TuxedoCat';
import { FollowCamera } from './Camera/FollowCamera';
import { useEnvironmentStore } from '@/store/environmentStore';

export function Scene() {
  const timeOfDay = useEnvironmentStore((s) => s.timeOfDay);

  const isNight = timeOfDay === 'night';
  const isDay = timeOfDay === 'day';

  const bgColor = isNight ? '#141824' : isDay ? '#E6D3B8' : WORLD_PALETTE.sunlitBackdrop;
  const fogColor = isNight ? '#1C2333' : isDay ? '#F3DEBE' : WORLD_PALETTE.fogWarm;

  return (
    <div
      className={`relative h-full w-full overflow-hidden transition-colors duration-700 ${
        isNight ? 'bg-[#141824]' : isDay ? 'bg-[#E6D3B8]' : 'bg-[#D8B888]'
      }`}
    >
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [-0.35, 0.92, 2.15], fov: 50, near: 0.1, far: 45 }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[fogColor, 16, 34]} />

        <Suspense fallback={null}>
          <Lighting />
          <House />
          <Cat />
          <WhiteCat />
          <TuxedoCat />
          <Robot />
          <FollowCamera />
        </Suspense>
      </Canvas>
    </div>
  );
}
