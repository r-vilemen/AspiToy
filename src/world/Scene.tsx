import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Lighting } from './Environment/Lighting';
import { sharedMaterials, WORLD_PALETTE } from './Environment/Materials';
import { House } from './House/House';
import { robotMotionBridge, useRobotStore } from '@/store/robotStore';
import { useEnvironmentStore } from '@/store/environmentStore';
import { useCommandStore } from '@/store/commandStore';
import { clamp, damp, dampAngle, distance2D } from '@/utils/math';

const WAYPOINTS = [
  { x: -1.8, z: -1.6 },
  { x: 0.0, z: -1.3 },
  { x: 2.3, z: -1.2 },
  { x: 2.6, z: 0.9 },
  { x: 0.2, z: 1.1 },
  { x: -2.2, z: 0.8 },
];

function InitialRobotActor() {
  const groupRef = useRef<THREE.Group>(null);
  const bodyTiltRef = useRef<THREE.Group>(null);
  const waypointIndexRef = useRef(0);
  const syncAccumulatorRef = useRef(0);

  const state = useRobotStore((s) => s.state);

  const ledColor =
    state === 'CLEANING'
      ? WORLD_PALETTE.robotCoral
      : state === 'PAUSED'
        ? WORLD_PALETTE.ledAmber
        : state === 'RETURNING'
          ? WORLD_PALETTE.sensorCyan
          : WORLD_PALETTE.ledEmerald;

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const robotState = useRobotStore.getState();
    const envState = useEnvironmentStore.getState();
    const cmdState = useCommandStore.getState();

    let targetPoint: { x: number; z: number } | null = null;
    let desiredSpeed = 0;

    if (robotState.state === 'CLEANING' || robotState.state === 'EXPLORING') {
      targetPoint =
        robotState.targetPosition ??
        WAYPOINTS[waypointIndexRef.current % WAYPOINTS.length];
      desiredSpeed = robotState.speed;
    } else if (robotState.state === 'RETURNING') {
      targetPoint = envState.dockPosition;
      desiredSpeed = robotState.speed * 1.05;
    }

    if (targetPoint && desiredSpeed > 0) {
      const currentPos = { x: robotMotionBridge.x, z: robotMotionBridge.z };
      const dist = distance2D(currentPos, targetPoint);

      if (dist < 0.22) {
        if (robotState.state === 'RETURNING') {
          robotMotionBridge.currentSpeed = 0;
          robotState.setOperationalState(
            'RECHARGING',
            'Acoplado na estação de recarga'
          );
          cmdState.pushNotification(
            'Acoplamento concluído',
            'AspiToy conectado à base e recarregando bateria.',
            'success'
          );
        } else {
          if (robotState.targetPosition) {
            robotState.setTargetPosition(null);
          }
          waypointIndexRef.current =
            (waypointIndexRef.current + 1) % WAYPOINTS.length;
        }
      } else {
        const desiredAngle = Math.atan2(
          targetPoint.x - currentPos.x,
          targetPoint.z - currentPos.z
        );
        robotMotionBridge.targetRotationY = desiredAngle;
        robotMotionBridge.rotationY = dampAngle(
          robotMotionBridge.rotationY,
          desiredAngle,
          7.5,
          delta
        );
        robotMotionBridge.currentSpeed = damp(
          robotMotionBridge.currentSpeed,
          desiredSpeed,
          5.0,
          delta
        );

        const nextX = clamp(
          robotMotionBridge.x +
            Math.sin(robotMotionBridge.rotationY) *
              robotMotionBridge.currentSpeed *
              delta,
          -4.4,
          4.4
        );
        const nextZ = clamp(
          robotMotionBridge.z +
            Math.cos(robotMotionBridge.rotationY) *
              robotMotionBridge.currentSpeed *
              delta,
          -3.3,
          1.45
        );

        robotMotionBridge.x = nextX;
        robotMotionBridge.z = nextZ;
      }
    } else {
      robotMotionBridge.currentSpeed = damp(
        robotMotionBridge.currentSpeed,
        0,
        8.0,
        delta
      );
    }

    // Oscilação sutil de personagem animado
    robotMotionBridge.bobPhase +=
      delta * (robotMotionBridge.currentSpeed > 0.1 ? 10 : 2.4);

    if (groupRef.current) {
      groupRef.current.position.set(
        robotMotionBridge.x,
        0,
        robotMotionBridge.z
      );
      groupRef.current.rotation.y = robotMotionBridge.rotationY;
    }

    if (bodyTiltRef.current) {
      const bobY =
        Math.sin(robotMotionBridge.bobPhase) *
        (robotMotionBridge.currentSpeed > 0.1 ? 0.006 : 0.002);
      const pitch = clamp(robotMotionBridge.currentSpeed * 0.025, 0, 0.045);
      bodyTiltRef.current.position.y = 0.095 + bobY;
      bodyTiltRef.current.rotation.x = pitch;
    }

    // Sincronização discreta com o HUD (~4 Hz) sem sobrecarregar o React
    syncAccumulatorRef.current += delta;
    if (syncAccumulatorRef.current >= 0.25) {
      syncAccumulatorRef.current = 0;
      const point = { x: robotMotionBridge.x, z: robotMotionBridge.z };
      const currentRegion = envState.resolveRegionAtPoint(point);
      robotState.syncTelemetryFromBridge(currentRegion.id, currentRegion.label);

      if (robotState.state === 'CLEANING') {
        const nextProgress = envState.cleanDustNearPoint(point, 0.65, 0.12);
        robotState.setCleaningProgress(nextProgress);
        robotState.updateBattery(-0.08);
        if (nextProgress >= 100) {
          robotState.setOperationalState(
            'COMPLETED',
            'Limpeza da sala de estar concluída!'
          );
          cmdState.pushNotification(
            'Limpeza concluída!',
            'Todas as áreas prioritárias foram higienizadas.',
            'success'
          );
        }
      } else if (robotState.state === 'RECHARGING' && robotState.battery < 100) {
        robotState.updateBattery(0.4);
      }
    }
  });

  return (
    <group
      ref={groupRef}
      position={[robotMotionBridge.x, 0, robotMotionBridge.z]}
      rotation={[0, robotMotionBridge.rotationY, 0]}
      name="aspitoy-robot"
    >
      <group ref={bodyTiltRef} position={[0, 0.095, 0]}>
        {/* Chassi Principal Arredondado */}
        <mesh castShadow receiveShadow material={sharedMaterials.robotShell}>
          <cylinderGeometry args={[0.27, 0.29, 0.13, 36]} />
        </mesh>

        {/* Anel Superior em Coral Brinquedo */}
        <mesh
          castShadow
          position={[0, 0.068, 0]}
          material={sharedMaterials.robotCoralTrim}
        >
          <cylinderGeometry args={[0.22, 0.25, 0.022, 36]} />
        </mesh>

        {/* Torre de Sensor Óptico (Lidar estilizado) */}
        <mesh
          castShadow
          position={[0, 0.098, -0.03]}
          material={sharedMaterials.robotVisor}
        >
          <cylinderGeometry args={[0.075, 0.085, 0.042, 24]} />
        </mesh>

        {/* Anel Luminoso de Status */}
        <mesh position={[0, 0.121, -0.03]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.042, 0.065, 24]} />
          <meshStandardMaterial
            color={ledColor}
            emissive={ledColor}
            emissiveIntensity={1.8}
          />
        </mesh>

        {/* Visor Frontal com Olhos Digitais Expressivos */}
        <group position={[0, 0.02, 0.255]}>
          <RoundedBox
            args={[0.22, 0.065, 0.04]}
            radius={0.02}
            smoothness={3}
            material={sharedMaterials.robotVisor}
          />
          {/* Olho Esquerdo */}
          <mesh position={[-0.048, 0.004, 0.021]}>
            <capsuleGeometry args={[0.013, 0.014, 8, 12]} />
            <meshStandardMaterial
              color={WORLD_PALETTE.sensorCyan}
              emissive={WORLD_PALETTE.sensorCyan}
              emissiveIntensity={2.2}
            />
          </mesh>
          {/* Olho Direito */}
          <mesh position={[0.048, 0.004, 0.021]}>
            <capsuleGeometry args={[0.013, 0.014, 8, 12]} />
            <meshStandardMaterial
              color={WORLD_PALETTE.sensorCyan}
              emissive={WORLD_PALETTE.sensorCyan}
              emissiveIntensity={2.2}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function CameraDirector() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const cameraPreset = useCommandStore((s) => s.cameraPreset);
  const targetVecRef = useRef(new THREE.Vector3(-1.5, 0.2, -1.2));

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const controls = controlsRef.current;
    if (!controls) return;

    if (cameraPreset === 'follow' || cameraPreset === 'closeup') {
      targetVecRef.current.set(
        damp(controls.target.x, robotMotionBridge.x, 4.5, delta),
        damp(controls.target.y, 0.22, 4.5, delta),
        damp(controls.target.z, robotMotionBridge.z, 4.5, delta)
      );
      controls.target.copy(targetVecRef.current);

      if (cameraPreset === 'closeup') {
        const desiredCamX =
          robotMotionBridge.x - Math.sin(robotMotionBridge.rotationY) * 2.1;
        const desiredCamZ =
          robotMotionBridge.z - Math.cos(robotMotionBridge.rotationY) * 2.1;
        state.camera.position.set(
          damp(state.camera.position.x, desiredCamX, 3.2, delta),
          damp(state.camera.position.y, 1.45, 3.2, delta),
          damp(state.camera.position.z, desiredCamZ, 3.2, delta)
        );
      }
    } else {
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
          <InitialRobotActor />
          <CameraDirector />
        </Suspense>
      </Canvas>
    </div>
  );
}
