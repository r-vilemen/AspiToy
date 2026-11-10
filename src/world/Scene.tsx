import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Lighting } from './Environment/Lighting';
import { WORLD_PALETTE } from './Environment/Materials';
import { House } from './House/House';
import { Robot } from './Robot/Robot';
import { FollowCamera } from './Camera/FollowCamera';

export function Scene() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#EFE7DA]">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [-4.6, 4.4, 5.6], fov: 42, near: 0.1, far: 45 }}
      >
        <color attach="background" args={[WORLD_PALETTE.sunlitBackdrop]} />
        <fog attach="fog" args={[WORLD_PALETTE.sunlitBackdrop, 14, 26]} />

        <Suspense fallback={null}>
          <Lighting />
          <House />
          <Robot />
          <FollowCamera />
        </Suspense>
      </Canvas>
    </div>
  );
}
