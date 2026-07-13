# Week 5 — Form School

**Time estimate:** 6–9 hours (a guideline, not a deadline — go at your pace).
**Notebook:** `notebooks/Week_5_Form_School.ipynb`

## Objective
Add **Form School (Luan Tou)** — the oldest school — to your analyzer, and draw its most
important line honestly: some of Form School is plain geometry a computer can do (missing
corners, the command position, poison arrows on the grid), and much of it is **trained
perception a computer must NOT fake** (the Four Celestial Animals, the land, the roads). You'll
compute the first half and *commit to observing* the second half with your own eyes.

## Why this week is different
Every school so far handed you a formula. Form School mostly doesn't have one — it's a way of
*looking* at land and space, older than the compass itself. So this week the deliverable is
split: three real geometry functions on the grid, and a **field checklist** the code prints but
deliberately refuses to answer. That refusal is the lesson.

## Before you code — read these primers
- [[../01-Feng-Shui-Fundamentals/Chi-Yin-Yang|Chi, Yin & Yang]] — poison arrows and command
  positions are all "how does chi move?"
- [[Form-School-and-the-Four-Animals|Form School & the Four Celestial Animals]] — this week's
  primer: the armchair configuration, and what's computed vs. observed.

## Steps
1. **Open the notebook in Colab** (see [[../../GETTING_STARTED|GETTING_STARTED]]). Run the
   bootstrap cell.
2. **Check for missing corners** on both sample homes:
   `floorplan.missing_corners(home)`. The `sunny_studio` is a clean square (missing nothing);
   `courtyard_L` is L-shaped and missing a whole bagua sector.
3. **Verify against your hand-worked answers** — sketch `courtyard_L`'s grid on paper, decide
   yourself which sector is absent, then run the ✅ check cell. It asserts Northeast.
4. **Test the command position** for the studio's bed and desk with
   `floorplan.command_position(home, feature_type)` — can each see the door without sitting in
   its direct line (approximated as: diagonal from the door)?
5. **Find the poison arrows.** ← *You write this cell yourself* — call
   `floorplan.poison_arrows(home)` and describe each finding in your own words (chi rushing in
   a straight line at a bed or desk from the door).
6. **Print the field checklist** with `floorplan.field_checklist()` — then actually go answer
   it, about your **real home**, with your eyes and a satellite map. Record your answers in
   [[Lab-Notes]].
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] `missing_corners` matches your hand-worked answers (the ✅ check cell passes)
- [ ] `command_position` reported for both the bed and the desk
- [ ] Poison arrows found and described, one per line (your cell)
- [ ] The field checklist prints — and you've committed to answering it about your own home
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
This matters more this week than any other. **Form School is the least reducible to code.**
The grid checks are real but coarse — "diagonal from the door" is a crude stand-in for what a
practitioner sees in a room. And the landform reading — the Four Animals, the roads, the water —
is *deliberately* left to human eyes. A tool that claimed to score your home's "dragon and
tiger" from a floor plan would be lying. Ours prints prompts instead. That's not a missing
feature; that's the feature.

## What's next
➡️ [[../07-Week-6-BTB-Contrast/Module-Guide|Week 6]] puts two schools' maps side by side — and
you'll watch them disagree about the same home.
