/**
 * The furniture catalog (PRD §4.2).
 *
 * Two jobs. First, a real-world default size for every type: REQ-011's
 * proportion rule ("a single item takes an outsized share of the room") and its
 * clearance rule both measure centimetres, so an item placed without a
 * plausible size would be judged against nothing. Second, the per-room-type
 * palette, which the PRD enumerates and this file reproduces verbatim.
 *
 * Kitchen, dining room, bathroom and "other" have no list in the PRD, so they
 * get the generic set and nothing else. Inventing libraries for them would be
 * inventing product.
 *
 * Depth is front-to-back along the item's own y axis, so a bed at 0° has its
 * head at the north edge — see `FurnitureItem` in `types.ts`.
 */

import type { FurnitureItem, FurnitureType, RoomType } from './types';

export interface FurnitureSpec {
  type: FurnitureType;
  /** What the palette calls it. */
  name: string;
  /** Extent along the item's own x axis, cm. */
  defaultWidthCm: number;
  /** Extent along the item's own y axis — front to back, cm. */
  defaultDepthCm: number;
}

/** Default sizes are typical retail dimensions: a US queen bed, a 4' desk. */
export const FURNITURE_SPECS: Record<FurnitureType, FurnitureSpec> = {
  bed: { type: 'bed', name: 'Bed', defaultWidthCm: 152, defaultDepthCm: 203 },
  nightstand: { type: 'nightstand', name: 'Nightstand', defaultWidthCm: 45, defaultDepthCm: 40 },
  dresser: { type: 'dresser', name: 'Dresser', defaultWidthCm: 150, defaultDepthCm: 50 },
  mirror: { type: 'mirror', name: 'Mirror', defaultWidthCm: 60, defaultDepthCm: 5 },
  desk: { type: 'desk', name: 'Desk', defaultWidthCm: 120, defaultDepthCm: 60 },
  sofa: { type: 'sofa', name: 'Sofa', defaultWidthCm: 200, defaultDepthCm: 90 },
  armchair: { type: 'armchair', name: 'Armchair', defaultWidthCm: 85, defaultDepthCm: 85 },
  coffee_table: {
    type: 'coffee_table',
    name: 'Coffee table',
    defaultWidthCm: 110,
    defaultDepthCm: 60,
  },
  tv_stand: { type: 'tv_stand', name: 'TV stand', defaultWidthCm: 150, defaultDepthCm: 40 },
  bookshelf: { type: 'bookshelf', name: 'Bookshelf', defaultWidthCm: 80, defaultDepthCm: 30 },
  chair: { type: 'chair', name: 'Chair', defaultWidthCm: 50, defaultDepthCm: 50 },
  filing_cabinet: {
    type: 'filing_cabinet',
    name: 'Filing cabinet',
    defaultWidthCm: 45,
    defaultDepthCm: 60,
  },
  plant: { type: 'plant', name: 'Plant', defaultWidthCm: 50, defaultDepthCm: 50 },
  rug: { type: 'rug', name: 'Rug', defaultWidthCm: 240, defaultDepthCm: 170 },
  lamp: { type: 'lamp', name: 'Lamp', defaultWidthCm: 40, defaultDepthCm: 40 },
  artwork: { type: 'artwork', name: 'Artwork', defaultWidthCm: 90, defaultDepthCm: 5 },
};

/** Offered in every room, whatever its type. */
export const GENERIC_FURNITURE: readonly FurnitureType[] = ['plant', 'rug', 'lamp', 'artwork'];

/** The room-specific part of each palette, verbatim from PRD §4.2. */
export const ROOM_TYPE_FURNITURE: Record<RoomType, readonly FurnitureType[]> = {
  bedroom: ['bed', 'nightstand', 'dresser', 'mirror', 'desk'],
  living_room: ['sofa', 'armchair', 'coffee_table', 'tv_stand', 'bookshelf', 'mirror'],
  home_office: ['desk', 'chair', 'bookshelf', 'filing_cabinet'],
  kitchen: [],
  dining_room: [],
  bathroom: [],
  other: [],
};

/**
 * What the palette offers for a room type: its own items, then the generics.
 *
 * Specific first because those are what the user came to place. Deduped in case
 * a room type ever lists a generic item explicitly.
 */
export function furnitureForRoomType(roomType: RoomType): FurnitureType[] {
  const seen = new Set<FurnitureType>();
  const out: FurnitureType[] = [];
  for (const type of [...ROOM_TYPE_FURNITURE[roomType], ...GENERIC_FURNITURE]) {
    if (seen.has(type)) continue;
    seen.add(type);
    out.push(type);
  }
  return out;
}

/**
 * A new item of `type`, centred on (`xCm`, `yCm`) at its catalog size.
 *
 * Ids come from the caller, as everywhere else in `core/`. `label` is left off
 * the object entirely rather than set to `undefined` — `types.ts` requires the
 * layout to survive a JSON round trip unchanged, and an absent key and an
 * `undefined` one are not the same object afterwards.
 */
export function createFurnitureItem(
  id: string,
  type: FurnitureType,
  xCm: number,
  yCm: number,
): FurnitureItem {
  const spec = FURNITURE_SPECS[type];
  return {
    id,
    type,
    xCm,
    yCm,
    widthCm: spec.defaultWidthCm,
    depthCm: spec.defaultDepthCm,
    rotationDeg: 0,
  };
}
