import { describe, expect, it } from 'vitest';

import { createFurnitureItem } from './furniture';
import {
  addDoor,
  addFurniture,
  addWindow,
  ensureMainDoor,
  labelFurniture,
  MIN_FURNITURE_CM,
  moveFurniture,
  moveOpening,
  removeFurniture,
  removeOpening,
  rotateFurniture,
  setMainDoor,
  toggleDoorSwing,
  transformFurniture,
} from './layout-ops';
import { createLayout, mainDoor, type Layout } from './types';

const base = (): Layout => createLayout('bedroom', { widthCm: 400, lengthCm: 300 });

/** A room with one bed, centred, for the furniture ops below. */
const withBed = (): Layout => addFurniture(base(), createFurnitureItem('f1', 'bed', 200, 150));

describe('adding openings', () => {
  it('auto-designates the first door as main', () => {
    const l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    expect(l.doors).toHaveLength(1);
    expect(l.doors[0].isMain).toBe(true);
    expect(mainDoor(l)?.id).toBe('d1');
  });

  it('does not promote later doors', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addDoor(l, 'd2', { wall: 'south', offsetCm: 50 });
    expect(l.doors.filter((d) => d.isMain)).toHaveLength(1);
    expect(mainDoor(l)?.id).toBe('d1');
  });

  it('gives a door a swing, which REQ-011 rule 5 needs', () => {
    const l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    expect(l.doors[0].swing).toBe('inward');
    expect(l.doors[0].widthCm).toBeGreaterThan(0);
  });

  it('supports multiple windows', () => {
    let l = addWindow(base(), 'w1', { wall: 'east', offsetCm: 40 });
    l = addWindow(l, 'w2', { wall: 'west', offsetCm: 90 });
    expect(l.windows.map((w) => w.id)).toEqual(['w1', 'w2']);
  });

  it('never mutates the layout it was given', () => {
    const before = base();
    const snapshot = JSON.stringify(before);
    addDoor(before, 'd1', { wall: 'north', offsetCm: 100 });
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('the main-door invariant', () => {
  it('promotes another door when the main one is deleted', () => {
    // REQ-016's bagua grid orients to the main door and has no fallback.
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addDoor(l, 'd2', { wall: 'south', offsetCm: 50 });
    l = removeOpening(l, 'd1');
    expect(l.doors).toHaveLength(1);
    expect(mainDoor(l)?.id).toBe('d2');
    expect(l.doors[0].isMain).toBe(true);
  });

  it('leaves no main door when the last door goes', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = removeOpening(l, 'd1');
    expect(l.doors).toHaveLength(0);
    expect(mainDoor(l)).toBeNull();
  });

  it('repairs a layout with no main door', () => {
    const broken: Layout = {
      ...base(),
      doors: [
        { id: 'a', wall: 'north', offsetCm: 0, widthCm: 81, swing: 'inward', hinge: 'left', isMain: false },
        { id: 'b', wall: 'south', offsetCm: 0, widthCm: 81, swing: 'inward', hinge: 'left', isMain: false },
      ],
    };
    expect(mainDoor(ensureMainDoor(broken))?.id).toBe('a');
    expect(ensureMainDoor(broken).doors.filter((d) => d.isMain)).toHaveLength(1);
  });

  it('repairs a layout with two main doors', () => {
    const broken: Layout = {
      ...base(),
      doors: [
        { id: 'a', wall: 'north', offsetCm: 0, widthCm: 81, swing: 'inward', hinge: 'left', isMain: true },
        { id: 'b', wall: 'south', offsetCm: 0, widthCm: 81, swing: 'inward', hinge: 'left', isMain: true },
      ],
    };
    const fixed = ensureMainDoor(broken);
    expect(fixed.doors.filter((d) => d.isMain)).toHaveLength(1);
    expect(mainDoor(fixed)?.id).toBe('a');
  });

  it('is idempotent', () => {
    const l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    expect(ensureMainDoor(ensureMainDoor(l))).toEqual(ensureMainDoor(l));
  });

  it('lets the user pick the main door when there are several', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addDoor(l, 'd2', { wall: 'south', offsetCm: 50 });
    l = setMainDoor(l, 'd2');
    expect(mainDoor(l)?.id).toBe('d2');
    expect(l.doors.filter((d) => d.isMain)).toHaveLength(1);
  });

  it('ignores a request to make a window the main door', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addWindow(l, 'w1', { wall: 'east', offsetCm: 40 });
    expect(setMainDoor(l, 'w1')).toEqual(l);
  });
});

describe('moving and deleting', () => {
  it('moves an opening to a new wall', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = moveOpening(l, 'd1', { wall: 'east', offsetCm: 20 });
    expect(l.doors[0].wall).toBe('east');
    expect(l.doors[0].offsetCm).toBe(20);
  });

  it('keeps the rest of the door intact when moved', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = moveOpening(l, 'd1', { wall: 'east', offsetCm: 20 });
    expect(l.doors[0].isMain).toBe(true);
    expect(l.doors[0].swing).toBe('inward');
  });

  it('moves windows too', () => {
    let l = addWindow(base(), 'w1', { wall: 'east', offsetCm: 40 });
    l = moveOpening(l, 'w1', { wall: 'north', offsetCm: 10 });
    expect(l.windows[0]).toMatchObject({ wall: 'north', offsetCm: 10 });
  });

  it('ignores unknown ids', () => {
    const l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    expect(moveOpening(l, 'nope', { wall: 'east', offsetCm: 0 })).toEqual(l);
    expect(removeOpening(l, 'nope')).toEqual(l);
  });

  it('deletes windows', () => {
    let l = addWindow(base(), 'w1', { wall: 'east', offsetCm: 40 });
    l = removeOpening(l, 'w1');
    expect(l.windows).toHaveLength(0);
  });

  it('flips a door swing', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = toggleDoorSwing(l, 'd1');
    expect(l.doors[0].swing).toBe('outward');
    l = toggleDoorSwing(l, 'd1');
    expect(l.doors[0].swing).toBe('inward');
  });
});

describe('moving furniture', () => {
  it('moves an item by its centre', () => {
    const l = moveFurniture(withBed(), 'f1', 120, 90);
    expect(l.furniture[0]).toMatchObject({ xCm: 120, yCm: 90 });
  });

  it('clamps the centre to the room so an item can never be dragged away', () => {
    // The footprint may overhang — that is how a user says "against the wall" —
    // but a centre outside the room is an item that can no longer be selected.
    const l = moveFurniture(withBed(), 'f1', 9000, -9000);
    expect(l.furniture[0]).toMatchObject({ xCm: 400, yCm: 0 });
  });

  it('lets an item sit flush in a corner, overhanging two walls', () => {
    const l = moveFurniture(withBed(), 'f1', 0, 0);
    expect(l.furniture[0]).toMatchObject({ xCm: 0, yCm: 0 });
  });
});

describe('transforming furniture', () => {
  it('moves and resizes in a single operation', () => {
    // One corner drag is one state transition, which is what REQ-009 undoes.
    const l = transformFurniture(withBed(), 'f1', {
      xCm: 100,
      yCm: 80,
      widthCm: 160,
      depthCm: 120,
    });
    expect(l.furniture[0]).toMatchObject({ xCm: 100, yCm: 80, widthCm: 160, depthCm: 120 });
  });

  it('floors both extents at MIN_FURNITURE_CM', () => {
    const l = transformFurniture(withBed(), 'f1', { xCm: 200, yCm: 150, widthCm: 1, depthCm: -30 });
    expect(l.furniture[0].widthCm).toBe(MIN_FURNITURE_CM);
    expect(l.furniture[0].depthCm).toBe(MIN_FURNITURE_CM);
  });

  it('clamps the centre the same way a move does', () => {
    const l = transformFurniture(withBed(), 'f1', {
      xCm: -50,
      yCm: 9000,
      widthCm: 100,
      depthCm: 100,
    });
    expect(l.furniture[0]).toMatchObject({ xCm: 0, yCm: 300 });
  });

  it('leaves the rotation and label untouched', () => {
    let l = rotateFurniture(labelFurniture(withBed(), 'f1', 'Guest bed'), 'f1', 90);
    l = transformFurniture(l, 'f1', { xCm: 100, yCm: 100, widthCm: 90, depthCm: 90 });
    expect(l.furniture[0]).toMatchObject({ rotationDeg: 90, label: 'Guest bed' });
  });
});

describe('rotating furniture', () => {
  it('sets the rotation', () => {
    expect(rotateFurniture(withBed(), 'f1', 90).furniture[0].rotationDeg).toBe(90);
  });

  it('folds a rotation past a full turn back into range', () => {
    expect(rotateFurniture(withBed(), 'f1', 370).furniture[0].rotationDeg).toBe(10);
  });

  it('folds a negative rotation into the positive range', () => {
    expect(rotateFurniture(withBed(), 'f1', -10).furniture[0].rotationDeg).toBe(350);
  });
});

describe('labelling furniture', () => {
  it('sets a label', () => {
    expect(labelFurniture(withBed(), 'f1', "Kid's bed").furniture[0].label).toBe("Kid's bed");
  });

  it('removes the key for an empty label rather than storing an empty string', () => {
    // types.ts allows exactly one representation of "unset": absent.
    const l = labelFurniture(labelFurniture(withBed(), 'f1', 'Bed'), 'f1', '');
    expect('label' in l.furniture[0]).toBe(false);
  });

  it('treats a whitespace-only label as clearing it', () => {
    const l = labelFurniture(labelFurniture(withBed(), 'f1', 'Bed'), 'f1', '   ');
    expect('label' in l.furniture[0]).toBe(false);
  });
});

describe('the furniture ops as a family', () => {
  it('ignores unknown ids', () => {
    const l = withBed();
    expect(moveFurniture(l, 'nope', 10, 10)).toEqual(l);
    expect(transformFurniture(l, 'nope', { xCm: 1, yCm: 1, widthCm: 1, depthCm: 1 })).toEqual(l);
    expect(rotateFurniture(l, 'nope', 45)).toEqual(l);
    expect(labelFurniture(l, 'nope', 'x')).toEqual(l);
    expect(removeFurniture(l, 'nope')).toEqual(l);
  });

  it('never mutates the layout it was given', () => {
    const before = labelFurniture(withBed(), 'f1', 'Bed');
    const snapshot = JSON.stringify(before);
    moveFurniture(before, 'f1', 10, 10);
    transformFurniture(before, 'f1', { xCm: 1, yCm: 1, widthCm: 50, depthCm: 50 });
    rotateFurniture(before, 'f1', 45);
    labelFurniture(before, 'f1', '');
    removeFurniture(before, 'f1');
    expect(JSON.stringify(before)).toBe(snapshot);
  });

  it('leaves other items alone', () => {
    let l = addFurniture(withBed(), createFurnitureItem('f2', 'nightstand', 40, 40));
    l = moveFurniture(l, 'f1', 10, 10);
    expect(l.furniture[1]).toMatchObject({ id: 'f2', xCm: 40, yCm: 40 });
  });

  it('deletes an item', () => {
    expect(removeFurniture(withBed(), 'f1').furniture).toHaveLength(0);
  });
});

describe('persistence', () => {
  it('round-trips a layout with openings through JSON', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addDoor(l, 'd2', { wall: 'west', offsetCm: 30 });
    l = addWindow(l, 'w1', { wall: 'east', offsetCm: 40 });
    const restored: Layout = JSON.parse(JSON.stringify(l));
    expect(restored).toEqual(l);
    expect(mainDoor(restored)?.id).toBe('d1');
  });

  it('round-trips a layout with furniture through JSON', () => {
    let l = addDoor(withBed(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addFurniture(l, createFurnitureItem('f2', 'mirror', 30.48, 60.96));
    l = rotateFurniture(l, 'f1', 370);
    l = labelFurniture(l, 'f1', 'Main bed');
    l = transformFurniture(l, 'f2', { xCm: 30.48, yCm: 60.96, widthCm: 60.5, depthCm: 20 });

    const restored: Layout = JSON.parse(JSON.stringify(l));
    expect(restored).toEqual(l);
    expect(restored.furniture[0].label).toBe('Main bed');
    expect(restored.furniture[0].rotationDeg).toBe(10);
    expect('label' in restored.furniture[1]).toBe(false);
  });
});
