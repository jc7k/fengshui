# Feng Shui's Origins (Wind & Water)

> Read this after the fundamentals primers listed in [[Module-Guide|Week 1's Module Guide]],
> before you code. It's the backstory — where the words you're about to type actually came from.

## Why it matters
This week you will flatten a home into a 3×3 grid of room names plus one number,
`facing_degrees`. That is a brutal abstraction, and you should see what it abstracts *from*
before you accept it: a siting tradition roughly **two thousand years** old (older, if you count
its ancestors), which read whole landscapes before anyone thought to read a floor plan. The
family tree of methods is mapped in [[../01-Feng-Shui-Fundamentals/Schools-Overview|Schools Overview]];
this note is about where the whole family came from, and what our code quietly leaves behind.

## Where "wind and water" comes from
The oldest layer isn't called feng shui at all. It's **kanyu (堪輿)** — the art of siting
**graves and settlements** so they sat well in the land. The word appears in Han-dynasty
sources (the *Huainanzi*, 2nd century BCE), and the practice it names is older still: choosing
where the dead lie and the living build was serious business long before anyone wrote a manual
for it. The practice is older than its modern name.

The modern name comes from one book. The ***Zangshu* (葬書, Book of Burial)** — traditionally
attributed to **Guo Pu** (276–324 CE), a scholar and diviner of the Eastern Jin — teaches that
**qi rides the wind and scatters, and halts when it meets water**. A good site therefore
shelters from wind and keeps water before it. Those two operative words, *feng* (wind) and
*shui* (water), became the art's name.

⚠️ An honesty note, because this project runs on them: that attribution is **genuinely
contested**. The earliest surviving bibliographies, from the Tang, list a *Zangshu* with no
author; Guo Pu's name is first attached in a **Song-dynasty catalogue**, centuries after his
death, and some scholars argue the text we have was composed or heavily edited in the Song
(10th–13th century). So "4th century" really means "attributed to the 4th century." Early feng
shui dates are like early feng shui measurements: write down the number, but know how it was
taken.

The ideas underneath are older and broader than any one book. The trigrams you met in
[[../01-Feng-Shui-Fundamentals/The-Eight-Trigrams-and-Bagua|The Eight Trigrams & Bagua]] come from
the **I Ching (易經)**, and the yin-yang and five-phases cosmology running through everything
traces to **Zou Yan's school** (c. 305–240 BCE, Warring States) — a way of reading the world as
cycles of complementary forces, later systematized into state doctrine under the **Han**.

Around the **Tang and Song dynasties** the tradition forked into the two great streams you'll
build: the **Form school**, which reads visible landscape (hills, water, sight lines — Yang
Yun-Sung, ~9th century), and the **Compass school**, which reads invisible directional energy
with the luopan. Form is [[../06-Week-5-Form-School/Form-School-and-the-Four-Animals|Week 5]];
the compass methods are Weeks 3–4, peaking in
[[../05-Week-4-Flying-Stars/Flying-Stars-Xuan-Kong|Week 4's Flying Stars]].

The canonical showcase of all of it is the **Forbidden City** (completed **1420**). Beijing's
site had no mountain at the palace's back — so the Ming builders **raised one**: Jingshan, an
artificial hill piled up behind (north of) the palace from moat-excavation spoil, while the
**Golden Water River** was channeled to flow across the front. Mountain behind, water in front:
you'll meet that template formally as
[[../06-Week-5-Form-School/Form-School-and-the-Four-Animals|Week 5's Four Animals]].

The 20th century nearly ended the story on the mainland: feng shui was suppressed as
superstition, branded one of the "Four Olds" in the Cultural Revolution, its practitioners
persecuted and books burned. It survived in **Hong Kong, Taiwan, and Southeast Asia's Chinese
communities**, and from the **1970s** spread west — which is where
[[../07-Week-6-BTB-Contrast/BTB-and-Compass-Bagua|Week 6]]'s door-aligned BTB school was born.

## From landscape to floor plan
Our analyzer keeps three things from all that history: the **plan geometry** (the grid of
rooms), the **front door**, and the **facing direction** in degrees. It discards the landform
(restored in Week 5), the occupants (Week 3), and time (Week 4). Week 1 isn't wrong so much as
*early* — each later week hands back something this week throws away.

Here's the one real computation, done by hand. The circle is cut into **eight sectors of 45°**,
each centered on its cardinal or ordinal point: North owns 337.5°–22.5° (its band wraps past
zero), Northeast 22.5°–67.5°, East 67.5°–112.5°, Southeast 112.5°–157.5°, **South
157.5°–202.5°**, Southwest 202.5°–247.5°, West 247.5°–292.5°, Northwest 292.5°–337.5°.

`sunny_studio` faces **178.0°**. Run down the list: 178 is more than 157.5 and less than
202.5 — it lands in **South's band**. Done. That's the entirety of what
`compass.direction_of(178.0)` computes (it shifts by half a sector and integer-divides:
`(178.0 + 22.5) % 360 // 45 = 4`, and index 4 in the clockwise list is "South"). When the code
prints "South" this week, you'll know it did nothing you can't do on paper.

## Words you'll meet

| 漢字 | Pinyin | Literal meaning |
| --- | --- | --- |
| 風水 | fēng shuǐ | "wind–water" |
| 堪輿 | kānyú | roughly "heaven and earth" — the older name for the art |
| 氣 | qì | breath, air; the "vital energy" of the tradition |
| 易經 | Yìjīng | "Classic of Changes" — the I Ching |
| 八卦 | bāguà | "eight trigrams" |
| 羅盤 | luópán | "net plate" (all-encompassing plate) — the feng shui compass |

(We use traditional characters throughout the vault, since that's what the classical texts and
most Hong Kong / Taiwan lineages use.)

## What a first visit looks like today
A modern practitioner's first pass at a home still rhymes with grave-siting on a hillside.
Typically they will **walk the exterior first** — street, neighbors, slopes, what faces the
door — then **measure the door's bearing**, usually taking several readings from different
spots, because steel framing, rebar, and wiring genuinely drag a compass needle. Then a
**sketch of the floor plan**, and an **interview**: who lives here, who sleeps where, what's
been going wrong. Apartments force adaptations the classics never imagined — practitioners
genuinely debate whether the *unit* door or the *building* entrance is "the" mouth of the home,
and different lineages answer differently.

Hold that picture while you code: Week 1's analyzer is the **first ten minutes of a real
consultation, minus the human eyes** — the plan, the door, one bearing, and nothing else.

## The metaphor 🏠
Feng shui's history is a **family home renovated by every generation**. The Han poured the
foundations (yin-yang, five phases, kanyu siting). The Tang and Song built the two main wings —
Form and Compass — that everything since sits inside. The Ming added the grand showpiece facade
(the Forbidden City is the display home). And in the 1970s an American extension went up (BTB),
built fast, in a different style, and argued about by the older residents ever since. You're
inheriting this house, not building it — the skill is learning **which walls are load-bearing**
before you knock anything through.

## How we compute it in code
- `homes.load_home('sunny_studio')` → the whole abstraction: a grid of rooms + `facing_degrees`.
- `viz.plot_home(home)` → draws the plan with the door marked.
- `compass.direction_of(degrees)` → the 45°-sector snap you just did by hand.
- `analyzer.room_areas(home)` → lays the (BTB, door-aligned) bagua over the rooms.
- `analyzer.naive_recommendations(home)` → the deliberately crude Week 1 tips.

## Talk it through
- With a practitioner: "Do you think of what you practice as feng shui, kanyu, or something
  else — and how far back do you trace your own lineage?"
- For yourself: `north_house` faces **2.0°**. Snap it to a sector by hand *before* calling
  `compass.direction_of` — and notice which band it falls in. (Careful: this is the one band
  that wraps past 0°.)

➡️ Next: [[Module-Guide|Week 1's Module Guide]].
