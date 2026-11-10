import { describe, it, expect } from 'vitest';
import {
  ALL_HOUSE_CAT_PERCHES,
  HOUSE_CAT_WAYPOINTS_BY_ROOM,
  pickWeightedCatRoom,
  pickWeightedCatPerch,
  pickWeightedCatFloorDestination,
  planCatRoute,
} from '../catNavigation';
import { ObstacleDetector } from '@/agent/navigation/ObstacleDetector';
import { ALL_HOUSE_OBSTACLES } from '@/world/House/HouseObstacles';
import { HOUSE_DIMENSIONS } from '@/store/environmentStore';

describe('Feline Multi-Room Navigation & Preference System', () => {
  it('should define perches across all rooms with preference for the bedroom', () => {
    expect(ALL_HOUSE_CAT_PERCHES.length).toBeGreaterThanOrEqual(10);

    const bedroomPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'bedroom');
    const livingPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'living-room');
    const kitchenPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'kitchen');
    const bathroomPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'bathroom');
    const hallwayPerches = ALL_HOUSE_CAT_PERCHES.filter((p) => p.room === 'hallway');

    expect(bedroomPerches.length).toBeGreaterThanOrEqual(4);
    expect(livingPerches.length).toBeGreaterThanOrEqual(2);
    expect(kitchenPerches.length).toBeGreaterThanOrEqual(2);
    expect(bathroomPerches.length).toBe(0); // Banheiro não possui poleiros para gatos (evita cantos proibidos e box)
    expect(hallwayPerches.length).toBeGreaterThanOrEqual(1);
  });

  it('should have floor waypoints for each of the 5 house rooms', () => {
    expect(HOUSE_CAT_WAYPOINTS_BY_ROOM.bedroom.length).toBeGreaterThanOrEqual(8);
    expect(HOUSE_CAT_WAYPOINTS_BY_ROOM.hallway.length).toBeGreaterThanOrEqual(4);
    expect(HOUSE_CAT_WAYPOINTS_BY_ROOM['living-room'].length).toBeGreaterThanOrEqual(5);
    expect(HOUSE_CAT_WAYPOINTS_BY_ROOM.kitchen.length).toBeGreaterThanOrEqual(4);
    expect(HOUSE_CAT_WAYPOINTS_BY_ROOM.bathroom.length).toBeGreaterThanOrEqual(4);
  });

  it('should statistically prefer the bedroom when selecting rooms', () => {
    let bedroomCount = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      if (pickWeightedCatRoom(0) === 'bedroom') {
        bedroomCount++;
      }
    }

    const ratio = bedroomCount / trials;
    // Expected ~60% (permit 50% to 70%)
    expect(ratio).toBeGreaterThan(0.5);
    expect(ratio).toBeLessThan(0.72);
  });

  it('should increase return to bedroom urge after wandering outside', () => {
    let bedroomCount = 0;
    const trials = 1000;

    for (let i = 0; i < trials; i++) {
      if (pickWeightedCatRoom(3) === 'bedroom') {
        bedroomCount++;
      }
    }

    const ratio = bedroomCount / trials;
    // Expected ~85% (permit 75% to 95%)
    expect(ratio).toBeGreaterThan(0.75);
  });

  it('should pick weighted perches prioritizing the bedroom', () => {
    const perch = pickWeightedCatPerch(0);
    expect(perch).toBeDefined();
    expect(perch.stagingPoint).toBeDefined();
    expect(perch.perchWaypoints.length).toBeGreaterThan(0);
  });

  it('should pick collision-free floor destinations across the house', () => {
    const detector = new ObstacleDetector(
      ALL_HOUSE_OBSTACLES,
      HOUSE_DIMENSIONS.width,
      HOUSE_DIMENSIONS.depth
    );

    for (let i = 0; i < 20; i++) {
      const { target, targetRoom } = pickWeightedCatFloorDestination(detector, i % 3);
      expect(target).toBeDefined();
      expect(targetRoom).toBeDefined();
      expect(detector.isColliding(target, 0.2)).toBe(false);
    }
  });

  it('should plan multi-room transit route through doorways when changing rooms', () => {
    // Sala de estar (X = 12.8, Z = 0.2) to Bedroom (X = -0.6, Z = -0.9)
    const livingRoomPos = { x: 12.8, z: 0.2 };
    const bedroomPos = { x: -0.6, z: -0.9 };

    const route = planCatRoute(livingRoomPos, bedroomPos);
    expect(route.length).toBeGreaterThan(1);
    // Final point must be the bedroom destination
    expect(route[route.length - 1]).toEqual(bedroomPos);
  });
});

