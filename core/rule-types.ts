/**
 * Types for the declarative rule engine (PRD §4.3).
 *
 * The wire format (`RuleDefinition`) and the runnable form (`CompiledRule`) are
 * deliberately different types. `import json from './mvp-rules.json'` infers
 * `severity: string`, which is not assignable to `Severity`, so without a
 * validating load step every call site would need a cast. Validating once, at
 * load, buys a fully typed evaluation path with no `any` in it.
 *
 * The declarative boundary, in one line: **numbers and lists live in JSON,
 * control flow lives in TypeScript.** See `docs/rule-authoring.md`.
 */

import type { OrientedRect } from './geometry';
import type { Door, FurnitureItem, FurnitureType, Layout, Room, RoomType } from './types';

/**
 * How loudly a rule speaks.
 *
 * Per-rule, not uniform: rule 6 (back support) is a tip while the other six are
 * warnings, and the domain expert can move any rule between the two by editing
 * one JSON field.
 */
export type Severity = 'warning' | 'tip';

/** One thing that is wrong with a layout. Exactly the five specified fields. */
export interface Finding {
  ruleId: string;
  severity: Severity;
  /** The items involved. One id for most rules, two for pairwise ones. */
  itemIds: string[];
  /** Plain-language statement of the Feng Shui principle. */
  explanation: string;
  /** A single suggested fix, one line. */
  fix: string;
}

/**
 * The result of evaluating a layout.
 *
 * Three outcomes, not two. REQ-012 shows "passed checks", and a rule that does
 * not apply to this room type (or has nothing to look at) is a different
 * statement from a rule that applied and found nothing — "Mirror placement:
 * passed" in a room with no mirror is false reassurance.
 */
export interface Evaluation {
  findings: Finding[];
  /** Ids of rules that ran and found nothing. */
  passed: string[];
  /** Ids of rules that could not run here, with no implication either way. */
  notApplicable: string[];
}

/**
 * The geometric tests JSON may name. Adding to this list needs a developer;
 * everything else about a rule does not.
 */
export const PREDICATE_NAMES = [
  'commandPosition',
  'coffinPosition',
  'facesBed',
  'clearance',
  'blocksSwing',
  'backToDoor',
  'footprintShare',
] as const;

export type PredicateName = (typeof PREDICATE_NAMES)[number];

/** `'all'` where a rule applies everywhere, rather than repeating every member. */
export type RoomTypeScope = readonly RoomType[] | 'all';
export type TargetScope = readonly FurnitureType[] | 'all';

/**
 * A rule as written in JSON.
 *
 * `draft: true` means the copy is a placeholder written by a developer and not
 * yet signed off by the domain expert, who owns its content.
 */
export interface RuleDefinition {
  id: string;
  /** What the rule is called in front of a beginner, e.g. "Room to move". */
  title: string;
  predicate: PredicateName;
  severity: Severity;
  roomTypes: RoomTypeScope;
  /** Which furniture the rule looks at. */
  targets: TargetScope;
  /** Thresholds and lists for the predicate. Every threshold is required. */
  params: Record<string, unknown>;
  explanation: string;
  fix: string;
  draft: boolean;
  /** Omit or `true` to run the rule; `false` drops it at load. */
  enabled?: boolean;
}

/**
 * What a predicate answers.
 *
 * `applicable: false` is how a predicate says "there is nothing here to judge"
 * — no main door, no bed for the mirror to face. Each inner array of
 * `violations` becomes one `Finding`, and holds that finding's `itemIds`.
 */
export type PredicateVerdict =
  | { applicable: false; reason: string }
  | { applicable: true; violations: string[][] };

/** Everything a predicate may read, plus a rect cache built once per evaluation. */
export interface RuleContext {
  layout: Layout;
  room: Room;
  /** The main entrance, which rules 1, 2, 4 and 6 key off. */
  mainDoor: Door | null;
  rectOf: (item: FurnitureItem) => OrientedRect;
}

/** A predicate with its parameters already validated and closed over. */
export type CompiledPredicate = (
  ctx: RuleContext,
  targets: readonly FurnitureItem[],
) => PredicateVerdict;

/** A rule that is ready to run: copy, scope, and a closure over typed params. */
export interface CompiledRule {
  id: string;
  title: string;
  predicate: PredicateName;
  severity: Severity;
  roomTypes: RoomTypeScope;
  targets: TargetScope;
  explanation: string;
  fix: string;
  draft: boolean;
  run: CompiledPredicate;
}

export interface Ruleset {
  rules: readonly CompiledRule[];
}

/**
 * A ruleset that cannot be loaded.
 *
 * Thrown at load time only — never during evaluation. A malformed threshold is
 * a content bug the author should see immediately, not a silent fallback that
 * lets them believe they changed a number when they did not.
 */
export class RulesetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RulesetError';
  }
}
