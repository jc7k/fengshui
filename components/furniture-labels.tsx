/**
 * Item labels, as React Native text laid over the canvas.
 *
 * **Not Skia text, deliberately.** CanvasKit's system font manager is typically
 * empty on web, so `matchFont` returns a font that draws nothing and reports no
 * error — the same silent-blank failure class as importing Skia before the WASM
 * lands (docs/decisions/0001-skia-on-web.md). A `<Text>` uses the browser's own
 * fonts and cannot fail that way. This overlay is also where REQ-012 will hang
 * its rule badges.
 *
 * `pointerEvents="none"` throughout: the canvas underneath owns every gesture,
 * and a label that swallowed a press would make its own item unselectable.
 */
import { StyleSheet, Text, View } from 'react-native';

import { canvasFit } from './canvas-fit';
import { roomPointToPx, type Layout } from '../core';

/** Labels are centred on their item within a box of this width, pixels. */
const LABEL_WIDTH_PX = 140;

export interface FurnitureLabelsProps {
  layout: Layout;
  widthPx: number;
  heightPx: number;
}

export default function FurnitureLabels({ layout, widthPx, heightPx }: FurnitureLabelsProps) {
  const labelled = layout.furniture.filter((item) => item.label);
  if (labelled.length === 0) return null;

  const fit = canvasFit(layout.room, widthPx, heightPx);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} testID="furniture-labels">
      {labelled.map((item) => {
        const p = roomPointToPx(item.xCm, item.yCm, fit);
        return (
          <View
            key={item.id}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: p.x - LABEL_WIDTH_PX / 2,
              top: p.y - 9,
              width: LABEL_WIDTH_PX,
              alignItems: 'center',
            }}
          >
            <Text
              testID={`furniture-label-${item.id}`}
              numberOfLines={1}
              className="rounded bg-white/80 px-1 text-xs text-neutral-800"
            >
              {item.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
