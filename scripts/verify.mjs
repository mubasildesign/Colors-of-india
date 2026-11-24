// Verifiers for the generated site. Fails the process (exit 1) on any error.
// Checks: data integrity, near-duplicates, relations, site token contrast (light and
// dark), theme tokens for every anchor, terminal palettes for every anchor and mode,
// role palettes, curated palette names, generated HTML (SEO tags, hreflang, internal
// links, no Tamil color words, no CJK), locale completeness, outputs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { enrichLibrary, contrast, deltaE, bestTextOn, hexToRgb, rgbToHex, rgbToOklab, oklabToRgb } from "../src/lib/color.js";
import { themeTokens, terminalPalette, rolePalette, mulberry32, usagePairs, THEME_KEYS, THEME_TEXT_PAIRS, ANSI_KEYS } from "../src/lib/palette.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");
const LOCALES = ["en", "ta", "hi", "te"];
const PAGE_SLUGS = ["", "colors/", "states/", "explorer/", "dictionary/", "generator/", "palettes/", "usage/", "gradients/", "scene/", "theme/", "terminal/", "today/", "saved/", "skills/"];
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "site.json"), "utf8"));
const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

// ---------- 1. data ----------
const source = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "colors.json"), "utf8"));
const lib = enrichLibrary(source);
const byName = new Map(lib.map((c) => [c.en, c]));

const seenHex = new Map();
for (const c of lib) {
  if (seenHex.has(c.hex)) fail(`duplicate hex ${c.hex}: ${seenHex.get(c.hex)} and ${c.en}`);
  seenHex.set(c.hex, c.en);
}
for (let i = 0; i < lib.length; i++) {
  for (let j = i + 1; j < lib.length; j++) {
    const d = deltaE(lib[i].lab, lib[j].lab);
    if (d < 1.5) fail(`near-duplicate (dE ${d.toFixed(2)}): ${lib[i].en} vs ${lib[j].en}`);
  }
}
const CJK = /[\u3040-\u30FF\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
const ids = new Set(lib.map((c) => c.id));
for (const c of lib) {
  if (CJK.test(JSON.stringify(c))) fail(`CJK characters in data for ${c.en}`);
  for (const [key, list] of Object.entries(c.relations)) {
    if (!list.length) fail(`${c.en} has empty relation ${key}`);
    for (const id of list) {
      if (!ids.has(id)) fail(`${c.en} relation ${key} points to missing id ${id}`);
      if (id === c.id) fail(`${c.en} relation ${key} points to itself`);
    }
  }
}

// ---------- 2. site tokens: light and dark ----------
const css = fs.readFileSync(path.join(ROOT, "src", "assets", "site.css"), "utf8");
const block = (selector) => {
  const m = css.match(new RegExp(`${selector.replace(/[[\]()*.]/g, "\\$&")}\\s*\\{([\\s\\S]*?)\\}`));
  return Object.fromEntries([...(m?.[1] || "").matchAll(/--([\w-]+):\s*(#[0-9A-Fa-f]{6});/g)].map((x) => [x[1], x[2]]));
};
const siteThemes = { light: block(':root, [data-theme="light"]'), dark: block('[data-theme="dark"]') };
for (const [mode, tk] of Object.entries(siteThemes)) {
  if (!tk.bg) {
    fail(`site.css: could not read ${mode} tokens`);
    continue;
  }
  for (const text of ["text", "text-2", "muted"]) {
    for (const surface of ["bg", "surface", "surface-2"]) {
      const r = contrast(tk[text], tk[surface]);
      if (r < 4.5) fail(`site ${mode}: --${text} on --${surface} is ${r.toFixed(2)}:1`);
    }
  }
  const btn = contrast(tk["on-ink"], tk.ink);
  if (btn < 4.5) fail(`site ${mode}: primary button text ${btn.toFixed(2)}:1`);
  for (const k of ["ok", "warn", "bad"]) {
    const r = contrast(tk[`${k}-text`], tk[`${k}-bg`]);
    if (r < 4.5) fail(`site ${mode}: ${k} badge ${r.toFixed(2)}:1`);
  }
}

// Accent presets: text on the filled primary, and accent-colored text on the tinted surface.
const mixOklab = (a, b, pctA) => {
  const A = rgbToOklab(hexToRgb(a)), B = rgbToOklab(hexToRgb(b));
  return rgbToHex(oklabToRgb(A.map((v, i) => v * pctA + B[i] * (1 - pctA))));
};
const ACCENTS = ["Peacock Blue", "Neel Blue", "Mor Teal", "Paan Leaf", "Turmeric", "Kesar Saffron", "Terracotta", "Sindoor", "Rani Pink", "Jamun"];
for (const name of ACCENTS) {
  const a = lib.find((c) => c.en === name);
  if (!a) {
    fail(`accent preset ${name} not in library`);
    continue;
  }
  const on = bestTextOn(a.hex);
  if (contrast(on, a.hex) < 4.5) fail(`accent ${name}: button text ${contrast(on, a.hex).toFixed(2)}:1`);
  for (const [mode, tk, mix] of [["light", siteThemes.light, "#111111"], ["dark", siteThemes.dark, "#FFFFFF"]]) {
    const pct = mode === "light" ? 0.55 : 0.5;
    const text = mixOklab(a.hex, mix, pct);
    const soft = mixOklab(a.hex, tk.surface, 0.13);
    for (const [label, bg] of [["tint", soft], ["surface", tk.surface]]) {
      const r = contrast(text, bg);
      if (r < 4.5) fail(`accent ${name} ${mode}: accent text on ${label} ${r.toFixed(2)}:1`);
    }
  }
}

// ---------- 3. theme generator ----------
let themeChecks = 0;
for (const anchor of lib) {
  const tk = themeTokens(anchor.hex, lib);
  for (const mode of ["light", "dark"]) {
    const m = tk[mode];
    for (const k of THEME_KEYS) if (!/^#[0-9A-F]{6}$/i.test(m[k]?.hex || "")) fail(`theme ${mode} ${k} missing for ${anchor.en}`);
    for (const [fg, bg, min] of THEME_TEXT_PAIRS) {
      themeChecks++;
      const r = contrast(m[fg].hex, m[bg].hex);
      if (r < min) fail(`theme ${mode} ${fg} on ${bg} for ${anchor.en}: ${r.toFixed(2)}:1 (need ${min})`);
    }
    if (contrast(m.primary.hex, m.background.hex) < 3) fail(`theme ${mode} primary not visible for ${anchor.en}`);
  }
}

// ---------- 4. terminal palettes ----------
let termChecks = 0;
for (const anchor of lib) {
  for (const mode of ["dark", "light"]) {
    for (const depth of ["subtle", "default", "deep"]) {
      const p = terminalPalette(lib, anchor.hex, { mode, depth });
      if (Object.keys(p.ansi).length !== 16) fail(`terminal ${mode}/${depth} for ${anchor.en}: wrong slot count`);
      for (const k of ANSI_KEYS) {
        if (!/^#[0-9A-F]{6}$/i.test(p.ansi[k]?.hex || "")) fail(`terminal ${k} for ${anchor.en} is not hex`);
        if (/black|white/i.test(k)) continue;
        termChecks++;
        const r = contrast(p.ansi[k].hex, p.ui.background.hex);
        if (r < 3) fail(`terminal ${mode}/${depth} ${k} for ${anchor.en}: ${r.toFixed(2)}:1`);
      }
      if (contrast(p.ui.foreground.hex, p.ui.background.hex) < 7) fail(`terminal ${mode}/${depth} foreground for ${anchor.en} below 7:1`);
    }
  }
}

// ---------- 5. role palettes and usage pairs ----------
let roleChecks = 0;
for (const anchor of lib) {
  for (const method of ["auto", "analogous", "complementary", "triadic", "neutral"]) {
    const p = rolePalette(lib, anchor, { method, rand: mulberry32(Number(anchor.id)) });
    roleChecks++;
    const bg = p.background.hex;
    if (contrast(p.headline.hex, bg) < 4.5) fail(`role palette ${anchor.en}/${method}: headline ${contrast(p.headline.hex, bg).toFixed(2)}:1`);
    if (contrast(p.body.hex, bg) < 4.5) fail(`role palette ${anchor.en}/${method}: body below 4.5`);
    if (contrast(p.button.hex, bg) < 3) fail(`role palette ${anchor.en}/${method}: button below 3`);
  }
}
const pairs = usagePairs(lib, 4.5, 8);
if (pairs.length < 500) fail(`only ${pairs.length} usage pairs at 4.5:1`);
for (const p of pairs) if (p.ratio < 4.5) fail(`usage pair ${p.fg.en} on ${p.bg.en} below 4.5`);

// Curated names used by the client must exist in the library.
const clientDir = path.join(ROOT, "src", "assets", "js", "pages");
for (const file of ["ideas.js", "gradients.js"]) {
  const src = fs.readFileSync(path.join(clientDir, file), "utf8");
  const names = [...src.matchAll(/\[\s*((?:"[^"]+",?\s*)+)\]/g)].flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
  for (const n of names) if (/^[A-Z]/.test(n) && !byName.has(n)) fail(`${file}: unknown color name "${n}"`);
}
const pickerSrc = fs.readFileSync(path.join(ROOT, "src", "assets", "js", "picker.js"), "utf8");
const presetList = pickerSrc.match(/PRESET_NAMES = \[([^\]]+)\]/)?.[1] || "";
for (const [, n] of presetList.matchAll(/"([^"]+)"/g)) if (!byName.has(n)) fail(`picker.js: unknown preset "${n}"`);

// ---------- 6. generated HTML ----------
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const TAMIL_WORDS = new Set(source.map((c) => c.ta).filter(Boolean));
if (!fs.existsSync(DIST)) {
  fail("dist/ is missing: run npm run build first");
} else {
  const htmlFiles = walk(DIST).filter((f) => f.endsWith(".html"));
  let linkCount = 0;
  for (const file of htmlFiles) {
    const rel = path.relative(DIST, file);
    const html = fs.readFileSync(file, "utf8");
    const isRedirect = rel === "index.html";
    if (!/<html lang="(en|ta|hi|te)"/.test(html)) fail(`${rel}: missing html lang`);
    if (!/<title>[^<]+<\/title>/.test(html)) fail(`${rel}: missing title`);
    if (!isRedirect && !/<meta name="description" content="[^"]+">/.test(html)) fail(`${rel}: missing meta description`);
    if (!/<link rel="canonical" href="[^"]+">/.test(html)) fail(`${rel}: missing canonical`);
    if (!isRedirect) {
      const alts = (html.match(/<link rel="alternate" hreflang="(en|ta|hi|te|x-default)"/g) || []).length;
      if (alts !== 5) fail(`${rel}: expected 5 hreflang alternates, found ${alts}`);
      if (!html.includes('class="sidebar"')) fail(`${rel}: missing sidebar`);
      if (!html.includes('class="site-foot"') || !html.includes(`href="${SITE.portfolio}"`)) fail(`${rel}: footer must link to the portfolio`);
      if (!html.includes(SITE.repo) || !html.includes("gh-link")) fail(`${rel}: missing GitHub link in the top bar`);
      if (!html.includes("data-vi ")) fail(`${rel}: missing value index dialog`);
    }
    const visible = html.replace(/<script[\s\S]*?<\/script>/g, "");
    if (/undefined|NaN|\[object Object\]/.test(visible)) fail(`${rel}: contains undefined/NaN text`);
    if (/\{[a-z]+\}/.test(visible.replace(/data-template="[^"]*"/g, "").replace(/<[^>]+>/g, " "))) fail(`${rel}: unfilled {placeholder}`);
    if (CJK.test(visible)) fail(`${rel}: CJK characters in page text`);
    // Tamil pages use Tamil UI labels, so color words are only checked elsewhere.
    for (const w of rel.startsWith("ta/") ? [] : TAMIL_WORDS) {
      if (visible.includes(w)) {
        fail(`${rel}: Tamil color word "${w}" in page`);
        break;
      }
    }
    for (const m of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      linkCount++;
      const target = m[1];
      const file2 = target.endsWith("/") ? path.join(DIST, target, "index.html") : path.join(DIST, target);
      if (!fs.existsSync(file2)) fail(`${rel}: broken internal link ${target}`);
    }
  }
  console.log(`checked ${htmlFiles.length} HTML files and ${linkCount} internal links`);

  const en = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "strings", "en.json"), "utf8"));
  for (const l of LOCALES) {
    const s = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "strings", `${l}.json`), "utf8"));
    for (const k of Object.keys(en)) {
      if (k.startsWith("_")) continue;
      if (!(k in s)) fail(`locale ${l} missing key ${k}`);
      else if (!String(s[k]).trim()) fail(`locale ${l} has empty value for ${k}`);
    }
    for (const k of Object.keys(s)) if (!k.startsWith("_") && !(k in en)) warn(`locale ${l} has unused key ${k}`);
    if (l !== "en" && !String(s._status || "").includes("review")) fail(`locale ${l} must be flagged for native review`);
  }

  // String keys used by client modules must exist in en.json.
  const clientFiles = walk(path.join(ROOT, "src", "assets")).filter((f) => f.endsWith(".js"));
  for (const f of clientFiles) {
    const src = fs.readFileSync(f, "utf8");
    for (const [, key] of src.matchAll(/\bt\("([a-z]+\.[\w.]+)"/g)) if (!(key in en)) fail(`${path.relative(ROOT, f)}: unknown string key ${key}`);
  }

  for (const l of LOCALES) {
    for (const slug of PAGE_SLUGS) if (!fs.existsSync(path.join(DIST, l, slug, "index.html"))) fail(`missing page ${l}/${slug}`);
    for (const c of lib) if (!fs.existsSync(path.join(DIST, l, "colors", c.id, "index.html"))) fail(`missing detail page ${l}/${c.id}`);
  }
  for (const c of lib) if (!fs.existsSync(path.join(DIST, "cards", `${c.id}.svg`))) fail(`missing SVG card ${c.id}`);
  const required = ["sitemap.xml", "robots.txt", "llms.txt", "llms-full.txt", "assets/site.css", "assets/app.js", "assets/js/core.js", "assets/js/shell.js", "assets/js/picker.js", "assets/lib/color.js", "assets/lib/palette.js", "assets/lib/icons.js", "assets/lib/icon-data.js", "data/colors.json", "data/colors.csv", "skills/colors-of-india/SKILL.md"];
  for (const page of ["home", "dictionary", "explorer", "generator", "ideas", "usage", "gradients", "scene", "theme", "terminal", "today", "saved"]) required.push(`assets/js/pages/${page}.js`);
  for (const f of required) if (!fs.existsSync(path.join(DIST, f))) fail(`missing output ${f}`);
  const outData = JSON.parse(fs.readFileSync(path.join(DIST, "data", "colors.json"), "utf8"));
  if (outData.some((c) => "ta" in c || "taRoman" in c)) fail("dist/data/colors.json still contains Tamil fields");
}

// ---------- report ----------
console.log(`library: ${lib.length} colors, ${new Set(lib.map((c) => c.family)).size} families`);
console.log(`theme: ${themeChecks} text pairs · terminal: ${termChecks} slot checks · role palettes: ${roleChecks} · usage pairs: ${pairs.length}`);
for (const w of warnings) console.log(`warn: ${w}`);
if (errors.length) {
  for (const e of errors.slice(0, 60)) console.error(`error: ${e}`);
  console.error(`\n${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`ok: 0 errors, ${warnings.length} warning(s)`);
