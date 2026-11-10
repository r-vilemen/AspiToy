import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { robotMotionBridge } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { clamp, damp } from '@/utils/math';

/**
 * Câmera em terceira pessoa estilo PS2 Toy Story (Perspectiva de Pequeno Brinquedo em Quarto Gigante):
 * - Modo 'follow': acompanha o deslocamento do AspiToy sem brigar com o OrbitControls (permite girar e dar zoom livremente)
 * - Modo 'overview': perspectiva de cima (top-down) enquadrando o quarto inteiro (10m x 8m) e liberando o controle do mouse após a transição
 * - Modo 'closeup': visão colada às costas do brinquedo (estilo plataforma 3D anos 2000)
 */
export function FollowCamera() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const lastPresetRef = useRef(cameraPreset);
  const transitionTimerRef = useRef(0.75);
  const isUserInteractingRef = useRef(false);
  const trackedRobotPosRef = useRef({
    x: robotMotionBridge.x,
    z: robotMotionBridge.z,
  });

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      isUserInteractingRef.current = true;
      transitionTimerRef.current = 0;
    };
    const handleEnd = () => {
      isUserInteractingRef.current = false;
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);
    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, []);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const controls = controlsRef.current;
    if (!controls) return;

    if (lastPresetRef.current !== cameraPreset) {
      lastPresetRef.current = cameraPreset;
      transitionTimerRef.current = 0.85;
      trackedRobotPosRef.current.x = robotMotionBridge.x;
      trackedRobotPosRef.current.z = robotMotionBridge.z;
    }

    if (transitionTimerRef.current > 0) {
      transitionTimerRef.current = Math.max(0, transitionTimerRef.current - delta);
    }

    if (cameraPreset === 'follow') {
      const nextRobotX = damp(
        trackedRobotPosRef.current.x,
        robotMotionBridge.x,
        6.0,
        delta
      );
      const nextRobotZ = damp(
        trackedRobotPosRef.current.z,
        robotMotionBridge.z,
        6.0,
        delta
      );
      const dx = nextRobotX - trackedRobotPosRef.current.x;
      const dz = nextRobotZ - trackedRobotPosRef.current.z;
      trackedRobotPosRef.current.x = nextRobotX;
      trackedRobotPosRef.current.z = nextRobotZ;

      if (transitionTimerRef.current > 0 && !isUserInteractingRef.current) {
        // Transição suave inicial ao entrar no modo Acompanhar
        controls.target.set(
          damp(controls.target.x, nextRobotX, 6.0, delta),
          damp(controls.target.y, 0.28, 6.0, delta),
          damp(controls.target.z, nextRobotZ, 6.0, delta)
        );
        const desiredCamX = clamp(
          nextRobotX - Math.sin(robotMotionBridge.rotationY) * 2.2,
          -4.4,
          4.4
        );
        const desiredCamZ = clamp(
          nextRobotZ - Math.cos(robotMotionBridge.rotationY) * 2.2,
          -3.4,
          3.4
        );
        state.camera.position.set(
          damp(state.camera.position.x, desiredCamX, 5.5, delta),
          damp(state.camera.position.y, 1.15, 5.5, delta),
          damp(state.camera.position.z, desiredCamZ, 5.5, delta)
        );
      } else {
        // Translada câmera e alvo exatamente pelo mesmo delta (preserva 100% da rotação/zoom do mouse!)
        controls.target.x += dx;
        controls.target.y = damp(controls.target.y, 0.28, 5.0, delta);
        controls.target.z += dz;
        state.camera.position.x += dx;
        state.camera.position.z += dz;
      }
    } else if (cameraPreset === 'closeup') {
      const nextRobotX = damp(
        trackedRobotPosRef.current.x,
        robotMotionBridge.x,
        7.0,
        delta
      );
      const nextRobotZ = damp(
        trackedRobotPosRef.current.z,
        robotMotionBridge.z,
        7.0,
        delta
      );
      const dx = nextRobotX - trackedRobotPosRef.current.x;
      const dz = nextRobotZ - trackedRobotPosRef.current.z;
      trackedRobotPosRef.current.x = nextRobotX;
      trackedRobotPosRef.current.z = nextRobotZ;

      if (!isUserInteractingRef.current) {
        const lookAheadX =
          nextRobotX + Math.sin(robotMotionBridge.rotationY) * 0.45;
        const lookAheadZ =
          nextRobotZ + Math.cos(robotMotionBridge.rotationY) * 0.45;

        controls.target.set(
          damp(controls.target.x, lookAheadX, 6.0, delta),
          damp(controls.target.y, 0.28, 6.0, delta),
          damp(controls.target.z, lookAheadZ, 6.0, delta)
        );

        const desiredCamX = clamp(
          nextRobotX - Math.sin(robotMotionBridge.rotationY) * 1.45,
          -4.5,
          4.5
        );
        const desiredCamZ = clamp(
          nextRobotZ - Math.cos(robotMotionBridge.rotationY) * 1.45,
          -3.5,
          3.5
        );
        state.camera.position.set(
          damp(state.camera.position.x, desiredCamX, 4.8, delta),
          damp(state.camera.position.y, 0.65, 4.8, delta),
          damp(state.camera.position.z, desiredCamZ, 4.8, delta)
        );
      } else {
        controls.target.x += dx;
        controls.target.z += dz;
        state.camera.position.x += dx;
        state.camera.position.z += dz;
      }
    } else {
      // Visão Geral ("overview"): posiciona a câmera no alto mostrando o quarto inteiro visto de cima
      // e libera o controle do mouse assim que a transição termina ou o usuário interage.
      if (transitionTimerRef.current > 0 && !isUserInteractingRef.current) {
        controls.target.set(
          damp(controls.target.x, 0, 6.5, delta),
          damp(controls.target.y, 0, 6.5, delta),
          damp(controls.target.z, 0, 6.5, delta)
        );
        state.camera.position.set(
          damp(state.camera.position.x, 0, 6.5, delta),
          damp(state.camera.position.y, 12.2, 6.5, delta),
          damp(state.camera.position.z, 0.25, 6.5, delta)
        );
      }
    }

    controls.update();

    // Evita que a câmera atravesse as paredes externas quando posicionada dentro da sala
    if (state.camera.position.y < 4.2) {
      state.camera.position.x = clamp(state.camera.position.x, -4.65, 4.65);
      state.camera.position.z = clamp(state.camera.position.z, -3.65, 3.65);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.85}
      zoomSpeed={0.95}
      panSpeed={0.85}
      minDistance={0.9}
      maxDistance={16.5}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  );
}
