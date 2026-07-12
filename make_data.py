"""Build site data JSON from mtnsnow pipeline outputs (read-only on sources).

Products:
  docs/data/season_tracker.json  — climatology percentile bands + current-season
                                   cumulative snowfall, by day of water year
  docs/data/climatology.json     — monthly climo, season totals, top-20 storms,
                                   summary stats
  docs/assets/climo/*.png        — curated figure copies (mtime-gated)

Run standalone (`conda run -n snowclim python make_data.py`) or via build.py.
"""

import json
import shutil

import numpy as np
import pandas as pd

import config

DOWY_MAX = 366  # day-of-water-year index runs 1..366


def day_of_water_year(dates: pd.Series) -> np.ndarray:
    """Days since Oct 1 of the water year (Oct 1 = 1), leap-safe.

    Aligned by calendar month/day: Oct 1 is always DOWY 1 and Feb 29 gets its
    own slot, so non-leap years simply skip index 152.
    """
    dates = pd.to_datetime(dates)
    wy_start = pd.to_datetime({
        "year": dates.dt.year.where(dates.dt.month >= 10, dates.dt.year - 1),
        "month": 10, "day": 1,
    })
    dowy = (dates - wy_start).dt.days + 1
    # Re-anchor post-Feb-29 days of non-leap years so Mar 1 is always DOWY 153.
    leap_feb = pd.to_datetime({
        "year": wy_start.dt.year + 1, "month": 2, "day": 28,
    })
    is_nonleap = ~leap_feb.dt.is_leap_year
    after_feb28 = dates > leap_feb
    dowy = dowy + (is_nonleap & after_feb28).astype(int)
    return dowy.to_numpy()


def _round_list(arr, nd=1):
    return [round(float(v), nd) for v in arr]


def load_merged(resort: str) -> pd.DataFrame:
    df = pd.read_parquet(config.MTNSNOW_DERIVED / f"{resort}_merged_daily.parquet")
    df["date"] = pd.to_datetime(df["date"])
    return df


def usable_years(resort: str) -> set:
    seas = pd.read_csv(config.MTNSNOW_DERIVED / f"climo_seasonal_{resort}.csv")
    return set(seas.loc[seas["usable"], "water_year"].astype(int))


def cumulative_by_dowy(df: pd.DataFrame) -> pd.DataFrame:
    """Wide frame: index DOWY 1..366, one column per water year, cumulative inches.

    Missing obs days count as zero accumulation; the series is forward-filled to
    each year's last observed day and NaN beyond it.
    """
    d = df.copy()
    d["dowy"] = day_of_water_year(d["date"])
    d["snowfall_in"] = d["snowfall_in"].fillna(0.0).clip(lower=0.0)
    wide = (d.pivot_table(index="dowy", columns="water_year",
                          values="snowfall_in", aggfunc="sum")
            .reindex(range(1, DOWY_MAX + 1)))
    # Cumulate treating gaps inside the observed span as zero-snow days.
    last_obs = {wy: int(g["dowy"].max()) for wy, g in d.groupby("water_year")}
    cum = wide.fillna(0.0).cumsum()
    for wy in cum.columns:
        cum.loc[cum.index > last_obs[int(wy)], wy] = np.nan
    return cum


def build_season_tracker() -> dict:
    out = {"generated": pd.Timestamp.now().strftime("%Y-%m-%d"), "resorts": {}}
    for resort, meta in config.RESORTS.items():
        df = load_merged(resort)
        ok_years = usable_years(resort)
        cum = cumulative_by_dowy(df)
        current_wy = int(df["water_year"].max())

        hist_cols = [wy for wy in cum.columns
                     if int(wy) in ok_years and int(wy) != current_wy]
        hist = cum[hist_cols]
        bands = {}
        for p in (10, 25, 50, 75, 90):
            q = hist.quantile(p / 100.0, axis=1)
            # Percentile of NaN-padded tails can dip; enforce monotone for display.
            bands[f"p{p}"] = _round_list(np.maximum.accumulate(q.ffill().fillna(0.0)))

        cur = cum[current_wy] if current_wy in cum.columns else pd.Series(dtype=float)
        cur_valid = cur.dropna()
        cur_dates = df.loc[df["water_year"] == current_wy, "date"]
        out["resorts"][resort] = {
            "name": meta["name"],
            "n_seasons": len(hist_cols),
            "bands": bands,
            "current": {
                "water_year": current_wy,
                "cumulative_in": _round_list(cur_valid.to_numpy()),
                "start_dowy": int(cur_valid.index.min()) if len(cur_valid) else 1,
                "last_obs_date": cur_dates.max().strftime("%Y-%m-%d") if len(cur_dates) else None,
                "total_in": round(float(cur_valid.iloc[-1]), 1) if len(cur_valid) else 0.0,
            },
        }
        print(f"[tracker] {resort}: {len(hist_cols)} climatology seasons, "
              f"WY{current_wy} total {out['resorts'][resort]['current']['total_in']}\" "
              f"through {out['resorts'][resort]['current']['last_obs_date']}")
    return out


def build_climatology() -> dict:
    with open(config.MTNSNOW_DERIVED / "climo_percentiles.json") as f:
        pct = json.load(f)

    out = {"generated": pd.Timestamp.now().strftime("%Y-%m-%d"),
           "month_names": [config.MONTH_NAMES[m] for m in config.MONTH_ORDER],
           "resorts": {}}
    for resort, meta in config.RESORTS.items():
        mon = pd.read_csv(config.MTNSNOW_DERIVED / f"climo_monthly_{resort}.csv")
        mon = mon.set_index("month").reindex(config.MONTH_ORDER)
        seas = pd.read_csv(config.MTNSNOW_DERIVED / f"climo_seasonal_{resort}.csv")
        seas = seas[seas["usable"]]
        storms = pd.read_csv(config.MTNSNOW_DERIVED / f"top20_storms_{resort}.csv")

        out["resorts"][resort] = {
            "name": meta["name"],
            "base_ft": meta["base_ft"],
            "summit_ft": meta["summit_ft"],
            "summary": pct[resort],
            "monthly": {c: _round_list(mon[c].fillna(0.0)) for c in
                        ("mean", "median", "p25", "p75")},
            "seasons": [
                {"wy": int(r.water_year), "total_in": round(float(r.total_in), 1),
                 "snow_days": int(r.snow_days),
                 "max_daily_in": round(float(r.max_daily_in), 1)}
                for r in seas.itertuples()
            ],
            "storms": [
                {"start": r.start, "end": r.end, "days": int(r.duration_days),
                 "total_in": round(float(r.total_in), 1),
                 "max_daily_in": round(float(r.max_daily_in), 1),
                 "wy": int(r.water_year)}
                for r in storms.itertuples()
            ],
        }
        print(f"[climo] {resort}: {len(seas)} usable seasons, "
              f"{len(storms)} storms, mean {pct[resort]['mean_seasonal_total_in']}\"")
    return out


def copy_figures():
    dest_dir = config.OUTPUT_DIR / "assets" / "climo"
    dest_dir.mkdir(parents=True, exist_ok=True)
    copied = []
    for rel, _caption in config.CLIMO_FIGURES:
        src = config.MTNSNOW_FIGS / rel
        dest = dest_dir / src.name
        if not src.exists():
            print(f"[figs] WARNING missing source: {src}")
            continue
        if not dest.exists() or src.stat().st_mtime > dest.stat().st_mtime:
            shutil.copy2(src, dest)
            copied.append(src.name)
    print(f"[figs] copied {len(copied)} figure(s)" + (f": {copied}" if copied else ""))


def make_all():
    data_dir = config.OUTPUT_DIR / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    with open(data_dir / "season_tracker.json", "w") as f:
        json.dump(build_season_tracker(), f, separators=(",", ":"))
    with open(data_dir / "climatology.json", "w") as f:
        json.dump(build_climatology(), f, separators=(",", ":"))
    copy_figures()


if __name__ == "__main__":
    make_all()
