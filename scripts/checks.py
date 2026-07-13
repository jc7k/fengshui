"""
checks.py — smoke tests for the src/ library, run against the reference fixtures.

This is the project's 'accuracy check': feng shui has no ML metric, so instead we
assert that the code reproduces published reference tables (Kua directions, the
Wu Xing cycles, real flying-star charts). Run it with:  python scripts/checks.py

Every check prints a friendly line. A failing check raises, so the run stops with
a clear traceback. The weekly notebooks re-run the checks relevant to their week.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

import bagua
import compass
import eight_mansions
import elements
import flying_stars
import floorplan
import homes
import report
from analyzer import element_tips, naive_recommendations, room_areas

PASS, FAIL = "✅", "❌"
_failures = 0


def check(label, condition):
    global _failures
    print(f"{PASS if condition else FAIL} {label}")
    if not condition:
        _failures += 1


# --- Elements (Week 2) -------------------------------------------------------
wx = homes.load_reference("wu_xing")
check("generating cycle matches reference",
      all(elements.generates(e) == wx["generating_cycle"][e] for e in elements.ELEMENTS))
check("controlling cycle matches reference",
      all(elements.controls(e) == wx["controlling_cycle"][e] for e in elements.ELEMENTS))
check("relationship() classifies Fire->Metal as controls",
      elements.relationship("Fire", "Metal") == "controls")

# --- Bagua / overlays --------------------------------------------------------
studio = homes.load_home("sunny_studio")
check("compass overlay is 3x3", len(bagua.compass_overlay()) == 3
      and all(len(r) == 3 for r in bagua.compass_overlay()))
check("BTB south-door bottom row is the door trio",
      bagua.btb_overlay("south")[2] == ["Knowledge", "Career", "Helpful People"])

# --- Compass / 24 mountains --------------------------------------------------
check("178° is South", compass.direction_of(178) == "South")
check("178° mountain is Wu", compass.mountain_of(178)["name"] == "Wu")
check("172.4° flagged as boundary (ambiguous)", compass.is_boundary(172.4))
check("178° not a boundary", not compass.is_boundary(178))

# --- Eight Mansions (Week 3): every published example ------------------------
kua_ref = homes.load_reference("kua_table")
for ex in kua_ref["examples"]:
    m = eight_mansions.kua_number(ex["year"], "male")
    f = eight_mansions.kua_number(ex["year"], "female")
    check(f"Kua {ex['year']}: male={m} female={f}", m == ex["male"] and f == ex["female"])
check("Li Chun boundary: Jan 1980 male counts as 1979 (Kua 4)",
      eight_mansions.kua_number(1980, "male", 1, 15) == eight_mansions.kua_number(1979, "male"))

# --- Flying Stars (Week 4): reproduce published charts cell-for-cell ---------
for ref in homes.load_reference("flying_star_charts")["charts"]:
    chart = flying_stars.natal_chart(ref["period"], ref["facing_degrees"])
    ok = all(chart[d] == ref["palaces"][d] for d in ref["palaces"])
    check(f"flying-star chart {ref['id']} reproduced exactly", ok)
try:
    flying_stars.natal_chart(9, 172.4)
    check("ambiguous facing refused", False)
except flying_stars.AmbiguousFacing:
    check("ambiguous facing refused", True)

# --- Form School (Week 5): geometry on the sample homes ----------------------
L = homes.load_home("courtyard_L")
check("courtyard_L is missing its Northeast corner",
      floorplan.missing_corners(L) == ["Northeast"])
check("sunny_studio has no missing corners",
      floorplan.missing_corners(studio) == [])
check("studio bed shares the door's column (not commanding)",
      floorplan.command_position(studio, "bed")["in_command"] is False)
check("studio desk is in the commanding position",
      floorplan.command_position(studio, "desk")["in_command"] is True)

# --- Analyzer (Weeks 1-2) ----------------------------------------------------
check("room_areas labels every occupied room",
      len(room_areas(studio)) == sum(1 for _ in homes.rooms(studio)))
check("naive_recommendations returns tips", len(naive_recommendations(studio)) >= 1)
check("element_tips explain a relationship",
      all("relationship" in t for t in element_tips(studio)))

# --- Capstone report (Weeks 7-8) --------------------------------------------
occupants = [{"name": "A", "year": 1990, "gender": "female"}]
rep = report.full_report(studio, occupants)
check("report covers all four schools",
      set(["flying_stars", "form", "conflict_table", "occupants"]) <= set(rep))
check("conflict table has 9 sectors", len(rep["conflict_table"]) == 9)
check("conflict table finds at least one school disagreement",
      any(row["conflict"] for row in rep["conflict_table"]))
edge = homes.load_home("edge_case_flat")
check("edge_case_flat flying stars refuses (ambiguous facing)",
      report.full_report(edge)["flying_stars"]["ambiguous"] is True)

print()
if _failures:
    print(f"{FAIL} {_failures} check(s) failed.")
    sys.exit(1)
print("All checks passed.")
