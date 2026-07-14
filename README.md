# The Feng Shui Home Analyzer 🧭🏠

A self-paced project that turns what you already know about **feng shui** into your
**first real coding project**. You'll build a working "Home Analyzer" — point it at
a home's facing direction and floor plan, and it maps the space, surveys every major
feng shui school, and tells you honestly where those schools *agree* and where they
*flatly disagree*.

> **Hi — this repo is yours.** You'll run the notebooks in Google Colab, take notes
> in the Obsidian vault, and slowly turn it into something you understand end to end.
> You already know some feng shui; here you'll learn to *compute* it. **You can ask
> Jeff for help at any time — there are no deadlines and no scheduled check-ins.**

---

## Quick start 🚀 (Google Colab — nothing to install)

You don't need Python, a terminal, or anything installed. Colab runs the notebooks in your
browser with just your Google account.

1. **Click this link:** [▶ Open Week 1 in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_1_Whole_Game.ipynb)
2. **Sign in** with your Google account if Colab asks.
3. If a warning says *"This notebook was not authored by Google"*, click **Run anyway** —
   Colab says that about every notebook that comes from GitHub.
4. In the menu, choose **Runtime → Run all** (or press `Shift+Enter` to run one cell at a
   time, top to bottom). The first cell fetches the project's code for you — that's normal.
5. To keep your changes: **File → Save a copy in Drive** (easiest), or
   **File → Save a copy in GitHub** once your GitHub is set up
   (see [GETTING_STARTED.md](GETTING_STARTED.md)).

Each week, come back and open the next notebook the same way:

| Week | Notebook |
|---|---|
| 1 — The Whole Game | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_1_Whole_Game.ipynb) |
| 2 — Elements & Bagua | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_2_Elements_and_Bagua.ipynb) |
| 3 — Eight Mansions | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_3_Eight_Mansions.ipynb) |
| 4 — Flying Stars | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_4_Flying_Stars.ipynb) |
| 5 — Form School | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_5_Form_School.ipynb) |
| 6 — BTB Contrast | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_6_BTB_Contrast.ipynb) |
| 7–8 — Capstone | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Week_7-8_Capstone.ipynb) |
| Bonus — Ba Zi | [▶ open in Colab](https://colab.research.google.com/github/jc7k/fengshui/blob/main/notebooks/Bonus_BaZi.ipynb) |

Stuck on anything at all? **Message Jeff.** That's the whole support plan, and it works. 😊

---

## The big idea: the *Whole Game* first

Most courses make you study theory for weeks before you build anything. We do the
opposite. In **Week 1 you build a complete, working analyzer** that reads a home end
to end. It will be crude — it ignores your birth data, the year the home was built,
even which school you follow. **That's the point.** Every week after, you bolt one
real school onto *that same tool* as a new lens.

🏠 *You learn a house by walking through it once on day one — then you go room by
room and see what each wall is holding up.*

| Week | You add (a new lens) | The analyzer goes from… |
|---|---|---|
| **1** | The whole game runs end-to-end | nothing → a crude but working map |
| **2** | The Five Elements engine (Wu Xing cycles) | naive flags → tips that explain *why* |
| **3** | Eight Mansions — your personal Kua directions | impersonal → tuned to the people living there |
| **4** | Flying Stars — the time-based natal chart | static → aware of *when* the home was built |
| **5** | Form School — command position, missing corners | interior-only → reads the shape of the space |
| **6** | BTB vs the compass bagua, side by side | one map → two honest maps that disagree |
| **7–8** | The capstone: one integrated, honest report | lenses → a real-feeling decision aid |
| **Bonus** | *(optional, with Jeff)* a Ba Zi calendar taster | — |

---

## Repository map

```
fengshui/
├── README.md                  ← you are here
├── GETTING_STARTED.md         ← do this first: GitHub, Colab, and the save-your-work loop
├── CLAUDE.md                  ← coding guidelines (for you and any AI helper)
├── pyproject.toml             ← the Python packages used (managed with uv)
├── data/
│   ├── homes/                 ← bundled sample homes (JSON floor plans) — the project's "dataset"
│   └── reference/             ← the tables the code is checked against (elements, mountains, Kua, charts)
├── notebooks/                 ← the weekly notebooks (open these in Colab)
├── obsidian-vault/            ← open this folder as an Obsidian vault (your textbook + notebook)
│   ├── 00-Overview/           ← Start-Here
│   ├── 01-Feng-Shui-Fundamentals/  ← 6 primers, read before the code that uses them
│   ├── 02 … 09/               ← one folder per module (guide, checkpoint, lab notes, reflection)
│   └── 99-Resources/          ← glossary, sample-home notes, links & citations
├── src/                       ← reusable helper code the notebooks import
│   ├── homes.py               ← load the sample homes + reference tables
│   ├── elements.py            ← Five Elements (Wu Xing) cycles
│   ├── bagua.py               ← trigrams, life areas, compass vs BTB overlays
│   ├── compass.py             ← degrees → directions & the 24 mountains
│   ├── eight_mansions.py      ← Kua number & personal directions
│   ├── flying_stars.py        ← the natal 9-palace chart
│   ├── floorplan.py           ← Form School geometry (command position, missing corners)
│   ├── viz.py                 ← matplotlib drawing helpers
│   ├── analyzer.py            ← the Home Analyzer façade (the "whole game" entry point)
│   └── report.py              ← the capstone integrator + conflict table
└── scripts/checks.py          ← smoke tests: does the code match the reference tables?
```

---

## How to start (the 60-second version)

1. Read **[GETTING_STARTED.md](GETTING_STARTED.md)** — making the repo yours, opening a
   notebook in Colab, saving your work back to GitHub.
2. Open **`obsidian-vault/`** as a vault in [Obsidian](https://obsidian.md), and read
   **`00-Overview/Start-Here.md`**.
3. Read the two short primers for Week 1 in **`01-Feng-Shui-Fundamentals/`**.
4. Open **`notebooks/Week_1_Whole_Game.ipynb`** in Colab (there's an "Open in Colab"
   badge at the top) and run it top to bottom.
5. Come back and fill in that week's **Lab-Notes** and **Reflection**.

Then repeat for each week, at whatever pace feels right.

---

## Prefer to run on your own computer? (optional)

Colab needs no install and is the easy path. To run locally in **VS Code** or Jupyter,
the project uses [**uv**](https://docs.astral.sh/uv/):

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh   # install uv (macOS / Linux)
uv sync                                            # build the environment
```

Full step-by-step is in **[GETTING_STARTED.md](GETTING_STARTED.md) § "Run locally in VS Code"**.

---

## About the "data"

Unlike a machine-learning project, this one needs no downloaded dataset. The homes are
a handful of hand-authored floor plans in **`data/homes/`**, and the feng shui reference
tables live in **`data/reference/`** — small enough to read by eye. The code is *checked*
against those tables (run `python scripts/checks.py`), which is this project's version of
"accuracy": does it reproduce the published charts and tables? (Details in
`obsidian-vault/99-Resources/Sample-Homes-Notes.md`.)

---

## An honest disclaimer ⚠️

Feng shui is a **traditional art and cultural practice, thousands of years old — not an
empirical science.** This project treats it with respect *and* with candor: the schools
disagree with each other, "facing direction" is genuinely hard to measure, and nothing
here changes anyone's real luck, health, or wealth. It is **cultural literacy and a coding
vehicle** — a beautiful, structured tradition that happens to be a wonderful thing to learn
to compute. Read `01-Feng-Shui-Fundamentals/A-Note-on-Honesty.md` first.
