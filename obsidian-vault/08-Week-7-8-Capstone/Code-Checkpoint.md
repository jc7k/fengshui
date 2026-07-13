# Weeks 7–8 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done.

## What "working" looks like
```python
import report, homes

occupants = [
    {'name': 'Sam', 'year': 1990, 'gender': 'female'},
    {'name': 'Lee', 'year': 1985, 'gender': 'male'},
]
home = homes.load_home('sunny_studio')
rep = report.full_report(home, occupants)

# The conflict table — the heart of the capstone (the cell you write)
print(f"{'Direction':>10} | {'Compass area':>14} | {'BTB area':>14} | conflict?")
for row in rep['conflict_table']:
    flag = 'DISAGREE' if row['conflict'] else ''
    print(f"{row['direction']:>10} | {row['compass_area']:>14} | {row['btb_area']:>14} | {flag}")

print('\n', rep['disclaimer'])
```

## Signs it's working
- The report dict has keys `occupants`, `flying_stars`, `form`, `conflict_table`, `disclaimer`.
- The conflict table has exactly 9 rows (the 3×3 sectors).
- Some rows show DISAGREE — the compass school and BTB label the same spot differently.
- On `edge_case_flat`, `rep['flying_stars']['ambiguous']` is `True` (the honest refusal survives
  all the way into the report).

## Common snags
- **Empty conflict table** → you're comparing the wrong grids. `report.conflict_table` already
  compares compass vs BTB per sector; just read `row['conflict']`.
- **`KeyError` on a person** → each occupant needs `year` and `gender` (strings 'male'/'female').
- **Flying stars section is `None`** → that's not an error for a boundary-facing home; check
  `rep['flying_stars']['ambiguous']`.

## Honesty check
Do **not** add a "total score" or "overall grade" for the home. The whole design of this report
is that it refuses to collapse conflicting traditions into one number. Bundling the disagreement
honestly is the capstone deliverable — not resolving it.
