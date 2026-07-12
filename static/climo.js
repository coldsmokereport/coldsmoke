/* Climatology explorer — monthly chart, season-totals chart, sortable tables. */

(function () {
  const NS = "http://www.w3.org/2000/svg";
  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function attachTip(stage) {
    const tip = stage.querySelector(".viz-tooltip");
    return {
      show(html, fx, fy) { // fractions of stage size
        tip.innerHTML = html;
        tip.hidden = false;
        const box = stage.getBoundingClientRect();
        tip.style.left = (fx * box.width) + "px";
        tip.style.top = (fy * box.height) + "px";
      },
      hide() { tip.hidden = true; },
    };
  }

  /* Monthly: median bars + p25–p75 whisker */
  function monthlyChart(svg, data, resort) {
    const r = data.resorts[resort], names = data.month_names;
    const W = 720, H = 260, M = { top: 16, right: 12, bottom: 28, left: 44 };
    const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const ymax = Math.ceil(Math.max(...r.monthly.p75) / 10) * 10;
    const y = (v) => M.top + PH - (v / ymax) * PH;
    const n = names.length, slot = PW / n, bw = Math.min(46, slot * 0.55);
    const tip = attachTip(svg.closest(".viz-stage"));

    for (let v = 0; v <= ymax; v += 10) {
      el("line", { class: "gridline", x1: M.left, x2: M.left + PW, y1: y(v), y2: y(v) }, svg);
      el("text", { class: "ax-tick", x: M.left - 6, y: y(v) + 4, "text-anchor": "end" }, svg)
        .textContent = v;
    }
    el("text", { class: "ax-label", x: M.left - 32, y: M.top - 4 }, svg).textContent = "in";

    names.forEach((nm, i) => {
      const cx = M.left + slot * (i + 0.5);
      const med = r.monthly.median[i], p25 = r.monthly.p25[i], p75 = r.monthly.p75[i];
      const bar = el("rect", { class: "bar", x: cx - bw / 2, y: y(med),
                               width: bw, height: Math.max(0, y(0) - y(med)),
                               rx: 3 }, svg);
      el("line", { class: "whisker", x1: cx, x2: cx, y1: y(p25), y2: y(p75) }, svg);
      el("line", { class: "whisker", x1: cx - 5, x2: cx + 5, y1: y(p25), y2: y(p25) }, svg);
      el("line", { class: "whisker", x1: cx - 5, x2: cx + 5, y1: y(p75), y2: y(p75) }, svg);
      el("text", { class: "ax-tick", x: cx, y: M.top + PH + 16, "text-anchor": "middle" }, svg)
        .textContent = nm;
      bar.addEventListener("mousemove", () => tip.show(
        `<span class="tt-head">${nm}</span><br>median ${med}"<br>p25–p75: ${p25}–${p75}"`,
        cx / W, y(p75) / H));
      bar.addEventListener("mouseleave", tip.hide);
    });
    el("line", { class: "baseline", x1: M.left, x2: M.left + PW,
                 y1: y(0), y2: y(0) }, svg);
  }

  /* Season totals: one thin bar per usable water year */
  function seasonsChart(svg, data, resort) {
    const r = data.resorts[resort];
    const seasons = r.seasons;
    const W = 720, H = 240, M = { top: 16, right: 12, bottom: 28, left: 44 };
    const PW = W - M.left - M.right, PH = H - M.top - M.bottom;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const wy0 = seasons[0].wy, wy1 = seasons[seasons.length - 1].wy;
    const ymax = Math.ceil(Math.max(...seasons.map((s) => s.total_in)) / 50) * 50;
    const x = (wy) => M.left + ((wy - wy0) / Math.max(1, wy1 - wy0)) * PW;
    const y = (v) => M.top + PH - (v / ymax) * PH;
    const bw = Math.max(2, (PW / Math.max(1, wy1 - wy0)) * 0.7);
    const mean = r.summary.mean_seasonal_total_in;
    const tip = attachTip(svg.closest(".viz-stage"));

    for (let v = 0; v <= ymax; v += 50) {
      el("line", { class: "gridline", x1: M.left, x2: M.left + PW, y1: y(v), y2: y(v) }, svg);
      el("text", { class: "ax-tick", x: M.left - 6, y: y(v) + 4, "text-anchor": "end" }, svg)
        .textContent = v;
    }
    el("text", { class: "ax-label", x: M.left - 32, y: M.top - 4 }, svg).textContent = "in";

    seasons.forEach((s) => {
      const isLast = s.wy === wy1;
      const bar = el("rect", { class: isLast ? "bar bar-current" : "bar",
                               x: x(s.wy) - bw / 2, y: y(s.total_in),
                               width: bw, height: Math.max(0, y(0) - y(s.total_in)) }, svg);
      bar.addEventListener("mousemove", () => tip.show(
        `<span class="tt-head">${s.wy - 1}–${String(s.wy % 100).padStart(2, "0")}</span><br>` +
        `${s.total_in}" · ${s.snow_days} snow days<br>biggest day ${s.max_daily_in}"`,
        x(s.wy) / W, y(s.total_in) / H));
      bar.addEventListener("mouseleave", tip.hide);
    });
    el("line", { class: "median-line", x1: M.left, x2: M.left + PW,
                 y1: y(mean), y2: y(mean) }, svg);
    el("text", { class: "series-label", x: M.left + 4, y: y(mean) - 5 }, svg)
      .textContent = `mean ${mean}"`;
    el("line", { class: "baseline", x1: M.left, x2: M.left + PW, y1: y(0), y2: y(0) }, svg);

    const decade0 = Math.ceil(wy0 / 10) * 10;
    for (let wy = decade0; wy <= wy1; wy += 10)
      el("text", { class: "ax-tick", x: x(wy), y: M.top + PH + 16,
                   "text-anchor": "middle" }, svg).textContent = wy;
  }

  /* Sortable tables */
  function makeSortable(table) {
    const ths = table.querySelectorAll("th");
    ths.forEach((th, col) => {
      th.addEventListener("click", () => {
        const tbody = table.querySelector("tbody");
        const rows = [...tbody.querySelectorAll("tr")];
        const numeric = th.dataset.sort === "num";
        const asc = !th.classList.contains("sorted-asc");
        rows.sort((a, b) => {
          const av = a.children[col].textContent.trim();
          const bv = b.children[col].textContent.trim();
          const cmp = numeric ? parseFloat(av) - parseFloat(bv) : av.localeCompare(bv);
          return asc ? cmp : -cmp;
        });
        ths.forEach((o) => o.classList.remove("sorted-asc", "sorted-desc"));
        th.classList.add(asc ? "sorted-asc" : "sorted-desc");
        rows.forEach((tr) => tbody.appendChild(tr));
      });
    });
  }

  fetch((window.CSR_BASE || "") + "/data/climatology.json")
    .then((r) => r.json())
    .then((data) => {
      document.querySelectorAll("svg.monthly-chart").forEach((svg) =>
        monthlyChart(svg, data, svg.dataset.resort));
      document.querySelectorAll("svg.seasons-chart").forEach((svg) =>
        seasonsChart(svg, data, svg.dataset.resort));
    });
  document.querySelectorAll("table.sortable").forEach(makeSortable);
})();
