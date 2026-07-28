/**
 * Layout edits, as pure functions.
 *
 * Every operation returns a new `Layout` and never mutates its argument, so the
 * undo stack in REQ-009 gets its history for free and autosave in REQ-010 can
 * compare by reference.
 *
 * The one invariant enforced here: **a layout with any doors has exactly one
 * main door.** REQ-016's bagua overlay orients itself to the wall containing the
 * main door and has no fallback if that is missing or ambiguous, so it cannot be
 * left to the UI to remember — deleting the main door must promote another one.
 */

import { normalizeAngle } from './grid';
import type { Door, FurnitureItem, Layout, Window } from './types';
import type { WallPlacement } from './walls';

/** Standard opening sizes, cm. Roughly a 32" door and a 4' window. */
export const DEFAULT_DOOR_WIDTH_CM = 81;
export const DEFAULT_WINDOW_WIDTH_CM = 120;

/** No furniture is smaller than this, cm. Below it an item is unhittable. */
export const MIN_FURNITURE_CM = 20;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Restore the exactly-one-main-door invariant.
 *
 * Keeps the first door already flagged main; if none is, promotes the first
 * door. Idempotent, and safe on a layout with no doors.
 */
export function ensureMainDoor(layout: Layout): Layout {
  if (layout.doors.length === 0) return layout;

  const currentMain = layout.doors.find((d) => d.isMain);
  const mainId = currentMain ? currentMain.id : layout.doors[0].id;

  const alreadyCorrect =
    layout.doors.filter((d) => d.isMain).length === 1 && layout.doors.some((d) => d.isMain);
  if (alreadyCorrect) return layout;

  return {
    ...layout,
    doors: layout.doors.map((d) => ({ ...d, isMain: d.id === mainId })),
  };
}

export function addDoor(
  layout: Layout,
  id: string,
  placement: WallPlacement,
  widthCm = DEFAULT_DOOR_WIDTH_CM,
): Layout {
  const door: Door = {
    id,
    wall: placement.wall,
    offsetCm: placement.offsetCm,
    widthCm,
    swing: 'inward',
    hinge: 'left',
    // The first door in a room is the main one; no UI needed for the common case.
    isMain: layout.doors.length === 0,
  };
  return ensureMainDoor({ ...layout, doors: [...layout.doors, door] });
}

export function addWindow(
  layout: Layout,
  id: string,
  placement: WallPlacement,
  widthCm = DEFAULT_WINDOW_WIDTH_CM,
): Layout {
  const window: Window = {
    id,
    wall: placement.wall,
    offsetCm: placement.offsetCm,
    widthCm,
  };
  return { ...layout, windows: [...layout.windows, window] };
}

/** Move a door or window to a new wall placement. Unknown ids are a no-op. */
export function moveOpening(layout: Layout, id: string, placement: WallPlacement): Layout {
  return {
    ...layout,
    doors: layout.doors.map((d) => (d.id === id ? { ...d, ...placement } : d)),
    windows: layout.windows.map((w) => (w.id === id ? { ...w, ...placement } : w)),
  };
}

/**
 * Delete a door or window.
 *
 * Deleting the main door promotes the next one, so a layout never ends up with
 * doors but no anchor for the bagua grid.
 */
export function removeOpening(layout: Layout, id: string): Layout {
  return ensureMainDoor({
    ...layout,
    doors: layout.doors.filter((d) => d.id !== id),
    windows: layout.windows.filter((w) => w.id !== id),
  });
}

/** Designate the main door. Ignores ids that are not doors. */
export function setMainDoor(layout: Layout, id: string): Layout {
  if (!layout.doors.some((d) => d.id === id)) return layout;
  return {
    ...layout,
    doors: layout.doors.map((d) => ({ ...d, isMain: d.id === id })),
  };
}

/** Flip a door's swing between inward and outward. */
export function toggleDoorSwing(layout: Layout, id: string): Layout {
  return {
    ...layout,
    doors: layout.doors.map((d) =>
      d.id === id ? { ...d, swing: d.swing === 'inward' ? 'outward' : 'inward' } : d,
    ),
  };
}

export function addFurniture(layout: Layout, item: FurnitureItem): Layout {
  return { ...layout, furniture: [...layout.furniture, item] };
}

export function removeFurniture(layout: Layout, id: string): Layout {
  return { ...layout, furniture: layout.furniture.filter((f) => f.id !== id) };
}

/** Patch one item. Unknown ids are a no-op, as with the opening ops. */
function updateFurniture(
  layout: Layout,
  id: string,
  patch: Partial<FurnitureItem>,
): Layout {
  return {
    ...layout,
    furniture: layout.furniture.map((f) => (f.id === id ? { ...f, ...patch } : f)),
  };
}

/**
 * Move an item's centre.
 *
 * The *centre* is clamped to the room, not the item's footprint: a dresser is
 * allowed to overhang a wall, which is how a user says "against the wall", but
 * nothing can be dragged past the edge and lost somewhere off-canvas with no
 * way to select it again.
 */
export function moveFurniture(layout: Layout, id: string, xCm: number, yCm: number): Layout {
  return updateFurniture(layout, id, {
    xCm: clamp(xCm, 0, layout.room.widthCm),
    yCm: clamp(yCm, 0, layout.room.lengthCm),
  });
}

/** Position and size together — what a corner drag produces. */
export interface FurnitureTransform {
  xCm: number;
  yCm: number;
  widthCm: number;
  depthCm: number;
}

/**
 * Reposition and resize in one go.
 *
 * A corner drag moves the centre and changes the extents at the same time, and
 * this is deliberately a single operation rather than a move followed by a
 * resize: REQ-009's undo stack counts state transitions, and one drag should be
 * one undo. Same centre clamp as `moveFurniture`, and extents floor at
 * `MIN_FURNITURE_CM`.
 */
export function transformFurniture(
  layout: Layout,
  id: string,
  transform: FurnitureTransform,
): Layout {
  return updateFurniture(layout, id, {
    xCm: clamp(transform.xCm, 0, layout.room.widthCm),
    yCm: clamp(transform.yCm, 0, layout.room.lengthCm),
    widthCm: Math.max(MIN_FURNITURE_CM, transform.widthCm),
    depthCm: Math.max(MIN_FURNITURE_CM, transform.depthCm),
  });
}

/** Set an item's rotation, folded into [0, 360). */
export function rotateFurniture(layout: Layout, id: string, rotationDeg: number): Layout {
  return updateFurniture(layout, id, { rotationDeg: normalizeAngle(rotationDeg) });
}

/**
 * Name an item, or clear its name.
 *
 * Clearing removes the key rather than storing `""`: `types.ts` requires the
 * layout to round-trip through JSON unchanged, and "unset" has exactly one
 * representation there — absent.
 */
export function labelFurniture(layout: Layout, id: string, label: string): Layout {
  return {
    ...layout,
    furniture: layout.furniture.map((f) => {
      if (f.id !== id) return f;
      if (label.trim() === '') {
        const cleared: FurnitureItem = { ...f };
        delete cleared.label;
        return cleared;
      }
      return { ...f, label };
    }),
  };
}
