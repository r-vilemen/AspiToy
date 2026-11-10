import { describe, it, expect } from 'vitest';
import { RoomGraph, globalRoomGraph } from '../RoomGraph';
import { getRoomAtPosition, HOUSE_FLOOR_PLAN } from '@/world/House/FloorPlan';

describe('RoomGraph — Grafo Topológico da Residência Multicômodo', () => {
  const graph = new RoomGraph();

  it('identifica corretamente o cômodo para posições 3D chave da residência', () => {
    expect(getRoomAtPosition({ x: 0, z: 0 })).toBe('bedroom');
    expect(getRoomAtPosition({ x: 6.3, z: 2.0 })).toBe('hallway');
    expect(getRoomAtPosition({ x: 12.0, z: 0 })).toBe('living-room');
    expect(getRoomAtPosition({ x: 12.0, z: 6.0 })).toBe('kitchen');
    expect(getRoomAtPosition({ x: 7.5, z: 11.0 })).toBe('bathroom');
  });

  it('retorna os cômodos vizinhos diretamente conectados', () => {
    const hallwayNeighbors = graph.getConnectedRooms('hallway');
    expect(hallwayNeighbors).toContain('bedroom');
    expect(hallwayNeighbors).toContain('living-room');
    expect(hallwayNeighbors).toContain('kitchen');
    expect(hallwayNeighbors).toContain('bathroom');

    const bedroomNeighbors = graph.getConnectedRooms('bedroom');
    expect(bedroomNeighbors).toEqual(['hallway']);
  });

  it('encontra rotas ótimas entre cômodos através das portas', () => {
    // Quarto -> Sala de Estar (através do corredor)
    const routeToLiving = graph.findRoute('bedroom', 'living-room');
    expect(routeToLiving).not.toBeNull();
    expect(routeToLiving?.roomSequence).toEqual(['bedroom', 'hallway', 'living-room']);
    expect(routeToLiving?.doors.length).toBe(2);

    // Quarto -> Cozinha (através do corredor)
    const routeToKitchen = graph.findRoute('bedroom', 'kitchen');
    expect(routeToKitchen).not.toBeNull();
    expect(routeToKitchen?.roomSequence).toEqual(['bedroom', 'hallway', 'kitchen']);

    // Quarto -> Banheiro (através do corredor)
    const routeToBath = graph.findRoute('bedroom', 'bathroom');
    expect(routeToBath).not.toBeNull();
    expect(routeToBath?.roomSequence).toEqual(['bedroom', 'hallway', 'bathroom']);

    // Sala de Estar -> Cozinha (passagem direta entre sala e cozinha)
    const routeLivingToKitchen = graph.findRoute('living-room', 'kitchen');
    expect(routeLivingToKitchen).not.toBeNull();
    expect(routeLivingToKitchen?.roomSequence).toEqual(['living-room', 'kitchen']);
  });

  it('gera waypoints centrados nas portas para navegação física do AspiToy', () => {
    const start = { x: 0, z: 0 }; // No centro do quarto
    const target = { x: 12.0, z: 0 }; // Na sala de estar

    const plan = graph.planMultiRoomNavigation(start, target);
    expect(plan).not.toBeNull();
    expect(plan?.roomSequence).toEqual(['bedroom', 'hallway', 'living-room']);
    expect(plan?.doorwayWaypoints.length).toBe(2);

    // Primeiro waypoint deve ser na porta do Quarto -> Corredor (x=5.0, z=2.35)
    expect(plan?.doorwayWaypoints[0].x).toBeCloseTo(5.0, 1);
    expect(plan?.doorwayWaypoints[0].z).toBeCloseTo(2.35, 1);

    // Segundo waypoint deve ser na porta do Corredor -> Sala (x=7.6, z=0.5)
    expect(plan?.doorwayWaypoints[1].x).toBeCloseTo(7.6, 1);
    expect(plan?.doorwayWaypoints[1].z).toBeCloseTo(0.5, 1);
  });

  it('instancia globalRoomGraph como singleton funcional', () => {
    expect(globalRoomGraph).toBeDefined();
    expect(globalRoomGraph.getConnectedRooms('bedroom')).toEqual(['hallway']);
  });

  it('garante que todos os 5 cômodos da planta possuem configuração válida', () => {
    const rooms = Object.keys(HOUSE_FLOOR_PLAN.rooms);
    expect(rooms).toHaveLength(5);
    expect(rooms).toContain('bedroom');
    expect(rooms).toContain('hallway');
    expect(rooms).toContain('living-room');
    expect(rooms).toContain('kitchen');
    expect(rooms).toContain('bathroom');
  });
});
