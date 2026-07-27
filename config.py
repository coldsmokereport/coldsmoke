"""Site-wide configuration for The Cold Smoke Report."""

from pathlib import Path

# ===== Identity =====
SITE_TITLE = "The Cold Smoke Report"
SITE_TAGLINE = "Snow forecasts for Bridger Bowl, Big Sky & Bozeman"
SITE_AUTHOR = "Trey"
SITE_DESCRIPTION = (
    "Daily forecast discussions, a season snowfall tracker, and deep snow "
    "climatology for southwest Montana — Bridger Bowl, Big Sky, and Bozeman."
)

# ===== URLs =====
# Project Pages site is served under /coldsmoke; local preview overrides with --base ''.
BASE_URL = "/coldsmoke"
# Absolute URL used in the Atom feed.
BASE_URL_ABS = "https://coldsmokereport.github.io/coldsmoke"

# ===== Repo paths =====
ROOT = Path(__file__).resolve().parent
POSTS_DIR = ROOT / "posts"
PAGES_DIR = ROOT / "pages"
TEMPLATES_DIR = ROOT / "templates"
STATIC_DIR = ROOT / "static"
OUTPUT_DIR = ROOT / "docs"

# ===== mtnsnow pipeline sources (READ-ONLY) =====
MTNSNOW_BLOG = Path("/home/trey/mtnsnow/blog")
MTNSNOW_DERIVED = Path("/data/trey/mtnsnow/obs/derived")
MTNSNOW_FIGS = Path("/data/trey/mtnsnow/figures")

RESORTS = {
    "bridger": {"name": "Bridger Bowl", "base_ft": 6100, "summit_ft": 8700},
    "bigsky": {"name": "Big Sky", "base_ft": 7500, "summit_ft": 11166},
}

# Curated climatology figures copied into the site (source name -> caption).
CLIMO_FIGURES = [
    ("phase2/monthly_climo_bridger.png",
     "Monthly snowfall climatology at Bridger Bowl."),
    ("phase2/monthly_climo_bigsky.png",
     "Monthly snowfall climatology at Big Sky."),
    ("phase2/seasonal_totals_bridger.png",
     "Season snowfall totals at Bridger Bowl across the full station record."),
    ("phase2/seasonal_totals_bigsky.png",
     "Season snowfall totals at Big Sky."),
    # Trimmed for launch simplicity (2026-07) — restore any of these later:
    # ("phase2/resort_compare.png",
    #  "Bridger Bowl vs. Big Sky: overlapping-season comparison."),
    # ("phase2/slr_monthly.png",
    #  "Snow-to-liquid ratio by month — why the cold smoke is so light."),
    # ("phase3/snow_rose.png",
    #  "Snow rose: which 700-mb wind directions deliver the goods."),
    # ("phase3/regime_snow_heatmap.png",
    #  "Snowfall odds by synoptic regime."),
    # ("phase3/regime_composites_k5.png",
    #  "The five synoptic regimes of SW Montana winters (500-mb composites)."),
]

MONTH_ORDER = [10, 11, 12, 1, 2, 3, 4, 5]  # water-year display order Oct..May
MONTH_NAMES = {10: "Oct", 11: "Nov", 12: "Dec", 1: "Jan", 2: "Feb",
               3: "Mar", 4: "Apr", 5: "May"}
