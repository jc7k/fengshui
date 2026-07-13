# A Note on Honesty

> Read this before anything else. It's the frame for the whole project.

## Why it matters
You already know some feng shui, so you know it's a rich, beautiful, thousands-of-years-old
tradition. This project takes it **seriously** — we implement its real methods carefully and
check them against published references. But we're also going to be **honest** about three
things, and holding both attitudes at once is the whole point.

**1. Feng shui is an art, not a science.** There is no controlled study showing that moving
your bed changes your luck. That's not an insult to feng shui — it's just what kind of thing
it is: a system of meaning, aesthetics, and tradition, like poetry or a martial-arts form.
We build a tool that *computes the tradition faithfully*, not one that *proves anything*.

**2. The schools openly disagree.** Eight Mansions, Flying Stars, and BTB will give you
**different, sometimes opposite** advice about the same room. A dishonest tool would pick one
and hide the rest. Ours puts them side by side and marks the conflicts. When you reach the
Week 7–8 capstone, that conflict table is the most important thing on the screen.

**3. The measurements are genuinely fuzzy.** "Which way does the home face?" has competing
definitions, and a compass near steel and wiring drifts by degrees. One of our sample homes
faces a compass boundary on purpose, and the Flying Stars module **refuses to chart it** and
says "re-measure." That refusal is a feature, not a failure.

## The metaphor 🏠
Think of this like learning to read tarot, or the I Ching, or classical astrology *as a
programmer*. You can implement the rules precisely, render the chart beautifully, and respect
the tradition deeply — while never claiming the output is a measurement of reality. Precision
about the *rules* and honesty about the *claims* are not in tension. They're both forms of
respect.

## How this shows up in the code
- Every module has an "honesty note" in its docstring where it simplifies something.
- `src/report.py` builds a **conflict table** instead of a single verdict.
- `src/flying_stars.py` raises `AmbiguousFacing` rather than guessing.
- `src/analyzer.py` says out loud that its room-to-element table is a simplification.

## Talk it through
- With a feng shui practitioner you respect: "When two schools disagree about a room, how do
  *you* decide? Do you follow one lineage, or blend them?"
- With yourself: which parts of feng shui do you love as *tradition and aesthetics*, and does
  it bother you (or not) that they aren't empirical? There's no wrong answer — but it's worth
  knowing where you stand before you build a tool that takes a position.

➡️ Next: [[Chi-Yin-Yang|Chi, Yin & Yang]].
