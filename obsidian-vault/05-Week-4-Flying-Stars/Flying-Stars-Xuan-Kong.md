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
Period 8. ⚠️ One honesty note here: `period_of` takes a bare year and doesn't ask for the month —
for a building finished before ~Feb 4, apply the adjustment yourself and pass the previous year.

## Where Xuan Kong comes from (history)
The 20-year periods are one gear of a larger clock called **San Yuan** (三元, "Three Cycles"): a
**180-year grand cycle** of three 60-year cycles — Upper, Middle, Lower — each holding three
periods, nine in all. The current grand cycle runs 1864–2043, which is why our code's period
table starts at 1864.

For most of its history this was guarded knowledge. **Jiang Dahong** (蔣大鴻, usually given as
1616–1714, though his dates are disputed), the late-Ming/early-Qing master credited with reviving
Xuan Kong, is said to have accepted only a handful of disciples and wrote his *Di Li Bian Zheng*
(地理辨正) in deliberately veiled language. The secrecy held for two centuries, until **Shen
Zhureng** (沈竹礽, 1849–1906 by most accounts; at least one source says 1824) reconstructed the
method, partly from the case notes of Zhang Zhongshan's lineage. His book, *Shen Shi Xuan Kong
Xue* (沈氏玄空學), was unfinished at his death; his son and students completed it and published
it in 1927. That publication is, roughly, why a hobbyist with a laptop can learn this at all.

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

## A second hand-trace: flying a layer in reverse (worked example)
The "Talk it through" trace below covers forward flight; reverse deserves one too. Take the
bundled **Period 8, facing Wu (S2)** chart. The base layer puts 8 in the center and flies forward,
so the base star landing in the facing palace (**South**) is **3**. That 3 moves to the center of
the **facing layer** — and the polarity lookup for it comes back *yin*, so this layer flies
**reverse**: decrement at each stop, **1 wraps to 9**. Walk the path:

Center **3** → NW **2** → W **1** → NE **9** (the wrap!) → S **8** → N **7** → SW **6** → E **5** → SE **4**

Now compare with `data/reference/flying_star_charts.json`, chart `P8-S2` — the *third* number in
each palace's `[mountain, base, facing]` triple. ✅ Every cell matches, and that file is the
answer key the notebook asserts against: if your hand-trace agrees with it, you've verified the
code by hand.

## Timely and untimely stars (theory + practice)
The numbers 1–9 aren't good or bad on their own — they're read against the **current period**. In
Period 9 (2024–2043): **9** is the **prosperous star** (旺 *wàng*), the timely one — where the
facing-star 9 lands is this era's wealth spot; **1** is the **growing star** (生 *shēng*), next in
line and getting better; **8** is the **retreating star** (退 *tuì*), just dethroned — mild, but
past its glory. One number is treated as an **affliction wherever it lands**: the **5 Yellow**
(五黃 *wǔ huáng*), blamed for accidents and loss — classical advice is to keep its sector *quiet*.

There's also a layer this course does **not** compute: **annual visiting stars** and the yearly
afflictions — **Tai Sui** (太歲, the Grand Duke, seated in the year's zodiac sector), **Sui Po**
(歲破, the Year Breaker, directly opposite), and **San Sha** (三煞, the Three Killings, a 90°
band). [[../99-Resources/Deep-Research-Study-Guide|The deep-research study guide]] covers them.
⚠️ Our code computes **natal charts only** — no annual overlays. "This year's 5 Yellow" is the
annual layer, not anything `natal_chart()` outputs.

In practice, a Period-9 practitioner tells a client roughly this: **activate the sectors holding
facing (water) stars 9 and 1** — use those rooms, keep them bright and busy — and **keep the 5
Yellow's palace undisturbed**. One live controversy: some lineages hold a gut renovation re-births
a house into the current period; others count only the construction year. Ask two masters, get
three answers.

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

## Words you'll meet
| 漢字 | Pinyin | Literal |
| --- | --- | --- |
| 玄空飛星 | xuán kōng fēi xīng | "mysterious void flying stars" |
| 元運 | yuán yùn | period / cycle (the 20-year "yun") |
| 山星 | shān xīng | mountain star |
| 向星 | xiàng xīng | facing star |
| 洛書 | luò shū | "Luo River writing" — the magic square |
| 旺 / 生 / 退 | wàng / shēng / tuì | prosperous / growing / retreating |
| 太歲 | tài suì | Grand Duke — Jupiter's counter-star |
| 五黃 | wǔ huáng | Five Yellow — the affliction star |

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
