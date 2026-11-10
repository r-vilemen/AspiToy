import { memo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sharedMaterials, WORLD_PALETTE } from '../Environment/Materials';
import { useRobotStore } from '@/store/robotStore';
import { useHouseFloorClick } from './useFloorClick';
import { HOUSE_FLOOR_PLAN } from './FloorPlan';

interface FloorProps {
  width?: number;
  depth?: number;
}

/**
 * Piso PBR estilizado com navegação por clique em toda a residência ("Point-and-Click"):
 * - O usuário pode clicar em qualquer ponto do chão (Quarto, Corredor, Sala, Cozinha e Banheiro)
 * - Exibe um marcador luminoso 3D animado no ponto de destino selecionado em qualquer cômodo
 */
export const Floor = memo(function Floor({ width = 10, depth = 8 }: FloorProps) {
  const targetPosition = useRobotStore((s) => s.targetPosition);
  const handleFloorClick = useHouseFloorClick();

  const ringRef = useRef<THREE.Mesh>(null);
  const pinRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!targetPosition) return;
    const t = state.clock.elapsedTime;
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 5.0) * 0.14;
      ringRef.current.scale.set(s, s, 1);
    }
    if (pinRef.current) {
      pinRef.current.position.y = 0.14 + Math.sin(t * 4.5) * 0.035;
      pinRef.current.rotation.y = t * 2.2;
    }
  });

  return (
    <group name="house-floor-interactive">
      {/* Substrato estrutural do piso do quarto */}
      <mesh
        receiveShadow
        position={[0, -0.06, 0]}
        material={sharedMaterials.floorTrim}
      >
        <boxGeometry args={[width + 0.2, 0.1, depth + 0.2]} />
      </mesh>

      {/* Piso principal com textura PBR de tábuas de madeira */}
      <mesh
        receiveShadow
        position={[0, 0, 0]}
        material={sharedMaterials.floorWood}
      >
        <boxGeometry args={[width, 0.02, depth]} />
      </mesh>

      {/* Malhas de captura de clique interativo cobrindo toda a residência (Quarto, Corredor, Sala, Cozinha, Banheiro) */}
      {Object.values(HOUSE_FLOOR_PLAN.rooms).map((room) => {
        const roomW = room.bounds.maxX - room.bounds.minX;
        const roomD = room.bounds.maxZ - room.bounds.minZ;
        return (
          <mesh
            key={`interactive-floor-${room.id}`}
            position={[room.center.x, 0.028, room.center.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onClick={handleFloorClick}
            receiveShadow={false}
          >
            <planeGeometry args={[roomW, roomD]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        );
      })}

      {/* Projeção de luz solar da janela no chão */}
      <group position={[-2.1, 0.013, -1.25]} rotation={[-Math.PI / 2, 0, -0.12]}>
        <mesh>
          <planeGeometry args={[1.55, 0.95]} />
          <meshBasicMaterial
            color="#FFF2B2"
            transparent
            opacity={0.36}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0.1, -1.1, 0]}>
          <planeGeometry args={[1.7, 0.85]} />
          <meshBasicMaterial
            color="#FFF2B2"
            transparent
            opacity={0.28}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Marcador visual 3D do ponto clicado no chão */}
      {targetPosition && (
        <group position={[targetPosition.x, 0.022, targetPosition.z]}>
          {/* Anel pulsante de destino */}
          <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.14, 0.21, 32]} />
            <meshBasicMaterial
              color={WORLD_PALETTE.sensorCyan}
              transparent
              opacity={0.78}
              depthWrite={false}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.07, 24]} />
            <meshBasicMaterial
              color={WORLD_PALETTE.robotYellow}
              transparent
              opacity={0.65}
              depthWrite={false}
            />
          </mesh>
          {/* Cristal/pino flutuante indicando o destino */}
          <mesh
            ref={pinRef}
            position={[0, 0.14, 0]}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.055, 0.12, 4]} />
            <meshBasicMaterial color={WORLD_PALETTE.sensorCyan} />
          </mesh>
        </group>
      )}
    </group>
  );
});
