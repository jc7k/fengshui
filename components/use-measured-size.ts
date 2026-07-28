import { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';

/**
 * The pixel size of a View, measured after layout.
 *
 * The canvas needs a real viewport before it can scale a room to fit, and that
 * is only known once React Native has laid the container out — so the first
 * render is always a zero size, and callers must wait for it.
 */
export function useMeasuredSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize((prev) =>
      prev.width === width && prev.height === height ? prev : { width, height },
    );
  }, []);

  return { size, onLayout, measured: size.width > 0 && size.height > 0 };
}
