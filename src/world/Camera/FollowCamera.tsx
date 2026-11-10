import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { robotMotionBridge } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { damp } from '@/utils/math';

/**
 * Câmera em terceira pessoa com amortecimento e 3 presets (Acompanhar, Visão Geral, Personagem).
 * Não atravessa o piso e acompanha a movimentação orgânica do AspiToy suavemente.
 */
export function FollowCamera() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const targetVecRef = useRef(new THREE.Vector3(-1.5, 0.22, -1.2));

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const controls = controlsRef.current;
    if (!controls) return;

    if (cameraPreset === 'follow' || cameraPreset === 'closeup') {
      // Ponto de foco suave no robô
      targetVecRef.current.set(
        damp(controls.target.x, robotMotionBridge.x, 4.5, delta),
        damp(controls.target.y, 0.22, 4.5, delta),
        damp(controls.target.z, robotMotionBridge.z, 4.5, delta)
      );
      controls.target.copy(targetVecRef.current);

      if (cameraPreset === 'closeup') {
        // Enquadramento de perto cinematográfico
        const desiredCamX =
          robotMotionBridge.x - Math.sin(robotMotionBridge.rotationY) * 2.2;
        const desiredCamZ =
          robotMotionBridge.z - Math.cos(robotMotionBridge.rotationY) * 2.2;
        state.camera.position.set(
          damp(state.camera.position.x, desiredCamX, 3.5, delta),
          damp(state.camera.position.y, 1.45, 3.5, delta),
          damp(state.camera.position.z, desiredCamZ, 3.5, delta)
        );
      }
    } else {
      // Visão geral arquitetônica da sala
      targetVecRef.current.set(
        damp(controls.target.x, 0, 3.5, delta),
        damp(controls.target.y, 0.25, 3.5, delta),
        damp(controls.target.z, -0.4, 3.5, delta)
      );
      controls.target.copy(targetVecRef.current);
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      minDistance={1.6}
      maxDistance={12.5}
      minPolarAngle={0.28}
      maxPolarAngle={Math.PI / 2 - 0.06}
    />
  );
}
