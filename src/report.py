"""
report.py — the capstone: run every school on one home and be honest about it.

This is where the whole project's point lands. Each school is a different lens.
Run them all on the same home and two things happen: sometimes they agree, and
sometimes they flatly contradict each other. A report that hid the contradictions
would be lying. So the centerpiece here is the CONFLICT TABLE — for each physical
sector of the home, it lays the schools' verdicts side by side and marks where
they disagree.

Nothing here decides who is "right". That is not a bug. Feng shui is a family of
traditions, not one measurable truth (see A-Note-on-Honesty in the vault).

Primer: obsidian-vault/08-Week-7-8-Capstone/Module-Guide.md
"""

import eight_mansions
import flying_stars
import floorplan
from bagua import COMPASS_LAYOUT, DIRECTION_LIFE_AREA, btb_overlay, compass_overlay
from homes import find_feature

DISCLAIMER = (
    "This report is a learning exercise in a traditional art, not a measurement of "
    "anything. Feng shui schools disagree with each other (as the conflict table "
    "shows), facing directions are hard to measure, and none of this is empirical "
    "science. Treat it as cultural literacy and a coding project — not advice about "
    "your real luck, health, or wealth."
)


def _occupant_directions(occupants):
    """For each occupant, their Kua and East/West group."""
    result = []
    for person in occupants or []:
        kua = eight_mansions.kua_number(
            person["year"], person["gender"],
            person.get("month"), person.get("day"),
        )
        result.append({
            "name": person.get("name", "?"),
            "kua": kua,
            "group": eight_mansions.group(kua),
        })
    return result


def _flying_star_section(home):
    """The natal chart, or an honest refusal if the facing is ambiguous."""
    period = flying_stars.period_of(home["construction_year"])
    try:
        chart = flying_stars.natal_chart(period, home["facing_degrees"])
        return {"period": period, "chart": chart, "ambiguous": False}
    except flying_stars.AmbiguousFacing as exc:
        return {"period": period, "chart": None, "ambiguous": True, "reason": str(exc)}


def conflict_table(home, occupants=None):
    """Per physical sector, what each school says — and where they disagree.

    For every cell of the 3x3 overlay we compare the compass-school life area with
    the BTB life area (same room, two maps), attach the Flying Stars pair for that
    direction, and each occupant's Eight Mansions quality there. 'conflict' is True
    when the compass and BTB schools label the same sector differently.
    """
    door = find_feature(home, "door")
    btb = btb_overlay(door["wall"])
    compass_areas = compass_overlay()
    stars = _flying_star_section(home)
    people = _occupant_directions(occupants)

    rows = []
    for r in range(3):
        for c in range(3):
            direction = COMPASS_LAYOUT[r][c]
            compass_area = compass_areas[r][c]
            btb_area = btb[r][c]
            entry = {
                "direction": direction,
                "compass_area": compass_area,
                "btb_area": btb_area,
                "conflict": compass_area != btb_area,
            }
            if direction != "Center":
                if stars["chart"] is not None:
                    mtn, base, facing = stars["chart"][direction]
                    entry["flying_star"] = {"mountain": mtn, "base": base, "facing": facing}
                entry["eight_mansions"] = {
                    person["name"]: eight_mansions.direction_quality(person["kua"], direction)
                    for person in people
                }
            rows.append(entry)
    return rows


def full_report(home, occupants=None):
    """Run every lens on a home and return one structured, honest report."""
    return {
        "home": home["name"],
        "occupants": _occupant_directions(occupants),
        "flying_stars": _flying_star_section(home),
        "form": {
            "missing_corners": floorplan.missing_corners(home),
            "bed_command": floorplan.command_position(home, "bed"),
            "desk_command": floorplan.command_position(home, "desk"),
            "poison_arrows": floorplan.poison_arrows(home),
            "field_checklist": floorplan.field_checklist(),
        },
        "conflict_table": conflict_table(home, occupants),
        "disclaimer": DISCLAIMER,
    }
