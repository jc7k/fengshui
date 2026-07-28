import { describe, expect, it } from 'vitest';

import { doorCenter } from './geometry';
import {
  distanceToWall,
  nearestWall,
  openingEndpoints,
  projectOntoWall,
  snapToWall,
  wallLength,
} from './walls';
import type { Room } from './types';

const room: Room = { widthCm: 400, lengthCm: 300 };

describe('wall geometry', () => {
  it('reports wall lengths', () => {
    expect(wallLength('north', room)).toBe(400);
    expect(wallLength('south', room)).toBe(400);
    expect(wallLength('east', room)).toBe(300);
    expect(wallLength('west', room)).toBe(300);
  });

  it('measures perpendicular distance to each wall', () => {
    const p = { x: 50, y: 100 };
    expect(distanceToWall(p, 'north', room)).toBe(100);
    expect(distanceToWall(p, 'south', room)).toBe(200);
    expect(distanceToWall(p, 'west', room)).toBe(50);
    expect(distanceToWall(p, 'east', room)).toBe(350);
  });

  it('picks the nearest wall', () => {
    expect(nearestWall({ x: 200, y: 10 }, room)).toBe('north');
    expect(nearestWall({ x: 200, y: 290 }, room)).toBe('south');
    expect(nearestWall({ x: 10, y: 150 }, room)).toBe('west');
    expect(nearestWall({ x: 390, y: 150 }, room)).toBe('east');
  });

  it('resolves ties deterministically', () => {
    // Dead centre of a square room is equidistant from all four walls.
    const square = { widthCm: 300, lengthCm: 300 };
    expect(nearestWall({ x: 150, y: 150 }, square)).toBe('north');
  });

  it('still picks a wall for a point outside the room', () => {
    // A drag can leave the room; it must still land somewhere sensible.
    expect(nearestWall({ x: 200, y: -50 }, room)).toBe('north');
    expect(nearestWall({ x: 500, y: 150 }, room)).toBe('east');
  });
});

describe('projectOntoWall', () => {
  it('measures along the clockwise walk, so south and west count backwards', () => {
    expect(projectOntoWall({ x: 100, y: 0 }, 'north', room)).toBe(100);
    expect(projectOntoWall({ x: 400, y: 100 }, 'east', room)).toBe(100);
    expect(projectOntoWall({ x: 100, y: 300 }, 'south', room)).toBe(300);
    expect(projectOntoWall({ x: 0, y: 100 }, 'west', room)).toBe(200);
  });

  it('agrees with the door geometry it feeds', () => {
    // Round trip: project a point onto a wall, place a door there, and the
    // door's centre should come back to the same point.
    for (const wall of ['north', 'east', 'south', 'west'] as const) {
      const width = 80;
      const placement = snapToWall({ x: 200, y: 150 }, room, width);
      const centre = doorCenter(
        { id: 'd', wall: placement.wall, offsetCm: placement.offsetCm, widthCm: width, swing: 'inward', hinge: 'left', isMain: true },
        room,
      );
      expect(projectOntoWall(centre, placement.wall, room)).toBeCloseTo(
        placement.offsetCm + width / 2,
        8,
      );
      expect(wall).toBeTruthy();
    }
  });
});

describe('snapToWall', () => {
  const width = 80;

  it('snaps a point near a wall onto it, centred on the pointer', () => {
    const p = snapToWall({ x: 200, y: 20 }, room, width);
    expect(p.wall).toBe('north');
    expect(p.offsetCm).toBe(200 - width / 2);
  });

  it('never lets an opening hang off the end of its wall', () => {
    // Both points are 2cm from the north wall and 5cm from a side wall, so the
    // north wall wins — near a corner the perpendicular-nearest wall is the one
    // that gets the opening, which is the whole point of nearestWall.
    const atStart = snapToWall({ x: 5, y: 2 }, room, width);
    expect(atStart.wall).toBe('north');
    expect(atStart.offsetCm).toBe(0);

    const atEnd = snapToWall({ x: 395, y: 2 }, room, width);
    expect(atEnd.wall).toBe('north');
    expect(atEnd.offsetCm).toBe(400 - width);
    expect(atEnd.offsetCm + width).toBeLessThanOrEqual(wallLength('north', room));
  });

  it('hands a corner drag to whichever wall is actually nearer', () => {
    // 5cm from the west wall, 10cm from the north one.
    expect(snapToWall({ x: 5, y: 10 }, room, width).wall).toBe('west');
    expect(snapToWall({ x: 10, y: 5 }, room, width).wall).toBe('north');
  });

  it('keeps every opening fully on its wall, wherever it is dragged', () => {
    for (const wall of ['north', 'east', 'south', 'west'] as const) {
      for (let t = -100; t <= 500; t += 25) {
        const point =
          wall === 'north' ? { x: t, y: 1 }
          : wall === 'south' ? { x: t, y: 299 }
          : wall === 'west' ? { x: 1, y: t }
          : { x: 399, y: t };
        const p = snapToWall(point, room, width);
        expect(p.offsetCm).toBeGreaterThanOrEqual(0);
        expect(p.offsetCm + width).toBeLessThanOrEqual(wallLength(p.wall, room) + 1e-9);
      }
    }
  });

  it('pins an opening wider than its wall at the start rather than going negative', () => {
    const p = snapToWall({ x: 200, y: 10 }, { widthCm: 50, lengthCm: 300 }, width);
    expect(p.offsetCm).toBe(0);
  });

  it('moves an opening between walls as the pointer crosses the room', () => {
    expect(snapToWall({ x: 200, y: 10 }, room, width).wall).toBe('north');
    expect(snapToWall({ x: 200, y: 290 }, room, width).wall).toBe('south');
  });
});

describe('openingEndpoints', () => {
  it('spans the opening along its wall', () => {
    const [a, b] = openingEndpoints({ wall: 'north', offsetCm: 100 }, 80, room);
    expect(a).toEqual({ x: 100, y: 0 });
    expect(b).toEqual({ x: 180, y: 0 });
  });

  it('follows the clockwise walk on the south wall', () => {
    const [a, b] = openingEndpoints({ wall: 'south', offsetCm: 100 }, 80, room);
    expect(a).toEqual({ x: 300, y: 300 });
    expect(b).toEqual({ x: 220, y: 300 });
  });

  it('stays on the wall line', () => {
    for (const wall of ['north', 'east', 'south', 'west'] as const) {
      const [a, b] = openingEndpoints({ wall, offsetCm: 50 }, 80, room);
      expect(distanceToWall(a, wall, room)).toBeCloseTo(0, 8);
      expect(distanceToWall(b, wall, room)).toBeCloseTo(0, 8);
    }
  });
});
