// RISK GATE SPIKE (REQ-004) — delete once the editor is real.
// Proves react-native-skia + react-native-gesture-handler work on web, in both
// the dev server and the static export. No product code belongs here.
import { useEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';

// NOTE: the Skia component is NEVER imported statically. On web, importing any
// `@shopify/react-native-skia` module builds its API object from
// `global.CanvasKit` at import time — so a static import evaluates before
// LoadSkiaWeb has fetched the WASM and every draw call then dies on
// `Cannot read properties of undefined (reading 'PictureRecorder')`.
// Both branches below defer the import past that point.

// `web.output: "static"` also pre-renders every route in Node, where CanvasKit
// cannot load at all — so on web the canvas must not exist until after
// hydration.
function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

function WebSpike() {
  const {
    WithSkiaWeb,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
  } = require('@shopify/react-native-skia/lib/module/web') as typeof import('@shopify/react-native-skia/lib/module/web');
  return (
    <WithSkiaWeb
      getComponent={() => import('../components/spike/skia-spike')}
      fallback={
        <Text testID="skia-loading" style={{ padding: 24 }}>
          Loading CanvasKit…
        </Text>
      }
    />
  );
}

function NativeSpike() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const SkiaSpike = require('../components/spike/skia-spike').default;
  return <SkiaSpike />;
}

export default function SkiaSpikeRoute() {
  const hydrated = useHydrated();

  if (Platform.OS === 'web' && !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        <Text testID="skia-loading" style={{ padding: 24 }}>
          Loading CanvasKit…
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {Platform.OS === 'web' ? <WebSpike /> : <NativeSpike />}
    </View>
  );
}
