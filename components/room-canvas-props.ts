import type { Layout, WallPlacement } from '../core';

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
  onSelect: (id: string | null) => void;
  onMoveOpening: (id: string, placement: WallPlacement) => void;
}
