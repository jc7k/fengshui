/**
 * The rule engine: `evaluate(layout, ruleset) → Evaluation`.
 *
 * Pure TypeScript with no knowledge of rendering. REQ-012 turns findings into
 * a panel; this file must never learn how.
 *
 * Everything here is deterministic — rules in ruleset order, items in layout
 * order, pairs in index order — so the feedback panel does not reshuffle
 * between frames.
 */

import { furnitureRect, type OrientedRect } from './geometry';
import { MVP_RULESET } from './ruleset';
import type { CompiledRule, Evaluation, Finding, RuleContext, Ruleset } from './rule-types';
import { mainDoor } from './types';
import type { FurnitureItem, Layout } from './types';

/** The items a rule looks at, in layout order. */
function targetsOf(rule: CompiledRule, layout: Layout): FurnitureItem[] {
  if (rule.targets === 'all') return layout.furniture;
  return layout.furniture.filter((item) => rule.targets.includes(item.type));
}

/**
 * Judge a layout.
 *
 * Three outcomes per rule, never two: a rule can find something, run and find
 * nothing (`passed`), or have nothing to say here (`notApplicable`). A rule
 * whose target items are absent is **not applicable, not passed** — "Mirror
 * placement: passed" in a room with no mirror is false reassurance, while "you
 * have a mirror and it does not face the bed" is a real pass.
 */
export function evaluate(layout: Layout, ruleset: Ruleset = MVP_RULESET): Evaluation {
  const rects = new Map<string, OrientedRect>();
  const rectOf = (item: FurnitureItem): OrientedRect => {
    const cached = rects.get(item.id);
    if (cached) return cached;
    const rect = furnitureRect(item);
    rects.set(item.id, rect);
    return rect;
  };

  const ctx: RuleContext = {
    layout,
    room: layout.room,
    mainDoor: mainDoor(layout),
    rectOf,
  };

  const findings: Finding[] = [];
  const passed: string[] = [];
  const notApplicable: string[] = [];

  for (const rule of ruleset.rules) {
    if (rule.roomTypes !== 'all' && !rule.roomTypes.includes(layout.roomType)) {
      notApplicable.push(rule.id);
      continue;
    }

    const targets = targetsOf(rule, layout);
    if (targets.length === 0) {
      notApplicable.push(rule.id);
      continue;
    }

    const verdict = rule.run(ctx, targets);
    if (!verdict.applicable) {
      notApplicable.push(rule.id);
      continue;
    }
    if (verdict.violations.length === 0) {
      passed.push(rule.id);
      continue;
    }

    for (const itemIds of verdict.violations) {
      findings.push({
        ruleId: rule.id,
        severity: rule.severity,
        itemIds,
        explanation: rule.explanation,
        fix: rule.fix,
      });
    }
  }

  return { findings, passed, notApplicable };
}
