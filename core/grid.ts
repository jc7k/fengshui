/**
 * Snapping — to a spatial grid, and to rotation steps.
 *
 * The grid is expressed in the unit the user is working in, because a grid of
 * "15.24 cm" is meaningless to someone typing feet and a grid of "half a foot"
 * is obvious. Storage stays centimetres, as everywhere else.
 *
 * **Whether snapping is on is deliberately not a field on `Layout`.** The PRD
 * calls it optional (§4.2), so it is a per-user view preference like the zoom
 * level, not part of the design being described. `Layout` is the `layout_json`
 * payload REQ-010 persists, and adding a toggle to it would mean bumping
 * `schemaVersion` — and storing, versioning and migrating a value that says
 * nothing about the room. The editor holds it in component state instead.
 */

import type { Vec2 } from './geometry';
import { cmPerUnit, type Unit } from './units';

/**
 * The grid spacing for a display unit, cm.
 *
 * Half a foot or a quarter metre: fine enough to line furniture up against a
 * wall, coarse enough that the snap is felt rather than fought.
 */
export function gridSizeCm(unit: Unit): number {
  return unit === 'ft' ? cmPerUnit('ft') / 2 : cmPerUnit('m') / 4;
}

/** Nearest multiple of `gridCm`. A non-positive grid is the identity. */
export function snapToGrid(valueCm: number, gridCm: number): number {
  if (gridCm <= 0) return valueCm;
  return Math.round(valueCm / gridCm) * gridCm;
}

/** `snapToGrid` on both axes. */
export function snapPointToGrid(p: Vec2, gridCm: number): Vec2 {
  return { x: snapToGrid(p.x, gridCm), y: snapToGrid(p.y, gridCm) };
}

/** Rotation snaps to 15° — the increments people actually want, plus the diagonals. */
export const ROTATION_SNAP_DEG = 15;

/** Fold an angle into [0, 360). Negatives and multiple turns both come home. */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/**
 * Nearest multiple of `stepDeg`, normalized.
 *
 * The normalization is the point: 358° snapped to 15° rounds up to 360°, and
 * storing 360 would make a rotation that reads as "none" compare unequal to 0.
 */
export function snapAngle(deg: number, stepDeg: number): number {
  if (stepDeg <= 0) return normalizeAngle(deg);
  return normalizeAngle(Math.round(deg / stepDeg) * stepDeg);
}
