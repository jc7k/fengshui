# Week 2 — Elements & Bagua

**Time estimate:** 5–8 hours (a guideline, not a deadline — go at your pace).
**Notebook:** `notebooks/Week_2_Elements_and_Bagua.ipynb`

## Objective
Build the **Five Elements (Wu Xing) engine** — the two cycles that connect Wood, Fire, Earth,
Metal, and Water — and then use it to upgrade Week 1's naive tips into **element-aware tips**
that name the *relationship* behind each flag. Week 1 said "a bathroom drains this area."
Week 2 says *why*: "bath (Water) feeds the Career area (Water) — reinforcing." Same machine,
first real school.

## Why the elements come first (the five roommates)
Think of the five elements as **five roommates sharing a house**. Each one helps a specific
housemate (Wood feeds Fire, Fire's ash feeds Earth…) and clashes with another (Water quenches
Fire, Metal cuts Wood…). Once you know who helps whom and who clashes with whom, any pairing of
two roommates — or two elements — explains itself. Every feng shui school you'll add later
speaks this vocabulary, so we build it now and check it carefully.

## Before you code — read these primers
- [[../01-Feng-Shui-Fundamentals/The-Five-Elements-and-Cycles|The Five Elements & Cycles]] — the
  two cycles you're about to code.
- [[../01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]] — a
  refresher, because each life area carries an element too.

## Steps
1. **Open the notebook in Colab** (see [[../../GETTING_STARTED|GETTING_STARTED]]). Run the bootstrap
   cell to pull in the helper code and sample homes.
2. **Print the two cycles.** Loop over `elements.ELEMENTS` and print what each element
   `elements.generates(e)` and `elements.controls(e)`. Say each line out loud — they should sound
   like the primer ("wood burns to make fire…").
3. **✅ Check the engine against the reference table.** This is our "accuracy": assert that
   `elements.generates` and `elements.controls` reproduce the canonical cycles in
   `data/reference/wu_xing.json`, exactly. Both lines must print ✅.
4. **Ask about a pairing** with `elements.relationship(a, b)` — it answers one of `same` /
   `generates` / `generated_by` / `controls` / `controlled_by`, and
   `elements.RELATIONSHIP_GLOSS` turns that into plain language.
5. **Print the element-aware tips.** ← *You write this cell yourself* — call
   `analyzer.element_tips(home)` and print each `tip['note']` on its own line. Every tip now
   names the relationship between the room's element and its area's element.
6. **Compare Week 1 vs Week 2** on the same home — naive tips and element tips side by side.
   Notice what the upgrade actually changed.
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] The generating & controlling cycles print, one line per element
- [ ] The ✅ check passes: both cycles assert-match `data/reference/wu_xing.json`
- [ ] `elements.relationship` explains a few pairings in plain language
- [ ] The element-aware tips print, and every tip names a relationship (your cell)
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
The room-to-element table in `analyzer.py` is a **simplification** — a room gets one element from
its *name*, while real practice weighs a room's use, shape, and contents. So the Week 2 tips are
more *explanatory* than Week 1's, not more *proven*. That's still real progress: a tip you can
argue with beats a tip you can only accept. **Do not fix the table this week.**

## What's next
Week 3 makes the analyzer personal — Eight Mansions computes *your* Kua number so the same home
reads differently for different people. ➡️ [[../04-Week-3-Eight-Mansions/Module-Guide|Week 3]]
