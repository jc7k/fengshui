import { describe, expect, it } from 'vitest';

import {
  angleBetween,
  areaShare,
  doorCenter,
  doorSwingRect,
  facingVector,
  furnitureRect,
  hasLineOfSight,
  isBackTo,
  isFacing,
  pointInRect,
  rectAabb,
  rectCorners,
  rectDistance,
  rectsIntersect,
  rotate,
  segmentIntersectsRect,
  segmentsIntersect,
  wallSegment,
  type OrientedRect,
} from './geometry';
import type { Door, FurnitureItem, Room } from './types';

const room: Room = { widthCm: 400, lengthCm: 300 };

const square = (cx: number, cy: number, size = 100, rotationDeg = 0): OrientedRect => ({
  cx,
  cy,
  width: size,
  height: size,
  rotationDeg,
});

const item = (over: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: 'i',
  type: 'bed',
  xCm: 200,
  yCm: 150,
  widthCm: 100,
  depthCm: 200,
  rotationDeg: 0,
  ...over,
});

describe('rotation', () => {
  it('turns clockwise on screen, where y points down', () => {
    const east = rotate({ x: 0, y: -1 }, 90); // north, turned a quarter clockwise
    expect(east.x).toBeCloseTo(1, 10);
    expect(east.y).toBeCloseTo(0, 10);
  });

  it('maps each quarter turn to the expected compass direction', () => {
    const cases: [number, number, number][] = [
      [0, 0, -1],
      [90, 1, 0],
      [180, 0, 1],
      [270, -1, 0],
      [360, 0, -1],
    ];
    for (const [deg, x, y] of cases) {
      const v = facingVector(deg);
      expect(v.x).toBeCloseTo(x, 10);
      expect(v.y).toBeCloseTo(y, 10);
    }
  });

  it('is reversible', () => {
    const p = { x: 37, y: -12 };
    const back = rotate(rotate(p, 57), -57);
    expect(back.x).toBeCloseTo(p.x, 10);
    expect(back.y).toBeCloseTo(p.y, 10);
  });

  it('handles angles beyond a full turn and negatives', () => {
    expect(facingVector(450).x).toBeCloseTo(facingVector(90).x, 10);
    expect(facingVector(-90).x).toBeCloseTo(facingVector(270).x, 10);
  });

  it('puts a 45°-rotated square on its corner', () => {
    const corners = rectCorners(square(0, 0, 100, 45));
    const half = Math.hypot(50, 50); // 70.71
    expect(corners[0].x).toBeCloseTo(0, 10);
    expect(corners[0].y).toBeCloseTo(-half, 10);
    const box = rectAabb(square(0, 0, 100, 45));
    expect(box.maxX - box.minX).toBeCloseTo(2 * half, 10);
  });

  it('leaves the bounding box alone for quarter turns of a square', () => {
    const box = rectAabb(square(0, 0, 100, 90));
    expect(box.maxX - box.minX).toBeCloseTo(100, 10);
    expect(box.maxY - box.minY).toBeCloseTo(100, 10);
  });

  it('swaps the bounding box of a non-square rect at 90°', () => {
    const box = rectAabb({ cx: 0, cy: 0, width: 200, height: 100, rotationDeg: 90 });
    expect(box.maxX - box.minX).toBeCloseTo(100, 10);
    expect(box.maxY - box.minY).toBeCloseTo(200, 10);
  });

  it('rotates containment along with the rect', () => {
    const long = { cx: 0, cy: 0, width: 200, height: 20, rotationDeg: 0 };
    const p = { x: 80, y: 0 };
    expect(pointInRect(p, long)).toBe(true);
    expect(pointInRect(p, { ...long, rotationDeg: 90 })).toBe(false);
    expect(pointInRect({ x: 0, y: 80 }, { ...long, rotationDeg: 90 })).toBe(true);
  });
});

describe('intersection', () => {
  it('detects overlapping rects', () => {
    expect(rectsIntersect(square(0, 0), square(50, 0))).toBe(true);
  });

  it('treats flush edges as not overlapping', () => {
    // Two items pushed against each other are 0 cm apart but do not collide.
    expect(rectsIntersect(square(0, 0), square(100, 0))).toBe(false);
    expect(rectDistance(square(0, 0), square(100, 0))).toBeCloseTo(0, 10);
  });

  it('separates rects that share an axis projection but not the other', () => {
    expect(rectsIntersect(square(0, 0), square(0, 200))).toBe(false);
  });

  it('catches a rotated rect poking into an axis-aligned one', () => {
    // A 45° square at x=100 reaches back to x≈29, inside the square at the origin.
    expect(rectsIntersect(square(0, 0), square(100, 0, 100, 45))).toBe(true);
  });

  it('is symmetric', () => {
    const a = square(0, 0, 100, 30);
    const b = square(60, 20, 80, 75);
    expect(rectsIntersect(a, b)).toBe(rectsIntersect(b, a));
  });
});

describe('clearance', () => {
  it('measures the gap between separated rects', () => {
    expect(rectDistance(square(0, 0), square(200, 0))).toBeCloseTo(100, 10);
  });

  it('is zero when rects overlap', () => {
    expect(rectDistance(square(0, 0), square(50, 0))).toBe(0);
  });

  it('measures diagonal gaps corner to corner', () => {
    // Corners at (50,50) and (150,150).
    expect(rectDistance(square(0, 0), square(200, 200))).toBeCloseTo(Math.hypot(100, 100), 10);
  });

  it('is symmetric', () => {
    const a = square(0, 0, 100, 20);
    const b = square(300, 40, 60, 65);
    expect(rectDistance(a, b)).toBeCloseTo(rectDistance(b, a), 10);
  });
});

describe('line of sight', () => {
  it('is clear across an empty room', () => {
    expect(hasLineOfSight({ x: 0, y: 0 }, { x: 400, y: 0 }, [])).toBe(true);
  });

  it('is blocked by something in the way', () => {
    expect(hasLineOfSight({ x: 0, y: 0 }, { x: 400, y: 0 }, [square(200, 0)])).toBe(false);
  });

  it('ignores obstacles off the path', () => {
    expect(hasLineOfSight({ x: 0, y: 0 }, { x: 400, y: 0 }, [square(200, 200)])).toBe(true);
  });

  it('counts an obstacle containing an endpoint as blocking', () => {
    // Callers must exclude the item they are asking about.
    expect(hasLineOfSight({ x: 200, y: 0 }, { x: 400, y: 0 }, [square(200, 0)])).toBe(false);
  });

  it('detects segments crossing and missing', () => {
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true);
    expect(segmentsIntersect({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 0, y: 5 }, { x: 10, y: 5 })).toBe(false);
  });

  it('detects a segment ending inside a rect', () => {
    expect(segmentIntersectsRect({ x: 0, y: 0 }, { x: 200, y: 0 }, square(200, 0))).toBe(true);
  });
});

describe('facing', () => {
  it('knows when a bed points its foot at the door', () => {
    // Rule 2, the "coffin position": bed at 180° faces south, door due south.
    const bed = item({ xCm: 200, yCm: 150, rotationDeg: 180 });
    expect(isFacing(bed, { x: 200, y: 300 }, 5)).toBe(true);
    expect(isFacing(bed, { x: 200, y: 0 }, 5)).toBe(false);
  });

  it('respects the tolerance', () => {
    const bed = item({ xCm: 200, yCm: 150, rotationDeg: 180 });
    const offAxis = { x: 260, y: 300 }; // ~21.8° off dead ahead
    expect(isFacing(bed, offAxis, 30)).toBe(true);
    expect(isFacing(bed, offAxis, 15)).toBe(false);
  });

  it('knows when a chair has its back to the door', () => {
    // Rule 6: chair faces north, door is behind it to the south.
    const chair = item({ type: 'chair', xCm: 200, yCm: 150, rotationDeg: 0 });
    expect(isBackTo(chair, { x: 200, y: 300 }, 10)).toBe(true);
    expect(isFacing(chair, { x: 200, y: 300 }, 10)).toBe(false);
  });

  it('measures angles between vectors', () => {
    expect(angleBetween({ x: 1, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(90, 10);
    expect(angleBetween({ x: 1, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(180, 10);
    expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
  });
});

describe('walls and doors', () => {
  it('walks the walls clockwise from the top-left corner', () => {
    expect(wallSegment('north', room)).toEqual([{ x: 0, y: 0 }, { x: 400, y: 0 }]);
    expect(wallSegment('east', room)).toEqual([{ x: 400, y: 0 }, { x: 400, y: 300 }]);
    expect(wallSegment('south', room)).toEqual([{ x: 400, y: 300 }, { x: 0, y: 300 }]);
    expect(wallSegment('west', room)).toEqual([{ x: 0, y: 300 }, { x: 0, y: 0 }]);
  });

  const door = (over: Partial<Door> = {}): Door => ({
    id: 'd',
    wall: 'north',
    offsetCm: 100,
    widthCm: 80,
    swing: 'inward',
    hinge: 'left',
    isMain: true,
    ...over,
  });

  it('places a door centre along its wall', () => {
    expect(doorCenter(door(), room)).toEqual({ x: 140, y: 0 });
    // South is walked east-to-west, so the same offset mirrors.
    expect(doorCenter(door({ wall: 'south' }), room)).toEqual({ x: 260, y: 300 });
  });

  it('keeps a door on its wall for every wall', () => {
    expect(doorCenter(door({ wall: 'east' }), room)).toEqual({ x: 400, y: 140 });
    expect(doorCenter(door({ wall: 'west' }), room)).toEqual({ x: 0, y: 160 });
  });

  it('projects the swing area into the room', () => {
    const swing = doorSwingRect(door(), room);
    expect(swing).toEqual({ cx: 140, cy: 40, width: 80, height: 80, rotationDeg: 0 });
  });

  it('projects an outward swing away from the room', () => {
    expect(doorSwingRect(door({ swing: 'outward' }), room).cy).toBe(-40);
  });

  it('orients the swing area to the wall', () => {
    const swing = doorSwingRect(door({ wall: 'east' }), room);
    expect(swing.cx).toBe(360);
    expect(swing.cy).toBe(140);
  });

  it('flags furniture sitting in the swing area', () => {
    // Rule 5: nothing immediately behind the door.
    const blocking = furnitureRect(item({ xCm: 140, yCm: 40, widthCm: 60, depthCm: 60 }));
    expect(rectsIntersect(doorSwingRect(door(), room), blocking)).toBe(true);
  });
});

describe('area share', () => {
  it('reports the fraction of the floor an item covers', () => {
    // 200×100 in a 400×300 room.
    expect(areaShare(item({ widthCm: 200, depthCm: 100 }), room)).toBeCloseTo(1 / 6, 10);
  });

  it('is unaffected by rotation', () => {
    const upright = areaShare(item({ widthCm: 200, depthCm: 100, rotationDeg: 0 }), room);
    const turned = areaShare(item({ widthCm: 200, depthCm: 100, rotationDeg: 37 }), room);
    expect(turned).toBeCloseTo(upright, 10);
  });

  it('does not divide by zero on a degenerate room', () => {
    expect(areaShare(item(), { widthCm: 0, lengthCm: 0 })).toBe(0);
  });
});
