"""Scaffold a new post for The Cold Smoke Report.

Usage:
    conda run -n snowclim python new_post.py "Title of the post" \
        [--forecast] [--tags forecast,bridger] [--date YYYY-MM-DD]

--forecast pulls the latest mtnsnow forecast product: copies the plume figure
into this post's image dir and appends the P10/P50/P90 table with attribution.
"""

import argparse
import re
import shutil
from datetime import date
from pathlib import Path

import config


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s[:60] or "post"


def latest_forecast_dir() -> Path | None:
    if not config.MTNSNOW_BLOG.exists():
        return None
    tags = sorted(d.name for d in config.MTNSNOW_BLOG.iterdir()
                  if d.is_dir() and re.fullmatch(r"\d{10}", d.name))
    return config.MTNSNOW_BLOG / tags[-1] if tags else None


def forecast_block(post_date: str) -> str:
    fdir = latest_forecast_dir()
    if fdir is None:
        print("[forecast] no mtnsnow forecast directories found — skipping")
        return ""
    init = fdir.name  # YYYYMMDDHH
    init_str = f"{init[:4]}-{init[4:6]}-{init[6:8]} {init[8:]}Z"
    parts = []

    plume = fdir / "forecast_plume.png"
    if plume.exists():
        img_dir = config.POSTS_DIR / "images" / post_date
        img_dir.mkdir(parents=True, exist_ok=True)
        shutil.copy2(plume, img_dir / "forecast_plume.png")
        parts.append(f"![Forecast plume](%BASE%/assets/images/"
                     f"{post_date}/forecast_plume.png)")

    fmd = fdir / "forecast.md"
    if fmd.exists():
        lines = [ln for ln in fmd.read_text().splitlines()
                 if not ln.startswith("#")]
        parts.append("\n".join(lines).strip())

    parts.append(f"*Quantile ML forecast, GFS init {init_str}.*")
    return "\n\n".join(parts)


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("title")
    ap.add_argument("--forecast", action="store_true",
                    help="embed the latest mtnsnow forecast table + plume")
    ap.add_argument("--tags", default="forecast",
                    help="comma-separated tags (default: forecast)")
    ap.add_argument("--date", default=date.today().isoformat())
    args = ap.parse_args()

    slug = slugify(args.title)
    path = config.POSTS_DIR / f"{args.date}-{slug}.md"
    if path.exists():
        raise SystemExit(f"refusing to overwrite existing post: {path}")

    tags = "\n".join(f"  - {t.strip()}" for t in args.tags.split(",") if t.strip())
    body = f"""---
title: "{args.title}"
date: {args.date}
tags:
{tags}
---

<!-- discussion: write the forecast discussion here -->

"""
    if args.forecast:
        body += forecast_block(args.date) + "\n"
    path.write_text(body)
    print(f"created {path}")
    print("next: edit the post, then `python build.py` and git push")


if __name__ == "__main__":
    main()
