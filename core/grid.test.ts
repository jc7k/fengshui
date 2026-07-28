import { describe, expect, it } from 'vitest';

import {
  gridSizeCm,
  normalizeAngle,
  ROTATION_SNAP_DEG,
  snapAngle,
  snapPointToGrid,
  snapToGrid,
} from './grid';

describe('grid spacing', () => {
  it('is half a foot in feet', () => {
    expect(gridSizeCm('ft')).toBe(15.24);
  });

  it('is a quarter metre in metres', () => {
    expect(gridSizeCm('m')).toBe(25);
  });
});

describe('snapToGrid', () => {
  it('rounds down to the nearer multiple', () => {
    expect(snapToGrid(23, 10)).toBe(20);
  });

  it('rounds up to the nearer multiple', () => {
    expect(snapToGrid(27, 10)).toBe(30);
  });

  it('rounds negatives to the nearer multiple too', () => {
    expect(snapToGrid(-23, 10)).toBe(-20);
    expect(snapToGrid(-27, 10)).toBe(-30);
  });

  it('breaks an exact halfway upward, consistently in both directions', () => {
    expect(snapToGrid(5, 10)).toBe(10);
    expect(snapToGrid(-15, 10)).toBe(-10);
  });

  it('leaves a value alone when the grid is off', () => {
    // Snapping is optional (PRD §4.2); off is expressed as a zero grid.
    expect(snapToGrid(23.7, 0)).toBe(23.7);
    expect(snapToGrid(23.7, -10)).toBe(23.7);
  });

  it('handles a fractional grid, which feet always produce', () => {
    expect(snapToGrid(20, gridSizeCm('ft'))).toBeCloseTo(15.24, 10);
    expect(snapToGrid(50, gridSizeCm('ft'))).toBeCloseTo(45.72, 10);
  });

  it('snaps both axes of a point', () => {
    expect(snapPointToGrid({ x: 23, y: -27 }, 10)).toEqual({ x: 20, y: -30 });
    expect(snapPointToGrid({ x: 23, y: -27 }, 0)).toEqual({ x: 23, y: -27 });
  });
});

describe('normalizeAngle', () => {
  it('folds a value past a full turn back into range', () => {
    expect(normalizeAngle(370)).toBe(10);
  });

  it('folds a negative into the positive range', () => {
    expect(normalizeAngle(-10)).toBe(350);
  });

  it('folds several turns', () => {
    expect(normalizeAngle(720 + 45)).toBe(45);
    expect(normalizeAngle(-720 - 45)).toBe(315);
  });

  it('maps a full turn to zero', () => {
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(0)).toBe(0);
  });
});

describe('snapAngle', () => {
  it('snaps to the nearest step', () => {
    expect(snapAngle(37, ROTATION_SNAP_DEG)).toBe(30);
    expect(snapAngle(38, ROTATION_SNAP_DEG)).toBe(45);
  });

  it('wraps just below a full turn to 0, not 360', () => {
    // 360 would be a rotation that reads as "none" but compares unequal to 0.
    expect(snapAngle(358, ROTATION_SNAP_DEG)).toBe(0);
    expect(snapAngle(353, ROTATION_SNAP_DEG)).toBe(0);
  });

  it('normalizes negatives', () => {
    expect(snapAngle(-5, ROTATION_SNAP_DEG)).toBe(0);
    expect(snapAngle(-20, ROTATION_SNAP_DEG)).toBe(345);
  });

  it('only normalizes when the step is off', () => {
    expect(snapAngle(37, 0)).toBe(37);
    expect(snapAngle(-10, 0)).toBe(350);
  });
});
