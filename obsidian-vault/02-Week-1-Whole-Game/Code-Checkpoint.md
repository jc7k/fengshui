# Week 1 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done —
don't gold-plate it.

## What "working" looks like
```python
import homes, compass, analyzer, viz

# 1. Load a real floor plan
home = homes.load_home('sunny_studio')
print(home['name'], '— facing', home['facing_degrees'], 'degrees')

# 2. Draw it
viz.plot_home(home)

# 3. Snap the facing to one of the 8 directions
print('This home faces:', compass.direction_of(home['facing_degrees']))   # -> South

# 4. Lay the (BTB) bagua over the home
for entry in analyzer.room_areas(home):
    print(entry['room'], '->', entry['area'])

# 5. The naive recommendations  (this is the cell you write)
for tip in analyzer.naive_recommendations(home):
    print('-', tip)
```

## Signs it's working
- `viz.plot_home` shows a labelled grid with a red square on the front door.
- The facing prints as a word ("South"), not a number.
- Every room prints next to a life area (Wealth, Career, …).
- At least one recommendation prints (the studio's bathroom lands on a life area).

## Common snags
- **`ModuleNotFoundError`** → you skipped the bootstrap cell. Run it first.
- **`KeyError: 'wall'`** → you passed something that isn't a loaded home. Use
  `homes.load_home(...)`.
- **A blank plot** → in Colab, make sure the cell ends with the `viz.plot_home(home)` call (or add
  `plt.show()`); Colab renders the last expression.

## Honesty check
Your recommendations will be shallow — "a bathroom drains this area," and not much more. **Do not
try to make them smart this week.** Shallow tips from a pipeline that runs end to end *is* the Week
1 deliverable. Week 2 is where the reasoning arrives.
