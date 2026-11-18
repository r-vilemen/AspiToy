import { memo, useCallback } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { Floor } from './Floor';
import { Walls } from './Walls';
import { Furniture } from './Furniture';
import { Architecture } from './Architecture';
import { Doors } from './Doors';
import { FloorDust } from './FloorDust';
import { Hallway } from './Rooms/Hallway';
import { LivingRoom } from './Rooms/LivingRoom';
import { Kitchen } from './Rooms/Kitchen';
import { Bathroom } from './Rooms/Bathroom';
import {
  PerchedFurnitureToys,
  PushableFloorToys,
} from './ToyStoryFigures';
import { useEnvironmentStore } from '@/store/environmentStore';
import { robotMotionBridge, useRobotStore } from '@/store/robotStore';

/**
 * Residência 3D Completa e Conectada do AspiToy:
 * - Quarto Original: 100% preservado com todos os móveis, física, brinquedos e gato
 * - Corredor Central: conector espaçoso de taco de madeira com arandelas e aparador
 * - Sala de Estar: sofá em L, TV CRT de tubo, estante de livros, plantas e tapete
 * - Cozinha Residencial: azulejos xadrez, geladeira retrô, fogão, bancada em L com pia e balcão
 * - Banheiro Social: box de vidro com ducha, vaso sanitário de porcelana e pia com espelho
 * - Sistema de Portas e Passagens: aberturas funcionais permitindo circulação contínua do robô
 * - Captura de Mira do Canhão de Espuma em qualquer superfície (paredes, móveis e chão)
 */
export const House = memo(function House() {
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);

  const handleHousePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    // Ignora arraste de câmera via OrbitControls
    if (e.delta > 6) return;

    if (robotMotionBridge.isCannonAiming || useRobotStore.getState().isCannonAiming) {
      e.stopPropagation();
      useRobotStore.getState().fireFoamCannon({
        x: e.point.x,
        y: e.point.y,
        z: e.point.z,
      });
    }
  }, []);

  return (
    <group name="house-complete-residence" onPointerDown={handleHousePointerDown}>
      {/* ======================================================== */}
      {/* 1. ESTRUTURA ARQUITETÔNICA GLOBAL & PORTAS               */}
      {/* ======================================================== */}
      <Architecture wallHeight={roomDimensions.wallHeight} />
      <Doors />

      {/* ======================================================== */}
      {/* 2. QUARTO ORIGINAL (100% PRESERVADO)                     */}
      {/* ======================================================== */}
      <group name="room-bedroom-original">
        <Floor width={10} depth={8} />
        <Walls
          width={10}
          depth={8}
          height={roomDimensions.wallHeight}
        />
        <Furniture />
        <PerchedFurnitureToys />
        <PushableFloorToys />
      </group>

      {/* ======================================================== */}
      {/* 3. NOVOS CÔMODOS INTEGRADOS                              */}
      {/* ======================================================== */}
      <Hallway />
      <LivingRoom />
      <Kitchen />
      <Bathroom />

      {/* ======================================================== */}
      {/* 4. SISTEMA DE POEIRA DINÂMICA NO CHÃO DA RESIDÊNCIA       */}
      {/* ======================================================== */}
      <FloorDust />
    </group>
  );
});
