// RISK GATE SPIKE (REQ-004) — delete once the editor is real.
import { Canvas, Circle, Rect } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

const CANVAS = { width: 320, height: 320 };
const RECT = { size: 80, startX: 40, startY: 40 };

export default function SkiaSpike() {
  // The Skia rect is driven by shared values (UI thread, no React re-render);
  // `readout` mirrors them to the DOM only so the drag can be asserted in a test.
  const x = useSharedValue(RECT.startX);
  const y = useSharedValue(RECT.startY);
  const [readout, setReadout] = useState({ x: RECT.startX, y: RECT.startY });

  const offset = useSharedValue({ x: RECT.startX, y: RECT.startY });

  const pan = Gesture.Pan()
    .onBegin(() => {
      offset.value = { x: x.value, y: y.value };
    })
    .onUpdate((e) => {
      x.value = offset.value.x + e.translationX;
      y.value = offset.value.y + e.translationY;
    })
    .onEnd(() => {
      runOnJS(setReadout)({ x: Math.round(x.value), y: Math.round(y.value) });
    });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ padding: 16, gap: 8 }}>
        <Text testID="skia-ready">skia-ready</Text>
        <Text testID="rect-pos">{`${readout.x},${readout.y}`}</Text>
        <GestureDetector gesture={pan}>
          <View testID="skia-canvas" style={CANVAS}>
            <Canvas style={{ flex: 1 }}>
              <Rect x={x} y={y} width={RECT.size} height={RECT.size} color="#2563eb" />
              <Circle cx={240} cy={240} r={48} color="#dc2626" />
            </Canvas>
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
}
