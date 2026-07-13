# Week 4 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done —
don't gold-plate it.

## What "working" looks like
```python
import flying_stars as fs, homes, viz

# 1. Which period is a year in?
for yr in [2010, 2025, 1995]:
    print(yr, '-> Period', fs.period_of(yr))   # -> 8, 9, 7

# 2. Build a natal chart from (period, facing)
home = homes.load_home('sunny_studio')
period = fs.period_of(home['construction_year'])
chart = fs.natal_chart(period, home['facing_degrees'])
for d, (mtn, base, face) in chart.items():
    print(f'{d:>10}: mountain {mtn}  base {base}  facing {face}')

# 3. Draw it (South is up)
viz.plot_flying_star_chart(chart, f'{home["name"]} — Period {period}')

# 4. The ✅ check — reproduce the published charts cell-for-cell
for ref in homes.load_reference('flying_star_charts')['charts']:
    c = fs.natal_chart(ref['period'], ref['facing_degrees'])
    print(all(c[d] == ref['palaces'][d] for d in ref['palaces']), ref['id'])

# 5. The honest refusal  (this is the cell you write)
edge = homes.load_home('edge_case_flat')   # faces 172.4 deg — a boundary, on purpose
try:
    fs.natal_chart(fs.period_of(edge['construction_year']), edge['facing_degrees'])
except fs.AmbiguousFacing as exc:
    print('Refused, correctly:', exc)
```

## Signs it's working
- `period_of(2025)` says 9, `period_of(2010)` says 8, `period_of(1995)` says 7.
- Every one of the nine palaces prints **three** numbers: mountain, base, facing — in that order.
- The drawn chart has South at the **top** — if North is up, you're reading it upside down.
- The ✅ check prints `True` (or ✅) for **both** published charts.
- The edge-case home prints a refusal message that says to re-measure, not a chart.

## Common snags
- **`ModuleNotFoundError`** → you skipped the bootstrap cell. Run it first.
- **A ❌ on the published-chart check** → almost always the forward/reverse decision. Check which
  palace's base star you're moving to the center (facing layer uses the **facing** palace,
  mountain layer uses the **sitting** — opposite — palace), and check the wrap: forward 9→1,
  reverse 1→9.
- **`AmbiguousFacing` on a home you expected to chart** → the facing is within 1° of a 15°
  boundary. For the samples, only `edge_case_flat` should trip it. If others do, check you're
  passing degrees, not a direction name.
- **The three numbers in the wrong slots on the plot** → the chart values are
  `[mountain, base, facing]`; keep that order everywhere.
- **A blank plot** → in Colab, end the cell with the `viz.plot_flying_star_chart(...)` call (or
  add `plt.show()`); Colab renders the last expression.

## Honesty check
If your chart matches the published ones, resist the feeling that you've *derived* Flying Stars.
The polarity switch was **looked up** from a cited table — the match proves the lookup and the
flight path were applied correctly, nothing more. And leave the refusal a refusal: **do not**
"fix" the edge case by rounding 172.4° to the nearest mountain. The refusal *is* the feature.
