/**
 * Every drag on the canvas: openings along the walls, and furniture moved,
 * resized or rotated.
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
 * and nothing errors. `snapEnabled` and `selectedId` are in the same ref for the
 * same reason, and their failure is quieter still: a snap toggle that reads its
 * mount-time value forever, with nothing in the console.
 *
 * **One `Pan`, not one per kind of drag.** Two detectors would both pass their
 * activation criteria on the same pointer, both `onBegin`s would run, and the
 * two would fight over the selection.
 */
import { useMemo, useRef } from 'react';
import { Gesture } from 'react-native-gesture-handler';

import {
  furnitureAt,
  gridSizeCm,
  hitHandle,
  MIN_FURNITURE_CM,
  nearestOpening,
  pxPointToRoom,
  pxToCm,
  resizeFromCorner,
  rotationFromPointer,
  ROTATION_SNAP_DEG,
  snapAngle,
  snapPointToGrid,
  snapToWall,
  type Corner,
  type FurnitureTransform,
  type Layout,
  type RoomFit,
  type WallPlacement,
} from '../core';

/** How close a pointer must be to grab an opening, in screen pixels. */
const GRAB_RADIUS_PX = 28;

/**
 * How far beyond an item's front edge the rotate knob sits, in screen pixels.
 *
 * Exported because the renderer draws the handles this positions; if the two
 * numbers drift, the knob is not where it looks like it is.
 */
export const HANDLE_KNOB_PX = 26;

/** How close a pointer must be to grab a handle, in screen pixels. */
export const HANDLE_HIT_PX = 14;

/**
 * The smallest extent the item hit test will use, in screen pixels.
 *
 * A mirror is 5 cm deep. At any sane zoom that is a line nobody can click, and
 * an item that cannot be selected cannot be deleted either.
 */
const MIN_PICK_PX = 20;

/**
 * What the current drag is doing. Transient by nature and therefore in a ref —
 * putting any of it in state rebuilds the Gesture mid-drag.
 */
type DragTarget =
  | { kind: 'opening'; id: string; widthCm: number }
  | { kind: 'move'; id: string; grabDxCm: number; grabDyCm: number }
  | { kind: 'resize'; id: string; corner: Corner }
  | { kind: 'rotate'; id: string };

export interface CanvasDragOptions {
  layout: Layout;
  fit: RoomFit;
  selectedId: string | null;
  snapEnabled: boolean;
  onSelect: (id: string | null) => void;
  onMoveOpening: (id: string, placement: WallPlacement) => void;
  onMoveFurniture: (id: string, xCm: number, yCm: number) => void;
  onTransformFurniture: (id: string, transform: FurnitureTransform) => void;
  onRotateFurniture: (id: string, rotationDeg: number) => void;
}

export function useCanvasDrag(options: CanvasDragOptions) {
  // Read the latest values from callbacks that outlive the render that made them.
  const latest = useRef(options);
  latest.current = options;

  const dragging = useRef<DragTarget | null>(null);

  return useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .onBegin((e) => {
          const { layout: l, fit: f, selectedId, onSelect } = latest.current;
          const p = pxPointToRoom(e.x, e.y, f);
          const point = { x: p.xCm, y: p.yCm };

          // Priority, first match wins. Handles first: they overlap the item
          // they belong to, and a corner grab must not read as a move.
          const selected = l.furniture.find((item) => item.id === selectedId);
          if (selected) {
            const handle = hitHandle(
              point,
              selected,
              pxToCm(HANDLE_KNOB_PX, f),
              pxToCm(HANDLE_HIT_PX, f),
            );
            if (handle === 'rotate') {
              dragging.current = { kind: 'rotate', id: selected.id };
              return;
            }
            if (handle) {
              dragging.current = { kind: 'resize', id: selected.id, corner: handle };
              return;
            }
          }

          // Then the item under the pointer. The grab offset is remembered so
          // the centre stays where it was relative to the finger, instead of
          // teleporting to it on the first move.
          const item = furnitureAt(point, l, pxToCm(MIN_PICK_PX, f));
          if (item) {
            dragging.current = {
              kind: 'move',
              id: item.id,
              grabDxCm: item.xCm - point.x,
              grabDyCm: item.yCm - point.y,
            };
            onSelect(item.id);
            return;
          }

          // Then openings, unchanged from REQ-007.
          const hit = nearestOpening(point, l, pxToCm(GRAB_RADIUS_PX, f));
          dragging.current = hit ? { kind: 'opening', id: hit.id, widthCm: hit.widthCm } : null;
          onSelect(hit ? hit.id : null);
        })
        .onUpdate((e) => {
          const target = dragging.current;
          if (!target) return;
          const {
            layout: l,
            fit: f,
            snapEnabled,
            onMoveOpening,
            onMoveFurniture,
            onTransformFurniture,
            onRotateFurniture,
          } = latest.current;

          const p = pxPointToRoom(e.x, e.y, f);
          const point = { x: p.xCm, y: p.yCm };
          // Snapping off is expressed as a zero grid, which `core/grid` treats
          // as the identity — no branching here, and none in the ops either.
          const gridCm = snapEnabled ? gridSizeCm(l.displayUnit) : 0;

          switch (target.kind) {
            case 'opening':
              onMoveOpening(target.id, snapToWall(point, l.room, target.widthCm));
              return;

            case 'move': {
              const centre = snapPointToGrid(
                { x: point.x + target.grabDxCm, y: point.y + target.grabDyCm },
                gridCm,
              );
              onMoveFurniture(target.id, centre.x, centre.y);
              return;
            }

            case 'resize': {
              const item = l.furniture.find((f2) => f2.id === target.id);
              if (!item) return;
              onTransformFurniture(
                target.id,
                resizeFromCorner(item, target.corner, point, {
                  minSizeCm: MIN_FURNITURE_CM,
                  gridCm,
                }),
              );
              return;
            }

            case 'rotate': {
              const item = l.furniture.find((f2) => f2.id === target.id);
              if (!item) return;
              onRotateFurniture(
                target.id,
                snapAngle(
                  rotationFromPointer(item, point),
                  snapEnabled ? ROTATION_SNAP_DEG : 0,
                ),
              );
              return;
            }
          }
        })
        // The end of a drag, and therefore where REQ-009 will close one undo
        // entry — however many `onUpdate`s it took.
        .onFinalize(() => {
          dragging.current = null;
        }),
    [],
  );
}
