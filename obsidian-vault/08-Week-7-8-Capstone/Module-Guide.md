# Weeks 7–8 — The Capstone: an honest home report

**Time estimate:** 12–18 hours (a guideline, not a deadline — go at your pace).
**Notebook:** `notebooks/Week_7-8_Capstone.ipynb`

## Objective
Bring **every school you've built** — the Five Elements, Eight Mansions, Flying Stars, Form
School, and both bagua overlays — together into **one report** for a real home and its people.
The centerpiece is not a verdict. It's a **conflict table** that lays the schools' answers side
by side and marks where they disagree. This is the tool you've been building toward since Week 1.

## Why this is the whole point
A lesser tool would run all the schools and then average them, or pick a favorite, and hand you
a single confident answer. That would be dishonest — the schools measure *different things* and
genuinely conflict. Your capstone respects the learner (you) enough to show all of it and let a
human decide. That honesty *is* the sophistication.

## Before you code — read these
- [[../01-Feng-Shui-Fundamentals/Schools-Overview|Schools Overview]] — re-read it now that you've
  built all four schools; it will read completely differently.
- [[../01-Feng-Shui-Fundamentals/A-Note-on-Honesty|A Note on Honesty]] — the conflict table is
  this note made concrete.

## Steps
1. **Describe the people** — a list of occupants with `name`, `year`, `gender` (optionally
   `month`/`day` for the Li Chun boundary).
2. **Run the full report** with `report.full_report(home, occupants)`.
3. **Read the sections**: occupants' Kua numbers, the Flying Stars period (or the honest
   "ambiguous — re-measure"), and the Form School findings.
4. **Build the conflict table.** ← *You write this cell yourself* — walk `rep['conflict_table']`
   and print each sector's compass area, BTB area, and a DISAGREE flag.
5. **Verify** the report is complete and honest (the ✅ checks).
6. **Run it on a second home** (`north_house`) and see the conflicts change.
7. **Reflect** in [[Lab-Notes]] and [[Reflection]].

## Definition of Done (you can tick every box)
- [ ] `report.full_report` returns sections for all four schools
- [ ] The conflict table prints all 9 sectors with DISAGREE flags
- [ ] At least one genuine school conflict is surfaced (not hidden)
- [ ] The report carries its honesty disclaimer
- [ ] It runs on a second home with different results
- [ ] Notebook runs top-to-bottom on a fresh Colab runtime
- [ ] [[Lab-Notes]] and [[Reflection]] filled in

## Honesty check
If your conflict table is empty, something is wrong — the schools *should* disagree. And notice:
the report never tells the occupants what to do. It shows them what each tradition says and trusts
them. Resist the urge to add a "final score." A single number would be the one dishonest thing in
an otherwise honest tool.

## What's next
You've built a real, multi-school, honest Home Analyzer. The **Bonus** (a Ba Zi calendar taster)
is optional and best done with Jeff. ➡️ [[../09-Bonus-BaZi/Module-Guide|Bonus]]
