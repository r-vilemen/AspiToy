import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { robotMotionBridge } from '@/store/robotStore';
import { useCommandStore } from '@/store/commandStore';
import { clamp, damp } from '@/utils/math';
import { ALL_HOUSE_OBSTACLES } from '../House/HouseObstacles';

/**
 * Spring-Arm Camera Collision:
 * Previne que a câmera entre dentro de paredes, móveis altos, poltronas e sofás
 * encurtando suavemente a distância do braço quando há um obstáculo sólido entre o robô e a câmera.
 */
function computeSpringArmDistance(
  startX: number,
  startY: number,
  startZ: number,
  dirX: number,
  dirY: number,
  dirZ: number,
  maxDist: number
): number {
  let hitDist = maxDist;
  const camRadius = 0.22; // Margem protetora da esfera da câmera contra superfícies

  for (let i = 0; i < ALL_HOUSE_OBSTACLES.length; i++) {
    const obs = ALL_HOUSE_OBSTACLES[i];
    if (!obs.collidable) continue;

    const b = obs.bounds;
    const minX = b.minX - camRadius;
    const maxX = b.maxX + camRadius;
    const minZ = b.minZ - camRadius;
    const maxZ = b.maxZ + camRadius;
    const minY = -0.05;
    const maxY = (obs.height ?? 2.8) + camRadius;

    let tmin = 0;
    let tmax = maxDist;

    // Slab X
    if (Math.abs(dirX) < 1e-6) {
      if (startX < minX || startX > maxX) continue;
    } else {
      const invD = 1.0 / dirX;
      let t1 = (minX - startX) * invD;
      let t2 = (maxX - startX) * invD;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    // Slab Y
    if (Math.abs(dirY) < 1e-6) {
      if (startY < minY || startY > maxY) continue;
    } else {
      const invD = 1.0 / dirY;
      let t1 = (minY - startY) * invD;
      let t2 = (maxY - startY) * invD;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    // Slab Z
    if (Math.abs(dirZ) < 1e-6) {
      if (startZ < minZ || startZ > maxZ) continue;
    } else {
      const invD = 1.0 / dirZ;
      let t1 = (minZ - startZ) * invD;
      let t2 = (maxZ - startZ) * invD;
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; }
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }

    // Ponto de entrada válido
    if (tmin > 0.05 && tmin < hitDist) {
      hitDist = tmin;
    }
  }

  // Se houve colisão, para antes da superfície; mantém distância mínima de 0.65m para visibilidade
  if (hitDist < maxDist) {
    return Math.max(0.65, hitDist - 0.14);
  }
  return maxDist;
}

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
  const nearPlaneConfiguredRef = useRef(false);
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

    if (!nearPlaneConfiguredRef.current && state.camera) {
      state.camera.near = 0.05;
      state.camera.updateProjectionMatrix();
      nearPlaneConfiguredRef.current = true;
    }

    const robotY = robotMotionBridge.y ?? 0;
    const isFlying = robotMotionBridge.isFlying;

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

      const desiredTargetY = robotY + (isFlying ? 0.22 : 0.25);

      if (!isUserInteractingRef.current) {
        // Alvo 3D da câmera centrado no robô (acompanha perfeitamente a altitude do helicóptero!)
        const targetX = damp(controls.target.x, nextRobotX, 6.0, delta);
        const targetY = damp(controls.target.y, desiredTargetY, 6.0, delta);
        const targetZ = damp(controls.target.z, nextRobotZ, 6.0, delta);
        controls.target.set(targetX, targetY, targetZ);

        // Vetor padrão do braço da câmera para trás e para cima
        const boomDist = isFlying ? 2.4 : 2.25;
        const heightOffset = isFlying ? 1.05 : 0.92;

        const rawDx = -Math.sin(robotMotionBridge.rotationY) * boomDist;
        const rawDz = -Math.cos(robotMotionBridge.rotationY) * boomDist;
        const rawDy = heightOffset;

        const totalDist = Math.hypot(rawDx, rawDy, rawDz);
        const dirX = rawDx / totalDist;
        const dirY = rawDy / totalDist;
        const dirZ = rawDz / totalDist;

        // SpringArm: encurta o braço da câmera se houver parede, poltrona ou móvel alto atrás do robô
        const safeDist = computeSpringArmDistance(
          targetX,
          targetY,
          targetZ,
          dirX,
          dirY,
          dirZ,
          totalDist
        );

        const desiredCamX = clamp(targetX + dirX * safeDist, -4.6, 17.2);
        const desiredCamY = clamp(targetY + dirY * safeDist, 0.35, 12.0);
        const desiredCamZ = clamp(targetZ + dirZ * safeDist, -3.6, 13.1);

        state.camera.position.set(
          damp(state.camera.position.x, desiredCamX, 5.0, delta),
          damp(state.camera.position.y, desiredCamY, 5.0, delta),
          damp(state.camera.position.z, desiredCamZ, 5.0, delta)
        );
      } else {
        // Quando o usuário está interagindo com o mouse ou analógico, translada proporcionalmente mantendo o ângulo
        controls.target.x += dx;
        controls.target.y = damp(controls.target.y, desiredTargetY, 5.0, delta);
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

      const desiredTargetY = robotY + (isFlying ? 0.22 : 0.20);

      if (!isUserInteractingRef.current) {
        const lookAheadX =
          nextRobotX + Math.sin(robotMotionBridge.rotationY) * 0.45;
        const lookAheadZ =
          nextRobotZ + Math.cos(robotMotionBridge.rotationY) * 0.45;

        const targetX = damp(controls.target.x, lookAheadX, 6.0, delta);
        const targetY = damp(controls.target.y, desiredTargetY, 6.0, delta);
        const targetZ = damp(controls.target.z, lookAheadZ, 6.0, delta);
        controls.target.set(targetX, targetY, targetZ);

        const boomDist = 1.35;
        const heightOffset = isFlying ? 0.65 : 0.48;

        const rawDx = -Math.sin(robotMotionBridge.rotationY) * boomDist;
        const rawDz = -Math.cos(robotMotionBridge.rotationY) * boomDist;
        const rawDy = heightOffset;

        const totalDist = Math.hypot(rawDx, rawDy, rawDz);
        const dirX = rawDx / totalDist;
        const dirY = rawDy / totalDist;
        const dirZ = rawDz / totalDist;

        const safeDist = computeSpringArmDistance(
          targetX,
          targetY,
          targetZ,
          dirX,
          dirY,
          dirZ,
          totalDist
        );

        const desiredCamX = clamp(targetX + dirX * safeDist, -4.6, 17.2);
        const desiredCamY = clamp(targetY + dirY * safeDist, 0.25, 12.0);
        const desiredCamZ = clamp(targetZ + dirZ * safeDist, -3.6, 13.1);

        state.camera.position.set(
          damp(state.camera.position.x, desiredCamX, 5.5, delta),
          damp(state.camera.position.y, desiredCamY, 5.5, delta),
          damp(state.camera.position.z, desiredCamZ, 5.5, delta)
        );
      } else {
        controls.target.x += dx;
        controls.target.y = damp(controls.target.y, desiredTargetY, 5.0, delta);
        controls.target.z += dz;
        state.camera.position.x += dx;
        state.camera.position.z += dz;
      }
    } else {
      // Visão Geral ("overview"): posiciona a câmera no alto mostrando a residência inteira vista de cima
      // e libera o controle do mouse assim que a transição termina ou o usuário interage.
      if (transitionTimerRef.current > 0 && !isUserInteractingRef.current) {
        controls.target.set(
          damp(controls.target.x, 6.3, 6.5, delta),
          damp(controls.target.y, 0, 6.5, delta),
          damp(controls.target.z, 4.75, 6.5, delta)
        );
        state.camera.position.set(
          damp(state.camera.position.x, 6.3, 6.5, delta),
          damp(state.camera.position.y, 23.5, 6.5, delta),
          damp(state.camera.position.z, 5.5, 6.5, delta)
        );
      }
    }

    controls.update();
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
      keyPanSpeed={0}
      keys={{ LEFT: '', UP: '', RIGHT: '', BOTTOM: '' }}
      minDistance={1.35}
      maxDistance={36.0}
      minPolarAngle={0.02}
      maxPolarAngle={Math.PI / 2 - 0.04}
    />
  );
}
