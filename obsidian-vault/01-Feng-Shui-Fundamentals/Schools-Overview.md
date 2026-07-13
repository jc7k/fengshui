# Schools Overview — and Why They Disagree

> Read this before [[../02-Week-1-Whole-Game/Module-Guide|Week 1]]. It's the map of the whole
> curriculum, and it's the reason the capstone exists.

## Why it matters
"Feng shui" isn't one method — it's a **family of schools** built up over more than a thousand
years, each with its own lineage, instrument, and logic. You'll implement one per week. Knowing
how they relate keeps you oriented, and knowing *why they conflict* is the intellectual heart of
this project.

## The four you'll build

**Form School (Luan Tou, 巒頭)** — the oldest branch, traditionally traced to Yang Yun-Sung
(~9th century CE). It reads the **visible landscape**: hills, water, roads, the shape of a room,
where you sit. Least mathematical, most about trained perception. → *Week 5.*

**Compass School (Li Qi, 理氣)** — emerged later (around the Song dynasty) to read **invisible
directional energy** with the luopan. It contains two sub-methods you'll build separately:
- **Eight Mansions (Ba Zhai, 八宅)** — assigns each *person* four good and four bad directions
  from their birth year. → *Week 3.*
- **Flying Stars (Xuan Kong Fei Xing, 玄空飛星)** — gives each *building* a time-based natal
  chart that changes every 20-year period. → *Week 4.*

**BTB / Black Sect (Black Hat Sect Tantric Buddhism)** — a **modern Western adaptation** created
by Professor Thomas Lin Yun in the 1970s. It drops the compass entirely and aligns a fixed bagua
map to the **front door**. Easiest to apply, most controversial among traditionalists. → *Week 6.*

## Why they give conflicting advice
Because they use **entirely different measuring systems**, and none can be checked against the
others:
- **Form School** cares about physical shape and sight lines — it may love a room the compass
  schools flag.
- **Eight Mansions** says your good directions are **fixed for life** (your birth Kua).
- **Flying Stars** says a room's energy is **volatile** and depends on *when the home was built*
  and *the current year* — the opposite assumption from Eight Mansions.
- **BTB** ignores compass direction altogether, so its "wealth corner" is often a *different
  room* than the compass school's.

So a room that is your "wealth area" in BTB can face your *worst* personal direction in Eight
Mansions while hosting a *difficult star pair* in Flying Stars. Nobody is doing it wrong — they're
answering different questions. **The Week 7–8 capstone lays all four verdicts side by side and
marks the conflicts.** That table, not any single answer, is the deliverable.

## The metaphor 🏠
Four expert home inspectors show up. One checks the foundation and views (Form). One asks *your*
birthday (Eight Mansions). One asks the *house's* birthday (Flying Stars). One just walks in the
front door and pulls out a stencil (BTB). Of course their reports differ — they inspected
different things. A good general contractor (you, in the capstone) shows the client all four.

## How we compute it in code
Each school is one `src/` module — `floorplan.py`, `eight_mansions.py`, `flying_stars.py`, and the
BTB/compass split in `bagua.py`. `src/report.py` runs them all and builds the conflict table.

## Talk it through
- With a practitioner: "Which lineage do you practice, and what do you think of the others?
  Do you ever combine them?"
- For yourself: before you build anything, predict — which two of these schools do you expect to
  disagree the *most*? Write it down; check yourself at the capstone.

➡️ Next: [[../02-Week-1-Whole-Game/Module-Guide|Week 1's Module Guide]].
