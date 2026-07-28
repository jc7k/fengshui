import { describe, expect, it } from 'vitest';

import { canRedo, canUndo, createLayoutStore, HISTORY_LIMIT } from './layout-store';
import { createLayout, type Layout } from '../core';

const base = (): Layout => createLayout('bedroom', { widthCm: 400, lengthCm: 300 }, 'm');

const store = () => createLayoutStore(base());

/** The single item in the layout — every test below places exactly one. */
const only = (s: ReturnType<typeof store>) => s.getState().layout.furniture[0];

describe('undo and redo over each operation', () => {
  it('reverses and reapplies placing an item', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    expect(s.getState().layout.furniture).toHaveLength(1);

    s.getState().undo();
    expect(s.getState().layout.furniture).toHaveLength(0);

    s.getState().redo();
    expect(s.getState().layout.furniture).toHaveLength(1);
    expect(only(s).type).toBe('bed');
  });

  it('reverses and reapplies a move', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const from = { x: only(s).xCm, y: only(s).yCm };
    s.getState().moveFurniture(only(s).id, 50, 60);
    expect([only(s).xCm, only(s).yCm]).toEqual([50, 60]);

    s.getState().undo();
    expect([only(s).xCm, only(s).yCm]).toEqual([from.x, from.y]);

    s.getState().redo();
    expect([only(s).xCm, only(s).yCm]).toEqual([50, 60]);
  });

  it('reverses and reapplies a resize', () => {
    const s = store();
    s.getState().placeFurniture('desk', 200, 150);
    const before = { widthCm: only(s).widthCm, depthCm: only(s).depthCm };
    s.getState().transformFurniture(only(s).id, {
      xCm: 200,
      yCm: 150,
      widthCm: 111,
      depthCm: 77,
    });
    expect([only(s).widthCm, only(s).depthCm]).toEqual([111, 77]);

    s.getState().undo();
    expect([only(s).widthCm, only(s).depthCm]).toEqual([before.widthCm, before.depthCm]);

    s.getState().redo();
    expect([only(s).widthCm, only(s).depthCm]).toEqual([111, 77]);
  });

  it('reverses and reapplies a rotation', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    s.getState().rotateFurniture(only(s).id, 90);
    expect(only(s).rotationDeg).toBe(90);

    s.getState().undo();
    expect(only(s).rotationDeg).toBe(0);

    s.getState().redo();
    expect(only(s).rotationDeg).toBe(90);
  });

  it('reverses and reapplies a label, including back to unlabelled', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    s.getState().labelFurniture(only(s).id, 'Guest bed');
    expect(only(s).label).toBe('Guest bed');

    s.getState().undo();
    expect(only(s).label).toBeUndefined();

    s.getState().redo();
    expect(only(s).label).toBe('Guest bed');
  });

  it('reverses and reapplies a delete', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const id = only(s).id;
    s.getState().select(id);
    s.getState().deleteSelected();
    expect(s.getState().layout.furniture).toHaveLength(0);

    s.getState().undo();
    expect(s.getState().layout.furniture.map((f) => f.id)).toEqual([id]);

    s.getState().redo();
    expect(s.getState().layout.furniture).toHaveLength(0);
  });

  it('reverses and reapplies adding a door', () => {
    const s = store();
    s.getState().addDoor();
    const id = s.getState().layout.doors[0].id;

    s.getState().undo();
    expect(s.getState().layout.doors).toHaveLength(0);

    s.getState().redo();
    expect(s.getState().layout.doors.map((d) => d.id)).toEqual([id]);
    // The redone door is the same door, not a fresh one: history is snapshots,
    // so nothing re-runs and no id is minted twice.
    expect(s.getState().layout.doors[0].isMain).toBe(true);
  });

  it('reverses and reapplies adding a window', () => {
    const s = store();
    s.getState().addWindow();
    expect(s.getState().layout.windows).toHaveLength(1);

    s.getState().undo();
    expect(s.getState().layout.windows).toHaveLength(0);

    s.getState().redo();
    expect(s.getState().layout.windows).toHaveLength(1);
  });

  it('reverses moving an opening along the wall', () => {
    const s = store();
    s.getState().addDoor();
    const door = s.getState().layout.doors[0];
    s.getState().moveOpening(door.id, { wall: 'south', offsetCm: 20 });
    expect(s.getState().layout.doors[0].wall).toBe('south');

    s.getState().undo();
    expect(s.getState().layout.doors[0].wall).toBe(door.wall);
    expect(s.getState().layout.doors[0].offsetCm).toBe(door.offsetCm);
  });
});

describe('coalescing one interaction into one entry', () => {
  it('turns a whole drag into a single undo', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const id = only(s).id;
    const beforeDrag = s.getState().layout;

    // The shape of a real drag: one scope, one command per pointer event.
    s.getState().beginEntry();
    for (let x = 200; x <= 260; x += 5) s.getState().moveFurniture(id, x, 150);
    s.getState().endEntry();

    expect(only(s).xCm).toBe(260);
    expect(s.getState().past).toHaveLength(2); // the place, and the drag

    s.getState().undo();
    expect(s.getState().layout).toEqual(beforeDrag);
    expect(only(s).xCm).toBe(200);
  });

  it('records nothing for a scope that changed nothing', () => {
    const s = store();
    // A press on empty canvas: the gesture opens a scope, selects nothing and
    // never reaches an editor command.
    s.getState().beginEntry();
    s.getState().select(null);
    s.getState().endEntry();

    expect(s.getState().past).toHaveLength(0);
    expect(canUndo(s.getState())).toBe(false);
  });

  it('records nothing for a drag that ends where it started', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const id = only(s).id;

    // A press on an item that jiggles and comes back still ran `moveFurniture`,
    // which returns a fresh object every time.
    s.getState().beginEntry();
    s.getState().moveFurniture(id, 205, 150);
    s.getState().moveFurniture(id, 200, 150);
    s.getState().endEntry();

    expect(s.getState().past).toHaveLength(1); // the place, and nothing else
  });

  it('closes an open scope when a second one opens', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const id = only(s).id;

    // A text field still holds focus when a pointer lands on the canvas.
    s.getState().beginEntry();
    s.getState().labelFurniture(id, 'Bed');
    s.getState().beginEntry();
    s.getState().moveFurniture(id, 50, 60);
    s.getState().endEntry();

    expect(s.getState().past).toHaveLength(3); // place, label, move
    s.getState().undo();
    expect([only(s).xCm, only(s).yCm]).toEqual([200, 150]);
    expect(only(s).label).toBe('Bed');
  });

  it('is a no-op to close a scope that was never opened', () => {
    const s = store();
    s.getState().endEntry();
    expect(s.getState().past).toHaveLength(0);
    expect(s.getState().entryBase).toBeNull();
  });
});

describe('redo invalidation', () => {
  it('drops the redo stack once a new edit follows an undo', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    s.getState().placeFurniture('desk', 100, 100);

    s.getState().undo();
    expect(canRedo(s.getState())).toBe(true);

    s.getState().placeFurniture('lamp', 50, 50);
    expect(canRedo(s.getState())).toBe(false);
    s.getState().redo();
    expect(s.getState().layout.furniture.map((f) => f.type)).toEqual(['bed', 'lamp']);
  });

  it('drops the redo stack for a coalesced edit too', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    s.getState().placeFurniture('desk', 100, 100);
    s.getState().undo();

    const id = only(s).id;
    s.getState().beginEntry();
    s.getState().moveFurniture(id, 10, 10);
    s.getState().endEntry();

    expect(canRedo(s.getState())).toBe(false);
  });

  it('leaves the redo stack alone when the new interaction changed nothing', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    s.getState().undo();

    s.getState().beginEntry();
    s.getState().endEntry();

    expect(canRedo(s.getState())).toBe(true);
  });
});

describe('bounds and boundaries', () => {
  it('keeps the most recent entries and drops the oldest', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const id = only(s).id;

    // Exactly one edit more than the stack holds, each at a distinct x, so the
    // placement is the single entry that has to go.
    for (let x = 1; x <= HISTORY_LIMIT; x += 1) s.getState().moveFurniture(id, x, 150);
    expect(s.getState().past).toHaveLength(HISTORY_LIMIT);

    // The newest entry is intact: one undo steps back exactly one move.
    s.getState().undo();
    expect(only(s).xCm).toBe(HISTORY_LIMIT - 1);

    // Undoing everything left cannot reach the placement any more — that is the
    // entry that was dropped, so the bed stays where it was placed.
    while (canUndo(s.getState())) s.getState().undo();
    expect(s.getState().layout.furniture).toHaveLength(1);
    expect(only(s).xCm).toBe(200);
  });

  it('is a safe no-op past either end', () => {
    const s = store();
    expect(canUndo(s.getState())).toBe(false);
    expect(canRedo(s.getState())).toBe(false);

    s.getState().undo();
    s.getState().redo();
    expect(s.getState().layout).toEqual(base());

    s.getState().placeFurniture('bed', 200, 150);
    expect(canUndo(s.getState())).toBe(true);

    s.getState().undo();
    s.getState().undo();
    expect(canUndo(s.getState())).toBe(false);
    expect(canRedo(s.getState())).toBe(true);
    expect(s.getState().layout.furniture).toHaveLength(0);

    s.getState().redo();
    s.getState().redo();
    expect(canRedo(s.getState())).toBe(false);
    expect(s.getState().layout.furniture).toHaveLength(1);
  });
});

describe('what history does not touch', () => {
  it('leaves the snap toggle and a live selection alone', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const id = only(s).id;
    s.getState().toggleSnap();
    s.getState().select(id);
    s.getState().rotateFurniture(id, 90);

    s.getState().undo();
    expect(s.getState().snapEnabled).toBe(false);
    expect(s.getState().selectedId).toBe(id);

    s.getState().redo();
    expect(s.getState().snapEnabled).toBe(false);
    expect(s.getState().selectedId).toBe(id);
  });

  it('drops a selection that undo removed from the layout', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    expect(s.getState().selectedId).toBe(only(s).id);

    s.getState().undo();
    expect(s.getState().selectedId).toBeNull();
  });

  it('never reissues an id after an undo', () => {
    const s = store();
    s.getState().addDoor();
    const first = s.getState().layout.doors[0].id;
    s.getState().undo();
    s.getState().addDoor();

    expect(s.getState().layout.doors[0].id).not.toBe(first);
  });

  it('never mutates a layout it has already stored', () => {
    const s = store();
    s.getState().placeFurniture('bed', 200, 150);
    const stored = JSON.stringify(s.getState().past[0]);

    s.getState().moveFurniture(only(s).id, 10, 10);
    s.getState().setRoomType('home_office');
    expect(JSON.stringify(s.getState().past[0])).toBe(stored);
  });
});
