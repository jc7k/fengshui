import { describe, expect, it } from 'vitest';

import { createLayout, mainDoor, type Layout } from './types';

function fullLayout(): Layout {
  return {
    schemaVersion: 1,
    roomType: 'bedroom',
    room: { widthCm: 365.76, lengthCm: 304.8 },
    displayUnit: 'ft',
    doors: [
      {
        id: 'door-1',
        wall: 'north',
        offsetCm: 100,
        widthCm: 81.28,
        swing: 'inward',
        hinge: 'left',
        isMain: true,
      },
    ],
    windows: [{ id: 'win-1', wall: 'east', offsetCm: 90, widthCm: 120 }],
    furniture: [
      {
        id: 'bed-1',
        type: 'bed',
        xCm: 180,
        yCm: 200,
        widthCm: 152.4,
        depthCm: 203.2,
        rotationDeg: 180,
        label: 'Main bed',
      },
      {
        id: 'plant-1',
        type: 'plant',
        xCm: 40,
        yCm: 40,
        widthCm: 40,
        depthCm: 40,
        rotationDeg: 0,
      },
    ],
  };
}

describe('Layout serialisation', () => {
  it('round-trips through JSON without loss', () => {
    const layout = fullLayout();
    const restored: Layout = JSON.parse(JSON.stringify(layout));
    expect(restored).toEqual(layout);
  });

  it('preserves fractional centimetres exactly', () => {
    // Room dimensions come from feet, so they are never round numbers.
    const layout = fullLayout();
    const restored: Layout = JSON.parse(JSON.stringify(layout));
    expect(restored.room.widthCm).toBe(365.76);
    expect(restored.furniture[0].depthCm).toBe(203.2);
  });

  it('keeps an optional label absent rather than null', () => {
    const layout = fullLayout();
    const restored: Layout = JSON.parse(JSON.stringify(layout));
    expect('label' in restored.furniture[1]).toBe(false);
    expect(restored.furniture[0].label).toBe('Main bed');
  });

  it('survives a second round trip unchanged', () => {
    const once = JSON.stringify(fullLayout());
    const twice = JSON.stringify(JSON.parse(once));
    expect(twice).toBe(once);
  });
});

describe('createLayout', () => {
  it('starts empty at the current schema version', () => {
    const layout = createLayout('home_office', { widthCm: 300, lengthCm: 400 });
    expect(layout.schemaVersion).toBe(1);
    expect(layout.doors).toEqual([]);
    expect(layout.windows).toEqual([]);
    expect(layout.furniture).toEqual([]);
    expect(layout.displayUnit).toBe('ft');
  });
});

describe('mainDoor', () => {
  it('prefers the door flagged as main', () => {
    const layout = fullLayout();
    layout.doors.push({
      id: 'door-2',
      wall: 'south',
      offsetCm: 10,
      widthCm: 80,
      swing: 'inward',
      hinge: 'right',
      isMain: false,
    });
    expect(mainDoor(layout)?.id).toBe('door-1');
  });

  it('falls back to the first door when none is flagged', () => {
    const layout = fullLayout();
    layout.doors[0].isMain = false;
    expect(mainDoor(layout)?.id).toBe('door-1');
  });

  it('returns null for a room with no doors', () => {
    expect(mainDoor(createLayout('other', { widthCm: 100, lengthCm: 100 }))).toBeNull();
  });
});
