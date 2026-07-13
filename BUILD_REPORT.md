# Build Report

A record of what was built, how it was verified, and the honest decisions made along the way.
This project is modeled on `ecg-classifier`: thin Colab notebooks over a reusable `src/` library,
an Obsidian vault with numbered folders and four files per module, primers read before the code,
a "whole game" spine, and honesty checks that discourage over-engineering.

## What was built

- **`src/` library (11 modules, stdlib + matplotlib only):** `homes`, `elements`, `bagua`,
  `compass`, `eight_mansions`, `flying_stars`, `floorplan`, `viz`, `analyzer`, `report`, `bazi`.
- **`data/` (bundled, no download):** 4 hand-authored sample homes and 5 reference tables
  (Wu Xing cycles, bagua/life areas, 24 mountains, Kua/Eight-Mansions, two published flying-star
  charts).
- **8 notebooks:** Weeks 1–6, the Weeks 7–8 capstone, and an optional Ba Zi bonus. Each has an
  Open-in-Colab badge, a bootstrap cell, a "✏️ your cell" the learner writes, and inline ✅ checks.
- **Obsidian vault (47 markdown files):** 6 fundamentals primers, one 4-file set per module
  (Module-Guide / Code-Checkpoint / Lab-Notes / Reflection), 4 just-in-time school primers, and
  99-Resources (Glossary, Sample-Home Notes, Links & citations, a deep-research study guide).
- **`scripts/checks.py`:** 34 smoke tests asserting the library against the reference fixtures.

## Global acceptance criteria

- [x] Full, non-empty repository tree; no empty files.
- [x] **All 8 notebooks run top-to-bottom headless** (verified with `jupyter execute` on a clean
  kernel — every notebook's inline `assert` ✅ checks pass).
- [x] `python scripts/checks.py` passes all 34 checks.
- [x] Every notebook has an Open-in-Colab badge and the `GITHUB_USERNAME` bootstrap.
- [x] GETTING_STARTED covers GitHub → Colab → Save-a-copy, plus the local `uv sync` path.
- [x] All 6 fundamentals primers complete, each with Why / metaphor / How-we-compute / Talk-it-through.
- [x] Every module folder has its 4 files; each school week has its just-in-time primer.
- [x] `src/` is importable and reused by the notebooks (no copy-paste duplication).
- [x] `pyproject.toml` covers every third-party import (only `matplotlib` + notebook UI).
- [x] README states the Whole-Game philosophy, the honesty frame, and "ask Jeff anytime."
- [x] CLAUDE.md is the Karpathy guidelines, verbatim.

## Verification, in detail

Feng shui has no ML metric, so "accuracy" here means **does the code reproduce published
references?** The checks assert against cited fixtures and print friendly ✅/❌ lines the learner sees:

- **Wu Xing cycles** reproduce `data/reference/wu_xing.json` exactly.
- **Kua numbers** match all 9 published examples in `kua_table.json`, across both genders and the
  pre/post-2000 formula split; the Li Chun (~Feb 4) boundary is exercised.
- **Flying-star natal charts** reproduce both bundled published charts **cell-for-cell** (all 9
  palaces × 3 stars), and a boundary facing raises `AmbiguousFacing`.
- **Form-School geometry** (missing corners, command position) matches hand-worked answers on the
  sample homes.
- **The capstone report** produces sections for all four schools and a **non-empty conflict table**.

## Key engineering decisions

1. **Bundled homes replace an external dataset.** Unlike ecg-classifier's PhysioNet stream, a floor
   plan is a tiny JSON grid, so the whole "dataset" ships in `data/`. Notebooks run instantly with
   no download and no Drive-cache step.

2. **Stdlib + matplotlib only.** The grids are 3×3–4×3 and the feng shui math is small-integer
   arithmetic and table lookups, so there is no numpy/pandas. This is a stronger embodiment of the
   Simplicity-First guideline than the ML project it's modeled on (which needed a heavy ML stack).

3. **Flying Stars: lookup, not first-principles derivation.** The forward/reverse flight rule
   depends on a 24-mountain yin/yang polarity chosen by trigram and sub-mountain. Deriving it from
   scratch would triple the code and obscure it. Instead the module **looks it up** from a cited
   table and is **validated against real published charts**. The lookup you can read beats the
   derivation you can't.

4. **The tool refuses ambiguous facings.** `edge_case_flat` faces 172.4° — one-tenth of a degree
   from a 24-mountain boundary — and Flying Stars raises `AmbiguousFacing` rather than guessing.
   The refusal is a teaching point, not a gap.

5. **Form-School landform reading is deliberately not automated.** The Four Celestial Animals and
   surrounding land become a printed **field checklist** the learner answers by eye. Automating
   trained perception from a floor plan would be dishonest.

6. **The capstone surfaces conflict instead of resolving it.** `report.py` builds a conflict table
   and attaches a disclaimer; it never emits a single "score." The schools genuinely disagree, and
   showing that honestly is the deliverable.

## Honest caveats

- **The number-5 flying star** has no trigram of its own; its polarity uses the actual measured
  mountain — a common but not universal rule, and the shakiest step in `flying_stars.py`. Charts
  with a 5 in the center of a layer deserve extra humility. Flagged in the code and the primer.
- **Room-to-element mapping** in `analyzer.py` is name-based and simplified; real practice weighs a
  room's use, shape, and contents. Stated in the module docstring and the Week 2 honesty check.
- **Feng shui is an art, not a science.** The whole project is framed as cultural literacy and a
  coding vehicle. It makes no empirical claim, and every module says so where it simplifies.

## How to run it yourself

```bash
uv sync
python scripts/checks.py            # 34 checks, all green
# then open any notebooks/*.ipynb in Colab or VS Code
```
