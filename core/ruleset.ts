/**
 * Loading and validating a JSON ruleset.
 *
 * Everything that can be wrong with a ruleset is caught here, once, and
 * reported with the offending rule id. `MVP_RULESET` is built at module scope,
 * so a malformed shipped ruleset fails at *import* rather than at the first
 * evaluation. That is a deliberate trade — a build-time constant in exchange
 * for the JSON being code-reviewed content, not user-editable-at-runtime
 * content.
 */

import { FURNITURE_SPECS } from './furniture';
import mvpRulesJson from './mvp-rules.json';
import { PREDICATES } from './predicates';
import {
  PREDICATE_NAMES,
  RulesetError,
  type CompiledRule,
  type PredicateName,
  type RoomTypeScope,
  type Ruleset,
  type Severity,
  type TargetScope,
} from './rule-types';
import { ROOM_TYPES } from './types';
import type { FurnitureType, RoomType } from './types';

/** The raw JSON, exported so tests and tools can clone and re-tune it. */
export const MVP_RULES_JSON = mvpRulesJson;

const SEVERITIES: readonly Severity[] = ['warning', 'tip'];

const RULE_KEYS = [
  'id',
  'predicate',
  'severity',
  'roomTypes',
  'targets',
  'params',
  'explanation',
  'fix',
  'draft',
  'enabled',
] as const;

const ALL_FURNITURE_TYPES = Object.keys(FURNITURE_SPECS) as FurnitureType[];

function fail(ruleId: string, message: string): never {
  throw new RulesetError(`rule "${ruleId}": ${message}`);
}

function requireString(ruleId: string, obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== 'string' || v.trim() === '') fail(ruleId, `${key} must be a non-empty string`);
  return v;
}

/** `'all'`, or a list drawn from `allowed`. */
function readScope<T extends string>(
  ruleId: string,
  obj: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): readonly T[] | 'all' {
  const v = obj[key];
  if (v === 'all') return 'all';
  if (!Array.isArray(v)) fail(ruleId, `${key} must be "all" or an array`);
  for (const entry of v) {
    if (typeof entry !== 'string' || !(allowed as readonly string[]).includes(entry)) {
      fail(ruleId, `${key} contains "${String(entry)}", which is not valid here`);
    }
  }
  return v as T[];
}

function compileRule(raw: unknown, index: number): CompiledRule | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new RulesetError(`rule at index ${index} must be an object`);
  }
  const obj = raw as Record<string, unknown>;
  const id = typeof obj.id === 'string' && obj.id !== '' ? obj.id : `<index ${index}>`;

  for (const key of Object.keys(obj)) {
    if (!(RULE_KEYS as readonly string[]).includes(key)) {
      fail(id, `"${key}" is not a rule field (known: ${RULE_KEYS.join(', ')})`);
    }
  }
  requireString(id, obj, 'id');

  if (obj.enabled !== undefined && typeof obj.enabled !== 'boolean') {
    fail(id, 'enabled must be a boolean when present');
  }
  if (obj.enabled === false) return null;

  const predicate = obj.predicate;
  if (typeof predicate !== 'string' || !(PREDICATE_NAMES as readonly string[]).includes(predicate)) {
    fail(
      id,
      `predicate "${String(predicate)}" is not registered ` +
        `(available: ${PREDICATE_NAMES.join(', ')})`,
    );
  }

  const severity = obj.severity;
  if (typeof severity !== 'string' || !(SEVERITIES as readonly string[]).includes(severity)) {
    fail(id, `severity must be one of ${SEVERITIES.join(', ')}`);
  }
  if (typeof obj.draft !== 'boolean') fail(id, 'draft must be a boolean');

  return {
    id: obj.id as string,
    predicate: predicate as PredicateName,
    severity: severity as Severity,
    roomTypes: readScope(id, obj, 'roomTypes', ROOM_TYPES) as RoomTypeScope,
    targets: readScope(id, obj, 'targets', ALL_FURNITURE_TYPES) as TargetScope,
    explanation: requireString(id, obj, 'explanation'),
    fix: requireString(id, obj, 'fix'),
    draft: obj.draft,
    run: PREDICATES[predicate as PredicateName](obj.params, id),
  };
}

/**
 * Validate a list of rule definitions into a runnable ruleset.
 *
 * Rules with `enabled: false` are dropped here, so evaluation never has to
 * think about them. Order is preserved: findings come out in JSON order.
 */
export function loadRuleset(raw: unknown): Ruleset {
  if (!Array.isArray(raw)) throw new RulesetError('a ruleset must be an array of rules');

  const rules: CompiledRule[] = [];
  const seen = new Set<string>();
  raw.forEach((entry, index) => {
    const rule = compileRule(entry, index);
    if (!rule) return;
    if (seen.has(rule.id)) throw new RulesetError(`duplicate rule id "${rule.id}"`);
    seen.add(rule.id);
    rules.push(rule);
  });
  return { rules };
}

/**
 * The shipped ruleset.
 *
 * Named for the MVP rather than "default" because REQ-018's zone rules will be
 * a *second* ruleset running on the same engine.
 */
export const MVP_RULESET: Ruleset = loadRuleset(MVP_RULES_JSON.rules);

/** Rule ids in evaluation order, for callers that need a stable checklist. */
export const MVP_RULE_IDS: readonly string[] = MVP_RULESET.rules.map((r) => r.id);

/** Room types this ruleset has something to say about. */
export function rulesForRoomType(ruleset: Ruleset, roomType: RoomType): CompiledRule[] {
  return ruleset.rules.filter((r) => r.roomTypes === 'all' || r.roomTypes.includes(roomType));
}
