# The Five Elements & Cycles (Wu Xing)

> Read this before [[../03-Week-2-Elements-and-Bagua/Module-Guide|Week 2]]. It's the engine you'll
> build in code.

## Why it matters
The **Five Elements** — Wood, Fire, Earth, Metal, Water (五行, *Wu Xing*) — are the shared
vocabulary of every feng shui school. Each direction, each trigram, each color, each room maps
to an element. The *relationships between elements* are what let feng shui say a pairing is
harmonious or clashing. In Week 2 you turn these relationships into a function that upgrades the
analyzer's tips from "this looks off" to "here's *why*."

Two cycles do all the work:

**Generating (sheng, 生) — each element feeds the next:**

| feeds → | |
|---|---|
| Wood → Fire | (wood burns) |
| Fire → Earth | (ash enriches soil) |
| Earth → Metal | (ore forms in ground) |
| Metal → Water | (metal collects/condenses water) |
| Water → Wood | (water grows plants) |

**Controlling (ke, 克) — each element keeps another in check:**

| controls → | |
|---|---|
| Wood → Earth | (roots break soil) |
| Earth → Water | (a dam holds water) |
| Water → Fire | (water quenches fire) |
| Fire → Metal | (fire melts metal) |
| Metal → Wood | (an axe cuts wood) |

A supportive room-to-area pairing rides the generating cycle; a clash rides the controlling one.

## The metaphor 🏠
Think of the five elements as **five roommates**. Some naturally help each other (one cooks,
one shops — generating). Some rub each other wrong (one blasts music while the other studies —
controlling). Feng shui is roommate-matching for the qualities of your rooms.

## How we compute it in code
`src/elements.py` loads the two cycles from `data/reference/wu_xing.json` and exposes:
- `elements.generates("Wood")` → `"Fire"`
- `elements.controls("Fire")` → `"Metal"`
- `elements.relationship(a, b)` → one of `same / generates / generated_by / controls /
  controlled_by`, so a recommendation can *name* the relationship.

The Week 2 notebook asserts this module reproduces the reference table exactly — that's your
"it works" check.

## Talk it through
- With a practitioner: "When a room's element clashes with its location, do you *move* the room
  or *add a bridging element* to soften it?" (There's a classic trick: insert the element that
  sits between the two clashing ones in the generating cycle.)
- For yourself: your kitchen is Fire. What element is the *direction* your kitchen sits in, and
  do Fire and that element generate or control each other?

➡️ Next: [[The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]].

> Deep end: [[../03-Week-2-Elements-and-Bagua/Five-Elements-in-Depth-Wu-Xing|The Five Elements in Depth]] — the history, the weakening cycle, and the classic remedy move.
