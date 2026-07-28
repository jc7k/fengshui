import { describe, expect, it } from 'vitest';

import { cmToPx, fitRoomToViewport, pxPointToRoom, pxToCm, roomPointToPx } from './scale';
import { toCm } from './units';

const viewport = { widthPx: 800, heightPx: 600, paddingPx: 20 };

describe('fitRoomToViewport', () => {
  it('preserves the room aspect ratio on screen', () => {
    // The acceptance criterion: a 20x10 room must render 2:1.
    const fit = fitRoomToViewport({ widthCm: toCm(20, 'ft'), lengthCm: toCm(10, 'ft') }, viewport);
    expect(fit.widthPx / fit.heightPx).toBeCloseTo(2, 10);
  });

  it('renders a 10x20 room as the transpose of a 20x10 one', () => {
    // Only true in a square viewport — in a 4:3 one each orientation is limited
    // by a different axis, which is correct behaviour, not a bug.
    const square = { widthPx: 600, heightPx: 600, paddingPx: 20 };
    const wide = fitRoomToViewport({ widthCm: 600, lengthCm: 300 }, square);
    const tall = fitRoomToViewport({ widthCm: 300, lengthCm: 600 }, square);
    expect(wide.widthPx).toBeCloseTo(tall.heightPx, 10);
    expect(wide.heightPx).toBeCloseTo(tall.widthPx, 10);
  });

  it('distinguishes a 20x10 room from a 10x20 one', () => {
    // The acceptance criterion's real intent: orientation must be visible.
    const wide = fitRoomToViewport({ widthCm: 600, lengthCm: 300 }, viewport);
    const tall = fitRoomToViewport({ widthCm: 300, lengthCm: 600 }, viewport);
    expect(wide.widthPx).toBeGreaterThan(wide.heightPx);
    expect(tall.heightPx).toBeGreaterThan(tall.widthPx);
  });

  it('uses one uniform scale factor for both axes', () => {
    // Two factors would stretch the room and make a 60cm gap look different
    // depending on its direction.
    const room = { widthCm: 500, lengthCm: 370 };
    const fit = fitRoomToViewport(room, viewport);
    expect(fit.widthPx / room.widthCm).toBeCloseTo(fit.heightPx / room.lengthCm, 10);
    expect(fit.widthPx / room.widthCm).toBeCloseTo(fit.pxPerCm, 10);
  });

  it('fills the constraining axis and respects padding', () => {
    // A very wide room is limited by viewport width.
    const fit = fitRoomToViewport({ widthCm: 1000, lengthCm: 100 }, viewport);
    expect(fit.widthPx).toBeCloseTo(800 - 40, 10);
    expect(fit.offsetXPx).toBeCloseTo(20, 10);
  });

  it('centres the room on both axes', () => {
    const fit = fitRoomToViewport({ widthCm: 400, lengthCm: 300 }, viewport);
    expect(fit.offsetXPx + fit.widthPx / 2).toBeCloseTo(viewport.widthPx / 2, 10);
    expect(fit.offsetYPx + fit.heightPx / 2).toBeCloseTo(viewport.heightPx / 2, 10);
  });

  it('never overflows the viewport, across plausible rooms', () => {
    const rooms = [
      { widthCm: toCm(40, 'ft'), lengthCm: toCm(6, 'ft') }, // the REQ's extreme case
      { widthCm: toCm(6, 'ft'), lengthCm: toCm(40, 'ft') },
      { widthCm: toCm(8, 'ft'), lengthCm: toCm(8, 'ft') },
      { widthCm: toCm(25, 'ft'), lengthCm: toCm(18, 'ft') },
      { widthCm: 200, lengthCm: 1500 },
    ];
    for (const room of rooms) {
      const fit = fitRoomToViewport(room, viewport);
      expect(fit.widthPx).toBeLessThanOrEqual(viewport.widthPx - 2 * viewport.paddingPx + 1e-9);
      expect(fit.heightPx).toBeLessThanOrEqual(viewport.heightPx - 2 * viewport.paddingPx + 1e-9);
      expect(fit.offsetXPx).toBeGreaterThanOrEqual(viewport.paddingPx - 1e-9);
      expect(fit.offsetYPx).toBeGreaterThanOrEqual(viewport.paddingPx - 1e-9);
      // ...and is still big enough to see: at least one axis fills its space.
      const fillsWidth = Math.abs(fit.widthPx - (viewport.widthPx - 2 * viewport.paddingPx)) < 1e-9;
      const fillsHeight = Math.abs(fit.heightPx - (viewport.heightPx - 2 * viewport.paddingPx)) < 1e-9;
      expect(fillsWidth || fillsHeight).toBe(true);
    }
  });

  it('is unaffected by which unit the user typed', () => {
    // 10 ft entered as feet or as its metric equivalent must render identically.
    const asFeet = fitRoomToViewport({ widthCm: toCm(10, 'ft'), lengthCm: toCm(8, 'ft') }, viewport);
    const asMetres = fitRoomToViewport(
      { widthCm: toCm(3.048, 'm'), lengthCm: toCm(2.4384, 'm') },
      viewport,
    );
    expect(asMetres.pxPerCm).toBeCloseTo(asFeet.pxPerCm, 8);
    expect(asMetres.widthPx).toBeCloseTo(asFeet.widthPx, 6);
  });

  it('returns a zero fit rather than Infinity for degenerate input', () => {
    for (const room of [
      { widthCm: 0, lengthCm: 300 },
      { widthCm: 400, lengthCm: 0 },
      { widthCm: -5, lengthCm: 300 },
    ]) {
      const fit = fitRoomToViewport(room, viewport);
      expect(fit.pxPerCm).toBe(0);
      expect(Number.isFinite(fit.offsetXPx)).toBe(true);
    }
  });

  it('returns a zero fit when padding swallows the viewport', () => {
    const fit = fitRoomToViewport({ widthCm: 400, lengthCm: 300 }, { widthPx: 30, heightPx: 30, paddingPx: 20 });
    expect(fit.pxPerCm).toBe(0);
  });
});

describe('coordinate mapping', () => {
  const fit = fitRoomToViewport({ widthCm: 400, lengthCm: 300 }, viewport);

  it('round-trips centimetres through pixels', () => {
    for (const cm of [0, 1, 60, 243.84, 400]) {
      expect(pxToCm(cmToPx(cm, fit), fit)).toBeCloseTo(cm, 8);
    }
  });

  it('round-trips points', () => {
    const p = roomPointToPx(150, 275, fit);
    const back = pxPointToRoom(p.x, p.y, fit);
    expect(back.xCm).toBeCloseTo(150, 8);
    expect(back.yCm).toBeCloseTo(275, 8);
  });

  it("puts the room's origin at the fit offset", () => {
    const origin = roomPointToPx(0, 0, fit);
    expect(origin.x).toBeCloseTo(fit.offsetXPx, 10);
    expect(origin.y).toBeCloseTo(fit.offsetYPx, 10);
  });

  it('does not divide by zero on a degenerate fit', () => {
    const zero = fitRoomToViewport({ widthCm: 0, lengthCm: 0 }, viewport);
    expect(pxToCm(100, zero)).toBe(0);
    expect(pxPointToRoom(100, 100, zero)).toEqual({ xCm: 0, yCm: 0 });
  });
});
