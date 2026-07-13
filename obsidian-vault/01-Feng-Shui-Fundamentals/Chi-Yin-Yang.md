# Chi, Yin & Yang

> Read this before [[../02-Week-1-Whole-Game/Module-Guide|Week 1]]. It's the "why" under every
> other idea in feng shui.

## Why it matters
Every feng shui recommendation, in every school, is ultimately about one thing: helping **chi**
(qi, 氣 — "life energy" or "vital breath") move through a space in a healthy way. Chi should
*meander*, like a slow river — not rush in a straight line, and not stagnate in a dead corner.
Almost every rule you'll code is a proxy for "does chi flow well here?"

**Yin and yang** are the two complementary qualities chi carries. Yin is quiet, dark, still,
receptive (a bedroom, a restful corner). Yang is bright, active, moving, expressive (a kitchen,
an entryway). Neither is "good" or "bad"; feng shui seeks **balance** appropriate to a room's
use — a bedroom leans yin, a home office leans yang.

You'll meet yin/yang again very concretely in Week 4: each of the 24 compass "mountains" is
tagged yin or yang, and that single bit decides which way the Flying Stars fly.

## The metaphor 🏠
Chi is like **air moving through a house**. You want a gentle cross-breeze — fresh air reaching
every room. A door directly in line with a window lets the breeze *rush straight through and
out* (chi gone before it nourishes anything). A sealed, cluttered room gets *stale* (stagnant
chi). Good feng shui is good ventilation for an invisible kind of air.

## How we compute it in code
We don't measure chi directly — nobody can. Instead the code works with **proxies** for good
and bad flow:
- A bed or desk directly in the door's straight line → `floorplan.poison_arrows()` flags
  "rushing chi." (Week 5)
- A whole life-area sector physically missing from the home → `floorplan.missing_corners()`.
- Yin/yang polarity of a compass mountain → drives `flying_stars.natal_chart()`. (Week 4)

So "chi" never appears as a variable — but nearly every check is a stand-in for it.

## Talk it through
- With a practitioner: "When you walk into a room, what tells you the chi is stuck or rushing?
  Is it a feeling, or specific things you look for?"
- For yourself: walk through where you live. Which room feels most *yang* (busy, bright)? Most
  *yin* (calm, still)? Does that match how you use it?

➡️ Next: [[The-Five-Elements-and-Cycles|The Five Elements & Cycles]].
