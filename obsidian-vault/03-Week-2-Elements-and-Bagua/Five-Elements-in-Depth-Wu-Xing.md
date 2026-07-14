# The Five Elements in Depth (Wu Xing)

> Read this AFTER [[../01-Feng-Shui-Fundamentals/The-Five-Elements-and-Cycles|The Five Elements & Cycles]].
> That primer is the shallow end — the two cycles you're about to code. This note is the deep end:
> where the system comes from, what lies beyond the two cycles, and how practitioners actually use
> it in a home. Nothing here is required to pass Week 2's checks; all of it is required to *talk*
> about what you built.

## Why it matters
You can implement `generates()` and `controls()` in ten lines and pass the reference check without
knowing any of this. But the moment you show an element-aware tip to someone who knows feng shui,
the questions arrive: *why is it called an element if it isn't a substance? What about the
weakening cycle? Fine, it's a clash — now what do I do about it?* This note arms you for all three,
and marks precisely where our code stops answering.

## Five phases, not five substances
The earliest canonical listing of the five is the **"Great Plan"** (**Hong Fan**, 洪範) chapter of
the *Book of Documents* (**Shujing**, 書經). It names them in the order Water, Fire, Wood, Metal,
Earth, and pairs each with a quality and a flavor — Water "soaks downward" and gives saltiness,
Fire "blazes upward" and gives bitterness. Notice what that is: not a parts list, but a catalogue
of *behaviors*. How old the chapter is turns out to be contested — tradition puts it at the founding
of the Zhou dynasty (eleventh century BCE), while modern scholars date the text itself much later:
A. C. Graham argues for sometime before 400 BCE, and Needham placed it as late as the third
century BCE. Honest answer: "very old, exact age disputed."

The five stayed a loose catalogue until **Zou Yan** (鄒衍, c. 305–240 BCE), a scholar of the Jixia
Academy in the Warring States period, systematized them — welding the five to yin-yang theory and,
famously, to politics: each dynasty ruled under one phase, and was conquered by the dynasty of the
phase that overcomes it. (His own writings are lost; we know him mainly through Sima Qian's
*Records of the Grand Historian*.) From there the correspondences spread everywhere: medicine
mapped the five onto organs and pulses, music onto the five tones, statecraft onto dynastic
succession — and feng shui onto directions, seasons, colors, and rooms.

Which is why "Five Elements" is a slightly misleading name. The 行 in **五行** (*wǔ xíng*) means
**"goings," "movements"** — the same character as "to walk." Seventeenth-century Jesuit
missionaries, seeing a resemblance to the Greek earth-air-fire-water, translated it "elements,"
and the name stuck; the sinologist Nathan Sivin's counter-proposal, **"five phases"** (1987), is
now the scholarly standard. The difference matters: Water the phase isn't H₂O. It's the *sinking,
storing, still* moment of any process — winter, night, rest, a career gestating. Wood is rising
growth; Fire is peak expression; Earth is centering and ripening; Metal is contraction and
refinement. Five verbs wearing the costumes of five nouns.

## Beyond the two cycles
The primer gave you generating (**sheng**, 生) and controlling (**ke**, 剋). Classical theory has
more. The **weakening** relationship (**xie**, 洩 — "to drain") is simply the generating cycle read
*backwards*: producing a child exhausts the mother, so Fire drains Wood, Earth drains Fire, and so
on around the loop. Practitioners use it constantly, because draining an excess is gentler than
attacking it. And Chinese medicine adds two pathological reversals of the control cycle:
**overacting** (乘, *chéng*), where a too-strong element bullies the one it normally just checks,
and **insulting** (侮, *wǔ*), where the controlled element turns and rebels against its controller.
You don't need those two for feng shui homework — but you'll meet the words, and now they won't
surprise you.

The most useful pattern to take away is the classic **remedy move**: when two elements clash on
the controlling cycle, don't fight the clash — **bridge it** with the element that sits *between*
them on the generating cycle. The attacker's energy flows into the bridge, and the bridge feeds
the victim. One insertion turns a fight into a relay.

⚠️ **Where our code stops:** `src/elements.py` implements *only* the generating and controlling
cycles — exactly what `data/reference/wu_xing.json` contains and the notebook asserts.
`elements.relationship(a, b)` will never answer "weakens"; a weakening pair simply comes back as
`generated_by`, and the two medical reversals don't exist in the model at all. That's a deliberate
scope line, not an oversight: two checkable cycles you can verify beat five you can't.

## The correspondence table
The full classical correspondence tables run to dozens of rows (organs, planets, emotions,
livestock…). Here is the slice a home analysis actually uses — directions and colors exactly as
`data/reference/wu_xing.json` stores them, rooms exactly as `ROOM_ELEMENT` in `src/analyzer.py`
assigns them:

| Element | Direction | Season | Color | Shape | Typical rooms (our table) |
|---|---|---|---|---|---|
| **Wood** 木 | East | Spring | Green | Tall, columnar | living, office |
| **Fire** 火 | South | Summer | Red | Triangular, pointed | kitchen, stove, dining |
| **Earth** 土 | Center | Late Summer | Yellow | Square, flat | bedroom |
| **Metal** 金 | West | Autumn | White | Round, domed | closet |
| **Water** 水 | North | Winter | Blue | Wavy, irregular | bath, entry, hall |

> An honesty note you've seen before and will see again: assigning a room one element by its
> *name* is a simplification. A real practitioner weighs the room's use, shape, colors, and
> contents — a red-painted office full of candles is not Wood. Our table is good enough to make
> the cycles do visible work, and honest enough to say so.

**Worked example.** A bath lands in the South sector — the Fame area, whose element is Fire. Walk
`relationship('Water', 'Fire')` by hand: not the same; `generates('Water')` is Wood, not Fire;
`generates('Fire')` is Earth, not Water; `controls('Water')` is Fire — match. Answer: `'controls'`,
glossed "a draining clash." Now the remedy move: on the generating cycle, **Wood sits between
Water and Fire** (Water feeds Wood, Wood feeds Fire). So a practitioner doesn't demolish the
bathroom — they add Wood: plants, green towels, a tall cabinet. The Water that was quenching Fame's
Fire now waters a plant that feeds it.

## Words you'll meet
| 漢字 | Pinyin | Literal |
|---|---|---|
| 五行 | wǔ xíng | "five goings" — the five phases |
| 木 | mù | wood, tree |
| 火 | huǒ | fire |
| 土 | tǔ | earth, soil |
| 金 | jīn | metal, gold |
| 水 | shuǐ | water |
| 生 | shēng | to give birth to — generate |
| 剋 | kè | to subdue — control |
| 洩 | xiè | to drain, leak — weaken |
| 相生相剋 | xiāngshēng xiāngkè | "mutual generation, mutual control" — the two cycles as one phrase |

## In a real home
Notice what the worked example did *not* recommend: moving a wall. Practitioners adjust with
**color, material, shape, and count** — a green rug is Wood, a metal bowl is Metal, a triangular
lamp is Fire. There's also a reading with no clash at all: **too much of one element** — an
all-white, all-metal room is "excess Metal," remedied by draining it (Water: glass, blue, wavy
lines). The professional habit worth copying is that remedies are **cheap and reversible**. If a
plant in the south bathroom does nothing, you're out one plant — which is also, quietly, good
epistemics: small, undoable interventions are how you handle a theory you can't fully verify.

## The metaphor 🏠
Week 2's Module Guide called the elements **five roommates** — each helps one housemate and clashes
with another. The weakening cycle is what happens when a roommate *leans too hard on the one who
helps them*: Wood helps Fire the way a patient roommate helps a needy one, and a Fire that takes
too much leaves its helper drained. Help flows one way; exhaustion is its receipt. And the remedy
move is pure roommate diplomacy: when two of them fight, you don't evict anyone — you seat the
mutual friend between them.

## How we compute it in code
Everything above funnels into a deliberately small surface in `src/elements.py`:
- `elements.generates(e)` / `elements.controls(e)` — the two cycles, loaded from
  `data/reference/wu_xing.json` so the tables stay visible and checkable.
- `elements.relationship(a, b)` — one of `same / generates / generated_by / controls /
  controlled_by`, covering every ordered pair. No `weakens`, on purpose (see the ⚠️ above).
- `elements.RELATIONSHIP_GLOSS` — the plain-language phrasing the analyzer's tips borrow.
- The Week 2 notebook's check cell asserts the module reproduces `wu_xing.json` exactly — your
  reference-check that the engine matches the canon this note just gave you the history of.

## Talk it through
- With a practitioner: "When you find a controlling clash, how do you choose between draining the
  strong element and bridging the pair? And how much do you trust room-by-name assignments?"
- For yourself: pick any two elements at random and narrate all of it — who generates whom, who
  controls whom, who drains whom, and which element would bridge them. If you can do that for
  three random pairs without looking at the table, you own the system.

➡️ Next: [[Module-Guide|Week 2's Module Guide]].
