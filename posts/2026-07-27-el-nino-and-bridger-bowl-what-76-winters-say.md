---
title: "El Niño and Bridger Bowl: what 76 winters say about 2026–27"
date: 2026-07-27
draft: true
tags:
  - climatology
  - el-nino
  - bridger
  - outlook
---

A strong El Niño is underway. As of the Climate Prediction Center's July
discussion, Niño-3.4 is running **+1.2 °C** and still warming, with an **81%
chance of a *very strong* event by October–December** — the kind of ENSO
winter that shows up three times in the historical record (1982-83, 1997-98,
2015-16). So it's a fair question for anyone with a Bridger pass: what does
a big El Niño actually do to our snow?

We joined all **76 seasons** of the station record behind this site
(WY1951–2026) to the CPC's Oceanic Niño Index and let the data talk. Short
version: **El Niño tilts the odds against us — modestly, measurably, and
mostly by deleting the blower years.**

## The relationship, in one scatter

![Seasonal snowfall vs DJF ONI](%BASE%/assets/images/enso/regression_oni_total.png)

Across all 76 winters, Bridger loses about **11 inches of seasonal snowfall
per +1 °C of winter ONI** (p < 0.001). But the R² is 0.14 — ENSO explains
about a seventh of the year-to-year variance. It loads the dice; it doesn't
throw them.

The more interesting result is *where* the loss comes from. Quantile
regression says the slope at the 90th percentile (−16″/°C) is three times
steeper than at the 10th (−5.5″/°C). El Niño doesn't crater the floor of a
Bridger winter — **it caps the ceiling**. None of the eight strong-or-better
El Niño winters since 1950 cleared 200 inches, while half of the strong La
Niña winters did.

## The probabilities

![Season-outcome probabilities by ENSO state](%BASE%/assets/images/enso/probability_bars.png)

Sorting all 76 winters into five ENSO bins (whiskers are honest 95%
confidence intervals — small samples, wide bars):

- **P(below-median season)** climbs from ~33% in La Niña to **~75% in
  strong+ El Niño**.
- **P(200″+ blower year)**: ~50% in strong La Niña, ~9% in neutral,
  **~0–5% in strong+ El Niño**.
- **P(lean year, under 130″)**: rises to **~25–30%** in strong+ El Niño —
  elevated, but far from a guarantee of misery.

Mean seasonal totals run 143″ (strong+ El Niño) → 158″ (neutral) → 186″
(strong La Niña) against the 164″ climo mean. And a detail worth noting:
strong El Niño vs *neutral* is only −14″ and not statistically significant.
Most of the ENSO lever at Bridger is **La Niña generosity**, not El Niño
devastation.

![Seasonal snowfall by ENSO state](%BASE%/assets/images/enso/violin_seasonal_total.png)

## Why: the ridge

![DJF composite anomalies](%BASE%/assets/images/enso/composite_z500_mslp.png)

The mechanism is textbook. Compositing 76 winters of ERA5 fields, strong El
Niño Decembers-through-Februaries deepen and shift the Aleutian low while
parking a **ridge over western Canada and the northern Rockies** — right on
top of us. The storm track splits and feeds California; we sit under
subsidence. Strong La Niña is the mirror image: a North Pacific ridge and a
trough digging into the Northwest, which is why those winters produced 11
of Bridger's top-20 storms (El Niño winters: 5).

Two more findings from the record:

- **The hit is spread across the season, worst early.** Every month
  Nov–Mar loses snow per degree of ONI, with November and December the only
  months reaching significance. The folklore of the "back-loaded El Niño
  winter" doesn't rescue Bridger — February and March slopes stay negative.
  Plan for a slow start without banking on a March miracle.

  ![Monthly snowfall sensitivity to ENSO](%BASE%/assets/images/enso/monthly_slopes.png)

- **There is no temperature signal.** Bozeman-area station records, ERA5,
  and SNOTEL all agree: strong El Niño winters here are not reliably warmer
  (differences of 0.1–0.6 °C, indistinguishable from noise). El Niño
  doesn't melt Bridger — it starves the storm track. When it snows, it
  should still be cold smoke.

## So what does 2026–27 look like?

![Analog winters](%BASE%/assets/images/enso/analog_table.png)

The eight strong+ analogs range from 112″ (1997-98, the worst of them) to
175″ (2009-10). Even monster 1982-83 managed 102% of climatology — a very
strong El Niño does not forbid a decent winter.

We built the outlook three independent ways: the raw analog distribution,
an ONI-kernel weighting of all 76 winters centered on the forecast (+2.0),
and the quantile-regression fit evaluated at ONI 1.8–2.2. They converge to
the same place:

![2026-27 outlook plume](%BASE%/assets/images/enso/outlook_plume.png)

**The central expectation for Bridger in 2026–27 is roughly 145–150 inches
— about 85–90% of a normal season** — with a 10th-to-90th-percentile range
of about **112″ to 170″**. Roughly a 70–75% chance of finishing below the
climo mean, a ~25–30% chance of a genuinely lean year under 130″, and only
a few percent chance of a 200″ season.

The honest caveats: eight analogs is a small sample, and ENSO explains only
~14% of what a Bridger winter does. The other 86% — storm-by-storm luck,
the polar jet, whatever the North Pacific decides to do in February — is
still on the table. 2009-10 beat climatology under a strong El Niño.

But if you're setting expectations: think **slower start, fewer deep days,
same cold snow** — and watch the [Season Tracker](%BASE%/tracker/) trace it
against the gray bands in real time once the flakes fly.

Think snow anyway.

---

*Methods: DJF Oceanic Niño Index (CPC), 76 usable Bridger seasons
(Nov–Apr totals) from the station record behind this site. Probability
bins use Wilson intervals; group differences tested with Mann-Whitney,
permutation, and bootstrap methods; composites are ERA5 12Z anomalies vs a
smoothed day-of-year climatology with bootstrap stippling. Full analysis
lives in the mtnsnow pipeline (phase 09).*
