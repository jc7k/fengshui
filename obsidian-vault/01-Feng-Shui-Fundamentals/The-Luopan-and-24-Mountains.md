# The Luopan & the 24 Mountains

> Read this before [[../04-Week-3-Eight-Mansions/Module-Guide|Week 3]]. The compass is the
> instrument the whole compass school runs on.

## Why it matters
The **luopan** (羅盤) is the feng shui compass: a magnetic needle at the center of many printed
rings of information. Real practitioners use it to read a building's exact facing. For our code
we only need two of its resolutions of the circle:

- **8 directions** of 45° each — North, Northeast, East, … These are the bagua directions.
- **24 mountains** of 15° each — three sub-sectors inside every direction (e.g. North splits
  into Ren / Zi / Gui). "Mountain" here just means a named 15° slice.

Each of the 24 mountains carries a **yin or yang polarity**. That one bit looks like trivia now,
but in Week 4 it's the switch that decides which way the Flying Stars fly. The polarities follow
a clean pattern: the four **cardinal** directions run yang–yin–yin; the four **corner**
directions run yin–yang–yang.

## The honest part: measuring is hard
On a real building, "which way does it face?" is genuinely contested — the front door? the
brightest, most open side? the side the building "addresses"? And a magnetic compass drifts near
steel beams, wiring, and appliances. So treat every `facing_degrees` in this project as **"the
number someone wrote down,"** not a fact of nature. When a reading lands right on a 15° boundary,
the honest move is to **re-measure**, not to guess — and our code does exactly that (Week 4).

## The metaphor 🏠
The 8 directions are like the **cardinal points on a paper map**; the 24 mountains are like
**adding the minor roads** — same map, finer grain. You don't need the fine grain to say "go
east," but you do need it to give precise turn-by-turn directions (which is what Flying Stars
demands).

## How we compute it in code
`src/compass.py`, backed by `data/reference/twenty_four_mountains.json`:
- `compass.direction_of(degrees)` → one of the 8 directions.
- `compass.mountain_of(degrees)` → the 24-mountains entry (name, sub-index 1/2/3, polarity).
- `compass.is_boundary(degrees)` → `True` when a reading is within 1° of a 15° boundary
  (ambiguous — re-measure).

## Talk it through
- With a practitioner: "How do you decide a building's facing when the door and the 'bright side'
  disagree? And how do you handle needle drift indoors?"
- For yourself: find your home's facing direction on a phone compass at the front door, then a
  few steps away. Did the number change? By how much? That wobble is the honesty note, live.

➡️ Next: [[Schools-Overview|Schools Overview]].
