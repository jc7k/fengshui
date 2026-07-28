/**
 * The room, drawn to scale.
 *
 * Loaded lazily — see `room-canvas.tsx`. Nothing may import this module
 * statically on web (REQ-004 / docs/decisions/0001-skia-on-web.md).
 */
import { Canvas, Rect } from '@shopify/react-native-skia';
import type { Room } from '../core';
import { fitRoomToViewport } from '../core';

export interface RoomCanvasProps {
  room: Room;
  widthPx: number;
  heightPx: number;
}

const PADDING_PX = 24;
const WALL_PX = 3;

export default function RoomCanvasSkia({ room, widthPx, heightPx }: RoomCanvasProps) {
  const fit = fitRoomToViewport(room, {
    widthPx,
    heightPx,
    paddingPx: PADDING_PX,
  });

  return (
    <Canvas style={{ width: widthPx, height: heightPx }} testID="room-canvas">
      {/* Floor */}
      <Rect
        x={fit.offsetXPx}
        y={fit.offsetYPx}
        width={fit.widthPx}
        height={fit.heightPx}
        color="#f8fafc"
      />
      {/* Walls */}
      <Rect
        x={fit.offsetXPx}
        y={fit.offsetYPx}
        width={fit.widthPx}
        height={fit.heightPx}
        color="#334155"
        style="stroke"
        strokeWidth={WALL_PX}
      />
    </Canvas>
  );
}
