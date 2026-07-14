"""
bazi.py — a tiny taster of Ba Zi (the Four Pillars), for the optional bonus.

Ba Zi ("eight characters") reads a birth moment as four "pillars" — year, month,
day, hour — each a pair of one Heavenly Stem and one Earthly Branch. The full
system is large and belongs to Chinese astrology more than to home feng shui, so
this module deliberately does ONLY the year pillar: enough to connect the Kua
birth-year work from Week 3 to the sexagenary (60-year) cycle, and no more.

Honesty note: a real Ba Zi reading needs all four pillars (and the day pillar in
particular takes a real calendar). This is a taste, not a reading. It also uses the
solar year — a January birth belongs to the previous year, same Li Chun boundary as
eight_mansions.py.

Primer: obsidian-vault/09-Bonus-BaZi/Four-Pillars-Ba-Zi.md
"""

from eight_mansions import solar_year

# The 10 Heavenly Stems, each with its element and yin/yang.
STEMS = [
    ("Jia", "Wood", "yang"), ("Yi", "Wood", "yin"),
    ("Bing", "Fire", "yang"), ("Ding", "Fire", "yin"),
    ("Wu", "Earth", "yang"), ("Ji", "Earth", "yin"),
    ("Geng", "Metal", "yang"), ("Xin", "Metal", "yin"),
    ("Ren", "Water", "yang"), ("Gui", "Water", "yin"),
]

# The 12 Earthly Branches, each with its zodiac animal.
BRANCHES = [
    ("Zi", "Rat"), ("Chou", "Ox"), ("Yin", "Tiger"), ("Mao", "Rabbit"),
    ("Chen", "Dragon"), ("Si", "Snake"), ("Wu", "Horse"), ("Wei", "Goat"),
    ("Shen", "Monkey"), ("You", "Rooster"), ("Xu", "Dog"), ("Hai", "Pig"),
]


def year_pillar(year, month=None, day=None):
    """The year pillar for a birth year: {stem, branch, element, polarity, animal}.

    Uses the sexagenary cycle anchored so that year 4 CE = Jia-Zi. Pass month/day
    to apply the ~Feb-4 solar-year boundary.
    """
    y = solar_year(year, month, day)
    stem_name, element, polarity = STEMS[(y - 4) % 10]
    branch_name, animal = BRANCHES[(y - 4) % 12]
    return {
        "stem": stem_name,
        "branch": branch_name,
        "element": element,
        "polarity": polarity,
        "animal": animal,
    }
