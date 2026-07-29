/**
 * Design tokens for consumers that cannot use Tailwind classes.
 *
 * Skia paints take colour strings, not `className`, so the canvas needs the
 * same values `tailwind.config.js` exposes to the rest of the UI. Keep the two
 * in sync by hand — there is no build step wiring them together, and a token
 * that drifts here shows up as a canvas that quietly disagrees with its own
 * chrome.
 *
 * Source of truth: do-work/user-requests/UR-002/assets/DESIGN-apple.md
 *
 * This file lives in `components/` rather than `core/` on purpose: `core/` is
 * the platform-free rule engine and `tools/check-core-purity.mjs` fails the
 * build if presentation leaks into it. Colour is presentation.
 */

export const TOKENS = {
  primary: '#0066cc',
  primaryFocus: '#0071e3',
  primaryOnDark: '#2997ff',
  ink: '#1d1d1f',
  inkMuted80: '#333333',
  inkMuted48: '#7a7a7a',
  dividerSoft: '#f0f0f0',
  hairline: '#e0e0e0',
  canvas: '#ffffff',
  canvasParchment: '#f5f5f7',
  surfacePearl: '#fafafc',
  onPrimary: '#ffffff',
} as const;

/**
 * Severity is *status*, not an action, so it sits outside the document's
 * single-accent rule rather than breaking it. Info deliberately reuses Action
 * Blue; warning is the one added hue, chosen dark enough to carry text
 * contrast on its own surface.
 */
export const SEVERITY = {
  warning: '#b25000',
  warningSurface: '#fff4ec',
  warningHairline: '#f0d3c0',
  info: '#0066cc',
  infoSurface: '#eef4fc',
  infoHairline: '#cfe0f5',
} as const;
