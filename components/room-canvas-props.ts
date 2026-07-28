import type { FurnitureTransform, FurnitureType, Layout, WallPlacement } from '../core';

/**
 * The canvas contract, shared by the web and native implementations.
 *
 * Kept in its own module so `room-canvas.web.tsx` can state its props without
 * importing anything from the native file (or vice versa) — the two must not
 * see each other, or Metro pulls Skia into the web bundle.
 */
export interface RoomCanvasProps {
  layout: Layout;
  selectedId: string | null;
  /** Whether drags snap to the grid — a view preference, not part of `Layout`. */
  snapEnabled: boolean;
  /** The type being dragged out of the palette, if any; a release drops it. */
  pendingDropType: FurnitureType | null;
  onSelect: (id: string | null) => void;
  onMoveOpening: (id: string, placement: WallPlacement) => void;
  onDropFurniture: (type: FurnitureType, xCm: number, yCm: number) => void;
  onMoveFurniture: (id: string, xCm: number, yCm: number) => void;
  onTransformFurniture: (id: string, transform: FurnitureTransform) => void;
  onRotateFurniture: (id: string, rotationDeg: number) => void;
  /** Opens and closes the one undo entry a whole drag is worth (REQ-009). */
  onBeginEntry: () => void;
  onEndEntry: () => void;
}
