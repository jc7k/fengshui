import { describe, expect, it } from 'vitest';

import { feedbackView } from './findings-view';
import { createLayout, evaluate, MVP_RULE_IDS, type Evaluation, type FurnitureItem, type Layout } from '../core';

const room = { widthCm: 400, lengthCm: 300 };

const item = (over: Partial<FurnitureItem> = {}): FurnitureItem => ({
  id: 'x',
  type: 'bed',
  xCm: 200,
  yCm: 150,
  widthCm: 100,
  depthCm: 200,
  rotationDeg: 0,
  ...over,
});

const layoutOf = (furniture: FurnitureItem[]): Layout => ({
  ...createLayout('bedroom', room),
  doors: [
    {
      id: 'door',
      wall: 'north',
      offsetCm: 160,
      widthCm: 80,
      swing: 'inward',
      hinge: 'left',
      isMain: true,
    },
  ],
  furniture,
});

const evaluationOf = (over: Partial<Evaluation> = {}): Evaluation => ({
  findings: [],
  passed: [],
  notApplicable: [],
  ...over,
});

const finding = (over: Partial<Evaluation['findings'][number]> = {}) => ({
  ruleId: 'coffin-position',
  severity: 'warning' as const,
  itemIds: ['bed'],
  explanation: 'An explanation.',
  fix: 'A fix.',
  ...over,
});

describe('feedbackView', () => {
  it('names each issue with the rule title, not the rule id', () => {
    const view = feedbackView(evaluationOf({ findings: [finding()] }), layoutOf([item({ id: 'bed' })]));
    expect(view.issues[0].title).toBe('Bed facing the door');
    expect(view.issues[0].title).not.toContain('-');
  });

  it('passes the rule copy through verbatim', () => {
    const view = feedbackView(
      evaluationOf({ findings: [finding({ explanation: 'Exactly this.', fix: 'And this.' })] }),
      layoutOf([item({ id: 'bed' })]),
    );
    expect(view.issues[0].explanation).toBe('Exactly this.');
    expect(view.issues[0].fix).toBe('And this.');
  });

  it('lists warnings before tips, keeping engine order within each', () => {
    const view = feedbackView(
      evaluationOf({
        findings: [
          finding({ ruleId: 'back-support', severity: 'tip', itemIds: ['sofa'] }),
          finding({ ruleId: 'command-position', itemIds: ['bed'] }),
          finding({ ruleId: 'coffin-position', itemIds: ['bed'] }),
        ],
      }),
      layoutOf([item({ id: 'bed' }), item({ id: 'sofa', type: 'sofa' })]),
    );
    expect(view.issues.map((i) => i.ruleId)).toEqual([
      'command-position',
      'coffin-position',
      'back-support',
    ]);
    expect(view.warningCount).toBe(2);
    expect(view.tipCount).toBe(1);
  });

  it('calls an item by its user label when it has one, else its palette name', () => {
    const view = feedbackView(
      evaluationOf({
        findings: [
          finding({ itemIds: ['bed'] }),
          finding({ ruleId: 'proportion', itemIds: ['sofa'] }),
        ],
      }),
      layoutOf([item({ id: 'bed', label: "Ana's bed" }), item({ id: 'sofa', type: 'sofa' })]),
    );
    expect(view.issues[0].itemNames).toBe("Ana's bed");
    expect(view.issues[1].itemNames).toBe('Sofa');
  });

  it('reads a two-item finding as a pair, and a one-item finding as one', () => {
    // `clear-pathways` reports both shapes: a pinched walkway names two items,
    // a blocked entry names one.
    const layout = layoutOf([item({ id: 'bed' }), item({ id: 'table', type: 'coffee_table' })]);
    const view = feedbackView(
      evaluationOf({
        findings: [
          finding({ ruleId: 'clear-pathways', itemIds: ['bed', 'table'] }),
          finding({ ruleId: 'clear-pathways', itemIds: ['bed'] }),
        ],
      }),
      layout,
    );
    expect(view.issues[0].itemNames).toBe('Bed and Coffee table');
    expect(view.issues[1].itemNames).toBe('Bed');
  });

  it('badges each involved item, counting its findings', () => {
    const view = feedbackView(
      evaluationOf({
        findings: [
          finding({ ruleId: 'clear-pathways', itemIds: ['bed', 'table'] }),
          finding({ ruleId: 'coffin-position', itemIds: ['bed'] }),
        ],
      }),
      layoutOf([item({ id: 'bed' }), item({ id: 'table', type: 'coffee_table' })]),
    );
    expect(view.badges.bed.count).toBe(2);
    expect(view.badges.table.count).toBe(1);
    expect(view.badges.bed.label).toBe('Bed: 2 things to look at');
    expect(view.badges.table.label).toBe('Coffee table: 1 thing to look at');
  });

  it('gives an item with only tips a tip badge, and promotes it on a warning', () => {
    const layout = layoutOf([item({ id: 'sofa', type: 'sofa' })]);
    const tipOnly = feedbackView(
      evaluationOf({ findings: [finding({ severity: 'tip', itemIds: ['sofa'] })] }),
      layout,
    );
    expect(tipOnly.badges.sofa.severity).toBe('tip');
    expect(tipOnly.badges.sofa.label).toBe('Sofa: 1 tip');

    const mixed = feedbackView(
      evaluationOf({
        findings: [
          finding({ severity: 'tip', itemIds: ['sofa'] }),
          finding({ severity: 'warning', itemIds: ['sofa'] }),
        ],
      }),
      layout,
    );
    expect(mixed.badges.sofa.severity).toBe('warning');
  });

  it('leaves an item with nothing wrong unbadged', () => {
    const view = feedbackView(
      evaluationOf({ findings: [finding({ itemIds: ['bed'] })] }),
      layoutOf([item({ id: 'bed' }), item({ id: 'lamp', type: 'lamp' })]),
    );
    expect(Object.keys(view.badges)).toEqual(['bed']);
  });

  it('survives findings about an item the layout no longer has', () => {
    // The delete race: findings are a beat behind the live layout.
    const view = feedbackView(
      evaluationOf({ findings: [finding({ itemIds: ['ghost'] })] }),
      layoutOf([item({ id: 'bed' })]),
    );
    expect(view.badges).toEqual({});
    expect(view.issues[0].selectableId).toBeNull();
    expect(view.issues[0].itemNames).toBe('this room');
  });

  it('selects the first id that still resolves in a pair', () => {
    const view = feedbackView(
      evaluationOf({ findings: [finding({ itemIds: ['ghost', 'bed'] })] }),
      layoutOf([item({ id: 'bed' })]),
    );
    expect(view.issues[0].selectableId).toBe('bed');
  });

  it('keeps passed checks and not-applicable rules apart', () => {
    const view = feedbackView(
      evaluationOf({ passed: ['clear-pathways'], notApplicable: ['mirror-faces-bed', 'back-support'] }),
      layoutOf([item({ id: 'bed' })]),
    );
    expect(view.passed).toEqual([{ ruleId: 'clear-pathways', title: 'Room to move' }]);
    expect(view.notApplicableCount).toBe(2);
  });

  it('gives each issue a key that is stable across re-evaluation', () => {
    const layout = layoutOf([item({ id: 'bed' })]);
    const once = feedbackView(evaluationOf({ findings: [finding()] }), layout);
    const twice = feedbackView(evaluationOf({ findings: [finding()] }), layout);
    expect(once.issues[0].key).toBe(twice.issues[0].key);
  });

  it('reports an empty room as having no furniture', () => {
    expect(feedbackView(evaluationOf(), layoutOf([])).hasFurniture).toBe(false);
    expect(feedbackView(evaluationOf(), layoutOf([item()])).hasFurniture).toBe(true);
  });

  it('projects a real evaluation end to end, and clears it when the item moves', () => {
    const bad = layoutOf([item({ id: 'bed', xCm: 200, yCm: 200 })]);
    const before = feedbackView(evaluate(bad), bad);
    expect(before.issues.map((i) => i.ruleId)).toContain('coffin-position');
    expect(before.badges.bed).toBeDefined();

    const good = layoutOf([item({ id: 'bed', xCm: 80, yCm: 200 })]);
    const after = feedbackView(evaluate(good), good);
    expect(after.issues.map((i) => i.ruleId)).not.toContain('coffin-position');
    expect(after.passed.map((p) => p.ruleId)).toContain('coffin-position');
  });

  it('titles every shipped rule in plain language', () => {
    const view = feedbackView(evaluationOf({ passed: [...MVP_RULE_IDS] }), layoutOf([item()]));
    for (const row of view.passed) {
      expect(row.title).not.toBe(row.ruleId);
      expect(row.title[0]).toBe(row.title[0].toUpperCase());
    }
  });
});
