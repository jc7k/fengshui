# Form School & the Four Celestial Animals

> Read this before [[Module-Guide|Week 5]]. It's the oldest way of doing feng shui — and the
> hardest to put in code, which is exactly why it's worth a whole week.

## Why it matters
**Form School (Luan Tou, 巒頭 — "mountain peaks")** is the oldest branch of feng shui,
systematized by **Yang Yun-Sung** around the 9th century, long before compass formulas. Where
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

## Talk it through
- With a practitioner: "When you visit a site, what do you look at *first* — the land or the
  compass? Could you do your job from photos and a floor plan, or do you have to stand there?"
- For yourself: stand at your front door facing out and name all four animals for your own
  home. Which one is weakest? Does that match anything you've felt about living there?

➡️ Next: [[Module-Guide|Week 5's Module Guide]].
