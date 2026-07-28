import { describe, expect, it } from 'vitest';

import { rectAabb, type OrientedRect } from './geometry';
import {
  canSeeDoor,
  channelGap,
  doorAxisCorridor,
  doorBand,
  doorSightPoints,
  doorsInScope,
  mirrorBeam,
  projectedBand,
} from './rule-geometry';
import { createLayout } from './types';
import type { Aabb } from './geometry';
import type { Door, FurnitureItem, Layout, Room } from './types';

// The shared fixture geometry for this REQ: every number divisible by 10, so a
// reader can check any assertion below on graph paper without running anything.
const room: Room = { widthCm: 400, lengthCm: 300 };

/** North wall, opening x ∈ [160, 240], centre (200, 0). */
const northDoor = (over: Partial<Door> = {}): Door => ({
  id: 'd',
  wall: 'north',
  offsetCm: 160,
  widthCm: 80,
  swing: 'inward',
  hinge: 'left',
  isMain: true,
  ...over,
});

const item = (over: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: 'i',
  type: 'mirror',
  xCm: 200,
  yCm: 150,
  widthCm: 60,
  depthCm: 5,
  rotationDeg: 0,
  ...over,
});

const box = (minX: number, minY: number, maxX: number, maxY: number): Aabb => ({
  minX,
  minY,
  maxX,
  maxY,
});

/** Compare an AABB to whole centimetres, which is how the fixtures are written. */
const aabbOf = (rect: OrientedRect): number[] => {
  const a = rectAabb(rect);
  return [a.minX, a.minY, a.maxX, a.maxY].map((n) => {
    const r = Math.round(n * 1e6) / 1e6;
    return r === 0 ? 0 : r; // collapse −0, which toEqual distinguishes
  });
};

describe('projectedBand', () => {
  it('runs from the origin in the given direction, centred across it', () => {
    const band = projectedBand({ x: 200, y: 0 }, { x: 0, y: 1 }, 300, 80);
    expect(band.cx).toBeCloseTo(200, 10);
    expect(band.cy).toBeCloseTo(150, 10); // origin + half the length
    expect(band.width).toBe(80);
    expect(band.height).toBe(300);
    expect(aabbOf(band)).toEqual([160, 0, 240, 300]);
  });

  it('carries the direction into the rect angle, so a band can be oblique', () => {
    // Due west: facingVector(270°) = (−1, 0), and 270° ≡ −90°.
    const band = projectedBand({ x: 400, y: 140 }, { x: -1, y: 0 }, 400, 80);
    expect(band.rotationDeg).toBeCloseTo(-90, 10);
    expect(aabbOf(band)).toEqual([0, 100, 400, 180]);
  });
});

describe('doorAxisCorridor', () => {
  it('spans the room depth at the door width when the factor is 1', () => {
    // Opening [160, 240] projected across the room's 300 cm of depth.
    expect(aabbOf(doorAxisCorridor(northDoor(), room, 1))).toEqual([160, 0, 240, 300]);
  });

  it('scales with the door width, so double doors widen the exclusion', () => {
    // 80 cm × 2 = 160 cm, centred on x = 200.
    expect(aabbOf(doorAxisCorridor(northDoor(), room, 2))).toEqual([120, 0, 280, 300]);
  });

  it('runs east–west for a door on a side wall', () => {
    // East wall runs (400, 0) → (400, 300); offset 100 + half of 80 → y = 140.
    const door = northDoor({ wall: 'east', offsetCm: 100 });
    expect(aabbOf(doorAxisCorridor(door, room, 1))).toEqual([0, 100, 400, 180]);
  });
});

describe('doorBand', () => {
  it('stops at the given depth rather than crossing the room', () => {
    expect(aabbOf(doorBand(northDoor(), room, 100, 1))).toEqual([160, 0, 240, 100]);
  });

  it('reaches into the room for an outward-swinging door too', () => {
    // The band follows the inward normal regardless of which way the leaf goes —
    // that is what stops rule 5 being vacuous for outward doors.
    const band = doorBand(northDoor({ swing: 'outward' }), room, 60, 1);
    expect(aabbOf(band)).toEqual([160, 0, 240, 60]);
  });
});

describe('doorSightPoints', () => {
  it('samples the opening at 25/50/75%, never its endpoints', () => {
    expect(doorSightPoints(northDoor(), room)).toEqual([
      { x: 180, y: 0 },
      { x: 200, y: 0 },
      { x: 220, y: 0 },
    ]);
  });
});

describe('canSeeDoor', () => {
  const eye = { x: 200, y: 200 };

  it('sees the door across an empty room', () => {
    expect(canSeeDoor(eye, northDoor(), room, [])).toBe(true);
  });

  it('is blocked by an obstacle spanning the whole opening', () => {
    const wall: OrientedRect = { cx: 200, cy: 100, width: 200, height: 20, rotationDeg: 0 };
    expect(canSeeDoor(eye, northDoor(), room, [wall])).toBe(false);
  });

  it('still sees past something that clips only the middle of the opening', () => {
    // Covers x ∈ [195, 205]: the 50% ray is blocked, the 25% and 75% rays are not.
    const post: OrientedRect = { cx: 200, cy: 100, width: 10, height: 20, rotationDeg: 0 };
    expect(canSeeDoor(eye, northDoor(), room, [post])).toBe(true);
  });
});

describe('mirrorBeam', () => {
  it('projects from the reflecting face, as wide as the mirror', () => {
    // 5 cm deep, so the face is 2.5 cm south of the centre when facing south.
    const beam = mirrorBeam(item({ rotationDeg: 180 }), 600);
    expect(aabbOf(beam)).toEqual([170, 152.5, 230, 752.5]);
  });

  it('points north at the default 0° rotation', () => {
    // Documents the REQ-008 trap: a new item starts at 0° = facing north, so a
    // mirror dropped on the north wall reflects out of the room until rotated.
    const beam = mirrorBeam(item({ yCm: 20, rotationDeg: 0 }), 100);
    expect(aabbOf(beam)).toEqual([170, -82.5, 230, 17.5]);
  });
});

describe('channelGap', () => {
  it('measures the gap along the axis the items are separated on', () => {
    // [0,100] and [145,245] on x: 145 − 100 = 45.
    expect(channelGap(box(0, 0, 100, 100), box(145, 0, 245, 100))).toEqual({
      gapCm: 45,
      axis: 'x',
    });
  });

  it('measures a north–south channel on y', () => {
    expect(channelGap(box(0, 0, 100, 100), box(0, 160, 100, 260))).toEqual({
      gapCm: 60,
      axis: 'y',
    });
  });

  it('returns null for diagonally offset items — there is no channel', () => {
    expect(channelGap(box(0, 0, 100, 100), box(150, 150, 250, 250))).toBeNull();
  });

  it('reports zero for items that overlap or sit flush', () => {
    expect(channelGap(box(0, 0, 100, 100), box(50, 50, 150, 150))?.gapCm).toBe(0);
    expect(channelGap(box(0, 0, 100, 100), box(100, 0, 200, 100))?.gapCm).toBe(0);
  });

  it('needs only a sliver of perpendicular overlap to count', () => {
    // y ranges [0,100] and [99,199] overlap by 1 cm, so this is still a channel.
    expect(channelGap(box(0, 0, 100, 100), box(145, 99, 245, 199))).toEqual({
      gapCm: 45,
      axis: 'x',
    });
  });
});

describe('doorsInScope', () => {
  const layout = (): Layout => {
    const l = createLayout('bedroom', room);
    l.doors = [northDoor({ id: 'side', wall: 'west', isMain: false }), northDoor({ id: 'main' })];
    return l;
  };

  it('returns just the main entrance by default', () => {
    expect(doorsInScope(layout(), 'main').map((d) => d.id)).toEqual(['main']);
  });

  it('returns every door under the all scope, in layout order', () => {
    expect(doorsInScope(layout(), 'all').map((d) => d.id)).toEqual(['side', 'main']);
  });

  it('falls back to the first door when none is flagged main', () => {
    const l = layout();
    l.doors = l.doors.map((d) => ({ ...d, isMain: false }));
    expect(doorsInScope(l, 'main').map((d) => d.id)).toEqual(['side']);
  });

  it('returns nothing when there is no door at all', () => {
    expect(doorsInScope(createLayout('bedroom', room), 'main')).toEqual([]);
  });
});
