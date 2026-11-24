// Shared color math. Pure ES module: used by the Node build and by the browser.
// Relations are computed from the library itself, so every relation points to a
// real entry (provenance-first). Nothing here invents a color.

export const FAMILIES = ["red", "pink", "orange", "yellow", "brown", "green", "blue", "purple", "neutral"];

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

export function rgbToHex(rgb) {
  return "#" + rgb.map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0")).join("").toUpperCase();
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function rgbToCmyk([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 1) return { c: 0, m: 0, y: 0, k: 100 };
  const c = (1 - r - k) / (1 - k), m = (1 - g - k) / (1 - k), y = (1 - b - k) / (1 - k);
  return { c: Math.round(c * 100), m: Math.round(m * 100), y: Math.round(y * 100), k: Math.round(k * 100) };
}

function srgbToLinear(c) {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(x) {
  x = clamp(x, 0, 1);
  return (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055) * 255;
}

export function rgbToLab(rgb) {
  const [R, G, B] = rgb.map(srgbToLinear);
  const X = (0.4124564 * R + 0.3575761 * G + 0.1804375 * B) / 0.95047;
  const Y = 0.2126729 * R + 0.7151522 * G + 0.072175 * B;
  const Z = (0.0193339 * R + 0.119192 * G + 0.9503041 * B) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

export function deltaE(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

export function rgbToOklab(rgb) {
  const [R, G, B] = rgb.map(srgbToLinear);
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function oklabToOklch([L, a, b]) {
  return [L, Math.hypot(a, b), ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360];
}

export function oklchToOklab([L, C, H]) {
  const rad = (H * Math.PI) / 180;
  return [L, C * Math.cos(rad), C * Math.sin(rad)];
}

// Gamut-fit: reduce chroma until the color lands inside sRGB, then return hex.
export function fitOklchToHex(L, C, H) {
  let c = C;
  for (let i = 0; i < 40; i++) {
    const rgb = oklabToRgb(oklchToOklab([L, c, H]));
    if (rgb.every((v) => v >= -0.5 && v <= 255.5)) return rgbToHex(rgb);
    c *= 0.94;
  }
  return rgbToHex(oklabToRgb(oklchToOklab([L, 0, H])));
}

export function oklchCss(hex) {
  const [L, C, H] = oklabToOklch(rgbToOklab(hexToRgb(hex)));
  return `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`;
}

export function luminance(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(hexA, hexB) {
  const la = luminance(hexToRgb(hexA)), lb = luminance(hexToRgb(hexB));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// Pick white or ink text, whichever reads better. If neither reaches 4.5:1
// (mid-tones), fall back to pure black, which always clears it on these colors.
export function bestTextOn(hex) {
  const w = contrast(hex, "#FFFFFF"), k = contrast(hex, "#111111");
  if (Math.max(w, k) >= 4.5) return w >= k ? "#FFFFFF" : "#111111";
  return "#000000";
}

const hueDiff = (a, b) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

// Build library items with derived values and relation id lists.
export function enrichLibrary(source) {
  const items = source.map((c, i) => {
    const rgb = hexToRgb(c.hex);
    return {
      ...c,
      id: String(i + 1).padStart(3, "0"),
      rgb,
      hsl: rgbToHsl(rgb),
      cmyk: rgbToCmyk(rgb),
      lab: rgbToLab(rgb),
      oklch: oklabToOklch(rgbToOklab(rgb)),
    };
  });

  const isNeutral = (x) => x.hsl.s < 15;
  // Hue-based harmonies only use colors with real chroma; pale tints have unreliable hue.
  const isChromatic = (x) => x.hsl.s >= 30 && x.hsl.l >= 15 && x.hsl.l <= 90;
  const near = (x, pool, excludeIds, n) =>
    pool
      .filter((o) => o.id !== x.id && !excludeIds.has(o.id))
      .sort((p, q) => deltaE(x.lab, p.lab) - deltaE(x.lab, q.lab))
      .slice(0, n);

  const pickIds = (x, n, filter) => {
    const picked = items.filter((o) => o.id !== x.id && filter(o));
    picked.sort((p, q) => deltaE(x.lab, p.lab) - deltaE(x.lab, q.lab));
    const out = picked.slice(0, n);
    const ids = new Set(out.map((o) => o.id));
    ids.add(x.id);
    // Fill to n with nearest overall, so no relation list is empty.
    for (const o of near(x, items, ids, n - out.length)) out.push(o);
    return out.slice(0, n).map((o) => o.id);
  };

  for (const x of items) {
    const sameHue = (o, max) => (isNeutral(x) || isNeutral(o)) ? isNeutral(x) === isNeutral(o) : hueDiff(x.hsl.h, o.hsl.h) <= max;
    x.relations = {
      same: pickIds(x, 4, (o) => o.family === x.family),
      analogous: pickIds(x, 4, (o) => isChromatic(x) && isChromatic(o) && hueDiff(x.hsl.h, o.hsl.h) >= 12 && hueDiff(x.hsl.h, o.hsl.h) <= 50),
      complementary: pickIds(x, 3, (o) => isChromatic(x) && isChromatic(o) && hueDiff(x.hsl.h, o.hsl.h) >= 150),
      triadic: pickIds(x, 4, (o) => isChromatic(x) && isChromatic(o) && hueDiff(x.hsl.h, o.hsl.h) >= 105 && hueDiff(x.hsl.h, o.hsl.h) <= 135),
      lighter: pickIds(x, 3, (o) => sameHue(o, 20) && o.hsl.l > x.hsl.l + 6),
      darker: pickIds(x, 3, (o) => sameHue(o, 20) && o.hsl.l < x.hsl.l - 6),
      neutral: pickIds(x, 4, (o) => isNeutral(o)),
    };
  }
  return items;
}

export function gradientCss(a, b, angle = 90) {
  return `linear-gradient(${angle}deg, ${a}, ${b})`;
}
