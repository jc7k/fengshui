# Week 2 — Code Checkpoint

Use this to check your code is on track. If yours looks roughly like this and runs, you're done —
don't gold-plate it.

## What "working" looks like
```python
import elements, homes, analyzer

# 1. The two cycles
for e in elements.ELEMENTS:
    print(f"{e:>6}: generates {elements.generates(e):>6} | controls {elements.controls(e)}")

# 2. ✅ Check the engine against the reference table
wx = homes.load_reference('wu_xing')
gen_ok = all(elements.generates(e) == wx['generating_cycle'][e] for e in elements.ELEMENTS)
ctl_ok = all(elements.controls(e) == wx['controlling_cycle'][e] for e in elements.ELEMENTS)
print('✅' if gen_ok else '❌', 'generating cycle matches reference')
print('✅' if ctl_ok else '❌', 'controlling cycle matches reference')
assert gen_ok and ctl_ok

# 3. Relationships explain a pairing
for a, b in [('Fire', 'Metal'), ('Water', 'Wood'), ('Earth', 'Earth')]:
    rel = elements.relationship(a, b)
    print(f"{a} vs {b}: {rel} -> {elements.RELATIONSHIP_GLOSS[rel]}")

# 4. The element-aware tips  (this is the cell you write)
home = homes.load_home('sunny_studio')
for tip in analyzer.element_tips(home):
    print('-', tip['note'])
```

## Signs it's working
- All five elements print with both a "generates" and a "controls" partner.
- Both reference checks print ✅ and the `assert` passes silently.
- `Fire vs Metal` comes back `controls` — "controls/weakens (a draining clash)".
- Every tip's `note` names two elements and a relationship, e.g.
  `kitchen (Fire) is controlled/weakened by ... (Water).` — not just a bare flag.

## Common snags
- **`ModuleNotFoundError`** → you skipped the bootstrap cell. Run it first.
- **`AssertionError` on the ✅ check** → your cycle logic disagrees with
  `data/reference/wu_xing.json`. The reference file wins — read the two cycles in the primer
  again before touching code.
- **`KeyError` printing tips** → `element_tips` returns *dicts*, not strings. Print
  `tip['note']` (the other keys — `room`, `area`, `room_element`, `area_element`,
  `relationship` — are there when you want them).
- **Fewer tips than rooms** → expected. Rooms without an entry in the room-to-element table are
  skipped, not flagged.

## Honesty check
Your tips now come with reasons, and that can *feel* like proof. It isn't. The reasons are only
as good as the room-to-element table, and that table is a name-based simplification. **Do not
try to make the table smart this week.** An engine that provably matches the canonical cycles,
wired end to end, is the Week 2 deliverable.
