import { describe, expect, it } from 'vitest';

import { DEFAULT_MIN_CLEARANCE_CM, formatLength, fromCm, toCm } from './units';

describe('unit conversion', () => {
  it('uses the exact definition of a foot', () => {
    expect(toCm(1, 'ft')).toBe(30.48);
    expect(toCm(1, 'm')).toBe(100);
  });

  it('converts realistic room dimensions', () => {
    expect(toCm(12, 'ft')).toBeCloseTo(365.76, 10);
    expect(toCm(3.5, 'm')).toBe(350);
    expect(fromCm(365.76, 'ft')).toBeCloseTo(12, 10);
    expect(fromCm(350, 'm')).toBe(3.5);
  });

  it('round-trips through the canonical unit without drift', () => {
    // Every value a user might plausibly type, both ways.
    for (const value of [0, 0.5, 1, 7.25, 12, 33.333, 1000]) {
      expect(fromCm(toCm(value, 'ft'), 'ft')).toBeCloseTo(value, 10);
      expect(fromCm(toCm(value, 'm'), 'm')).toBeCloseTo(value, 10);
    }
  });

  it('round-trips between the two display units', () => {
    const cm = toCm(10, 'ft');
    const asMetres = fromCm(cm, 'm');
    expect(toCm(asMetres, 'm')).toBeCloseTo(cm, 10);
  });

  it('does not confuse the two units', () => {
    // Guards the classic silent-wrong-answer bug: a feet value read as metres.
    expect(toCm(10, 'ft')).not.toBeCloseTo(toCm(10, 'm'), 0);
  });

  it('handles zero and negatives symmetrically', () => {
    expect(toCm(0, 'ft')).toBe(0);
    expect(toCm(-5, 'ft')).toBeCloseTo(-toCm(5, 'ft'), 10);
  });
});

describe('formatLength', () => {
  it('rounds for humans', () => {
    expect(formatLength(365.76, 'ft')).toBe('12.0 ft');
    expect(formatLength(350, 'm')).toBe('3.5 m');
    expect(formatLength(365.76, 'ft', 0)).toBe('12 ft');
  });
});

describe('DEFAULT_MIN_CLEARANCE_CM', () => {
  it("matches the PRD's 24 in / 60 cm walkway threshold", () => {
    expect(DEFAULT_MIN_CLEARANCE_CM).toBe(60);
    // 24 inches is 60.96 cm; the PRD rounds to 60 and so do we.
    expect(DEFAULT_MIN_CLEARANCE_CM).toBeLessThan(toCm(2, 'ft'));
  });
});
