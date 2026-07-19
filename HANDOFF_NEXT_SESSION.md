# Handoff — next session

Three follow-on tasks for The Cold Smoke Report / mtnsnow, written to be actioned
in a fresh Claude Code window without the prior conversation. Two touch the
`~/mtnsnow` forecasting pipeline; one is the `~/coldsmoke` website. Absolute
paths throughout so a new session can orient quickly.

Environment reminders (from CLAUDE.md + hard-won gotchas):
- Snow/ML work runs in conda env `snowclim`. **Call the env python directly** —
  `/home/trey/miniconda3/envs/snowclim/bin/python` — because `conda run` buffers
  stdout so background logs look empty when they aren't.
- Website build runs in `snowclim` too (mistune/jinja2). Live at
  https://trey-alvey.github.io/coldsmoke/ , repo github.com/trey-alvey/coldsmoke,
  served from the `main` branch `/docs` folder. `gh` CLI is at `~/.local/bin/gh`.

---

## Task 1 — Real-time GFS / HRRR in the ML forecast

**Question:** can the ML snow forecast pull GFS/HRRR in real time to leverage them?

**Answer — GFS: already does. HRRR: not yet (verification only).**

- The operational forecast (`~/mtnsnow/06_ops/fetch_operational.py` →
  `make_forecast.py`, cron twice daily via `ops_daily.sh`) pulls **live GFS
  0.25°** through Herbie (source fallback aws/google/nomads), reshapes it into the
  ERA5-style predictor set the models were trained on, and runs the LightGBM
  quantile models. Its docstring is explicit: *"ops always runs on GFS (never
  ERA5)."* So real-time GFS leverage is done.
- **HRRR is fetched only for verification** (`~/mtnsnow/04_verif/download_hrrr_points.py`
  — APCP, ASNOW, 2 m T), never in the operational forecast path.

**Why adding HRRR is worth it (evidence already in hand):** the overproduction
study (`/data/trey/mtnsnow/verif/OVERPRODUCTION_FINDINGS.md`) found HRRR more
skillful than GFS at Bridger short leads (snow corr 0.61–0.65 vs 0.53–0.58) **but
with a large Big Sky wet bias (+0.57 to +0.77")**. So HRRR helps 1–48 h,
especially at Bridger, if the Big Sky bias is corrected.

**Task:**
1. Extend `fetch_operational.py` to also fetch HRRR via Herbie (`model='hrrr'`,
   subhourly/`pgrb2`), for fxx 1–48 h only (HRRR horizon; CONUS; v3+ = 2018+).
2. Decide the blend: simplest is **lead-time selection** — HRRR for ≤24–48 h,
   GFS beyond — or a weighted blend. Add HRRR-derived features and **retrain +
   re-verify** (baseline to beat: MAE 0.749" Bridger / 0.644" Big Sky). Apply the
   Big Sky HRRR bias correction found in the verification study.
3. New scripts only; write outputs to new paths. Keep GFS as the always-available
   fallback (HRRR is CONUS + short-lead + occasionally missing cycles).

Relevant files: `06_ops/fetch_operational.py`, `06_ops/make_forecast.py`,
`05_ml/{build_features,train_models,evaluate_models}.py`, and the verification
dataset builders in `04_verif/`.

---

## Task 2 — Base vs top: is the snow output elevation-scaled?

**Question:** are the snow outputs scaled for base vs top of Bridger?

**Answer — no.** Each resort's forecast is a **single number at the SNOTEL truth
elevation**, roughly mid-mountain, with no base/summit adjustment:
- Bridger truth = **Brackett Creek SNOTEL, 7,370 ft** (Bridger base 6,100 /
  summit 8,700 — so ~mid-mountain, and ~8 mi N of the ski area).
- Big Sky truth = **Lone Mountain SNOTEL, 8,820 ft** (Big Sky base 7,500 /
  summit 11,166 — low-mid mountain).

The LightGBM models are described as "downscaling models per resort" (GFS-scale →
point) but the point is the sensor's elevation. A summit skier gets more than the
forecast, a base skier less. Nothing in `05_ml/` or `06_ops/make_forecast.py`
scales to base/summit.

**Opportunity — base / mid / top forecasts.** Three ingredients already exist:
1. **Temperature lapse rate** from the GFS/ERA5 vertical profile (already fetched:
   t at 850/700/600/500). Higher = colder.
2. **SLR(T)** — colder → higher snow-to-liquid ratio → more *depth* per unit
   water. The 07_hourly `slr_diagnosis.py` produced a storm-basis SLR(T[,U]) refit
   (`/data/trey/mtnsnow/obs/derived/slr_diagnosis.json`).
3. **Orographic precip gradient** — more precip up high (the 700-mb-flow
   orographic work, `07_hourly/orographic_ratio.py`).
4. **A direct base-vs-top validation set you already scraped:** the Bridger Bowl
   station scrape (`07_hourly/scrape_bridger_wind.py`, cached raw JSON at
   `/data/trey/mtnsnow/obs/resort/bridger_wind_raw/`) pulled `new_snow` +
   temperature at **alpine (~base), midway (~mid), ridge (~top, 8,700 ft)** for
   ~7.5 seasons. That is an empirical base→mid→top new-snow gradient for Bridger,
   2018–present — build the elevation curve straight from it, then extrapolate
   with the lapse-rate + SLR + orographic physics for the years/stations without
   multi-elevation obs.

**Task:** build an elevation-scaling layer that turns the single mid-mountain
forecast into base/mid/top numbers, calibrated on the Bridger multi-station scrape
and physically extended via lapse rate + SLR(T). New scripts; surface base/mid/top
in the morning post + on the site. (Big Sky lacks multi-elevation obs — apply the
Bridger-derived gradient scaled by its own lapse rate, and say so.)

---

## Task 3 — Website redesign: traditional blog, unique, less "Claude-generated"

**Current state.** `~/coldsmoke/` is a static site: markdown posts →
`build.py` (jinja2 + mistune) → `docs/` → GitHub Pages. Design lives almost
entirely in `templates/base.html` + `static/style.css`. Current look: a condensed-
caps masthead over an SVG ridgeline, Source Serif body, midnight-blue + alpenglow
palette, a station-data bar. Clean, but it reads as a modern-Claude template
(condensed-caps masthead + serif body + one accent is now a common signature).

**Goal.** A **traditional blog** feel in the spirit of Wasatch Weather Weenies
(https://wasatchweatherweenies.blogspot.com/) — content-first, image-heavy, a real
right sidebar, dated entries, minimal chrome, personality-driven and a little
nerdy — but **visually distinct and unique to Cold Smoke**, not a WWW clone and not
the current Claude-ish look.

**What makes WWW work (to borrow, not copy):** it's unpretentious and utilitarian;
the writing and the figures are the design; a persistent sidebar (about, archive,
labels, blogroll); classic dated-post stream; nothing gets between the reader and
the forecast discussion.

**Direction for the next session (do this, don't skip to code):**
1. Look at the current live site and WWW side by side. Load the **frontend-design
   skill** first.
2. Propose **2–3 genuinely distinct visual directions** (mood, type pairing,
   palette, layout) and let Trey pick. Deliberately avoid the current AI-signature
   cluster (condensed-caps masthead + serif body + single cool accent; also avoid
   cream+terracotta, dark+acid-green, and generic newspaper-hairline looks). Aim
   for something that feels hand-built and regional — mountain-town, Montana, a
   little vintage/analog, personality-forward. Consider: a genuinely typographic
   nameplate (not condensed caps), warmer or more idiosyncratic neutrals, a
   two-column blog grid with a dense classic sidebar, generous room for large
   figures, understated but characterful.
3. Keep it a **static, self-contained build** (no new toolchain) — edit
   `templates/*.html` + `static/style.css`, keep `build.py` and the posting
   workflow intact. Preserve the data pages (Season Tracker, Climatology) but
   restyle them to match.
4. Requirements: responsive, light/dark, readable ~65-char measure, real archive/
   tag/about sidebar, RSS kept. Rebuild with `build.py`, preview via
   `python -m http.server -d docs`, push to publish.

Key files: `~/coldsmoke/templates/base.html`, `~/coldsmoke/static/style.css`,
`~/coldsmoke/build.py`, `~/coldsmoke/templates/{index,post,archive,tracker,
climatology}.html`.

---

## Current state of the in-flight 07_hourly work (context)

A large SEB-crust / calibrated-wind / SLR-autopsy upgrade to `~/mtnsnow/07_hourly/`
was running when this handoff was written (ERA5 hourly download + downstream
chain). By the time you read this it should be complete — check
`~/mtnsnow/07_hourly/hourly_interval_analysis.ipynb`,
`~/mtnsnow/07_hourly/RECOMMENDATIONS.md`, and the memory note
`hourly-settling-analysis` for the results (they include the SLR(T,U) refit and
the Bridger multi-elevation scrape that Task 2 builds on). Nothing in Tasks 1–3
depends on that run finishing, but the SLR and elevation pieces it produced feed
Task 2 directly.
