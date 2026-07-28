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
import { View, type PointerEvent } from 'react-native';

import { eventPointToRoom } from './canvas-fit';
import FindingBadges from './finding-badges';
import FurnitureLabels from './furniture-labels';
import RoomCanvasSkia from './room-canvas-skia';
import { useMeasuredSize } from './use-measured-size';
import type { RoomCanvasProps } from './room-canvas-props';

export default function RoomCanvas(props: RoomCanvasProps) {
  const { layout, badges, pendingDropType, onDropFurniture } = props;
  const { size, onLayout, measured } = useMeasuredSize();

  /**
   * A palette chip released over the room.
   *
   * The drop point is converted against the size measured for *this* View, the
   * same one handed to the Skia child — that shared measurement and the shared
   * `PADDING_PX` inside `eventPointToRoom` are the only reason the two fits
   * agree and the item lands under the pointer.
   */
  const handlePointerUp = (e: PointerEvent) => {
    if (!pendingDropType || !measured) return;
    const p = eventPointToRoom(e, layout.room, size.width, size.height);
    onDropFurniture(pendingDropType, p.xCm, p.yCm);
  };

  return (
    <View
      testID="room-canvas-host"
      style={{ flex: 1, minHeight: 320 }}
      onLayout={onLayout}
      onPointerUp={handlePointerUp}
    >
      {measured ? (
        <>
          <RoomCanvasSkia {...props} widthPx={size.width} heightPx={size.height} />
          <FurnitureLabels layout={layout} widthPx={size.width} heightPx={size.height} />
          <FindingBadges
            layout={layout}
            badges={badges}
            widthPx={size.width}
            heightPx={size.height}
          />
        </>
      ) : null}
    </View>
  );
}
