/**
 * Geometry for the rule engine.
 *
 * Scope is deliberately the seven MVP rules (PRD §4.3) and nothing else:
 * overlap and clearance (rules 4, 5), line of sight to the door (rules 1, 3),
 * facing and alignment (rules 1, 2, 6), and area share (rule 7).
 *
 * Coordinates: x increases right, y increases **down** — screen convention, so
 * canvas code needs no axis flip. Angles are degrees, clockwise, and 0° faces
 * north (up). In a y-down frame the standard rotation matrix already turns
 * clockwise, so no sign juggling is needed anywhere below.
 *
 * All lengths are centimetres.
 */

import type { Door, FurnitureItem, Room, Wall } from './types';

export interface Vec2 {
  x: number;
  y: number;
}

/** A rectangle positioned by its centre and rotated about it. */
export interface OrientedRect {
  cx: number;
  cy: number;
  width: number;
  height: number;
  rotationDeg: number;
}

export interface Aabb {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const EPSILON = 1e-9;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/** Rotate `v` clockwise by `deg` about the origin. */
export function rotate(v: Vec2, deg: number): Vec2 {
  const r = toRad(deg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/**
 * The unit vector an item at `rotationDeg` faces.
 *
 * 0° → north (0, −1); 90° → east; 180° → south; 270° → west.
 */
export function facingVector(rotationDeg: number): Vec2 {
  const r = toRad(rotationDeg);
  return { x: Math.sin(r), y: -Math.cos(r) };
}

/** The four corners, clockwise from the item's own top-left. */
export function rectCorners(rect: OrientedRect): [Vec2, Vec2, Vec2, Vec2] {
  const hw = rect.width / 2;
  const hh = rect.height / 2;
  const local: Vec2[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return local.map((p) => {
    const r = rotate(p, rect.rotationDeg);
    return { x: r.x + rect.cx, y: r.y + rect.cy };
  }) as [Vec2, Vec2, Vec2, Vec2];
}

/** Axis-aligned bounding box of a rotated rect. */
export function rectAabb(rect: OrientedRect): Aabb {
  const xs = rectCorners(rect).map((p) => p.x);
  const ys = rectCorners(rect).map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

export function rectArea(rect: OrientedRect): number {
  return rect.width * rect.height;
}

/** Is `p` inside `rect`? Points exactly on an edge count as inside. */
export function pointInRect(p: Vec2, rect: OrientedRect): boolean {
  // Undo the rect's rotation and compare in its own frame.
  const local = rotate({ x: p.x - rect.cx, y: p.y - rect.cy }, -rect.rotationDeg);
  return (
    Math.abs(local.x) <= rect.width / 2 + EPSILON &&
    Math.abs(local.y) <= rect.height / 2 + EPSILON
  );
}

/**
 * Do two rotated rects overlap? Separating-axis test.
 *
 * Touching edges do not count as overlapping — that matters for clearance,
 * where two items flush against each other are 0 cm apart but not intersecting.
 */
export function rectsIntersect(a: OrientedRect, b: OrientedRect): boolean {
  const axes = [
    rotate({ x: 1, y: 0 }, a.rotationDeg),
    rotate({ x: 0, y: 1 }, a.rotationDeg),
    rotate({ x: 1, y: 0 }, b.rotationDeg),
    rotate({ x: 0, y: 1 }, b.rotationDeg),
  ];
  const ca = rectCorners(a);
  const cb = rectCorners(b);

  for (const axis of axes) {
    const pa = ca.map((p) => p.x * axis.x + p.y * axis.y);
    const pb = cb.map((p) => p.x * axis.x + p.y * axis.y);
    if (Math.max(...pa) <= Math.min(...pb) + EPSILON) return false;
    if (Math.max(...pb) <= Math.min(...pa) + EPSILON) return false;
  }
  return true;
}

/** Shortest distance from a point to a line segment. */
export function distancePointToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < EPSILON) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * abx), p.y - (a.y + t * aby));
}

/** Do two segments cross? Proper intersections and touching both count. */
export function segmentsIntersect(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): boolean {
  const cross = (o: Vec2, p: Vec2, q: Vec2): number =>
    (p.x - o.x) * (q.y - o.y) - (p.y - o.y) * (q.x - o.x);

  const d1 = cross(b1, b2, a1);
  const d2 = cross(b1, b2, a2);
  const d3 = cross(a1, a2, b1);
  const d4 = cross(a1, a2, b2);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  // Collinear-and-overlapping cases.
  const onSegment = (p: Vec2, q: Vec2, r: Vec2): boolean =>
    Math.abs(cross(p, q, r)) < EPSILON &&
    Math.min(p.x, q.x) - EPSILON <= r.x &&
    r.x <= Math.max(p.x, q.x) + EPSILON &&
    Math.min(p.y, q.y) - EPSILON <= r.y &&
    r.y <= Math.max(p.y, q.y) + EPSILON;

  return (
    onSegment(b1, b2, a1) ||
    onSegment(b1, b2, a2) ||
    onSegment(a1, a2, b1) ||
    onSegment(a1, a2, b2)
  );
}

/** Does the segment `p→q` touch `rect` at all (crossing it or ending inside)? */
export function segmentIntersectsRect(p: Vec2, q: Vec2, rect: OrientedRect): boolean {
  if (pointInRect(p, rect) || pointInRect(q, rect)) return true;
  const c = rectCorners(rect);
  for (let i = 0; i < 4; i++) {
    if (segmentsIntersect(p, q, c[i], c[(i + 1) % 4])) return true;
  }
  return false;
}

/**
 * Shortest distance between two rects — the clearance between them.
 *
 * 0 when they overlap or touch. This is what rule 4 (walkway clearance) and
 * rule 5 (door swing) measure against.
 */
export function rectDistance(a: OrientedRect, b: OrientedRect): number {
  if (rectsIntersect(a, b)) return 0;
  const ca = rectCorners(a);
  const cb = rectCorners(b);
  let min = Infinity;
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      min = Math.min(min, distancePointToSegment(ca[i], cb[j], cb[(j + 1) % 4]));
      min = Math.min(min, distancePointToSegment(cb[j], ca[i], ca[(i + 1) % 4]));
    }
  }
  return min;
}

/**
 * Can `from` see `to` without an obstacle in the way?
 *
 * An obstacle containing either endpoint counts as blocking, so callers must
 * exclude the item they are asking about — the bed always blocks the view from
 * its own centre.
 */
export function hasLineOfSight(from: Vec2, to: Vec2, obstacles: OrientedRect[]): boolean {
  return !obstacles.some((o) => segmentIntersectsRect(from, to, o));
}

/** Smallest angle between two vectors, 0–180°. */
export function angleBetween(a: Vec2, b: Vec2): number {
  const la = Math.hypot(a.x, a.y);
  const lb = Math.hypot(b.x, b.y);
  if (la < EPSILON || lb < EPSILON) return 0;
  const cos = Math.min(1, Math.max(-1, (a.x * b.x + a.y * b.y) / (la * lb)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Is `target` within `toleranceDeg` of straight ahead of `item`?
 *
 * Rule 2 asks exactly this of a bed and a door: feet pointing at the opening.
 */
export function isFacing(
  item: FurnitureItem,
  target: Vec2,
  toleranceDeg: number,
): boolean {
  const forward = facingVector(item.rotationDeg);
  const toTarget = { x: target.x - item.xCm, y: target.y - item.yCm };
  return angleBetween(forward, toTarget) <= toleranceDeg;
}

/** Is `target` within `toleranceDeg` of directly *behind* `item`? Rule 6. */
export function isBackTo(
  item: FurnitureItem,
  target: Vec2,
  toleranceDeg: number,
): boolean {
  const backward = facingVector(item.rotationDeg + 180);
  const toTarget = { x: target.x - item.xCm, y: target.y - item.yCm };
  return angleBetween(backward, toTarget) <= toleranceDeg;
}

/** The rect a furniture item occupies. */
export function furnitureRect(item: FurnitureItem): OrientedRect {
  return {
    cx: item.xCm,
    cy: item.yCm,
    width: item.widthCm,
    height: item.depthCm,
    rotationDeg: item.rotationDeg,
  };
}

/**
 * A wall's endpoints, walking the room clockwise from its top-left corner.
 *
 * north (0,0)→(W,0), east (W,0)→(W,L), south (W,L)→(0,L), west (0,L)→(0,0).
 * A door's `offsetCm` is measured from the returned start point, so the walk
 * direction is part of the data model's contract, not an implementation detail.
 */
export function wallSegment(wall: Wall, room: Room): [Vec2, Vec2] {
  const { widthCm: w, lengthCm: l } = room;
  switch (wall) {
    case 'north':
      return [{ x: 0, y: 0 }, { x: w, y: 0 }];
    case 'east':
      return [{ x: w, y: 0 }, { x: w, y: l }];
    case 'south':
      return [{ x: w, y: l }, { x: 0, y: l }];
    case 'west':
      return [{ x: 0, y: l }, { x: 0, y: 0 }];
  }
}

/** The unit vector pointing from a wall into the room. */
export function wallInwardNormal(wall: Wall): Vec2 {
  switch (wall) {
    case 'north':
      return { x: 0, y: 1 };
    case 'east':
      return { x: -1, y: 0 };
    case 'south':
      return { x: 0, y: -1 };
    case 'west':
      return { x: 1, y: 0 };
  }
}

/** The midpoint of a door's opening, in room coordinates. */
export function doorCenter(door: Door, room: Room): Vec2 {
  const [start, end] = wallSegment(door.wall, room);
  const len = Math.hypot(end.x - start.x, end.y - start.y);
  if (len < EPSILON) return { ...start };
  const along = { x: (end.x - start.x) / len, y: (end.y - start.y) / len };
  const d = door.offsetCm + door.widthCm / 2;
  return { x: start.x + along.x * d, y: start.y + along.y * d };
}

/**
 * The area a door leaf sweeps — rule 5's "don't block the entrance" zone.
 *
 * Approximated as the square that bounds the quarter-disc: as wide as the
 * opening, projecting one door-width from the wall on the swing side. The
 * square over-covers the arc's outer corner by about 21% of its area, which is
 * the conservative direction for a rule that warns about blocking a doorway.
 * `hinge` picks which end of the opening the arc pivots on, but not the bound.
 */
export function doorSwingRect(door: Door, room: Room): OrientedRect {
  const center = doorCenter(door, room);
  const inward = wallInwardNormal(door.wall);
  const sign = door.swing === 'inward' ? 1 : -1;
  const depth = door.widthCm;
  const horizontal = door.wall === 'north' || door.wall === 'south';
  return {
    cx: center.x + inward.x * sign * (depth / 2),
    cy: center.y + inward.y * sign * (depth / 2),
    width: horizontal ? door.widthCm : depth,
    height: horizontal ? depth : door.widthCm,
    rotationDeg: 0,
  };
}

/** The room as a rect, for containment checks. */
export function roomRect(room: Room): OrientedRect {
  return {
    cx: room.widthCm / 2,
    cy: room.lengthCm / 2,
    width: room.widthCm,
    height: room.lengthCm,
    rotationDeg: 0,
  };
}

/** Share of the room's floor an item takes, 0–1. Rule 7. */
export function areaShare(item: FurnitureItem, room: Room): number {
  const roomArea = room.widthCm * room.lengthCm;
  if (roomArea < EPSILON) return 0;
  return rectArea(furnitureRect(item)) / roomArea;
}
