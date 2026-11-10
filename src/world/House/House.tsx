import { memo } from 'react';
import { Floor } from './Floor';
import { Walls } from './Walls';
import { Furniture } from './Furniture';
import { Architecture } from './Architecture';
import { Doors } from './Doors';
import { Hallway } from './Rooms/Hallway';
import { LivingRoom } from './Rooms/LivingRoom';
import { Kitchen } from './Rooms/Kitchen';
import { Bathroom } from './Rooms/Bathroom';
import {
  PerchedFurnitureToys,
  PushableFloorToys,
} from './ToyStoryFigures';
import { useEnvironmentStore } from '@/store/environmentStore';

/**
 * Residência 3D Completa e Conectada do AspiToy:
 * - Quarto Original: 100% preservado com todos os móveis, física, brinquedos e gato
 * - Corredor Central: conector espaçoso de taco de madeira com arandelas e aparador
 * - Sala de Estar: sofá em L, TV CRT de tubo, estante de livros, plantas e tapete
 * - Cozinha Residencial: azulejos xadrez, geladeira retrô, fogão, bancada em L com pia e balcão
 * - Banheiro Social: box de vidro com ducha, vaso sanitário de porcelana e pia com espelho
 * - Sistema de Portas e Passagens: aberturas funcionais permitindo circulação contínua do robô
 */
export const House = memo(function House() {
  const roomDimensions = useEnvironmentStore((s) => s.roomDimensions);
  const dustSpots = useEnvironmentStore((s) => s.dustSpots);

  return (
    <group name="house-complete-residence">
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
      {/* 4. PONTOS DE POEIRA ESPALHADOS PELA RESIDÊNCIA           */}
      {/* ======================================================== */}
      {dustSpots.map(
        (spot) =>
          spot.intensity > 0.05 && (
            <group
              key={spot.id}
              position={[spot.position.x, 0.015, spot.position.z]}
            >
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry
                  args={[0.05, spot.radius * spot.intensity, 24]}
                />
                <meshStandardMaterial
                  color="#8A6A4E"
                  transparent
                  opacity={0.38 * spot.intensity}
                  roughness={1}
                />
              </mesh>
            </group>
          )
      )}
    </group>
  );
});
