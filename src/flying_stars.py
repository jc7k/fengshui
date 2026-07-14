"""
flying_stars.py — Xuan Kong Fei Xing, the time-based school.

Flying Stars is the one classical school that adds TIME. A building gets a "natal
chart" from when it was built and which way it faces: nine palaces, each holding
three numbers — a mountain (sitting) star, a base star, and a facing (water) star.
Mountain stars speak to health and relationships; facing stars to wealth and career.

How a chart is built (all three layers use one rule, the Lo Shu flight path):
  Center -> NW -> W -> NE -> S -> N -> SW -> E -> SE
  1. Base layer:   put the period number in the center, fly FORWARD (increasing).
  2. Facing layer: take the base star sitting in the FACING palace, put it in the
     center, fly forward if that star's mountain is yang, reverse if yin.
  3. Mountain layer: same, using the base star in the SITTING (opposite) palace.

The subtle step is forward-vs-reverse. It depends on the yin/yang polarity of one
of the 24 mountains, chosen by the star's trigram and the building's sub-mountain
(1/2/3). We LOOK THAT UP from data/reference/twenty_four_mountains.json rather than
deriving it from first principles — that keeps this readable, and the Week 4
notebook checks the result against real published charts.

Two honesty limits, on purpose:
  * If the facing degree sits on a 24-mountain boundary, we REFUSE and raise
    AmbiguousFacing. A real practitioner re-measures; the code will not guess.
  * The polarity of the number-5 star has no trigram of its own. We use the
    polarity of the actual measured mountain — a common, defensible simplification.
    It is the shakiest rule in the module; the primer says so plainly.

Primer: obsidian-vault/05-Week-4-Flying-Stars/Flying-Stars-Xuan-Kong.md
"""

import compass

# Period (1-9) -> the 20-year block it covers. We are in Period 9: 2024-2043.
PERIODS = {
    1: (1864, 1883), 2: (1884, 1903), 3: (1904, 1923), 4: (1924, 1943),
    5: (1944, 1963), 6: (1964, 1983), 7: (1984, 2003), 8: (2004, 2023),
    9: (2024, 2043),
}

# The Lo Shu flight path: the order palaces receive successive star numbers.
PATH = ["Center", "Northwest", "West", "Northeast", "South",
        "North", "Southwest", "East", "Southeast"]

OPPOSITE = {"North": "South", "South": "North", "East": "West", "West": "East",
            "Northeast": "Southwest", "Southwest": "Northeast",
            "Northwest": "Southeast", "Southeast": "Northwest"}

# Which trigram-direction a star number belongs to (star 5 has none).
STAR_DIRECTION = {1: "North", 2: "Southwest", 3: "East", 4: "Southeast",
                  6: "Northwest", 7: "West", 8: "Northeast", 9: "South"}

# polarity_at[direction][sub-index 1/2/3] -> "yang"/"yin", built from the same
# mountains table compass.py already loaded (one source, one parse).
polarity_at = {}
for _m in compass.MOUNTAINS:
    polarity_at.setdefault(_m["direction"], {})[_m["index"]] = _m["polarity"]


class AmbiguousFacing(Exception):
    """Raised when a facing degree is too close to a 24-mountain boundary to chart."""


def period_of(construction_year):
    """The Flying Stars period (1-9) for a construction/first-occupancy year."""
    for period, (lo, hi) in PERIODS.items():
        if lo <= construction_year <= hi:
            return period
    raise ValueError(f"year {construction_year} is outside the supported periods "
                     f"({PERIODS[1][0]}-{PERIODS[9][1]})")


def _fly(center_value, forward):
    """Place `center_value` in the center and walk the Lo Shu path, +1 (forward)
    or -1 (reverse) per palace, wrapping 9->1 / 1->9. Returns {direction: value}."""
    step = 1 if forward else -1
    value = center_value
    chart = {}
    for direction in PATH:
        chart[direction] = value
        value += step
        if value > 9:
            value = 1
        elif value < 1:
            value = 9
    return chart


def _flies_forward(star, sub_index, actual_polarity):
    """Does a facing/mountain star fly forward? Forward when its chosen mountain is yang.

    star           : the star number placed in the center of that layer
    sub_index      : the building's sub-mountain (1/2/3)
    actual_polarity: polarity of the real measured mountain (used only for star 5)
    """
    if star == 5:
        polarity = actual_polarity
    else:
        polarity = polarity_at[STAR_DIRECTION[star]][sub_index]
    return polarity == "yang"


def natal_chart(period, facing_degrees):
    """Build a natal flying-star chart.

    Returns {direction: [mountain_star, base_star, facing_star]} for all nine
    palaces (Center plus the eight directions). Raises AmbiguousFacing if the
    facing degree is on a 24-mountain boundary.
    """
    if compass.is_boundary(facing_degrees):
        raise AmbiguousFacing(
            f"{facing_degrees} deg is within {compass.BOUNDARY_EPSILON} deg of a "
            f"24-mountain boundary. Re-measure the facing; the chart is ambiguous here."
        )

    facing_mtn = compass.mountain_of(facing_degrees)
    facing_dir = facing_mtn["direction"]
    sitting_dir = OPPOSITE[facing_dir]
    sub_index = facing_mtn["index"]  # sitting shares the same sub-index (opposite mtn)

    base = _fly(period, forward=True)

    fs_center = base[facing_dir]
    fs_forward = _flies_forward(fs_center, sub_index, facing_mtn["polarity"])
    facing = _fly(fs_center, fs_forward)

    ms_center = base[sitting_dir]
    sitting_polarity = polarity_at[sitting_dir][sub_index]
    ms_forward = _flies_forward(ms_center, sub_index, sitting_polarity)
    mountain = _fly(ms_center, ms_forward)

    return {d: [mountain[d], base[d], facing[d]] for d in base}
