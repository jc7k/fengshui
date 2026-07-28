/**
 * The geometric tests a JSON rule may name.
 *
 * This is the TypeScript side of the declarative boundary. A predicate owns
 * *what kind of question* to ask; JSON owns the numbers, the lists, the copy
 * and which furniture and rooms to ask it about.
 *
 * Parameters are validated at **load** time, inside the predicate that knows
 * its own parameter names — the only place that can reject an unknown key. So
 * `compile` returns a closure over typed params and the evaluation path itself
 * does no validation and contains no `any`.
 */

import {
  areaShare,
  doorCenter,
  doorSwingRect,
  rectAabb,
  rectsIntersect,
  isBackTo,
  isFacing,
  type Vec2,
} from './geometry';
import { FURNITURE_SPECS } from './furniture';
import {
  canSeeDoor,
  channelGap,
  doorAxisCorridor,
  doorBand,
  doorsInScope,
  mirrorBeam,
  type DoorScope,
} from './rule-geometry';
import {
  RulesetError,
  type CompiledPredicate,
  type PredicateName,
  type PredicateVerdict,
  type RuleContext,
} from './rule-types';
import type { FurnitureItem, FurnitureType } from './types';

const ALL_FURNITURE_TYPES = Object.keys(FURNITURE_SPECS) as FurnitureType[];

const DOOR_SCOPES: readonly DoorScope[] = ['main', 'all'];

/**
 * Types that do not block a seated or lying person's view of the door: flat,
 * wall-mounted, thin, or below eye level.
 *
 * A fallback only — `mvp-rules.json` states the live list, which is where the
 * domain expert should argue about it. `plant` is the debatable omission.
 */
const DEFAULT_SIGHT_BLOCKER_IGNORE: readonly FurnitureType[] = [
  'rug',
  'mirror',
  'artwork',
  'coffee_table',
  'lamp',
  'nightstand',
];

/** Small satellite items that are *supposed* to sit close to something else. */
const DEFAULT_WALKWAY_IGNORE: readonly FurnitureType[] = [
  'nightstand',
  'chair',
  'lamp',
  'rug',
  'artwork',
];

/**
 * Reads and validates one rule's `params`.
 *
 * Unknown keys are an error rather than an ignored typo: `minClearenceCm`
 * silently falling back to a default would let the author believe they changed
 * a threshold when they had not, and that failure mode is worse than a crash.
 */
class ParamReader {
  private readonly obj: Record<string, unknown>;
  private readonly used = new Set<string>();

  constructor(
    raw: unknown,
    private readonly ruleId: string,
  ) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new RulesetError(`rule "${ruleId}": params must be an object`);
    }
    this.obj = raw as Record<string, unknown>;
  }

  private fail(message: string): never {
    throw new RulesetError(`rule "${this.ruleId}": ${message}`);
  }

  /** A threshold. Always required — no TypeScript may quietly supply a number. */
  number(key: string): number {
    this.used.add(key);
    const v = this.obj[key];
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      this.fail(`params.${key} must be a finite number (it is required)`);
    }
    return v;
  }

  types(key: string, fallback: readonly FurnitureType[]): readonly FurnitureType[] {
    this.used.add(key);
    if (!(key in this.obj)) return fallback;
    const v = this.obj[key];
    if (!Array.isArray(v)) this.fail(`params.${key} must be an array of furniture types`);
    for (const t of v) {
      if (typeof t !== 'string' || !(ALL_FURNITURE_TYPES as string[]).includes(t)) {
        this.fail(`params.${key} contains "${String(t)}", which is not a furniture type`);
      }
    }
    return v as FurnitureType[];
  }

  choice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
    this.used.add(key);
    if (!(key in this.obj)) return fallback;
    const v = this.obj[key];
    if (typeof v !== 'string' || !(allowed as readonly string[]).includes(v)) {
      this.fail(`params.${key} must be one of ${allowed.join(', ')}`);
    }
    return v as T;
  }

  done(): void {
    for (const key of Object.keys(this.obj)) {
      if (!this.used.has(key)) {
        this.fail(
          `params.${key} is not a parameter of this predicate ` +
            `(known: ${[...this.used].sort().join(', ')})`,
        );
      }
    }
  }
}

const notApplicable = (reason: string): PredicateVerdict => ({ applicable: false, reason });

/**
 * `angleBetween` returns 0 for a degenerate vector, so a target sitting exactly
 * on an item's centre reads as both facing and back-to. Guard the facing rules.
 */
function isDistinct(item: FurnitureItem, target: Vec2): boolean {
  return Math.hypot(target.x - item.xCm, target.y - item.yCm) > 1e-6;
}

type Compile = (raw: unknown, ruleId: string) => CompiledPredicate;

/**
 * Rule 1 — command position.
 *
 * Fires on **either** condition, because the PRD's own wording is "cannot see
 * the door **or** is directly aligned with it".
 *
 * The viewpoint is the item's centre and this predicate never reads rotation.
 * "Front" is unambiguous for a bed but genuinely ambiguous for a desk — the
 * working edge, or the side the sitter occupies? Centre makes rule 1 a purely
 * positional question and draws a clean division of labour: **rule 1 owns
 * position, rule 6 owns orientation.** It also matches the prior Python work,
 * whose `floorplan.py::command_position` is positional and never tests
 * occlusion. This is the single most important interpretive decision here.
 */
const commandPosition: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const alignmentWidthFactor = p.number('alignmentWidthFactor');
  const sightBlockerIgnoreTypes = p.types('sightBlockerIgnoreTypes', DEFAULT_SIGHT_BLOCKER_IGNORE);
  p.done();

  return (ctx: RuleContext, targets): PredicateVerdict => {
    const door = ctx.mainDoor;
    if (!door) return notApplicable('the layout has no door');

    const corridor = doorAxisCorridor(door, ctx.room, alignmentWidthFactor);
    const violations: string[][] = [];

    for (const item of targets) {
      const aligned = rectsIntersect(corridor, ctx.rectOf(item));
      const obstacles = ctx.layout.furniture
        .filter((o) => o.id !== item.id && !sightBlockerIgnoreTypes.includes(o.type))
        .map(ctx.rectOf);
      const blind = !canSeeDoor({ x: item.xCm, y: item.yCm }, door, ctx.room, obstacles);
      if (aligned || blind) violations.push([item.id]);
    }
    return { applicable: true, violations };
  };
};

/**
 * Rule 2 — coffin position.
 *
 * Both conditions required. `facingVector(bed.rotationDeg)` is the direction
 * the feet point, so aim alone is `isFacing`; but a bed in a far corner whose
 * foot happens to point within 20° of the door is not the coffin position. The
 * corridor test — the *same* helper rule 1 uses — is what makes it "directly".
 */
const coffinPosition: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const angleToleranceDeg = p.number('angleToleranceDeg');
  const alignmentWidthFactor = p.number('alignmentWidthFactor');
  p.done();

  return (ctx, targets): PredicateVerdict => {
    const door = ctx.mainDoor;
    if (!door) return notApplicable('the layout has no door');

    const centre = doorCenter(door, ctx.room);
    const corridor = doorAxisCorridor(door, ctx.room, alignmentWidthFactor);
    const violations: string[][] = [];

    for (const item of targets) {
      if (!isDistinct(item, centre)) continue;
      if (isFacing(item, centre, angleToleranceDeg) && rectsIntersect(corridor, ctx.rectOf(item))) {
        violations.push([item.id]);
      }
    }
    return { applicable: true, violations };
  };
};

/**
 * Rule 3 — a mirror facing the bed.
 *
 * Occlusion is deliberately not tested: a mirror is typically mounted above a
 * dresser and still reflects over it. Half-implementing that would be worse
 * than saying so.
 */
const facesBed: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const maxRangeCm = p.number('maxRangeCm');
  const reflectedTypes = p.types('reflectedTypes', ['bed']);
  p.done();

  return (ctx, targets): PredicateVerdict => {
    const reflected = ctx.layout.furniture.filter((i) => reflectedTypes.includes(i.type));
    if (reflected.length === 0) {
      return notApplicable(`the layout has no ${reflectedTypes.join(' or ')} to reflect`);
    }

    const violations: string[][] = [];
    for (const mirror of targets) {
      const beam = mirrorBeam(mirror, maxRangeCm);
      for (const other of reflected) {
        if (other.id === mirror.id) continue;
        if (rectsIntersect(beam, ctx.rectOf(other))) violations.push([mirror.id, other.id]);
      }
    }
    return { applicable: true, violations };
  };
};

/**
 * Rule 4 — clear pathways. Two PRD claims under one rule id, via `mode`.
 *
 * The entry band is **depth-limited**, not room-length: an item across the room
 * opposite the door does not block the path *from* the door — that is rule 1's
 * alignment condition.
 *
 * The walkway half has three carve-outs, and without them this rule cries wolf
 * on every real layout: the `ignoreBelowCm` floor (a 3 cm gap is furniture
 * pushed together, one mass, not a walkway), the perpendicular-overlap
 * requirement inside `channelGap`, and `walkwayIgnoreTypes`. **Walls are
 * excluded** — a 20 cm slot behind a dresser is not a walkway anyone intends to
 * use. A decision, not an oversight.
 */
const clearance: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const minClearanceCm = p.number('minClearanceCm');
  const ignoreBelowCm = p.number('ignoreBelowCm');
  const entryDepthCm = p.number('entryDepthCm');
  const entryWidthFactor = p.number('entryWidthFactor');
  const mode = p.choice('mode', ['both', 'entry', 'walkway'] as const, 'both');
  const walkwayIgnoreTypes = p.types('walkwayIgnoreTypes', DEFAULT_WALKWAY_IGNORE);
  p.done();

  return (ctx, targets): PredicateVerdict => {
    const door = ctx.mainDoor;
    if (mode === 'entry' && !door) return notApplicable('the layout has no door');

    const violations: string[][] = [];

    // Entry path. Skipped silently under 'both' when there is no door — the
    // walkway half is still a real answer.
    if (mode !== 'walkway' && door) {
      const band = doorBand(door, ctx.room, entryDepthCm, entryWidthFactor);
      for (const item of targets) {
        if (rectsIntersect(band, ctx.rectOf(item))) violations.push([item.id]);
      }
    }

    // Cramped walkways. O(n²) over pairs; 20 items is ~190 pairs of AABB
    // arithmetic, so there is nothing here worth optimising.
    if (mode !== 'entry') {
      const walkable = targets.filter((i) => !walkwayIgnoreTypes.includes(i.type));
      for (let i = 0; i < walkable.length; i++) {
        for (let j = i + 1; j < walkable.length; j++) {
          const a = walkable[i];
          const b = walkable[j];
          const gap = channelGap(rectAabb(ctx.rectOf(a)), rectAabb(ctx.rectOf(b)));
          if (gap && gap.gapCm > ignoreBelowCm && gap.gapCm < minClearanceCm) {
            violations.push([a.id, b.id]);
          }
        }
      }
    }
    return { applicable: true, violations };
  };
};

/**
 * Rule 5 — entrance clarity.
 *
 * The PRD says "immediately behind **or** blocking", so this tests the union of
 * the swept leaf and an inward threshold zone. The union is load-bearing: for
 * `swing: 'outward'` the swing rect lies *outside* the room, so without the
 * threshold zone this rule would be vacuous for every outward-swinging door.
 */
const blocksSwing: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const thresholdDepthCm = p.number('thresholdDepthCm');
  const doorScope = p.choice('doorScope', DOOR_SCOPES, 'main');
  p.done();

  return (ctx, targets): PredicateVerdict => {
    const doors = doorsInScope(ctx.layout, doorScope);
    if (doors.length === 0) return notApplicable('the layout has no door');

    const violations: string[][] = [];
    for (const door of doors) {
      const swing = doorSwingRect(door, ctx.room);
      const threshold = doorBand(door, ctx.room, thresholdDepthCm, 1);
      for (const item of targets) {
        const rect = ctx.rectOf(item);
        if (rectsIntersect(swing, rect) || rectsIntersect(threshold, rect)) {
          violations.push([item.id]);
        }
      }
    }
    return { applicable: true, violations };
  };
};

/**
 * Rule 6 — back support. A **tip**, not a warning.
 *
 * No wall-backing exemption: if the sofa's back is to the north wall and the
 * door is in the north wall, people walk in behind you — that *is* the finding.
 * "Or a solid backing" is advice in the `fix` text, not a geometric condition.
 * The tolerance is deliberately much wider than rule 2's, because this is about
 * general orientation rather than a straight line.
 */
const backToDoor: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const angleToleranceDeg = p.number('angleToleranceDeg');
  const doorScope = p.choice('doorScope', DOOR_SCOPES, 'main');
  p.done();

  return (ctx, targets): PredicateVerdict => {
    const doors = doorsInScope(ctx.layout, doorScope);
    if (doors.length === 0) return notApplicable('the layout has no door');

    const violations: string[][] = [];
    for (const item of targets) {
      // One finding per item, however many doors it has its back to.
      const exposed = doors.some((door) => {
        const centre = doorCenter(door, ctx.room);
        return isDistinct(item, centre) && isBackTo(item, centre, angleToleranceDeg);
      });
      if (exposed) violations.push([item.id]);
    }
    return { applicable: true, violations };
  };
};

/** Rule 7 — one item taking an outsized share of the floor. */
const footprintShare: Compile = (raw, ruleId) => {
  const p = new ParamReader(raw, ruleId);
  const maxShare = p.number('maxShare');
  p.done();

  return (ctx, targets): PredicateVerdict => {
    const violations: string[][] = [];
    for (const item of targets) {
      if (areaShare(item, ctx.room) > maxShare) violations.push([item.id]);
    }
    return { applicable: true, violations };
  };
};

/** The registry. A JSON `predicate` that is not a key here fails at load. */
export const PREDICATES: Record<PredicateName, Compile> = {
  commandPosition,
  coffinPosition,
  facesBed,
  clearance,
  blocksSwing,
  backToDoor,
  footprintShare,
};
