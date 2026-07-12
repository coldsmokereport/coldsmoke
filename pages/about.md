---
title: About
---

**The Cold Smoke Report** covers snow in southwest Montana — Bridger Bowl,
Big Sky, and the town of Bozeman — with daily forecast discussions during the
season and year-round climatology.

"Cold smoke" is what Bridger locals call the ultralight, low-density powder
this range is famous for: continental air, cold storm temperatures, and
snow-to-liquid ratios that routinely top 15:1.

## What's under the hood

The forecasts and data pages here are built on a research pipeline that:

- merges **75+ years of daily station records** (SNOTEL, COOP, GHCN) into
  quality-controlled snowfall series for Bridger Bowl and Big Sky;
- classifies every winter day since 1950 into **synoptic regimes** using ERA5
  reanalysis, to understand which patterns actually deliver;
- verifies **GFS and HRRR** snowfall guidance against those station records,
  quantifying where the models over- and under-produce;
- runs a **quantile machine-learning forecast** (LightGBM) that turns model
  guidance into calibrated P10/P50/P90 snowfall ranges and probabilities of
  3", 6", and 10" days.

The [Season Tracker](%BASE%/tracker/) plots season-to-date snowfall
against percentile bands from the full station record, and the
[Climatology Explorer](%BASE%/climatology/) digs into what normal — and
abnormal — looks like here.

## The fine print

Everything on this site is an experimental research product, not official
guidance. For decisions that matter, use the
[National Weather Service](https://www.weather.gov/) and, in the backcountry,
the [Gallatin National Forest Avalanche Center](https://www.mtavalanche.com/).
