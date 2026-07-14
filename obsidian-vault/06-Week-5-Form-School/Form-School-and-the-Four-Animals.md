# Form School & the Four Celestial Animals

> Read this before [[Module-Guide|Week 5]]. It's the oldest way of doing feng shui — and the
> hardest to put in code, which is exactly why it's worth a whole week.

## Why it matters
**Form School (Luan Tou, 巒頭 — "mountain peaks")** is the oldest branch of feng shui,
systematized by **Yang Yun-Sung** around the 9th century, before the compass formulas were
systematized. Where
the compass schools ask *which direction?*, Form School asks *what shape?* — the land around a
home, the flow of a room, where you sit. Its central image is the **Four Celestial Animals**,
describing the ideal site as seen facing out from the front door:

- **Black Tortoise** — *behind*: solid support. A hill, a taller building, a good wall.
- **Red Phoenix** — *in front*: open, bright space. A yard, a park, a view.
- **Green Dragon** — *left*: the left flank, ideally gently higher/stronger.
- **White Tiger** — *right*: the right flank, ideally a bit lower and tamer.

Together they form the ideal **"armchair" configuration**: a solid back, an open view, and
armrests on both sides. Inside the home the same shape-thinking gives three rules you'll code
this week: the **command position** (see the door from your bed or desk without sitting in its
direct line), **poison arrows** (chi rushing in a straight line at where you rest or work), and
**missing corners** (an L-shaped home has a bagua sector with no physical space at all).

## The oldest school's paper trail
Feng shui's earliest texts sited **graves**, not homes — **Guo Pu's** *Zangshu* (*Book of
Burial*, ~4th century) is where the term "feng shui" first appears, a story told in full in
[[../02-Week-1-Whole-Game/Feng-Shui-Origins-Wind-and-Water|the Week 1 origins note]]. Form
School's founding figure is **Yang Yun-Sung (楊筠松, 834–900)**, a court official in the Tang
dynasty's chaotic final decades who left the capital for **Ganzhou** in Jiangxi province and
taught so freely there that tradition nicknamed him "Yang, Savior of the Poor." His school is
still called the **Jiangxi school** after his adopted region, and his most famous attributed
work is the *Han Long Jing* (撼龍經, "Classic of Shaking the Dragon") — a manual for reading
**dragon veins (龍脈, lóng mài)**, whole mountain ranges traced as living conduits of chi.
That's the landscape-scale version of exactly what you'll do to a bedroom this week: find the
support, find the rushing line, find where things settle. ⚠️ One honest caveat: scholars can't
confirm Yang wrote any of the texts that carry his name. The ideas are Tang-old; some of the
bylines probably aren't.

## The animals, in Chinese
The Four Celestial Animals predate feng shui — they're the **Four Symbols (四象)** of Chinese
astronomy, guardians of the four quadrants of the sky. This project's names are the common
English simplifications; here's the classical ledger:

| In this project | Classical name | Pinyin | Literally |
|---|---|---|---|
| Black Tortoise | 玄武 | Xuán Wǔ | "Dark Warrior" |
| Red Phoenix | 朱雀 | Zhū Què | "Vermilion Bird" |
| Green Dragon | 青龍 | Qīng Lóng | "Azure Dragon" |
| White Tiger | 白虎 | Bái Hǔ | "White Tiger" |

Only the tiger survives translation intact: **玄武** is really a "Dark Warrior" (a tortoise
entwined with a snake), and **朱雀** a "Vermilion Bird" that isn't quite a phoenix. Three more
terms you'll meet in Form School reading:

| Term | Pinyin | Meaning |
|---|---|---|
| 巒頭 | luán tóu | "mountain peaks" — Form School's proper name |
| 明堂 | míng táng | "bright hall" — the open space where chi gathers in front |
| 煞氣 | shà qì | "killing breath" — the hostile chi of a poison arrow |

## The metaphor 🏠
A well-sited home sits like **a person in an armchair**. Back supported (Tortoise), facing an
open room (Phoenix), armrests at each side (Dragon and Tiger). Now sit on a backless stool in
a doorway with your back to a corridor — that's the misconfigured site. Nothing mystical about
why one feels safer: you can see what's coming, and nothing can surprise you from behind. The
command position is the same armchair, shrunk to the scale of one bed and one door.

## How we compute it in code
Carefully — because most of Form School **isn't** computable, and `src/floorplan.py` says so in
its own docstring. It splits cleanly in two:

**Computed** — honestly just geometry on the grid:
- `floorplan.missing_corners(home)` — which bagua sectors have no occupied cells at all
  (`courtyard_L` is missing its Northeast).
- `floorplan.command_position(home, feature_type)` — is the bed/desk *diagonal* from the door
  (different row AND column)? A crude but real approximation of "sees the door without sitting
  in its line."
- `floorplan.poison_arrows(home)` — is a bed or desk in the door's straight path (same row or
  column)? The same geometry as a failed command position, named the Form-School way.

**Observed** — deliberately NOT automated:
- `floorplan.field_checklist()` returns *prompts*, not answers: the Four Animals, outside
  poison arrows, water and roads. You answer them by standing at your real home and opening a
  satellite map. A function that scored your "dragon and tiger" from a floor plan would be
  fabricating perception it doesn't have — the grid can't see behind your house. Keeping that
  half human is the most honest line in the whole project.

## Worked example: the armchair test on courtyard_L
Run the three computed checks by hand on `data/homes/courtyard_L.json` before you trust the
code to. Its door is at `[2, 0]` (south wall), bed at `[2, 2]`, desk at `[0, 0]`, and cell
`[0, 2]` is null:

- **Bed vs. door**: `[2, 2]` and `[2, 0]` share **row 2**. Same row = the door's direct line,
  so `command_position` says *not commanding* — and `poison_arrows` reports the same geometry
  as chi rushing at the bed **along the row**.
- **Desk vs. door**: `[0, 0]` and `[2, 0]` share **column 0**. Same column, same verdict: the
  desk sits in the door's line too. One door, both findings.
- **Missing corner**: the null at `[0, 2]` sits in the top row (north band) and right column
  (east band) of the north-up grid — so `missing_corners` reports the **Northeast** absent.

Three checks, three findings. Now the half no function can run: take `field_checklist()`
outside. Stand at the real front door (or open a satellite view) and translate the animals to
a city: the **tortoise** is a taller building behind you, the **phoenix** an open street or
park in front, and the road itself plays the role of **virtual water** flowing past.

## In practice today
Two Form-School habits survive intact at apartment scale. First, the **ming tang (明堂)** —
classically the open ground before a site where chi collects — shrinks to the clear space just
inside your front door: keep that first square metre open, and the whole flat breathes easier.
Second, the "form first" instinct: practitioners commonly say that what the forms show
**dominates** whatever the compass calculations promise — a maxim weighed properly in
[[../08-Week-7-8-Capstone/How-Practitioners-Reconcile-the-Schools|the capstone's background note]],
so we'll leave it at one sentence here.

## Talk it through
- With a practitioner: "When you visit a site, what do you look at *first* — the land or the
  compass? Could you do your job from photos and a floor plan, or do you have to stand there?"
- For yourself: stand at your front door facing out and name all four animals for your own
  home. Which one is weakest? Does that match anything you've felt about living there?

➡️ Next: [[Module-Guide|Week 5's Module Guide]].
