/**
 * The layout data model.
 *
 * This is what serialises into the `layout_json` JSONB column (REQ-010), so
 * every field here is JSON-native: no Date, no Map, no class instances, no
 * undefined-as-meaningful. It must survive `JSON.parse(JSON.stringify(x))`
 * unchanged.
 *
 * All lengths are centimetres — see `units.ts`.
 */

import type { Unit } from './units';

/** Room type drives which furniture is offered and which rules apply (PRD §4.1). */
export type RoomType =
  | 'bedroom'
  | 'living_room'
  | 'home_office'
  | 'kitchen'
  | 'dining_room'
  | 'bathroom'
  | 'other';

/** Every room type, in the order the PRD lists them. */
export const ROOM_TYPES: readonly RoomType[] = [
  'bedroom',
  'living_room',
  'home_office',
  'kitchen',
  'dining_room',
  'bathroom',
  'other',
];

/** MVP furniture set (PRD §4.2). REQ-008 maps these to per-room-type palettes. */
export type FurnitureType =
  // bedroom
  | 'bed'
  | 'nightstand'
  | 'dresser'
  | 'mirror'
  | 'desk'
  // living room
  | 'sofa'
  | 'armchair'
  | 'coffee_table'
  | 'tv_stand'
  | 'bookshelf'
  // office
  | 'chair'
  | 'filing_cabinet'
  // generic
  | 'plant'
  | 'rug'
  | 'lamp'
  | 'artwork';

/**
 * Which wall something sits on.
 *
 * The room is axis-aligned with its top-left corner at (0, 0), x increasing
 * right and y increasing down — screen convention, so canvas code needs no flip.
 * `north` is therefore the top wall (y = 0).
 */
export type Wall = 'north' | 'east' | 'south' | 'west';

/**
 * A door.
 *
 * Position is stored as (wall, offset along that wall) rather than a point, so
 * a door cannot drift off its wall when the room is resized — and so the bagua
 * overlay in REQ-016, which orients itself to the main door's wall, can read
 * that wall directly instead of inferring it from coordinates.
 */
export interface Door {
  id: string;
  wall: Wall;
  /** Distance from the wall's start corner to the door's near edge, cm. */
  offsetCm: number;
  /** Door opening width, cm. */
  widthCm: number;
  /** Which way the leaf swings. Its arc is a no-place zone (PRD §4.3 rule 5). */
  swing: 'inward' | 'outward';
  /** Hinge side, looking at the door from inside the room along the wall. */
  hinge: 'left' | 'right';
  /**
   * The main entrance. Exactly one door in a layout should carry this; the
   * command-position rule and the Phase 2 bagua grid both key off it.
   */
  isMain: boolean;
}

/** A window. Same wall-relative positioning as a door, without the swing. */
export interface Window {
  id: string;
  wall: Wall;
  offsetCm: number;
  widthCm: number;
}

/**
 * A piece of furniture.
 *
 * Positioned by its centre, sized by its own axes, then rotated about that
 * centre. `rotationDeg` is clockwise, and 0° means the item's front faces
 * north (up the screen) — so a bed at 0° has its head at the north edge and its
 * foot pointing south. Rule 2 ("coffin position") is exactly a question about
 * that facing.
 */
export interface FurnitureItem {
  id: string;
  type: FurnitureType;
  /** Centre, cm from the room's top-left corner. */
  xCm: number;
  yCm: number;
  /** Extent along the item's own x axis before rotation, cm. */
  widthCm: number;
  /** Extent along the item's own y axis before rotation, cm. */
  depthCm: number;
  /** Clockwise rotation about the centre, degrees. 0 = front faces north. */
  rotationDeg: number;
  /** Optional user label (PRD §4.2). Omit the key entirely when unset. */
  label?: string;
}

/** Room dimensions. */
export interface Room {
  /** East–west extent (x), cm. */
  widthCm: number;
  /** North–south extent (y), cm. */
  lengthCm: number;
}

/**
 * A complete layout — the whole canvas state, and the unit of persistence.
 */
export interface Layout {
  /** Bumped when this shape changes incompatibly, so stored rows stay readable. */
  schemaVersion: 1;
  roomType: RoomType;
  room: Room;
  /** The unit the user is working in. Presentation only; never affects storage. */
  displayUnit: Unit;
  doors: Door[];
  windows: Window[];
  furniture: FurnitureItem[];
}

export const CURRENT_SCHEMA_VERSION = 1 as const;

/** An empty layout of the given type and size. */
export function createLayout(
  roomType: RoomType,
  room: Room,
  displayUnit: Unit = 'ft',
): Layout {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    roomType,
    room,
    displayUnit,
    doors: [],
    windows: [],
    furniture: [],
  };
}

/** The main entrance, or the first door, or null. */
export function mainDoor(layout: Layout): Door | null {
  return layout.doors.find((d) => d.isMain) ?? layout.doors[0] ?? null;
}
