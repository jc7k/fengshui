# fengshui

Python library computing traditional feng shui charts (bagua, bazi, flying stars,
eight mansions) with notebooks and an Obsidian vault for written output.

## Map

| Where | What |
| --- | --- |
| `src/` | The library. One module per system: `bagua`, `bazi`, `compass`, `eight_mansions`, `elements`, `flying_stars`, `floorplan`, `homes`, `analyzer`, `report`, `viz` |
| `scripts/checks.py` | The accuracy gate — asserts the code reproduces published reference tables |
| `notebooks/` | Weekly notebooks; each re-runs the checks relevant to its week |
| `obsidian-vault/` | Written output |
| `data/` | Reference fixtures |

## Commands

```bash
.claude/scripts/verify.sh      # runs scripts/checks.py, prints a verdict
python scripts/checks.py       # the same gate, full output
```

There are no unit tests. `scripts/checks.py` is the correctness gate: feng shui
has no ML metric, so accuracy means reproducing published reference tables. A
change that breaks a reference table is wrong, regardless of how reasonable the
code looks.

## Working agreement

**Read narrowly.** Search for the specific symbol rather than reading whole
modules.

**Route by task class.** Judgment work — interpreting a system, resolving
conflicting sources, design — stays on the main model. Mechanical work with the
decision already made goes to the `grunt` subagent. Self-contained, verifiable
grinds go to Codex via `/delegate`, billed to the ChatGPT quota instead of this
one.

**Verify with scripts, not by reading.** Run `.claude/scripts/verify.sh` after
changes. Never conclude the charts are right by re-reading the code.

**Say what happened.** If a reference check fails, show the failure. If a step
was skipped, say so.

**Keep answers proportionate.** Short answers for short questions, no preamble.
Brief in prose, never brief in analysis.

## Session hygiene

- `/clear` when switching tasks. Run `/handoff` first if the thread matters.
- `/compact` around 60% context (the status line turns amber).
- Above 80% (red): `/handoff` then `/clear`.

---

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a check that reproduces it, then make it pass"
- "Refactor X" → "Ensure `verify.sh` passes before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.
