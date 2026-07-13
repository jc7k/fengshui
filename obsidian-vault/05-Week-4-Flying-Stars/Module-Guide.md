# Week 4 — Flying Stars

**Time estimate:** 8–12 hours (the hardest week — go at your pace, and take breaks).
**Notebook:** `notebooks/Week_4_Flying_Stars.ipynb`

## Objective
Build a building's **time-based natal chart** — the Flying Stars (Xuan Kong Fei Xing) 9-palace
grid. From just two inputs — the construction period and the facing in degrees — your code will
place three stars in every palace, draw the chart South-up, and **reproduce two real published
charts cell-for-cell**. It will also do something new: **refuse** to chart a building whose
facing is ambiguous, instead of guessing.

## Why this week is the hard one
Weeks 1–3 asked "where is this room?" and "who lives here?". Flying Stars asks "**when** was this
built?" — it's the one classical school that adds time. The algorithm is genuinely fiddly (three
layers, a flight path, a forward/reverse switch), and it's the first place our "computed from
first principles" ideal gives way to "looked up from a cited table." That trade is deliberate,
and the honesty check below says why.

## Before you code — read these primers
- [[../01-Feng-Shui-Fundamentals/The-Luopan-and-24-Mountains|The Luopan & 24 Mountains]] — the
  15° slices and their yin/yang polarities are the switch this whole week runs on.
- [[Flying-Stars-Xuan-Kong|this week's Flying Stars primer]] — periods, the Lo Shu flight path,
  the three stars, and the two honest limits.

## Steps
1. **Open the notebook in Colab** (see [[../../GETTING_STARTED|GETTING_STARTED]]). Run the
   bootstrap cell.
2. **Find a home's period** with `flying_stars.period_of(year)`. Periods are 20-year blocks; we
   are in Period 9 (2024–2043). A building's period comes from its completion/first-occupancy
   year (with a Feb-4 boundary in the traditional calendar).
3. **Build the natal chart** — `flying_stars.natal_chart(period, facing_degrees)` returns
   `{direction: [mountain, base, facing]}` for all nine palaces. Print it and stare at it.
4. **Draw it** with `viz.plot_flying_star_chart(chart, title)`. Note the convention: **South is
   up, North is down** — flying-star charts are always drawn this way.
5. **Run the ✅ verification cell** — it asserts your `natal_chart` reproduces the two published
   charts in `data/reference/flying_star_charts.json` **cell-for-cell**. If a ❌ prints, the
   forward/reverse logic is where to look.
6. **The honest refusal.** ← *You write this cell yourself* — load `edge_case_flat` (its facing,
   172.4°, sits right on a 24-mountain boundary, on purpose), catch the
   `flying_stars.AmbiguousFacing` exception, and print its refusal message.
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] `period_of` returns the right period for a few test years
- [ ] `natal_chart` builds a full 9-palace chart (three numbers in every palace)
- [ ] The chart draws, South-up, with `viz.plot_flying_star_chart`
- [ ] Both published charts reproduce **exactly** (the ✅ check passes)
- [ ] The ambiguous facing is refused and your cell prints the message (your cell)
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
Two things happen this week that look like weaknesses and are actually the point. First, the
forward/reverse polarity is **looked up** from `data/reference/twenty_four_mountains.json`, not
derived — we cite a table instead of pretending to a derivation, and then we *test* the result
against real published charts. Second, the tool **refuses** an ambiguous facing rather than
guessing — exactly what a careful practitioner does (re-measure!). And one warning label: the
polarity rule for the number-5 star is the least certain thing in the whole module. The primer
says so plainly; don't paper over it.

## What's next
Week 5 puts the calculator down and steps back to the *shape* of space — Form School.
➡️ [[../06-Week-5-Form-School/Module-Guide|Week 5]]
