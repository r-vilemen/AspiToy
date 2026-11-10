import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Lighting } from './Environment/Lighting';
import { sharedMaterials, WORLD_PALETTE } from './Environment/Materials';
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

function InitialRoomStage() {
  const dockPosition = useEnvironmentStore((s) => s.dockPosition);
  const dustSpots = useEnvironmentStore((s) => s.dustSpots);

  return (
    <group name="initial-living-room">
      {/* Base do Piso de Madeira */}
      <mesh
        receiveShadow
        position={[0, -0.06, 0]}
        material={sharedMaterials.floorWood}
      >
        <boxGeometry args={[10, 0.12, 8]} />
      </mesh>

      {/* Moldura externa do piso */}
      <mesh
        receiveShadow
        position={[0, -0.09, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[10.28, 0.08, 8.28]} />
      </mesh>

      {/* Parede Norte (Fundo) */}
      <mesh
        castShadow
        receiveShadow
        position={[0, 1.5, -4.06]}
        material={sharedMaterials.wallPlaster}
      >
        <boxGeometry args={[10.2, 3.0, 0.14]} />
      </mesh>

      {/* Parede Leste com Abertura de Janela Solar */}
      <group position={[5.06, 0, 0]}>
        {/* Parte inferior da janela */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 0.45, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[0.14, 0.9, 8.14]} />
        </mesh>
        {/* Parte superior da janela */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 2.65, 0]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[0.14, 0.7, 8.14]} />
        </mesh>
        {/* Coluna esquerda da parede leste */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 1.6, -2.8]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[0.14, 1.4, 2.5]} />
        </mesh>
        {/* Coluna direita da parede leste */}
        <mesh
          castShadow
          receiveShadow
          position={[0, 1.6, 2.8]}
          material={sharedMaterials.wallPlaster}
        >
          <boxGeometry args={[0.14, 1.4, 2.5]} />
        </mesh>
      </group>

      {/* Rodapés de Madeira */}
      <mesh
        receiveShadow
        position={[0, 0.06, -3.97]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[9.95, 0.12, 0.04]} />
      </mesh>
      <mesh
        receiveShadow
        position={[4.97, 0.06, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[0.04, 0.12, 7.95]} />
      </mesh>

      {/* Tapete Central Texturizado */}
      <group position={[0, 0.01, 0.2]}>
        <RoundedBox
          receiveShadow
          args={[4.4, 0.025, 3.2]}
          radius={0.01}
          smoothness={2}
          material={sharedMaterials.rugBorder}
        />
        <RoundedBox
          receiveShadow
          position={[0, 0.006, 0]}
          args={[4.1, 0.022, 2.9]}
          radius={0.008}
          smoothness={2}
          material={sharedMaterials.rugFabric}
        />
      </group>

      {/* Estante / Rack Frontal (Referência Espacial Inicial) */}
      <group position={[0, 0.28, -3.5]}>
        <RoundedBox
          castShadow
          receiveShadow
          args={[3.2, 0.42, 0.62]}
          radius={0.04}
          smoothness={3}
          material={sharedMaterials.floorTrim}
        />
      </group>

      {/* Sofá Principal (Referência Espacial Inicial) */}
      <group position={[0, 0, 2.45]}>
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.24, 0]}
          args={[3.8, 0.34, 1.15]}
          radius={0.08}
          smoothness={3}
        >
          <meshStandardMaterial color={WORLD_PALETTE.sofaLinen} roughness={0.85} />
        </RoundedBox>
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.58, 0.42]}
          args={[3.8, 0.48, 0.28]}
          radius={0.08}
          smoothness={3}
        >
          <meshStandardMaterial color={WORLD_PALETTE.sofaLinen} roughness={0.85} />
        </RoundedBox>
      </group>

      {/* Base de Carregamento do AspiToy */}
      <group position={[dockPosition.x, 0, dockPosition.z]}>
        {/* Plataforma de acoplamento */}
        <RoundedBox
          receiveShadow
          position={[0, 0.015, 0]}
          args={[0.76, 0.03, 0.82]}
          radius={0.012}
          smoothness={2}
          material={sharedMaterials.dockBody}
        />
        {/* Torre da estação */}
        <RoundedBox
          castShadow
          receiveShadow
          position={[0, 0.22, -0.32]}
          args={[0.52, 0.42, 0.16]}
          radius={0.05}
          smoothness={3}
          material={sharedMaterials.dockBody}
        />
        {/* LED indicador da base */}
        <mesh position={[0, 0.35, -0.235]}>
          <boxGeometry args={[0.22, 0.025, 0.01]} />
          <meshStandardMaterial
            color={WORLD_PALETTE.ledEmerald}
            emissive={WORLD_PALETTE.ledEmerald}
            emissiveIntensity={1.6}
          />
        </mesh>
      </group>

      {/* Pontos de Sujeira Discretos no Piso */}
      {dustSpots.map(
        (spot) =>
          spot.intensity > 0.05 && (
            <group key={spot.id} position={[spot.position.x, 0.022, spot.position.z]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.06, spot.radius * spot.intensity, 20]} />
                <meshStandardMaterial
                  color="#8C6D4F"
                  transparent
                  opacity={0.42 * spot.intensity}
                  roughness={1}
                />
              </mesh>
            </group>
          )
      )}
    </group>
  );
}

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
      maxDistance={11.5}
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
        camera={{ position: [-4.2, 4.1, 5.2], fov: 42, near: 0.1, far: 45 }}
      >
        <color attach="background" args={[WORLD_PALETTE.sunlitBackdrop]} />
        <fog attach="fog" args={[WORLD_PALETTE.sunlitBackdrop, 13, 25]} />

        <Suspense fallback={null}>
          <Lighting />
          <InitialRoomStage />
          <InitialRobotActor />
          <CameraDirector />
        </Suspense>
      </Canvas>
    </div>
  );
}

