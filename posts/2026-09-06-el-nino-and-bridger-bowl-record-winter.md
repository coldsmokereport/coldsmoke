---
title: "El Niño and Bridger Bowl: what 76 winters say about a record 2026–27"
date: 2026-09-06
draft: true
tags:
  - climatology
  - el-nino
  - bridger
  - outlook
---

*Welcome to the Cold Smoke Report — a data-first look at snow in southwest
Montana: Bridger Bowl, Big Sky, and the Bozeman backyard. It runs on a
research pipeline that reads decades of station records, SNOTEL, and
atmospheric reanalysis, and the idea here is simple: no hype, no powder-day
clickbait — just the numbers, honestly framed, and what they actually mean for
your season. For the first post, the question on every pass-holder's mind
heading into this winter.*

A **record-strength El Niño** is taking shape in the Pacific. As of the
Climate Prediction Center's August discussion, the alert status is a full
**El Niño Advisory**, and the ocean is running hot and getting hotter: the
key Niño-3.4 region sits at **+1.4 °C**, the eastern Pacific is already past
+2 °C, and a deep pool of warm water (about +10 °C above average at depth) is
queued up to surface through the fall. CPC now puts a **greater than 90%
chance on a *very strong* event** — and, more strikingly, a **69% chance on a
*historic* one**, a winter that would exceed the strength of any El Niño back
to 1950.

So it's a fair question for anyone with a Bridger pass: what does a big El
Niño — let alone a record one — actually do to our snow? We joined all
**76 seasons** of the station record behind this site (WY1951–2026) to the
CPC's Oceanic Niño Index and let the data talk. Short version: **El Niño
tilts the odds against us — modestly, measurably, and mostly by deleting the
blower years.**

## The relationship, in one scatter

![Seasonal snowfall vs DJF ONI](https://coldsmokereport.github.io/coldsmoke/assets/images/enso/regression_oni_total.png)

Across all 76 winters, Bridger loses about **11 inches of seasonal snowfall
per +1 °C of winter ONI** (p < 0.001). But the R² is 0.14 — ENSO explains
only about a seventh of the year-to-year variance. **It loads the dice; it
doesn't throw them.** Keep that number in your back pocket; it's the single
most important caveat in this whole post.

The more interesting result is *where* the loss comes from. Quantile
regression says the slope at the 90th percentile (−16″/°C) is three times
steeper than at the 10th (−5.5″/°C). El Niño doesn't crater the floor of a
Bridger winter — **it caps the ceiling.** None of the eight strong-or-better
El Niño winters since 1950 cleared 200 inches, while half of the strong La
Niña winters did. Of Bridger's top-20 biggest storms on record, 11 landed in
La Niña winters; just 5 in El Niño winters.

## The probabilities

![Season-outcome probabilities by ENSO state](https://coldsmokereport.github.io/coldsmoke/assets/images/enso/probability_bars.png)

Sorting all 76 winters into five ENSO bins (whiskers are honest 95%
confidence intervals — small samples make for wide bars):

- **P(below-median season)** climbs from ~33% in La Niña to **~75% in
  strong+ El Niño.**
- **P(200″+ blower year)**: ~50% in strong La Niña, ~9% in neutral, and
  **~0–5% in strong+ El Niño.**
- **P(lean year, under 130″)**: rises to **~25–30%** in strong+ El Niño —
  elevated, but far from a guarantee of misery.

Mean seasonal totals run 143″ (strong+ El Niño) → 158″ (neutral) → 186″
(strong La Niña), against the 164″ climo mean. And a detail worth sitting
with: strong El Niño vs *neutral* is only −14″, and **not** statistically
significant. Most of the ENSO lever at Bridger is **La Niña generosity**, not
El Niño devastation — a strong El Niño mostly costs you the upside.

## Why: the ridge

![DJF composite anomalies](https://coldsmokereport.github.io/coldsmoke/assets/images/enso/composite_z500_mslp.png)

The mechanism is textbook. Compositing 76 winters of reanalysis fields,
strong El Niño Decembers-through-Februaries deepen and shift the Aleutian low
while parking a **ridge over western Canada and the northern Rockies** —
right on top of us. The storm track splits and feeds California; we sit under
subsidence. Strong La Niña is the mirror image: a North Pacific ridge and a
trough digging into the Northwest, which is why those winters are the ones
that bury us.

Two more findings from the record that shape how to play the season:

- **The hit is spread across the winter, worst early.** Every month Nov–Mar
  loses snow per degree of ONI, with **November and December** the only
  months reaching statistical significance. The folklore of the "back-loaded
  El Niño winter" doesn't rescue Bridger — February and March slopes stay
  negative. Plan for a slow start without banking on a March miracle.

  ![Monthly snowfall sensitivity to ENSO](https://coldsmokereport.github.io/coldsmoke/assets/images/enso/monthly_slopes.png)

- **There is no temperature signal.** Bozeman-area station records,
  reanalysis, and SNOTEL all agree: strong El Niño winters here are not
  reliably warmer (differences of 0.1–0.6 °C, indistinguishable from noise).
  El Niño doesn't melt Bridger — **it starves the storm track.** When it
  snows, it should still be cold smoke.

## So what does a record 2026–27 look like?

Here's where the "record" part matters. Our three very-strong analog winters
(DJF ONI ≥ 2.0) are 1982-83, 1997-98, and 2015-16 — and they delivered
**167″, 112″, and 138″** at Bridger. A mean near 139″, and a spread wide
enough to hold both a perfectly respectable winter and a genuinely lean one.

![Very-strong El Niño analog winters at Bridger](https://coldsmokereport.github.io/coldsmoke/assets/images/2026-09-06/analog_table_aug.png)

We built the outlook three independent ways — the raw analog distribution, an
ONI-distance-weighted blend of all 76 winters, and the quantile-regression
fit — re-centered on this year's stronger forecast (an ONI around +2.4, the
top of the historical set). They converge:

![2026-27 outlook](https://coldsmokereport.github.io/coldsmoke/assets/images/2026-09-06/outlook_plume_aug.png)

**The central expectation for Bridger in 2026–27 is roughly 140–145 inches —
about 85–88% of a normal season** (climo mean 164″) — with a
10th-to-90th-percentile range of about **110″ to 165″.** Call it a ~76%
chance of finishing below the climo mean, a ~30% chance of a genuinely lean
year under 130″, and only a few percent chance of a 200″ season.

Two honest caveats, both pointing the same direction — *wider* error bars,
not a lower number:

- **A truly record event would run past our analogs.** No winter in the
  record exceeds about +2.6 in DJF ONI. If this El Niño clears the historic
  threshold, 2026-27 sits at or beyond the edge of everything we have to
  compare it to, and the ceiling-capping relationship gets extrapolated
  outside the data.
- **ENSO still explains only ~14% of a Bridger winter.** The other 86% —
  the polar jet, storm-by-storm luck, whatever the North Pacific decides in
  February — is untouched by how warm the eastern Pacific gets. 1982-83 was a
  monster El Niño and still beat climatology.

## Bottom line

The forecast is dramatic; the playbook is calm.

- **Plan for a slow start.** The suppression is worst in November–December.
- **Expect fewer deep days** — a central total around 85–90% of normal, and
  real odds (~30%) of a lean year — but don't write off the season.
- **The snow that does fall should still be cold.** No reliable temperature
  signal here; this is a storm-track story, not a warm-winter one.

CPC's next update lands September 10, and the fall forecasts are where a
developing El Niño usually shows its hand. We'll be tracking it — and once
the flakes fly, the [Season Tracker](%BASE%/tracker/) will trace this winter
against the gray bands in real time.

Think snow anyway.

---

*Methods: DJF Oceanic Niño Index (CPC), 76 usable Bridger seasons (Nov–Apr
totals) from the station record behind this site. Probability bins use Wilson
intervals; group differences tested with Mann-Whitney, permutation, and
bootstrap methods; composites are reanalysis anomalies vs a smoothed
day-of-year climatology with bootstrap stippling. The 2026-27 outlook
re-centers three framings on a forecast ONI of +2.4 (range 2.2–2.6) and
CPC's >90% very-strong probability. ENSO status from the CPC ENSO Diagnostic
Discussion issued 2026-08-13. Full analysis lives in the mtnsnow research
pipeline.*
