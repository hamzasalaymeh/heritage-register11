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

  /* ---------------- Isometric block tower ---------------- */
  // Projection helpers
  const ISO = { w: 46, h: 26, z: 30 };
  function isoPt(x, y, z) {
    return {
      X: (x - y) * (ISO.w / 2),
      Y: (x + y) * (ISO.h / 2) - z * ISO.z,
    };
  }
  const FACES = {
    top: (p) => `M ${p.X} ${p.Y - ISO.z} l ${ISO.w / 2} ${ISO.h / 2} l ${-ISO.w / 2} ${ISO.h / 2} l ${-ISO.w / 2} ${-ISO.h / 2} Z`,
    left: (p) => `M ${p.X - ISO.w / 2} ${p.Y - ISO.z + ISO.h / 2} l ${ISO.w / 2} ${ISO.h / 2} l 0 ${ISO.z} l ${-ISO.w / 2} ${-ISO.h / 2} Z`,
    right: (p) => `M ${p.X + ISO.w / 2} ${p.Y - ISO.z + ISO.h / 2} l ${-ISO.w / 2} ${ISO.h / 2} l 0 ${ISO.z} l ${ISO.w / 2} ${-ISO.h / 2} Z`,
  };

  // Tower plan: [z, list of [x,y]] — a stepped skyline tower
  function towerPlan() {
    const lv = [];
    const full = (n) => { const a = []; for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) a.push([x + (4 - n) / 2, y + (4 - n) / 2]); return a; };
    lv.push({ z: 0, cells: full(4) });
    lv.push({ z: 1, cells: full(3) });
    lv.push({ z: 2, cells: full(3) });
    lv.push({ z: 3, cells: full(2) });
    lv.push({ z: 4, cells: full(2) });
    lv.push({ z: 5, cells: [[1.5, 1.5]] });
    lv.push({ z: 6, cells: [[1.5, 1.5]] });
    return lv;
  }

  const PALETTES = {
    navy: [
      { t: "#2e3f63", l: "#16213a", r: "#1e2c4a" },
      { t: "#3a4d77", l: "#1a2745", r: "#243356" },
    ],
    gold: { t: "#e3c567", l: "#8f6f1e", r: "#c9a227" },
  };

  function buildTower(svgId, opts) {
    const svg = document.getElementById(svgId);
    if (!svg) return [];
    const NS = "http://www.w3.org/2000/svg";
    const plan = towerPlan();
    const cubes = [];
    plan.forEach((level, li) => {
      // paint back-to-front for correct overlap
      const cells = level.cells.slice().sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
      cells.forEach(([x, y], ci) => {
        const p = isoPt(x, y, level.z);
        const g = document.createElementNS(NS, "g");
        const isGold = (li + ci) % 7 === 3 || (level.z >= 5);
        const pal = isGold ? PALETTES.gold : PALETTES.navy[(x + y + li) % 2];
        [["top", pal.t], ["left", pal.l], ["right", pal.r]].forEach(([f, fill]) => {
          const path = document.createElementNS(NS, "path");
          path.setAttribute("d", FACES[f](p));
          path.setAttribute("fill", fill);
          g.appendChild(path);
        });
        svg.appendChild(g);
        cubes.push({ el: g, z: level.z, order: level.z * 100 + x + y });
      });
    });
    svg.setAttribute("viewBox", "-140 -240 280 340");
    return cubes;
  }

  /* ---------------- GSAP scenes ---------------- */
  function heroTowerScene() {
    const cubes = buildTower("isoTower");
    if (!cubes.length || !window.gsap) return;
    const els = cubes.map((c) => c.el);

    // scatter → assemble on load
    cubes.forEach((c) => {
      const a = Math.random() * Math.PI * 2;
      const d = 260 + Math.random() * 320;
      gsap.set(c.el, {
        x: Math.cos(a) * d,
        y: Math.sin(a) * d - 160,
        rotation: gsap.utils.random(-160, 160),
        scale: 0.2,
        opacity: 0,
        transformOrigin: "center",
      });
    });
    gsap.to(els, {
      x: 0, y: 0, rotation: 0, scale: 1, opacity: 1,
      duration: 1.5,
      ease: "expo.out",
      stagger: { each: 0.028, from: "start" },
      delay: 0.35,
      onComplete: () => {
        gsap.to("#isoTower", { y: -10, duration: 3.2, yoyo: true, repeat: -1, ease: "sine.inOut" });
      },
    });

    // disassemble on scroll away from hero
    cubes.forEach((c) => {
      const a = Math.random() * Math.PI * 2;
      const d = 150 + Math.random() * 260 + c.z * 30;
      gsap.to(c.el, {
        x: Math.cos(a) * d,
        y: -Math.abs(Math.sin(a)) * d - c.z * 40,
        rotation: gsap.utils.random(-120, 120),
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: "#hero",
          start: "35% top",
          end: "bottom top",
          scrub: 0.6,
        },
      });
    });
  }

  function processTowerScene() {
    const cubes = buildTower("isoProcess");
    if (!cubes.length || !window.gsap) return;
    // start scattered; assemble with scrub while section scrolls
    cubes.sort((a, b) => a.order - b.order);
    cubes.forEach((c, i) => {
      const side = i % 2 ? 1 : -1;
      gsap.set(c.el, {
        x: side * (240 + Math.random() * 200),
        y: -300 - Math.random() * 200,
        rotation: gsap.utils.random(-140, 140),
        opacity: 0,
        transformOrigin: "center",
      });
    });
    gsap.to(cubes.map((c) => c.el), {
      x: 0, y: 0, rotation: 0, opacity: 1,
      ease: "power2.out",
      stagger: { each: 0.02 },
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
