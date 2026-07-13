"""
bagua.py — the eight trigrams, the nine life areas, and the two ways to place them.

The bagua ("eight symbols") maps a home into nine life areas — Wealth, Fame,
Relationships, Family, Health (center), Children, Knowledge, Career, Helpful
People. Every school agrees on the nine areas and their elements. Where they
DISAGREE is how you lay the map onto a real home:

  compass overlay : anchor each area to its true compass direction (South = Fame,
                    Southeast = Wealth, ...). Used by the classical/compass schools.
  BTB overlay     : ignore the compass. Anchor the map to the wall with the front
                    door — the door row is always Knowledge / Career / Helpful
                    People. Used by BTB (Black Sect).

Same home, two maps, often different labels on the same room. That gap is not a
bug to fix — it is the single most important thing this project teaches. Both
overlays return a 3x3 grid of life-area names so they can be shown side by side.

Primers:
  obsidian-vault/01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua.md
  obsidian-vault/07-Week-6-BTB-Contrast/BTB-and-Compass-Bagua.md
"""

from homes import load_reference

_BAGUA = load_reference("bagua")

TRIGRAMS = _BAGUA["trigrams"]
CENTER = _BAGUA["center"]

# The nine life areas, and the element that governs each (center included).
LIFE_AREA_ELEMENT = {t["life_area"]: t["element"] for t in TRIGRAMS.values()}
LIFE_AREA_ELEMENT[CENTER["life_area"]] = CENTER["element"]

# Which life area sits in each compass direction (the compass-school placement).
DIRECTION_LIFE_AREA = {t["direction"]: t["life_area"] for t in TRIGRAMS.values()}
DIRECTION_LIFE_AREA[CENTER["direction"]] = CENTER["life_area"]

# A 3x3 layout of the eight compass directions around the center, in our
# north-up grid convention (row 0 = north edge, col 0 = west edge).
COMPASS_LAYOUT = [
    ["Northwest", "North",  "Northeast"],
    ["West",      "Center", "East"],
    ["Southwest", "South",  "Southeast"],
]


def compass_overlay():
    """3x3 grid of life-area names placed by true compass direction."""
    return [[DIRECTION_LIFE_AREA[d] for d in row] for row in COMPASS_LAYOUT]


# Which grid EDGE the front door is on -> how many 90-degree turns map the BTB
# reference grid (door at the bottom) onto our north-up grid. The BTB reference
# has the door row at the bottom (south); other door walls rotate that layout.
_DOOR_ROTATION = {"south": 0, "east": 1, "north": 2, "west": 3}


def _rotate_ccw(grid):
    """Rotate a 3x3 grid 90 degrees counter-clockwise."""
    return [[grid[c][2 - r] for c in range(3)] for r in range(3)]


def btb_overlay(door_wall):
    """3x3 grid of life-area names placed by the front-door wall (BTB style).

    door_wall is one of 'north'/'south'/'east'/'west'. The BTB map always puts
    Career at the door's center and Knowledge/Career/Helpful-People along the
    door wall; we rotate the reference grid so that wall lands on the right edge.
    """
    grid = [row[:] for row in _BAGUA["btb_grid"]["rows"]]  # door at bottom row
    for _ in range(_DOOR_ROTATION[door_wall]):
        grid = _rotate_ccw(grid)
    return grid
