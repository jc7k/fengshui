# Eight Mansions (Ba Zhai)

> Read this before the Week 3 notebook. It's the first school where the answer depends on *you*.

## Why it matters
**Eight Mansions** (八宅, Ba Zhai) is the classical school of *personal* directions. From your
birth year and gender it computes your **Kua number** (also called Ming Gua, "life trigram"),
1–9. That single digit sorts you into one of two teams — the **East group** (Kua 1, 3, 4, 9) or
the **West group** (Kua 2, 6, 7, 8) — and assigns a quality to each of the eight compass
directions: **four auspicious, four inauspicious**. East-group people share the same four good
directions (broadly the east-side ones); West-group people share the other four. Practitioners
use these to orient the things you spend hours aligned with: a bed, a desk, a stove.

The four auspicious qualities, best to gentlest:
- **Sheng Qi** — growth, vitality, wealth. The prize direction.
- **Tian Yi** — the "heavenly doctor": health.
- **Yan Nian** — longevity and relationships.
- **Fu Wei** — stability, clarity; the mildest good.

And the four inauspicious, mildest to worst:
- **Huo Hai** — mishaps, small setbacks.
- **Wu Gui** — "Five Ghosts": conflict, betrayal.
- **Liu Sha** — "Six Killings": accumulated harm.
- **Jue Ming** — "Total Loss": the worst; the direction to keep your bed *away* from.

The Kua formula itself is short: reduce the year's last two digits to one digit *d*, then —
male born before 2000: `10 − d`; female before 2000: `d + 5`; male 2000 on: `9 − d`; female
2000 on: `d + 6`; reduce again if needed. Kua **5 is never used** — it substitutes to 2 for men
and 8 for women. Two honest wrinkles: the formula **changed at the year 2000**, and the feng
shui year begins near **Feb 4 (Li Chun)**, not Jan 1 — so a January birth belongs to the
*previous* year, and Feb 4 is itself approximate enough that early-February births are a genuine
gray zone. This is exactly why online Kua calculators disagree with each other.

## The metaphor 🏠
Your Kua is like a **theater ticket with a seat assignment**. Everyone's in the same theater —
the same eight directions, the same house — but your ticket says which seats give you the best
view and which put you behind a pillar. Two people in the same living room hold different
tickets: the corner that's front-row for an East-group person can be the obstructed seat (Jue
Ming) for a West-group one. Eight Mansions doesn't rearrange the theater; it tells you where
*you* should sit in it.

## How we compute it in code
`src/eight_mansions.py`, backed by `data/reference/kua_table.json`:
- `eight_mansions.kua_number(year, gender, month=None, day=None)` → Kua 1–9. Gender is required
  (the formula differs); pass month/day to apply the ~Feb-4 boundary.
- `eight_mansions.group(kua)` → `'East'` or `'West'`.
- `eight_mansions.good_directions(kua)` / `bad_directions(kua)` → `{direction: quality}`, four
  entries each.
- `eight_mansions.direction_quality(kua, direction)` → the quality name for one direction.
- `eight_mansions.is_auspicious(kua, direction)` → the yes/no verdict.

The Week 3 notebook asserts `kua_number` against every published example in the reference table —
when this code and a website disagree, the table is the tiebreaker.

## Talk it through
- With a practitioner: "When a couple shares a bed and one is East group, one West, whose Kua
  wins the bed direction — and how do you actually resolve it in a real bedroom?"
- For yourself: compute your Kua by hand with the formula above, then try two online
  calculators. If they disagree with you (or each other), can you tell *which* rule they're
  missing — the post-2000 change or the Li Chun boundary?

➡️ Next: [[Module-Guide|Week 3's Module Guide]].
