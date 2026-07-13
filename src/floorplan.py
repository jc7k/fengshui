"""
floorplan.py — Form School, the part a computer can honestly do.

Form School (Luan Tou) is the oldest school. It reads the SHAPE of a place — the
land around a house, the flow of a room, where you sit. Most of it is trained
perception, not arithmetic, and pretending otherwise would be dishonest. So this
module splits cleanly in two:

  COMPUTED (functions below): things that are really just geometry on the grid —
    * missing_corners  : is a whole bagua sector absent (an L-shaped home)?
    * command_position : can the bed/desk see the door without being in its direct path?
    * poison_arrows    : does chi rush in a straight line at a bed or desk?

  OBSERVED (field_checklist): things only a person standing there can judge —
    the Four Celestial Animals (support behind, openness in front), the land, the
    roads, the view. field_checklist() returns prompts, not answers.

Primer: obsidian-vault/06-Week-5-Form-School/Form-School-and-the-Four-Animals.md
"""

from bagua import COMPASS_LAYOUT
from homes import find_feature, grid_shape, thirds


def missing_corners(home):
    """Compass sectors whose grid region is entirely absent (null cells).

    A home shaped like an L is 'missing' a bagua sector — that life area has no
    physical space in the home. Returns a sorted list of direction names.
    """
    rows, cols = grid_shape(home)
    row_group, col_group = thirds(rows), thirds(cols)
    # Track, per sector, whether any occupied cell falls in it.
    occupied = set()
    for r in range(rows):
        for c in range(cols):
            label = home["grid"][r][c] if c < len(home["grid"][r]) else None
            if label is not None:
                occupied.add(COMPASS_LAYOUT[row_group[r]][col_group[c]])
    all_sectors = {COMPASS_LAYOUT[rg][cg] for rg in row_group for cg in col_group}
    return sorted(all_sectors - occupied)


def command_position(home, feature_type):
    """Is a feature (e.g. 'bed', 'desk') in the commanding position?

    The commanding-position rule: you should see the door from where you rest or
    work, but NOT sit directly in its line of fire. On the grid we approximate
    that as 'diagonal from the door' — a different row AND a different column.
    Returns {feature, in_command, reason} or None if the feature/door is absent.
    """
    feature = find_feature(home, feature_type)
    door = find_feature(home, "door")
    if feature is None or door is None:
        return None
    fr, fc = feature["cell"]
    dr, dc = door["cell"]
    same_row, same_col = fr == dr, fc == dc
    in_command = not (same_row or same_col)
    if in_command:
        reason = "diagonal from the door — sees it without being in its direct line"
    elif same_col:
        reason = "shares the door's column — sits in the door's direct line (not commanding)"
    else:
        reason = "shares the door's row — sits in the door's direct line (not commanding)"
    return {"feature": feature_type, "in_command": in_command, "reason": reason}


def poison_arrows(home):
    """Straight-line 'rushing chi' from the door at a bed or desk.

    When a bed or desk sits in the door's straight path (same row or column), chi
    is said to rush at it like an arrow. Returns a list of {feature, direction}
    findings — the same geometry as a non-commanding position, named the Form-School way.
    """
    door = find_feature(home, "door")
    if door is None:
        return []
    dr, dc = door["cell"]
    findings = []
    for feature_type in ("bed", "desk"):
        feature = find_feature(home, feature_type)
        if feature is None:
            continue
        fr, fc = feature["cell"]
        if fr == dr:
            findings.append({"feature": feature_type, "along": "row"})
        elif fc == dc:
            findings.append({"feature": feature_type, "along": "column"})
    return findings


# The parts of Form School a computer must NOT pretend to judge. These are prompts
# for the learner to answer by looking at their real home and a satellite map.
FIELD_CHECKLIST = [
    "Black Tortoise (behind): is there solid support behind the home — a hill, a "
    "taller building, a wall? Or does the land drop away?",
    "Red Phoenix (in front): is there open, bright space in front — a yard, a park, "
    "a view? Or is the front cramped against a wall?",
    "Green Dragon (left) & White Tiger (right), facing out from the front door: is "
    "the left side gently higher/stronger than the right?",
    "Poison arrows from outside: does a road, a roof edge, or a corner of another "
    "building point straight at your front door?",
    "Water: is there a pond, pool, drainage, or road (roads count as water) — where "
    "is it relative to the home?",
]


def field_checklist():
    """Return the Form-School observations only a person on-site can make."""
    return list(FIELD_CHECKLIST)
