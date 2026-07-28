/**
 * The live feedback panel (REQ-012).
 *
 * Reads a `FeedbackView` and renders it. There is no rule logic here — not a
 * threshold, not a predicate, not a rewrite of a rule's words. `explanation`
 * and `fix` are printed exactly as the domain expert wrote them; everything
 * this file adds is structure and headings.
 *
 * **Written for a curious beginner.** No feng shui vocabulary is required to
 * get value from it: "Things to look at" rather than "Violations", the item's
 * own name rather than an id, and every finding paired with the one thing to
 * try.
 *
 * **Severity is never colour alone.** Each row carries the literal word
 * "Warning" or "Tip" beside its colour, matching the `!` and `i` glyphs on the
 * canvas badges.
 *
 * `React.memo` is the other half of the throttle in `use-findings.ts`: the view
 * object only changes identity when a new evaluation lands, so a drag re-renders
 * the canvas without re-rendering this list. `onSelect` comes from the store and
 * is created once, so the memo actually holds.
 */
import React from 'react';
import { Pressable, Text, View } from 'react-native';

import type { FeedbackView, IssueRow } from './findings-view';

export interface FeedbackPanelProps {
  view: FeedbackView;
  /** Selecting the item a finding is about; highlights it on the canvas. */
  onSelect: (id: string | null) => void;
}

/** "2 things to look at · 1 tip · 4 checks passed", in words a beginner reads. */
function summary(view: FeedbackView): string {
  const parts: string[] = [];
  if (view.warningCount > 0) {
    parts.push(`${view.warningCount} thing${view.warningCount === 1 ? '' : 's'} to look at`);
  }
  if (view.tipCount > 0) parts.push(`${view.tipCount} tip${view.tipCount === 1 ? '' : 's'}`);
  if (view.passed.length > 0) parts.push(`${view.passed.length} passed`);
  if (parts.length === 0) return 'Nothing to report yet.';
  return parts.join(' · ');
}

function Issue({ row, onSelect }: { row: IssueRow; onSelect: (id: string | null) => void }) {
  const warning = row.severity === 'warning';
  return (
    <Pressable
      testID={`feedback-issue-${row.key}`}
      accessibilityRole={row.selectableId ? 'button' : undefined}
      disabled={!row.selectableId}
      onPress={() => onSelect(row.selectableId)}
      className={`mb-2 rounded border p-3 ${
        warning ? 'border-amber-300 bg-amber-50' : 'border-sky-300 bg-sky-50'
      }`}
    >
      <View className="mb-1 flex-row items-center gap-2">
        <Text
          className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${
            warning ? 'bg-amber-500' : 'bg-sky-500'
          }`}
        >
          {warning ? 'Warning' : 'Tip'}
        </Text>
        <Text className="flex-1 text-sm font-semibold text-neutral-900">{row.title}</Text>
      </View>
      <Text className="mb-1 text-xs text-neutral-500">{row.itemNames}</Text>
      <Text className="mb-1 text-sm text-neutral-800">{row.explanation}</Text>
      <Text className="text-sm text-neutral-700">Try this: {row.fix}</Text>
    </Pressable>
  );
}

function FeedbackPanel({ view, onSelect }: FeedbackPanelProps) {
  return (
    <View testID="feedback-panel" className="border-t border-neutral-200 px-4 py-4">
      <Text className="text-base font-semibold text-neutral-900">How this layout is doing</Text>
      <Text testID="feedback-summary" className="mb-3 text-sm text-neutral-500">
        {summary(view)}
      </Text>

      {!view.hasFurniture ? (
        <Text testID="feedback-empty" className="text-sm text-neutral-500">
          Add a piece of furniture and feedback will appear here as you move it.
        </Text>
      ) : null}

      {view.issues.length > 0 ? (
        <>
          <Text className="mb-2 text-sm font-semibold text-neutral-700">Things to look at</Text>
          {view.issues.map((row) => (
            <Issue key={row.key} row={row} onSelect={onSelect} />
          ))}
        </>
      ) : view.hasFurniture ? (
        <Text testID="feedback-all-clear" className="mb-3 text-sm text-neutral-700">
          Nothing to flag right now.
        </Text>
      ) : null}

      {view.passed.length > 0 ? (
        <>
          <Text className="mb-1 mt-2 text-sm font-semibold text-neutral-700">Looking good</Text>
          {view.passed.map((row) => (
            <Text
              key={row.ruleId}
              testID={`feedback-passed-${row.ruleId}`}
              className="text-sm text-neutral-500"
            >
              ✓ {row.title}
            </Text>
          ))}
        </>
      ) : null}

      {view.notApplicableCount > 0 ? (
        <Text testID="feedback-not-applicable" className="mt-3 text-xs text-neutral-400">
          {view.notApplicableCount} other check{view.notApplicableCount === 1 ? '' : 's'} had
          nothing to look at in this room.
        </Text>
      ) : null}
    </View>
  );
}

export default React.memo(FeedbackPanel);
