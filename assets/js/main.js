/* =========================================================
   ALSALAYMEH GROUP — Site Engine
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const root = document.documentElement;
  const IMG = "assets/img/projects/";

  /* ---------------- Theme ---------------- */
  const savedTheme = localStorage.getItem("asg-theme");
  root.dataset.theme = savedTheme || "dark";
  function toggleTheme() {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    localStorage.setItem("asg-theme", root.dataset.theme);
    if (window.__refreshMapTiles) window.__refreshMapTiles();
  }

  /* ---------------- Language ---------------- */
  let LANG = localStorage.getItem("asg-lang") || "en";
  const T = (k) => (I18N[LANG] && I18N[LANG][k]) || I18N.en[k] || k;

  function applyLang() {
    root.lang = LANG;
    root.dir = LANG === "ar" ? "rtl" : "ltr";
    localStorage.setItem("asg-lang", LANG);
    $$("[data-i18n]").forEach((el) => { el.textContent = T(el.dataset.i18n); });
    $$("[data-i18n-ph]").forEach((el) => { el.placeholder = T(el.dataset.i18nPh); });
    $$("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", T(el.dataset.i18nAria)); });
    document.title = $("body").dataset.page === "project" && window.__projTitle
      ? window.__projTitle + " — Alsalaymeh Group"
      : T("meta_title");
    const md = $('meta[name="description"]');
    if (md && $("body").dataset.page !== "project") md.content = T("meta_desc");
    document.dispatchEvent(new CustomEvent("langchange"));
  }
  function toggleLang() {
    LANG = LANG === "en" ? "ar" : "en";
    applyLang();
  }

  /* ---------------- Isometric villa builder ---------------- */
  // A modern two-storey villa drawn as ~35 separate architectural pieces
  // (foundation, stone walls, glazing, slabs, timber band, roof, pool,
  // palm, lamps) so GSAP can scatter and reassemble it like a real build.
  const U = 34, HZ = 30;
  const NS = "http://www.w3.org/2000/svg";
  function proj(gx, gy, gz) {
    return { X: (gx - gy) * U * 0.866, Y: (gx + gy) * U * 0.5 - gz * HZ };
  }
  function shade(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.min(255, Math.round(v * f));
    return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
  }
  function poly(pts, fill, op) {
    const p = document.createElementNS(NS, "polygon");
    p.setAttribute("points", pts.map((q) => q.X.toFixed(1) + "," + q.Y.toFixed(1)).join(" "));
    p.setAttribute("fill", fill);
    p.setAttribute("stroke", "rgba(30,22,14,0.2)");
    p.setAttribute("stroke-width", "0.7");
    p.setAttribute("stroke-linejoin", "round");
    if (op != null) p.setAttribute("fill-opacity", op);
    return p;
  }
  function stroke(d, color, w, op) {
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", d);
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", color);
    p.setAttribute("stroke-width", w);
    p.setAttribute("stroke-linecap", "round");
    if (op != null) p.setAttribute("stroke-opacity", op);
    return p;
  }
  function circle(pt, r, fill, op) {
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", pt.X.toFixed(1)); c.setAttribute("cy", pt.Y.toFixed(1));
    c.setAttribute("r", r); c.setAttribute("fill", fill);
    if (op != null) c.setAttribute("fill-opacity", op);
    return c;
  }
  function boxFaces(g, x, y, z, w, d, h, base, opts = {}) {
    const t = opts.top || shade(base, 1.14);
    const L = opts.left || shade(base, 0.82);
    const R = opts.right || shade(base, 0.64);
    const o = opts.opacity;
    g.appendChild(poly([proj(x, y, z + h), proj(x + w, y, z + h), proj(x + w, y + d, z + h), proj(x, y + d, z + h)], t, o));
    g.appendChild(poly([proj(x, y + d, z + h), proj(x + w, y + d, z + h), proj(x + w, y + d, z), proj(x, y + d, z)], L, o));
    g.appendChild(poly([proj(x + w, y, z + h), proj(x + w, y + d, z + h), proj(x + w, y + d, z), proj(x + w, y, z)], R, o));
  }

  const VC = {
    plat: "#c9c2b0", deck: "#dcd5c3", white: "#eae6dc", stone: "#cdb896",
    wood: "#a97e4f", glass: "#2c4257", glassLite: "#9cc3d6",
    copper: "#c1703f", copper2: "#e0946a", green: "#4d7d58", green2: "#40684a",
    water: "#37b6c9", waterLite: "#a5e8ef", trunk: "#8c6a48",
    lawn: "#6b9a5f", lawn2: "#77a76a",
  };

  function buildVilla(svgId) {
    const svg = document.getElementById(svgId);
    if (!svg) return [];
    svg.innerHTML = "";

    // defs: soft shadow blur + realistic surface gradients
    const defs = document.createElementNS(NS, "defs");
    defs.innerHTML = `
      <filter id="${svgId}-blur" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="7"/>
      </filter>
      <linearGradient id="${svgId}-w" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#5fd6e6"/><stop offset="1" stop-color="#2496a8"/>
      </linearGradient>
      <linearGradient id="${svgId}-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#456a88"/><stop offset="1" stop-color="#20344a"/>
      </linearGradient>
      <linearGradient id="${svgId}-lit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#f4c986"/><stop offset="1" stop-color="#d99a4e"/>
      </linearGradient>
      <linearGradient id="${svgId}-c" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#e0946a"/><stop offset="1" stop-color="#a5592f"/>
      </linearGradient>`;
    svg.appendChild(defs);
    const GLASS = `url(#${svgId}-g)`, LIT = `url(#${svgId}-lit)`, WATER = `url(#${svgId}-w)`, CANOPY = `url(#${svgId}-c)`;

    const parts = [];
    const part = (fn) => {
      const g = document.createElementNS(NS, "g");
      fn(g);
      svg.appendChild(g);
      parts.push({ el: g });
    };
    const B = (x, y, z, w, d, h, c, opts) => part((g) => boxFaces(g, x, y, z, w, d, h, c, opts));
    // window with copper frame + glass reflection
    const winR = (x, y0, y1, z0, z1, mullion, fill) => part((g) => {
      const glass = poly([proj(x, y0, z1), proj(x, y1, z1), proj(x, y1, z0), proj(x, y0, z0)], fill || GLASS);
      glass.setAttribute("stroke", VC.copper); glass.setAttribute("stroke-width", "1.6");
      g.appendChild(glass);
      const a = proj(x, y0 + 0.1, z1 - 0.12), b = proj(x, y1 - 0.1, z0 + 0.18);
      g.appendChild(stroke(`M ${a.X} ${a.Y} L ${b.X} ${b.Y}`, "#ffffff", 1.4, fill ? 0.3 : 0.18));
      if (mullion) {
        const m0 = proj(x, (y0 + y1) / 2, z1), m1 = proj(x, (y0 + y1) / 2, z0);
        g.appendChild(stroke(`M ${m0.X} ${m0.Y} L ${m1.X} ${m1.Y}`, "#1d2f40", 2));
      }
    });
    const winL = (y, x0, x1, z0, z1) => part((g) => {
      const glass = poly([proj(x0, y, z1), proj(x1, y, z1), proj(x1, y, z0), proj(x0, y, z0)], GLASS);
      glass.setAttribute("stroke", VC.copper); glass.setAttribute("stroke-width", "1.6");
      glass.setAttribute("fill-opacity", "0.92");
      g.appendChild(glass);
      const a = proj(x0 + 0.1, y, z1 - 0.12), b = proj(x1 - 0.1, y, z0 + 0.18);
      g.appendChild(stroke(`M ${a.X} ${a.Y} L ${b.X} ${b.Y}`, "#ffffff", 1.4, 0.14));
    });

    /* — build order = real construction order (bottom → top) — */
    part((g) => {                                                        // soft ground shadow
      const e = document.createElementNS(NS, "ellipse");
      const c = proj(5.6, 4, 0);
      e.setAttribute("cx", c.X); e.setAttribute("cy", c.Y + 26);
      e.setAttribute("rx", 300); e.setAttribute("ry", 92);
      e.setAttribute("fill", "#000"); e.setAttribute("fill-opacity", "0.3");
      e.setAttribute("filter", `url(#${svgId}-blur)`);
      g.appendChild(e);
    });
    B(0, 0, 0, 11.2, 8, 0.4, VC.plat);                                   // ground platform
    part((g) => {                                                        // lawn with mow stripes
      g.appendChild(poly([proj(0.3, 5.7, 0.41), proj(6.6, 5.7, 0.41), proj(6.6, 7.75, 0.41), proj(0.3, 7.75, 0.41)], VC.lawn));
      for (let i = 0; i < 3; i++) {
        const x0 = 0.9 + i * 1.9;
        g.appendChild(poly([proj(x0, 5.7, 0.415), proj(x0 + 0.95, 5.7, 0.415), proj(x0 + 0.95, 7.75, 0.415), proj(x0, 7.75, 0.415)], VC.lawn2));
      }
    });
    B(7.05, 1.28, 0.26, 0.7, 1.35, 0.14, VC.deck);                       // entry step 1
    B(7.75, 1.4, 0.12, 0.55, 1.1, 0.14, VC.deck);                        // entry step 2
    [[8.45, 2.35], [8.62, 3.1], [8.79, 3.85], [8.96, 4.55]].forEach(([sx, sy]) =>
      B(sx, sy, 0.4, 0.6, 0.48, 0.05, shade(VC.deck, 1.06)));            // stepping stones to pool
    B(7.9, 4.7, 0.4, 3.1, 2.6, 0.32, VC.deck);                           // pool rim
    part((g) => {                                                        // pool water + ripples + waterline
      g.appendChild(poly([proj(8.13, 4.93, 0.66), proj(10.77, 4.93, 0.66), proj(10.77, 7.07, 0.66), proj(8.13, 7.07, 0.66)], WATER));
      const wl0 = proj(8.13, 4.93, 0.66), wl1 = proj(10.77, 4.93, 0.66), wl2 = proj(10.77, 7.07, 0.66);
      g.appendChild(stroke(`M ${wl0.X} ${wl0.Y} L ${wl1.X} ${wl1.Y} L ${wl2.X} ${wl2.Y}`, "#ffffff", 1.2, 0.5));
      const r1 = proj(8.7, 5.5, 0.66), r2 = proj(9.5, 6.2, 0.66), r3 = proj(8.9, 6.5, 0.66);
      g.appendChild(stroke(`M ${r1.X} ${r1.Y} q 18 5 40 0`, VC.waterLite, 1.6, 0.85));
      g.appendChild(stroke(`M ${r2.X} ${r2.Y} q 15 4 33 0`, VC.waterLite, 1.5, 0.7));
      g.appendChild(stroke(`M ${r3.X} ${r3.Y} q 12 3 26 0`, VC.waterLite, 1.3, 0.55));
    });
    part((g) => {                                                        // sun lounger
      boxFaces(g, 8.35, 7.42, 0.4, 1.15, 0.42, 0.14, VC.white);
      g.appendChild(poly([proj(8.35, 7.42, 0.98), proj(8.35, 7.84, 0.98), proj(8.72, 7.84, 0.54), proj(8.72, 7.42, 0.54)], shade(VC.white, 0.94)));
      g.appendChild(poly([proj(8.38, 7.45, 0.99), proj(8.38, 7.81, 0.99), proj(8.66, 7.81, 0.62), proj(8.66, 7.45, 0.62)], VC.copper2));
    });
    part((g) => {                                                        // pool umbrella
      const p0 = proj(10.05, 7.5, 0.4), p1 = proj(10.05, 7.5, 2.05);
      g.appendChild(stroke(`M ${p0.X} ${p0.Y} L ${p1.X} ${p1.Y}`, shade(VC.copper, 0.7), 2.4));
      const c = proj(10.05, 7.5, 2.05);
      const pts = [];
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        pts.push({ X: c.X + Math.cos(a) * 52, Y: c.Y + Math.sin(a) * 26 });
      }
      g.appendChild(poly(pts, CANOPY));
      pts.forEach((p, k) => { if (k % 2 === 0) g.appendChild(stroke(`M ${c.X} ${c.Y - 6} L ${p.X} ${p.Y}`, "#8a4a2b", 1.1, 0.7)); });
      g.appendChild(circle({ X: c.X, Y: c.Y - 8 }, 2.4, VC.copper2));
    });
    B(0.5, 6.7, 0.4, 2.0, 0.6, 0.6, VC.green);                           // hedge 1
    B(2.9, 6.7, 0.4, 1.4, 0.6, 0.5, VC.green2);                          // hedge 2
    part((g) => {                                                        // ground floor volume + stone coursing + plinth
      boxFaces(g, 1, 1, 0.4, 6, 4.2, 2.35, VC.stone);
      g.appendChild(poly([proj(7, 1, 0.72), proj(7, 5.2, 0.72), proj(7, 5.2, 0.4), proj(7, 1, 0.4)], shade(VC.stone, 0.5)));
      g.appendChild(poly([proj(1, 5.2, 0.72), proj(7, 5.2, 0.72), proj(7, 5.2, 0.4), proj(1, 5.2, 0.4)], shade(VC.stone, 0.62)));
      [1.25, 1.72, 2.19, 2.66].forEach((z) => {
        const a = proj(7, 1, z), b = proj(7, 5.2, z);
        g.appendChild(stroke(`M ${a.X} ${a.Y} L ${b.X} ${b.Y}`, "#8f7a52", 0.7, 0.5));
        const c2 = proj(1, 5.2, z), d2 = proj(7, 5.2, z);
        g.appendChild(stroke(`M ${c2.X} ${c2.Y} L ${d2.X} ${d2.Y}`, "#8f7a52", 0.7, 0.42));
      });
      for (let i = 0; i < 8; i++) {                                      // staggered stone joints
        const y = 1.3 + (i % 4) * 1.05 + (i > 3 ? 0.5 : 0);
        const z = i > 3 ? 1.72 : 1.25, z2 = z + 0.47;
        const a = proj(7, y, z), b = proj(7, y, z2);
        g.appendChild(stroke(`M ${a.X} ${a.Y} L ${b.X} ${b.Y}`, "#8f7a52", 0.6, 0.38));
      }
      const s0 = proj(7, 1, 2.62), s1 = proj(7, 5.2, 2.62);               // shadow under slab overhang
      g.appendChild(stroke(`M ${s0.X} ${s0.Y} L ${s1.X} ${s1.Y}`, "#000", 5, 0.12));
    });
    part((g) => {                                                        // entrance door (copper frame, warm light)
      g.appendChild(poly([proj(7, 1.3, 2.34), proj(7, 1.98, 2.34), proj(7, 1.98, 0.4), proj(7, 1.3, 0.4)], VC.copper));
      g.appendChild(poly([proj(7, 1.37, 2.26), proj(7, 1.91, 2.26), proj(7, 1.91, 0.4), proj(7, 1.37, 0.4)], LIT));
      g.appendChild(circle(proj(7, 1.48, 1.32), 1.7, "#8a4a2b"));
    });
    part((g) => {                                                        // potted olive bushes by the door
      [[7.35, 0.75], [7.35, 2.35]].forEach(([bx, by]) => {
        boxFaces(g, bx, by, 0.4, 0.34, 0.34, 0.3, VC.copper);
        const c = proj(bx + 0.17, by + 0.17, 1.05);
        g.appendChild(circle({ X: c.X - 5, Y: c.Y + 4 }, 7, VC.green2));
        g.appendChild(circle({ X: c.X + 5, Y: c.Y + 2 }, 8, VC.green));
        g.appendChild(circle({ X: c.X, Y: c.Y - 5 }, 7.5, shade(VC.green, 1.12)));
      });
    });
    winR(7, 2.25, 3.05, 0.95, 2.3);                                      // ground windows (front-right)
    winR(7, 3.35, 4.15, 0.95, 2.3);
    winR(7, 4.45, 5.05, 0.95, 2.3);
    winL(5.2, 1.5, 3.1, 0.95, 2.3);                                      // ground windows (front-left)
    winL(5.2, 3.5, 5.1, 0.95, 2.3);
    part((g) => {                                                        // first-floor slab + terrace tile joints
      boxFaces(g, 0.55, 0.55, 2.75, 7.05, 5.05, 0.35, VC.white);
      [1.3, 2.1, 2.9, 3.7, 4.5].forEach((y) => {
        const a = proj(7.12, y, 3.105), b = proj(7.58, y, 3.105);
        g.appendChild(stroke(`M ${a.X} ${a.Y} L ${b.X} ${b.Y}`, "#c9c2b0", 0.8, 0.8));
      });
    });
    part((g) => {                                                        // timber band + plank joints
      boxFaces(g, 2.4, 0.9, 3.1, 4.82, 4.42, 0.5, VC.wood);
      [3.27, 3.43].forEach((z) => {
        const a = proj(7.22, 0.9, z), b = proj(7.22, 5.32, z);
        g.appendChild(stroke(`M ${a.X} ${a.Y} L ${b.X} ${b.Y}`, shade(VC.wood, 0.7), 1.1));
        const c2 = proj(2.4, 5.32, z), d2 = proj(7.22, 5.32, z);
        g.appendChild(stroke(`M ${c2.X} ${c2.Y} L ${d2.X} ${d2.Y}`, shade(VC.wood, 0.62), 1.1));
      });
    });
    B(2.5, 1, 3.6, 4.6, 4.2, 1.8, VC.white);                             // upper volume
    winR(7.1, 1.25, 3.15, 3.85, 5.1, true);                              // upper corner glazing
    winR(7.1, 3.5, 4.95, 3.85, 5.1, false, LIT);                         // lit upper window
    winL(5.2, 2.95, 4.55, 3.85, 5.1);
    [[0.75, 1.9], [2.85, 1.9]].forEach(([ry, rd]) => part((g) => {       // glass balustrades + copper handrail
      boxFaces(g, 7.5, ry, 3.1, 0.07, rd, 0.78, VC.glassLite, { opacity: 0.4 });
      boxFaces(g, 7.48, ry, 3.88, 0.11, rd, 0.06, VC.copper);
    }));
    part((g) => {
      boxFaces(g, 2.7, 5.52, 3.1, 2.0, 0.07, 0.78, VC.glassLite, { opacity: 0.4 });
      boxFaces(g, 2.7, 5.5, 3.88, 2.0, 0.11, 0.06, VC.copper);
    });
    B(2.2, 0.7, 5.4, 5.2, 4.8, 0.32, "#e5e0d4");                         // roof slab
    B(7.3, 0.7, 5.38, 0.12, 4.8, 0.36, VC.copper);                       // copper fascia (right)
    B(2.2, 5.4, 5.38, 5.2, 0.12, 0.36, VC.copper);                       // copper fascia (left)
    [3.1, 4.15, 5.2].forEach((px) => B(px, 1.1, 5.72, 0.16, 3.4, 0.16, VC.wood)); // pergola beams
    B(6.3, 4.5, 5.72, 0.7, 0.7, 0.35, VC.glass, { top: VC.glassLite });  // skylight
    part((g) => {                                                        // palm trunk
      for (let i = 0; i < 4; i++)
        boxFaces(g, 5.3 + i * 0.02, 7.0 + i * 0.02, 0.4 + i * 0.62, 0.3, 0.3, 0.64, VC.trunk, {
          top: shade(VC.trunk, 1.15 - i * 0.04),
          left: shade(VC.trunk, 0.95 - i * 0.04),
          right: shade(VC.trunk, 0.82 - i * 0.04),
        });
    });
    part((g) => {                                                        // palm crown, two frond layers
      const A = proj(5.47, 7.17, 3.05);
      [-160, -128, -95, -62, -28, 6].forEach((deg) => {
        const a = (deg * Math.PI) / 180;
        g.appendChild(stroke(
          `M ${A.X} ${A.Y} Q ${A.X + Math.cos(a) * 36} ${A.Y + Math.sin(a) * 27 - 22} ${A.X + Math.cos(a) * 66} ${A.Y + Math.sin(a) * 36 + 20}`,
          VC.green2, 5.5));
      });
      [-145, -110, -78, -45, -12].forEach((deg) => {
        const a = (deg * Math.PI) / 180;
        g.appendChild(stroke(
          `M ${A.X} ${A.Y} Q ${A.X + Math.cos(a) * 30} ${A.Y + Math.sin(a) * 24 - 20} ${A.X + Math.cos(a) * 56} ${A.Y + Math.sin(a) * 32 + 14}`,
          VC.green, 5));
      });
      g.appendChild(circle({ X: A.X - 5, Y: A.Y + 6 }, 3.2, "#7a5836"));
      g.appendChild(circle({ X: A.X + 5, Y: A.Y + 7 }, 3.2, "#6d4f33"));
    });
    [3.4, 4.3].forEach((py) => part((g) => {                             // garden lamps
      boxFaces(g, 8.6, py, 0.4, 0.16, 0.16, 0.55, VC.copper);
      const top = proj(8.68, py + 0.08, 1.02);
      g.appendChild(circle(top, 5, VC.copper2, 0.25));
      g.appendChild(circle(top, 2.2, VC.copper2));
    }));

    const bb = svg.getBBox();
    svg.setAttribute("viewBox", `${(bb.x - 24).toFixed(0)} ${(bb.y - 24).toFixed(0)} ${(bb.width + 48).toFixed(0)} ${(bb.height + 48).toFixed(0)}`);
    return parts;
  }

  /* ---------------- GSAP scenes ---------------- */
  function heroTowerScene() {
    const parts = buildVilla("isoTower");
    if (!parts.length || !window.gsap) return;
    const els = parts.map((p) => p.el);

    // scattered pieces fly in and assemble in construction order
    parts.forEach((p) => {
      const a = Math.random() * Math.PI * 2;
      const d = 300 + Math.random() * 380;
      gsap.set(p.el, {
        x: Math.cos(a) * d,
        y: Math.sin(a) * d - 180,
        rotation: gsap.utils.random(-140, 140),
        scale: 0.25,
        opacity: 0,
        transformOrigin: "center",
      });
    });
    // scrub-driven disassembly, armed only once the villa is fully built so
    // the tween's start state is locked to the assembled position — scrolling
    // down scatters the pieces, scrolling back up rebuilds them, live
    const armScrub = () => {
      parts.forEach((p, i) => {
        const a = Math.random() * Math.PI * 2;
        const d = 160 + Math.random() * 280 + i * 6;
        gsap.fromTo(p.el,
          { x: 0, y: 0, rotation: 0, opacity: 1 },
          {
            x: Math.cos(a) * d,
            y: -Math.abs(Math.sin(a)) * d - 90 - i * 5,
            rotation: gsap.utils.random(-110, 110),
            opacity: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: {
              trigger: "#hero",
              start: "8% top",
              end: "bottom top",
              scrub: 0.6,
            },
          });
      });
    };

    gsap.to(els, {
      x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
      duration: 1.3,
      ease: "expo.out",
      stagger: { each: 0.03, from: "start" },
      delay: 0.35,
      onComplete: () => {
        gsap.to("#isoTower", { y: -10, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
        armScrub();
      },
    });
  }

  function processTowerScene() {
    const parts = buildVilla("isoProcess");
    if (!parts.length || !window.gsap) return;
    parts.forEach((p, i) => {
      const side = i % 2 ? 1 : -1;
      gsap.set(p.el, {
        x: side * (260 + Math.random() * 220),
        y: -320 - Math.random() * 220,
        rotation: gsap.utils.random(-130, 130),
        opacity: 0,
        transformOrigin: "center",
      });
    });
    gsap.to(parts.map((p) => p.el), {
      x: 0, y: 0, rotation: 0, opacity: 1,
      ease: "power2.out",
      stagger: { each: 0.03 },
      scrollTrigger: {
        trigger: "#process",
        start: "top 75%",
        end: "center center",
        scrub: 0.8,
      },
    });
  }

  function revealScenes() {
    const els = $$(".rv");
    if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("in")); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => io.observe(el));
    // safety: reveal anything still hidden after 6s (e.g. odd viewports)
    setTimeout(() => els.forEach((el) => el.classList.add("in")), 6000);
  }

  function heroTitleScene() {
    if (!window.gsap) return;
    const spans = $$(".hero-title .line span");
    gsap.from(spans, { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.12, delay: 0.55 });
    gsap.from(".hero-sub, .hero-ctas, .hero-since, .hero-copy .kicker", {
      opacity: 0, y: 26, duration: 1, ease: "expo.out", stagger: 0.09, delay: 0.75,
    });
  }

  /* ---------------- Hero slideshow ---------------- */
  function heroSlideshow() {
    const wrap = $(".hero-bg");
    if (!wrap) return;
    const imgs = $$("img", wrap);
    let i = 0;
    imgs[0].classList.add("on");
    setInterval(() => {
      imgs[i].classList.remove("on");
      i = (i + 1) % imgs.length;
      imgs[i].classList.add("on");
    }, 7000);
  }

  /* ---------------- Counters ---------------- */
  function counters() {
    const band = $("#stats");
    if (!band) return;
    const nums = $$(".stat b em");
    let done = false;
    const run = () => {
      if (done) return; done = true;
      nums.forEach((el) => {
        const target = +el.dataset.value;
        const obj = { v: 0 };
        if (window.gsap) {
          gsap.to(obj, {
            v: target, duration: 2.2, ease: "expo.out",
            onUpdate: () => { el.textContent = Math.round(obj.v); },
          });
        } else el.textContent = target;
      });
    };
    new IntersectionObserver((e, o) => { if (e[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: 0.4 }).observe(band);
  }

  /* ---------------- Projects grid ---------------- */
  function projectCard(p, tall) {
    const L = p[LANG] || p.en;
    return `
      <a class="proj-card ${tall ? "tall" : ""}" href="project.html?id=${p.id}" data-cat="${p.cat}">
        <div class="proj-media">
          <img src="${IMG}${p.id}/${p.hero}${tall ? "" : "-sm"}.webp" alt="${L.alt}" loading="lazy" />
        </div>
        <div class="proj-body">
          <div class="proj-meta"><span>${L.category}</span><i>·</i><span>${p.year}</span></div>
          <h3>${L.title}</h3>
          <div class="loc">${L.location} — ${p.images} ${T("photos")}</div>
          <span class="proj-view">${T("view_project")}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </span>
        </div>
      </a>`;
  }

  function renderProjects() {
    const grid = $("#projGrid");
    if (!grid) return;
    grid.innerHTML = PROJECTS.map((p, i) => projectCard(p, i === 0)).join("");
  }

  function filters() {
    const box = $(".filters");
    if (!box) return;
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      $$(".chip", box).forEach((c) => c.classList.toggle("on", c === btn));
      const f = btn.dataset.f;
      $$(".proj-card", $("#projGrid")).forEach((card) => {
        card.classList.toggle("hide", f !== "all" && card.dataset.cat !== f);
      });
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }

  /* ---------------- Jordan map (Leaflet) ---------------- */
  let map, tileLayer;
  function initMap() {
    const el = $("#jordanMap");
    if (!el || !window.L) return;
    map = L.map(el, { scrollWheelZoom: false, attributionControl: true });
    map.setView([31.6, 36.2], 8);
    const tiles = () =>
      root.dataset.theme === "dark"
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    tileLayer = L.tileLayer(tiles(), {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(map);
    window.__refreshMapTiles = () => tileLayer && tileLayer.setUrl(tiles());

    const markers = [];
    PROJECTS.forEach((p) => {
      const icon = L.divIcon({ className: "", html: '<div class="map-marker"></div>', iconSize: [22, 22], iconAnchor: [11, 11] });
      const m = L.marker(p.coords, { icon }).addTo(map);
      m.projectId = p.id;
      m.bindPopup("", { minWidth: 230 });
      m.on("popupopen", () => {
        const L2 = p[LANG] || p.en;
        m.setPopupContent(`
          <div class="map-pop">
            <img src="${IMG}${p.id}/${p.hero}-sm.webp" alt="${L2.alt}" />
            <h4>${L2.title}</h4>
            <p>${L2.location} · ${p.year}</p>
            <a href="project.html?id=${p.id}">${T("view_project")} →</a>
          </div>`);
      });
      markers.push(m);
    });
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.35));
  }

  /* ---------------- Testimonials ---------------- */
  function testimonials() {
    const items = $$(".testi");
    const dots = $$(".testi-dots button");
    if (!items.length) return;
    let i = 0, timer;
    const go = (n) => {
      i = (n + items.length) % items.length;
      items.forEach((t, k) => t.classList.toggle("on", k === i));
      dots.forEach((d, k) => d.classList.toggle("on", k === i));
    };
    dots.forEach((d, k) => d.addEventListener("click", () => { go(k); restart(); }));
    const restart = () => { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); };
    go(0); restart();
  }

  /* ---------------- Header behaviour ---------------- */
  function header() {
    const h = $("#header");
    if (!h) return;
    let last = 0;
    addEventListener("scroll", () => {
      const y = scrollY;
      h.classList.toggle("scrolled", y > 40);
      h.classList.toggle("hidden", y > 500 && y > last && !document.body.classList.contains("nav-open"));
      last = y;
      const bt = $("#backTop");
      if (bt) bt.classList.toggle("show", y > 900);
    }, { passive: true });
    const burger = $(".burger");
    if (burger) burger.addEventListener("click", () => document.body.classList.toggle("nav-open"));
    $$(".nav-links a").forEach((a) => a.addEventListener("click", () => document.body.classList.remove("nav-open")));
  }

  /* ---------------- Forms (Netlify AJAX) ---------------- */
  function forms() {
    $$("form[data-netlify]").forEach((form) => {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const note = $(".form-note", form);
        const btn = $('button[type="submit"]', form);
        btn.disabled = true; btn.style.opacity = 0.6;
        try {
          const body = new FormData(form);
          const res = await fetch("/", { method: "POST", body });
          if (!res.ok) throw 0;
          note.className = "form-note ok";
          note.textContent = T("f_success");
          form.reset();
        } catch {
          note.className = "form-note err";
          note.textContent = T("f_error");
        } finally {
          btn.disabled = false; btn.style.opacity = 1;
        }
      });
    });
  }

  /* ---------------- Lightbox ---------------- */
  function lightbox() {
    const lb = $("#lightbox");
    if (!lb) return;
    const img = $("img", lb);
    const count = $(".lb-count", lb);
    let list = [], idx = 0;
    window.__openLightbox = (srcs, i) => {
      list = srcs; idx = i;
      show();
      lb.classList.add("on");
      document.body.style.overflow = "hidden";
    };
    const show = () => {
      img.src = list[idx];
      count.textContent = `${idx + 1} / ${list.length}`;
    };
    const close = () => { lb.classList.remove("on"); document.body.style.overflow = ""; };
    $(".lb-close", lb).addEventListener("click", close);
    $(".lb-prev", lb).addEventListener("click", () => { idx = (idx - 1 + list.length) % list.length; show(); });
    $(".lb-next", lb).addEventListener("click", () => { idx = (idx + 1) % list.length; show(); });
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    addEventListener("keydown", (e) => {
      if (!lb.classList.contains("on")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") $(".lb-prev", lb).click();
      if (e.key === "ArrowRight") $(".lb-next", lb).click();
    });
  }

  /* ---------------- Project detail page ---------------- */
  function renderProjectPage() {
    if ($("body").dataset.page !== "project") return;
    const id = new URLSearchParams(location.search).get("id") || "p06";
    const p = PROJECTS.find((x) => x.id === id) || PROJECTS[0];
    const L = p[LANG] || p.en;
    window.__projTitle = L.title;
    document.title = L.title + " — Alsalaymeh Group";
    const md = $('meta[name="description"]');
    if (md) md.content = L.summary;

    $("#ppHeroImg").src = `${IMG}${p.id}/${p.hero}.webp`;
    $("#ppHeroImg").alt = L.alt;
    $("#ppKicker").textContent = `${L.category} · ${p.year}`;
    $("#ppTitle").textContent = L.title;
    $("#ppLoc").textContent = L.location;

    $("#ppOverview").textContent = L.overview;
    $("#ppChallenges").innerHTML = L.challenges.map((c) => `<li>${c}</li>`).join("");
    $("#ppSolutions").innerHTML = L.solutions.map((c) => `<li>${c}</li>`).join("");
    $("#ppProcess").innerHTML = L.process.map((c) => `<li>${c}</li>`).join("");
    $("#ppHighlights").innerHTML = L.highlights.map((c) => `<li>${c}</li>`).join("");
    $("#ppDeliverables").textContent = L.deliverables;
    $("#ppSummary").textContent = L.summary;
    $("#ppFactLoc").textContent = L.location;
    $("#ppFactYear").textContent = p.year;
    $("#ppFactCat").textContent = L.category;
    $("#ppFactImgs").textContent = p.images;
    $("#ppScope").innerHTML = L.scope.map((s) => `<li>${s}</li>`).join("");
    $("#ppMaterials").innerHTML = L.materials.map((m) => `<span class="pp-tag">${m}</span>`).join("");

    // gallery — all images
    const srcs = [];
    for (let i = 1; i <= p.images; i++) {
      srcs.push(`${IMG}${p.id}/${p.id}-${String(i).padStart(2, "0")}.webp`);
    }
    $("#ppGallery").innerHTML = srcs
      .map((s, i) => `<a href="${s}" data-i="${i}"><img src="${s.replace(".webp", "-sm.webp")}" alt="${L.alt} — ${i + 1}" loading="lazy" /></a>`)
      .join("");
    $("#ppGallery").addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      e.preventDefault();
      window.__openLightbox(srcs, +a.dataset.i);
    });

    // related — same category first, then others
    const rel = PROJECTS.filter((x) => x.id !== p.id)
      .sort((a, b) => (b.cat === p.cat) - (a.cat === p.cat))
      .slice(0, 3);
    $("#ppRelated").innerHTML = rel.map((r) => projectCard(r, false)).join("");
  }

  /* ---------------- Re-render dynamic content on language change ---------------- */
  document.addEventListener("langchange", () => {
    renderProjects();
    renderProjectPage();
    if (map) map.closePopup();
    if (window.ScrollTrigger) setTimeout(() => ScrollTrigger.refresh(), 60);
  });


  /* ---------------- Scroll progress bar ---------------- */
  function progressBar() {
    const bar = document.createElement("div");
    bar.id = "scrollProgress";
    document.body.appendChild(bar);
    const update = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(1, scrollY / h) : 0})`;
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }

  /* ---------------- Scrollspy: highlight the section in view ---------------- */
  function scrollSpy() {
    const links = $$('.nav-links a[href*="#"]');
    const map = new Map();
    links.forEach((a) => {
      const id = a.getAttribute("href").split("#")[1];
      const sec = id && document.getElementById(id);
      if (sec) map.set(sec, a);
    });
    if (!map.size) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          map.get(e.target).classList.add("active");
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    map.forEach((_, sec) => io.observe(sec));
  }

  /* ---------------- 3D tilt on cards (desktop, motion-safe) ---------------- */
  function tiltCards() {
    if (matchMedia("(pointer: coarse)").matches) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    document.addEventListener("pointermove", (e) => {
      const card = e.target.closest && e.target.closest(".proj-card, .svc");
      if (!card) return;
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
      card.style.transform = `perspective(900px) translateY(-8px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const card = e.target.closest && e.target.closest(".proj-card, .svc");
      if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
    });
  }

  /* ---------------- Preloader ---------------- */
  function preloader() {
    const pre = $("#preloader");
    if (!pre) return;
    const bar = $(".preloader-bar i", pre);
    let pct = 0;
    const tick = setInterval(() => {
      pct = Math.min(pct + 8 + Math.random() * 14, 92);
      bar.style.width = pct + "%";
    }, 120);
    const done = () => {
      clearInterval(tick);
      bar.style.width = "100%";
      setTimeout(() => pre.classList.add("done"), 250);
    };
    if (document.readyState === "complete") done();
    else addEventListener("load", done);
    setTimeout(done, 4000); // safety
  }

  /* ---------------- Boot ---------------- */
  document.addEventListener("DOMContentLoaded", () => {
    applyLang();
    preloader();
    header();
    progressBar();
    scrollSpy();
    tiltCards();
    renderProjects();
    filters();
    counters();
    heroSlideshow();
    testimonials();
    forms();
    lightbox();
    renderProjectPage();

    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      addEventListener("load", () => ScrollTrigger.refresh());
    }
    heroTitleScene();
    heroTowerScene();
    processTowerScene();
    revealScenes();
    initMap();

    $("#themeToggle") && $("#themeToggle").addEventListener("click", toggleTheme);
    $("#langToggle") && $("#langToggle").addEventListener("click", toggleLang);
    $("#backTop") && $("#backTop").addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
  });
})();
