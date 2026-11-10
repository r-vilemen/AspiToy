import type { BoundingBox2D } from './environment';
import type { Vector2D } from './robot';

export type RoomId =
  | 'bedroom'
  | 'hallway'
  | 'living-room'
  | 'kitchen'
  | 'bathroom';

export interface RoomDoor {
  id: string;
  label: string;
  fromRoom: RoomId;
  toRoom: RoomId;
  /**
   * Posição central do vão da porta no mundo 3D
   */
  position: Vector2D;
  /**
   * Largura livre de passagem (em metros)
   */
  width: number;
  /**
   * Orientação do vão da porta ('x' = parede corre no eixo X, atravessa no eixo Z; 'z' = parede corre no eixo Z, atravessa no eixo X)
   */
  orientation: 'x' | 'z';
  /**
   * Limites de passagem livre sem colisão para o GridMap
   */
  traversableBounds: BoundingBox2D;
  isOpen: boolean;
}

export interface HouseRoomConfig {
  id: RoomId;
  label: string;
  category: 'bedroom' | 'hallway' | 'living' | 'kitchen' | 'bathroom';
  description: string;
  bounds: BoundingBox2D;
  center: Vector2D;
  spawnPoint: Vector2D;
  color: string;
  connectedDoors: string[];
}

export interface HouseFloorPlan {
  totalBounds: BoundingBox2D;
  rooms: Record<RoomId, HouseRoomConfig>;
  doors: RoomDoor[];
}
