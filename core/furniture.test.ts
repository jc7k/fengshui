import { describe, expect, it } from 'vitest';

import {
  createFurnitureItem,
  FURNITURE_SPECS,
  furnitureForRoomType,
  GENERIC_FURNITURE,
  ROOM_TYPE_FURNITURE,
} from './furniture';
import { ROOM_TYPES, type FurnitureType, type Layout, type RoomType } from './types';

const ALL_TYPES = Object.keys(FURNITURE_SPECS) as FurnitureType[];

/** The room types the PRD leaves without a library of their own. */
const UNLISTED: RoomType[] = ['kitchen', 'dining_room', 'bathroom', 'other'];

describe('the PRD palettes', () => {
  it('offers the bedroom set the PRD enumerates, in order', () => {
    expect(ROOM_TYPE_FURNITURE.bedroom).toEqual(['bed', 'nightstand', 'dresser', 'mirror', 'desk']);
  });

  it('offers the living-room set the PRD enumerates, in order', () => {
    expect(ROOM_TYPE_FURNITURE.living_room).toEqual([
      'sofa',
      'armchair',
      'coffee_table',
      'tv_stand',
      'bookshelf',
      'mirror',
    ]);
  });

  it('offers the office set the PRD enumerates, in order', () => {
    expect(ROOM_TYPE_FURNITURE.home_office).toEqual(['desk', 'chair', 'bookshelf', 'filing_cabinet']);
  });

  it('lists exactly the four generic items', () => {
    expect(GENERIC_FURNITURE).toEqual(['plant', 'rug', 'lamp', 'artwork']);
  });
});

describe('filtering by room type', () => {
  it('keeps office and living-room items out of a bedroom', () => {
    // The PRD's constraint is explicit: a bedroom must not offer a filing cabinet.
    const bedroom = furnitureForRoomType('bedroom');
    expect(bedroom).not.toContain('filing_cabinet');
    expect(bedroom).not.toContain('sofa');
  });

  it('puts the room-specific items before the generics', () => {
    expect(furnitureForRoomType('home_office')).toEqual([
      'desk',
      'chair',
      'bookshelf',
      'filing_cabinet',
      'plant',
      'rug',
      'lamp',
      'artwork',
    ]);
  });

  it('offers every generic item in every room type', () => {
    for (const roomType of ROOM_TYPES) {
      const offered = furnitureForRoomType(roomType);
      for (const generic of GENERIC_FURNITURE) {
        expect(offered).toContain(generic);
      }
    }
  });

  it('gives the room types the PRD does not enumerate the generics and nothing else', () => {
    // Guards against someone inventing a kitchen library that was never specified.
    for (const roomType of UNLISTED) {
      expect(furnitureForRoomType(roomType)).toEqual([...GENERIC_FURNITURE]);
    }
  });

  it('never repeats a type', () => {
    for (const roomType of ROOM_TYPES) {
      const offered = furnitureForRoomType(roomType);
      expect(new Set(offered).size).toBe(offered.length);
    }
  });
});

describe('default sizes', () => {
  it('gives every furniture type a real-world size', () => {
    // A type with no size would place a zero-area item, and REQ-011's
    // proportion rule divides by the room area with that in the numerator.
    for (const type of ALL_TYPES) {
      const spec = FURNITURE_SPECS[type];
      expect(spec.type).toBe(type);
      expect(spec.name.length).toBeGreaterThan(0);
      expect(spec.defaultWidthCm).toBeGreaterThan(0);
      expect(spec.defaultDepthCm).toBeGreaterThan(0);
    }
  });

  it('has a spec for every type any palette offers', () => {
    for (const roomType of ROOM_TYPES) {
      for (const type of furnitureForRoomType(roomType)) {
        expect(FURNITURE_SPECS[type]).toBeDefined();
      }
    }
  });
});

describe('createFurnitureItem', () => {
  it('takes its size from the catalog and its position from the caller', () => {
    const bed = createFurnitureItem('bed-1', 'bed', 120, 90);
    expect(bed).toEqual({
      id: 'bed-1',
      type: 'bed',
      xCm: 120,
      yCm: 90,
      widthCm: FURNITURE_SPECS.bed.defaultWidthCm,
      depthCm: FURNITURE_SPECS.bed.defaultDepthCm,
      rotationDeg: 0,
    });
  });

  it('omits the label key rather than setting it undefined', () => {
    // `undefined` disappears through JSON.stringify, so an item created with it
    // would not equal itself after a round trip.
    const item = createFurnitureItem('plant-1', 'plant', 10, 10);
    expect('label' in item).toBe(false);
  });
});

describe('persistence', () => {
  it('round-trips one item of every type through JSON unchanged', () => {
    const layout: Layout = {
      schemaVersion: 1,
      roomType: 'bedroom',
      room: { widthCm: 365.76, lengthCm: 304.8 },
      displayUnit: 'ft',
      doors: [],
      windows: [],
      furniture: ALL_TYPES.map((type, i) => {
        const item = createFurnitureItem(`${type}-1`, type, 30.48 * (i + 1), 15.24 * (i + 1));
        return i === 0 ? { ...item, rotationDeg: 137.5, label: 'Main bed' } : item;
      }),
    };

    const restored: Layout = JSON.parse(JSON.stringify(layout));
    expect(restored).toEqual(layout);
    expect(restored.furniture[0].label).toBe('Main bed');
    expect(restored.furniture[0].rotationDeg).toBe(137.5);
    expect('label' in restored.furniture[1]).toBe(false);
  });
});
