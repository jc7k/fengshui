"""
compass.py — turning a compass reading (in degrees) into feng shui directions.

Two resolutions of the same circle:
  * 8 sectors of 45 degrees   -> North, Northeast, East, ... (the bagua directions)
  * 24 mountains of 15 degrees -> Ren, Zi, Gui, Chou, ...   (three per direction)

The 24 mountains carry a yin/yang polarity that the Flying Stars method needs.
The table lives in data/reference/twenty_four_mountains.json so it is visible and
checkable rather than buried in code.

A real luopan (feng shui compass) has dozens of rings; we use the two that the
computable schools actually need. Measuring a real building's facing is genuinely
hard (steel and wiring pull the needle), so treat every degree here as "the number
you wrote down", not ground truth.

Primer: obsidian-vault/01-Feng-Shui-Fundamentals/The-Luopan-and-24-Mountains.md
"""

from homes import load_reference

MOUNTAINS = load_reference("twenty_four_mountains")["mountains"]

# 8 directions in clockwise order starting from North, each spanning 45 degrees
# centered on its cardinal/ordinal bearing (North spans 337.5..22.5).
DIRECTIONS = ["North", "Northeast", "East", "Southeast",
              "South", "Southwest", "West", "Northwest"]


def normalize(degrees):
    """Fold any angle into [0, 360)."""
    return degrees % 360.0


def direction_of(degrees):
    """The 8-sector direction name for a bearing in degrees (0 = North)."""
    d = normalize(degrees)
    # Shift by half a sector so North's band (337.5..22.5) maps cleanly to index 0.
    index = int((d + 22.5) % 360 // 45)
    return DIRECTIONS[index]


def _in_mountain(d, mountain):
    """Is bearing d inside this mountain's 15-degree band? (handles the 0-crossing)."""
    start, end = mountain["start"], mountain["end"]
    if start <= end:
        return start <= d < end
    return d >= start or d < end  # band wraps past 360 (only Zi does this)


def mountain_of(degrees):
    """The 24-mountains entry (dict) containing a bearing in degrees."""
    d = normalize(degrees)
    for mountain in MOUNTAINS:
        if _in_mountain(d, mountain):
            return mountain
    # Bands tile the whole circle, so this is unreachable; kept as a guard.
    raise ValueError(f"no mountain found for {degrees}")


# How close (in degrees) a bearing must be to a 15-degree boundary before we call
# it ambiguous. On a real luopan a reading this close means "re-measure" — the
# Flying Stars module refuses rather than guessing which mountain you meant.
BOUNDARY_EPSILON = 1.0


def boundary_distance(degrees):
    """Degrees from the nearest 24-mountain boundary (boundaries every 15 deg at x.5)."""
    d = normalize(degrees)
    offset = (d - 7.5) % 15.0  # boundaries sit at 7.5, 22.5, 37.5, ...
    return min(offset, 15.0 - offset)


def is_boundary(degrees, epsilon=BOUNDARY_EPSILON):
    """True if a bearing is within `epsilon` of a 24-mountain boundary (ambiguous)."""
    return boundary_distance(degrees) < epsilon
