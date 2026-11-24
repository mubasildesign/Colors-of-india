// Static build: data -> dist/. No framework, no network at build time.
// Per-locale pages (en, ta, hi, te), color detail pages, SVG cards, a downloadable
// SKILL.md, sitemap, robots.txt, llms.txt and llms-full.txt.
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichLibrary, FAMILIES, contrast, bestTextOn, oklchCss } from "../src/lib/color.js";
import { icon, iconPair, brandMark } from "../src/lib/icons.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA = path.join(ROOT, "data");
const SRC = path.join(ROOT, "src");
const DIST = path.join(ROOT, "dist");
const SITE_URL = (process.env.SITE_URL || "http://localhost:8080").replace(/\/$/, "");

// Cache-busting token for CSS and JS: changes whenever any source asset changes.
const ASSET_V = (() => {
  const h = crypto.createHash("md5");
  const walkDir = (d) => fs.readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).forEach((e) => {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walkDir(f);
    else if (!/\.(webp|png)$/.test(e.name)) h.update(fs.readFileSync(f));
  });
  walkDir(path.join(ROOT, "src"));
  return h.digest("hex").slice(0, 8);
})();

const LOCALES = ["en", "ta", "hi", "te"];
const DEFAULT_LOCALE = "en";
const LOCALE_LABEL = { en: "English", ta: "தமிழ்", hi: "हिन्दी", te: "తెలుగు" };
const LOCALE_SHORT = { en: "EN", ta: "TA", hi: "HI", te: "TE" };
const CATEGORY_ORDER = ["basic", "spice", "food", "flora", "fauna", "nature", "sky", "sacred", "ritual", "pigment", "dye", "textile", "metal", "gem", "cosmetic", "material", "ceramic"];
const RELATION_KEYS = ["same", "analogous", "complementary", "triadic", "lighter", "darker", "neutral"];
const SCRIPT_FONT = { ta: "Noto+Sans+Tamil", hi: "Noto+Sans+Devanagari", te: "Noto+Sans+Telugu" };
const fontUrl = (loc) =>
  `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500${SCRIPT_FONT[loc] ? `&family=${SCRIPT_FONT[loc]}:wght@400;500;600` : ""}&display=swap`;

// Sidebar structure. Keys map to nav.* and lede.* strings.
const PAGES = [
  { key: "home", slug: "", group: "find", icon: "lotus" },
  { key: "colors", slug: "colors/", group: "find", icon: "swatches" },
  { key: "states", slug: "states/", group: "find", icon: "states" },
  { key: "explorer", slug: "explorer/", group: "find", icon: "compass" },
  { key: "dictionary", slug: "dictionary/", group: "find", icon: "dictionary" },
  { key: "generator", slug: "generator/", group: "palettes", icon: "diya" },
  { key: "ideas", slug: "palettes/", group: "palettes", icon: "rangoli" },
  { key: "usage", slug: "usage/", group: "palettes", icon: "textile" },
  { key: "gradients", slug: "gradients/", group: "palettes", icon: "dawn" },
  { key: "scene", slug: "scene/", group: "apply", icon: "scene" },
  { key: "theme", slug: "theme/", group: "apply", icon: "brush" },
  { key: "terminal", slug: "terminal/", group: "apply", icon: "terminal" },
  { key: "today", slug: "today/", group: "share", icon: "sun" },
  { key: "saved", slug: "saved/", group: "share", icon: "bookmark" },
  { key: "skills", slug: "skills/", group: "share", icon: "robot" },
];
const GROUPS = ["find", "palettes", "apply", "share"];
const CLIENT_PAGES = new Set(["explorer", "generator", "ideas", "usage", "gradients", "scene", "theme", "terminal", "today", "saved"]);
const ACCENT_NAMES = ["Peacock Blue", "Neel Blue", "Mor Teal", "Paan Leaf", "Turmeric", "Kesar Saffron", "Terracotta", "Sindoor", "Rani Pink", "Jamun"];

// ---------- load and validate ----------
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const source = readJson(path.join(DATA, "colors.json"));
const strings = Object.fromEntries(LOCALES.map((l) => [l, readJson(path.join(DATA, "strings", `${l}.json`))]));

const enKeys = Object.keys(strings.en).filter((k) => !k.startsWith("_"));
for (const l of LOCALES) {
  for (const k of enKeys) if (!(k in strings[l])) throw new Error(`Missing string "${k}" in locale ${l}`);
}
for (const c of source) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(c.hex)) throw new Error(`Bad hex for ${c.en}: ${c.hex}`);
  if (!FAMILIES.includes(c.family)) throw new Error(`Bad family for ${c.en}: ${c.family}`);
  if (!CATEGORY_ORDER.includes(c.cat)) throw new Error(`Bad category for ${c.en}: ${c.cat}`);
  if (!c.en || !c.tr) throw new Error(`Missing name or transliteration: ${JSON.stringify(c)}`);
}

const site = readJson(path.join(DATA, "site.json"));
const lib = enrichLibrary(source);
const byId = Object.fromEntries(lib.map((c) => [c.id, c]));
const byName = Object.fromEntries(lib.map((c) => [c.en, c]));
const states = readJson(path.join(DATA, "states.json"));
const welcome = readJson(path.join(DATA, "welcome.json"));
if (welcome.greetings.length !== 13) throw new Error(`welcome.json: expected 13 greetings, got ${welcome.greetings.length}`);
for (const g of welcome.greetings) if (!g.lang || !g.text || !g.label) throw new Error(`welcome.json: greeting ${g.lang} is incomplete`);
const REGIONS = ["north", "south", "east", "west", "central", "northeast", "islands"];
for (const st of states) {
  if (!REGIONS.includes(st.region)) throw new Error(`State ${st.id}: bad region ${st.region}`);
  if (st.colors.length !== 5) throw new Error(`State ${st.id}: needs exactly 5 colors`);
  for (const l of LOCALES) if (!st.name[l]) throw new Error(`State ${st.id}: missing ${l} name`);
  for (const n of st.colors) if (!byName[n]) throw new Error(`State ${st.id}: unknown color "${n}"`);
}
const accents = ACCENT_NAMES.map((n) => byName[n]).filter(Boolean);

function traw(loc, key) {
  const s = strings[loc][key] ?? strings.en[key];
  if (s === undefined) throw new Error(`Unknown string key: ${key}`);
  return s;
}
function t(loc, key, vars = {}) {
  // {count}/{total} default to the library size so counts in copy always match the data.
  const values = { count: lib.length, total: lib.length, ...vars };
  return traw(loc, key).replace(/\{(\w+)\}/g, (_, k) => {
    if (values[k] === undefined) throw new Error(`Missing variable {${k}} for ${key} in ${loc}`);
    return String(values[k]);
  });
}
const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const url = (loc, slug) => `/${loc}/${slug}`;
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const fmt = {
  hex: (c) => c.hex,
  rgb: (c) => `rgb(${c.rgb.join(", ")})`,
  hsl: (c) => `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
  cmyk: (c) => `cmyk(${c.cmyk.c}%, ${c.cmyk.m}%, ${c.cmyk.y}%, ${c.cmyk.k}%)`,
};

// ---------- output helpers ----------
function write(rel, contents) {
  const file = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, entry.name), b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

// ---------- shell ----------
const PREFS_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("itc.prefs")||"{}"),m=p.theme||"system",r=document.documentElement;r.dataset.theme=(m==="dark"||(m==="system"&&matchMedia("(prefers-color-scheme: dark)").matches))?"dark":"light";if(p.sidebar==="expanded")delete r.dataset.sidebar;if(p.accent&&/^#[0-9a-f]{6}$/i.test(p.accent.hex)){r.style.setProperty("--accent",p.accent.hex);if(/^#[0-9a-f]{6}$/i.test(p.accent.on||""))r.style.setProperty("--accent-content",p.accent.on)}}catch(e){}})();`;

function head(loc, slug, title, description) {
  const alternates = LOCALES.map((l) => `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${url(l, slug)}">`).join("\n    ");
  return `<meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${SITE_URL}${url(loc, slug)}">
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}${url(DEFAULT_LOCALE, slug)}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${SITE_URL}${url(loc, slug)}">
    <meta name="theme-color" content="#FBFBFA">
    <script>${PREFS_SCRIPT}</script>
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="stylesheet" href="${fontUrl(loc)}">
    <link rel="stylesheet" href="/assets/site.css?v=${ASSET_V}">`;
}

function topbar(loc, slug) {
  const themeBtn = (mode, ic) =>
    `<button type="button" class="icon-only" data-theme-set="${mode}" aria-pressed="false" aria-label="${esc(t(loc, `ui.theme.${mode}`))}" title="${esc(t(loc, `ui.theme.${mode}`))}">${icon(ic)}</button>`;
  const langLinks = LOCALES.map(
    (l) => `<a href="${url(l, slug)}" hreflang="${l}" lang="${l}"${l === loc ? ' aria-current="true"' : ""}>${esc(LOCALE_LABEL[l])}</a>`
  ).join("");
  const accentBtns = accents
    .map((c) => `<button type="button" data-accent="${c.hex}" data-accent-on="${bestTextOn(c.hex)}" data-accent-label="${esc(c.en)}"><span class="dot" style="background:${c.hex}"></span>${esc(c.en)}</button>`)
    .join("");
  return `<header class="topbar">
      <button type="button" class="btn btn-ghost btn-icon menu-btn" data-drawer aria-controls="sidebar" aria-expanded="false" aria-label="${esc(t(loc, "ui.menu"))}">${icon("sidebar", "i-desktop")}${icon("menu", "i-mobile")}</button>
      <a class="brand" href="${url(loc, "")}">${brandMark(24)}<span class="brand-text">${esc(t(loc, "site.name"))}</span></a>
      <div class="cmdk" data-cmdk>
        <label class="field">
          <span class="sr-only">${esc(t(loc, "ui.search"))}</span>
          ${icon("search")}
          <input class="input" type="search" placeholder="${esc(t(loc, "ui.search"))}" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="cmdk-list" aria-autocomplete="list" data-cmdk-input>
          <kbd class="kbd">⌘K</kbd>
        </label>
        <div class="listbox" id="cmdk-list" role="listbox" hidden></div>
      </div>
      <div class="topbar-right">
        <div class="join hide-sm" role="group" aria-label="${esc(t(loc, "ui.theme"))}">${themeBtn("light", "sun")}${themeBtn("dark", "moon")}${themeBtn("system", "system")}</div>
        <details class="dropdown hide-md" data-accent-menu>
          <summary class="btn btn-ghost" aria-label="${esc(t(loc, "ui.accent"))}"><span class="dot" data-accent-dot style="background:var(--accent)"></span><span data-accent-name>${esc(accents[0].en)}</span></summary>
          <div class="dropdown-panel accent-panel">${accentBtns}</div>
        </details>
        <details class="dropdown">
          <summary class="btn btn-ghost" aria-label="${esc(t(loc, "ui.language"))}">${icon("globe")}<span>${LOCALE_SHORT[loc]}</span></summary>
          <div class="dropdown-panel">${langLinks}</div>
        </details>
        <a class="btn btn-ghost btn-icon gh-link" href="${site.repo}" target="_blank" rel="noopener" aria-label="${esc(t(loc, "ui.github"))}" title="${esc(t(loc, "ui.github"))}">${icon("github", "", "fill")}</a>
      </div>
      <div class="orn" data-orn aria-hidden="true"><span class="orn-i"></span></div>
    </header>`;
}

function sidebar(loc, activeKey) {
  const groups = GROUPS.map((g) => {
    const links = PAGES.filter((p) => p.group === g)
      .map((p) => {
        const label = t(loc, `nav.${p.key}`);
        return `<a class="nav-link" href="${url(loc, p.slug)}" data-tip="${esc(label)}" title="${esc(label)}"${p.key === activeKey ? ' aria-current="page"' : ""}>${iconPair(p.icon)}<span class="nav-text">${esc(label)}</span></a>`;
      })
      .join("");
    return `<div class="nav-group"><div class="nav-label"><span>${esc(t(loc, `group.${g}`))}</span></div>${links}</div>`;
  }).join("");
  return `<aside class="sidebar" id="sidebar"><nav aria-label="${esc(t(loc, "ui.menu"))}">${groups}</nav></aside><div class="scrim" data-drawer-close></div>`;
}

function footer(loc, slug) {
  const langs = LOCALES.map(
    (l) => `<a href="${url(l, slug)}" hreflang="${l}" lang="${l}"${l === loc ? ' aria-current="true"' : ""}>${esc(LOCALE_LABEL[l])}</a>`
  ).join("");
  const ext = (href, label) => `<a href="${href}" target="_blank" rel="noopener">${esc(label)}</a>`;
  return `<footer class="site-foot">
            <div class="kolam" aria-hidden="true"></div>
            <div class="foot-grid">
              <div class="foot-main">
                <a class="foot-brand" href="${url(loc, "")}">${brandMark(20)}<span>${esc(t(loc, "site.name"))}</span></a>
                <p class="foot-tag">${esc(t(loc, "foot.tagline"))}</p>
                <ul class="foot-links">
                  <li><a href="/data/colors.csv" download="colors-of-india.csv">${icon("fileDown")}${esc(t(loc, "foot.charts"))}</a></li>
                  <li><a href="${site.repo}" target="_blank" rel="noopener">${icon("github", "", "fill")}${esc(t(loc, "author.repo"))}</a></li>
                  <li><a href="${site.contact}" target="_blank" rel="noopener">${icon("contact")}${esc(t(loc, "foot.contact"))}</a></li>
                  <li><a href="/llms.txt">${icon("file")}LLMs.txt</a></li>
                  <li><a href="${site.licenseUrl}" target="_blank" rel="noopener">${icon("scales")}MIT</a></li>
                  <li class="copy">© ${site.year} <a href="${site.portfolio}" target="_blank" rel="noopener">${esc(site.portfolioLabel)}</a></li>
                </ul>
              </div>
              <nav class="foot-langs" aria-label="${esc(t(loc, "ui.language"))}">${icon("globe")}${langs}</nav>
            </div>
            <p class="foot-credit">${esc(t(loc, "foot.made", { name: "\u0001" })).replace("\u0001", ext(site.portfolio, site.owner))} - ${esc(t(loc, "foot.inspired", { site: "\u0001" })).replace("\u0001", ext(site.inspiredBy.url, site.inspiredBy.label))}</p>
          </footer>`;
}

function valueIndexDialog(loc) {
  return `<dialog class="vi" data-vi aria-labelledby="vi-title">
      <div class="vi-box">
        <div class="vi-head"><h2 id="vi-title">${esc(t(loc, "vi.title"))}</h2><button type="button" class="btn btn-ghost btn-icon" data-vi-close aria-label="${esc(t(loc, "ui.close"))}">${icon("x")}</button></div>
        <p class="vi-lede">${esc(t(loc, "vi.lede"))}</p>
        <div class="vi-tools">
          <label class="field grow"><span class="sr-only">${esc(t(loc, "vi.search"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t(loc, "vi.search"))}" autocomplete="off" spellcheck="false" data-vi-search></label>
          <button type="button" class="btn btn-primary" data-vi-copyall>${icon("copy")}${esc(t(loc, "vi.copyAll"))}</button>
        </div>
        <p class="vi-count" data-vi-count data-template="${esc(traw(loc, "vi.count"))}" aria-live="polite"></p>
        <ul class="vi-list" data-vi-list></ul>
      </div>
    </dialog>`;
}

// Welcome card: shown once per browser, cycles the greetings every 2 seconds and closes after 30 seconds.
// Card text and greetings stay in English on every locale; the greeting fonts load only when the card opens.
function welcomeDialog() {
  const first = welcome.greetings[0];
  const greetJson = JSON.stringify(welcome.greetings).replace(/</g, "\\u003c");
  return `<dialog class="welcome" data-welcome aria-labelledby="welcome-title">
      <div class="welcome-box">
        <div class="welcome-bar" data-welcome-bar aria-hidden="true"></div>
        <div class="welcome-head">
          <div class="welcome-greet" data-greet aria-live="off" lang="${first.lang}">
            <span class="wg-text">${esc(first.text)}</span>
            <span class="wg-meta">${esc(first.label)}</span>
          </div>
          <button type="button" class="btn btn-ghost btn-icon" data-welcome-close aria-label="${esc(ENGLISH_CLOSE)}">${icon("x")}</button>
        </div>
        <h2 id="welcome-title">${esc(welcome.title)}</h2>
        ${welcome.paragraphs.map((p) => `<p>${esc(p)}</p>`).join("\n        ")}
        <div class="welcome-foot">
          <p class="welcome-sign">${esc(welcome.signOff)} ${icon("heart", "i-heart", "fill")} <a href="${site.portfolio}" target="_blank" rel="noopener">${esc(site.owner)}</a></p>
        </div>
        <script type="application/json" data-greetings>${greetJson}</script>
      </div>
    </dialog>`;
}
const ENGLISH_CLOSE = strings.en["ui.close"];

function page(loc, slug, { key, activeKey = key, title, description, body }) {
  const clientStrings = Object.fromEntries(Object.entries(strings[loc]).filter(([k]) => !k.startsWith("_")));
  return `<!doctype html>
<html lang="${loc}" data-theme="light" data-sidebar="collapsed">
  <head>
    ${head(loc, slug, title, description)}
  </head>
  <body data-page="${key}">
    <a class="skip" href="#main">${esc(t(loc, "ui.skip"))}</a>
    ${topbar(loc, slug)}
    <div class="layout">
      ${sidebar(loc, activeKey)}
      <main id="main" class="main">
        <div class="container">
${body}
          ${footer(loc, slug)}
        </div>
      </main>
    </div>
    ${valueIndexDialog(loc)}
    ${welcomeDialog()}
    <script id="i18n" type="application/json">${JSON.stringify(clientStrings).replace(/</g, "\\u003c")}</script>
    <script type="module" src="/assets/app.js?v=${ASSET_V}"></script>
  </body>
</html>
`;
}

const PAGE_ICON = Object.fromEntries(PAGES.map((p) => [p.key, p.icon]));
const pageHead = (loc, key, extra = "") =>
  `<header class="page-head"><span class="ph-icon">${icon(PAGE_ICON[key], "", "fill")}</span><div class="ph-text"><h1>${esc(t(loc, `nav.${key}`))}</h1><p>${esc(t(loc, `lede.${key}`))}</p>${extra}</div></header>`;

const familyOptions = (loc) =>
  `<option value="">${esc(t(loc, "ui.allFamilies"))}</option>` + FAMILIES.map((f) => `<option value="${f}">${esc(t(loc, `family.${f}`))}</option>`).join("");

// ---------- Find pages ----------
function colorCard(loc, c, i = 0) {
  return `<li class="ccard" data-id="${c.id}" data-family="${c.family}" style="--i:${i}">
  <div class="ccard-swatch" style="background:${c.hex}"></div>
  <div class="ccard-body">
    <div class="ccard-row"><a class="ccard-name" href="${url(loc, `colors/${c.id}/`)}">${esc(c.en)}</a><span class="ccard-no">${c.id}</span></div>
    <div class="ccard-row"><button type="button" class="ccard-val" data-val data-copy="${c.hex}" title="${esc(t(loc, "ui.copy"))}" data-hex="${c.hex}" data-rgb="${fmt.rgb(c)}" data-hsl="${fmt.hsl(c)}" data-cmyk="${fmt.cmyk(c)}">${c.hex}</button><span class="ccard-actions"><button type="button" class="btn btn-ghost btn-sm btn-icon fav" data-fav="${c.id}" aria-pressed="false" aria-label="${esc(t(loc, "ui.save"))}: ${esc(c.en)}">${iconPair("heart")}</button><a class="btn btn-ghost btn-sm btn-icon" href="/cards/${c.id}.svg" download="${slugify(c.en)}-${c.id}.svg" aria-label="${esc(t(loc, "ui.download"))}: ${esc(c.en)}">${icon("download")}</a></span></div>
  </div>
</li>`;
}

function homeBody(loc) {
  const formats = ["hex", "rgb", "hsl", "cmyk"]
    .map((f, i) => `<button type="button" data-format="${f}" aria-pressed="${i === 0}">${f.toUpperCase()}</button>`)
    .join("");
  return `${pageHead(loc, "home")}
<div class="toolbar">
  <label class="field grow"><span class="sr-only">${esc(t(loc, "ui.searchColors"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t(loc, "ui.searchColors"))}" data-filter-search></label>
  <span class="spacer"></span>
  <div class="join" role="group" aria-label="${esc(t(loc, "ui.format"))}">${formats}</div>
  <button type="button" class="btn" data-value-index>${icon("valueIndex")}<span class="hide-sm">${esc(t(loc, "ui.valueIndex"))}</span></button>
  <button type="button" class="btn btn-icon" data-shuffle aria-label="${esc(t(loc, "ui.shuffle"))}" title="${esc(t(loc, "ui.shuffle"))}">${icon("shuffle")}</button>
</div>
<div class="fchips" role="group" aria-label="${esc(t(loc, "col.family"))}" style="margin-bottom:14px" data-filter-family>
  <button type="button" class="fchip" data-family="" aria-pressed="true">${esc(t(loc, "ui.allFamilies"))}</button>
  ${FAMILIES.map((f) => `<button type="button" class="fchip" data-family="${f}" aria-pressed="false"><span class="dot" style="background:${lib.find((c) => c.family === f).hex}"></span>${esc(t(loc, `family.${f}`))}</button>`).join("")}
</div>
<p class="count" data-count data-template="${esc(traw(loc, "ui.showing"))}" aria-live="polite">${esc(t(loc, "ui.showing", { count: lib.length }))}</p>
<ul class="cards" data-gallery>
${lib.slice(0, 30).map((c, i) => colorCard(loc, c, Math.min(i, 14))).join("\n")}
</ul>
<p class="empty" data-empty hidden>${esc(t(loc, "ui.noResults"))}</p>
<div class="more"><button type="button" class="btn" data-more hidden>${esc(t(loc, "ui.showMore"))}</button></div>
${homeSections(loc)}`;
}

function homeSections(loc) {
  const tools = ["generator", "ideas", "gradients", "scene", "theme", "terminal"]
    .map((k, i) => {
      const p = PAGES.find((x) => x.key === k);
      return `<li style="--i:${i}"><a class="tool-card" href="${url(loc, p.slug)}"><span class="ph-icon">${icon(p.icon, "", "fill")}</span><span class="tc-text"><b>${esc(t(loc, `nav.${k}`))}</b><span>${esc(t(loc, `lede.${k}`))}</span></span>${icon("arrowUpRight", "tc-go")}</a></li>`;
    })
    .join("");
  const stats = [
    [lib.length, "stat.colors", "swatches"],
    [FAMILIES.length, "stat.families", "rangoli"],
    [5, "stat.formats", "palette"],
    [LOCALES.length, "stat.languages", "translate"],
  ]
    .map(([n, k, ic], i) => `<li class="stat" style="--i:${i}"><span class="stat-ic">${icon(ic, "", "fill")}</span><b data-countup="${n}">${n}</b><span>${esc(t(loc, k))}</span></li>`)
    .join("");
  const links = [
    ["github", "author.github", site.github],
    ["linkedin", "author.linkedin", site.linkedin],
    ["portfolio", "author.portfolio", site.portfolio],
    ["github", "author.repo", site.repo],
  ]
    .map(([ic, k, href]) => `<a class="btn author-link" href="${href}" target="_blank" rel="noopener">${icon(ic, "", ic === "portfolio" ? "regular" : "fill")}<span>${esc(t(loc, k))}</span>${icon("arrowUpRight", "tc-go")}</a>`)
    .join("");
  return `<section class="home-sec" id="tools"><div class="sec-head"><span class="sec-tag">${icon("diya", "", "fill")}${esc(t(loc, "home.tools"))}</span><p>${esc(t(loc, "home.toolsLede"))}</p></div><ul class="tool-cards">${tools}</ul></section>
<section class="home-sec" id="material"><div class="sec-head"><span class="sec-tag">${icon("lotus", "", "fill")}${esc(t(loc, "home.material"))}</span><p>${esc(t(loc, "home.materialLede"))}</p></div><ul class="stats">${stats}</ul></section>
<section class="home-sec" id="author"><div class="sec-head"><span class="sec-tag">${icon("author", "", "fill")}${esc(t(loc, "home.author"))}</span></div>
<div class="author-card"><span class="author-mark" aria-hidden="true">${brandMark(44)}</span><div class="author-text"><b>${esc(site.owner)}</b><p>${esc(t(loc, "home.authorLede", { name: site.owner }))}</p></div><div class="author-links">${links}</div></div></section>`;
}

function statesBody(loc) {
  const cards = states
    .map((st, i) => {
      const cols = st.colors.map((n) => byName[n]);
      const name = st.name[loc];
      const sw = cols
        .map((c) => `<button type="button" class="scard-sw" style="background:${c.hex};color:${bestTextOn(c.hex)}" data-copy="${c.hex}" title="${esc(c.en)} ${c.hex}" aria-label="${esc(t(loc, "ui.copy"))} ${esc(c.en)} ${c.hex}"><span>${c.hex}</span></button>`)
        .join("");
      const legend = cols
        .map((c) => `<li><a href="${url(loc, `colors/${c.id}/`)}"><span class="sw-dot" style="background:${c.hex}"></span>${esc(c.en)}</a><span class="mono">${c.hex}</span></li>`)
        .join("");
      const copyAll = `${st.name.en}\n${cols.map((c) => `${c.en} ${c.hex}`).join("\n")}`;
      const search = `${Object.values(st.name).join(" ")} ${st.note} ${cols.map((c) => c.en).join(" ")}`.toLowerCase();
      return `<li class="scard" data-region="${st.region}" data-search="${esc(search)}" style="--i:${Math.min(i, 12)}">
  <div class="scard-pal">${sw}</div>
  <div class="scard-body">
    <div class="scard-row"><h2>${esc(name)}</h2><span class="badge">${esc(t(loc, `region.${st.region}`))}</span></div>
    <p class="scard-note">${esc(st.note)}</p>
    <ul class="scard-colors">${legend}</ul>
    <div class="scard-actions">
      <button type="button" class="btn btn-sm" data-copy="${esc(copyAll)}">${icon("copy")}${esc(t(loc, "states.copyHex"))}</button>
      <button type="button" class="btn btn-sm" data-save-palette="${cols.map((c) => c.id).join(",")}" data-label="${esc(st.name.en)}">${icon("bookmark")}${esc(t(loc, "ui.save"))}</button>
      <a class="btn btn-sm btn-ghost" href="${url(loc, "scene/")}?c=${cols[0].id}">${esc(t(loc, "nav.scene"))}${icon("arrowUpRight")}</a>
    </div>
  </div>
</li>`;
    })
    .join("\n");
  const chips = REGIONS.map((r) => `<button type="button" class="fchip" data-region="${r}" aria-pressed="false">${esc(t(loc, `region.${r}`))}</button>`).join("");
  return `${pageHead(loc, "states")}
<div class="toolbar">
  <label class="field grow"><span class="sr-only">${esc(t(loc, "states.search"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t(loc, "states.search"))}" data-states-search></label>
</div>
<div class="fchips" role="group" aria-label="${esc(t(loc, "states.search"))}" style="margin-bottom:14px" data-states-regions>
  <button type="button" class="fchip" data-region="" aria-pressed="true">${esc(t(loc, "ui.all"))}</button>${chips}
</div>
<p class="count" data-states-count data-template="${esc(traw(loc, "states.count"))}" aria-live="polite">${esc(t(loc, "states.count", { count: states.length, total: states.length }))}</p>
<ul class="scards" data-states>
${cards}
</ul>
<p class="empty" data-states-empty hidden>${esc(t(loc, "ui.noResults"))}</p>`;
}

function colorsBody(loc) {
  const groups = FAMILIES.map((f) => {
    const items = lib.filter((c) => c.family === f);
    const chips = items
      .map((c) => `<li><a class="chip" href="${url(loc, `colors/${c.id}/`)}"><span class="sw" style="background:${c.hex}"></span><span class="chip-text"><b>${esc(c.en)}</b><span>${c.hex}</span></span></a></li>`)
      .join("");
    return `<section class="family-group" id="${f}"><div class="family-head"><h2>${esc(t(loc, `family.${f}`))}</h2><span>${items.length}</span></div><ul class="chips">${chips}</ul></section>`;
  }).join("\n");
  const jump = `<div class="row" style="margin-top:14px"><button type="button" class="btn btn-sm" data-value-index>${icon("valueIndex")}${esc(t(loc, "ui.valueIndex"))}</button>${FAMILIES.map((f) => `<a class="fchip" href="#${f}"><span class="dot" style="background:${lib.find((c) => c.family === f).hex}"></span>${esc(t(loc, `family.${f}`))}</a>`).join("")}</div>`;
  return `${pageHead(loc, "colors", jump)}\n${groups}`;
}

function dictionaryBody(loc) {
  const th = (key, label) => `<th scope="col"><button type="button" data-sort="${key}">${esc(label)}</button></th>`;
  const rows = lib
    .map((c) => `<tr data-id="${c.id}" data-family="${c.family}" data-name="${esc(c.en.toLowerCase())}" data-h="${c.hsl.s < 10 ? 400 + c.hsl.l : c.hsl.h}" data-l="${c.hsl.l}" data-search="${esc(`${c.en} ${c.tr} ${c.hex} ${c.id}`.toLowerCase())}">
<td class="mono">${c.id}</td><td><span class="row" style="flex-wrap:nowrap"><span class="sw-dot" style="background:${c.hex}"></span><a href="${url(loc, `colors/${c.id}/`)}">${esc(c.en)}</a></span></td><td>${esc(c.tr)}</td><td>${esc(t(loc, `family.${c.family}`))}</td><td class="mono">${c.hex}</td><td class="mono">${c.rgb.join(", ")}</td><td class="mono">${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%</td><td class="mono">${c.cmyk.c}, ${c.cmyk.m}, ${c.cmyk.y}, ${c.cmyk.k}</td></tr>`)
    .join("\n");
  return `${pageHead(loc, "dictionary")}
<div class="toolbar">
  <label class="field grow"><span class="sr-only">${esc(t(loc, "ui.searchColors"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t(loc, "ui.searchColors"))}" data-dict-filter></label>
  <select class="select" data-dict-family aria-label="${esc(t(loc, "col.family"))}">${familyOptions(loc)}</select>
</div>
<p class="count" data-dict-count data-template="${esc(traw(loc, "ui.showing"))}" aria-live="polite">${esc(t(loc, "ui.showing", { count: lib.length }))}</p>
<div class="table-wrap">
<table class="table" data-dict>
<thead><tr>${th("id", t(loc, "col.no"))}${th("name", t(loc, "col.name"))}<th scope="col">${esc(t(loc, "col.trad"))}</th>${th("family", t(loc, "col.family"))}<th scope="col">HEX</th><th scope="col">RGB</th>${th("h", "HSL")}<th scope="col">CMYK</th></tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>`;
}

function ratioBadge(r) {
  const label = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "—";
  const cls = r >= 4.5 ? "badge-ok" : r >= 3 ? "badge-warn" : "badge-bad";
  return `<span class="badge ${cls}">${label} ${r.toFixed(1)}:1</span>`;
}

function detailBody(loc, c) {
  const text = bestTextOn(c.hex);
  const idx = lib.indexOf(c);
  const prev = lib[(idx - 1 + lib.length) % lib.length], next = lib[(idx + 1) % lib.length];
  const values = [["HEX", fmt.hex(c)], ["RGB", fmt.rgb(c)], ["HSL", fmt.hsl(c)], ["CMYK", fmt.cmyk(c)], ["OKLCH", oklchCss(c.hex)]]
    .map(([k, v]) => `<div class="kv"><span class="kv-label">${k}</span><span class="kv-value"><span class="mono">${esc(v)}</span><button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="${esc(v)}" aria-label="${esc(t(loc, "ui.copy"))} ${k}">${icon("copy")}</button></span></div>`)
    .join("");
  const seen = new Set([c.id]);
  const pairs = [];
  for (const key of RELATION_KEYS) {
    for (const id of c.relations[key]) {
      if (seen.has(id) || pairs.length >= 10) continue;
      seen.add(id);
      pairs.push({ o: byId[id], key });
    }
  }
  const pairList = pairs
    .map(({ o, key }) => `<li><a href="${url(loc, `colors/${o.id}/`)}"><span class="sw" style="background:${o.hex}"></span><span class="pl-text"><b>${esc(o.en)}</b><span>${esc(t(loc, `rel.${key}`))} · ${o.hex}</span></span></a></li>`)
    .join("");
  const tools = [["explorer", "explorer/"], ["generator", "generator/"], ["ideas", "palettes/"], ["gradients", "gradients/"], ["scene", "scene/"], ["theme", "theme/"], ["terminal", "terminal/"], ["today", "today/"]]
    .map(([k, s]) => `<a class="btn" href="${url(loc, s)}?c=${c.id}">${esc(t(loc, `nav.${k}`))}${icon("arrowUpRight")}</a>`)
    .join("");
  return `<nav class="breadcrumb" aria-label="Breadcrumb"><a href="${url(loc, "colors/")}">${esc(t(loc, "nav.colors"))}</a>${icon("chevronRight")}<span>${esc(c.en)}</span></nav>
<div class="tool">
  <div>
    <div class="hero-swatch" style="background:${c.hex};color:${text}">
      <span class="hero-no">No. ${c.id} · ${esc(t(loc, `family.${c.family}`))}</span>
      <div><h1>${esc(c.en)}</h1><p class="hero-sub">${esc(c.tr)}</p></div>
    </div>
    <div class="actions">
      <button type="button" class="btn fav" data-fav="${c.id}" aria-pressed="false">${iconPair("heart")}<span>${esc(t(loc, "ui.save"))}</span></button>
      <button type="button" class="btn" data-copy="${esc(`${c.en} ${c.hex}`)}">${icon("copy")}<span>${esc(t(loc, "ui.copyNameHex"))}</span></button>
      <a class="btn" href="/cards/${c.id}.svg" download="${slugify(c.en)}-${c.id}.svg">${icon("download")}<span>${esc(t(loc, "detail.card"))}</span></a>
    </div>
    <div class="card"><div class="card-head"><h2>${esc(t(loc, "detail.values"))}</h2></div>${values}</div>
    <div class="card" style="margin-top:16px"><div class="card-head"><h2>${esc(t(loc, "detail.contrast"))}</h2></div>
      <div class="kv"><span class="row" style="flex-wrap:nowrap"><span class="sw-dot" style="background:${c.hex};outline:1px solid #FFFFFF"></span><span>${esc(t(loc, "detail.withWhite"))}</span></span>${ratioBadge(contrast(c.hex, "#FFFFFF"))}</div>
      <div class="kv"><span class="row" style="flex-wrap:nowrap"><span class="sw-dot" style="background:${c.hex}"></span><span>${esc(t(loc, "detail.withBlack"))}</span></span>${ratioBadge(contrast(c.hex, "#000000"))}</div>
    </div>
  </div>
  <aside class="tool-side">
    <div class="card"><div class="card-head"><h2>${esc(t(loc, "detail.pairs"))}</h2></div><ul class="pair-list">${pairList}</ul></div>
    <div><p class="side-title">${esc(t(loc, "detail.useIn"))}</p><div class="link-grid">${tools}</div></div>
    <div class="prevnext"><a class="btn" href="${url(loc, `colors/${prev.id}/`)}">${icon("chevronLeft")}${esc(prev.en)}</a><a class="btn" href="${url(loc, `colors/${next.id}/`)}">${esc(next.en)}${icon("chevronRight")}</a></div>
  </aside>
</div>`;
}

// ---------- Share: skills ----------
function skillsBody(loc) {
  const install = `mkdir -p ~/.claude/skills/colors-of-india\ncurl -o ~/.claude/skills/colors-of-india/SKILL.md ${SITE_URL}/skills/colors-of-india/SKILL.md`;
  const codeBlock = (label, code) =>
    `<div class="code"><div class="code-head"><span>${esc(label)}</span><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(code)}">${icon("copy")}${esc(t(loc, "ui.copy"))}</button></div><pre>${esc(code)}</pre></div>`;
  const prompts = ["skills.prompt1", "skills.prompt2", "skills.prompt3"].map((k) => `<li>${esc(t(loc, k))}</li>`).join("");
  return `${pageHead(loc, "skills")}
<div class="prose">
  <h2>${esc(t(loc, "skills.installTitle"))}</h2>
  <p>${esc(t(loc, "skills.installBody"))}</p>
  ${codeBlock("Terminal", install)}
  <p><a class="btn" href="/skills/colors-of-india/SKILL.md" download>${icon("download")}${esc(t(loc, "skills.download"))}</a></p>
  <h2>${esc(t(loc, "skills.dataTitle"))}</h2>
  <p>${esc(t(loc, "skills.dataBody"))}</p>
  <ul><li><a href="/data/colors.json">/data/colors.json</a></li><li><a href="/llms.txt">/llms.txt</a></li><li><a href="/llms-full.txt">/llms-full.txt</a></li></ul>
  <h2>${esc(t(loc, "skills.promptsTitle"))}</h2>
  <ul>${prompts}</ul>
</div>`;
}

// Shown while a tool page loads its data: a lamp with a flickering flame.
function loader(loc) {
  return `<div class="loader" data-loader role="status"><svg class="diya-load" viewBox="0 0 256 256" aria-hidden="true"><defs><radialGradient id="dl-glow"><stop offset="0" stop-color="#FFB53B" stop-opacity=".55"/><stop offset="1" stop-color="#FFB53B" stop-opacity="0"/></radialGradient></defs><circle class="dl-glow" cx="128" cy="92" r="84" fill="url(#dl-glow)"/><path class="dl-flame" d="M128 118c-30-26-22-62 0-88 22 26 30 62 0 88z" fill="#F2A21E"/><path class="dl-flame dl-core" d="M128 112c-12-12-9-28 0-40 9 12 12 28 0 40z" fill="#FFE08A"/><path d="M28 136h200c0 50-44 80-100 80S28 186 28 136z" fill="#B5622F"/><path d="M28 136h200" stroke="#8A4120" stroke-width="10" stroke-linecap="round"/></svg><span>${esc(t(loc, "ui.loading"))}</span></div>`;
}

function appBody(loc, key) {
  return `${pageHead(loc, key)}
<noscript><p class="empty">${esc(t(loc, "ui.noscript"))}</p></noscript>
<div data-app-root>${loader(loc)}</div>`;
}

// ---------- SVG card ----------
function cardSvg(c) {
  const text = bestTextOn(c.hex);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="540" viewBox="0 0 900 540">
  <rect width="900" height="540" fill="#FFFFFF"/>
  <rect width="480" height="540" fill="${c.hex}"/>
  <text x="36" y="500" font-family="Geist Mono, SF Mono, Menlo, monospace" font-size="22" fill="${text}">No. ${c.id}</text>
  <text x="528" y="132" font-family="Geist, Helvetica Neue, Arial, sans-serif" font-size="44" font-weight="600" fill="#111111">${esc(c.en)}</text>
  <text x="528" y="176" font-family="Geist, Helvetica Neue, Arial, sans-serif" font-size="22" fill="#6B6A66">${esc(c.tr)}</text>
  <text x="528" y="300" font-family="Geist Mono, SF Mono, Menlo, monospace" font-size="22" fill="#111111">HEX  ${c.hex}</text>
  <text x="528" y="340" font-family="Geist Mono, SF Mono, Menlo, monospace" font-size="22" fill="#111111">RGB  ${c.rgb.join(" ")}</text>
  <text x="528" y="380" font-family="Geist Mono, SF Mono, Menlo, monospace" font-size="22" fill="#111111">HSL  ${c.hsl.h} ${c.hsl.s}% ${c.hsl.l}%</text>
  <text x="528" y="420" font-family="Geist Mono, SF Mono, Menlo, monospace" font-size="22" fill="#111111">CMYK ${c.cmyk.c} ${c.cmyk.m} ${c.cmyk.y} ${c.cmyk.k}</text>
  <text x="528" y="500" font-family="Geist, Helvetica Neue, Arial, sans-serif" font-size="16" fill="#6B6A66">Colors of India · approximate value</text>
</svg>
`;
}

// ---------- build ----------
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });
copyDir(path.join(SRC, "assets"), path.join(DIST, "assets"));
copyDir(path.join(SRC, "lib"), path.join(DIST, "assets", "lib"));
write("assets/favicon.svg", brandMark(32).replace('class="brand-mark" ', 'xmlns="http://www.w3.org/2000/svg" '));

write("data/colors.json", JSON.stringify(
  lib.map((c) => ({ id: c.id, en: c.en, tr: c.tr, hex: c.hex, family: c.family, cat: c.cat, rgb: c.rgb, hsl: c.hsl, cmyk: c.cmyk, relations: c.relations })),
  null, 0
));
for (const c of lib) write(`cards/${c.id}.svg`, cardSvg(c));
write("data/colors.csv", ["id,name,traditional,hex,r,g,b,family,category", ...lib.map((c) => [c.id, c.en, c.tr, c.hex, ...c.rgb, c.family, c.cat].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n") + "\n");

let pageCount = 0;
for (const loc of LOCALES) {
  const siteName = t(loc, "site.name");
  for (const p of PAGES) {
    const body =
      { home: homeBody, colors: colorsBody, states: statesBody, dictionary: dictionaryBody, skills: skillsBody }[p.key]?.(loc) ??
      (CLIENT_PAGES.has(p.key) ? appBody(loc, p.key) : "");
    const title = p.key === "home" ? siteName : `${t(loc, `nav.${p.key}`)} · ${siteName}`;
    write(`${loc}/${p.slug}index.html`, page(loc, p.slug, { key: p.key, title, description: t(loc, `lede.${p.key}`), body }));
    pageCount++;
  }
  for (const c of lib) {
    const slug = `colors/${c.id}/`;
    write(`${loc}/${slug}index.html`, page(loc, slug, {
      key: "detail",
      activeKey: "colors",
      title: `${c.en} ${c.hex} · ${siteName}`,
      description: t(loc, "meta.detail", { name: c.en, hex: c.hex }),
      body: detailBody(loc, c),
    }));
    pageCount++;
  }
}

write("index.html", `<!doctype html>
<html lang="${DEFAULT_LOCALE}">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="refresh" content="0; url=/${DEFAULT_LOCALE}/">
    <link rel="canonical" href="${SITE_URL}/${DEFAULT_LOCALE}/">
    <title>${esc(t(DEFAULT_LOCALE, "site.name"))}</title>
  </head>
  <body><p><a href="/${DEFAULT_LOCALE}/">${esc(t(DEFAULT_LOCALE, "site.name"))}</a></p></body>
</html>
`);

// Sitemap, robots, LLM-facing text, skill file.
const urls = [];
for (const loc of LOCALES) {
  for (const p of PAGES) urls.push({ loc, slug: p.slug });
  for (const c of lib) urls.push({ loc, slug: `colors/${c.id}/` });
}
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.map(({ loc, slug }) => `  <url><loc>${SITE_URL}${url(loc, slug)}</loc>${LOCALES.map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${url(l, slug)}"/>`).join("")}</url>`).join("\n")}
</urlset>
`);
write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

const table = lib.map((c) => `${c.id} | ${c.en} | ${c.tr} | ${c.hex} | ${c.family}`).join("\n");
write("llms.txt", `# Colors of India

> ${lib.length} traditional Indian colors with English names, traditional names (romanized), HEX/RGB/HSL/CMYK values and harmony relations. ${site.license}. HEX values are approximate working values. Made by ${site.owner} (${site.portfolio}).

## Pages (English)

${PAGES.map((p) => `- [${t("en", `nav.${p.key}`)}](${SITE_URL}${url("en", p.slug)})`).join("\n")}

## Data

- ${SITE_URL}/data/colors.json
- ${SITE_URL}/data/colors.csv
- ${SITE_URL}/llms-full.txt
- ${SITE_URL}/skills/colors-of-india/SKILL.md

## Source and author

- Repository: ${site.repo}
- Author: ${site.owner} (${site.portfolio}), GitHub ${site.github}, LinkedIn ${site.linkedin}
- License: ${site.license}
`);
write("llms-full.txt", `# Colors of India: full list

Format: id | English | traditional name | HEX | family

${table}
`);
write("skills/colors-of-india/SKILL.md", `---
name: colors-of-india
description: Use when choosing colors, palettes, UI themes or terminal themes from traditional Indian colors (Turmeric, Sindoor, Peacock Blue, Indigo and ${lib.length - 4} more). Contains the full library with HEX values and families.
---

# Colors of India

${lib.length} traditional Indian colors. Source: ${SITE_URL}/en/

## Rules

- Use exact HEX values from the table below and say the color name next to the value.
- HEX values are approximate working values, not measured pigment or dye references.
- Text must reach 4.5:1 contrast on its background (WCAG AA); buttons and other fills need 3:1.
- When a value has to be adjusted (for contrast or dark mode), say it is adjusted and which library color it came from.
- Tools on the site: palette generator ${SITE_URL}/en/generator/, theme generator ${SITE_URL}/en/theme/, terminal themes ${SITE_URL}/en/terminal/.

## Library

id | English | traditional name | HEX | family
--- | --- | --- | --- | ---
${lib.map((c) => `${c.id} | ${c.en} | ${c.tr} | ${c.hex} | ${c.family}`).join("\n")}
`);

console.log(`Built ${pageCount} pages for ${LOCALES.length} locales, ${lib.length} colors, ${lib.length} SVG cards -> dist/`);
