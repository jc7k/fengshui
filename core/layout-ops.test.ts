import { describe, expect, it } from 'vitest';

import {
  addDoor,
  addWindow,
  ensureMainDoor,
  moveOpening,
  removeOpening,
  setMainDoor,
  toggleDoorSwing,
} from './layout-ops';
import { createLayout, mainDoor, type Layout } from './types';

const base = (): Layout => createLayout('bedroom', { widthCm: 400, lengthCm: 300 });

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

describe('persistence', () => {
  it('round-trips a layout with openings through JSON', () => {
    let l = addDoor(base(), 'd1', { wall: 'north', offsetCm: 100 });
    l = addDoor(l, 'd2', { wall: 'west', offsetCm: 30 });
    l = addWindow(l, 'w1', { wall: 'east', offsetCm: 40 });
    const restored: Layout = JSON.parse(JSON.stringify(l));
    expect(restored).toEqual(l);
    expect(mainDoor(restored)?.id).toBe('d1');
  });
});
