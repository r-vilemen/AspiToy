import type { RoomId, RoomDoor } from '@/types/house';
import type { Vector2D } from '@/types/robot';
import { HOUSE_FLOOR_PLAN, getRoomAtPosition } from '@/world/House/FloorPlan';

export interface RoomRouteStep {
  fromRoom: RoomId;
  toRoom: RoomId;
  door: RoomDoor;
  doorwayWaypoint: Vector2D;
}

export interface MultiRoomPlan {
  roomSequence: RoomId[];
  doorwayWaypoints: Vector2D[];
  destination: Vector2D;
  targetRoom: RoomId;
}

/**
 * Grafo Topológico de Conectividade da Residência:
 * - Descobre quais cômodos são alcançáveis a partir da posição atual
 * - Calcula rotas ótimas entre cômodos utilizando busca em grafo (BFS)
 * - Gera waypoints de transição centrados nos vãos das portas
 */
export class RoomGraph {
  private adjacency: Map<RoomId, { neighbor: RoomId; door: RoomDoor }[]> =
    new Map();

  constructor() {
    this.buildGraph();
  }

  private buildGraph(): void {
    const { rooms, doors } = HOUSE_FLOOR_PLAN;

    for (const roomId of Object.keys(rooms) as RoomId[]) {
      this.adjacency.set(roomId, []);
    }

    for (const door of doors) {
      if (!door.isOpen) continue;

      this.adjacency.get(door.fromRoom)?.push({
        neighbor: door.toRoom,
        door,
      });

      this.adjacency.get(door.toRoom)?.push({
        neighbor: door.fromRoom,
        door,
      });
    }
  }

  /**
   * Retorna os cômodos diretamente conectados ao cômodo informado.
   */
  public getConnectedRooms(roomId: RoomId): RoomId[] {
    const list = this.adjacency.get(roomId) || [];
    return list.map((item) => item.neighbor);
  }

  /**
   * Identifica o cômodo onde se encontra uma coordenada (X, Z).
   */
  public getRoomAt(point: Vector2D): RoomId {
    return getRoomAtPosition(point);
  }

  /**
   * Encontra a melhor rota entre dois cômodos através do grafo de portas.
   */
  public findRoute(
    fromRoom: RoomId,
    toRoom: RoomId
  ): { roomSequence: RoomId[]; doors: RoomDoor[] } | null {
    if (fromRoom === toRoom) {
      return { roomSequence: [fromRoom], doors: [] };
    }

    const queue: { current: RoomId; path: RoomId[]; doors: RoomDoor[] }[] = [
      { current: fromRoom, path: [fromRoom], doors: [] },
    ];
    const visited = new Set<RoomId>([fromRoom]);

    while (queue.length > 0) {
      const { current, path, doors } = queue.shift()!;

      if (current === toRoom) {
        return { roomSequence: path, doors };
      }

      const neighbors = this.adjacency.get(current) || [];
      for (const { neighbor, door } of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push({
            current: neighbor,
            path: [...path, neighbor],
            doors: [...doors, door],
          });
        }
      }
    }

    return null;
  }

  /**
   * Planeja a sequência de waypoints para deslocamento intercômodo seguro.
   */
  public planMultiRoomNavigation(
    currentPos: Vector2D,
    destination: Vector2D
  ): MultiRoomPlan | null {
    const startRoom = this.getRoomAt(currentPos);
    const targetRoom = this.getRoomAt(destination);

    if (startRoom === targetRoom) {
      return {
        roomSequence: [startRoom],
        doorwayWaypoints: [],
        destination,
        targetRoom,
      };
    }

    const route = this.findRoute(startRoom, targetRoom);
    if (!route) return null;

    const doorwayWaypoints: Vector2D[] = [];
    for (const door of route.doors) {
      // Ponto seguro no centro do vão da porta
      doorwayWaypoints.push({
        x: door.position.x,
        z: door.position.z,
      });
    }

    return {
      roomSequence: route.roomSequence,
      doorwayWaypoints,
      destination,
      targetRoom,
    };
  }
}

export const globalRoomGraph = new RoomGraph();

