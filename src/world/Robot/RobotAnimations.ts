import * as THREE from 'three';
import { damp, dampAngle } from '@/utils/math';

export interface RobotLocomotionState {
  x: number;
  z: number;
  rotationY: number;
  targetRotationY: number;
  speed: number;
  wheelSpin: number;
  bobPhase: number;
  pitch: number;
  roll: number;
  bumperCompression: number;
}

/**
 * Atualiza animação física do robô (oscilação orgânica, pitch de aceleração, rotação de rodas e amortecimento).
 */
export function updateRobotLocomotion(
  locomotion: RobotLocomotionState,
  desiredSpeed: number,
  desiredHeading: number | null,
  delta: number
): void {
  // 1. Rotação amortecida
  if (desiredHeading !== null) {
    locomotion.targetRotationY = desiredHeading;
    locomotion.rotationY = dampAngle(
      locomotion.rotationY,
      desiredHeading,
      8.0,
      delta
    );
  }

  // 2. Velocidade linear suave com aceleração/frenagem
  locomotion.speed = damp(
    locomotion.speed,
    desiredSpeed,
    desiredSpeed > 0 ? 5.5 : 9.0,
    delta
  );

  // 3. Giro das rodas proporcionais à velocidade real
  const wheelRadius = 0.045; // 4.5cm de raio
  const linearDistance = locomotion.speed * delta;
  locomotion.wheelSpin += linearDistance / wheelRadius;

  // 4. Oscilação orgânica de personagem vivo (Toy animation)
  const isMoving = locomotion.speed > 0.05;
  const bobFreq = isMoving ? 11.0 : 2.5;
  locomotion.bobPhase += delta * bobFreq;

  // 5. Pitch (inclinação para frente ao acelerar e para trás ao frear)
  const targetPitch = isMoving ? THREE.MathUtils.clamp(locomotion.speed * 0.035, 0, 0.055) : 0;
  locomotion.pitch = damp(locomotion.pitch, targetPitch, 6.0, delta);

  // 6. Roll sutil durante curvas acentuadas
  const turnRate = desiredHeading !== null ? Math.sin(locomotion.targetRotationY - locomotion.rotationY) : 0;
  const targetRoll = -turnRate * 0.03;
  locomotion.roll = damp(locomotion.roll, targetRoll, 7.0, delta);

  // 7. Descompressão suave do amortecedor frontal
  locomotion.bumperCompression = damp(locomotion.bumperCompression, 0, 8.0, delta);
}

