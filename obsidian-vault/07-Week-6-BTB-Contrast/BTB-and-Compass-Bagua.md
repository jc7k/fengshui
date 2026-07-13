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

## Talk it through
- With a practitioner: "You know BTB was created in the 1970s — does its age change how much you
  trust it? Should it?"
- For yourself: your front door is on some wall. Under BTB, Fame sits on the wall opposite it.
  Is that wall actually south? If not, you live in one of this week's conflict sectors — which
  label do you *feel* is yours, and why?

➡️ Next: [[Module-Guide|Week 6's Module Guide]].
