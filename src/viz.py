"""
viz.py — drawing homes, bagua overlays, and flying-star charts.

Seeing is understanding. These helpers keep the notebooks short: one call instead
of ten lines of matplotlib. Everything uses matplotlib, which runs everywhere
including a fresh Colab runtime with no setup.

Grid convention (matching the JSON homes): row 0 is the NORTH edge, the last row
is SOUTH; column 0 is WEST, the last column is EAST.
"""

import matplotlib.pyplot as plt

from homes import grid_shape, thirds

# A soft color per element, for tinting sectors.
ELEMENT_COLOR = {
    "Wood": "#a8d5a2", "Fire": "#e8a0a0", "Earth": "#e8d5a0",
    "Metal": "#d8d8d8", "Water": "#a0c0e8",
}


def plot_home(home, ax=None):
    """Draw a home's room grid, with the front door marked."""
    rows, cols = grid_shape(home)
    if ax is None:
        _, ax = plt.subplots(figsize=(4 + cols, 4 + rows))
    for r in range(rows):
        for c in range(cols):
            label = home["grid"][r][c] if c < len(home["grid"][r]) else None
            y = rows - 1 - r  # flip so row 0 (north) is at the top
            if label is None:
                ax.add_patch(plt.Rectangle((c, y), 1, 1, fc="none", ec="#cccccc",
                                           ls="--", lw=1))
                continue
            ax.add_patch(plt.Rectangle((c, y), 1, 1, fc="#f5f5f5", ec="#555555"))
            ax.text(c + 0.5, y + 0.5, label, ha="center", va="center", fontsize=9)
    door = next((f for f in home.get("features", []) if f["type"] == "door"), None)
    if door:
        dr, dc = door["cell"]
        ax.plot(dc + 0.5, rows - 1 - dr + 0.5, "s", ms=14, mfc="none",
                mec="#d62728", mew=2.5, label="front door")
        ax.legend(loc="upper right", fontsize=8)
    _cardinal_frame(ax, rows, cols)
    ax.set_title(f"{home['name']} — facing {home['facing_degrees']}°")
    return ax


def plot_bagua_overlay(home, area_grid, title="Bagua overlay", ax=None):
    """Overlay a 3x3 life-area map (from bagua.btb_overlay / compass_overlay) on a home."""
    rows, cols = grid_shape(home)
    row_g, col_g = thirds(rows), thirds(cols)
    if ax is None:
        _, ax = plt.subplots(figsize=(4 + cols, 4 + rows))
    for r in range(rows):
        for c in range(cols):
            area = area_grid[row_g[r]][col_g[c]]
            label = home["grid"][r][c] if c < len(home["grid"][r]) else None
            y = rows - 1 - r
            ax.add_patch(plt.Rectangle((c, y), 1, 1, fc="#fbf7ef", ec="#c99"))
            ax.text(c + 0.5, y + 0.72, area, ha="center", va="center", fontsize=8,
                    color="#a03", fontweight="bold")
            if label is not None:
                ax.text(c + 0.5, y + 0.30, label, ha="center", va="center",
                        fontsize=8, color="#555")
    _cardinal_frame(ax, rows, cols)
    ax.set_title(title)
    return ax


def plot_school_comparison(home, compass_grid, btb_grid):
    """Two homes side by side: compass overlay vs BTB overlay (the conflict, visualized)."""
    rows, cols = grid_shape(home)
    fig, (left, right) = plt.subplots(1, 2, figsize=(8 + 2 * cols, 4 + rows))
    plot_bagua_overlay(home, compass_grid, "Compass school", ax=left)
    plot_bagua_overlay(home, btb_grid, "BTB (door-aligned)", ax=right)
    fig.tight_layout()
    return left, right


# Flying-star grid: South is up, North is down (the flying-star convention).
_STAR_LAYOUT = [
    ["Southeast", "South",  "Southwest"],
    ["East",      "Center", "West"],
    ["Northeast", "North",  "Northwest"],
]


def plot_flying_star_chart(chart, title="Flying star natal chart", ax=None):
    """Draw a 9-palace flying-star chart: mountain star, base star, facing star per palace."""
    if ax is None:
        _, ax = plt.subplots(figsize=(6, 6))
    for r in range(3):
        for c in range(3):
            direction = _STAR_LAYOUT[r][c]
            y = 2 - r
            ax.add_patch(plt.Rectangle((c, y), 1, 1, fc="#fbf7ef", ec="#555"))
            mtn, base, facing = chart[direction]
            ax.text(c + 0.22, y + 0.72, str(mtn), ha="center", va="center",
                    fontsize=12, color="#2a6")   # mountain star, top-left
            ax.text(c + 0.78, y + 0.72, str(facing), ha="center", va="center",
                    fontsize=12, color="#26a")   # facing star, top-right
            ax.text(c + 0.5, y + 0.34, str(base), ha="center", va="center",
                    fontsize=16, color="#333", fontweight="bold")  # base, center
            ax.text(c + 0.5, y + 0.08, direction, ha="center", va="center",
                    fontsize=7, color="#999")
    ax.set_xlim(-0.1, 3.1)
    ax.set_ylim(-0.1, 3.1)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_title(f"{title}\n(green=mountain, blue=facing, black=base; South up)")
    return ax


def _cardinal_frame(ax, rows, cols):
    """Shared axis cosmetics: equal aspect, N/E/S/W labels, no ticks."""
    ax.set_xlim(-0.4, cols + 0.4)
    ax.set_ylim(-0.4, rows + 0.4)
    ax.set_aspect("equal")
    ax.set_xticks([])
    ax.set_yticks([])
    ax.text(cols / 2, rows + 0.15, "N", ha="center", fontsize=11, fontweight="bold")
    ax.text(cols / 2, -0.28, "S", ha="center", fontsize=11, fontweight="bold")
    ax.text(-0.28, rows / 2, "W", va="center", fontsize=11, fontweight="bold")
    ax.text(cols + 0.15, rows / 2, "E", va="center", fontsize=11, fontweight="bold")
