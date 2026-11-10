import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { robotMotionBridge } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { clamp, damp } from '@/utils/math';

/**
 * Câmera em terceira pessoa estilo PS2 Toy Story (Perspectiva de Pequeno Brinquedo em Quarto Gigante):
 * - Modo 'follow': câmera baixa acompanhando o AspiToy pelo chão, valorizando a escala gigante dos móveis
 * - Modo 'closeup': visão colada às costas do brinquedo (estilo plataforma 3D anos 2000)
 * - Modo 'overview': câmera elevada panorâmica do quarto completo
 */
export function FollowCamera() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const targetVecRef = useRef(new THREE.Vector3(-0.3, 0.36, -0.8));

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const controls = controlsRef.current;
    if (!controls) return;

    if (cameraPreset === 'follow') {
      // Olha levemente à frente e acima do robô para enquadrar os móveis gigantes
      const lookAheadX =
        robotMotionBridge.x + Math.sin(robotMotionBridge.rotationY) * 0.65;
      const lookAheadZ =
        robotMotionBridge.z + Math.cos(robotMotionBridge.rotationY) * 0.65;

      targetVecRef.current.set(
        damp(controls.target.x, lookAheadX, 4.5, delta),
        damp(controls.target.y, 0.38, 4.5, delta),
        damp(controls.target.z, lookAheadZ, 4.5, delta)
      );
      controls.target.copy(targetVecRef.current);
    } else if (cameraPreset === 'closeup') {
      // Câmera baixíssima atrás do brinquedo (Toy Perspective PS2)
      const lookAheadX =
        robotMotionBridge.x + Math.sin(robotMotionBridge.rotationY) * 0.9;
      const lookAheadZ =
        robotMotionBridge.z + Math.cos(robotMotionBridge.rotationY) * 0.9;

      targetVecRef.current.set(
        damp(controls.target.x, lookAheadX, 5.0, delta),
        damp(controls.target.y, 0.35, 5.0, delta),
        damp(controls.target.z, lookAheadZ, 5.0, delta)
      );
      controls.target.copy(targetVecRef.current);

      const desiredCamX = clamp(
        robotMotionBridge.x - Math.sin(robotMotionBridge.rotationY) * 1.45,
        -4.5,
        4.5
      );
      const desiredCamZ = clamp(
        robotMotionBridge.z - Math.cos(robotMotionBridge.rotationY) * 1.45,
        -3.5,
        3.5
      );
      state.camera.position.set(
        damp(state.camera.position.x, desiredCamX, 3.8, delta),
        damp(state.camera.position.y, 0.62, 3.8, delta),
        damp(state.camera.position.z, desiredCamZ, 3.8, delta)
      );
    } else {
      // Visão geral do quarto gigante
      targetVecRef.current.set(
        damp(controls.target.x, -0.2, 3.5, delta),
        damp(controls.target.y, 0.55, 3.5, delta),
        damp(controls.target.z, -0.6, 3.5, delta)
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
      dampingFactor={0.07}
      minDistance={1.1}
      maxDistance={11.0}
      minPolarAngle={0.22}
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  );
}
