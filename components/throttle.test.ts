import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createThrottler } from './throttle';

describe('createThrottler', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const collector = () => {
    const seen: number[] = [];
    return { seen, throttler: createThrottler<number>(100, (v) => seen.push(v)) };
  };

  it('emits the first value synchronously', () => {
    const { seen, throttler } = collector();
    throttler.push(1);
    expect(seen).toEqual([1]);
  });

  it('coalesces a burst down to the last value', () => {
    const { seen, throttler } = collector();
    throttler.push(1);
    throttler.push(2);
    throttler.push(3);
    expect(seen).toEqual([1]);

    vi.advanceTimersByTime(100);
    expect(seen).toEqual([1, 3]);
  });

  it('always emits the resting value at the end of a burst', () => {
    // The correctness property: intermediate frames may be dropped, the final
    // one never is.
    const { seen, throttler } = collector();
    for (let i = 0; i < 50; i++) throttler.push(i);
    vi.advanceTimersByTime(1000);
    expect(seen.at(-1)).toBe(49);
  });

  it('does not emit again when nothing arrived during the window', () => {
    const { seen, throttler } = collector();
    throttler.push(1);
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([1]);
  });

  it('emits synchronously again once the window has closed quietly', () => {
    const { seen, throttler } = collector();
    throttler.push(1);
    vi.advanceTimersByTime(100);
    throttler.push(2);
    expect(seen).toEqual([1, 2]);
  });

  it('paces a continuous stream at one emission per interval', () => {
    const { seen, throttler } = collector();
    throttler.push(0);
    for (let i = 1; i <= 10; i++) {
      throttler.push(i);
      vi.advanceTimersByTime(50);
    }
    // 500 ms of pushes at 100 ms: the leading emission plus five windows.
    expect(seen.length).toBeLessThanOrEqual(7);
    expect(seen[0]).toBe(0);
  });

  it('drops a pending trailing emission on cancel', () => {
    const { seen, throttler } = collector();
    throttler.push(1);
    throttler.push(2);
    throttler.cancel();
    vi.advanceTimersByTime(1000);
    expect(seen).toEqual([1]);
  });
});
