/**
 * Units.
 *
 * CANONICAL INTERNAL UNIT: CENTIMETRES.
 *
 * Every length stored in a `Layout` — room dimensions, furniture size, positions,
 * clearances — is a number of centimetres. Feet and metres exist only at the two
 * edges of the system: the input the user types, and the label rendered back to
 * them. Nothing between those edges may carry a unit, and no geometry or rule
 * code may branch on one.
 *
 * Centimetres over inches because the PRD's own clearance threshold (24 in /
 * 60 cm) and every dimension a user is likely to type land on tidy centimetre
 * values, whereas inches invite fractions.
 */

/** A unit the user can choose to work in. Never used for storage. */
export type Unit = 'ft' | 'm';

const CM_PER_FOOT = 30.48;
const CM_PER_METRE = 100;

/** Centimetres per one of `unit`. Exact by definition — 1 ft ≡ 30.48 cm. */
export function cmPerUnit(unit: Unit): number {
  return unit === 'ft' ? CM_PER_FOOT : CM_PER_METRE;
}

/** User-facing value → canonical centimetres. Call at the input boundary. */
export function toCm(value: number, unit: Unit): number {
  return value * cmPerUnit(unit);
}

/** Canonical centimetres → user-facing value. Call at the display boundary. */
export function fromCm(cm: number, unit: Unit): number {
  return cm / cmPerUnit(unit);
}

/**
 * Format a canonical length for display, e.g. `12.5 ft`.
 *
 * Rounds for humans, so this is lossy by design — never round-trip through it.
 */
export function formatLength(cm: number, unit: Unit, fractionDigits = 1): string {
  return `${fromCm(cm, unit).toFixed(fractionDigits)} ${unit}`;
}

/** The PRD's minimum walkway clearance (§4.3 rule 4): 24 in / 60 cm. */
export const DEFAULT_MIN_CLEARANCE_CM = 60;
