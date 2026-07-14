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

## Where Ba Zhai comes from
The school's roots are usually traced to the **Tang dynasty** (618–907), and its canonical text
is the **Ba Zhai Ming Jing** (八宅明鏡, "Bright Mirror of the Eight Mansions"). Honestly,
though: the book is traditionally *attributed* to the Tang master **Yang Yunsong** (楊筠松), but
the text we have was compiled by a Qing-dynasty editor writing as **Ruoguan Daoren** (箬冠道人),
best-known edition printed **1790**. Sources genuinely disagree — some credit Yang outright,
some treat his name as borrowed authority on a much later book. "A Qing-era text carrying a
Tang master's name" is the defensible claim.

The East/West split isn't arbitrary, either: the two groups fall straight out of the trigram
families of the **Later Heaven** bagua arrangement — a term we won't unpack until
[[../07-Week-6-BTB-Contrast/BTB-and-Compass-Bagua|Week 6's note]].

One scope note. Classical Ba Zhai is *two-sided*: it also assigns the **house** a trigram — a
**house-gua**, from the building's **sitting direction** — and matches person to house
(East-group people belong in East-group houses). Our code implements the **person side only**;
the house side needs rules we haven't earned yet, and half a school done honestly beats all of
it done vaguely.

## The eight qualities, in Chinese
The names in our code and reference table are romanized; here is what they actually say. The
vividness is the mnemonic — nobody forgets which direction the "five ghosts" live in.

| In code & data | 漢字 | Pinyin | Literally |
| --- | --- | --- | --- |
| Sheng Qi | 生氣 | shēng qì | "growing breath" |
| Tian Yi | 天醫 | tiān yī | "heavenly doctor" |
| Yan Nian | 延年 | yán nián | "extended years" |
| Fu Wei | 伏位 | fú wèi | "hidden position" |
| Huo Hai | 禍害 | huò hài | "mishap & harm" |
| Wu Gui | 五鬼 | wǔ guǐ | "five ghosts" |
| Liu Sha | 六煞 | liù shà | "six killings" |
| Jue Ming | 絕命 | jué mìng | "severed fate" |

## Two Kua, worked by hand
Two births that between them exercise every wrinkle in the formula.

**Female, born 1996.** Reduce the last two digits: 9 + 6 = 15 → 1 + 5 = **6**. Female before
2000 means *d* + 5: 6 + 5 = 11 → 1 + 1 = **2**. **Kua 2 — West group.**

**Male, born 2004.** Reduce: 0 + 4 = **4**. Male from 2000 on means 9 − *d*: 9 − 4 = **5**. But
Kua 5 is never used — for a man it substitutes to **2**. **Kua 2 — West group.**

The first walks the pre-2000 branch; the second walks the post-2000 branch *and* trips the Kua-5
substitution. Now read the payoff from `data/reference/kua_table.json`: in Kua 2's row, **Sheng
Qi is Northeast**. Two people born twenty-eight years apart, by different arithmetic paths,
share the same prize direction — the table doing its job.

⚠️ Two things `kua_number` will *refuse* to do, on purpose. It accepts solar years **1900–2099**
only (the century constants — 10/5 before 2000, 9/6 after — are specific to those two
centuries), and a **February birth given without a day is refused**, not guessed, because the
~Feb-4 boundary falls mid-month. Both errors are the code being honest, not broken.

## In practice today
Practitioners triage by hours of exposure: **bed > desk > stove**. You spend a third of your
life aligned with the bed, so it gets first claim; the desk comes second; the stove's facing,
tied to the household's food and health, third.

Couples in different groups are the classic hard case, with two working conventions. The
traditional one: shared fixtures — the main door, and usually the bed — follow the
**breadwinner's Kua**. The gentler modern one: optimize per sleeper, giving each person their
own **head direction** where the room allows — accepting that one shared bed can't favor both,
so someone compromises, and the practitioner says so out loud.

And when a good direction is architecturally impossible, the answer is the **best available
direction**: if the bed can't face Sheng Qi, take Tian Yi or Yan Nian, and above all keep it out
of Jue Ming. Real practice is triage, not perfection — the best-to-gentlest ranking exists
precisely so you know what to give up first.

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
