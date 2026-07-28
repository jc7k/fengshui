/**
 * Room canvas — native (iOS/Android).
 *
 * Metro resolves `./room-canvas` to `room-canvas.web.tsx` on web, so this file
 * never reaches the web bundle. That split is the point: importing the Skia
 * renderer statically is correct on native and fatal on web, and a runtime
 * `Platform.OS` branch cannot express it — Metro follows the native branch's
 * `require` and pulls Skia into the web bundle anyway, which is exactly what
 * happened before this file was split. See docs/decisions/0001-skia-on-web.md.
 */
import { View } from 'react-native';

import RoomCanvasSkia from './room-canvas-skia';
import { useMeasuredSize } from './use-measured-size';

import type { Room } from '../core';

export interface RoomCanvasProps {
  room: Room;
}

export default function RoomCanvas({ room }: RoomCanvasProps) {
  const { size, onLayout, measured } = useMeasuredSize();

  return (
    <View testID="room-canvas-host" style={{ flex: 1, minHeight: 320 }} onLayout={onLayout}>
      {measured ? (
        <RoomCanvasSkia room={room} widthPx={size.width} heightPx={size.height} />
      ) : null}
    </View>
  );
}
