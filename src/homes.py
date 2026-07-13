"""
homes.py — loading the bundled sample homes and reference tables.

This is the "front door" of the project. Unlike a machine-learning project that
streams a big dataset, feng shui needs no external data: a home is a tiny grid of
rooms, and the reference tables (elements, mountains, Kua directions) are small
enough to read by eye. So everything lives in this repo under data/, and this
module just loads it.

The floor-plan schema (see data/homes/*.json):
  name              : short id
  facing_degrees    : the compass direction the FRONT of the home faces (0=N, 90=E, ...)
  construction_year : the year built / first occupied (used by Flying Stars)
  grid              : rows of room labels. Row 0 is the NORTH edge, the last row is
                      the SOUTH edge; column 0 is WEST, the last column is EAST.
                      A null cell means "not part of the home" (a missing corner).
  features          : a list of {type, cell:[row,col], ...} for door / bed / desk / stove.

If a line here looks like magic, open the matching primer in
obsidian-vault/01-Feng-Shui-Fundamentals/.
"""

import json
from pathlib import Path

_REPO = Path(__file__).resolve().parent.parent
_HOMES_DIR = _REPO / "data" / "homes"
_REFERENCE_DIR = _REPO / "data" / "reference"

# The compass direction each grid EDGE points to, given our north-up convention.
NORTH, SOUTH, WEST, EAST = "north", "south", "west", "east"


def list_homes():
    """Names of every bundled sample home, sorted."""
    return sorted(p.stem for p in _HOMES_DIR.glob("*.json"))


def load_home(name):
    """Load one sample home by name (e.g. 'sunny_studio') as a dict."""
    path = _HOMES_DIR / f"{name}.json"
    if not path.exists():
        raise FileNotFoundError(
            f"No sample home named {name!r}. Available: {', '.join(list_homes())}"
        )
    return json.loads(path.read_text())


def load_reference(name):
    """Load a reference table from data/reference/ (e.g. 'wu_xing', 'bagua')."""
    return json.loads((_REFERENCE_DIR / f"{name}.json").read_text())


def grid_shape(home):
    """(rows, cols) of a home's grid."""
    grid = home["grid"]
    return len(grid), max(len(row) for row in grid)


def thirds(n):
    """Map each of n row/column indices to a 3x3 sector group (0, 1, or 2).

    A bagua overlay is always 3x3, but a grid can be any size, so we bucket its
    rows and columns into three groups each. Returns a list of length n.
    """
    return [min(2, i * 3 // n) for i in range(n)]


def rooms(home):
    """Yield (row, col, label) for every occupied cell (skips null 'missing' cells)."""
    for r, row in enumerate(home["grid"]):
        for c, label in enumerate(row):
            if label is not None:
                yield r, c, label


def find_feature(home, feature_type):
    """Return the first feature of a given type (e.g. 'door', 'bed'), or None."""
    for feature in home.get("features", []):
        if feature["type"] == feature_type:
            return feature
    return None
