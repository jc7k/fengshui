/**
 * Fitting a room onto a canvas.
 *
 * "To scale" is the load-bearing requirement: a 20×10 room must be visibly 2:1,
 * and the clearance rules measure real distances, so the mapping from
 * centimetres to pixels has to be a single uniform factor — never one factor per
 * axis, which would silently stretch the room and make a 24 cm gap look
 * different depending on its direction.
 *
 * Pure maths, no rendering, so it is unit-tested rather than eyeballed.
 */

import type { Room } from './types';

/**
 * Breathing room kept clear around the room, pixels.
 *
 * Exported because the renderer and the drag handler must compute the *same*
 * fit — if they disagree by even a pixel of padding, a pointer lands on
 * different centimetres than the one it appears to touch.
 */
export const PADDING_PX = 24;

export interface Viewport {
  /** Available drawing area in pixels. */
  widthPx: number;
  heightPx: number;
  /** Breathing room kept clear on every side, pixels. */
  paddingPx: number;
}

export interface RoomFit {
  /** The single uniform scale factor: multiply centimetres to get pixels. */
  pxPerCm: number;
  /** Where the room's top-left corner lands in the viewport, pixels. */
  offsetXPx: number;
  offsetYPx: number;
  /** The room's rendered size, pixels. */
  widthPx: number;
  heightPx: number;
}

/**
 * Fit a room into a viewport: as large as it goes while keeping its aspect
 * ratio and the requested padding, centred on both axes.
 *
 * Degenerate inputs (a zero-size room, a viewport smaller than its own padding)
 * return a zero fit rather than an Infinity or a NaN that would propagate into
 * the renderer.
 */
export function fitRoomToViewport(room: Room, viewport: Viewport): RoomFit {
  const usableW = viewport.widthPx - 2 * viewport.paddingPx;
  const usableH = viewport.heightPx - 2 * viewport.paddingPx;

  if (
    room.widthCm <= 0 ||
    room.lengthCm <= 0 ||
    usableW <= 0 ||
    usableH <= 0
  ) {
    return {
      pxPerCm: 0,
      offsetXPx: viewport.widthPx / 2,
      offsetYPx: viewport.heightPx / 2,
      widthPx: 0,
      heightPx: 0,
    };
  }

  const pxPerCm = Math.min(usableW / room.widthCm, usableH / room.lengthCm);
  const widthPx = room.widthCm * pxPerCm;
  const heightPx = room.lengthCm * pxPerCm;

  return {
    pxPerCm,
    offsetXPx: (viewport.widthPx - widthPx) / 2,
    offsetYPx: (viewport.heightPx - heightPx) / 2,
    widthPx,
    heightPx,
  };
}

/** Room centimetres → viewport pixels. */
export function cmToPx(cm: number, fit: RoomFit): number {
  return cm * fit.pxPerCm;
}

/** Viewport pixels → room centimetres. Zero-safe when the fit is degenerate. */
export function pxToCm(px: number, fit: RoomFit): number {
  return fit.pxPerCm === 0 ? 0 : px / fit.pxPerCm;
}

/** A point in room coordinates → a point in viewport coordinates. */
export function roomPointToPx(
  xCm: number,
  yCm: number,
  fit: RoomFit,
): { x: number; y: number } {
  return {
    x: fit.offsetXPx + xCm * fit.pxPerCm,
    y: fit.offsetYPx + yCm * fit.pxPerCm,
  };
}

/** A point in viewport coordinates → a point in room coordinates. */
export function pxPointToRoom(
  xPx: number,
  yPx: number,
  fit: RoomFit,
): { xCm: number; yCm: number } {
  if (fit.pxPerCm === 0) return { xCm: 0, yCm: 0 };
  return {
    xCm: (xPx - fit.offsetXPx) / fit.pxPerCm,
    yCm: (yPx - fit.offsetYPx) / fit.pxPerCm,
  };
}
