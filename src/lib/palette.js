// Palette features: role palettes, usage pairs, theme tokens (OKLCH), terminal palettes and exports.
// Provenance rule: a value is "named" when it is an exact library color, and
// "adjusted" when the algorithm had to derive it. The UI shows which is which.

import { hexToRgb, rgbToOklab, oklabToOklch, fitOklchToHex, contrast, bestTextOn, luminance } from "./color.js";

export const hueDiff = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

export function anchorOklch(hex) {
  return oklabToOklch(rgbToOklab(hexToRgb(hex)));
}

export const oklchOf = (hex) => {
  const [L, C, H] = anchorOklch(hex);
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${(H || 0).toFixed(1)})`;
};

const isDark = (hex) => luminance(hexToRgb(hex)) < 0.18;

function token(name, hex, library) {
  const named = library.find((x) => x.hex === hex);
  return { name, hex, css: oklchOf(hex), kind: named ? "named" : "adjusted", named: named ? named.en : null };
}

const fromOklch = (name, L, C, H, library) => token(name, fitOklchToHex(L, C, H), library);

// Move lightness away from the surface until the color clears minRatio on it.
function readable(name, surfaceHex, L0, C, H, minRatio, library) {
  const step = isDark(surfaceHex) ? 0.01 : -0.01;
  let L = L0;
  for (let i = 0; i < 100; i++) {
    const tok = fromOklch(name, L, C, H, library);
    const ratio = contrast(tok.hex, surfaceHex);
    if (ratio >= minRatio) return { ...tok, ratio };
    L = Math.min(1, Math.max(0, L + step));
  }
  const hex = isDark(surfaceHex) ? "#FFFFFF" : "#000000";
  return { ...token(name, hex, library), ratio: contrast(hex, surfaceHex) };
}

// Fills (buttons, rings, chart marks) need 3:1 against their surface to read as shapes.
function visibleFill(name, hex, surfaceHex, library) {
  const ratio = contrast(hex, surfaceHex);
  if (ratio >= 3) return { ...token(name, hex, library), ratio };
  const [L, C, H] = anchorOklch(hex);
  return readable(name, surfaceHex, L, C, H, 3, library);
}

function onFill(name, fillHex, library) {
  const hex = bestTextOn(fillHex);
  return { ...token(name, hex, library), ratio: contrast(hex, fillHex) };
}

const rename = (tok, name) => ({ ...tok, name });

// ---------- theme tokens (shadcn/ui naming) ----------
export const THEME_KEYS = [
  "background", "foreground", "card", "card-foreground", "popover", "popover-foreground",
  "primary", "primary-foreground", "secondary", "secondary-foreground", "muted", "muted-foreground",
  "accent", "accent-foreground", "destructive", "destructive-foreground", "border", "input", "ring",
  "chart-1", "chart-2", "chart-3", "chart-4", "chart-5",
  "sidebar", "sidebar-foreground", "sidebar-primary", "sidebar-primary-foreground",
  "sidebar-accent", "sidebar-accent-foreground", "sidebar-border", "sidebar-ring",
];

// Text pairs every theme must pass: [text, surface, minimum ratio].
export const THEME_TEXT_PAIRS = [
  ["foreground", "background", 7],
  ["card-foreground", "card", 7],
  ["muted-foreground", "muted", 4.5],
  ["muted-foreground", "background", 4.5],
  ["primary-foreground", "primary", 4.5],
  ["secondary-foreground", "secondary", 4.5],
  ["accent-foreground", "accent", 4.5],
  ["destructive-foreground", "destructive", 4.5],
  ["sidebar-foreground", "sidebar", 7],
];

export function themeTokens(anchorHex, library) {
  const [, , H0] = anchorOklch(anchorHex);
  const H = H0 || 0;
  const destructiveBase = (library.find((x) => x.en === "Sindoor") || { hex: "#D42A1F" }).hex;
  const chromatic = library.filter((x) => x.hsl.s >= 35 && x.hsl.l >= 35 && x.hsl.l <= 68);
  const chartHexes = [0, 72, 144, 216, 288].map((offset, i) => {
    if (i === 0) return anchorHex;
    const target = (H + offset) % 360;
    return [...chromatic].sort((p, q) => hueDiff(p.hsl.h, target) - hueDiff(q.hsl.h, target))[0].hex;
  });

  const build = (mode) => {
    const light = mode === "light";
    const bg = fromOklch("background", light ? 0.985 : 0.17, light ? 0.005 : 0.012, H, library);
    const card = fromOklch("card", light ? 0.998 : 0.205, light ? 0.002 : 0.013, H, library);
    const muted = fromOklch("muted", light ? 0.955 : 0.255, light ? 0.01 : 0.014, H, library);
    const secondary = fromOklch("secondary", light ? 0.945 : 0.27, 0.018, H, library);
    const accent = fromOklch("accent", light ? 0.935 : 0.3, light ? 0.035 : 0.03, H, library);
    const border = fromOklch("border", light ? 0.905 : 0.3, light ? 0.008 : 0.012, H, library);
    const sidebar = fromOklch("sidebar", light ? 0.97 : 0.19, light ? 0.008 : 0.012, H, library);
    const textL = light ? 0.2 : 0.96;
    const primary = visibleFill("primary", anchorHex, bg.hex, library);
    const primaryFg = onFill("primary-foreground", primary.hex, library);
    const accentFg = readable("accent-foreground", accent.hex, light ? 0.25 : 0.94, 0.03, H, 4.5, library);
    const cardFg = readable("card-foreground", card.hex, textL, 0.02, H, 7, library);
    const destructive = visibleFill("destructive", destructiveBase, bg.hex, library);
    const tokens = {
      background: bg,
      foreground: readable("foreground", bg.hex, textL, 0.02, H, 7, library),
      card,
      "card-foreground": cardFg,
      popover: rename(card, "popover"),
      "popover-foreground": rename(cardFg, "popover-foreground"),
      primary,
      "primary-foreground": primaryFg,
      secondary,
      "secondary-foreground": readable("secondary-foreground", secondary.hex, light ? 0.25 : 0.94, 0.02, H, 4.5, library),
      muted,
      "muted-foreground": readable("muted-foreground", muted.hex, light ? 0.5 : 0.72, 0.025, H, 4.5, library),
      accent,
      "accent-foreground": accentFg,
      destructive,
      "destructive-foreground": onFill("destructive-foreground", destructive.hex, library),
      border,
      input: rename(border, "input"),
      ring: rename(primary, "ring"),
      sidebar,
      "sidebar-foreground": readable("sidebar-foreground", sidebar.hex, textL, 0.02, H, 7, library),
      "sidebar-primary": rename(primary, "sidebar-primary"),
      "sidebar-primary-foreground": rename(primaryFg, "sidebar-primary-foreground"),
      "sidebar-accent": rename(accent, "sidebar-accent"),
      "sidebar-accent-foreground": rename(accentFg, "sidebar-accent-foreground"),
      "sidebar-border": rename(border, "sidebar-border"),
      "sidebar-ring": rename(primary, "sidebar-ring"),
    };
    chartHexes.forEach((hex, i) => {
      tokens[`chart-${i + 1}`] = visibleFill(`chart-${i + 1}`, hex, card.hex, library);
    });
    return tokens;
  };
  return { light: build("light"), dark: build("dark") };
}

export function exportShadcn(theme, { title, radius = "0.625rem" }) {
  const block = (sel, m) =>
    `${sel} {\n${sel === ":root" ? `  --radius: ${radius};\n` : ""}${THEME_KEYS.map((k) => `  --${k}: ${m[k].css};`).join("\n")}\n}`;
  return `/* ${title} · Colors of India\n * shadcn/ui + Tailwind v4: replace the :root and .dark blocks in globals.css.\n */\n${block(":root", theme.light)}\n\n${block(".dark", theme.dark)}\n`;
}

export function exportDaisy(theme, library, { name, radius = "0.5rem" }) {
  const strong = library.filter((x) => x.hsl.s >= 45 && x.hsl.l >= 35 && x.hsl.l <= 60);
  const nearestHue = (target) => [...strong].sort((p, q) => hueDiff(p.hsl.h, target) - hueDiff(q.hsl.h, target))[0].hex;
  const status = { info: nearestHue(215), success: nearestHue(140), warning: nearestHue(42) };
  const block = (mode) => {
    const m = theme[mode];
    const light = mode === "light";
    const vars = {
      "color-base-100": m.background.css,
      "color-base-200": m.muted.css,
      "color-base-300": m.border.css,
      "color-base-content": m.foreground.css,
      "color-primary": m.primary.css,
      "color-primary-content": m["primary-foreground"].css,
      "color-secondary": m["chart-2"].css,
      "color-secondary-content": oklchOf(bestTextOn(m["chart-2"].hex)),
      "color-accent": m["chart-3"].css,
      "color-accent-content": oklchOf(bestTextOn(m["chart-3"].hex)),
      "color-neutral": light ? m.foreground.css : m.secondary.css,
      "color-neutral-content": light ? m.background.css : m["secondary-foreground"].css,
      "color-info": oklchOf(status.info),
      "color-info-content": oklchOf(bestTextOn(status.info)),
      "color-success": oklchOf(status.success),
      "color-success-content": oklchOf(bestTextOn(status.success)),
      "color-warning": oklchOf(status.warning),
      "color-warning-content": oklchOf(bestTextOn(status.warning)),
      "color-error": m.destructive.css,
      "color-error-content": m["destructive-foreground"].css,
      "radius-selector": radius,
      "radius-field": radius,
      "radius-box": radius,
      "size-selector": "0.25rem",
      "size-field": "0.25rem",
      border: "1px",
      depth: "0",
      noise: "0",
    };
    return `@plugin "daisyui/theme" {\n  name: "${name}-${mode}";\n  default: ${light};\n  prefersdark: ${!light};\n  color-scheme: ${mode};\n${Object.entries(vars).map(([k, v]) => `  --${k}: ${v};`).join("\n")}\n}`;
  };
  return `/* ${name} · daisyUI 5 themes (add to your Tailwind v4 CSS after @plugin "daisyui") */\n${block("light")}\n\n${block("dark")}\n`;
}

export function exportTokensJson(theme) {
  const pick = (m) => Object.fromEntries(THEME_KEYS.map((k) => [k, { hex: m[k].hex, oklch: m[k].css, source: m[k].named || "adjusted" }]));
  return JSON.stringify({ light: pick(theme.light), dark: pick(theme.dark) }, null, 2) + "\n";
}

// ---------- terminal palette ----------
const SLOT_HUES = { red: 18, green: 135, yellow: 75, blue: 225, magenta: 310, cyan: 188 };
const DEPTH = {
  dark: { subtle: [0.22, 0.006], default: [0.18, 0.014], deep: [0.15, 0.028] },
  light: { subtle: [0.985, 0.004], default: [0.97, 0.012], deep: [0.95, 0.026] },
};

export function terminalPalette(library, anchorHex, { mode = "dark", depth = "default" } = {}) {
  const [, aC, aH0] = anchorOklch(anchorHex);
  const aH = aH0 || 0;
  const [bgL, bgC] = DEPTH[mode][depth];
  const bg = fromOklch("background", bgL, bgC, aH, library);
  const dark = mode === "dark";
  const targetL = dark ? 58 : 40;
  const pool = library.filter((x) => x.hsl.s >= 40 && x.hsl.l >= 20 && x.hsl.l <= 80);

  const pickSlot = (name, target) => {
    const near = pool
      .filter((x) => hueDiff(x.hsl.h, target) <= 30)
      .sort((p, q) => hueDiff(p.hsl.h, target) - hueDiff(q.hsl.h, target) || Math.abs(p.hsl.l - targetL) - Math.abs(q.hsl.l - targetL));
    const ok = near.find((x) => contrast(x.hex, bg.hex) >= 3.2);
    if (ok) return token(name, ok.hex, library);
    const base = near[0] || pool.sort((p, q) => hueDiff(p.hsl.h, target) - hueDiff(q.hsl.h, target))[0];
    const [L, C, H] = anchorOklch(base.hex);
    return readable(name, bg.hex, L, C, H, 3.2, library);
  };

  let anchorSlot = null;
  if (aC >= 0.05) anchorSlot = Object.keys(SLOT_HUES).sort((a, b) => hueDiff(SLOT_HUES[a], aH) - hueDiff(SLOT_HUES[b], aH))[0];

  const normal = {};
  for (const [name, target] of Object.entries(SLOT_HUES)) {
    normal[name] = name === anchorSlot ? visibleFill(name, anchorHex, bg.hex, library) : pickSlot(name, target);
  }

  const bright = {};
  for (const [name, target] of Object.entries(SLOT_HUES)) {
    const base = normal[name];
    const baseL = anchorOklch(base.hex)[0];
    const candidates = library
      .filter((x) => x.hsl.s >= 30 && x.hex !== base.hex && hueDiff(x.hsl.h, target) <= 28 && contrast(x.hex, bg.hex) >= 3.2)
      .map((x) => ({ x, L: anchorOklch(x.hex)[0] }))
      .filter(({ L }) => (dark ? L > baseL + 0.04 && L < 0.92 : Math.abs(L - baseL) >= 0.03))
      .sort((p, q) => (dark ? p.L - q.L : q.x.hsl.s - p.x.hsl.s));
    const key = `bright${name[0].toUpperCase()}${name.slice(1)}`;
    if (candidates.length) bright[key] = token(key, candidates[0].x.hex, library);
    else {
      const [L, C, H] = anchorOklch(base.hex);
      bright[key] = readable(key, bg.hex, dark ? Math.min(0.92, L + 0.1) : Math.max(0.3, L - 0.08), C, H, 3.2, library);
    }
  }

  const named = (en) => library.find((x) => x.en === en);
  const black = dark ? fromOklch("black", 0.3, 0.012, aH, library) : token("black", named("Black").hex, library);
  const white = dark ? token("white", named("Muslin").hex, library) : fromOklch("white", 0.86, 0.01, aH, library);
  const brightBlack = readable("brightBlack", bg.hex, dark ? 0.55 : 0.6, 0.012, aH, 3.2, library);
  const brightWhite = dark ? token("brightWhite", named("White").hex, library) : fromOklch("brightWhite", 0.95, 0.005, aH, library);
  const fg = readable("foreground", bg.hex, dark ? 0.93 : 0.27, 0.012, aH, 7, library);
  const cursor = rename(normal[anchorSlot || "blue"], "cursor");
  const selection = fromOklch("selection", dark ? 0.34 : 0.88, 0.05, aH, library);

  return {
    mode,
    depth,
    anchor: anchorHex,
    anchorSlot,
    ansi: {
      black, red: normal.red, green: normal.green, yellow: normal.yellow, blue: normal.blue,
      magenta: normal.magenta, cyan: normal.cyan, white,
      brightBlack, brightRed: bright.brightRed, brightGreen: bright.brightGreen, brightYellow: bright.brightYellow,
      brightBlue: bright.brightBlue, brightMagenta: bright.brightMagenta, brightCyan: bright.brightCyan, brightWhite,
    },
    ui: { background: bg, foreground: fg, cursor, selection, selectionForeground: rename(fg, "selectionForeground") },
  };
}

export const ANSI_KEYS = [
  "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
  "brightBlack", "brightRed", "brightGreen", "brightYellow", "brightBlue", "brightMagenta", "brightCyan", "brightWhite",
];

export function exportGhostty(p, name) {
  const lines = [
    `# ${name}`,
    `background = ${p.ui.background.hex}`,
    `foreground = ${p.ui.foreground.hex}`,
    `cursor-color = ${p.ui.cursor.hex}`,
    `selection-background = ${p.ui.selection.hex}`,
    `selection-foreground = ${p.ui.selectionForeground.hex}`,
  ];
  ANSI_KEYS.forEach((key, i) => lines.push(`palette = ${i}=${p.ansi[key].hex}`));
  return lines.join("\n") + "\n";
}

export function exportAlacritty(p, name) {
  const a = p.ansi;
  const short = (k) => k.replace("bright", "").replace(/^./, (c) => c.toLowerCase());
  return [
    `# ${name}`,
    "[colors.primary]",
    `background = "${p.ui.background.hex}"`,
    `foreground = "${p.ui.foreground.hex}"`,
    "",
    "[colors.cursor]",
    `cursor = "${p.ui.cursor.hex}"`,
    `text = "${p.ui.background.hex}"`,
    "",
    "[colors.selection]",
    `background = "${p.ui.selection.hex}"`,
    `text = "${p.ui.selectionForeground.hex}"`,
    "",
    "[colors.normal]",
    ...ANSI_KEYS.slice(0, 8).map((k) => `${k} = "${a[k].hex}"`),
    "",
    "[colors.bright]",
    ...ANSI_KEYS.slice(8).map((k) => `${short(k)} = "${a[k].hex}"`),
    "",
  ].join("\n");
}

export function exportKitty(p, name) {
  const lines = [
    `# ${name}`,
    `background ${p.ui.background.hex}`,
    `foreground ${p.ui.foreground.hex}`,
    `cursor ${p.ui.cursor.hex}`,
    `selection_background ${p.ui.selection.hex}`,
    `selection_foreground ${p.ui.selectionForeground.hex}`,
  ];
  ANSI_KEYS.forEach((key, i) => lines.push(`color${i} ${p.ansi[key].hex}`));
  return lines.join("\n") + "\n";
}

export function exportWezterm(p, name) {
  const list = (keys) => `[${keys.map((k) => `"${p.ansi[k].hex}"`).join(", ")}]`;
  return [
    "[colors]",
    `foreground = "${p.ui.foreground.hex}"`,
    `background = "${p.ui.background.hex}"`,
    `cursor_bg = "${p.ui.cursor.hex}"`,
    `cursor_border = "${p.ui.cursor.hex}"`,
    `selection_bg = "${p.ui.selection.hex}"`,
    `selection_fg = "${p.ui.selectionForeground.hex}"`,
    `ansi = ${list(ANSI_KEYS.slice(0, 8))}`,
    `brights = ${list(ANSI_KEYS.slice(8))}`,
    "",
    "[metadata]",
    `name = "${name}"`,
    "",
  ].join("\n");
}

export function exportWindowsTerminal(p, name) {
  const a = p.ansi;
  const scheme = {
    name,
    background: p.ui.background.hex,
    foreground: p.ui.foreground.hex,
    cursorColor: p.ui.cursor.hex,
    selectionBackground: p.ui.selection.hex,
    black: a.black.hex, red: a.red.hex, green: a.green.hex, yellow: a.yellow.hex,
    blue: a.blue.hex, purple: a.magenta.hex, cyan: a.cyan.hex, white: a.white.hex,
    brightBlack: a.brightBlack.hex, brightRed: a.brightRed.hex, brightGreen: a.brightGreen.hex, brightYellow: a.brightYellow.hex,
    brightBlue: a.brightBlue.hex, brightPurple: a.brightMagenta.hex, brightCyan: a.brightCyan.hex, brightWhite: a.brightWhite.hex,
  };
  return JSON.stringify(scheme, null, 2) + "\n";
}

// ---------- role palette (generator) ----------
export const ROLES = ["background", "headline", "body", "button", "accent"];
export const METHODS = ["auto", "analogous", "complementary", "triadic", "neutral"];

// Deterministic PRNG for reproducible palettes.
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pickTop = (arr, rand, n = 4) => arr[Math.floor(rand() * Math.min(n, arr.length))];

// Five roles from one anchor. Headline and body must reach 4.5:1 on the background;
// the button must reach 3:1 so it reads as a shape. Locked roles are kept as given.
export function rolePalette(library, anchor, { method = "auto", locked = {}, rand = Math.random } = {}) {
  const byId = new Map(library.map((c) => [c.id, c]));
  const rel = (keys) => keys.flatMap((k) => anchor.relations[k] || []).map((id) => byId.get(id)).filter(Boolean);
  const pools = {
    auto: ["same", "analogous", "complementary", "lighter", "darker"],
    analogous: ["analogous", "same", "lighter", "darker"],
    complementary: ["complementary", "same", "darker"],
    triadic: ["triadic", "same", "darker"],
    neutral: ["neutral", "lighter", "darker", "same"],
  };
  const pool = [anchor, ...rel(pools[method] || pools.auto)];
  const neutralAnchor = anchor.hsl.s < 15;
  const hueClose = (c) => (neutralAnchor ? c.hsl.s : hueDiff(c.hsl.h, anchor.hsl.h));

  const out = {};
  const used = new Set(Object.values(locked).map((c) => c.id));

  if (locked.background) out.background = locked.background;
  else if (anchor.hsl.l >= 86) out.background = anchor;
  else {
    const lights = library.filter((c) => c.hsl.l >= 88).sort((p, q) => hueClose(p) - hueClose(q));
    out.background = pickTop(lights, rand, 5);
  }
  used.add(out.background.id);
  const bg = out.background.hex;

  if (locked.headline) out.headline = locked.headline;
  else {
    const candidates = [...pool, ...library.filter((c) => c.hsl.s >= 25 && hueClose(c) <= 40)]
      .filter((c) => !used.has(c.id) && contrast(c.hex, bg) >= 4.5)
      .sort((p, q) => q.hsl.s - p.hsl.s);
    out.headline = pickTop(candidates, rand, 4) || library.reduce((a, b) => (contrast(a.hex, bg) > contrast(b.hex, bg) ? a : b));
  }
  used.add(out.headline.id);

  if (locked.body) out.body = locked.body;
  else {
    const candidates = library
      .filter((c) => !used.has(c.id) && c.hsl.s < 40 && contrast(c.hex, bg) >= 7)
      .sort((p, q) => hueClose(p) - hueClose(q));
    out.body = pickTop(candidates, rand, 4) || out.headline;
  }
  used.add(out.body.id);

  if (locked.button) out.button = locked.button;
  else if (!used.has(anchor.id) && contrast(anchor.hex, bg) >= 3) out.button = anchor;
  else {
    const candidates = pool.filter((c) => !used.has(c.id) && c.hsl.s >= 35 && contrast(c.hex, bg) >= 3);
    out.button = pickTop(candidates, rand, 3) || out.headline;
  }
  used.add(out.button.id);

  if (locked.accent) out.accent = locked.accent;
  else {
    const candidates = [...pool, ...rel(["complementary", "triadic"])].filter(
      (c) => !used.has(c.id) && c.hsl.s >= 30 && c.hsl.l <= 78 && contrast(c.hex, bg) >= 1.8 && hueDiff(c.hsl.h, out.button.hsl.h) >= 20
    );
    out.accent = pickTop(candidates, rand, 4) || pool.find((c) => !used.has(c.id)) || out.button;
  }
  return out;
}

// ---------- usage pairs ----------
export function pairRelation(a, b) {
  if (a.hsl.s < 15 || b.hsl.s < 15) return "neutral";
  const d = hueDiff(a.hsl.h, b.hsl.h);
  if (d <= 15) return "same";
  if (d <= 50) return "analogous";
  if (d >= 105 && d <= 135) return "triadic";
  if (d >= 150) return "complementary";
  return null;
}

// Background/text pairs across the whole library, kept when the two colors share a
// hue relationship and reach the minimum contrast. Every pair is two named colors.
// At most `perBackground` pairs per background, favoring colorful text.
export function usagePairs(library, minRatio = 4.5, perBackground = 8) {
  const out = [];
  for (const bg of library) {
    const pairs = [];
    for (const fg of library) {
      if (fg.id === bg.id) continue;
      const ratio = contrast(bg.hex, fg.hex);
      if (ratio < minRatio) continue;
      const relation = pairRelation(bg, fg);
      if (relation) pairs.push({ bg, fg, ratio, relation });
    }
    pairs.sort((p, q) => q.fg.hsl.s - p.fg.hsl.s || q.ratio - p.ratio);
    out.push(...pairs.slice(0, perBackground));
  }
  return out;
}
