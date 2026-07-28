/**
 * Turning an `Evaluation` into the shapes the feedback UI renders.
 *
 * This is a projection and nothing more: no rule ever runs here, no threshold
 * is read here, and `explanation` / `fix` are passed through verbatim. All of
 * that lives in `core/`. What this module adds is presentation-only knowledge —
 * which rule name to show, which item a finding is about, what to put on a
 * badge, and the order the panel reads in.
 *
 * Renderer-free like `throttle.ts`, so it can be tested under Vitest's node
 * default environment with no jsdom and no `react-native` resolution.
 *
 * Titles are looked up in the shipped ruleset. A finding from some other
 * ruleset falls back to its raw rule id rather than throwing.
 */
import {
  FURNITURE_SPECS,
  ruleById,
  type Evaluation,
  type Layout,
  type Severity,
} from '../core';

/** One row in the "things to look at" list. */
export interface IssueRow {
  /** Stable across re-evaluations, so the list does not remount as it changes. */
  key: string;
  ruleId: string;
  /** The rule's beginner-facing name, e.g. "Room to move". */
  title: string;
  severity: Severity;
  /** Verbatim rule copy. Never rewritten, never truncated. */
  explanation: string;
  fix: string;
  /** What the finding is about, in words: "Bed and Coffee table". */
  itemNames: string;
  /** The item to select when the row is pressed, or `null` if it is gone. */
  selectableId: string | null;
}

/** One rule that ran and found nothing. */
export interface PassedRow {
  ruleId: string;
  title: string;
}

/** What to draw over an item on the canvas. */
export interface ItemBadge {
  /** The loudest severity among that item's findings. */
  severity: Severity;
  count: number;
  /** Spoken form, because the shape and colour alone are not enough. */
  label: string;
}

export interface FeedbackView {
  /** Warnings first, then tips; engine order preserved within a severity. */
  issues: IssueRow[];
  passed: PassedRow[];
  /** Keyed by furniture id. Items with no findings are absent. */
  badges: Record<string, ItemBadge>;
  /** Rules that had nothing to look at here — reported, never as a pass. */
  notApplicableCount: number;
  warningCount: number;
  tipCount: number;
  /** Whether the room holds any furniture at all, for the empty state. */
  hasFurniture: boolean;
}

const titleOf = (ruleId: string): string => ruleById(ruleId)?.title ?? ruleId;

/** What to call an item: whatever the user named it, else its palette name. */
function nameOf(layout: Layout, id: string): string | null {
  const item = layout.furniture.find((f) => f.id === id);
  if (!item) return null;
  return item.label?.trim() ? item.label.trim() : FURNITURE_SPECS[item.type].name;
}

function joinNames(names: string[]): string {
  if (names.length === 0) return 'this room';
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function badgeLabel(name: string, severity: Severity, count: number): string {
  const noun =
    severity === 'warning'
      ? count === 1
        ? 'thing to look at'
        : 'things to look at'
      : count === 1
        ? 'tip'
        : 'tips';
  return `${name}: ${count} ${noun}`;
}

/**
 * Project an evaluation of `layout` into everything the feedback UI needs.
 *
 * A finding may name one item or two — the walkway half of `clear-pathways`
 * reports a pair, its entry half reports a single item — and either id may name
 * an item that no longer exists if the evaluation is a beat behind a delete.
 * Both are handled by looking every id up rather than assuming.
 */
export function feedbackView(evaluation: Evaluation, layout: Layout): FeedbackView {
  const warnings = evaluation.findings.filter((f) => f.severity === 'warning');
  const tips = evaluation.findings.filter((f) => f.severity === 'tip');

  const issues: IssueRow[] = [...warnings, ...tips].map((finding) => {
    const names = finding.itemIds.map((id) => nameOf(layout, id)).filter((n): n is string => !!n);
    return {
      key: `${finding.ruleId}:${finding.itemIds.join('+')}`,
      ruleId: finding.ruleId,
      title: titleOf(finding.ruleId),
      severity: finding.severity,
      explanation: finding.explanation,
      fix: finding.fix,
      itemNames: joinNames(names),
      selectableId: finding.itemIds.find((id) => nameOf(layout, id) !== null) ?? null,
    };
  });

  const badges: Record<string, ItemBadge> = {};
  for (const finding of evaluation.findings) {
    for (const id of finding.itemIds) {
      const name = nameOf(layout, id);
      if (!name) continue;
      const prev = badges[id];
      const severity: Severity =
        prev?.severity === 'warning' || finding.severity === 'warning' ? 'warning' : 'tip';
      const count = (prev?.count ?? 0) + 1;
      badges[id] = { severity, count, label: badgeLabel(name, severity, count) };
    }
  }

  return {
    issues,
    passed: evaluation.passed.map((ruleId) => ({ ruleId, title: titleOf(ruleId) })),
    badges,
    notApplicableCount: evaluation.notApplicable.length,
    warningCount: warnings.length,
    tipCount: tips.length,
    hasFurniture: layout.furniture.length > 0,
  };
}
