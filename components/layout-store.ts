/**
 * The editor's state, as named commands, with an undo stack underneath
 * (PRD §4.2, §6).
 *
 * Three tiers live here, deliberately kept apart:
 *
 *   - the `Layout` — the design itself, the only thing undone, and the only
 *     thing REQ-010 persists;
 *   - `selectedId` and `snapEnabled` — editor UI, not part of the design, never
 *     persisted and never undone;
 *   - `past` / `future` / `nextId` — the machinery, and nothing else. Transient
 *     drag state belongs in refs inside the gesture hook, because holding it in
 *     React state rebuilds the Gesture mid-drag.
 *
 * **History is snapshots, not commands.** A `Layout` is a small JSON object and
 * every op in `core/layout-ops` already returns a new one, so an undo entry is
 * just the previous object. That sidesteps the two hard parts of a command log:
 * no inverse per operation, and no re-minting of ids on redo.
 *
 * **The store is vanilla, not a React hook.** `createStore` runs in a plain node
 * process, so the sequencing tests next door need no renderer, no DOM and no
 * `react-native` module resolution. `use-layout-editor.ts` is the React binding
 * over it and holds no state of its own.
 *
 * **`layout` is the one readable thing.** REQ-010's autosave watches it and
 * therefore cannot disagree with undo: an undo is a state change like any other,
 * not an event to be replayed against something else.
 */
import { createStore } from 'zustand/vanilla';

import {
  addDoor as coreAddDoor,
  addFurniture as coreAddFurniture,
  addWindow as coreAddWindow,
  createFurnitureItem,
  DEFAULT_DOOR_WIDTH_CM,
  DEFAULT_WINDOW_WIDTH_CM,
  gridSizeCm,
  labelFurniture as coreLabelFurniture,
  moveFurniture as coreMoveFurniture,
  moveOpening as coreMoveOpening,
  removeFurniture,
  removeOpening,
  rotateFurniture as coreRotateFurniture,
  setMainDoor as coreSetMainDoor,
  snapPointToGrid,
  snapToWall,
  toggleDoorSwing as coreToggleDoorSwing,
  transformFurniture as coreTransformFurniture,
  WALLS,
  type FurnitureTransform,
  type FurnitureType,
  type Layout,
  type RoomType,
  type Unit,
  type WallPlacement,
} from '../core';

/**
 * How many undo steps to keep.
 *
 * Deeper than any session reaches back by hand, and bounded: a snapshot is small
 * but an unbounded stack over a long session is not (REQ-009 open question).
 */
export const HISTORY_LIMIT = 50;

/**
 * The next free number for `${prefix}-${n}` ids.
 *
 * Seeded from what the layout already contains rather than from 1, because
 * REQ-010 will hand this store a layout loaded from the database: restarting the
 * counter would mint ids that collide with stored ones, and the collision shows
 * up as the wrong item moving, not as an error.
 */
function seedIdCounter(layout: Layout): number {
  let max = 0;
  for (const { id } of [...layout.doors, ...layout.windows, ...layout.furniture]) {
    const n = Number.parseInt(id.slice(id.lastIndexOf('-') + 1), 10);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max + 1;
}

/**
 * Where a new opening lands before the user drags it.
 *
 * Cycles through the walls so successive additions do not stack invisibly on
 * top of each other — two doors at the identical spot look like one.
 */
function nextPlacement(l: Layout, widthCm: number): WallPlacement {
  const wall = WALLS[(l.doors.length + l.windows.length) % WALLS.length];
  const centre = {
    north: { x: l.room.widthCm / 2, y: 0 },
    east: { x: l.room.widthCm, y: l.room.lengthCm / 2 },
    south: { x: l.room.widthCm / 2, y: l.room.lengthCm },
    west: { x: 0, y: l.room.lengthCm / 2 },
  }[wall];
  return snapToWall(centre, l.room, widthCm);
}

/** Push onto a history stack, dropping the oldest entry once it is full. */
function pushHistory(stack: Layout[], entry: Layout): Layout[] {
  const next = [...stack, entry];
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
}

/** Whether an id still refers to something. False for null, so it reads as a guard. */
function present(layout: Layout, id: string | null): boolean {
  if (!id) return false;
  return (
    layout.doors.some((d) => d.id === id) ||
    layout.windows.some((w) => w.id === id) ||
    layout.furniture.some((f) => f.id === id)
  );
}

/**
 * What the editor exposes: the current design, the editor's own UI state, and
 * every way to change either.
 *
 * `layout` is read; it is never written from outside. That is the seam REQ-009
 * was built against — each command is one named operation producing one new
 * `Layout`, so putting history underneath them changed nothing that calls them.
 */
export interface LayoutCommands {
  layout: Layout;
  selectedId: string | null;
  snapEnabled: boolean;
  select: (id: string | null) => void;
  toggleSnap: () => void;
  setRoomType: (roomType: RoomType) => void;
  setDimensions: (widthCm: number, lengthCm: number) => void;
  setUnit: (unit: Unit) => void;
  addDoor: () => void;
  addWindow: () => void;
  moveOpening: (id: string, placement: WallPlacement) => void;
  setMainDoor: (id: string) => void;
  toggleDoorSwing: () => void;
  placeFurniture: (type: FurnitureType, xCm: number, yCm: number) => void;
  moveFurniture: (id: string, xCm: number, yCm: number) => void;
  transformFurniture: (id: string, transform: FurnitureTransform) => void;
  rotateFurniture: (id: string, rotationDeg: number) => void;
  labelFurniture: (id: string, label: string) => void;
  deleteSelected: () => void;
  undo: () => void;
  redo: () => void;
  /**
   * Open a coalescing scope: everything until `endEntry` is one undo entry.
   *
   * For interactions that fire a command per input event — a drag, a number
   * being typed — where the entries a user wants are the interactions, not the
   * events. Opening a scope is free: if nothing changed by the time it closes,
   * no entry is recorded, which is what a tap on empty canvas is.
   */
  beginEntry: () => void;
  endEntry: () => void;
}

/** The store's state: the above, plus the history the two verbs walk. */
export interface LayoutState extends LayoutCommands {
  /** Previous layouts, oldest first. The last element is one undo away. */
  past: Layout[];
  /** Undone layouts. The last element is one redo away. */
  future: Layout[];
  /** The layout as an open coalescing scope found it, or null if none is open. */
  entryBase: Layout | null;
  /** Monotonic id counter, outside history so undo cannot make it reissue an id. */
  nextId: number;
}

export const canUndo = (s: LayoutState): boolean => s.past.length > 0;
export const canRedo = (s: LayoutState): boolean => s.future.length > 0;

export function createLayoutStore(initial: Layout) {
  return createStore<LayoutState>((set, get) => {
    /**
     * Apply a pure op to the layout. One call is one undo entry — unless a
     * coalescing scope is open, in which case the layout moves and history waits
     * for `endEntry`.
     */
    const edit = (op: (l: Layout) => Layout) => {
      const { layout, entryBase, past } = get();
      const next = op(layout);
      // The ops return the layout itself when there is nothing to do, e.g.
      // `setMainDoor` on an id that is not a door.
      if (next === layout) return;
      if (entryBase) {
        set({ layout: next });
        return;
      }
      set({ layout: next, past: pushHistory(past, layout), future: [] });
    };

    const makeId = (prefix: string) => {
      const n = get().nextId;
      set({ nextId: n + 1 });
      return `${prefix}-${n}`;
    };

    const addDoor = () => {
      const id = makeId('door');
      edit((l) => coreAddDoor(l, id, nextPlacement(l, DEFAULT_DOOR_WIDTH_CM)));
      set({ selectedId: id });
    };

    const addWindow = () => {
      const id = makeId('window');
      edit((l) => coreAddWindow(l, id, nextPlacement(l, DEFAULT_WINDOW_WIDTH_CM)));
      set({ selectedId: id });
    };

    /**
     * Add an item centred on a point — a chip dropped on the canvas, or pressed.
     *
     * Added and then moved to the same place, because a drop can land in the
     * padding outside the room and `moveFurniture` already owns the clamp that
     * keeps a centre inside it. Two pure calls, still one state transition.
     */
    const placeFurniture = (type: FurnitureType, xCm: number, yCm: number) => {
      const id = makeId(type);
      edit((l) => {
        // Snap the drop too, not just later drags — otherwise the first thing the
        // toggle does after you turn it on is let an item land off-grid.
        const p = snapPointToGrid(
          { x: xCm, y: yCm },
          get().snapEnabled ? gridSizeCm(l.displayUnit) : 0,
        );
        return coreMoveFurniture(
          coreAddFurniture(l, createFurnitureItem(id, type, p.x, p.y)),
          id,
          p.x,
          p.y,
        );
      });
      set({ selectedId: id });
    };

    /**
     * Delete whatever is selected.
     *
     * Dispatching on what the id refers to is the point: one `selectedId` slot is
     * shared by doors, windows and furniture, so a `removeOpening` here would
     * silently do nothing when an item is selected.
     */
    const deleteSelected = () => {
      const id = get().selectedId;
      if (!id) return;
      edit((l) =>
        l.furniture.some((f) => f.id === id) ? removeFurniture(l, id) : removeOpening(l, id),
      );
      set({ selectedId: null });
    };

    const toggleDoorSwing = () => {
      const id = get().selectedId;
      if (!id) return;
      edit((l) => coreToggleDoorSwing(l, id));
    };

    const endEntry = () => {
      const { entryBase, layout, past } = get();
      if (!entryBase) return;
      // Compared by value, not by reference: a press that starts a drag and goes
      // nowhere still ran `moveFurniture`, which returns a fresh object every
      // time, and an undo that visibly does nothing is worse than no entry. Once
      // per interaction, over a small JSON object.
      const changed = JSON.stringify(entryBase) !== JSON.stringify(layout);
      set(
        changed
          ? { entryBase: null, past: pushHistory(past, entryBase), future: [] }
          : { entryBase: null },
      );
    };

    /**
     * Step back, and step forward.
     *
     * Selection survives a jump — it is editor UI, not part of the design — but
     * an id that no longer refers to anything is dropped, or the delete button
     * stays armed on an item that is not there any more.
     */
    const undo = () => {
      const { past, future, layout, selectedId } = get();
      if (past.length === 0) return;
      const next = past[past.length - 1];
      set({
        layout: next,
        past: past.slice(0, -1),
        future: pushHistory(future, layout),
        selectedId: present(next, selectedId) ? selectedId : null,
      });
    };

    const redo = () => {
      const { past, future, layout, selectedId } = get();
      if (future.length === 0) return;
      const next = future[future.length - 1];
      set({
        layout: next,
        past: pushHistory(past, layout),
        future: future.slice(0, -1),
        selectedId: present(next, selectedId) ? selectedId : null,
      });
    };

    return {
      layout: initial,
      selectedId: null,
      snapEnabled: true,
      past: [],
      future: [],
      entryBase: null,
      nextId: seedIdCounter(initial),

      select: (id) => set({ selectedId: id }),
      toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),
      setRoomType: (roomType) => edit((l) => ({ ...l, roomType })),
      setDimensions: (widthCm, lengthCm) => edit((l) => ({ ...l, room: { widthCm, lengthCm } })),
      // Display unit only. The room's centimetres are untouched, so switching
      // units relabels the numbers and leaves the canvas exactly where it was.
      setUnit: (displayUnit) => edit((l) => ({ ...l, displayUnit })),
      addDoor,
      addWindow,
      moveOpening: (id, placement) => edit((l) => coreMoveOpening(l, id, placement)),
      setMainDoor: (id) => edit((l) => coreSetMainDoor(l, id)),
      toggleDoorSwing,
      placeFurniture,
      moveFurniture: (id, xCm, yCm) => edit((l) => coreMoveFurniture(l, id, xCm, yCm)),
      transformFurniture: (id, transform) => edit((l) => coreTransformFurniture(l, id, transform)),
      rotateFurniture: (id, rotationDeg) => edit((l) => coreRotateFurniture(l, id, rotationDeg)),
      labelFurniture: (id, label) => edit((l) => coreLabelFurniture(l, id, label)),
      deleteSelected,
      undo,
      redo,
      beginEntry: () => {
        // A begin with a scope already open closes that one rather than
        // swallowing it. The two overlap when a pointer lands on the canvas while
        // a text field still holds focus.
        endEntry();
        set({ entryBase: get().layout });
      },
      endEntry,
    };
  });
}

export type LayoutStore = ReturnType<typeof createLayoutStore>;
