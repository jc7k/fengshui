# The Four Pillars (Ba Zi)

> Read this before [[Module-Guide|the Bonus]] — and like the Bonus itself, it's optional. If
> Week 3's birth-year arithmetic left you curious about what that year *means*, this is the story.

## Why it matters
Back in [[../04-Week-3-Eight-Mansions/Eight-Mansions-Ba-Zhai|Week 3]], your birth year went into a
formula and came out as a single digit — the Kua. Useful, but it treated the year as a mere number.
**Ba Zi** (八字, "eight characters") is what that year means inside the full calendar system
underneath: every year has a *name*, a pair of characters drawn from two ancient counting wheels.
Read all four pairs — year, month, day, hour — and you have the eight characters of a birth chart.
We build only the year pair, but even that one pair connects your Week 3 work to a calendar older
than feng shui itself.

## A calendar older than feng shui
The two wheels are the **10 Heavenly Stems** (天干) and the **12 Earthly Branches** (地支),
combined into the **sexagenary cycle** (干支 gānzhī). This is genuinely ancient: the earliest
oracle bones of the Shang dynasty — divination records from around the **13th century BCE** —
already date themselves with stem-branch pairs. And here's the surprise: they were counting
**days**, not years. A 60-*day* cycle ran through Shang timekeeping more than a thousand years
before anyone used it to name years; it may be the longest continuously running dating system in
the world.

A lovely arithmetic aside for a budding programmer: 10 stems × 12 branches suggests 120 pairs, but
the cycle has only **60**. Both wheels advance together, one tick per step — so a yang stem only
ever lands on a yang branch, and half the combinations never occur. The cycle repeats after
**lcm(10, 12) = 60** steps. When you meet modular arithmetic in the code below, you're meeting the
same math the Shang diviners were doing by hand.

Year-counting came much later — the earliest surviving documents using ganzhi for *years* date to
the second century BCE (already the early Han), and the practice was standard by the
Eastern **Han dynasty**. The
fortune-telling superstructure is later still: in the **Tang dynasty**, the scholar-official **Li
Xuzhong** (李虛中, c. 761–813) is credited with reading fate from three pillars (year, month,
day); in the **Song**, **Xu Ziping** (徐子平) is said to have added the **hour pillar** and
reorganized the whole method — which is why classical Ba Zi is still called the **Ziping method**
(子平) today. One honest hedge: Li Xuzhong is a documented historical figure, but Xu Ziping's
dates are hazy — tradition places him as a sage of the Five Dynasties–to–Northern-Song transition,
and his teachings were compiled by later hands into the *Yuanhai Ziping* (淵海子平). The
attribution is traditional, not archival.

## Stems, branches, animals
Here are the two wheels — and they mirror `STEMS` and `BRANCHES` in `src/bazi.py` exactly.

The **10 Heavenly Stems**, each carrying one of the Five Elements (from
[[../01-Feng-Shui-Fundamentals/The-Five-Elements-and-Cycles|the Fundamentals]]) and a polarity:

| # | 漢字 | Pinyin | Element | Polarity |
|---|------|--------|---------|----------|
| 0 | 甲 | jiǎ | Wood | yang |
| 1 | 乙 | yǐ | Wood | yin |
| 2 | 丙 | bǐng | Fire | yang |
| 3 | 丁 | dīng | Fire | yin |
| 4 | 戊 | wù | Earth | yang |
| 5 | 己 | jǐ | Earth | yin |
| 6 | 庚 | gēng | Metal | yang |
| 7 | 辛 | xīn | Metal | yin |
| 8 | 壬 | rén | Water | yang |
| 9 | 癸 | guǐ | Water | yin |

The **12 Earthly Branches**, each paired with its 生肖 (shēngxiào) zodiac animal:

| # | 漢字 | Pinyin | Animal |
|---|------|--------|--------|
| 0 | 子 | zǐ | Rat |
| 1 | 丑 | chǒu | Ox |
| 2 | 寅 | yín | Tiger |
| 3 | 卯 | mǎo | Rabbit |
| 4 | 辰 | chén | Dragon |
| 5 | 巳 | sì | Snake |
| 6 | 午 | wǔ | Horse |
| 7 | 未 | wèi | Goat |
| 8 | 申 | shēn | Monkey |
| 9 | 酉 | yǒu | Rooster |
| 10 | 戌 | xū | Dog |
| 11 | 亥 | hài | Pig |

⚠️ An honesty note about the animals: "Year of the Dragon" is the pop-culture *surface* of the
branch system, not the system itself. The branches came first — the animals are memorable labels
attached to them. A Ba Zi practitioner works with 辰, not with dragons.

## Worked example: a year pillar by hand
The cycle is anchored so that the year **4 CE** was 甲子 (Jiǎ-Zǐ) — the pair that opens the cycle.
That gives two tiny formulas, the very ones in the code:

- **stem index** = (year − 4) mod 10
- **branch index** = (year − 4) mod 12

Run **2024** by hand: 2024 − 4 = 2020. Then 2020 mod 10 = **0** → 甲 Jiǎ, the yang-Wood stem. And
2020 mod 12 = **4** → 辰 Chén, the Dragon. So 2024 is **甲辰** — the **yang-Wood Dragon**. Now
verify the anchor the notebook asserts: 1984 − 4 = 1980, which is divisible by both 10 and 12, so
both indices are 0 → **甲子 Jiǎ-Zǐ**, the Wood Rat, the start of a fresh 60-year cycle. That's the
✅ check in `Bonus_BaZi.ipynb`.

One boundary you already know: the ganzhi year begins at **Li Chun** (~February 4th), exactly as
in Week 3. `bazi.year_pillar` reuses the same `solar_year` logic — a January birth belongs to the
previous year, and a February birth without a day is *refused* rather than guessed, same as the
Kua code.

## Ba Zi in the wild
What do practitioners actually do with this? Full four-pillar charts are used to **name babies**
(choosing characters whose elements balance the chart), to **pick wedding and moving dates**, and
to read **compatibility** between partners. The bridge back to our subject is the **useful god**
(用神 yòng shén) — the element a chart is judged to need most, which a practitioner may then
supply through feng shui remedies: more Water in the home for a chart thirsty for Water.

The honest line, and the [[Module-Guide|Module Guide]] says it too: this is **astrology**, not
home feng shui, and our single pillar of four cannot support anything a practitioner would call a
reading. It's a doorway, not a room.

## Words you'll meet

| 漢字 | Pinyin | Literal |
|------|--------|---------|
| 八字 | bā zì | "eight characters" |
| 四柱 | sì zhù | "four pillars" |
| 天干 | tiān gān | "heavenly stems" |
| 地支 | dì zhī | "earthly branches" |
| 甲子 | jiǎ zǐ | the cycle's first stem-branch pair |
| 生肖 | shēngxiào | "birth likeness" (the zodiac animals) |

## The metaphor 🏠
Picture one clock with **two interlocking gears**: a small one with 10 teeth (the stems) and a
larger one with 12 (the branches). Every year, both gears turn by one tooth. The pair of teeth
touching right now is the year's name. Because the gears never skip, they only re-align — small
gear at tooth 甲, large gear at tooth 子 — once every 60 turns. Your birth year is simply where
the gears stood when you arrived; 1984 was the last time they clicked back to the start.

## How we compute it in code
`src/bazi.py`, deliberately tiny:
- `bazi.year_pillar(year, month=None, day=None)` → `{stem, branch, element, polarity, animal}`,
  using `STEMS[(y − 4) % 10]` and `BRANCHES[(y − 4) % 12]` — the year-4-CE Jia-Zi anchor.
- The Li Chun boundary comes free from `eight_mansions.solar_year` — one boundary rule, written
  once, shared by two schools.
- The notebook's anchor check: `year_pillar(1984)` must return stem `Jia`, branch `Zi`.

## Talk it through
- With a practitioner: "When you read a chart, how do you choose the useful god — and how often
  would two masters choose differently for the same chart?"
- For yourself: take a family member's birth year and compute their pillar **by hand** with the
  two mod formulas and the tables above. Then check yourself with `bazi.year_pillar`. If you hit
  a January or early-February birthday, notice *why* the code wants the month and day.

➡️ Next: [[Module-Guide|the Bonus Module Guide]] — and this one's meant to be talked over with Jeff.
