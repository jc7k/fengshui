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
    seen = {}
    for i, person in enumerate(occupants or []):
        kua = eight_mansions.kua_number(
            person["year"], person["gender"],
            person.get("month"), person.get("day"),
        )
        # Names key the per-sector table in conflict_table, so they must be
        # unique: default the nameless, and number duplicates.
        name = person.get("name") or f"occupant {i + 1}"
        count = seen[name] = seen.get(name, 0) + 1
        if count > 1:
            name = f"{name} ({count})"
        result.append({
            "name": name,
            "kua": kua,
            "group": eight_mansions.group(kua),
        })
    return result


def _flying_star_section(home):
    """The natal chart, or an honest refusal if the year or facing can't be charted."""
    try:
        period = flying_stars.period_of(home["construction_year"])
    except ValueError as exc:
        return {"period": None, "chart": None, "ambiguous": True, "reason": str(exc)}
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
    return _conflict_rows(home, _flying_star_section(home), _occupant_directions(occupants))


def _conflict_rows(home, stars, people):
    """conflict_table's body, taking precomputed stars/people so full_report can
    share one computation with its other sections."""
    door = find_feature(home, "door")
    if door is None:
        raise ValueError("the conflict table needs the BTB overlay, which is anchored "
                         "to the front door — add a 'door' feature to this home "
                         "(see data/homes/*.json)")
    btb = btb_overlay(door["wall"])
    compass_areas = compass_overlay()

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
    stars = _flying_star_section(home)
    people = _occupant_directions(occupants)
    return {
        "home": home["name"],
        "occupants": people,
        "flying_stars": stars,
        "form": {
            "missing_corners": floorplan.missing_corners(home),
            "bed_command": floorplan.command_position(home, "bed"),
            "desk_command": floorplan.command_position(home, "desk"),
            "poison_arrows": floorplan.poison_arrows(home),
            "field_checklist": floorplan.field_checklist(),
        },
        "conflict_table": _conflict_rows(home, stars, people),
        "disclaimer": DISCLAIMER,
    }
