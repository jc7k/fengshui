/**
 * The seven MVP rules, fixture by fixture.
 *
 * There is no published reference table for these rules the way there is for
 * the Python side's charts, so **these fixtures are the reference table**. That
 * sets the bar: a reader must be able to check any expectation below by
 * inspection, on graph paper, without running anything. Hence one shared room
 * with every number divisible by 10, the arithmetic written next to the
 * assertion, intermediate geometry asserted rather than only the verdict, and a
 * boundary case for every threshold.
 */

import { describe, expect, it } from 'vitest';

import { evaluate } from './evaluate';
import { furnitureRect, rectAabb } from './geometry';
import { channelGap } from './rule-geometry';
import { MVP_RULES_JSON, MVP_RULESET, loadRuleset } from './ruleset';
import { createLayout } from './types';
import type { Evaluation, Ruleset } from './rule-types';
import type { Door, FurnitureItem, Layout, Room, RoomType } from './types';

// ── Shared geometry ────────────────────────────────────────────────────────
// Room 400 × 300. Main door on the north wall, opening x ∈ [160, 240], centre
// (200, 0). At alignmentWidthFactor 1.0 the door's corridor is therefore the
// strip x ∈ [160, 240] running the room's full 300 cm of depth.

const room: Room = { widthCm: 400, lengthCm: 300 };

const door = (over: Partial<Door> = {}): Door => ({
  id: 'door',
  wall: 'north',
  offsetCm: 160,
  widthCm: 80,
  swing: 'inward',
  hinge: 'left',
  isMain: true,
  ...over,
});

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

const layoutOf = (
  roomType: RoomType,
  furniture: FurnitureItem[],
  doors: Door[] = [door()],
): Layout => ({ ...createLayout(roomType, room), doors, furniture });

/** Run one rule of the shipped ruleset, unchanged. */
const only = (ruleId: string): Ruleset => ({
  rules: MVP_RULESET.rules.filter((r) => r.id === ruleId),
});

/**
 * Run one rule with some of its JSON parameters overridden.
 *
 * Same TypeScript, same layout, same `evaluate` — only numbers in a cloned
 * plain object differ. This is the mechanism the "tune it without a developer"
 * requirement is really asking about.
 */
const retuned = (ruleId: string, params: Record<string, unknown>): Ruleset => {
  const rules = JSON.parse(JSON.stringify(MVP_RULES_JSON.rules)) as {
    id: string;
    params: Record<string, unknown>;
  }[];
  const rule = rules.find((r) => r.id === ruleId);
  if (!rule) throw new Error(`no rule "${ruleId}"`);
  Object.assign(rule.params, params);
  return loadRuleset([rule]);
};

/** The item-id groups a rule fired on, in order. */
const hits = (ev: Evaluation): string[][] => ev.findings.map((f) => f.itemIds);

const run = (ruleId: string, layout: Layout): Evaluation => evaluate(layout, only(ruleId));

const aabbOf = (i: FurnitureItem) => rectAabb(furnitureRect(i));

// ── Rule 1 — command position ──────────────────────────────────────────────

describe('rule 1: command position', () => {
  const bed = (over: Partial<FurnitureItem>) =>
    item({ id: 'bed', type: 'bed', widthCm: 100, depthCm: 160, ...over });

  /** Blocks all three sight rays from a bed centred at (80, 220). */
  const blocker = (type: FurnitureItem['type']) =>
    item({ id: 'blocker', type, xCm: 140, yCm: 100, widthCm: 40, depthCm: 20 });

  it('fires on alignment alone, with the door in plain view', () => {
    // Bed x ∈ [150, 250] overlaps the corridor x ∈ [160, 240]; nothing blocks.
    const ev = run('command-position', layoutOf('bedroom', [bed({ xCm: 200, yCm: 220 })]));
    expect(hits(ev)).toEqual([['bed']]);
  });

  it('fires on a blocked view alone, well clear of the corridor', () => {
    // Bed x ∈ [30, 130], corridor starts at 160. The blocker spans x ∈ [120,
    // 160] at y ∈ [90, 110]; the three rays cross y = 110 at x = 130, 140, 150.
    const ev = run(
      'command-position',
      layoutOf('bedroom', [bed({ xCm: 80, yCm: 220 }), blocker('bookshelf')]),
    );
    expect(hits(ev)).toEqual([['bed']]);
  });

  it('ignores a sight blocker the JSON says does not block, in the same spot', () => {
    // Identical geometry, `rug` instead of `bookshelf`. Proves the ignore list
    // is live rather than decorative.
    const ev = run(
      'command-position',
      layoutOf('bedroom', [bed({ xCm: 80, yCm: 220 }), blocker('rug')]),
    );
    expect(hits(ev)).toEqual([]);
    expect(ev.passed).toEqual(['command-position']);
  });

  it('passes a bed that is off the corridor with a clear view', () => {
    expect(hits(run('command-position', layoutOf('bedroom', [bed({ xCm: 80, yCm: 220 })])))).toEqual(
      [],
    );
  });

  it('treats a bed flush with the corridor edge as outside it', () => {
    // x ∈ [60, 160] touches the corridor's 160 without overlapping —
    // `rectsIntersect` does not count touching edges.
    expect(
      hits(run('command-position', layoutOf('bedroom', [bed({ xCm: 110, yCm: 220 })]))),
    ).toEqual([]);
    // 10 cm further in, x ∈ [70, 170], and it overlaps.
    expect(
      hits(run('command-position', layoutOf('bedroom', [bed({ xCm: 120, yCm: 220 })]))),
    ).toEqual([['bed']]);
  });

  it('is not applicable when there is no door', () => {
    const ev = run('command-position', layoutOf('bedroom', [bed({ xCm: 80, yCm: 220 })], []));
    expect(ev.notApplicable).toEqual(['command-position']);
  });

  it('is not applicable when the room holds none of its target types', () => {
    const ev = run('command-position', layoutOf('bedroom', [item({ id: 'm', type: 'mirror' })]));
    expect(ev.notApplicable).toEqual(['command-position']);
    expect(ev.passed).toEqual([]);
  });
});

// ── Rule 2 — coffin position ───────────────────────────────────────────────

describe('rule 2: coffin position', () => {
  const bed = (over: Partial<FurnitureItem>) => item({ id: 'bed', ...over });

  it('fires when the foot both aims at the door and sits in its corridor', () => {
    // rotation 0 = feet point north; door centre is due north at (200, 0).
    const ev = run('coffin-position', layoutOf('bedroom', [bed({ xCm: 200, yCm: 200 })]));
    expect(hits(ev)).toEqual([['bed']]);
  });

  it('does not fire on a bed in the corridor whose foot points away', () => {
    // Same position, turned 180° — the lateral condition alone is not enough.
    const ev = run(
      'coffin-position',
      layoutOf('bedroom', [bed({ xCm: 200, yCm: 200, rotationDeg: 180 })]),
    );
    expect(hits(ev)).toEqual([]);
  });

  it('does not fire on a bed aimed at the door from outside the corridor', () => {
    // A 60 × 60 bed at (60, 150) turned 45° aims within 2° of the door centre,
    // but its AABB spans x ∈ [17.6, 102.4] — nowhere near x ∈ [160, 240]. Aim
    // alone is not "directly" in line.
    const ev = run(
      'coffin-position',
      layoutOf(
        'bedroom',
        [bed({ xCm: 60, yCm: 150, widthCm: 60, depthCm: 60, rotationDeg: 45 })],
      ),
    );
    expect(hits(ev)).toEqual([]);
  });

  it('treats the angle tolerance as inclusive', () => {
    // Door due north of the bed, so the aim angle equals the rotation.
    const at = (rotationDeg: number) =>
      hits(run('coffin-position', layoutOf('bedroom', [bed({ xCm: 200, yCm: 200, rotationDeg })])));
    expect(at(20)).toEqual([['bed']]); // exactly 20° still warns
    expect(at(21)).toEqual([]);
  });

  it('honours a widened tolerance from JSON alone', () => {
    const wide = retuned('coffin-position', { angleToleranceDeg: 30 });
    const l = layoutOf('bedroom', [bed({ xCm: 200, yCm: 200, rotationDeg: 25 })]);
    expect(hits(evaluate(l, only('coffin-position')))).toEqual([]);
    expect(hits(evaluate(l, wide))).toEqual([['bed']]);
  });
});

// ── Rule 3 — mirror facing the bed ─────────────────────────────────────────

describe('rule 3: mirror facing the bed', () => {
  const mirror = (over: Partial<FurnitureItem>) =>
    item({ id: 'mirror', type: 'mirror', widthCm: 60, depthCm: 5, ...over });
  const bed = (over: Partial<FurnitureItem> = {}) => item({ id: 'bed', ...over });

  it('fires when the beam off the mirror face reaches the bed', () => {
    // Mirror at (200, 20) turned 180° reflects south from y = 22.5, 60 cm wide:
    // x ∈ [170, 230]. Bed x ∈ [150, 250], y ∈ [50, 250].
    const ev = run(
      'mirror-faces-bed',
      layoutOf('bedroom', [mirror({ xCm: 200, yCm: 20, rotationDeg: 180 }), bed()]),
    );
    expect(hits(ev)).toEqual([['mirror', 'bed']]);
  });

  it('does not fire on a mirror at the default 0° on the north wall', () => {
    // Documents the REQ-008 trap rather than endorsing it: `createFurnitureItem`
    // starts every item at rotationDeg 0 = facing north, so a mirror dropped on
    // the north wall reflects out of the room and this rule cannot fire until
    // the user rotates it.
    const ev = run(
      'mirror-faces-bed',
      layoutOf('bedroom', [mirror({ xCm: 200, yCm: 20, rotationDeg: 0 }), bed()]),
    );
    expect(hits(ev)).toEqual([]);
  });

  it('does not fire when the beam passes to one side of the bed', () => {
    // Mirror at (60, 60) turned 90° sweeps east across y ∈ [30, 90]; the bed
    // occupies y ∈ [200, 300].
    const ev = run(
      'mirror-faces-bed',
      layoutOf('bedroom', [
        mirror({ xCm: 60, yCm: 60, rotationDeg: 90 }),
        bed({ yCm: 250, depthCm: 100 }),
      ]),
    );
    expect(hits(ev)).toEqual([]);
  });

  it('stops at the JSON range, to the centimetre', () => {
    // Face at y = 22.5; bed near edge at y = 200, so the beam must run 177.5 cm.
    const l = layoutOf('bedroom', [
      mirror({ xCm: 200, yCm: 20, rotationDeg: 180 }),
      bed({ yCm: 250, depthCm: 100 }),
    ]);
    expect(hits(evaluate(l, retuned('mirror-faces-bed', { maxRangeCm: 170 })))).toEqual([]);
    expect(hits(evaluate(l, retuned('mirror-faces-bed', { maxRangeCm: 180 })))).toEqual([
      ['mirror', 'bed'],
    ]);
  });

  it('is not applicable in a bedroom with a mirror but no bed', () => {
    // "Mirror placement: passed" would be false reassurance here.
    const ev = run(
      'mirror-faces-bed',
      layoutOf('bedroom', [mirror({ xCm: 200, yCm: 20, rotationDeg: 180 })]),
    );
    expect(ev.notApplicable).toEqual(['mirror-faces-bed']);
  });
});

// ── Rule 4 — clear pathways ────────────────────────────────────────────────

describe('rule 4: clear pathways', () => {
  // Entry band: the door's 80 cm width projected 120 cm inward → x ∈ [160,
  // 240], y ∈ [0, 120].
  const dresser = (over: Partial<FurnitureItem>) =>
    item({ id: 'dresser', type: 'dresser', widthCm: 150, depthCm: 50, ...over });
  const shelf = (over: Partial<FurnitureItem> = {}) =>
    item({ id: 'shelf', type: 'bookshelf', xCm: 60, yCm: 200, widthCm: 80, depthCm: 30, ...over });

  it('fires when an item stands in the path in from the door', () => {
    // Dresser x ∈ [125, 275], y ∈ [35, 85] — inside the band both ways.
    const ev = run('clear-pathways', layoutOf('bedroom', [dresser({ xCm: 200, yCm: 60 })]));
    expect(hits(ev)).toEqual([['dresser']]);
  });

  it('does not fire on an item across the room, opposite the door', () => {
    // y ∈ [225, 275] is past the band's 120 cm depth. Being opposite the door
    // is rule 1's alignment condition, not a blocked entry path.
    const ev = run('clear-pathways', layoutOf('bedroom', [dresser({ xCm: 200, yCm: 250 })]));
    expect(hits(ev)).toEqual([]);
  });

  it('fires on a pinched walkway between two pieces', () => {
    const a = shelf(); //           x ∈ [20, 100],  y ∈ [185, 215]
    const b = dresser({ xCm: 220, yCm: 200 }); // x ∈ [145, 295], y ∈ [175, 225]
    // 145 − 100 = 45 cm of channel, with 30 cm of overlap across it.
    expect(channelGap(aabbOf(a), aabbOf(b))).toEqual({ gapCm: 45, axis: 'x' });
    expect(hits(run('clear-pathways', layoutOf('bedroom', [a, b])))).toEqual([['shelf', 'dresser']]);
  });

  it('puts the boundary exactly at the JSON minimum', () => {
    const gapOf = (dresserX: number) => {
      const a = shelf();
      const b = dresser({ xCm: dresserX, yCm: 200 });
      return {
        gap: channelGap(aabbOf(a), aabbOf(b))?.gapCm,
        fired: hits(run('clear-pathways', layoutOf('bedroom', [a, b]))),
      };
    };
    expect(gapOf(235)).toEqual({ gap: 60, fired: [] }); // exactly 60 cm passes
    expect(gapOf(234)).toEqual({ gap: 59, fired: [['shelf', 'dresser']] });
  });

  it('ignores a gap below the floor — that is one mass, not a walkway', () => {
    const a = shelf();
    const b = dresser({ xCm: 180, yCm: 200 }); // x ∈ [105, 255] → a 5 cm slot
    expect(channelGap(aabbOf(a), aabbOf(b))?.gapCm).toBe(5);
    expect(hits(run('clear-pathways', layoutOf('bedroom', [a, b])))).toEqual([]);
  });

  it('ignores diagonally offset items — there is no channel between them', () => {
    const a = shelf({ xCm: 60, yCm: 60 }); //     x ∈ [20, 100],  y ∈ [45, 75]
    const b = dresser({ xCm: 220, yCm: 200 }); // x ∈ [145, 295], y ∈ [175, 225]
    expect(channelGap(aabbOf(a), aabbOf(b))).toBeNull();
    expect(hits(run('clear-pathways', layoutOf('bedroom', [a, b])))).toEqual([]);
  });

  it('exempts the satellite types the JSON lists, and only those', () => {
    // A nightstand 20 cm from the bed is the arrangement working, not failing.
    const bed = item({ id: 'bed', xCm: 200, yCm: 230, widthCm: 100, depthCm: 140 });
    const beside = (type: FurnitureItem['type']) =>
      item({ id: 'beside', type, xCm: 110, yCm: 230, widthCm: 40, depthCm: 40 });
    expect(channelGap(aabbOf(bed), aabbOf(beside('nightstand')))?.gapCm).toBe(20);

    expect(hits(run('clear-pathways', layoutOf('bedroom', [bed, beside('nightstand')])))).toEqual(
      [],
    );
    // Same geometry, a type that is not exempt.
    expect(hits(run('clear-pathways', layoutOf('bedroom', [bed, beside('bookshelf')])))).toEqual([
      ['bed', 'beside'],
    ]);
  });

  it('changes behaviour when only the JSON threshold changes', () => {
    // The acceptance criterion, as evidence: same TypeScript, same layout, same
    // `evaluate` — a hand-computed 45 cm gap stops warning once the minimum
    // drops to 40 cm.
    const l = layoutOf('bedroom', [shelf(), dresser({ xCm: 220, yCm: 200 })]);
    expect(hits(evaluate(l, only('clear-pathways')))).toEqual([['shelf', 'dresser']]);
    expect(hits(evaluate(l, retuned('clear-pathways', { minClearanceCm: 40 })))).toEqual([]);
  });

  it('still checks walkways in a layout with no door', () => {
    const l = layoutOf('bedroom', [shelf(), dresser({ xCm: 220, yCm: 200 })], []);
    expect(hits(run('clear-pathways', l))).toEqual([['shelf', 'dresser']]);
  });
});

// ── Rule 5 — entrance clarity ──────────────────────────────────────────────

describe('rule 5: entrance clarity', () => {
  // Inward swing rect: x ∈ [160, 240], y ∈ [0, 80]. Threshold zone: the same
  // width, 60 cm deep.
  const plant = (over: Partial<FurnitureItem>) =>
    item({ id: 'plant', type: 'plant', widthCm: 50, depthCm: 50, ...over });

  it('fires on an item standing in the swept leaf', () => {
    const ev = run('entrance-clarity', layoutOf('bedroom', [plant({ xCm: 200, yCm: 50 })]));
    expect(hits(ev)).toEqual([['plant']]);
  });

  it('fires just inside an outward-swinging door, where the leaf never reaches', () => {
    // For swing: 'outward' the swing rect sits *outside* the room at y ∈ [−80,
    // 0]. Without the inward threshold zone this rule would be silently vacuous
    // for every outward-swinging door.
    const l = layoutOf('bedroom', [plant({ xCm: 200, yCm: 30 })], [door({ swing: 'outward' })]);
    expect(hits(run('entrance-clarity', l))).toEqual([['plant']]);
    // Collapse the threshold zone and the hole reappears — which is the proof
    // that it, not the swing rect, is what caught this.
    expect(hits(evaluate(l, retuned('entrance-clarity', { thresholdDepthCm: 0 })))).toEqual([]);
  });

  it('does not fire on an item well inside the room', () => {
    expect(hits(run('entrance-clarity', layoutOf('bedroom', [plant({ xCm: 200, yCm: 200 })])))).toEqual(
      [],
    );
  });

  it('checks every door, not just the main entrance', () => {
    // A second door on the south wall at the same offset: centre (200, 300),
    // threshold zone y ∈ [240, 300]. The plant sits at y ∈ [245, 295].
    const side = door({ id: 'side', wall: 'south', isMain: false });
    const l = layoutOf('bedroom', [plant({ xCm: 200, yCm: 270 })], [door(), side]);
    expect(hits(run('entrance-clarity', l))).toEqual([['plant']]);
    // Narrow the scope to the main door in JSON and it goes quiet.
    expect(hits(evaluate(l, retuned('entrance-clarity', { doorScope: 'main' })))).toEqual([]);
  });
});

// ── Rule 6 — back support ──────────────────────────────────────────────────

describe('rule 6: back support', () => {
  const sofa = (over: Partial<FurnitureItem>) =>
    item({ id: 'sofa', type: 'sofa', widthCm: 200, depthCm: 90, ...over });

  it('emits a tip, not a warning, when a seat has its back to the door', () => {
    // rotation 180 = facing south, so the back faces north — straight at the
    // door centre (200, 0).
    const ev = run(
      'back-support',
      layoutOf('living_room', [sofa({ xCm: 200, yCm: 150, rotationDeg: 180 })]),
    );
    expect(hits(ev)).toEqual([['sofa']]);
    expect(ev.findings[0].severity).toBe('tip');
    expect(ev.findings[0].fix).toMatch(/\S/);
  });

  it('does not fire on a seat facing the door', () => {
    const ev = run(
      'back-support',
      layoutOf('living_room', [sofa({ xCm: 200, yCm: 150, rotationDeg: 0 })]),
    );
    expect(hits(ev)).toEqual([]);
  });

  it('treats its 45° tolerance as inclusive, and it is wider than rule 2 on purpose', () => {
    const at = (rotationDeg: number) =>
      hits(run('back-support', layoutOf('living_room', [sofa({ xCm: 200, yCm: 150, rotationDeg })])));
    expect(at(225)).toEqual([['sofa']]); // back 45° off the door — still counts
    expect(at(226)).toEqual([]);
  });

  it('is not applicable in a bedroom', () => {
    const ev = run(
      'back-support',
      layoutOf('bedroom', [sofa({ xCm: 200, yCm: 150, rotationDeg: 180 })]),
    );
    expect(ev.notApplicable).toEqual(['back-support']);
  });
});

// ── Rule 7 — proportion ────────────────────────────────────────────────────

describe('rule 7: proportion', () => {
  // Room floor = 400 × 300 = 120 000 cm².
  it('leaves a queen bed in a 4 × 3 m room alone', () => {
    // The catalog queen is 152 × 203 = 30 856 cm² → 25.7%. Normal, and the
    // 40% threshold is set above it deliberately.
    const bed = item({ id: 'bed', widthCm: 152, depthCm: 203 });
    expect(hits(run('proportion', layoutOf('bedroom', [bed])))).toEqual([]);
  });

  it('fires on a piece taking half the floor', () => {
    // 300 × 200 = 60 000 cm² → 50%.
    const sofa = item({ id: 'sofa', type: 'sofa', widthCm: 300, depthCm: 200 });
    expect(hits(run('proportion', layoutOf('living_room', [sofa])))).toEqual([['sofa']]);
  });

  it('puts the boundary exactly at the JSON share', () => {
    // 240 × 200 = 48 000 = exactly 40% of 120 000, and the test is strict.
    const at = (widthCm: number, depthCm: number) =>
      hits(run('proportion', layoutOf('bedroom', [item({ id: 'bed', widthCm, depthCm })])));
    expect(at(240, 200)).toEqual([]);
    expect(at(250, 200)).toEqual([['bed']]); // 50 000 → 41.7%
  });

  it('is not applicable to a room holding only untargeted types', () => {
    // A rug covering the whole floor is intended, so `rug` is not a target —
    // and with nothing else in the room the rule has nothing to judge.
    const rug = item({ id: 'rug', type: 'rug', widthCm: 400, depthCm: 300 });
    const ev = run('proportion', layoutOf('bedroom', [rug]));
    expect(ev.notApplicable).toEqual(['proportion']);
  });
});

// ── Golden layouts ─────────────────────────────────────────────────────────
// Whole-`Evaluation` assertions, one per applicable room type. Copy is
// deliberately excluded: that text will churn when the domain expert reviews
// it, and a golden that breaks on a wording change trains people to update
// goldens without reading them. `ruleset.test.ts` guards the copy instead.

const summarise = (ev: Evaluation) => ({
  findings: ev.findings.map((f) => ({
    ruleId: f.ruleId,
    severity: f.severity,
    itemIds: f.itemIds,
  })),
  passed: ev.passed,
  notApplicable: ev.notApplicable,
});

describe('golden layouts', () => {
  it('a well-arranged bedroom raises nothing', () => {
    // bed       x ∈ [5, 155],     y ∈ [90, 290]   — off the corridor, door in view
    // nightstand x ∈ [60, 100],   y ∈ [40, 80]    — 10 cm from the bed, exempt
    // dresser   x ∈ [225, 375],   y ∈ [245, 295]  — 70 cm channel to the bed
    // mirror    x ∈ [387.5, 392.5], y ∈ [10, 70]  — reflects west, misses the bed
    const layout = layoutOf('bedroom', [
      item({ id: 'bed', xCm: 80, yCm: 190, widthCm: 150, depthCm: 200 }),
      item({ id: 'nightstand', type: 'nightstand', xCm: 80, yCm: 60, widthCm: 40, depthCm: 40 }),
      item({ id: 'dresser', type: 'dresser', xCm: 300, yCm: 270, widthCm: 150, depthCm: 50 }),
      item({
        id: 'mirror',
        type: 'mirror',
        xCm: 390,
        yCm: 40,
        widthCm: 60,
        depthCm: 5,
        rotationDeg: 270,
      }),
    ]);

    expect(summarise(evaluate(layout))).toEqual({
      findings: [],
      passed: [
        'command-position',
        'coffin-position',
        'mirror-faces-bed',
        'clear-pathways',
        'entrance-clarity',
        'proportion',
      ],
      notApplicable: ['back-support'],
    });
  });

  it('a crowded living room raises four findings, one of them a tip', () => {
    // sofa         x ∈ [100, 300], y ∈ [105, 195] — in the corridor, in the
    //                                               entry band, back to the door
    // coffee_table x ∈ [145, 255], y ∈ [210, 270] — 15 cm from the sofa
    const layout = layoutOf('living_room', [
      item({ id: 'sofa', type: 'sofa', xCm: 200, yCm: 150, widthCm: 200, depthCm: 90, rotationDeg: 180 }),
      item({
        id: 'coffee_table',
        type: 'coffee_table',
        xCm: 200,
        yCm: 240,
        widthCm: 110,
        depthCm: 60,
      }),
    ]);

    expect(summarise(evaluate(layout))).toEqual({
      findings: [
        { ruleId: 'command-position', severity: 'warning', itemIds: ['sofa'] },
        { ruleId: 'clear-pathways', severity: 'warning', itemIds: ['sofa'] },
        { ruleId: 'clear-pathways', severity: 'warning', itemIds: ['sofa', 'coffee_table'] },
        { ruleId: 'back-support', severity: 'tip', itemIds: ['sofa'] },
      ],
      passed: ['entrance-clarity', 'proportion'],
      notApplicable: ['coffin-position', 'mirror-faces-bed'],
    });
  });

  it('a well-arranged home office raises nothing', () => {
    // desk  x ∈ [300, 360], y ∈ [140, 260] — against the east wall, door in view
    // chair x ∈ [245, 295], y ∈ [175, 225] — faces the desk, exempt from walkways
    // shelf x ∈ [45, 75],   y ∈ [110, 190] — 225 cm channel to the desk
    const layout = layoutOf('home_office', [
      item({ id: 'desk', type: 'desk', xCm: 330, yCm: 200, widthCm: 120, depthCm: 60, rotationDeg: 270 }),
      item({ id: 'chair', type: 'chair', xCm: 270, yCm: 200, widthCm: 50, depthCm: 50, rotationDeg: 270 }),
      item({ id: 'shelf', type: 'bookshelf', xCm: 60, yCm: 150, widthCm: 80, depthCm: 30, rotationDeg: 90 }),
    ]);

    expect(summarise(evaluate(layout))).toEqual({
      findings: [],
      passed: [
        'command-position',
        'clear-pathways',
        'entrance-clarity',
        'back-support',
        'proportion',
      ],
      notApplicable: ['coffin-position', 'mirror-faces-bed'],
    });
  });

  it('says almost nothing about a kitchen, which has no palette of its own', () => {
    // Worth pinning: REQ-012 should confirm this is the intended experience
    // rather than a bug report waiting to happen.
    const layout = layoutOf('kitchen', [
      item({ id: 'plant', type: 'plant', xCm: 350, yCm: 250, widthCm: 50, depthCm: 50 }),
    ]);
    expect(summarise(evaluate(layout))).toEqual({
      findings: [],
      passed: ['clear-pathways', 'entrance-clarity', 'proportion'],
      notApplicable: [
        'command-position',
        'coffin-position',
        'mirror-faces-bed',
        'back-support',
      ],
    });
  });

  it('reports every door-dependent rule as not applicable without a door', () => {
    const layout = layoutOf('bedroom', [item({ id: 'bed', xCm: 80, yCm: 190 })], []);
    const ev = evaluate(layout);
    expect(ev.findings).toEqual([]);
    expect(ev.notApplicable).toEqual([
      'command-position',
      'coffin-position',
      'mirror-faces-bed',
      'entrance-clarity',
      'back-support',
    ]);
    expect(ev.passed).toEqual(['clear-pathways', 'proportion']);
  });
});

describe('the Finding contract', () => {
  it('carries a severity, an explanation and a one-line fix on every finding', () => {
    const layout = layoutOf('bedroom', [item({ id: 'bed', xCm: 200, yCm: 200 })]);
    const ev = evaluate(layout);
    expect(ev.findings.length).toBeGreaterThan(0);
    for (const f of ev.findings) {
      expect(['warning', 'tip']).toContain(f.severity);
      expect(f.itemIds.length).toBeGreaterThan(0);
      expect(f.explanation.trim()).not.toBe('');
      expect(f.fix.trim()).not.toBe('');
    }
  });

  it('reports every rule exactly once, across the three outcomes', () => {
    const layout = layoutOf('living_room', [
      item({ id: 'sofa', type: 'sofa', xCm: 200, yCm: 150, widthCm: 200, depthCm: 90 }),
    ]);
    const ev = evaluate(layout);
    const reported = new Set([...ev.findings.map((f) => f.ruleId), ...ev.passed, ...ev.notApplicable]);
    expect([...reported].sort()).toEqual(MVP_RULESET.rules.map((r) => r.id).sort());
    expect(ev.passed.filter((id) => ev.notApplicable.includes(id))).toEqual([]);
  });
});
