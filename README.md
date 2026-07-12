# The Cold Smoke Report

Static site for **thecoldsmokereport** — a daily snow-forecasting blog for
southwest Montana (Bridger Bowl, Big Sky, Bozeman) with a season snowfall
tracker and climatology explorer, powered read-only by the
[`~/mtnsnow`](../mtnsnow) research pipeline.

Served by **GitHub Pages** from the `docs/` folder on `main`. `docs/` is
generated — never hand-edit it — but it IS committed.

## Daily posting workflow (in season)

The mtnsnow cron (05:05 / 17:05 MDT) has already refreshed SNOTEL obs and the
quantile forecast by morning. Then:

```bash
cd ~/coldsmoke
conda run -n snowclim python new_post.py "Tue Jan 13: 8-14\" for Bridger" --forecast
$EDITOR posts/2027-01-13-tue-jan-13-8-14-for-bridger.md   # write the discussion
./publish.sh "post: Tue Jan 13"                            # build + commit + push
```

`--forecast` embeds the latest P10/P50/P90 table and plume figure from
`~/mtnsnow/blog/<latest-init>/`. Drop extra images into
`posts/images/YYYY-MM-DD/` and reference them as
`![alt](%BASE%/assets/images/YYYY-MM-DD/name.png)`.

## Build & preview

```bash
conda run -n snowclim python build.py              # production build (base=/coldsmoke)
conda run -n snowclim python build.py --base ''    # local-preview build
python -m http.server -d docs 8000                 # then ssh -L 8000:localhost:8000 from laptop
```

`build.py` renders posts/pages, archives, tags, the Atom feed, and both data
pages, and refreshes `docs/data/*.json` from the mtnsnow outputs
(`--skip-data` to reuse). Frontmatter supports `title`, `date`, `tags`,
`draft: true`.

## Data notes

- **Tracker totals are full water year** (Oct 1–Apr 30). The mtnsnow
  `climo_seasonal_*.csv` `total_in` counts core months (Nov–Apr) only, so the
  tracker will read ~10–15" higher — both are correct, different windows.
  Bands and the current-season line share the tracker definition, so the
  chart is internally consistent.
- Sources (all read-only): `/data/trey/mtnsnow/obs/derived/` (merged daily
  parquets, climo CSVs, `climo_percentiles.json`),
  `/data/trey/mtnsnow/figures/phase{2,3}/`, `~/mtnsnow/blog/`.
- Curated figure list and captions live in `config.CLIMO_FIGURES`.

## Dependencies

Everything runs in the existing `snowclim` conda env: mistune 3.x (markdown,
`table` plugin), jinja2, pandas, pyarrow, pyyaml. No npm, no build toolchain —
charts are hand-rolled SVG in vanilla JS (`static/tracker.js`, `static/climo.js`).

## Deploy

GitHub Pages → Settings → Pages → Deploy from branch → `main` / `/docs`.
After changing the GitHub username/repo, update `BASE_URL_ABS` (feed URLs)
and, if the repo is renamed, `BASE_URL` in `config.py`.
