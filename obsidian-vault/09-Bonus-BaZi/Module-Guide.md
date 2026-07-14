# Bonus — a Ba Zi taster (optional, with Jeff)

**Time estimate:** 2–4 hours (optional — do it if it's fun).
**Notebook:** `notebooks/Bonus_BaZi.ipynb`

## Objective
A small taste of **Ba Zi** (八字, "the Four Pillars") — Chinese astrology's way of reading a birth
moment as pairs of **Heavenly Stems** and **Earthly Branches**. You'll build just the **year
pillar**, which connects the birth-year work from Week 3 to the great **60-year (sexagenary)
cycle**. This is deliberately tiny: a taste, not a reading.

## Why it's a bonus (and why it's small)
Full Ba Zi uses four pillars — year, month, day, and hour — and the day pillar in particular needs
a real calendar of Chinese solar terms. That's a whole system, closer to astrology than to home
feng shui. So we do the one pillar that's honestly computable from a year, and we stop there. Doing
*less*, correctly, is the point.

## Before you code
- Read the primer: [[Four-Pillars-Ba-Zi|The Four Pillars (Ba Zi)]] — the sexagenary cycle, the
  stems and branches, and a year pillar worked by hand.
- You already have everything you need from [[../04-Week-3-Eight-Mansions/Module-Guide|Week 3]]
  (birth year, the Li Chun ~Feb-4 boundary, the Five Elements).

## Steps
1. **Compute a year pillar** with `bazi.year_pillar(year)` — a Heavenly Stem + Earthly Branch,
   plus its element, polarity, and zodiac animal.
2. **Verify the anchor**: 1984 was the start of a 60-year cycle (Jia-Zi, the Wood Rat).
3. **Your own pillar.** ← *You write this cell yourself* — put in your birth year (add month/day
   for the Feb-4 boundary) and read your year pillar.

## Definition of Done (you can tick every box)
- [ ] `bazi.year_pillar` returns a stem, branch, element, polarity, and animal
- [ ] The 1984 = Jia-Zi anchor check passes (the ✅ check)
- [ ] Your own year pillar prints
- [ ] Notebook runs top-to-bottom
- [ ] [[Lab-Notes]] and [[Reflection]] filled in (short is fine for the bonus)

## Honesty check
This is one pillar of four. It cannot tell you anything a real Ba Zi practitioner would recognize
as a reading — it's a doorway, not a room. That's exactly why it's optional and labeled a "taster."

## What's next
This is the end of the built curriculum. Where you take the Home Analyzer next is up to you — a new
school, your own real floor plan, a web UI. Talk it over with Jeff.
