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

export function Scene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#D8B888]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [-0.35, 0.92, 2.15], fov: 50, near: 0.1, far: 45 }}
      >
        <color attach="background" args={[WORLD_PALETTE.sunlitBackdrop]} />
        <fog attach="fog" args={[WORLD_PALETTE.fogWarm, 16, 34]} />

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
