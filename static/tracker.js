/* Season snowfall tracker — cumulative lines + percentile bands, hand-rolled SVG.
   Data: docs/data/season_tracker.json (bands indexed by day-of-water-year 1..366). */

(function () {
  const NS = "http://www.w3.org/2000/svg";
  const W = 900, H = 460;
  const M = { top: 24, right: 118, bottom: 40, left: 52 };
  const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
  const SEASON_END = 212; // Apr 30 = DOWY 212 (Oct 1 = 1)

  // First-of-month DOWY anchors, Oct..Apr (non-leap alignment used for labels)
  const MONTHS = [
    { d: 1, label: "Oct" }, { d: 32, label: "Nov" }, { d: 62, label: "Dec" },
    { d: 93, label: "Jan" }, { d: 124, label: "Feb" }, { d: 153, label: "Mar" },
    { d: 184, label: "Apr" },
  ];

  const app = document.getElementById("tracker-app");
  if (!app) return;
  const svg = document.getElementById("tracker-chart");
  const tip = document.getElementById("tracker-tip");
  const note = document.getElementById("tracker-note");
  const tableDiv = document.getElementById("tracker-table");

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const x = (dowy) => M.left + ((dowy - 1) / (SEASON_END - 1)) * PW;
  const y = (inches, ymax) => M.top + PH - (inches / ymax) * PH;

  function dowyToDate(dowy, wy) {
    const d = new Date(Date.UTC(wy - 1, 9, 1)); // Oct 1 of wy-1
    d.setUTCDate(d.getUTCDate() + (dowy - 1));
    return d;
  }
  const fmtDate = (d) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

  function linePath(vals, ymax, startDowy) {
    let p = "";
    vals.forEach((v, i) => {
      p += (i ? "L" : "M") + x(startDowy + i).toFixed(1) + "," + y(v, ymax).toFixed(1);
    });
    return p;
  }
  function bandPath(lo, hi, ymax) {
    let p = "";
    for (let i = 0; i < SEASON_END; i++)
      p += (i ? "L" : "M") + x(i + 1).toFixed(1) + "," + y(hi[i], ymax).toFixed(1);
    for (let i = SEASON_END - 1; i >= 0; i--)
      p += "L" + x(i + 1).toFixed(1) + "," + y(lo[i], ymax).toFixed(1);
    return p + "Z";
  }

  function render(data, resortKey) {
    const r = data.resorts[resortKey];
    const b = r.bands;
    const cur = r.current;
    const curVals = cur.cumulative_in;
    // Last season stays on as a labelled comparison line for the first ~6 weeks.
    const prev = r.previous;
    const showPrev = !!(prev && prev.cumulative_in.length && prev.show_until &&
      Date.now() < new Date(prev.show_until + "T00:00:00Z").getTime());
    const seasonLabel = (wy) => `${wy - 1}–${String(wy % 100).padStart(2, "0")}`;
    const ymaxRaw = Math.max(b.p90[SEASON_END - 1], cur.total_in,
                             showPrev ? prev.total_in : 0) * 1.08;
    const ymax = Math.ceil(ymaxRaw / 25) * 25;

    svg.innerHTML = "";
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    // gridlines + y ticks
    const yStep = ymax > 200 ? 50 : 25;
    for (let v = 0; v <= ymax; v += yStep) {
      el("line", { class: "gridline", x1: M.left, x2: M.left + PW,
                   y1: y(v, ymax), y2: y(v, ymax) }, svg);
      el("text", { class: "ax-tick", x: M.left - 8, y: y(v, ymax) + 4,
                   "text-anchor": "end" }, svg).textContent = v;
    }
    el("text", { class: "ax-label", x: M.left - 36, y: M.top - 8 }, svg)
      .textContent = "inches";

    // bands (p10–p90 under p25–p75), median
    el("path", { class: "band-outer", d: bandPath(b.p10, b.p90, ymax) }, svg);
    el("path", { class: "band-inner", d: bandPath(b.p25, b.p75, ymax) }, svg);
    el("path", { class: "median-line",
                 d: linePath(b.p50.slice(0, SEASON_END), ymax, 1) }, svg);

    // x axis
    el("line", { class: "baseline", x1: M.left, x2: M.left + PW,
                 y1: M.top + PH, y2: M.top + PH }, svg);
    MONTHS.forEach((m) => {
      el("line", { class: "gridline", x1: x(m.d), x2: x(m.d),
                   y1: M.top + PH, y2: M.top + PH + 5 }, svg);
      el("text", { class: "ax-tick", x: x(m.d) + 3, y: M.top + PH + 18 }, svg)
        .textContent = m.label;
    });

    // last season (comparison line, drawn under the current season)
    const pStart = showPrev ? (prev.start_dowy || 1) : 1;
    const pShown = showPrev ? prev.cumulative_in.slice(0, Math.max(0, SEASON_END - pStart + 1)) : [];
    if (pShown.length) {
      el("path", { class: "prev-line", d: linePath(pShown, ymax, pStart) }, svg);
      const pEnd = pStart + pShown.length - 1;
      const px = x(pEnd), py = y(pShown[pShown.length - 1], ymax);
      el("circle", { class: "prev-dot", cx: px, cy: py, r: 3.5 }, svg);
      // right-margin label, nudged below any band label it would collide with
      let ly = py + 4;
      ["p90", "p50", "p10"].map((k) => y(b[k][SEASON_END - 1], ymax) + 4)
        .sort((a1, a2) => a1 - a2)
        .forEach((by) => { if (Math.abs(ly - by) < 13) ly = by + 14; });
      el("text", { class: "series-label", x: M.left + PW + 6, y: ly }, svg)
        .textContent = `${seasonLabel(prev.water_year)}: ${prev.total_in}"`;
    }

    // current season
    const startD = cur.start_dowy || 1;
    const shown = curVals.slice(0, Math.max(0, SEASON_END - startD + 1));
    if (shown.length) {
      el("path", { class: "current-line", d: linePath(shown, ymax, startD) }, svg);
      const endD = startD + shown.length - 1;
      const ex = x(endD), ey = y(shown[shown.length - 1], ymax);
      el("circle", { class: "end-dot", cx: ex, cy: ey, r: 5 }, svg);

      const medToDate = b.p50[Math.min(endD, SEASON_END) - 1];
      const pct = medToDate > 0 ? Math.round((cur.total_in / medToDate) * 100) : null;
      const lab = el("text", { class: "end-label", x: ex + 10, y: ey + 4 }, svg);
      lab.textContent = `${cur.total_in}"`;
      if (pct !== null) {
        const sub = el("text", { class: "series-label", x: ex + 10, y: ey + 18 }, svg);
        sub.textContent = `${pct}% of median`;
      }
    } else {
      // new season, no obs yet: mark the start at 0"
      el("circle", { class: "end-dot", cx: x(1), cy: y(0, ymax), r: 5 }, svg);
      el("text", { class: "end-label", x: x(1) + 10, y: y(0, ymax) - 10 }, svg)
        .textContent = `${seasonLabel(cur.water_year)}: no snow yet`;
    }

    // band edge labels (right margin)
    [["p90", "90th"], ["p50", "median"], ["p10", "10th"]].forEach(([k, txt]) => {
      el("text", { class: "series-label", x: M.left + PW + 6,
                   y: y(b[k][SEASON_END - 1], ymax) + 4 }, svg).textContent = txt;
    });

    // note
    const wyLabel = seasonLabel(cur.water_year);
    const fmtObs = (s) => fmtDate(new Date(s + "T00:00:00Z"));
    note.textContent =
      (cur.last_obs_date
        ? `${wyLabel} season through ${fmtObs(cur.last_obs_date)}. `
        : `The ${wyLabel} season started Oct 1 — no snowfall recorded yet. `) +
      (pShown.length
        ? `Gray line: last season (${seasonLabel(prev.water_year)}), final ${prev.total_in}". `
        : "") +
      `Climatology from ${r.n_seasons} seasons.`;

    // hover crosshair + tooltip
    const hover = el("g", { style: "display:none" }, svg);
    const ch = el("line", { class: "crosshair", y1: M.top, y2: M.top + PH }, hover);
    const chDot = el("circle", { class: "end-dot", r: 4 }, hover);
    const hit = el("rect", { x: M.left, y: M.top, width: PW, height: PH,
                             fill: "transparent" }, svg);
    hit.addEventListener("mousemove", (ev) => {
      const box = svg.getBoundingClientRect();
      const px = ((ev.clientX - box.left) / box.width) * W;
      let d = Math.round(((px - M.left) / PW) * (SEASON_END - 1)) + 1;
      d = Math.max(1, Math.min(SEASON_END, d));
      const xi = x(d);
      hover.style.display = "";
      ch.setAttribute("x1", xi); ch.setAttribute("x2", xi);

      const rows = [
        ["90th pct", b.p90[d - 1]], ["75th pct", b.p75[d - 1]],
        ["median", b.p50[d - 1]], ["25th pct", b.p25[d - 1]], ["10th pct", b.p10[d - 1]],
      ];
      let curTxt = "";
      const ci = d - startD;
      if (ci >= 0 && ci < shown.length) {
        curTxt = `<span class="tt-head">${wyLabel}: ${shown[ci]}"</span><br>`;
        chDot.style.display = "";
        chDot.setAttribute("cx", xi);
        chDot.setAttribute("cy", y(shown[ci], ymax));
      } else chDot.style.display = "none";
      const pi = d - pStart;
      if (pi >= 0 && pi < pShown.length)
        curTxt += `${seasonLabel(prev.water_year)}: ${pShown[pi]}"<br>`;

      tip.innerHTML = `<span class="tt-head">${fmtDate(dowyToDate(d, cur.water_year))}</span><br>` +
        curTxt + rows.map(([k, v]) => `${k}: ${v}"`).join("<br>");
      tip.hidden = false;
      tip.style.left = ((xi / W) * box.width) + "px";
      tip.style.top = ((M.top / H) * box.height + 40) + "px";
    });
    hit.addEventListener("mouseleave", () => {
      hover.style.display = "none";
      tip.hidden = true;
    });

    // monthly-checkpoint table (accessibility / no-JS-chart fallback)
    let rows = MONTHS.slice(1).map((m) => {
      const d = m.d - 1;
      const ci = d - startD;
      const pi = d - pStart;
      const prevCell = pShown.length
        ? `<td>${pi >= 0 && pi < pShown.length ? pShown[pi] + '"' : "—"}</td>` : "";
      return `<tr><td>${m.label} 1</td><td>${b.p10[d - 1]}</td><td>${b.p50[d - 1]}</td>` +
        `<td>${b.p90[d - 1]}</td>${prevCell}<td>${ci >= 0 && ci < shown.length ? shown[ci] + '"' : "—"}</td></tr>`;
    }).join("");
    const endRow = `<tr><td>Apr 30</td><td>${b.p10[SEASON_END - 1]}</td><td>${b.p50[SEASON_END - 1]}</td>` +
      `<td>${b.p90[SEASON_END - 1]}</td>${pShown.length ? `<td>${prev.total_in}"</td>` : ""}` +
      `<td>${shown.length ? cur.total_in + '"' : "—"}</td></tr>`;
    tableDiv.innerHTML =
      `<table><thead><tr><th>Date</th><th>p10</th><th>median</th><th>p90</th>` +
      (pShown.length ? `<th>${seasonLabel(prev.water_year)}</th>` : "") +
      `<th>${wyLabel}</th></tr></thead><tbody>${rows}${endRow}</tbody></table>`;
  }

  fetch((window.CSR_BASE || "") + "/data/season_tracker.json")
    .then((r) => r.json())
    .then((data) => {
      const buttons = app.querySelectorAll(".viz-toggle");
      buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
          buttons.forEach((o) => {
            o.classList.toggle("active", o === btn);
            o.setAttribute("aria-selected", o === btn ? "true" : "false");
          });
          render(data, btn.dataset.resort);
        });
      });
      render(data, buttons[0].dataset.resort);
    })
    .catch((e) => { note.textContent = "Could not load tracker data (" + e + ")."; });
})();
