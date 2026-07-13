"""
eight_mansions.py — the Eight Mansions (Ba Zhai) school: your personal directions.

This is the first module that cares about the PERSON, not just the building. From
your birth year and gender it computes your Kua (Ming Gua) number 1-9, which sorts
you into the East group or the West group and assigns a feng shui quality to each
of the eight directions — four auspicious, four inauspicious. Practitioners use
these to orient a bed, a desk, or a stove.

Two honesty notes baked in:
  * The formula changed at the year 2000 (see the branches below). Online
    calculators that never updated give wrong answers for people born after 2000.
  * The feng shui year starts near Feb 4 (Li Chun / "start of spring"), NOT Jan 1.
    Someone born in January belongs to the PREVIOUS year. Feb 4 is itself an
    approximation (the exact instant shifts year to year), so births in early
    February are a genuine gray zone — pass the month/day and we adjust, but say so.

The direction table is loaded from data/reference/kua_table.json and the Week 3
notebook asserts kua_number() against its published examples.

Primer: obsidian-vault/04-Week-3-Eight-Mansions/Eight-Mansions-Ba-Zhai.md
"""

from homes import load_reference

_KUA = load_reference("kua_table")
_DIRECTIONS = _KUA["directions"]
GROUPS = _KUA["groups"]
AUSPICIOUS = set(_KUA["quality_names"]["auspicious"])

# The feng shui year turns near this date (Li Chun). Approximate on purpose.
LICHUN_MONTH, LICHUN_DAY = 2, 4


def _reduce(n):
    """Reduce a number to a single digit 1-9 (treating a reduced 0 as 9)."""
    while n > 9:
        n = sum(int(c) for c in str(n))
    return 9 if n == 0 else n


def solar_year(year, month=None, day=None):
    """The feng shui (solar) year for a birth date.

    Births before ~Feb 4 count as the previous year. If month/day are omitted we
    take the year as given and leave the boundary to the user (an honest default,
    not a silent guess).
    """
    if month is None or day is None:
        return year
    if (month, day) < (LICHUN_MONTH, LICHUN_DAY):
        return year - 1
    return year


def kua_number(year, gender, month=None, day=None):
    """Kua / Ming Gua number (1-9) from birth year and gender ('male'/'female').

    gender is required because the traditional formula differs for men and women.
    Pass month/day to apply the ~Feb-4 year boundary.
    """
    if gender not in ("male", "female"):
        raise ValueError("gender must be 'male' or 'female'")
    male = gender == "male"
    y = solar_year(year, month, day)
    d = _reduce(y % 100)
    if y < 2000:
        raw = (10 - d) if male else (d + 5)
    else:
        raw = (9 - d) if male else (d + 6)
    kua = _reduce(raw)
    if kua == 5:  # Kua 5 is not used; it substitutes by gender.
        kua = 2 if male else 8
    return kua


def group(kua):
    """'East' or 'West' — the life group of a Kua number."""
    return "East" if kua in GROUPS["East"] else "West"


def direction_quality(kua, direction):
    """The Eight Mansions quality (e.g. 'Sheng Qi', 'Jue Ming') of a direction for a Kua."""
    return _DIRECTIONS[str(kua)][direction]


def is_auspicious(kua, direction):
    """True if a direction is one of a Kua's four auspicious directions."""
    return direction_quality(kua, direction) in AUSPICIOUS


def good_directions(kua):
    """The four auspicious directions for a Kua, as {direction: quality}."""
    return {d: q for d, q in _DIRECTIONS[str(kua)].items() if q in AUSPICIOUS}


def bad_directions(kua):
    """The four inauspicious directions for a Kua, as {direction: quality}."""
    return {d: q for d, q in _DIRECTIONS[str(kua)].items() if q not in AUSPICIOUS}
