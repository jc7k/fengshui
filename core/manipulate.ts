/**
 * The maths behind grabbing, resizing and rotating a furniture item.
 *
 * This is interaction logic, but none of it is UI: it takes a point in room
 * centimetres and returns a hit or a new geometry. Keeping it here means the
 * two mistakes that make an editor feel broken — a resize that drags the whole
 * item along with the corner, and a rotation that is 90° out — are caught by
 * Vitest instead of by a person squinting at a canvas.
 *
 * Every coordinate below is room centimetres, the frame `pxPointToRoom`
 * produces. Angles follow `geometry.ts`: degrees clockwise, 0° faces north.
 */

import {
  facingVector,
  furnitureRect,
  pointInRect,
  rectCorners,
  rotate,
  type Vec2,
} from './geometry';
import { snapToGrid, normalizeAngle } from './grid';
import type { FurnitureTransform } from './layout-ops';
import type { FurnitureItem, Layout } from './types';

/** A corner, named for where it sits in the item's own unrotated frame. */
export type Corner = 'nw' | 'ne' | 'se' | 'sw';

export type HandleKind = Corner | 'rotate';

/** A grab point drawn on the selected item, in room centimetres. */
export interface Handle {
  kind: HandleKind;
  x: number;
  y: number;
}

/** Clockwise from the item's own top-left — the order `rectCorners` returns. */
const CORNER_ORDER: readonly Corner[] = ['nw', 'ne', 'se', 'sw'];

/** Which way each corner lies from the centre, in the item's own frame. */
const CORNER_SIGNS: Record<Corner, { x: number; y: number }> = {
  nw: { x: -1, y: -1 },
  ne: { x: 1, y: -1 },
  se: { x: 1, y: 1 },
  sw: { x: -1, y: 1 },
};

/**
 * The item under a point, or null.
 *
 * Later items win, because they are drawn later and so are the ones the user
 * sees on top. Containment is against the rotated rect, not its bounding box —
 * a rotated sofa should not swallow clicks in the empty corners around it.
 *
 * `minPickCm` is the smallest extent the hit test will use on either axis. A
 * mirror is 5 cm deep and would otherwise be a line nobody can hit.
 */
export function furnitureAt(
  point: Vec2,
  layout: Layout,
  minPickCm = 0,
): FurnitureItem | null {
  for (let i = layout.furniture.length - 1; i >= 0; i--) {
    const item = layout.furniture[i];
    const rect = furnitureRect(item);
    const hit = pointInRect(point, {
      ...rect,
      width: Math.max(rect.width, minPickCm),
      height: Math.max(rect.height, minPickCm),
    });
    if (hit) return item;
  }
  return null;
}

/**
 * The handles for a selected item: four corners, plus a rotate knob.
 *
 * The knob sits `knobDistanceCm` beyond the front edge along the item's facing,
 * so it doubles as the indicator of which way the item points — which for a bed
 * is the whole of REQ-011 rule 2.
 */
export function itemHandles(item: FurnitureItem, knobDistanceCm: number): Handle[] {
  const handles: Handle[] = rectCorners(furnitureRect(item)).map((p, i) => ({
    kind: CORNER_ORDER[i],
    x: p.x,
    y: p.y,
  }));

  const forward = facingVector(item.rotationDeg);
  const reach = item.depthCm / 2 + knobDistanceCm;
  handles.push({
    kind: 'rotate',
    x: item.xCm + forward.x * reach,
    y: item.yCm + forward.y * reach,
  });

  return handles;
}

/** The handle within `radiusCm` of a point, nearest first, or null. */
export function hitHandle(
  point: Vec2,
  item: FurnitureItem,
  knobDistanceCm: number,
  radiusCm: number,
): HandleKind | null {
  let best: HandleKind | null = null;
  let bestDistance = radiusCm;
  for (const handle of itemHandles(item, knobDistanceCm)) {
    const d = Math.hypot(point.x - handle.x, point.y - handle.y);
    if (d <= bestDistance) {
      bestDistance = d;
      best = handle.kind;
    }
  }
  return best;
}

export interface ResizeOptions {
  /** Smallest extent either axis may end up with, cm. */
  minSizeCm: number;
  /** Grid the new extents snap to. Non-positive means no snapping. */
  gridCm: number;
}

/**
 * Drag a corner to a new point; the opposite corner stays planted.
 *
 * **The whole thing happens in the item's own frame.** Undo the rotation, work
 * out the new extents against the anchor, then rotate the new centre back. The
 * obvious world-space version — set the AABB from the two corners — is correct
 * only at 0°; on a rotated item the anchor slides away under the pointer.
 *
 * Extents are measured *away from the anchor* rather than as an absolute
 * difference, so dragging the pointer past the anchor clamps at `minSizeCm`
 * instead of flipping the item inside out. Snapping applies to the extents, not
 * to the pointer: a grid-aligned size off a grid-aligned anchor lands the
 * dragged corner on the grid too, and unlike snapping the raw point it still
 * means something when the item is rotated.
 */
export function resizeFromCorner(
  item: FurnitureItem,
  corner: Corner,
  pointCm: Vec2,
  { minSizeCm, gridCm }: ResizeOptions,
): FurnitureTransform {
  const sign = CORNER_SIGNS[corner];
  const local = rotate(
    { x: pointCm.x - item.xCm, y: pointCm.y - item.yCm },
    -item.rotationDeg,
  );

  const anchorX = -sign.x * (item.widthCm / 2);
  const anchorY = -sign.y * (item.depthCm / 2);

  const widthCm = Math.max(minSizeCm, snapToGrid((local.x - anchorX) * sign.x, gridCm));
  const depthCm = Math.max(minSizeCm, snapToGrid((local.y - anchorY) * sign.y, gridCm));

  const centre = rotate(
    { x: anchorX + sign.x * (widthCm / 2), y: anchorY + sign.y * (depthCm / 2) },
    item.rotationDeg,
  );

  return {
    xCm: item.xCm + centre.x,
    yCm: item.yCm + centre.y,
    widthCm,
    depthCm,
  };
}

/**
 * The rotation that points the item's front at the pointer.
 *
 * `atan2(dx, -dy)` and not `atan2(dy, dx)`: the convention is 0° = north and
 * clockwise, so the arguments are swapped and y is negated. The naive form is
 * 90° out and reads as a working editor until someone checks which way a bed
 * faces. A pointer on the centre leaves the rotation alone.
 */
export function rotationFromPointer(item: FurnitureItem, pointCm: Vec2): number {
  const dx = pointCm.x - item.xCm;
  const dy = pointCm.y - item.yCm;
  if (dx === 0 && dy === 0) return normalizeAngle(item.rotationDeg);
  return normalizeAngle((Math.atan2(dx, -dy) * 180) / Math.PI);
}
