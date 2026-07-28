/**
 * Live rule feedback for the layout on screen.
 *
 * Derived, not stored. `evaluate` is a pure function of the `Layout`, and
 * `layout-store.ts` keeps `layout` as "the one readable thing" precisely so
 * nothing has to be kept in step with it — a findings slice in the store would
 * be a second copy that could drift on undo, redo or delete. Deriving here
 * covers all of those with no extra wiring, exactly as `use-layout-editor`
 * derives `canUndo`.
 *
 * The one piece of machinery is the throttle, and it sits in exactly one place:
 * on the layout *snapshot* handed to `evaluate`. Its leading edge is
 * synchronous, so placing, deleting and undoing feel immediate; its trailing
 * edge is unconditional, so the layout you stop dragging on is always the one
 * judged. In between, the snapshot's identity holds still — which is what lets
 * `React.memo` keep the panel out of the drag's render path.
 */
import { useEffect, useMemo, useState } from 'react';

import { feedbackView, type FeedbackView } from './findings-view';
import { createThrottler } from './throttle';
import { evaluate, type Layout } from '../core';

/** How often a moving layout is re-judged, milliseconds. */
export const FEEDBACK_THROTTLE_MS = 100;

export function useFindings(layout: Layout): FeedbackView {
  const [snapshot, setSnapshot] = useState(layout);
  // Created once: a throttler rebuilt on a later render would lose its window
  // and emit on every frame.
  const [throttler] = useState(() => createThrottler<Layout>(FEEDBACK_THROTTLE_MS, setSnapshot));

  useEffect(() => throttler.push(layout), [layout, throttler]);
  useEffect(() => () => throttler.cancel(), [throttler]);

  const evaluation = useMemo(() => evaluate(snapshot), [snapshot]);
  return useMemo(() => feedbackView(evaluation, snapshot), [evaluation, snapshot]);
}
