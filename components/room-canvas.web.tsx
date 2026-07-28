/**
 * Room canvas — web.
 *
 * Two rules from REQ-004 (docs/decisions/0001-skia-on-web.md) are enforced here,
 * once, so no screen has to remember them:
 *
 *   1. No static import of the Skia renderer. Skia builds its API from
 *      `global.CanvasKit` at import time; importing before the WASM lands leaves
 *      the canvas mounted, correctly sized, and permanently blank. Only the
 *      small `web` loader entry point is imported directly.
 *   2. No canvas during the static pre-render. `web.output: "static"` runs every
 *      route in Node, where CanvasKit aborts and takes the dev server with it.
 *      Hence the hydration gate.
 *
 * This file stays deliberately thin. Everything heavy — Skia, gesture-handler,
 * reanimated — sits behind `getComponent` so it lands in a lazy chunk rather
 * than the entry bundle the landing page downloads.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useMeasuredSize } from './use-measured-size';
import type { RoomCanvasProps } from './room-canvas-props';

function Loading() {
  return (
    <View
      testID="canvas-loading"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
    >
      <ActivityIndicator />
    </View>
  );
}

function SkiaCanvas(props: Record<string, unknown>) {
  const {
    WithSkiaWeb,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@shopify/react-native-skia/lib/module/web') as typeof import('@shopify/react-native-skia/lib/module/web');

  return (
    <WithSkiaWeb
      getComponent={() => import('./room-canvas-skia')}
      componentProps={props as never}
      fallback={<Loading />}
    />
  );
}

export default function RoomCanvas(props: RoomCanvasProps) {
  const [hydrated, setHydrated] = useState(false);
  const { size, onLayout, measured } = useMeasuredSize();

  useEffect(() => setHydrated(true), []);

  return (
    <View testID="room-canvas-host" style={{ flex: 1, minHeight: 320 }} onLayout={onLayout}>
      {hydrated && measured ? (
        <SkiaCanvas {...props} widthPx={size.width} heightPx={size.height} />
      ) : (
        <Loading />
      )}
    </View>
  );
}
