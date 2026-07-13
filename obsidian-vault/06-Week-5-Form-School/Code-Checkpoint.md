# Week 5 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done —
don't gold-plate it.

## What "working" looks like
```python
import floorplan, homes

# 1. Missing corners on both sample homes
for name in ['sunny_studio', 'courtyard_L']:
    h = homes.load_home(name)
    print(name, '-> missing:', floorplan.missing_corners(h) or 'nothing')

# 2. The hand-worked check (the notebook's ✅ cell)
L = homes.load_home('courtyard_L')
studio = homes.load_home('sunny_studio')
assert floorplan.missing_corners(L) == ['Northeast']
assert floorplan.missing_corners(studio) == []

# 3. Command position for the bed and the desk
for feat in ['bed', 'desk']:
    r = floorplan.command_position(studio, feat)
    print(feat, '->', 'IN command' if r['in_command'] else 'not commanding', '—', r['reason'])

# 4. Poison arrows  (this is the cell you write)
arrows = floorplan.poison_arrows(studio)
if not arrows:
    print('No poison arrows.')
for a in arrows:
    print(f"Chi rushes at the {a['feature']} along its {a['along']} from the door.")

# 5. The field checklist — printed, not answered
for i, item in enumerate(floorplan.field_checklist(), 1):
    print(f'{i}. {item}\n')
```

## Signs it's working
- `courtyard_L` prints `missing: ['Northeast']`; `sunny_studio` prints `missing: nothing`.
- The ✅ check cell passes both asserts (if it doesn't, re-do the hand-worked sketch — the code
  may be right and your sketch wrong, or vice versa; that disagreement is the exercise).
- The studio's **desk** reports IN command (diagonal from the door); its **bed** reports not
  commanding (it shares the door's column).
- Exactly one poison arrow prints for the studio: the bed, along its **column** — the same
  geometry as the bed's failed command position, named the Form-School way.
- Five checklist prompts print, and none of them are answered by the code.

## Common snags
- **`ModuleNotFoundError`** → you skipped the bootstrap cell. Run it first.
- **`command_position` returns `None`** → the home has no such feature (or no door). Check the
  `feature_type` string — it's `'bed'` and `'desk'`, singular, lowercase.
- **Your poison-arrows cell prints nothing** → an empty list is a valid finding! Handle it (the
  `if not arrows:` branch) instead of assuming there's always an arrow.
- **The assert fails on `courtyard_L`** → make sure you loaded `'courtyard_L'` and not the
  studio; the studio is a clean square on purpose.

## Honesty check
Resist the urge to "finish" Form School by writing a function that scores the Four Animals from
the floor plan. The grid has no idea what's *behind* your house. **The checklist stays a
checklist** — code that pretends to see land it can't see isn't a feature, it's a lie with a
return value.
