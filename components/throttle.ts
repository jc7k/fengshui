/**
 * A leading-edge throttle that always emits the last value it was given.
 *
 * **Renderer-free on purpose.** This is plain TypeScript with no React and no
 * `react-native` import, for two reasons. Vitest here runs on the node default
 * environment with no jsdom and no `react-native` → `react-native-web` alias,
 * so anything importing the renderer cannot be tested at all; and the modules
 * that use this one sit in the entry bundle, where every extra import is
 * weight the landing page downloads (docs/decisions/0001-skia-on-web.md).
 *
 * The two edges are not symmetric, and that asymmetry is the whole point:
 *
 *   - **Leading** fires synchronously, so a placement, a delete or an undo has
 *     zero added latency.
 *   - **Trailing** is unconditional — every burst ends with the last value
 *     emitted. Intermediate frames of a drag are dropped; the resting layout
 *     never is, so correctness is never sampled away.
 */

export interface Throttler<T> {
  /** Offer a value. Emits now, or schedules the trailing emission. */
  push: (value: T) => void;
  /** Drop any pending trailing emission. For effect cleanup. */
  cancel: () => void;
}

export function createThrottler<T>(intervalMs: number, emit: (value: T) => void): Throttler<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T } | null = null;

  const flush = () => {
    timer = null;
    if (!pending) return;
    const { value } = pending;
    pending = null;
    emit(value);
    // The emission itself opens a fresh window, so a drag that keeps producing
    // values settles into one emission per interval rather than two.
    timer = setTimeout(flush, intervalMs);
  };

  return {
    push(value: T) {
      if (timer === null) {
        emit(value);
        timer = setTimeout(flush, intervalMs);
        return;
      }
      pending = { value };
    },
    cancel() {
      if (timer !== null) clearTimeout(timer);
      timer = null;
      pending = null;
    },
  };
}
