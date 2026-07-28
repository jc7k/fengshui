/**
 * Attaching openings to walls.
 *
 * Doors and windows live on a wall, never in open floor, so a drag does not
 * produce a free (x, y) — it produces a wall and a distance along it. Snapping
 * is therefore not a UI nicety layered on top of placement; it *is* placement,
 * which is why it lives here and is tested rather than eyeballed.
 */

import { distancePointToSegment, wallSegment } from './geometry';
import type { Vec2 } from './geometry';
import type { Layout, Room, Wall } from './types';

export interface WallPlacement {
  wall: Wall;
  offsetCm: number;
}

export const WALLS: readonly Wall[] = ['north', 'east', 'south', 'west'];

/** How long a wall is, in centimetres. */
export function wallLength(wall: Wall, room: Room): number {
  return wall === 'north' || wall === 'south' ? room.widthCm : room.lengthCm;
}

/** Perpendicular distance from a point to a wall's line. */
export function distanceToWall(point: Vec2, wall: Wall, room: Room): number {
  switch (wall) {
    case 'north':
      return Math.abs(point.y);
    case 'south':
      return Math.abs(room.lengthCm - point.y);
    case 'west':
      return Math.abs(point.x);
    case 'east':
      return Math.abs(room.widthCm - point.x);
  }
}

/**
 * The wall a point belongs to — the nearest one.
 *
 * Ties resolve in WALLS order (north, east, south, west), so the result is
 * deterministic for a point at the exact centre of a square room rather than
 * depending on floating-point noise.
 */
export function nearestWall(point: Vec2, room: Room): Wall {
  let best: Wall = 'north';
  let bestDistance = Infinity;
  for (const wall of WALLS) {
    const d = distanceToWall(point, wall, room);
    if (d < bestDistance) {
      bestDistance = d;
      best = wall;
    }
  }
  return best;
}

/**
 * How far along a wall a point sits, measured from the wall's start corner.
 *
 * Walls are walked clockwise from the room's top-left (see `wallSegment`), so
 * south and west count backwards relative to the x and y axes. Getting this
 * backwards would mirror every door on two of the four walls.
 */
export function projectOntoWall(point: Vec2, wall: Wall, room: Room): number {
  switch (wall) {
    case 'north':
      return point.x;
    case 'east':
      return point.y;
    case 'south':
      return room.widthCm - point.x;
    case 'west':
      return room.lengthCm - point.y;
  }
}

/**
 * Snap a dragged point to a wall placement for an opening of `openingWidthCm`.
 *
 * The returned offset keeps the whole opening on the wall: a door dragged past
 * a corner stops flush with it rather than hanging off the end or wrapping onto
 * the neighbouring wall. An opening wider than its wall is pinned at 0 rather
 * than given a negative offset.
 */
export function snapToWall(
  point: Vec2,
  room: Room,
  openingWidthCm: number,
): WallPlacement {
  const wall = nearestWall(point, room);
  const length = wallLength(wall, room);
  // The point is where the user is pointing, i.e. the opening's centre.
  const centre = projectOntoWall(point, wall, room);
  const maxOffset = Math.max(0, length - openingWidthCm);
  const offsetCm = Math.min(maxOffset, Math.max(0, centre - openingWidthCm / 2));
  return { wall, offsetCm };
}

/** The two endpoints of an opening, in room coordinates. */
export function openingEndpoints(
  placement: WallPlacement,
  openingWidthCm: number,
  room: Room,
): [Vec2, Vec2] {
  const [start, end] = wallSegment(placement.wall, room);
  const length = Math.hypot(end.x - start.x, end.y - start.y);
  if (length === 0) return [{ ...start }, { ...start }];
  const along = { x: (end.x - start.x) / length, y: (end.y - start.y) / length };
  const a = {
    x: start.x + along.x * placement.offsetCm,
    y: start.y + along.y * placement.offsetCm,
  };
  const b = {
    x: a.x + along.x * openingWidthCm,
    y: a.y + along.y * openingWidthCm,
  };
  return [a, b];
}

/** A door or window, identified for hit-testing. */
export interface OpeningRef {
  id: string;
  kind: 'door' | 'window';
  widthCm: number;
}

/**
 * The opening nearest a point, within `maxDistanceCm`, or null.
 *
 * Doors win ties against windows at equal distance, because a door is the more
 * consequential thing to grab by accident — every rule in REQ-011 that reasons
 * about the entrance depends on where it sits.
 */
export function nearestOpening(
  point: Vec2,
  layout: Layout,
  maxDistanceCm: number,
): OpeningRef | null {
  let best: OpeningRef | null = null;
  let bestDistance = maxDistanceCm;

  const consider = (id: string, kind: 'door' | 'window', wall: Wall, offsetCm: number, widthCm: number) => {
    const [a, b] = openingEndpoints({ wall, offsetCm }, widthCm, layout.room);
    const d = distancePointToSegment(point, a, b);
    if (d <= bestDistance) {
      bestDistance = d;
      best = { id, kind, widthCm };
    }
  };

  for (const w of layout.windows) consider(w.id, 'window', w.wall, w.offsetCm, w.widthCm);
  for (const d of layout.doors) consider(d.id, 'door', d.wall, d.offsetCm, d.widthCm);

  return best;
}
