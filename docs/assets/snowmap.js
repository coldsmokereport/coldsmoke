/* Bridger Bowl snow-quality map.
 *
 * Re-runs the mtnsnow ski-quality physics per pixel in the browser, so the
 * sliders respond immediately on a static site. The formulation is a direct
 * port of ~/mtnsnow/10_skimap/snow_quality.py; every constant arrives in
 * map_meta.json rather than being written twice, and check_js_parity.js
 * asserts the two implementations agree pixel for pixel.
 *
 * Terrain arrives as lossless RGB PNGs (see export_web.py for the packing).
 */
(function (global) {
  "use strict";

  // ===== small helpers =====
  const clamp = (v, lo, hi) => v < lo ? lo : (v > hi ? hi : v);
  const D2R = Math.PI / 180, R2D = 180 / Math.PI;

  // ===== solar geometry: Spencer declination + equation of time =====
  // Port of crust_seb.solar_position(); ts is a UTC Date.
  function solarPosition(ts, lat, lon) {
    const start = Date.UTC(ts.getUTCFullYear(), 0, 1);
    const doy = Math.floor((ts.getTime() - start) / 86400000) + 1;
    const fracH = ts.getUTCHours() + ts.getUTCMinutes() / 60;
    const g = 2 * Math.PI * (doy - 1) / 365;
    const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g)
      - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g)
      - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    const eot = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g)
      - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    const e0 = 1.00011 + 0.034221 * Math.cos(g) + 0.00128 * Math.sin(g)
      + 0.000719 * Math.cos(2 * g) + 0.000077 * Math.sin(2 * g);
    const tst = fracH + lon / 15 + eot / 60;
    const H = D2R * 15 * (tst - 12);
    const phi = lat * D2R;
    let cosz = Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H);
    cosz = clamp(cosz, -1, 1);
    const z = Math.acos(cosz);
    let cosAz = (Math.sin(decl) - Math.sin(phi) * cosz) / (Math.cos(phi) * Math.sin(z));
    cosAz = clamp(cosAz, -1, 1);
    let az = Math.acos(cosAz) * R2D;
    if (H > 0) az = 360 - az;               // afternoon swings west
    return { cosz, az, e0 };
  }

  // Erbs diffuse fraction, identical to the Python side.
  function erbsDiffuseFraction(kt) {
    if (kt <= 0.22) return 1 - 0.09 * kt;
    if (kt <= 0.80) {
      return 0.9511 - 0.1604 * kt + 4.388 * kt * kt
        - 16.638 * kt * kt * kt + 12.336 * kt * kt * kt * kt;
    }
    return 0.165;
  }

  // ===== the model =====
  function Model(meta) {
    this.meta = meta;
    this.m = meta.model;
    this.site = meta.site;
    this.cats = meta.categories.map(c => c.key);
  }

  Model.prototype.lapse = function (t2m, t700) {
    const b = this.m.lapse_coef, cl = this.m.lapse_clip;
    return clamp(b[0] + b[1] * t2m + b[2] * (t700 - t2m), cl[0], cl[1]);
  };

  Model.prototype.slr = function (tC) {
    const c = this.m.slr_coef, r = this.m.slr_t_range;
    const t = clamp(tC, r[0], r[1]);
    return Math.max(c[0] * t * t + c[1] * t + c[2], 3.0);
  };

  /* Sx for an arbitrary wind direction, interpolated between the two
     bracketing 45-degree sectors — mirrors QualityEngine.sx_for_direction. */
  Model.prototype.sxAt = function (T, i, wdir) {
    const sectors = this.m_sectors || (this.m_sectors = this.meta.encoding.sx_sectors);
    const w = ((wdir % 360) + 360) % 360;
    const lo = Math.floor(w / 45) % sectors.length;
    const hi = (lo + 1) % sectors.length;
    const f = (w - sectors[lo] * 1) / 45;
    const ff = clamp(f < 0 ? f + 8 : f, 0, 1);
    return (1 - ff) * T.sx[lo][i] + ff * T.sx[hi][i];
  };

  /* One evaluation over the whole grid. Returns typed arrays the renderer and
     the run-ranking table both read. */
  Model.prototype.evaluate = function (T, c) {
    const n = T.n, m = this.m, S = m.score;
    const out = {
      score: new Float32Array(n), depth: new Float32Array(n),
      slr: new Float32Array(n), tpx: new Float32Array(n),
      swe: new Float32Array(n), melt: new Float32Array(n),
      wind: new Float32Array(n), cat: new Uint8Array(n),
      severity: new Float32Array(n), felt: new Float32Array(n),
      transport: new Float32Array(n), shelter: new Float32Array(n),
    };
    const t700 = (c.t700_c === undefined || c.t700_c === null) ? c.t_storm_c - 6 : c.t700_c;
    const lapse = this.lapse(c.t_storm_c, t700);
    const midKft = this.site.mid_kft, baseKft = this.site.base_kft, ridgeKft = this.site.ridge_kft;

    // ---- elevation block: T, SLR, SWE, dry depth ----
    const slrMid = this.slr(c.t_storm_c);
    const sfMid = clamp((2.5 - c.t_storm_c) / 2.0, 0, 1);
    const dryDepth = new Float32Array(n);
    const snowFrac = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const dz = T.elevKft[i] - midKft;
      const t = c.t_storm_c + lapse * dz;
      const slr = this.slr(t);
      const slrRatio = clamp(slr / slrMid, 0.7, 1.5);
      const oro = 1 + m.oro_slope * dz;
      const sf = clamp((2.5 - t) / 2.0, 0, 1);
      const phase = Math.min(sf / Math.max(sfMid, 0.05), 1.25);
      dryDepth[i] = c.snow_in_mid * clamp(slrRatio * oro * phase, 0, 2.5);
      out.swe[i] = c.swe_in_mid * oro * sf / Math.max(sfMid, 0.05);
      out.slr[i] = slr; out.tpx[i] = t; snowFrac[i] = sf;
    }

    // ---- wind block: Sx shelter, local wind, redistribution ----
    let dryIn = 0, wetIn = 0;
    for (let i = 0; i < n; i++) {
      const sx = this.sxAt(T, i, c.wind_dir_deg);
      const shelter = Math.tanh(sx / m.sx_scale);
      const fElev = clamp(0.20 + 0.80 * (T.elevKft[i] - baseKft) / (ridgeKft - baseKft), 0.20, 1.15);
      const fShel = clamp(1 - 0.55 * shelter, 0.35, 1.6);
      const wLocal = c.wind_ridge_mph * fElev * fShel;
      const intensity = clamp((wLocal - m.wind_thresh_mph) / (m.wind_ref_mph - m.wind_thresh_mph), 0, 1);
      out.wind[i] = wLocal; out.transport[i] = intensity; out.shelter[i] = shelter;
      const d = Math.max(dryDepth[i] * (1 + m.max_redist * intensity * shelter), 0);
      out.depth[i] = d;
      if (T.inBounds[i]) { dryIn += dryDepth[i]; wetIn += d; }
    }
    // redistribution moves snow around the hill, it does not create it
    if (wetIn > 0) {
      const k = dryIn / wetIn;
      for (let i = 0; i < n; i++) out.depth[i] *= k;
    }

    // ---- crust block: one 24-hour SEB cycle at the gap midpoint ----
    const seb = m.seb;
    const gapDays = Math.max(c.gap_days, 1e-6);
    const totalH = Math.max(Math.round(gapDays * 24), 1);
    const weight = totalH / 24;
    const albedo = 0.70 + 0.14 * (12 / gapDays) * (1 - Math.exp(-gapDays / 12));
    const end = new Date(c.date + "T00:00:00Z");
    const mid = new Date(end.getTime() - totalH * 3600000 / 2);
    const midUTC = Date.UTC(mid.getUTCFullYear(), mid.getUTCMonth(), mid.getUTCDate());
    const gapLapse = this.lapse(c.gap_tmax_c, c.gap_tmax_c - 6);
    const eClear = 0.75 + 0.25 * c.gap_cloud;
    const uMs = 4.8 / 2.23694;

    for (let h = 0; h < 24; h++) {
      const tsUTC = new Date(midUTC + (h + 7) * 3600000);   // local MST -> UTC
      const sp = solarPosition(tsUTC, this.site.lat, this.site.lon);
      const cz = sp.cosz;
      const tMid = c.gap_tmax_c - 6 * (1 - Math.cos(Math.PI * (h - 15) / 12)) / 2;

      let ssrd = 0, dni = 0, diffuseH = 0, sinZ = 0, sazR = 0;
      if (cz > 0.02) {
        const ghiClear = seb.solar_const * sp.e0 * cz * Math.pow(0.75, 1 / Math.max(cz, 0.05));
        ssrd = ghiClear * (1 - 0.75 * c.gap_cloud);
        const i0 = seb.solar_const * sp.e0;
        const kt = clamp(ssrd / (i0 * Math.max(cz, 0)), 0, 1);
        const df = erbsDiffuseFraction(kt);
        diffuseH = df * ssrd;
        const directH = Math.max(ssrd - diffuseH, 0);
        dni = cz > 0.087 ? directH / Math.max(cz, 0.087) : 0;
        sinZ = Math.sin(Math.acos(clamp(cz, -1, 1)));
        sazR = sp.az * D2R;
      }

      for (let i = 0; i < n; i++) {
        const tPx = tMid + gapLapse * (T.elevKft[i] - midKft);
        let sSlope = 0;
        if (cz > 0.02) {
          const cosb = T.cosb[i], sinb = T.sinb[i];
          const cosInc = Math.max(cosb * cz + sinb * sinZ * Math.cos(sazR - T.aspectRad[i]), 0);
          sSlope = dni * cosInc + diffuseH * (1 + cosb) / 2
            + ssrd * seb.alb_ground * (1 - cosb) / 2;
        }
        const tk = tPx + 273.15;
        const lwNet = seb.eps * (eClear * seb.sigma * tk * tk * tk * tk) - seb.lw_out;
        const qH = 1.2 * seb.cp_air * seb.c_h * uMs * tPx;
        const qNet = sSlope * (1 - albedo) + lwNet + qH;
        if (qNet > 0) out.melt[i] += qNet * 3600 * weight;
      }
    }

    // ---- structure (one label for the whole storm) ----
    let structure = "uniform";
    if (c.t_trend_c <= m.rsu_trend_c) structure = "right-side-up";
    else if (c.t_trend_c >= m.ud_trend_c) structure = "upside-down";
    out.structure = structure;

    // ---- score + category ----
    const eCrit = m.e_crit, bury = m.bury_swe_in, blower = m.blower_slr;
    const CI = {}; this.cats.forEach((k, i) => CI[k] = i);
    for (let i = 0; i < n; i++) {
      const depth = out.depth[i], slr = out.slr[i], swe = out.swe[i];
      const severity = clamp(out.melt[i] / (eCrit * S.crust_sat), 0, 1);
      const burial = clamp(swe / bury, 0, 1);
      const felt = severity * (1 - burial) * (1 - clamp(depth / 12, 0, 1));
      out.severity[i] = severity; out.felt[i] = felt;
      const crusted = out.melt[i] >= eCrit;
      const feltCrust = felt > 0.15;
      const wet = snowFrac[i] < 0.5 || out.tpx[i] > 1.0;

      const densityQ = clamp((slr - S.slr_poor) / (blower - S.slr_poor), 0, 1);
      const goods = S.goods_max * Math.tanh(depth / S.depth_sat_in)
        * (S.density_floor + (1 - S.density_floor) * densityQ);
      const surfaceMult = 1 - S.crust_penalty * felt;
      let structMult = 1;
      if (structure === "right-side-up") structMult = 1 + (S.struct_rsu - 1) * Math.tanh(depth / 6);
      else if (structure === "upside-down") structMult = 1 - (1 - S.struct_ud) * Math.tanh(depth / 4);
      const sh = out.shelter[i], tr = out.transport[i];
      const windMult = (1 - S.scour_penalty * clamp(-sh, 0, 1) * tr)
        * (1 - S.slab_penalty * clamp(sh, 0, 1) * tr * clamp(depth / 4, 0, 1));
      const wetMult = 1 - S.wet_penalty * (1 - snowFrac[i]);
      const oldSurface = S.old_surface_max * (1 - severity);
      const stormShare = clamp(depth / 4, 0, 1);
      out.score[i] = clamp(oldSurface * (1 - stormShare)
        + goods * surfaceMult * structMult * windMult * wetMult, 0, 100);

      // category cascade — worst thing a skier notices wins
      const slab = sh > 0.25 && tr >= m.slab_min_intensity;
      const scoured = sh < -0.15 && tr >= m.scour_min_intensity;
      const thin = depth < 2.0;
      const clean = !feltCrust && !slab && !scoured;
      let k = CI.old_snow;
      if (!thin) k = CI.cold_refresh;
      if (!thin && clean && slr >= blower && depth >= 6 && structure !== "upside-down") k = CI.blower;
      if (structure === "right-side-up" && !thin && clean && depth >= 4 && slr < blower) k = CI.right_side_up;
      if (thin && depth >= 0.5 && severity < 0.25) k = CI.thin_cold;
      if (thin && depth < 0.5 && severity < 0.25) k = CI.old_snow;
      if (crusted && burial >= 1 && !thin) k = CI.crust_buried;
      if (structure === "upside-down" && !thin && depth >= 3 && !feltCrust) k = CI.upside_down;
      if (feltCrust && depth >= 0.5) k = CI.dust_on_crust;
      if (severity >= 0.25 && depth < 0.5) k = CI.bare_crust;
      if (slab && depth >= 1) k = CI.wind_slab;
      if (scoured) k = CI.wind_scoured;
      if (wet) k = CI.wet;
      out.cat[i] = k;
    }
    return out;
  };

  global.SnowMapModel = { Model, solarPosition, erbsDiffuseFraction, clamp };
  if (typeof module !== "undefined" && module.exports) module.exports = global.SnowMapModel;
})(typeof window !== "undefined" ? window : globalThis);
