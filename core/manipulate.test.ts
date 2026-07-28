import { describe, expect, it } from 'vitest';

import { facingVector, furnitureRect, rectAabb, rectCorners, type Vec2 } from './geometry';
import {
  furnitureAt,
  hitHandle,
  itemHandles,
  resizeFromCorner,
  rotationFromPointer,
  type Corner,
} from './manipulate';
import { createLayout, type FurnitureItem, type Layout } from './types';

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

const layoutWith = (...furniture: FurnitureItem[]): Layout => ({
  ...createLayout('bedroom', { widthCm: 400, lengthCm: 300 }),
  furniture,
});

const CORNER_ORDER: Corner[] = ['nw', 'ne', 'se', 'sw'];

/** One named corner of an item, in room coordinates. */
const cornerOf = (of: FurnitureItem, corner: Corner): Vec2 =>
  rectCorners(furnitureRect(of))[CORNER_ORDER.indexOf(corner)];

const expectPointsClose = (actual: Vec2, expected: Vec2) => {
  expect(actual.x).toBeCloseTo(expected.x, 8);
  expect(actual.y).toBeCloseTo(expected.y, 8);
};

describe('furnitureAt', () => {
  it('returns the topmost of two overlapping items', () => {
    // Later items are drawn on top, so they are the ones the user is pointing at.
    const under = item({ id: 'under' });
    const over = item({ id: 'over' });
    expect(furnitureAt({ x: 200, y: 150 }, layoutWith(under, over))?.id).toBe('over');
    expect(furnitureAt({ x: 200, y: 150 }, layoutWith(over, under))?.id).toBe('under');
  });

  it('returns null on empty floor', () => {
    expect(furnitureAt({ x: 10, y: 10 }, layoutWith(item()))).toBeNull();
    expect(furnitureAt({ x: 200, y: 150 }, layoutWith())).toBeNull();
  });

  it('respects rotation rather than testing the bounding box', () => {
    const tilted = item({ rotationDeg: 45 });
    const point = { x: 300, y: 250 };

    const box = rectAabb(furnitureRect(tilted));
    expect(point.x).toBeLessThan(box.maxX);
    expect(point.y).toBeLessThan(box.maxY);

    // Inside the box, outside the rect — a rotated bed must not swallow the
    // empty corners around it.
    expect(furnitureAt(point, layoutWith(tilted))).toBeNull();
    expect(furnitureAt({ x: 136.36, y: 213.64 }, layoutWith(tilted))?.id).toBe('i');
  });

  it('makes a 5 cm mirror grabbable via minPickCm', () => {
    const mirror = item({ id: 'm', type: 'mirror', widthCm: 60, depthCm: 5, xCm: 100, yCm: 100 });
    const nearMiss = { x: 100, y: 108 };
    expect(furnitureAt(nearMiss, layoutWith(mirror))).toBeNull();
    expect(furnitureAt(nearMiss, layoutWith(mirror), 20)?.id).toBe('m');
  });

  it('never widens the pick beyond the item on the axis that is already big', () => {
    const mirror = item({ type: 'mirror', widthCm: 60, depthCm: 5, xCm: 100, yCm: 100 });
    expect(furnitureAt({ x: 140, y: 100 }, layoutWith(mirror), 20)).toBeNull();
  });
});

describe('handles', () => {
  it('puts the corner handles exactly on the item corners', () => {
    for (const rotationDeg of [0, 30]) {
      const it0 = item({ rotationDeg });
      const handles = itemHandles(it0, 30);
      const corners = rectCorners(furnitureRect(it0));
      for (let i = 0; i < 4; i++) {
        expect(handles[i].kind).toBe(CORNER_ORDER[i]);
        expectPointsClose(handles[i], corners[i]);
      }
    }
  });

  it('puts the rotate knob beyond the front edge, along the facing', () => {
    const it0 = item({ rotationDeg: 30 });
    const knob = itemHandles(it0, 40).find((h) => h.kind === 'rotate');
    expect(knob).toBeDefined();
    const forward = facingVector(30);
    const reach = it0.depthCm / 2 + 40;
    expectPointsClose(knob!, {
      x: it0.xCm + forward.x * reach,
      y: it0.yCm + forward.y * reach,
    });
  });

  it('puts the knob due north of an unrotated item', () => {
    const knob = itemHandles(item(), 40).find((h) => h.kind === 'rotate');
    expect(knob).toBeDefined();
    expectPointsClose(knob!, { x: 200, y: 150 - 100 - 40 });
  });

  it('hits the handle nearest the point, within the radius', () => {
    const it0 = item();
    expect(hitHandle({ x: 152, y: 52 }, it0, 40, 10)).toBe('nw');
    expect(hitHandle({ x: 248, y: 248 }, it0, 40, 10)).toBe('se');
    expect(hitHandle({ x: 200, y: 12 }, it0, 40, 10)).toBe('rotate');
  });

  it('misses when the point is nowhere near a handle', () => {
    expect(hitHandle({ x: 200, y: 150 }, item(), 40, 10)).toBeNull();
  });
});

describe('resizeFromCorner', () => {
  const options = { minSizeCm: 20, gridCm: 0 };

  it('keeps the opposite corner planted on an unrotated item', () => {
    const before = item();
    const anchorBefore = cornerOf(before, 'nw');
    const t = resizeFromCorner(before, 'se', { x: 300, y: 300 }, options);
    const after = { ...before, ...t };

    expectPointsClose(cornerOf(after, 'nw'), anchorBefore);
    expectPointsClose(cornerOf(after, 'se'), { x: 300, y: 300 });
  });

  it('keeps the opposite corner planted on a rotated item', () => {
    // The test that catches resizing in world space: at 0° both approaches
    // agree, and at 30° the naive one slides the anchor out from under itself.
    const before = item({ rotationDeg: 30 });
    const anchorBefore = cornerOf(before, 'nw');
    const t = resizeFromCorner(before, 'se', { x: 300, y: 300 }, options);
    const after = { ...before, ...t };

    expectPointsClose(cornerOf(after, 'nw'), anchorBefore);
    expectPointsClose(cornerOf(after, 'se'), { x: 300, y: 300 });
    expect(after.rotationDeg).toBe(30);
  });

  it('plants the right corner for every handle, rotated', () => {
    const opposite: Record<Corner, Corner> = { nw: 'se', ne: 'sw', se: 'nw', sw: 'ne' };
    for (const corner of CORNER_ORDER) {
      const before = item({ rotationDeg: 30 });
      const anchorBefore = cornerOf(before, opposite[corner]);
      const after = { ...before, ...resizeFromCorner(before, corner, { x: 260, y: 210 }, options) };
      expectPointsClose(cornerOf(after, opposite[corner]), anchorBefore);
    }
  });

  it('moves the centre — a resize is not a move', () => {
    const before = item();
    const t = resizeFromCorner(before, 'se', { x: 300, y: 300 }, options);
    expect(t.xCm).not.toBe(before.xCm);
    expect(t.yCm).not.toBe(before.yCm);
  });

  it('clamps at minSizeCm instead of going negative past the anchor', () => {
    const before = item();
    const anchorBefore = cornerOf(before, 'nw');
    // Dragged well beyond the nw anchor, up and to the left.
    const t = resizeFromCorner(before, 'se', { x: 100, y: 0 }, options);

    expect(t.widthCm).toBe(20);
    expect(t.depthCm).toBe(20);
    expectPointsClose(cornerOf({ ...before, ...t }, 'nw'), anchorBefore);
  });

  it('never returns a negative extent, wherever the pointer goes', () => {
    for (const corner of CORNER_ORDER) {
      for (const point of [{ x: -500, y: -500 }, { x: 900, y: 900 }, { x: 200, y: 150 }]) {
        const t = resizeFromCorner(item({ rotationDeg: 30 }), corner, point, options);
        expect(t.widthCm).toBeGreaterThanOrEqual(20);
        expect(t.depthCm).toBeGreaterThanOrEqual(20);
      }
    }
  });

  it('snaps the extents to the grid, leaving the anchor planted', () => {
    const before = item();
    const anchorBefore = cornerOf(before, 'nw');
    const t = resizeFromCorner(before, 'se', { x: 273, y: 150 }, { minSizeCm: 20, gridCm: 10 });

    expect(t.widthCm).toBe(120);
    expect(t.depthCm).toBe(100);
    expectPointsClose(cornerOf({ ...before, ...t }, 'nw'), anchorBefore);
  });
});

describe('rotationFromPointer', () => {
  it('points the item at each cardinal the way facingVector reads it', () => {
    // atan2(dy, dx) would pass none of these — it is 90° out.
    const cases: [Vec2, number][] = [
      [{ x: 200, y: 0 }, 0],
      [{ x: 400, y: 150 }, 90],
      [{ x: 200, y: 300 }, 180],
      [{ x: 0, y: 150 }, 270],
    ];
    for (const [point, expected] of cases) {
      const deg = rotationFromPointer(item(), point);
      expect(deg).toBeCloseTo(expected, 8);

      // And the facing it implies really does point at the pointer.
      const forward = facingVector(deg);
      const toPointer = { x: point.x - 200, y: point.y - 150 };
      const length = Math.hypot(toPointer.x, toPointer.y);
      expectPointsClose(forward, { x: toPointer.x / length, y: toPointer.y / length });
    }
  });

  it('returns a normalized angle for a pointer up and to the left', () => {
    expect(rotationFromPointer(item(), { x: 100, y: 50 })).toBeCloseTo(315, 8);
  });

  it('ignores the current rotation of the item', () => {
    expect(rotationFromPointer(item({ rotationDeg: 123 }), { x: 400, y: 150 })).toBeCloseTo(90, 8);
  });

  it('leaves the rotation alone when the pointer is on the centre', () => {
    expect(rotationFromPointer(item({ rotationDeg: 45 }), { x: 200, y: 150 })).toBe(45);
  });
});
