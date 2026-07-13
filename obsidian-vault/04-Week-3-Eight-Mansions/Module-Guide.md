# Week 3 — Eight Mansions (Ba Zhai)

**Time estimate:** 5–8 hours (a guideline, not a deadline — go at your pace).
**Notebook:** `notebooks/Week_3_Eight_Mansions.ipynb`

## Objective
Make the analyzer care about the **person**, not just the building. You'll compute a Kua (Ming
Gua) number from a birth year and gender, sort that person into the **East or West group**, list
their **four auspicious and four inauspicious directions**, and then answer a genuinely useful
question: *is this bed facing a good direction for this person?*

## Why this week matters
Weeks 1–2 analyzed the home as if nobody lived in it. Eight Mansions is the first school where
two people can stand in the same room and get **different** answers — the direction that feeds
one person's growth is another person's Total Loss. That's the shift from "analyzing a floor
plan" to "analyzing a home *for someone*."

## Before you code — read these primers
- [[../01-Feng-Shui-Fundamentals/The-Luopan-and-24-Mountains|The Luopan & 24 Mountains]] — the
  compass work this week depends on it.
- [[Eight-Mansions-Ba-Zhai|Eight Mansions primer]] — the Kua concept, the groups, and the eight
  qualities you're about to compute.

## Steps
1. **Open the notebook in Colab** (see [[../../GETTING_STARTED|GETTING_STARTED]]). Run the
   bootstrap cell.
2. **Compute a few Kua numbers** with `em.kua_number(year, gender)` and print each with its
   group via `em.group(kua)`. Notice the 2010 example — the formula changed at year 2000.
3. **Run the ✅ check** — the notebook asserts `kua_number` against *every* published example in
   `data/reference/kua_table.json`. All green or nothing.
4. **Print the four good and four bad directions** for a Kua with `em.good_directions(kua)` and
   `em.bad_directions(kua)` — each returns `{direction: quality}`.
5. **Check the bed.** ← *You write this cell yourself* — find the bed's `facing` degrees, snap
   it to a direction with `compass.direction_of`, then ask `em.direction_quality(kua, bed_dir)`
   and `em.is_auspicious(kua, bed_dir)` for the verdict.
6. **Demonstrate the Li Chun boundary** — call `em.kua_number(1990, 'male', 1, 15)` and watch a
   January birth count as the *previous* year.
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] `kua_number` matches every published example in the reference table (the ✅ check passes)
- [ ] The four good and four bad directions print, with their quality names
- [ ] The bed-direction check works and prints a verdict (your cell)
- [ ] The Li Chun boundary is demonstrated — a January birth returns the previous year's Kua
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
Try three online Kua calculators with the same birth date and you may get **different answers**.
That's not (necessarily) a bug — the traditional formula **changed at the year 2000**, and sites
that never updated give wrong answers for anyone born after it. And the feng shui year starts
around **Feb 4 (Li Chun), not Jan 1**, so January births belong to the previous year — a rule
many calculators skip. Feb 4 is itself approximate, so an early-February birth is a genuine gray
zone. Our code takes a position on both and *says so*; that's the whole honesty policy in one
function.

## What's next
Week 4 adds the **building's** birthday — when it was built and which way it faces determine its
Flying Stars chart. Person + building, together at last.
➡️ [[../05-Week-4-Flying-Stars/Module-Guide|Week 4]]
