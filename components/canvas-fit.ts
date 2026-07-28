/**
 * Turning a measured host View into a `RoomFit`, and a pointer event into room
 * centimetres.
 *
 * Three things need the same fit — the Skia renderer, the palette drop handler
 * on the host View, and the label overlay — and they agree only because they
 * measure the same View and come through this one function with the same
 * `PADDING_PX`. A pixel of disagreement puts a dropped item somewhere other
 * than where the pointer released it, so the arithmetic is not written twice.
 *
 * No Skia and no gesture-handler in here: the wrappers that call it are in the
 * entry bundle (docs/decisions/0001-skia-on-web.md).
 */
import type { PointerEvent } from 'react-native';

import {
  fitRoomToViewport,
  PADDING_PX,
  pxPointToRoom,
  type Room,
  type RoomFit,
} from '../core';

export function canvasFit(room: Room, widthPx: number, heightPx: number): RoomFit {
  return fitRoomToViewport(room, { widthPx, heightPx, paddingPx: PADDING_PX });
}

/**
 * Where a pointer event landed, in room centimetres.
 *
 * `offsetX`/`offsetY` are measured from the event's *target*, not from the
 * element whose handler is running. Here the two coincide because the canvas
 * fills the host View exactly. If that ever stops being true the fix is to swap
 * these two arguments for `measureInWindow` plus `clientX`/`clientY` — which is
 * precisely why this conversion is one function and not three copies.
 */
export function eventPointToRoom(
  e: PointerEvent,
  room: Room,
  widthPx: number,
  heightPx: number,
): { xCm: number; yCm: number } {
  const fit = canvasFit(room, widthPx, heightPx);
  return pxPointToRoom(e.nativeEvent.offsetX, e.nativeEvent.offsetY, fit);
}
