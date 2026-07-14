# The Eight Trigrams & Bagua

> Read this before [[../02-Week-1-Whole-Game/Module-Guide|Week 1]] (you'll use the life areas) and
> again before [[../03-Week-2-Elements-and-Bagua/Module-Guide|Week 2]] (the elements).

## Why it matters
The **bagua** (八卦, "eight symbols") is feng shui's master map. It divides any space into
**nine areas** — eight around the edge plus the center — and assigns each one a **life theme**,
an **element**, a **direction**, and a **trigram** (a three-line symbol from the I Ching). When
a feng shui book says "your wealth corner" or "the relationship area," it's naming a bagua sector.

The nine life areas:

| Trigram | Direction | Element | Life area |
|---|---|---|---|
| Li | South | Fire | Fame / Reputation |
| Kun | Southwest | Earth | Relationships / Love |
| Dui | West | Metal | Children / Creativity |
| Qian | Northwest | Metal | Helpful People / Travel |
| Kan | North | Water | Career / Path |
| Gen | Northeast | Earth | Knowledge / Study |
| Zhen | East | Wood | Family / Health |
| Xun | Southeast | Wood | Wealth / Abundance |
| *(center)* | Center | Earth | Health / Unity |

A trigram's three lines are yang (solid) or yin (broken); e.g. Qian is ☰ (three solid = pure
yang), Kun is ☷ (three broken = pure yin). You don't need to memorize them — but it's lovely
that the whole system is built from binary.

## The big fork: how do you place the map?
Every school agrees on the nine areas. They **disagree on how to lay the map onto a real home**:
- **Compass schools** anchor each area to its true compass direction (South = Fame, always).
- **BTB** ignores the compass and anchors the map to the **front-door wall**.

That single choice is why two feng shui consultants can call the same room by two different
names. You'll build *both* overlays and compare them in Week 6.

## How we compute it in code
`src/bagua.py` loads the table from `data/reference/bagua.json` and gives you:
- `bagua.compass_overlay()` → a 3×3 grid of life areas by direction.
- `bagua.btb_overlay(door_wall)` → a 3×3 grid by the front-door wall.
- `bagua.LIFE_AREA_ELEMENT` → the element that governs each area (used in Week 2).

## Talk it through
- With a practitioner: "Do you use the compass bagua, the door-aligned bagua, or both? Why?"
- For yourself: stand in your front doorway. Using the BTB rule (door wall = Knowledge / Career
  / Helpful People), which room is your "wealth" area? Now guess its true compass direction —
  will the compass school agree?

➡️ Next: [[The-Luopan-and-24-Mountains|The Luopan & 24 Mountains]].

➡️ See also: where this arrangement comes from — Early vs Later Heaven — is told in [[../07-Week-6-BTB-Contrast/BTB-and-Compass-Bagua|BTB & the Compass Bagua]].
