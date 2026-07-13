# Sample-Home Notes

This project has no downloaded dataset. The "data" is a handful of hand-authored floor plans in
`data/homes/` plus the reference tables in `data/reference/`. Every notebook loads these; the code
is *checked* against the reference tables (run `python scripts/checks.py`). That check is this
project's version of "accuracy": does the code reproduce the published charts and tables?

## The floor-plan schema
Each home is a JSON file:
- `name` — short id.
- `facing_degrees` — the compass bearing the front of the home faces (0 = North, 90 = East, …).
- `construction_year` — used by Flying Stars to pick the 20-year period.
- `grid` — rows of room labels. **Row 0 is the north edge, the last row is south; column 0 is west,
  the last column is east.** A `null` cell means "not part of the home" (a missing corner).
- `features` — a list of `{type, cell: [row, col], …}` for `door` (with a `wall`), `bed`, `desk`,
  `stove` (bed/desk carry a `facing` in degrees).

## The four homes, and why each exists
- **`sunny_studio`** — a clean 3×3 square with an unambiguous south facing (178°). The easy case;
  the Week 1 "whole game" home. Its bed sits in the door's column (a teachable non-command position);
  its desk is in command.
- **`courtyard_L`** — an L-shaped flat with a `null` northeast cell. Exists to make
  `floorplan.missing_corners()` find a real missing sector (Northeast) in Week 5.
- **`edge_case_flat`** — faces **172.4°**, one-tenth of a degree from the 172.5° boundary between the
  Bing (S1) and Wu (S2) mountains. Exists so Flying Stars **refuses** it (`AmbiguousFacing`) in
  Week 4 — the honest "re-measure" path.
- **`north_house`** — a larger 4×3 north-facing family house (2°, deep in Zi/N2). The second home
  for the capstone, so its report can be compared against the studio's.

## The reference tables (the "answer keys")
- `wu_xing.json` — the Five Elements and their two cycles (checked in Week 2).
- `bagua.json` — the nine life areas, their elements/directions, and the BTB grid.
- `twenty_four_mountains.json` — the 24 mountains with degree ranges and yin/yang polarity.
- `kua_table.json` — the Eight Mansions direction table plus published Kua examples (checked in Week 3).
- `flying_star_charts.json` — two published natal charts the code must reproduce cell-for-cell
  (checked in Week 4).

## Make your own home
The best exercise: hand-author a JSON file for the place you actually live and drop it in
`data/homes/`. Then every notebook works on *your* home. Ask Jeff if the schema trips you up.
