"""Static site generator for The Cold Smoke Report.

Usage:
    conda run -n snowclim python build.py [--base ''] [--skip-data]

Reads posts/*.md and pages/*.md, renders templates/ into docs/, copies static
assets and post images, refreshes the data JSON via make_data, and writes an
Atom feed. docs/ is committed and served by GitHub Pages (main branch /docs).
"""

import argparse
import html
import json
import re
import shutil
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

import mistune
import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

import config
import make_data

POST_FNAME_RE = re.compile(r"^(\d{4}-\d{2}-\d{2})-(.+)\.md$")
FRONTMATTER_RE = re.compile(r"^---\s*\n(.*?)\n---\s*\n", re.DOTALL)

md = mistune.create_markdown(plugins=["table", "strikethrough", "url"])


def parse_markdown_file(path: Path, base: str = config.BASE_URL) -> tuple[dict, str]:
    text = path.read_text()
    meta = {}
    m = FRONTMATTER_RE.match(text)
    if m:
        meta = yaml.safe_load(m.group(1)) or {}
        text = text[m.end():]
    # %BASE% in markdown = site base URL, so posts work in local preview too
    text = text.replace("%BASE%", base)
    return meta, md(text)


def load_posts(base: str = config.BASE_URL) -> list[dict]:
    posts = []
    for path in sorted(config.POSTS_DIR.glob("*.md")):
        m = POST_FNAME_RE.match(path.name)
        if not m:
            print(f"[posts] skipping (bad filename): {path.name}")
            continue
        meta, body = parse_markdown_file(path, base)
        if meta.get("draft"):
            continue
        date = meta.get("date")
        if isinstance(date, str):
            date = datetime.strptime(date, "%Y-%m-%d").date()
        if date is None:
            date = datetime.strptime(m.group(1), "%Y-%m-%d").date()
        posts.append({
            "slug": m.group(2),
            "title": meta.get("title", m.group(2).replace("-", " ").title()),
            "date": date,
            "tags": meta.get("tags") or [],
            "body": body,
        })
    posts.sort(key=lambda p: (p["date"], p["slug"]), reverse=True)
    return posts


def jinja_env(base: str) -> Environment:
    env = Environment(
        loader=FileSystemLoader(config.TEMPLATES_DIR),
        autoescape=select_autoescape(["html", "xml"]),
    )
    env.globals.update(
        base=base,
        base_abs=config.BASE_URL_ABS,
        site_title=config.SITE_TITLE,
        site_tagline=config.SITE_TAGLINE,
        site_author=config.SITE_AUTHOR,
        site_description=config.SITE_DESCRIPTION,
        now_year=datetime.now().year,
    )
    env.filters["datefmt"] = lambda d, f="%B %-d, %Y": d.strftime(f)
    return env


def write(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)


def copy_tree(src: Path, dest: Path):
    if src.exists():
        shutil.copytree(src, dest, dirs_exist_ok=True)


def absolutize(body: str, base_abs: str) -> str:
    """Rewrite site-relative src/href to absolute URLs for the feed."""
    site_base = base_abs.rsplit("/", 1)[0] if base_abs.count("/") > 2 else base_abs
    return re.sub(r'(src|href)="(/[^"]*)"',
                  lambda m: f'{m.group(1)}="{site_base}{m.group(2)}"', body)


def build_feed(env: Environment, posts: list[dict]) -> str:
    entries = []
    for p in posts[:20]:
        entries.append({
            **p,
            "url": f"{config.BASE_URL_ABS}/posts/{p['slug']}/",
            "body_abs": absolutize(p["body"], config.BASE_URL_ABS),
            "updated": f"{p['date'].isoformat()}T12:00:00Z",
        })
    feed_updated = entries[0]["updated"] if entries else \
        datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    return env.get_template("atom.xml").render(
        entries=entries, feed_updated=feed_updated, escape=html.escape)


def build_site(base: str, skip_data: bool = False):
    out = config.OUTPUT_DIR
    env = jinja_env(base)
    posts = load_posts(base)

    # Sidebar context shared by every page
    months = defaultdict(list)  # "YYYY-MM" -> posts
    tags = defaultdict(list)
    for p in posts:
        months[p["date"].strftime("%Y-%m")].append(p)
        for t in p["tags"]:
            tags[t].append(p)
    month_list = [
        {"key": k, "label": datetime.strptime(k, "%Y-%m").strftime("%B %Y"),
         "count": len(v)}
        for k, v in sorted(months.items(), reverse=True)
    ]
    tag_list = sorted(tags.items(), key=lambda kv: (-len(kv[1]), kv[0]))
    sidebar = {"recent": posts[:6], "months": month_list,
               "tags": [(t, len(v)) for t, v in tag_list]}

    # Post pages, index, archives, tags
    for p in posts:
        write(out / "posts" / p["slug"] / "index.html",
              env.get_template("post.html").render(post=p, sb=sidebar))
    write(out / "index.html",
          env.get_template("index.html").render(posts=posts[:10], sb=sidebar))
    for mk, plist in months.items():
        label = datetime.strptime(mk, "%Y-%m").strftime("%B %Y")
        write(out / "archive" / mk / "index.html",
              env.get_template("archive.html").render(
                  heading=label, posts=plist, sb=sidebar))
    write(out / "archive" / "index.html",
          env.get_template("archive.html").render(
              heading="Archive", posts=posts, sb=sidebar, show_months=True))
    for t, plist in tags.items():
        write(out / "tags" / t / "index.html",
              env.get_template("archive.html").render(
                  heading=f"Tagged “{t}”", posts=plist, sb=sidebar))

    # Standalone pages
    for path in sorted(config.PAGES_DIR.glob("*.md")):
        meta, body = parse_markdown_file(path, base)
        write(out / path.stem / "index.html",
              env.get_template("page.html").render(
                  title=meta.get("title", path.stem.title()),
                  body=body, sb=sidebar))

    # Data pages
    if not skip_data:
        make_data.make_all()
    climo = json.loads((out / "data" / "climatology.json").read_text())
    tracker = json.loads((out / "data" / "season_tracker.json").read_text())
    write(out / "tracker" / "index.html",
          env.get_template("tracker.html").render(tracker=tracker, sb=sidebar))
    write(out / "climatology" / "index.html",
          env.get_template("climatology.html").render(
              climo=climo, figures=config.CLIMO_FIGURES, sb=sidebar))

    # Feed, assets, housekeeping
    write(out / "feed.xml", build_feed(env, posts))
    copy_tree(config.STATIC_DIR, out / "assets")
    copy_tree(config.POSTS_DIR / "images", out / "assets" / "images")
    (out / ".nojekyll").touch()

    print(f"[build] {len(posts)} post(s), {len(months)} archive month(s), "
          f"{len(tags)} tag(s) -> {out}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--base", default=config.BASE_URL,
                    help="URL prefix for internal links ('' for local preview)")
    ap.add_argument("--skip-data", action="store_true",
                    help="reuse existing docs/data/*.json instead of rebuilding")
    args = ap.parse_args()
    build_site(args.base, args.skip_data)
