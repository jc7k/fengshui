/**
 * Dragging a furniture type out of the palette, on raw Pointer Events.
 *
 * **Nothing in this file or in `furniture-palette.tsx` may import
 * `react-native-gesture-handler` or Skia.** The palette renders before the Skia
 * chunk loads, so it lands in `entry-*.js` — the bundle the landing page
 * downloads on a cold load that already measures 23.4 s on Fast 3G
 * (docs/decisions/0001-skia-on-web.md). A single `import { Gesture }` here adds
 * gesture-handler plus reanimated, about 1.1 MB, to that download for the sake
 * of a drag that needs two callbacks. RN 0.86's `ViewProps` extends
 * `PointerEvents` and react-native-web forwards `onPointerDown` / `onPointerUp`
 * straight to the DOM, which is all this needs.
 *
 * The hook only remembers what is in flight; the drop is caught by the canvas
 * wrapper's `onPointerUp`. The end-of-drag listener is on `window` and not on
 * the chip because with a mouse `pointerup` fires on whatever is under the
 * pointer, not on the element the gesture started from — a release anywhere
 * outside the canvas has to end the drag too. A bubble-phase `window` listener
 * runs after every listener on a descendant node, so the canvas always sees the
 * pending type before this clears it.
 *
 * Known limitation on touch: implicit pointer capture sends `pointerup` back to
 * the chip, so a dragged drop never reaches the canvas. Pressing a chip places
 * the item at the room centre instead — that is the touch path and the keyboard
 * path both, and it is why the palette wires up a press as well as a drag.
 */
import { useEffect, useState } from 'react';

import type { FurnitureType } from '../core';

export interface PaletteDrag {
  /** The type being dragged out of the palette right now, or null. */
  pendingType: FurnitureType | null;
  /** Call from a chip's `onPointerDown`. */
  begin: (type: FurnitureType) => void;
}

export function usePaletteDrag(): PaletteDrag {
  const [pendingType, setPendingType] = useState<FurnitureType | null>(null);

  useEffect(() => {
    // Checked at runtime rather than behind a platform import, so Metro has
    // nothing to hoist: there is no `window` during the static pre-render and
    // none on native, where the press path is the only one anyway.
    if (pendingType === null || typeof window === 'undefined') return;

    const clear = () => setPendingType(null);
    window.addEventListener('pointerup', clear);
    window.addEventListener('pointercancel', clear);
    return () => {
      window.removeEventListener('pointerup', clear);
      window.removeEventListener('pointercancel', clear);
    };
  }, [pendingType]);

  return { pendingType, begin: (type) => setPendingType(type) };
}
