"""Draw the fallback link-preview card (static/social-card.png, 1200x630).

Usage:
    conda run -n snowclim python make_social_card.py

Shown when a page with no image of its own is shared (home, tracker, about,
text-only posts). Same ridgeline and palette as the site masthead.
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon

import config

W, H = 1200, 630
RIDGE, RIDGE_FAR, RIDGE_NEAR = "#1c3a5e", "#24507f", "#152e4d"
# Masthead silhouettes from templates/base.html (SVG coords, y down, 1200x150)
FAR = [(0, 150), (0, 96), (90, 64), (180, 84), (300, 46), (420, 74), (560, 30),
       (680, 62), (820, 40), (950, 70), (1080, 52), (1200, 72), (1200, 150)]
NEAR = [(0, 150), (0, 118), (140, 96), (280, 110), (420, 86), (560, 102),
        (720, 78), (880, 98), (1040, 84), (1200, 104), (1200, 150)]
RIDGE_H = 330          # px of card height the ridgeline occupies


def ridge(points, color):
    xy = [(x, (150 - y) / 150 * RIDGE_H) for x, y in points]
    return Polygon(xy, closed=True, facecolor=color, edgecolor="none")


fig = plt.figure(figsize=(W / 100, H / 100), dpi=100)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis("off")
fig.patch.set_facecolor(RIDGE)
ax.add_patch(ridge(FAR, RIDGE_FAR))
ax.add_patch(ridge(NEAR, RIDGE_NEAR))
ax.text(70, 455, config.SITE_TITLE, color="white", fontsize=64,
        fontfamily="Nimbus Roman", fontweight="bold", va="baseline")
ax.text(74, 385, config.SITE_TAGLINE, color="#b9d0e6", fontsize=27,
        fontfamily="Nimbus Roman", va="baseline")

out = config.STATIC_DIR / "social-card.png"
fig.savefig(out, dpi=100, facecolor=RIDGE)
print(f"[card] {out}")
