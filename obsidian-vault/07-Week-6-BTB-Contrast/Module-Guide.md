# Week 6 — BTB vs the Compass Bagua

**Time estimate:** 4–6 hours (a lighter week — but conceptually the pivot of the whole project).
**Notebook:** `notebooks/Week_6_BTB_Contrast.ipynb`

## Objective
Draw **both bagua overlays on the same home, side by side** — the compass placement and the BTB
door-aligned placement — and build a **diff table** of every sector where the two schools assign
different life areas to the same physical spot. This is the cleanest possible demonstration that
feng shui schools genuinely conflict: not as a warning in a primer, but as a table on your screen.

## Why this week matters (the pivot)
Since Week 1 you've heard "the schools disagree" as a caveat. This week you *compute* the
disagreement. The same physical corner of the same home gets two different life-area labels
depending on which tradition you ask — and neither map is "the real one." Once you've seen that
diff table, the capstone's design (report every school's answer, side by side, without picking a
winner) stops being a stylistic choice and becomes the only honest option.

## Before you code — read these primers
- [[../01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]] — the
  nine areas and the "big fork" in how to place them.
- [[../01-Feng-Shui-Fundamentals/Schools-Overview|Schools Overview]] — where BTB sits among the
  traditions.
- [[BTB-and-Compass-Bagua|BTB & the Compass Bagua]] — this week's primer: who Lin Yun was, why
  BTB dropped the compass, and why traditionalists object.

## Steps
1. **Open the notebook in Colab** (see [[../../GETTING_STARTED|GETTING_STARTED]]) and run the
   bootstrap cell.
2. **Load a home and find its door wall:**
   `door_wall = homes.find_feature(home, 'door')['wall']`.
3. **Build both overlays** — `bagua.compass_overlay()` and `bagua.btb_overlay(door_wall)`. Each
   returns a 3×3 grid of life-area names.
4. **Draw them side by side** with `viz.plot_school_comparison(home, compass_grid, btb_grid)`.
   Stare at it. Find a sector where the labels differ.
5. **Build the diff table.** ← *You write this cell yourself* — walk the 3×3 sectors and collect
   every `(r, c)` where `compass_grid[r][c] != btb_grid[r][c]`, printing the disagreements.
6. **Run the ✅ check** — it asserts the diff is *non-empty*. The schools really do conflict, and
   the notebook proves it.
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] Both overlays draw side by side on the same home
- [ ] The diff table lists every sector where the two schools disagree (your cell)
- [ ] The ✅ check passes — a non-empty disagreement, confirmed by an assert
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
This week is where "schools conflict" stops being an abstract warning and becomes a table on your
screen. Resist the urge to resolve it. A tool that quietly picked one overlay and pretended it was
correct would be **lying to you** — the compass placement and the door-aligned placement are
different traditions with different logics, and the honest move is to show both. That's exactly
what the capstone will do.

## What's next
➡️ [[../08-Week-7-8-Capstone/Module-Guide|The capstone]] brings ALL schools together into one
honest report — every school's answer, side by side, disagreements included.
