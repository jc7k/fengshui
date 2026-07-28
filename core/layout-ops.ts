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

import type { Door, FurnitureItem, Layout, Window } from './types';
import type { WallPlacement } from './walls';

/** Standard opening sizes, cm. Roughly a 32" door and a 4' window. */
export const DEFAULT_DOOR_WIDTH_CM = 81;
export const DEFAULT_WINDOW_WIDTH_CM = 120;

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
