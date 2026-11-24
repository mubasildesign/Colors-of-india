// App shell: theme, corners, accent, dropdowns, command search and mobile drawer.
import { $, $$, t, esc, store, library, matchColors, colorUrl, copyText, burst } from "./core.js";

const root = document.documentElement;
const dark = matchMedia("(prefers-color-scheme: dark)");

const prefs = () => store.get("itc.prefs", {});
const savePrefs = (patch) => store.set("itc.prefs", { ...prefs(), ...patch });

function applyTheme() {
  const mode = prefs().theme || "system";
  root.dataset.theme = mode === "dark" || (mode === "system" && dark.matches) ? "dark" : "light";
  for (const b of $$("[data-theme-set]")) b.setAttribute("aria-pressed", String(b.dataset.themeSet === mode));
  document.dispatchEvent(new CustomEvent("itc:theme"));
}

function applyAccent() {
  const a = prefs().accent;
  const first = $("[data-accent]");
  const hex = a?.hex || first?.dataset.accent;
  const label = a?.label || first?.dataset.accentLabel;
  if (a?.hex) {
    root.style.setProperty("--accent", a.hex);
    const pick = $$("[data-accent]").find((b) => b.dataset.accent === a.hex);
    if (pick) root.style.setProperty("--accent-content", pick.dataset.accentOn);
  }
  const name = $("[data-accent-name]");
  if (name && label) name.textContent = label;
  for (const b of $$("[data-accent]")) b.setAttribute("aria-current", String(b.dataset.accent === hex));
}

function initPrefs() {
  applyTheme();
  applyAccent();
  dark.addEventListener("change", applyTheme);
  document.addEventListener("click", (e) => {
    const th = e.target.closest("[data-theme-set]");
    if (th) {
      savePrefs({ theme: th.dataset.themeSet });
      applyTheme();
    }
    const a = e.target.closest("[data-accent]");
    if (a) {
      savePrefs({ accent: { hex: a.dataset.accent, label: a.dataset.accentLabel, on: a.dataset.accentOn } });
      applyAccent();
      a.closest("details")?.removeAttribute("open");
    }
  });
}

function initDropdowns() {
  document.addEventListener("click", (e) => {
    for (const d of $$("details.dropdown[open]")) if (!d.contains(e.target)) d.removeAttribute("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") for (const d of $$("details.dropdown[open]")) d.removeAttribute("open");
  });
}

// One menu button: below 900px it opens the drawer, above it collapses the sidebar to icons.
function initDrawer() {
  const btn = $("[data-drawer]");
  if (!btn) return;
  const narrow = matchMedia("(max-width: 900px)");
  const sync = () => {
    const open = narrow.matches ? document.body.classList.contains("drawer-open") : root.dataset.sidebar !== "collapsed";
    btn.setAttribute("aria-expanded", String(open));
  };
  const setDrawer = (open) => {
    document.body.classList.toggle("drawer-open", open);
    sync();
  };
  btn.addEventListener("click", () => {
    if (narrow.matches) return setDrawer(!document.body.classList.contains("drawer-open"));
    const collapsed = root.dataset.sidebar === "collapsed";
    if (collapsed) delete root.dataset.sidebar;
    else root.dataset.sidebar = "collapsed";
    savePrefs({ sidebar: collapsed ? "expanded" : "collapsed" });
    sync();
  });
  $("[data-drawer-close]")?.addEventListener("click", () => setDrawer(false));
  $$(".sidebar .nav-link").forEach((a) => a.addEventListener("click", () => setDrawer(false)));
  document.addEventListener("keydown", (e) => e.key === "Escape" && setDrawer(false));
  narrow.addEventListener("change", () => {
    setDrawer(false);
  });
  sync();
}

function initCommand() {
  const box = $("[data-cmdk]");
  if (!box) return;
  const input = $("[data-cmdk-input]", box);
  const list = $("#cmdk-list", box);
  const pages = $$(".sidebar .nav-link").map((a) => ({ label: a.textContent.trim(), href: a.getAttribute("href") }));
  let items = [];
  let active = -1;

  const close = () => {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    active = -1;
  };
  const highlight = (i) => {
    active = i;
    $$(".option", list).forEach((o, j) => o.setAttribute("aria-selected", String(j === i)));
    $$(".option", list)[i]?.scrollIntoView({ block: "nearest" });
  };

  async function render() {
    const q = input.value.trim().toLowerCase();
    const lib = await library();
    const pageHits = (q ? pages.filter((p) => p.label.toLowerCase().includes(q)) : pages).slice(0, q ? 5 : 14);
    const colorHits = q ? matchColors(lib, q, 8) : [];
    items = [...pageHits.map((p) => ({ href: p.href })), ...colorHits.map((c) => ({ href: colorUrl(c.id) }))];
    let html = "";
    if (pageHits.length) {
      html += `<div class="lb-label">${esc(t("ui.pages"))}</div>`;
      html += pageHits.map((p, i) => `<a class="option" role="option" id="cmdk-${i}" href="${p.href}">${esc(p.label)}</a>`).join("");
    }
    if (colorHits.length) {
      html += `<div class="lb-label">${esc(t("ui.colors"))}</div>`;
      html += colorHits
        .map((c, i) => `<a class="option" role="option" id="cmdk-${pageHits.length + i}" href="${colorUrl(c.id)}"><span class="sw" style="background:${c.hex}"></span>${esc(c.en)}<span class="end">${c.hex}</span></a>`)
        .join("");
    }
    if (!items.length) html = `<div class="lb-empty">${esc(t("ui.noResults"))}</div>`;
    list.innerHTML = html;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    highlight(items.length ? 0 : -1);
  }

  input.addEventListener("focus", render);
  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight(Math.min(items.length - 1, active + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(Math.max(0, active - 1));
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      location.href = items[active].href;
    } else if (e.key === "Escape") {
      close();
      input.blur();
    }
  });
  document.addEventListener("click", (e) => !box.contains(e.target) && close());
  document.addEventListener("keydown", (e) => {
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
      e.preventDefault();
      input.focus();
      input.select();
    }
  });
}

// Value index: every color in one searchable list. Click a row to copy "name HEX".
function initValueIndex() {
  const dlg = $("[data-vi]");
  if (!dlg) return;
  const list = $("[data-vi-list]", dlg);
  const search = $("[data-vi-search]", dlg);
  const count = $("[data-vi-count]", dlg);
  let lib = null;
  let shown = [];

  const draw = () => {
    const q = search.value.trim().toLowerCase().replace(/^#/, "");
    shown = lib.filter((c) => !q || `${c.en} ${c.tr} ${c.hex} ${c.id}`.toLowerCase().includes(q));
    list.innerHTML = shown
      .map((c) => `<li><button type="button" class="vi-row" data-vi-row="${c.id}"><span class="sw" style="background:${c.hex}"></span><span class="vi-name">${esc(c.en)}</span><span class="vi-meta">${c.id} · ${c.hex}</span></button></li>`)
      .join("");
    count.textContent = count.dataset.template.replace("{shown}", shown.length).replace("{total}", lib.length);
    list.scrollTop = 0;
  };

  async function open() {
    lib = lib || (await library());
    if (!dlg.open) dlg.showModal();
    search.value = "";
    draw();
    search.focus();
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-value-index]")) open();
  });
  $("[data-vi-close]", dlg).addEventListener("click", () => dlg.close());
  dlg.addEventListener("click", (e) => e.target === dlg && dlg.close());
  search.addEventListener("input", draw);
  $("[data-vi-copyall]", dlg).addEventListener("click", (e) => {
    burst(e.clientX, e.clientY);
    copyText(shown.map((c) => `${c.id} ${c.en} ${c.hex}`).join("\n"), t("vi.copiedAll", { count: shown.length }));
  });
  list.addEventListener("click", (e) => {
    const row = e.target.closest("[data-vi-row]");
    if (!row) return;
    const c = shown.find((x) => x.id === row.dataset.viRow);
    burst(e.clientX, e.clientY);
    row.classList.add("copied");
    setTimeout(() => row.classList.remove("copied"), 700);
    copyText(`${c.en} ${c.hex}`);
  });
}

// Small motion: numbers count up and sections rise as they scroll into view.
function initMotion() {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      io.unobserve(en.target);
      en.target.classList.add("in");
      const n = en.target.matches("[data-countup]") ? en.target : null;
      if (n) {
        const to = Number(n.dataset.countup);
        const t0 = performance.now();
        const step = (now) => {
          const k = Math.min(1, (now - t0) / 900);
          n.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }
  }, { threshold: 0.2 });
  for (const n of $$("[data-countup], .home-sec")) {
    n.classList.add("will-in");
    io.observe(n);
  }
}

// Collapsed sidebar: show the page name next to the icon on hover or keyboard focus.
function initTips() {
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "tooltip");
  document.body.appendChild(tip);
  const active = () => root.dataset.sidebar === "collapsed" && !matchMedia("(max-width: 900px)").matches;
  const show = (a) => {
    if (!active()) return;
    const r = a.getBoundingClientRect();
    tip.textContent = a.dataset.tip;
    tip.style.left = `${r.right + 10}px`;
    tip.style.top = `${r.top + r.height / 2}px`;
    tip.classList.add("show");
  };
  const hide = () => tip.classList.remove("show");
  for (const a of $$(".sidebar .nav-link")) {
    a.removeAttribute("title"); // the native tooltip is only the no-JS fallback
    a.addEventListener("mouseenter", () => show(a));
    a.addEventListener("focus", () => show(a));
    a.addEventListener("mouseleave", hide);
    a.addEventListener("blur", hide);
    a.addEventListener("click", hide);
  }
  $(".sidebar")?.addEventListener("scroll", hide);
}

// Hanging ornament in the top-right corner: a small sway on its own, a wider swing on hover or click.
function initOrnament() {
  const box = $("[data-orn]");
  if (!box) return;
  const img = $(".orn-i", box);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;
  const OMEGA = (2 * Math.PI) / 3.2; // one swing every 3.2 seconds
  const DAMP = 0.55; // extra energy fades over a few seconds
  const IDLE = 0.035; // resting sway, about 2 degrees
  let angle = 0; // radians
  let speed = 0;
  let last = performance.now();
  let dir = 1;

  const frame = (now) => {
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    const rest = IDLE * Math.sin((now / 1000) * ((2 * Math.PI) / 4.6));
    speed += (-OMEGA * OMEGA * (angle - rest) - DAMP * speed) * dt;
    angle += speed * dt;
    img.style.transform = `rotate(${(angle * 180) / Math.PI}deg)`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  const push = (impulse) => {
    dir = -dir;
    speed += dir * impulse;
  };
  box.addEventListener("pointerenter", () => Math.abs(speed) < 0.2 && push(0.22));
  box.addEventListener("click", () => push(0.42));
}

// Welcome card: once per browser. Greetings change every 2 seconds, the card closes after 30 seconds,
// and hovering or focusing inside the card pauses both timers and the countdown bar.
const WELCOME_KEY = "itc.welcome";
const WELCOME_MS = 30000;
const GREET_MS = 2000;
const FONT_WAIT_MS = 3000;
const fontLinks = new Map();

// Loads the stylesheet for a family once, then resolves when it has finished (or failed).
function linkGreetFont(family) {
  if (!fontLinks.has(family)) {
    fontLinks.set(
      family,
      new Promise((resolve) => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:wght@600&display=swap`;
        link.onload = resolve;
        link.onerror = resolve;
        document.head.appendChild(link);
      })
    );
  }
  return fontLinks.get(family);
}

// Resolves once the glyphs for one greeting are ready to paint, so it never flashes in a fallback font.
const preloadGreeting = (g) =>
  g.font ? linkGreetFont(g.font).then(() => document.fonts.load(`600 26px "${g.font}"`, g.text)).catch(() => {}) : Promise.resolve();

function initWelcome() {
  const dlg = $("[data-welcome]");
  if (!dlg) return;
  try {
    if (localStorage.getItem(WELCOME_KEY)) return;
  } catch (e) {
    return;
  }
  const greetings = JSON.parse($("[data-greetings]", dlg).textContent);
  const greet = $("[data-greet]", dlg);
  const text = $(".wg-text", greet);
  const meta = $(".wg-meta", greet);
  const bar = $("[data-welcome-bar]", dlg);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ready = greetings.map((g) => !g.font);
  let idx = 0;
  let left = WELCOME_MS;
  let started = 0;
  let running = false;
  let closeTimer = 0;
  let greetTimer = 0;

  const showGreeting = (n) => {
    const g = greetings[n];
    greet.lang = g.lang;
    text.textContent = g.text;
    text.style.fontFamily = g.font ? `"${g.font}", system-ui, sans-serif` : "";
    meta.textContent = g.roman ? `${g.label} · ${g.roman}` : g.label;
    if (!reduce) {
      text.classList.remove("wg-swap");
      void text.offsetWidth;
      text.classList.add("wg-swap");
    }
  };
  const stopTimers = () => {
    running = false;
    clearTimeout(closeTimer);
    clearInterval(greetTimer);
  };
  // Paused while the pointer is over the card or keyboard focus is inside it.
  const held = () => dlg.matches(":hover") || dlg.contains(document.activeElement);
  const play = () => {
    if (!dlg.open || running || held()) return;
    running = true;
    started = performance.now();
    closeTimer = setTimeout(close, left);
    greetTimer = setInterval(() => {
      // Move to the next greeting whose font has loaded; stay put if none is ready yet.
      for (let step = 1; step <= greetings.length; step++) {
        const next = (idx + step) % greetings.length;
        if (!ready[next]) continue;
        idx = next;
        showGreeting(idx);
        break;
      }
    }, GREET_MS);
    bar.classList.remove("is-paused");
  };
  const hold = () => {
    if (!running) return;
    left -= performance.now() - started;
    stopTimers();
    bar.classList.add("is-paused");
  };
  function close() {
    if (dlg.open) dlg.close();
  }

  // Focus and hover events fire before the DOM updates, so re-check on the next tick.
  const recheck = () => setTimeout(play, 0);
  dlg.addEventListener("pointerenter", hold);
  dlg.addEventListener("pointerleave", recheck);
  dlg.addEventListener("focusin", hold);
  dlg.addEventListener("focusout", recheck);
  dlg.addEventListener("close", () => stopTimers());
  $("[data-welcome-close]", dlg).addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dlg.open) close();
  });

  // Start loading every greeting font now; open the card after 1s, or once the fonts are ready (3s at most).
  const loads = greetings.map((g, n) => preloadGreeting(g).then(() => { ready[n] = true; }));
  const fontsReady = Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, FONT_WAIT_MS))]);
  Promise.all([new Promise((r) => setTimeout(r, 1000)), fontsReady]).then(() => {
    showGreeting(0);
    dlg.show();
    // A non-modal dialog focuses its first button when shown; the card should not hold focus by default.
    if (dlg.contains(document.activeElement)) document.activeElement.blur();
    try {
      localStorage.setItem(WELCOME_KEY, "1");
    } catch (e) {
      /* private mode: the card may show again, which is acceptable */
    }
    play();
  });
}

export function initShell() {
  initPrefs();
  initDropdowns();
  initDrawer();
  initCommand();
  initValueIndex();
  initTips();
  initOrnament();
  initMotion();
  initWelcome();
}
