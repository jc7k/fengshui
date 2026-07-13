# Week 3 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done —
don't gold-plate it.

## What "working" looks like
```python
import eight_mansions as em
import homes, compass

# 1. Kua numbers from birth year + gender
for year, gender in [(1990, 'female'), (1985, 'male'), (2010, 'male')]:
    k = em.kua_number(year, gender)
    print(f"{gender} born {year}: Kua {k} ({em.group(k)} group)")

# 2. The ✅ check — every published example must match
ref = homes.load_reference('kua_table')
for ex in ref['examples']:
    assert em.kua_number(ex['year'], 'male') == ex['male']
    assert em.kua_number(ex['year'], 'female') == ex['female']

# 3. Four good, four bad
kua = em.kua_number(1990, 'female')
print(em.good_directions(kua))   # {direction: quality} — Sheng Qi, Tian Yi, ...
print(em.bad_directions(kua))    # {direction: quality} — Huo Hai, ..., Jue Ming

# 4. Is the bed facing a good direction?  (this is the cell you write)
home = homes.load_home('sunny_studio')
bed = homes.find_feature(home, 'bed')
bed_dir = compass.direction_of(bed['facing'])
quality = em.direction_quality(kua, bed_dir)
verdict = 'auspicious' if em.is_auspicious(kua, bed_dir) else 'inauspicious'
print(f'Bed faces {bed_dir}: {quality} ({verdict}) for Kua {kua}')

# 5. The Li Chun boundary
print(em.kua_number(1990, 'male', 1, 15))   # January birth -> counts as 1989!
print(em.kua_number(1990, 'male', 3, 15))   # March birth  -> 1990 as expected
```

## Signs it's working
- Every line of the ✅ check prints green and the `assert` passes — no ❌ anywhere.
- A male born 2010 does **not** get the same Kua the pre-2000 formula would give.
- `good_directions` and `bad_directions` each return exactly **four** entries, and together they
  cover all eight directions.
- Your bed cell prints a direction word, a quality name, and a verdict — all three.
- The Jan-15 and Mar-15 calls for the same year print **different** Kua numbers.

## Common snags
- **`ValueError: gender must be 'male' or 'female'`** → gender is required; the traditional
  formula genuinely differs by gender, so there's no default to hide behind.
- **`KeyError` on a direction** → `direction_quality` wants a direction word ("North"), not
  degrees. Snap degrees first with `compass.direction_of(...)`.
- **Kua 5 never appears** → correct! Kua 5 is not used; the code substitutes 2 (male) or
  8 (female). If you see a 5, you've reimplemented the formula without the substitution.
- **The ❌ appears only on post-2000 years** → you're on the old formula. Male ≥2000 is
  `9 − d`, female ≥2000 is `d + 6`.

## Honesty check
Your checker will disagree with some websites. **Resist "fixing" it to match them.** The
reference table is the standard; the disagreeing sites are the ones stuck on the pre-2000
formula or ignoring Li Chun. When your code and the internet disagree, check the *table*, not
the vibes.
