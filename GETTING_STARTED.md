# Getting Started 🚦

This guide gets you from "I have a GitHub account" to "I'm running my first notebook and
saving my work." Take it slow — and **message Jeff the moment anything is confusing.**

---

## 0. What you need (all free)

- A **GitHub** account.
- A **Google** account (for Google Colab — free, runs the notebooks in your browser, no install).
- Optional but recommended: **[Obsidian](https://obsidian.md)** (free) to read and write notes
  in the `obsidian-vault/` folder.

You do **not** need to install Python on your computer. Colab does all the heavy lifting.

---

## 1. Make this repo yours

You want **your own copy** so you can save your progress.

**Option A — Use this template (recommended):**
1. Open the repo on GitHub.
2. Click the green **Use this template** button → **Create a new repository**.
3. Name it `fengshui` and create it. Now there's an independent copy at
   `github.com/YOUR-USERNAME/fengshui` that is fully yours.

**Option B — It's already yours:** great, skip ahead.

Either way, note your **GitHub username** — you'll type it into each notebook once.

---

## 2. The Colab-from-GitHub workflow (the important part)

Every notebook in `notebooks/` has an **"Open in Colab" badge** at the very top. The badge
link follows this pattern (notice your username and the file name in it):

```
https://colab.research.google.com/github/YOUR-USERNAME/fengshui/blob/main/notebooks/Week_1_Whole_Game.ipynb
```

> ✅ The badges in the starter notebooks already point at `jc7k/fengshui`, so they work
> immediately — nothing to edit. If you make your own copy, swap in your username (in the
> badge link and in `GITHUB_USERNAME` below) so you run *your* version.

### Step-by-step
1. **Open the notebook:** click the "Open in Colab" badge.
2. **(Only if you made your own copy) tell the notebook who you are:** the first code cell
   ("Environment bootstrap") has a line:
   ```python
   GITHUB_USERNAME = "jc7k"  # change this only if you saved your own copy of the repo
   ```
   Out of the box it fetches the helper code in `src/` and the sample homes in `data/` from
   the original repo, so you can just run it. Once you have your own copy, put your username
   here so the notebook runs *your* version.
3. **Run it:** run the first cell, then the rest top to bottom with **Runtime → Run all**, or
   `Shift+Enter` cell by cell.

> ✅ **No data download, ever.** Unlike a machine-learning project, this one ships its whole
> "dataset" inside the repo — the sample homes are tiny JSON files. The bootstrap cell just
> clones the repo so the notebook can import `src/` and read `data/`. Nothing streams from the
> internet, so cells run instantly.

---

## 3. Saving your work back to GitHub (don't lose progress!)

Colab edits are **temporary** unless you save them:

1. In Colab: **File → Save a copy in GitHub**.
2. Pick your `fengshui` repository.
3. Keep the path `notebooks/<the same file name>.ipynb` so it overwrites the right file.
4. Add a short commit message like `Week 1 done — wrote my analyze cell`.
5. Click **OK**.

🏠 *Think of "Save a copy in GitHub" as locking your front door on the way out. Skip it and
Colab is a hotel room — your changes are gone when the runtime resets.*

---

## Run locally in VS Code (optional — instead of Colab)

Colab needs zero install and is the recommended path. To run on your own computer in **VS Code**,
the notebooks auto-detect they're not in Colab and skip the `GITHUB_USERNAME` step entirely.

### One-time setup
1. **Clone the repo** to your computer.
2. **Install uv:**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh      # macOS / Linux
   ```
   *(On Windows, PowerShell: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`.)*
3. **Build the environment** from the repo root:
   ```bash
   uv sync
   ```
4. **Install the VS Code extensions:** *Python* and *Jupyter* (both from Microsoft).

### Each time you work
1. Open the `fengshui` folder in VS Code.
2. Open a notebook in `notebooks/`.
3. Top-right **"Select Kernel"** → choose the **`.venv`** interpreter uv created.
4. **Run All**. The first cell sees you're not in Colab and simply adds `src/` to the path.

> 💾 Locally there's no "Save a copy in GitHub" step — your edits save straight to the files.
> Commit them with GitHub Desktop (or `git`) when you want to keep your progress.

> 🔎 Want to check the code is healthy? From the repo root run `python scripts/checks.py` — it
> asserts the library still matches every reference table (Kua, elements, flying-star charts).

---

## 4. Taking notes in the Obsidian vault

1. Install [Obsidian](https://obsidian.md) (free).
2. **Open folder as vault** → choose the `obsidian-vault/` folder.
3. Start at `00-Overview/Start-Here.md`.
4. As you work, fill in each week's **`Lab-Notes.md`** and **`Reflection.md`**. The
   `[[double-bracket links]]` jump between notes.

---

## 5. The weekly rhythm

For each module:
1. Read the week's **`Module-Guide.md`** in the vault.
2. Read the feng shui **primers** it links to (context before code).
3. Run the **notebook** in Colab; write the cells it asks you to write yourself.
4. **Save a copy in GitHub.**
5. Fill in **Lab-Notes** and **Reflection**.

That's the whole loop. Repeat at your own pace.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| The bootstrap cell can't clone (404 / "not found") | `GITHUB_USERNAME` in the first cell doesn't match a real copy of the repo. Keep `jc7k` (the original), or set it to your exact username. |
| `ModuleNotFoundError: No module named 'analyzer'` | The bootstrap cell didn't finish. Run it again (it clones the repo and adds `src/` to the path). |
| A flying-star cell says "ambiguous — re-measure" | That's not a bug! One sample home faces a compass boundary on purpose, so the tool refuses. See Week 4. |
| My changes disappeared | They weren't saved. Always **File → Save a copy in GitHub** before closing. |
| Anything else | **Message Jeff.** Seriously — that's what he's there for, anytime. |
