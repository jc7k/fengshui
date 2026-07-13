# Week 6 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done —
don't gold-plate it.

## What "working" looks like
```python
import bagua, homes, viz

# 1. Load a home and find which wall its front door is on
home = homes.load_home('sunny_studio')
door_wall = homes.find_feature(home, 'door')['wall']
print('Door is on the', door_wall, 'wall')

# 2. Build both overlays — each is a 3x3 grid of life-area names
compass_grid = bagua.compass_overlay()
btb_grid = bagua.btb_overlay(door_wall)

# 3. Draw them side by side
viz.plot_school_comparison(home, compass_grid, btb_grid)

# 4. The diff table  (this is the cell you write)
conflicts = []
for r in range(3):
    for c in range(3):
        if compass_grid[r][c] != btb_grid[r][c]:
            conflicts.append((compass_grid[r][c], btb_grid[r][c]))
print(f'{len(conflicts)} of 9 sectors disagree:')
for comp, btb in conflicts:
    print(f'   compass says {comp:>14} | BTB says {btb}')

# 5. The verification — the schools really do conflict
assert len(conflicts) > 0, 'expected the schools to disagree'
```

## Signs it's working
- `viz.plot_school_comparison` shows the same floor plan twice, with different labels on some
  sectors.
- The door wall prints as a word (`north`/`south`/`east`/`west`), not a coordinate.
- The diff table lists *some* sectors but not all nine — the two maps usually agree somewhere.
- The `assert` passes silently. If the diff were empty, something would be wrong (or the home's
  door happens to sit exactly where the two maps coincide — try another home).

## Common snags
- **`ModuleNotFoundError`** → you skipped the bootstrap cell. Run it first.
- **`KeyError` / `TypeError` on the door lookup** → `homes.find_feature(home, 'door')` returns a
  dict; take its `['wall']`, and pass *that string* to `bagua.btb_overlay(...)`.
- **`btb_overlay()` missing an argument** → unlike `compass_overlay()`, the BTB overlay *needs*
  the door wall — that's the entire point of the school.
- **Comparing the grids with `==` and getting one big True/False** → these are plain lists of
  lists; you need to walk the sectors yourself with the double loop.

## Honesty check
Your diff table will look like an error report. It isn't. **Do not try to decide which column is
"right."** Both grids are computed correctly from their own tradition's rule — the disagreement is
the finding, not a bug. The capstone builds on exactly this table.
