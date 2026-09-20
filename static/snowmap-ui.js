/* Bridger Bowl snow-quality map — loading, rendering and controls.
 * Physics lives in snowmap.js; this file only turns its output into pixels.
 */
(function () {
  "use strict";
  const { Model, clamp } = window.SnowMapModel;

  // Dark red = worst, dark green = best, pale through the middle so the
  // hillshade underneath still reads.
  const RAMP = [
    [0, [103, 0, 13]], [12, [165, 15, 21]], [25, [203, 24, 29]],
    [38, [239, 101, 72]], [50, [253, 212, 158]], [62, [166, 217, 106]],
    [75, [102, 189, 99]], [88, [26, 152, 80]], [100, [0, 68, 27]],
  ];
  function rampColor(v) {
    v = clamp(v, 0, 100);
    for (let i = 1; i < RAMP.length; i++) {
      if (v <= RAMP[i][0]) {
        const [a, ca] = RAMP[i - 1], [b, cb] = RAMP[i];
        const f = (v - a) / (b - a);
        return [ca[0] + f * (cb[0] - ca[0]), ca[1] + f * (cb[1] - ca[1]),
                ca[2] + f * (cb[2] - ca[2])];
      }
    }
    return RAMP[RAMP.length - 1][1];
  }
  const hex2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16),
                        parseInt(h.slice(5, 7), 16)];

  function loadImageData(url) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement("canvas");
        cv.width = img.width; cv.height = img.height;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        res(cx.getImageData(0, 0, img.width, img.height));
      };
      img.onerror = () => rej(new Error("failed to load " + url));
      img.src = url;
    });
  }

  async function boot(root) {
    const base = root.dataset.assets;
    const [meta, vectors, ta, tb, sx0, sx1, sx2, rmask] = await Promise.all([
      fetch(base + "/map_meta.json").then(r => r.json()),
      fetch(base + "/bridger_vectors.json").then(r => r.json()),
      loadImageData(base + "/terrain_a.png"), loadImageData(base + "/terrain_b.png"),
      loadImageData(base + "/sx_0.png"), loadImageData(base + "/sx_1.png"),
      loadImageData(base + "/sx_2.png"), loadImageData(base + "/run_mask.png"),
    ]);

    // ---- unpack the terrain PNGs into the arrays the model wants ----
    const nx = meta.grid.nx, ny = meta.grid.ny, n = nx * ny;
    const enc = meta.encoding;
    const T = { n, elevKft: new Float32Array(n), cosb: new Float32Array(n),
                sinb: new Float32Array(n), aspectRad: new Float32Array(n),
                inBounds: new Uint8Array(n), hill: new Float32Array(n),
                slopeDeg: new Float32Array(n), aspectDeg: new Float32Array(n),
                sx: [] };
    for (let k = 0; k < 8; k++) T.sx[k] = new Float32Array(n);
    const A = ta.data, B = tb.data;
    const sxSrc = [sx0.data, sx1.data, sx2.data];
    for (let i = 0; i < n; i++) {
      const p = i * 4;
      const elevM = ((A[p] << 8) | A[p + 1]) / enc.elev_scale + enc.elev_offset_m;
      T.elevKft[i] = elevM * 3.28084 / 1000;
      const slope = A[p + 2] / enc.slope_scale;
      T.slopeDeg[i] = slope;
      T.cosb[i] = Math.cos(slope * Math.PI / 180);
      T.sinb[i] = Math.sin(slope * Math.PI / 180);
      const aspect = B[p] * enc.aspect_scale;
      T.aspectDeg[i] = aspect;
      T.aspectRad[i] = aspect * Math.PI / 180;
      T.inBounds[i] = B[p + 1] > 127 ? 1 : 0;
      T.hill[i] = B[p + 2] / 255;
      for (let k = 0; k < 8; k++) {
        const g = (k / 3) | 0, ch = k % 3;
        T.sx[k][i] = sxSrc[g][p + ch] * (2 * enc.sx_offset) / 255 - enc.sx_offset;
      }
    }
    const runOf = new Uint16Array(n);
    for (let i = 0; i < n; i++) runOf[i] = rmask.data[i * 4] | (rmask.data[i * 4 + 1] << 8);

    const model = new Model(meta);
    const catInfo = meta.categories;

    // ---- DOM ----
    const cv = root.querySelector(".snowmap-canvas");
    cv.width = nx; cv.height = ny;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(nx, ny);
    const svg = root.querySelector(".snowmap-vec");
    svg.setAttribute("viewBox", `0 0 ${nx} ${ny}`);
    const tip = root.querySelector(".snowmap-tip");
    const inputs = {};
    root.querySelectorAll("[data-field]").forEach(el => inputs[el.dataset.field] = el);
    let mode = "score", field = null, stretch = false;

    function conditions() {
      const v = k => parseFloat(inputs[k].value);
      const month = parseInt(inputs.month.value, 10);
      const yr = month >= 10 ? 2025 : 2026;
      return {
        date: `${yr}-${String(month).padStart(2, "0")}-15`,
        snow_in_mid: v("snow"), swe_in_mid: v("snow") / Math.max(v("slrGuess"), 4),
        t_storm_c: v("temp"), t_trend_c: v("trend"),
        wind_dir_deg: v("wdir"), wind_ridge_mph: v("wspd"),
        gap_days: v("gap"), gap_tmax_c: v("gaptmax"), gap_cloud: v("cloud") / 100,
      };
    }

    function drawVectors() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      const NS = "http://www.w3.org/2000/svg";
      const add = (tag, attrs, cls) => {
        const e = document.createElementNS(NS, tag);
        for (const k in attrs) e.setAttribute(k, attrs[k]);
        if (cls) e.setAttribute("class", cls);
        svg.appendChild(e); return e;
      };
      const pts = px => px.map(p => p.join(",")).join(" ");
      vectors.boundary.forEach(b => add("polyline", { points: pts(b.px) }, "vec-boundary"));
      vectors.runs.forEach(r => add("polyline", { points: pts(r.px) }, "vec-run"));
      vectors.lifts.forEach(l => add("polyline", { points: pts(l.px) }, "vec-lift"));
    }

    function render() {
      const cond = conditions();
      field = model.evaluate(T, cond);
      const d = img.data;
      const showCat = mode === "category";

      // Optional contrast stretch. On a genuinely uniform day the absolute
      // scale is nearly one colour, which is honest but hides the ordering,
      // so this rescales the ramp to the day's own 2nd-98th percentile. The
      // numbers reported everywhere else stay absolute.
      let lo = 0, hi = 100;
      if (stretch && !showCat) {
        const vals = [];
        for (let i = 0; i < n; i++) if (T.inBounds[i]) vals.push(field.score[i]);
        vals.sort((a, b) => a - b);
        lo = vals[Math.floor(vals.length * 0.02)];
        hi = vals[Math.floor(vals.length * 0.98)];
        if (hi - lo < 4) { const c = (hi + lo) / 2; lo = c - 2; hi = c + 2; }
      }
      const stretched = v => stretch && !showCat
        ? clamp((v - lo) / (hi - lo) * 100, 0, 100) : v;

      for (let i = 0; i < n; i++) {
        const p = i * 4;
        const shade = 40 + T.hill[i] * 215;          // grey shaded relief
        if (!T.inBounds[i]) {
          // terrain outside the ski area still matters: it is the ridge that
          // makes Bridger a lee slope. Keep it fully opaque, just desaturated.
          const g = shade * 0.55 + 110;
          d[p] = d[p + 1] = d[p + 2] = g; d[p + 3] = 255;
          continue;
        }
        const rgb = showCat ? hex2rgb(catInfo[field.cat[i]].color)
                            : rampColor(stretched(field.score[i]));
        // multiply the quality colour into the hillshade so terrain shows through
        const k = 0.42 + 0.58 * T.hill[i];
        d[p] = rgb[0] * k + shade * 0.30;
        d[p + 1] = rgb[1] * k + shade * 0.30;
        d[p + 2] = rgb[2] * k + shade * 0.30;
        d[p + 3] = 235;
      }
      ctx.putImageData(img, 0, 0);
      updateReadout(cond);
      updateRuns();
    }

    function updateReadout(cond) {
      const bands = { base: [5.8, 6.7], mid: [6.7, 7.7], top: [7.7, 9.0] };
      const acc = {}; for (const b in bands) acc[b] = { s: 0, d: 0, n: 0 };
      const catCount = new Array(catInfo.length).fill(0);
      let tot = 0, sSum = 0;
      for (let i = 0; i < n; i++) {
        if (!T.inBounds[i]) continue;
        tot++; sSum += field.score[i]; catCount[field.cat[i]]++;
        for (const b in bands) {
          if (T.elevKft[i] >= bands[b][0] && T.elevKft[i] < bands[b][1]) {
            acc[b].s += field.score[i]; acc[b].d += field.depth[i]; acc[b].n++;
          }
        }
      }
      const fmt = b => acc[b].n ? `${(acc[b].d / acc[b].n).toFixed(1)}"` : "–";
      const fmtS = b => acc[b].n ? Math.round(acc[b].s / acc[b].n) : "–";
      root.querySelector(".sm-headline").textContent =
        `${Math.round(sSum / tot)} / 100 · ${field.structure}`;
      root.querySelector(".sm-bands").innerHTML =
        ["top", "mid", "base"].map(b =>
          `<div><span class="sm-band-k">${b}</span>` +
          `<span class="sm-band-d">${fmt(b)}</span>` +
          `<span class="sm-band-s" style="background:${
            `rgb(${rampColor(acc[b].n ? acc[b].s / acc[b].n : 0).map(Math.round).join(",")})`
          }">${fmtS(b)}</span></div>`).join("");
      const order = catCount.map((c, i) => [c, i]).filter(x => x[0] / tot > 0.005)
        .sort((a, b) => b[0] - a[0]);
      const ends = root.querySelector(".sm-ramp-ends");
      ends.firstElementChild.textContent = stretch ? "worst here" : "worse";
      ends.lastElementChild.textContent = stretch ? "best here" : "better";
      root.querySelector(".sm-mix").innerHTML = order.map(([c, i]) =>
        `<li><i style="background:${catInfo[i].color}"></i>${catInfo[i].label}` +
        `<b>${Math.round(100 * c / tot)}%</b></li>`).join("");
    }

    function updateRuns() {
      const sums = new Float64Array(meta.runs.length + 1);
      const deps = new Float64Array(meta.runs.length + 1);
      const cnts = new Float64Array(meta.runs.length + 1);
      const catv = meta.runs.map(() => new Array(catInfo.length).fill(0));
      const idx = {}; meta.runs.forEach((r, i) => idx[r.id] = i);
      for (let i = 0; i < n; i++) {
        const rid = runOf[i];
        if (!rid || !T.inBounds[i]) continue;
        const j = idx[rid]; if (j === undefined) continue;
        sums[j] += field.score[i]; deps[j] += field.depth[i]; cnts[j]++;
        catv[j][field.cat[i]]++;
      }
      const rows = meta.runs.map((r, j) => {
        if (!cnts[j]) return null;
        let best = 0; for (let k = 1; k < catInfo.length; k++) if (catv[j][k] > catv[j][best]) best = k;
        return { name: r.name, score: sums[j] / cnts[j], depth: deps[j] / cnts[j],
                 cat: catInfo[best], lo: r.elev_lo_ft, hi: r.elev_hi_ft,
                 aspect: r.aspect_deg };
      }).filter(Boolean).sort((a, b) => b.score - a.score);
      const compass = a => ["N","NE","E","SE","S","SW","W","NW"][Math.round(a / 45) % 8];
      root.querySelector(".sm-runs tbody").innerHTML = rows.map((r, i) =>
        `<tr><td class="sm-rank">${i + 1}</td><td>${r.name}</td>` +
        `<td class="sm-num">${r.depth.toFixed(1)}"</td>` +
        `<td class="sm-asp">${compass(r.aspect)}</td>` +
        `<td><span class="sm-chip" style="background:${r.cat.color}">${r.cat.label}</span></td>` +
        `<td class="sm-num"><b style="color:rgb(${rampColor(r.score).map(Math.round).join(",")})">` +
        `${Math.round(r.score)}</b></td></tr>`).join("");
    }

    // ---- hover readout ----
    cv.addEventListener("mousemove", ev => {
      const b = cv.getBoundingClientRect();
      const x = Math.floor((ev.clientX - b.left) / b.width * nx);
      const y = Math.floor((ev.clientY - b.top) / b.height * ny);
      const i = y * nx + x;
      if (x < 0 || y < 0 || x >= nx || y >= ny || !T.inBounds[i]) { tip.hidden = true; return; }
      const compass = a => ["N","NE","E","SE","S","SW","W","NW"][Math.round(a / 45) % 8];
      const rid = runOf[i];
      const run = rid ? (meta.runs.find(r => r.id === rid) || {}).name : null;
      tip.hidden = false;
      tip.style.left = (ev.clientX - b.left + 14) + "px";
      tip.style.top = (ev.clientY - b.top + 14) + "px";
      tip.innerHTML =
        (run ? `<span class="tt-head">${run}</span><br>` : "") +
        `<b>${Math.round(field.score[i])}/100</b> · ${catInfo[field.cat[i]].label}<br>` +
        `${(T.elevKft[i] * 1000).toFixed(0)} ft · ${compass(T.aspectDeg[i])} · ` +
        `${T.slopeDeg[i].toFixed(0)}°<br>` +
        `${field.depth[i].toFixed(1)}" new · SLR ${field.slr[i].toFixed(0)}:1 · ` +
        `${field.tpx[i].toFixed(1)}°C<br>` +
        `wind ${field.wind[i].toFixed(0)} mph · melt ${(field.melt[i] / 1e6).toFixed(2)} MJ`;
    });
    cv.addEventListener("mouseleave", () => { tip.hidden = true; });

    // ---- controls ----
    let pending = false;
    function schedule() {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; render(); });
    }
    // Initial state from the query string, so a map view can be linked to
    // from a forecast post: ?snow=11&temp=-11&mode=category
    const params = new URLSearchParams(location.search);
    params.forEach((v, k) => {
      if (inputs[k] && v !== "" && !isNaN(parseFloat(v))) inputs[k].value = v;
    });
    if (params.get("mode") === "category") mode = "category";
    if (params.get("stretch") === "1") stretch = true;

    function syncUrl() {
      const q = new URLSearchParams();
      Object.keys(inputs).forEach(k => q.set(k, inputs[k].value));
      if (mode !== "score") q.set("mode", mode);
      if (stretch) q.set("stretch", "1");
      history.replaceState(null, "", location.pathname + "?" + q.toString());
    }

    root.querySelectorAll("input[data-field]").forEach(el => {
      el.addEventListener("input", () => {
        const out = root.querySelector(`[data-out="${el.dataset.field}"]`);
        if (out) out.textContent = el.dataset.fmt
          ? el.dataset.fmt.replace("%v", el.value) : el.value;
        syncUrl();
        schedule();
      });
      el.dispatchEvent(new Event("input"));
    });
    root.querySelectorAll("[data-mode]").forEach(btn => {
      btn.addEventListener("click", () => {
        mode = btn.dataset.mode;
        root.querySelectorAll("[data-mode]").forEach(b =>
          b.classList.toggle("is-on", b === btn));
        syncUrl();
        root.querySelector(".sm-ramp").hidden = mode !== "score";
        root.querySelector(".sm-ramp-ends").hidden = mode !== "score";
        root.querySelector(".sm-legend-cat").hidden = mode !== "category";
        render();
      });
    });
    const stretchBtn = root.querySelector("[data-stretch]");
    if (stretchBtn) stretchBtn.addEventListener("click", () => {
      stretch = !stretch;
      stretchBtn.classList.toggle("is-on", stretch);
      syncUrl();
      root.querySelector(".sm-ramp-ends").dataset.stretched = stretch ? "1" : "";
      render();
    });
    root.querySelectorAll("[data-preset]").forEach(btn => {
      btn.addEventListener("click", () => {
        const p = JSON.parse(btn.dataset.preset);
        for (const k in p) if (inputs[k]) inputs[k].value = p[k];
        root.querySelectorAll("input[data-field]").forEach(el =>
          el.dispatchEvent(new Event("input")));
      });
    });

    // reflect any restored mode on the controls before the first paint
    root.querySelectorAll("[data-mode]").forEach(b =>
      b.classList.toggle("is-on", b.dataset.mode === mode));
    if (stretchBtn) stretchBtn.classList.toggle("is-on", stretch);
    root.querySelector(".sm-ramp").hidden = mode !== "score";
    root.querySelector(".sm-ramp-ends").hidden = mode !== "score";
    root.querySelector(".sm-legend-cat").hidden = mode !== "category";

    // legend swatches
    root.querySelector(".sm-legend-cat").innerHTML = catInfo.map(c =>
      `<span><i style="background:${c.color}"></i>${c.label}</span>`).join("");
    const grad = root.querySelector(".sm-ramp");
    grad.style.background = "linear-gradient(to right," + RAMP.map(([v, c]) =>
      `rgb(${c.join(",")}) ${v}%`).join(",") + ")";

    drawVectors();
    render();
    root.classList.remove("is-loading");
    root.dataset.ready = "1";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const root = document.querySelector(".snowmap");
    if (root) boot(root).catch(e => {
      root.classList.remove("is-loading");
      root.querySelector(".sm-headline").textContent = "map failed to load: " + e.message;
      console.error(e);
    });
  });
})();
