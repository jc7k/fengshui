/**
 * Dragging a door or window along the walls.
 *
 * Shared by both platform canvases. Deliberately free of Skia imports so the web
 * wrapper can use it without pulling the renderer into the entry bundle.
 *
 * The gesture runs on the JS thread (`runOnJS(true)`): placement is a React
 * state update at pointer speed, not a 60fps animation, and keeping it off the
 * worklet runtime avoids marshalling the layout across every frame.
 *
 * **Everything mutable lives in a ref, and the Gesture is built exactly once.**
 * The obvious version — `useMemo(..., [layout, fit])` with the drag target in a
 * closure — is silently broken: grabbing an opening selects it, selecting it
 * re-renders, the new render rebuilds the Gesture, and the rebuilt closure has
 * forgotten what was being dragged. The result is a canvas where nothing moves
 * and nothing errors.
 */
import { useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import {
  nearestOpening,
  pxPointToRoom,
  pxToCm,
  snapToWall,
  type Layout,
  type RoomFit,
  type WallPlacement,
} from '../core';

/** How close a pointer must be to grab an opening, in screen pixels. */
const GRAB_RADIUS_PX = 28;

export interface OpeningDragOptions {
  layout: Layout;
  fit: RoomFit;
  onSelect: (id: string | null) => void;
  onMove: (id: string, placement: WallPlacement) => void;
}

export function useOpeningDrag({ layout, fit, onSelect, onMove }: OpeningDragOptions) {
  // Read the latest values from callbacks that outlive the render that made them.
  const latest = useRef({ layout, fit, onSelect, onMove });
  latest.current = { layout, fit, onSelect, onMove };

  const dragging = useRef<{ id: string; widthCm: number } | null>(null);

  return useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => {
          const { layout: l, fit: f, onSelect: select } = latest.current;
          const point = pxPointToRoom(e.x, e.y, f);
          const hit = nearestOpening(
            { x: point.xCm, y: point.yCm },
            l,
            pxToCm(GRAB_RADIUS_PX, f),
          );
          dragging.current = hit ? { id: hit.id, widthCm: hit.widthCm } : null;
          select(hit ? hit.id : null);
        })
        .onUpdate((e) => {
          const target = dragging.current;
          if (!target) return;
          const { layout: l, fit: f, onMove: move } = latest.current;
          const point = pxPointToRoom(e.x, e.y, f);
          move(target.id, snapToWall({ x: point.xCm, y: point.yCm }, l.room, target.widthCm));
        })
        .onFinalize(() => {
          dragging.current = null;
        }),
    [],
  );
}
