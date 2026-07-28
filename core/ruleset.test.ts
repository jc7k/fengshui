import { describe, expect, it } from 'vitest';

import { RulesetError } from './rule-types';
import { MVP_RULES_JSON, MVP_RULESET, MVP_RULE_IDS, loadRuleset, rulesForRoomType } from './ruleset';
import { DEFAULT_MIN_CLEARANCE_CM } from './units';
import type { RuleDefinition } from './rule-types';

/** A minimal valid rule, so each test can break exactly one thing. */
const def = (over: Partial<RuleDefinition> = {}): unknown => ({
  id: 'r',
  title: 'A title',
  predicate: 'footprintShare',
  severity: 'warning',
  roomTypes: 'all',
  targets: ['bed'],
  params: { maxShare: 0.4 },
  explanation: 'An explanation.',
  fix: 'A fix.',
  draft: true,
  ...over,
});

const paramsOf = (id: string): Record<string, unknown> => {
  const rule = MVP_RULES_JSON.rules.find((r) => r.id === id);
  if (!rule) throw new Error(`no rule "${id}" in the shipped ruleset`);
  return rule.params as Record<string, unknown>;
};

describe('loadRuleset validation', () => {
  it('accepts a well-formed rule', () => {
    expect(loadRuleset([def()]).rules).toHaveLength(1);
  });

  it('rejects a predicate that is not registered, naming the alternatives', () => {
    expect(() => loadRuleset([def({ predicate: 'vibes' as never })])).toThrow(RulesetError);
    expect(() => loadRuleset([def({ predicate: 'vibes' as never })])).toThrow(/footprintShare/);
  });

  it('rejects an unknown parameter rather than silently ignoring it', () => {
    // The typo that motivates this: the author believes they changed a
    // threshold, and nothing tells them they did not.
    expect(() => loadRuleset([def({ params: { maxShare: 0.4, maxShrae: 0.9 } })])).toThrow(
      /maxShrae/,
    );
  });

  it('requires every threshold — no TypeScript fallback for a number', () => {
    expect(() => loadRuleset([def({ params: {} })])).toThrow(/maxShare must be a finite number/);
  });

  it('rejects an unknown rule field', () => {
    expect(() => loadRuleset([def({ sevrity: 'tip' } as never)])).toThrow(/sevrity/);
  });

  it('rejects a duplicate rule id', () => {
    expect(() => loadRuleset([def(), def()])).toThrow(/duplicate rule id "r"/);
  });

  it('rejects a room type that is not one of ours', () => {
    expect(() => loadRuleset([def({ roomTypes: ['garage'] as never })])).toThrow(/garage/);
  });

  it('rejects a target that is not a furniture type', () => {
    expect(() => loadRuleset([def({ targets: ['hammock'] as never })])).toThrow(/hammock/);
  });

  it('names the offending rule in the message', () => {
    expect(() => loadRuleset([def({ id: 'proportion-v2', params: {} })])).toThrow(
      /rule "proportion-v2"/,
    );
  });

  it('drops a rule turned off with enabled:false', () => {
    expect(loadRuleset([def({ enabled: false })]).rules).toHaveLength(0);
    // ...and does not validate its params, so a disabled rule cannot break the load.
    expect(loadRuleset([def({ enabled: false, params: { nonsense: 1 } })]).rules).toHaveLength(0);
  });

  it('preserves rule order', () => {
    const ids = loadRuleset([def({ id: 'b' }), def({ id: 'a' })]).rules.map((r) => r.id);
    expect(ids).toEqual(['b', 'a']);
  });
});

describe('the shipped MVP ruleset', () => {
  it('holds exactly the seven PRD rules, in order', () => {
    expect(MVP_RULE_IDS).toEqual([
      'command-position',
      'coffin-position',
      'mirror-faces-bed',
      'clear-pathways',
      'entrance-clarity',
      'back-support',
      'proportion',
    ]);
  });

  it('makes back support a tip and the other six warnings', () => {
    const tips = MVP_RULESET.rules.filter((r) => r.severity === 'tip').map((r) => r.id);
    expect(tips).toEqual(['back-support']);
    expect(MVP_RULESET.rules.filter((r) => r.severity === 'warning')).toHaveLength(6);
  });

  it('keeps the minimum clearance in the JSON, matching the PRD constant', () => {
    // The JSON is the threshold's only home; this pins it to the shared
    // constant without letting TypeScript override it.
    expect(paramsOf('clear-pathways').minClearanceCm).toBe(DEFAULT_MIN_CLEARANCE_CM);
    expect(DEFAULT_MIN_CLEARANCE_CM).toBe(60); // 24 in
  });

  it('scopes rules by room type', () => {
    const bedroom = rulesForRoomType(MVP_RULESET, 'bedroom').map((r) => r.id);
    expect(bedroom).toContain('coffin-position');
    expect(bedroom).not.toContain('back-support');

    const office = rulesForRoomType(MVP_RULESET, 'home_office').map((r) => r.id);
    expect(office).toContain('back-support');
    expect(office).not.toContain('mirror-faces-bed');
  });

  it('carries copy that is one short line, and still flagged as a draft', () => {
    // Guarded here rather than in the golden layouts, so reviewing the wording
    // does not mean updating a golden nobody reads. When the domain expert
    // signs off, `draft` flips and this test fails loudly and correctly.
    for (const rule of MVP_RULESET.rules) {
      for (const text of [rule.title, rule.explanation, rule.fix]) {
        expect(text.trim()).not.toBe('');
        expect(text).not.toContain('\n');
        expect(text.length).toBeLessThanOrEqual(120);
      }
      expect(rule.draft).toBe(true);
    }
  });
});
