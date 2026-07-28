/**
 * The editor's state, as named commands.
 *
 * Three tiers live here, deliberately kept apart:
 *
 *   - the `Layout` — the design itself, and the only thing REQ-010 persists;
 *   - `selectedId` and `snapEnabled` — editor UI, not part of the design, never
 *     persisted and never undone;
 *   - nothing else. Transient drag state belongs in refs inside the gesture
 *     hook, because holding it in React state rebuilds the Gesture mid-drag.
 *
 * The hook exposes commands and never `setLayout`. That is the seam REQ-009
 * needs: swapping this implementation for a store with an undo stack changes
 * this file and nothing that calls it, because every edit is already one named
 * operation producing one new `Layout`.
 */
import { useRef, useState } from 'react';

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
 * The next free number for `${prefix}-${n}` ids.
 *
 * Seeded from what the layout already contains rather than from 1, because
 * REQ-010 will hand this hook a layout loaded from the database: restarting the
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

export interface LayoutEditor {
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
}

export function useLayoutEditor(initial: Layout): LayoutEditor {
  const [layout, setLayout] = useState<Layout>(initial);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const nextId = useRef(seedIdCounter(initial));

  const makeId = (prefix: string) => `${prefix}-${nextId.current++}`;

  const addDoor = () => {
    const id = makeId('door');
    setLayout((l) => coreAddDoor(l, id, nextPlacement(l, DEFAULT_DOOR_WIDTH_CM)));
    setSelectedId(id);
  };

  const addWindow = () => {
    const id = makeId('window');
    setLayout((l) => coreAddWindow(l, id, nextPlacement(l, DEFAULT_WINDOW_WIDTH_CM)));
    setSelectedId(id);
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
    setLayout((l) => {
      // Snap the drop too, not just later drags — otherwise the first thing the
      // toggle does after you turn it on is let an item land off-grid.
      const p = snapPointToGrid({ x: xCm, y: yCm }, snapEnabled ? gridSizeCm(l.displayUnit) : 0);
      return coreMoveFurniture(
        coreAddFurniture(l, createFurnitureItem(id, type, p.x, p.y)),
        id,
        p.x,
        p.y,
      );
    });
    setSelectedId(id);
  };

  /**
   * Delete whatever is selected.
   *
   * Dispatching on what the id refers to is the point: one `selectedId` slot is
   * shared by doors, windows and furniture, so a `removeOpening` here would
   * silently do nothing when an item is selected.
   */
  const deleteSelected = () => {
    const id = selectedId;
    if (!id) return;
    setLayout((l) =>
      l.furniture.some((f) => f.id === id) ? removeFurniture(l, id) : removeOpening(l, id),
    );
    setSelectedId(null);
  };

  const toggleDoorSwing = () => {
    if (!selectedId) return;
    setLayout((l) => coreToggleDoorSwing(l, selectedId));
  };

  return {
    layout,
    selectedId,
    snapEnabled,
    select: setSelectedId,
    toggleSnap: () => setSnapEnabled((on) => !on),
    setRoomType: (roomType) => setLayout((l) => ({ ...l, roomType })),
    setDimensions: (widthCm, lengthCm) => setLayout((l) => ({ ...l, room: { widthCm, lengthCm } })),
    // Display unit only. The room's centimetres are untouched, so switching
    // units relabels the numbers and leaves the canvas exactly where it was.
    setUnit: (displayUnit) => setLayout((l) => ({ ...l, displayUnit })),
    addDoor,
    addWindow,
    moveOpening: (id, placement) => setLayout((l) => coreMoveOpening(l, id, placement)),
    setMainDoor: (id) => setLayout((l) => coreSetMainDoor(l, id)),
    toggleDoorSwing,
    placeFurniture,
    moveFurniture: (id, xCm, yCm) => setLayout((l) => coreMoveFurniture(l, id, xCm, yCm)),
    transformFurniture: (id, transform) =>
      setLayout((l) => coreTransformFurniture(l, id, transform)),
    rotateFurniture: (id, rotationDeg) =>
      setLayout((l) => coreRotateFurniture(l, id, rotationDeg)),
    labelFurniture: (id, label) => setLayout((l) => coreLabelFurniture(l, id, label)),
    deleteSelected,
  };
}
