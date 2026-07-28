# Authoring Feng Shui rules

The seven MVP rules live in [`core/mvp-rules.json`](../core/mvp-rules.json). This
document is for whoever owns their *content* — which rooms they apply to, how
strict they are, and what they say to the user.

## The boundary, in one line

**Numbers and lists live in JSON. Control flow lives in TypeScript.**

A JSON rule names a *predicate* — a registered geometric test — and supplies its
parameters. JSON is not a scripting language here: there are no expressions, no
conditionals, no arithmetic. That keeps every rule hand-checkable, which is the
whole point when the output is advice a user will act on.

### Change these yourself, no developer needed

| What | Where |
| --- | --- |
| Any threshold — distances, angles, shares, ranges | `params` |
| Which rooms a rule applies to | `roomTypes` |
| Which furniture it looks at | `targets` |
| Whether it is a warning or a tip | `severity` |
| The exemption lists (`sightBlockerIgnoreTypes`, `walkwayIgnoreTypes`, `reflectedTypes`) | `params` |
| The wording of `explanation` and `fix` | the rule |
| Turning a rule off | `"enabled": false` |
| Adding a rule that reuses an existing predicate with different numbers and different copy | a new entry |

That last row is the useful one. Two rules may name the same predicate: a strict
`command-position` for beds and a lenient one for desks, each with its own
tolerance and its own wording, is a JSON edit.

### These need a developer

- A new *kind* of geometric test — anything the seven predicates cannot express.
- Any boolean composition or arithmetic over parameters (`if A and not B`).
- Referring to a layout field that does not exist (there is no `heightCm`, so
  "does this block the view" is a curated type list, not a measurement).
- Changing what a predicate *means*, as opposed to how strict it is.

## The predicates

| Predicate | Rule | Required thresholds | Optional lists |
| --- | --- | --- | --- |
| `commandPosition` | 1 | `alignmentWidthFactor` | `sightBlockerIgnoreTypes` |
| `coffinPosition` | 2 | `angleToleranceDeg`, `alignmentWidthFactor` | — |
| `facesBed` | 3 | `maxRangeCm` | `reflectedTypes` |
| `clearance` | 4 | `minClearanceCm`, `ignoreBelowCm`, `entryDepthCm`, `entryWidthFactor` | `mode`, `walkwayIgnoreTypes` |
| `blocksSwing` | 5 | `thresholdDepthCm` | `doorScope` |
| `backToDoor` | 6 | `angleToleranceDeg` | `doorScope` |
| `footprintShare` | 7 | `maxShare` | — |

Two conventions keep the file honest:

- **Every threshold is required.** No number falls back to a TypeScript default.
- **Unknown parameter keys are an error.** A typo like `minClearenceCm` would
  otherwise let you believe you changed a threshold when you had not, and that
  failure mode is worse than a crash.

The ruleset is validated when the app loads, so a malformed file fails
immediately and loudly, naming the rule. It is code-reviewed content, not
user-editable-at-runtime content.

## What the engine returns

`evaluate(layout, ruleset)` returns three lists, not one:

- `findings` — one per violation, carrying `severity`, `explanation`, `fix` and
  the `itemIds` involved.
- `passed` — rules that ran and found nothing.
- `notApplicable` — rules that had nothing to say here.

The distinction matters for the feedback panel. A rule is **not applicable**
when the room type excludes it, when the layout holds none of its target types,
or when something it needs is missing (no door; no bed for a mirror to face).
"Mirror placement: passed" in a room with no mirror would be false reassurance.

## Interpretations you may want to argue with

These are judgement calls, not facts. They are the first things to review.

**Rule 1 reads position, never orientation.** The viewpoint is the item's centre.
"Front" is unambiguous for a bed but genuinely ambiguous for a desk — the
working edge, or the side the sitter occupies? So rule 1 owns position and rule
6 owns orientation. A purist would say a desk facing a wall fails the commanding
position even when the door is visible from its centre; today it does not.

**"Directly in line with the door" is an axis-aligned corridor** as wide as the
door, projected across the room. At `alignmentWidthFactor` 1.0 a bed 5 cm
outside that band passes, which will look arbitrary to a user nudging it. Some
practitioners would widen the factor to 1.5–2.

**Rule 3 does not test occlusion.** A mirror is usually mounted above a dresser
and still reflects over it. `maxRangeCm` is 600 and weakly grounded — a mirror
8 m away technically faces the bed but does not disturb it.

**Rule 4 excludes walls.** A 20 cm slot behind a dresser is not a walkway anyone
intends to use, so only furniture-to-furniture channels are measured. Its three
carve-outs — the `ignoreBelowCm` floor, the requirement that two items actually
overlap across the channel, and `walkwayIgnoreTypes` — together decide whether
this rule is useful or noisy.

**Rule 7's 40% share** sits just above the largest defensible-normal case: a
queen bed is 25.7% of a 4 × 3 m room and 41% of a 2.5 × 3 m one.

**`plant` blocks the view.** It is absent from `sightBlockerIgnoreTypes`, so a
tall plant between a bed and the door fails rule 1. Arguable both ways.

**Findings can overlap.** A bed in the coffin position fires rules 1 and 2; an
item in the doorway fires rules 4 and 5. Each is independently correct, but the
user sees two messages about one item. Suppression would make one rule's
geometry depend on another's parameters, which breaks the declarative story, so
it is a presentation decision rather than an engine one.

## Copy

Every `explanation` and `fix` currently carries `"draft": true`: they are
developer-written placeholders, not authority. `explanation` states the
principle, `fix` gives one concrete action. Both are single lines of at most 120
characters, and a test enforces that.

When the copy is signed off, set `draft` to `false`. `core/ruleset.test.ts` will
fail — that is deliberate, and the fix is to update the assertion once, on
purpose.

## Changing a rule safely

Fixtures in `core/rules.test.ts` are the reference table for these rules: there
is no published table to reproduce, so hand-verified layouts take its place.
Every threshold has a boundary case pinned there — a 60 cm gap passes and 59 cm
warns, a 40% share passes and 41.7% warns.

So changing a threshold *should* break a test. Run `npm test`, read which
boundary moved, and update it deliberately. If nothing breaks, check that the
parameter you edited is the one the rule actually reads.
