/**
 * Composite geometry for the seven MVP rules.
 *
 * Deliberately separate from `geometry.ts`. That file holds primitives that are
 * true by construction — a separating-axis test is either right or wrong. This
 * file holds *interpretations*: what "directly in line with the door" or "a
 * cramped walkway" means as a shape. Those are arguable, and they should be
 * arguable in one file that a domain expert can be walked through.
 *
 * All lengths are centimetres; coordinate and angle conventions are
 * `geometry.ts`'s.
 */

import {
  doorCenter,
  hasLineOfSight,
  rectAabb,
  wallInwardNormal,
  type Aabb,
  type OrientedRect,
  type Vec2,
} from './geometry';
import type { Door, FurnitureItem, Layout, Room } from './types';
import { openingEndpoints } from './walls';

/** Where a rule looks for doors: the main entrance, or every door. */
export type DoorScope = 'main' | 'all';

/**
 * A rectangle `lengthCm` long in `direction`, `widthCm` across, starting at
 * `origin`.
 *
 * The shape behind every "band" in this file: the door's corridor, the entry
 * path, the threshold zone, the mirror's beam. `direction` must be a unit
 * vector.
 */
export function projectedBand(
  origin: Vec2,
  direction: Vec2,
  lengthCm: number,
  widthCm: number,
): OrientedRect {
  // facingVector(deg) = (sin deg, −cos deg); invert it to get the rect's angle.
  const rotationDeg = (Math.atan2(direction.x, -direction.y) * 180) / Math.PI;
  return {
    cx: origin.x + direction.x * (lengthCm / 2),
    cy: origin.y + direction.y * (lengthCm / 2),
    width: widthCm,
    height: lengthCm,
    rotationDeg,
  };
}

/** How deep the room is along a door's inward normal. */
function roomDepthFrom(door: Door, room: Room): number {
  return door.wall === 'north' || door.wall === 'south' ? room.lengthCm : room.widthCm;
}

/**
 * A band projected inward from a door, `depthCm` deep.
 *
 * `widthFactor` scales the door's own width, so a double door widens the zone
 * in proportion rather than needing its own threshold.
 */
export function doorBand(
  door: Door,
  room: Room,
  depthCm: number,
  widthFactor: number,
): OrientedRect {
  return projectedBand(
    doorCenter(door, room),
    wallInwardNormal(door.wall),
    depthCm,
    door.widthCm * widthFactor,
  );
}

/**
 * The strip of floor directly in the door's line, all the way across the room.
 *
 * This is this codebase's reading of "directly in line with the door" (rules 1
 * and 2). It is one of at least three defensible readings — a ray, a cone from
 * the door, or this axis-aligned corridor. The corridor wins because it is
 * hand-verifiable on graph paper, which is what the fixtures need.
 */
export function doorAxisCorridor(door: Door, room: Room, widthFactor: number): OrientedRect {
  return doorBand(door, room, roomDepthFrom(door, room), widthFactor);
}

/**
 * Three points across the door opening, at 25/50/75%.
 *
 * Not the raw endpoints: those sit exactly on the wall line, where collinear
 * segment tests flap. Three rather than one because a door is ~80 cm wide and a
 * bookshelf clipping one edge of it does not blind you.
 */
export function doorSightPoints(door: Door, room: Room): [Vec2, Vec2, Vec2] {
  const [a, b] = openingEndpoints({ wall: door.wall, offsetCm: door.offsetCm }, door.widthCm, room);
  const at = (t: number): Vec2 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  return [at(0.25), at(0.5), at(0.75)];
}

/** Can `from` see any part of the door opening past `obstacles`? */
export function canSeeDoor(
  from: Vec2,
  door: Door,
  room: Room,
  obstacles: readonly OrientedRect[],
): boolean {
  return doorSightPoints(door, room).some((p) => hasLineOfSight(from, p, [...obstacles]));
}

/**
 * The strip a mirror reflects into: `maxRangeCm` forward of its face, as wide
 * as the mirror.
 *
 * As wide as the mirror because a reflection off *any* point of a 60 cm surface
 * counts — the band is exactly the set of rays normal to the face. Occlusion is
 * not tested: a mirror is usually mounted above a dresser and still reflects
 * over it.
 */
export function mirrorBeam(mirror: FurnitureItem, maxRangeCm: number): OrientedRect {
  const forward = {
    x: Math.sin((mirror.rotationDeg * Math.PI) / 180),
    y: -Math.cos((mirror.rotationDeg * Math.PI) / 180),
  };
  // Start at the reflecting face, not the centre, so a deep frame does not
  // shorten the beam.
  const faceOffset = mirror.depthCm / 2;
  const origin = { x: mirror.xCm + forward.x * faceOffset, y: mirror.yCm + forward.y * faceOffset };
  return projectedBand(origin, forward, maxRangeCm, mirror.widthCm);
}

/** A gap between two items, and the axis it is measured along. */
export interface ChannelGap {
  gapCm: number;
  axis: 'x' | 'y';
}

/**
 * The walkway gap between two bounding boxes, or null when there isn't one.
 *
 * Null for diagonally offset items: with no overlap perpendicular to the gap
 * there is no channel to walk down, only a corner-to-corner distance, and
 * treating that as a cramped walkway is how rule 4 would cry wolf on every real
 * layout.
 *
 * Boxes are axis-aligned, so a rotated item is measured by its bounding box and
 * the gap is under-reported for it. Accepted for the MVP.
 */
export function channelGap(a: Aabb, b: Aabb): ChannelGap | null {
  const sx = Math.max(a.minX, b.minX) - Math.min(a.maxX, b.maxX);
  const sy = Math.max(a.minY, b.minY) - Math.min(a.maxY, b.maxY);

  if (sx > 0 && sy > 0) return null; // diagonal — not a channel
  if (sx <= 0 && sy <= 0) return { gapCm: 0, axis: sx > sy ? 'x' : 'y' }; // overlapping
  return sx > 0 ? { gapCm: sx, axis: 'x' } : { gapCm: sy, axis: 'y' };
}

/** The doors a rule looks at. `'main'` falls back to the first door. */
export function doorsInScope(layout: Layout, scope: DoorScope): Door[] {
  if (scope === 'all') return layout.doors;
  const main = layout.doors.find((d) => d.isMain) ?? layout.doors[0];
  return main ? [main] : [];
}
