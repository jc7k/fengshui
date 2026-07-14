# Week 1 — The Whole Game

**Time estimate:** 6–10 hours (a guideline, not a deadline — go at your pace).
**Notebook:** `notebooks/Week_1_Whole_Game.ipynb`

## Objective
Build a **complete, working Home Analyzer today** — load a real floor plan, lay a bagua map
over it, and print recommendations. It will ignore your birthday, the year the home was built,
and most of feng shui. It will use the simplest possible logic. **That is the point.** You'll
have the whole machine running end to end, and every later week adds a real school to *this same
machine*.

## Why we start this way (the Whole Game)
Imagine studying the I Ching for a month before you're allowed to look at a room. You'd lose the
thread. Instead we walk through the whole house on day one — crudely — and *then* go room by room.
Week 1 is your walk-through.

## Before you code — read these primers
- [[../01-Feng-Shui-Fundamentals/A-Note-on-Honesty|A Note on Honesty]] — the frame for everything.
- [[../01-Feng-Shui-Fundamentals/Chi-Yin-Yang|Chi, Yin & Yang]] — so "flow" means something.
- [[../01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]] — the
  nine life areas you'll place.
- [[../01-Feng-Shui-Fundamentals/Schools-Overview|Schools Overview]] — so you know what's coming.
- [[Feng-Shui-Origins-Wind-and-Water|Feng Shui's Origins (Wind & Water)]] — where all of this came from.

## Steps
1. **Open the notebook in Colab** (see [[../../GETTING_STARTED|GETTING_STARTED]]). Run the bootstrap
   cell to pull in the helper code and sample homes.
2. **Load a sample home** with `homes.load_home('sunny_studio')` and look at the JSON — a grid of
   rooms plus a facing direction.
3. **Draw it** with `viz.plot_home(home)`. Find the front door.
4. **Snap the facing to a direction** with `compass.direction_of(home['facing_degrees'])`.
5. **Lay the bagua over the home** — for now, the BTB (door-aligned) overlay:
   `analyzer.room_areas(home)`. See which life area each room lands in.
6. **Print the naive recommendations.** ← *You write this cell yourself* — call
   `analyzer.naive_recommendations(home)` and print each tip on its own line.
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] A sample home loads and `viz.plot_home` draws it with the door marked
- [ ] The facing direction prints (e.g. "South")
- [ ] Each room is mapped to a bagua life area
- [ ] The naive recommendations print, one per line (your cell)
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
This tool is **confidently wrong** in places. It uses only the BTB door-aligned map, ignores the
compass, ignores who lives there, ignores the construction year, and its tips are name-based
guesses. **Do not fix that this week.** A crude analyzer that runs end to end is exactly the Week 1
deliverable — every later week adds one real school.

## What's next
Week 2 builds the Five Elements engine and upgrades those naive tips into ones that explain the
*relationship* behind each flag. ➡️ [[../03-Week-2-Elements-and-Bagua/Module-Guide|Week 2]]
