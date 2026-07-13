# Flying Stars (Xuan Kong Fei Xing)

> Read this before [[Module-Guide|Week 4's Module Guide]]. Flying Stars is the one classical
> school that adds **time** — and the one week where the algorithm is genuinely fiddly.

## Why it matters
Every school so far read a floor plan as if it were timeless. Xuan Kong Fei Xing (玄空飛星,
"Mysterious Void Flying Stars") says a building also has a *when*: from its construction period
and its facing direction, it gets a **natal chart** — nine palaces (the eight directions plus a
center), each holding **three numbers**:

- the **mountain (sitting) star** — read for health and relationships,
- the **base star** — the time layer everything else is built on,
- the **facing (water) star** — read for wealth and career.

One drawing convention to burn in now: flying-star charts are always drawn with **South up,
North down**. If your chart looks "upside down" next to a published one, it's probably the
published one that's right.

## Periods: the 20-year clock
Time is divided into **periods of 20 years**, numbered 1–9. We are in **Period 9: 2024–2043**
(Period 8 was 2004–2023, Period 7 was 1984–2003). A building's period is the period of its
**completion / first-occupancy year** — and the year boundary falls on **February 4th** (the
solar calendar's start of spring), not January 1st. A flat finished in January 2024 is still
Period 8.

## The Lo Shu magic square & the flight path
The nine palaces come from the **Lo Shu** magic square — every row, column, and diagonal sums
to 15. Trace the numbers 5→6→7→8→9→1→2→3→4 through the square and you get the **flight path**,
the fixed order in which palaces receive successive numbers:

**Center → NW → W → NE → S → N → SW → E → SE**

That one path builds all three layers:

1. **Base layer** — put the **period number** in the center and fly **forward** (each palace on
   the path gets the next number up, wrapping 9→1).
2. **Facing layer** — take the base star sitting in the **facing** palace, move it to the
   center, and fly forward *or reverse*.
3. **Mountain layer** — the same, using the base star in the **sitting** palace (the one
   opposite the facing).

Forward means increment (9 wraps to 1); reverse means decrement (1 wraps to 9).

## Forward or reverse? The polarity switch
This is the subtle step. Whether a facing/mountain star flies forward or reverse depends on the
**yin/yang polarity of one of the 24 mountains** — chosen by that star's trigram-direction and
the building's sub-mountain (1/2/3, from [[../01-Feng-Shui-Fundamentals/The-Luopan-and-24-Mountains|The Luopan & 24 Mountains]]).
Yang → forward, yin → reverse. Our code doesn't derive this from first principles: it **looks it
up** from `data/reference/twenty_four_mountains.json`, a cited table. That's a deliberate trade —
a lookup you can read and check beats a derivation that would triple the code — and the notebook
then verifies the output against real published charts, cell-for-cell.

## The two honest limits (on purpose)
1. **Boundary facings are refused.** If the measured facing sits on a 24-mountain boundary
   (within 1° of a 15° line), the code raises `AmbiguousFacing` and tells you to re-measure. It
   will not guess. A real practitioner faced with a needle on the line does exactly the same
   thing: goes back outside and measures again.
2. **The number-5 star has no trigram.** Every other star maps to a trigram-direction, which
   picks its polarity mountain. Star 5 doesn't — so we use the polarity of the **actual measured
   mountain** instead. That's a common and defensible simplification, but it is the **shakiest
   rule in the module**, and different lineages handle it differently. Treat any chart where a
   5 lands in the center of a layer with extra humility.

## The metaphor 🏠
A natal chart is a **birth certificate for a house**. The period is its birth year, the facing
is the direction it was born looking, and the nine palaces are the standing character it carries
from that moment on. Like a birth certificate, it's *issued once* — later weeks may visit
(annual stars), but the natal chart doesn't change unless the building is substantially rebuilt.

## How we compute it in code
`src/flying_stars.py`, backed by `data/reference/twenty_four_mountains.json` and checked against
`data/reference/flying_star_charts.json`:
- `flying_stars.period_of(year)` → the period (1–9) for a construction year.
- `flying_stars.natal_chart(period, facing_degrees)` → `{direction: [mountain, base, facing]}`
  for all nine palaces.
- `flying_stars.AmbiguousFacing` → raised (not caught!) when the facing is on a boundary.
- `viz.plot_flying_star_chart(chart, title)` → draws the grid, South up.

## Talk it through
- With a practitioner: "Which year do you use for a building that was gutted and renovated —
  original construction or the renovation? And how does your lineage fly the 5 star?"
- For yourself: take a published Period-8 chart from any Flying Stars book and trace the base
  layer by hand along the flight path (Center → NW → W → NE → S → N → SW → E → SE). If your
  hand-trace matches the book, you understand the heart of the algorithm before writing a line.

➡️ Next: [[Module-Guide|Week 4's Module Guide]].
