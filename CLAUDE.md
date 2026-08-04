# coldsmoke — CLAUDE.md

The Cold Smoke Report — static snow-forecasting blog for southwest Montana, served by
GitHub Pages from `docs/` on `main`. Fed read-only by the [`~/mtnsnow`](../mtnsnow)
pipeline.

**Read [README.md](README.md) first** — it holds the daily posting workflow, build
commands, and the CMS notes.

## Environment

Use `snowclim`. `conda run -n snowclim python <script>.py` (the form the README already
uses) works correctly. A bare `python` does **not** — a shell alias forces it to
`/usr/bin/python3.9`.

## Hard rules

- **`docs/` is generated — never hand-edit it.** It is committed, which makes it look
  editable. Change templates/posts and rebuild instead.
- Build with `build.py`; publish with `./publish.sh "<message>"` (build + commit + push).
- The `%BASE%` token controls path prefixing: production builds use `--base` default
  (`/coldsmoke`); local preview uses `--base ''`. Getting this wrong breaks every link.
- Season snowfall CSV is **Nov–Apr**; the site tracker runs the **full water year**.
  Do not conflate them.

## Publishing

This repo pushes to a public site. Treat any build-and-push as an outward-facing action —
confirm before running `publish.sh` unless explicitly asked to publish.
