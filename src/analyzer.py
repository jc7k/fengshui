"""
analyzer.py — the Home Analyzer, the "whole game" you improve every week.

Week 1 uses only the crude parts of this file (map rooms to life areas, print
naive tips). Later weeks reach for the richer functions (element-aware tips), and
the capstone's report.py pulls in the other schools. Keeping the entry point here
means the weekly notebooks stay short.

The room-to-element table below is a deliberate simplification — real practice
weighs a room's use, shape, and contents, not just its name. It is good enough to
show the Five Elements doing visible work, and honest enough to admit it is a
starting point, not a verdict.

Primer: obsidian-vault/02-Week-1-Whole-Game/Module-Guide.md
"""

import elements
from bagua import LIFE_AREA_ELEMENT, btb_overlay, compass_overlay
from homes import find_feature, grid_shape, rooms, thirds

# A room's dominant element, by its label. A simplification (see the module note).
ROOM_ELEMENT = {
    "kitchen": "Fire", "stove": "Fire", "dining": "Fire",
    "bath": "Water", "entry": "Water", "hall": "Water",
    "bedroom": "Earth",
    "living": "Wood", "office": "Wood",
    "closet": "Metal",
}


def _area_grid(home, school):
    """The 3x3 life-area grid for the chosen school ('btb' or 'compass')."""
    if school == "btb":
        door = find_feature(home, "door")
        return btb_overlay(door["wall"])
    if school == "compass":
        return compass_overlay()
    raise ValueError("school must be 'btb' or 'compass'")


def life_area_at(home, row, col, area_grid):
    """The life area a grid cell falls in, given a 3x3 area grid."""
    rows, cols = grid_shape(home)
    return area_grid[thirds(rows)[row]][thirds(cols)[col]]


def room_areas(home, school="btb"):
    """List of {room, cell, area} — which life area each room falls in."""
    area_grid = _area_grid(home, school)
    return [{"room": label, "cell": [r, c], "area": life_area_at(home, r, c, area_grid)}
            for r, c, label in rooms(home)]


def naive_recommendations(home, school="btb"):
    """Week-1 tips: crude, name-based, and proud of it.

    Flags the classic 'a water room drains its life area' pattern and notes where
    the kitchen lands. No element cycles yet — that arrives in Week 2.
    """
    tips = []
    for entry in room_areas(home, school):
        room, area = entry["room"], entry["area"]
        if room in ("bath", "entry"):
            tips.append(f"The {area} area holds a {room} — water rooms are said to "
                        f"drain the life area they sit in. A classic thing to watch.")
        elif room == "kitchen":
            tips.append(f"The {area} area holds the kitchen — a hot, active Fire room "
                        f"sitting in this part of your life.")
    if not tips:
        tips.append("No water rooms or kitchens landed on a notable area — a calm layout.")
    return tips


def element_tips(home, school="btb"):
    """Week-2 tips: element-aware. Explains the RELATIONSHIP, not just a flag.

    For each room, compares the room's element to its life area's element using
    the generating/controlling cycles, so a clash comes with a reason.
    """
    tips = []
    for entry in room_areas(home, school):
        room, area = entry["room"], entry["area"]
        room_el = ROOM_ELEMENT.get(room)
        area_el = LIFE_AREA_ELEMENT[area]
        if room_el is None:
            continue
        rel = elements.relationship(room_el, area_el)
        tips.append({
            "room": room, "area": area,
            "room_element": room_el, "area_element": area_el,
            "relationship": rel,
            "note": f"{room} ({room_el}) {elements.RELATIONSHIP_GLOSS[rel]} the "
                    f"{area} area ({area_el}).",
        })
    return tips
