/**
 * The React binding over `layout-store.ts`.
 *
 * All the state, all the commands and the undo stack live in the store; this
 * hook owns one instance of it per screen and subscribes to it. It deliberately
 * holds no state of its own — anything kept here as well would be a second copy
 * of something the store already knows, and the two would drift.
 *
 * `canUndo` / `canRedo` are derived rather than stored, so they cannot fall out
 * of step with the stacks they describe.
 */
import { useState } from 'react';
import { useStore } from 'zustand';

import {
  canRedo,
  canUndo,
  createLayoutStore,
  type LayoutCommands,
} from './layout-store';
import type { Layout } from '../core';

export interface LayoutEditor extends LayoutCommands {
  canUndo: boolean;
  canRedo: boolean;
}

export function useLayoutEditor(initial: Layout): LayoutEditor {
  // Created once, lazily: a store rebuilt on a later render would arrive empty
  // and take the history with it.
  const [store] = useState(() => createLayoutStore(initial));
  const state = useStore(store);

  return { ...state, canUndo: canUndo(state), canRedo: canRedo(state) };
}
