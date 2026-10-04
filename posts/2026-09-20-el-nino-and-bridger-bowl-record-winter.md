---
title: "Welcome & the Question on Everyone's Mind: What does El Niño mean for our Snow?"
date: 2026-10-04
tags:
  - climatology
  - el-nino
  - bridger
  - outlook
draft: true
---

Hi all, welcome to the Cold Smoke Report! As an atmospheric scientist with a passion for skiing and snow, I've realized over the past few years that Southwest Montana is lacking a dedicated blog/site for snowfall forecasts. To start things off I'll be focusing on winter weather forecasts right here in the backyard at Bridger Bowl, Big Sky, and in Bozeman. Before I start with my first topic I've got a few ground rules and things I can promise for you all:

1) All forecasts will be written by a human, me. The full model/forecast and AI disclosure can be found on the "About" tab.

2) I will be wrong at times.

3) There are no bad questions, ask away.

3) Oh and “Super” El Niño does not exist, scientifically speaking; I know it's semantics in terms of terminology but just so you all know :)

More than anything, though, I’m hoping this can be an educational resource for our community to better understand weather and science in general, including myself. Okay lets get into it!

I've probably either gotten the question or heard at least a hundred times this summer and fall, what does this El Niño mean for our snowfall? I thought that this will make for a good first post topic.

Unless you've been living under a rock, most folks know already that a record-strength El Niño is taking shape in the Pacific. As of the Climate Prediction Center's (CPC) September 10 discussion, the  ocean still getting hotter with the key Niño-3.4 region sitting at +2.2 °C, and the eastern Pacific  already past +3 °C.  The CPC now puts a greater than 90% chance on a _very strong_ event, and, a 75% chance on a _historic_ one, exceeding the strength of any El Niño back to 1950. 

So the question for anyone with a Bridger or Big Sky pass: what does a big El
Niño actually do to our snowfall in this region? To dig a little deeper I aggregated
76 seasons of SNOTEL recorded data to the CPC's Oceanic Niño Index. TLDR: El Niño historically tilts the odds against us.

The snowfall totals in this post come from the nearest Bridger Bowl SNOTEL record (Brackett Creek) that extends back continuously to 1950 with the nearby co-op station. I'm using the daily change in snow depth, measured once a day after the snow has settled. Bridger's own snow report almost always measures higher (typically by up to 30%). Basically in the upcoming plots, don't line these numbers up against the snow report; the results are meant to be percentages of normal and as odds.

## Scatter plot of El Nino vs. La Nina Snowfall

![Bridger seasonal snowfall vs. El Niño](/coldsmoke/assets/images/01_scatter.png)

Over the past 76 winters, Bridger loses about 11 inches of seasonal snowfall per +1 °C of winter ONI, the measure of El Nino's strength (more positive = stronger El Niño, more negative = stronger La Niña, -0.5-0.5 = neutral). It's important to note that despite the relationship, ENSO explains only part of the year-to-year variance. It does, however, load the dice against us.

What's interesting to me is looking at where the loss comes from: In the plot you can see that the trend is steeper at the top of the range than the bottom: the biggest winters lose about 16″ per °C of El Niño, the driest about 5–6″. This indicates to me that while El Nino generally means less snow across the board, it's bigger effect is on capping the ceiling. None of the eight strong-or-better El Niño winters since 1950 cleared 200 inches, while half of the strong La Niña winters did. Furthermore, though not shown here, looking at Bridger's top-20 biggest storms on record, 11 landed in La Niña winters and just 5 in El Niño winters. 

- La Niña winters skew above normal in terms of snowfall around 2/3rds of the time, with only about 18% of neutral years being above average, and zero of the eight historical El Niño winters above average.
- On the other side of the coin, El Niño winters historically are below average about 2/3rds of the time.

Mean seasonal totals run 143″ (strong El Niño) → 158″ (neutral) → 186″
(strong La Niña), against the 164″ climatological mean. You're probably asking what happened last year, wasn't that a La Niña? Sort of. ENSO quickly flipped to neutral early in the season, technically making it not a La Niña winter at least by these metrics.

## Why El Niño's Pattern = Less Snowfall![Winter pressure pattern in strong El Niño vs. strong La Niña years — a ridge over Montana](https://coldsmokereport.github.io/coldsmoke/assets/images/2026-09-12/04_why_ridge.png)

If we composite 76 winters of reanalysis fields, the pattern during strong El Niño Decembers-through-Februaries deepen and shift the Aleutian low and also have more prominent ridging over western Canada and the northern Rockies over MT. This coincides with a storm track that tends to split and provides California with more precipitation than typical winters. Strong La Niña's, on the other hand, feature a North Pacific ridge and a trough digging into the Northwest, which leads to a favorable storm track from the W/NW for us.

Is there any good news in all of this? Well, Bozeman-area station records, reanalysis, and SNOTEL all seem to indicate that strong El Niño winters here are not reliably warmer with differences of only 0.1–0.6 °C. This result actually surprised me a bit. Historically, the warmest periods globally tend to be coming out of peak El Nino conditions during the following summer/fall, so this is likely what's happening here, to an extent.

## So what does a record 2026–27 look like?

Our three very-strong analog winters (DJF ONI ≥ 2.0) are 1982-83, 1997-98, and 2015-16, which had **167″, 112″, and 138″** at Bridger respectively (remember these are the snotel numbers and would correspond to \~ 233, 157, and 193"). This is a pretty wide spread and ranges anywhere from a decent winter near average to a dry one similar to last season.
![The eight strong El Niño winters at Bridger since 1950, ranked by strength](https://coldsmokereport.github.io/coldsmoke/assets/images/2026-09-12/05_record_winters.png)

We built the outlook three independent ways — the raw analog distribution, a
blend of all 76 winters weighted by how close their ONI sits to this year's
forecast, and the quantile-regression fit — all centered on an ONI of about
+2.5, the top of the historical record. They converge:

![How a season piles up, and where 2026–27 most likely lands](https://coldsmokereport.github.io/coldsmoke/assets/images/2026-09-12/06_outlook.png)

**The central expectation for Bridger in 2026–27 is roughly 140 inches —**
**about 85% of a normal season** (climo mean 164″) — with a
10th-to-90th-percentile range of about **110″ to 165″.** Call it a \~77%
chance of finishing below the climo mean, a \~30% chance of a genuinely lean
year under 130″, and only a few percent chance of a 200″ season.

Two honest caveats, both pointing the same direction — _wider_ error bars,
not a lower number:

- **We're at the edge of the analogs already.** The strongest winter in the
  record is 2015-16 at +2.63 — and this year's forecast sits right there. If
  the El Niño clears CPC's historic threshold, 2026-27 lands beyond everything
  we have to compare it to, and the ceiling-capping relationship is being
  extrapolated at the central case, not just in the tail.
- **ENSO still explains only \~14% of a Bridger winter.** The other 86% —
  the polar jet, storm-by-storm luck, whatever the North Pacific decides in
  February — is untouched by how warm the eastern Pacific gets. 1982-83 was a
  monster El Niño and still beat climatology.

## What about Big Sky?

The story rhymes down the road at Big Sky. The record there is shorter — the
Lone Mountain SNOTEL only goes back to 1992, so 35 winters instead of 76 — but
the ENSO tilt is, if anything, a touch stronger: about **14 inches lost per**
**+1 °C** of winter ONI, and the relationship explains a larger share of the
variance (R² ≈ 0.26) than at Bridger.

![Big Sky seasonal snowfall vs. winter El Niño strength, 1992–2026](https://coldsmokereport.github.io/coldsmoke/assets/images/2026-09-12/07_bigsky.png)

Against a Lone Mountain normal of about **141 inches**, the strong-El-Niño
winters on record averaged roughly **114″ (about 80% of normal)** — though the
two closest very-strong analogs, 1997-98 and 2015-16, both landed nearer 95%.
With only a handful of strong-Niño winters in a 35-year record, treat Big Sky
as a **directional** call rather than a precise number: lean toward
below-normal, same as Bridger, and watch the same fall forecasts.

## Bottom line

The forecast is dramatic; the playbook is calm.

- **Don't bet on the timing.** The loss is spread across the season, and the
  record winters started fast and slow alike — bet on the total, not the
  calendar.
- **Expect fewer deep days** — a central total around 85% of normal, and
  real odds (\~30%) of a lean year — but don't write off the season.
- **The snow that does fall should still be cold.** No reliable temperature
  signal here; this is a storm-track story, not a warm-winter one.

CPC's next update lands October 8, and the fall forecasts are where a
developing El Niño usually shows its hand. We'll be tracking it — and once
the flakes fly, the [Season Tracker](%BASE%/tracker/) will trace this winter
against the gray bands in real time.

Think snow anyway.

***

\*Methods: DJF Oceanic Niño Index (CPC), 76 usable Bridger seasons (Nov–Apr
totals) from the Bridger Bowl SNOTEL record behind this site (Brackett Creek,
extended to 1950 with the nearby co-op station). Probability bins use Wilson
intervals; group differences tested with Mann-Whitney, permutation, and
bootstrap methods; composites are reanalysis anomalies vs a smoothed
day-of-year climatology (the research versions carry bootstrap stippling).
The 2026-27 outlook centers three framings on a forecast ONI of +2.5 (range
2.3–2.7) and CPC's >90% very-strong probability. ENSO status from the CPC
ENSO Diagnostic Discussion issued 2026-09-10. The figures here are simplified
renderings of that analysis. Full analysis lives in the mtnsnow research
pipeline.\*
