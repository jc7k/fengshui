"""
elements.py — the Five Elements (Wu Xing) engine.

The five elements — Wood, Fire, Earth, Metal, Water — are the vocabulary every
feng shui school shares. Two cycles connect them:

  generating (sheng): Wood -> Fire -> Earth -> Metal -> Water -> Wood
      each element "feeds" the next (wood burns to make fire, fire's ash makes
      earth, earth yields metal, metal collects water, water grows wood).
  controlling (ke):   Wood -> Earth -> Water -> Fire -> Metal -> Wood
      each element "keeps another in check" (wood's roots break up earth, earth
      dams water, water quenches fire, fire melts metal, metal cuts wood).

These two closed loops are the whole engine. Everything is loaded from
data/reference/wu_xing.json so the tables are visible and checkable — the Week 2
notebook asserts this module matches that file exactly.

Primer: obsidian-vault/01-Feng-Shui-Fundamentals/The-Five-Elements-and-Cycles.md
"""

from homes import load_reference

_WU_XING = load_reference("wu_xing")

ELEMENTS = _WU_XING["elements"]
CORRESPONDENCES = _WU_XING["correspondences"]
_GENERATING = _WU_XING["generating_cycle"]
_CONTROLLING = _WU_XING["controlling_cycle"]


def generates(element):
    """The element that `element` generates/feeds (sheng cycle)."""
    return _GENERATING[element]


def controls(element):
    """The element that `element` controls/weakens (ke cycle)."""
    return _CONTROLLING[element]


def direction_of(element):
    """The compass direction associated with an element (Center for Earth)."""
    return CORRESPONDENCES[element]["direction"]


def color_of(element):
    """The color associated with an element."""
    return CORRESPONDENCES[element]["color"]


def relationship(a, b):
    """Describe how element `a` relates to element `b`.

    Returns one of: 'same', 'generates', 'generated_by', 'controls',
    'controlled_by'. This is what lets the analyzer EXPLAIN a recommendation
    ("a Fire fixture in a Metal sector — Fire controls Metal, a clash") instead
    of just flagging it.
    """
    if a == b:
        return "same"
    if generates(a) == b:
        return "generates"
    if generates(b) == a:
        return "generated_by"
    if controls(a) == b:
        return "controls"
    if controls(b) == a:
        return "controlled_by"
    # The five elements form two closed cycles; every ordered pair is covered
    # above, so we never reach here. (Kept as a guard, not a real branch.)
    raise ValueError(f"unclassified element pair: {a}, {b}")


# Plain-language gloss for each relationship, from the point of view of `a`.
RELATIONSHIP_GLOSS = {
    "same": "the same element — reinforcing",
    "generates": "feeds (a supportive, giving relationship)",
    "generated_by": "is fed by (a supportive, receiving relationship)",
    "controls": "controls/weakens (a draining clash)",
    "controlled_by": "is controlled/weakened by (a draining clash)",
}
