# BTB & the Compass Bagua

> Read this before [[Module-Guide|Week 6]]. It picks up the "big fork" from
> [[../01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]] and
> tells the story behind it.

## Why it matters
Week 6's entire deliverable is a diff between two maps. To read that diff honestly, you need to
know where each map comes from — because this isn't a case of one correct tradition and one
corruption. It's two coherent systems that answer "where is the Wealth area?" with different
rules.

## The Lin Yun lineage
**BTB** stands for **Black Hat Sect Tantric Buddhism** (also "Black Sect"). Despite the ancient-
sounding name, it is a **modern Western adaptation**, created by **Professor Thomas Lin Yun** in
the **1970s** as he taught in the United States. Lin Yun blended classical feng shui with
Tibetan Buddhist and folk elements — and made one radical simplification: **he dropped the
compass entirely.**

Why? Two reasons usually given:
- **Accessibility.** A Western audience without a luopan (or the years of training to use one)
  could apply BTB in any home in minutes: find the front door, lay the map. No degrees, no
  magnetic declination, no 24 mountains.
- **Intention over instrumentation.** BTB emphasizes the *mouth of chi* — the front door, where
  energy and people enter — and the practitioner's (and resident's) intention, rather than
  magnetic measurement. In BTB the door is not a proxy for a direction; it *is* the anchor.

## Two baguas older than both maps: Early vs Later Heaven
Behind both maps sits an older fork: the eight trigrams have been arranged in a circle **two
different ways** since antiquity.

The **Early Heaven bagua** (先天八卦, *xiāntiān bāguà*), traditionally credited to the mythical
sage **Fu Xi** (an origin story, not documented history), is the cosmos in its **ideal,
symmetric state** — every trigram faces its perfect complement, pure-yang Qian opposite pure-yin
Kun. Perfect balance, no motion. Today it survives mostly on the octagonal **bagua mirrors**
hung outside, over doorways, to deflect harsh chi — a protective emblem, not a floor-plan tool.

The **Later Heaven bagua** (後天八卦, *hòutiān bāguà*), traditionally credited to **King Wen of
Zhou** (same caveat), rearranges the trigrams to show the world **in motion** — and it is *the*
arrangement every compass method in this project uses, the whole reason Li / Fire / Fame sits in
the South. It's what `data/reference/bagua.json` stores, matching
[[../01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]]:

| Trigram | 漢字 | Later-Heaven direction | Life area |
|---|---|---|---|
| Li | 離 | South | Fame |
| Kun | 坤 | Southwest | Relationships |
| Dui | 兌 | West | Children |
| Qian | 乾 | Northwest | Helpful People |
| Kan | 坎 | North | Career |
| Gen | 艮 | Northeast | Knowledge |
| Zhen | 震 | East | Family |
| Xun | 巽 | Southeast | Wealth |

The quiet punchline for Week 6: **BTB keeps the Later Heaven ring too** — the same cyclic order
of areas, re-anchored to the door instead of the compass. The two maps disagree about *where*,
never about *what*.

## How the door-aligned ("three-door") bagua works
Stand outside your front door, facing in. Lay the bagua so the wall containing the door is the
bottom row of the map. That row is **always** Knowledge / Career / Helpful People — your door
falls into one of those three (hence "three-door bagua"). Career sits at the wall's center;
Fame lands on the far wall opposite the door; Wealth is the far-left corner, Relationships the
far-right. Rotate the whole home and the map rotates with it — the compass never enters.

The **compass schools** do the opposite: each life area is nailed to its true direction. South
is Fame, *always*, whichever wall your door is on.

🏠 **A metaphor:** two cartographers map the same coastline with different projections. On one
map north is up; on the other, "up" is wherever the harbor entrance is. Same land, different
grids — a lighthouse can sit in different grid squares on each map without either cartographer
lying. Your home is the coastline; the door is BTB's harbor.

## Worked example: one home, two maps, by hand
Front door on the **east** wall. Rotate the three-door grid until the Knowledge / Career /
Helpful People row lies along the east edge: in the project's north-up grid the door trio
becomes the **right-hand column** — Helpful People at the north end, Career in the middle,
Knowledge at the south end (exactly what `bagua.btb_overlay('east')` returns). Side by side,
both north-up:

```
Compass (always):                    BTB, east door:
Helpful People | Career | Knowledge  Relationships | Children | Helpful People
Children       | Health | Family     Fame          | Health   | Career
Relationships  | Fame   | Wealth     Wealth        | Family   | Knowledge
```

Cell against cell, **only the center (Health) agrees** — all eight edge sectors carry two labels
(compass-Northeast says Knowledge, BTB says Helpful People; compass-Southeast says Wealth, BTB
says Knowledge; and so on round the ring). You've just hand-produced what
`viz.plot_school_comparison(...)` draws. ⚠️ One curiosity worth verifying in a notebook: a
**north** door is the single case where the rotated BTB grid lands exactly on the compass grid
and the two schools agree completely.

## Words you'll meet

| Term | 漢字 | What it means |
|---|---|---|
| Early Heaven bagua | 先天八卦 | Fu Xi's symmetric ideal cosmos; the one on protective mirrors |
| Later Heaven bagua | 後天八卦 | King Wen's world in motion; the one compass methods use |
| "Three door" placement | 三門 | *sān mén* — the door always lands on Knowledge, Career, or Helpful People |
| Mouth of chi | 氣口 | *qì kǒu* — the front door, where chi enters |
| Lin Yun | 林雲 | Professor Thomas Lin Yun (1932–2010), creator of BTB |

## Why traditionalists object — and the honest reading
Compass-school practitioners point out that BTB is younger than television, that it discards the
directional physics (magnetic orientation, solar exposure) the classical schools spent centuries
systematizing, and that renaming a room's life area because you re-hung the door would strike a
Xuan Kong practitioner as absurd. BTB practitioners answer that feng shui has *always* adapted to
its culture and era, that a method people can actually use beats one they can't, and that the
door really is how chi — and everyone else — enters a home.

Both points deserve respect. The nine life areas are identical in both systems; only the
**placement** differs. So the same physical room often carries two different labels, and neither
map is "the real one" — they are different traditions. Week 6 makes that gap computable.

## How we compute it in code
`src/bagua.py` implements both placements over the same nine areas:
- `bagua.compass_overlay()` → a 3×3 grid of life-area names anchored to true directions
  (north-up, so row 0 is the north edge).
- `bagua.btb_overlay(door_wall)` → a 3×3 grid anchored to the front-door wall. Internally it
  takes the BTB reference grid (door row at the bottom) and rotates it in 90° turns until the
  Knowledge / Career / Helpful People row lands on the wall you pass in — get `door_wall` from
  `homes.find_feature(home, 'door')['wall']`.

Because both return the same 3×3 shape, you can lay them over one home with
`viz.plot_school_comparison(...)` and diff them sector by sector — which is exactly Week 6's lab.

## A BTB consultation vs a classical one (practice)
The difference isn't only where the map sits — it's what a visit feels like. A classical
consultant arrives with a **luopan**, measures the facing to the degree, and prescribes
placements like a surveyor. A BTB consultation is led by **intention**: alongside "mundane"
advice comes the tradition of **transcendental cures** — blessings, visualizations, symbolic
adjustments whose stated mechanism is spiritual, not directional. When one is shared, tradition
asks the client for a **red envelope** (紅包, *hóngbāo*) — often nine — containing money: not
payment but respect, honoring sacred information and marking the exchange. To a classical eye
that can look unfalsifiable; to a BTB eye, a luopan reading without intention is just geometry.
Here too, both sides deserve respect — and neither appears in a diff of two grids; the code
captures only the *placement* disagreement, not the cultures around it.

## Talk it through
- With a practitioner: "You know BTB was created in the 1970s — does its age change how much you
  trust it? Should it?"
- For yourself: your front door is on some wall. Under BTB, Fame sits on the wall opposite it.
  Is that wall actually south? If not, you live in one of this week's conflict sectors — which
  label do you *feel* is yours, and why?

➡️ Next: [[Module-Guide|Week 6's Module Guide]].
