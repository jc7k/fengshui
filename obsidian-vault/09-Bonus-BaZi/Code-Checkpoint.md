# Bonus — Code Checkpoint

## What "working" looks like
```python
import bazi

# A year pillar: one Heavenly Stem + one Earthly Branch
p = bazi.year_pillar(1990)
print(f"{p['stem']}-{p['branch']} — {p['polarity']} {p['element']} {p['animal']}")

# The anchor: 1984 started a 60-year cycle
a = bazi.year_pillar(1984)
assert a['stem'] == 'Jia' and a['branch'] == 'Zi'   # Wood Rat

# Your own (month/day apply the ~Feb-4 boundary)
me = bazi.year_pillar(1995, month=6, day=1)
print(me)
```

## Signs it's working
- Each year returns a stem from {Jia, Yi, Bing, …} and a branch/animal from {Zi/Rat, Chou/Ox, …}.
- 1984 comes back as Jia-Zi.
- A January birth shifts to the previous year's pillar when you pass month/day.

## Common snags
- **`ModuleNotFoundError: bazi`** → run the bootstrap cell; `bazi.py` imports `solar_year` from
  `eight_mansions.py`, so both need to be on the path (they are, from `src/`).

## Honesty check
Don't read too much into one pillar. It's a fun connection to the Week-3 birth-year math, not a
fortune. If it makes you curious about the full Four Pillars, that curiosity is the real deliverable.
