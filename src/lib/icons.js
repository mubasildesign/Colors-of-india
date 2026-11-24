// Icons for the build and the browser.
// UI and sidebar icons: Phosphor (MIT), regular and fill weights on a 256px grid.
// India motifs Phosphor does not have (diya, paisley) are drawn here in the same grid and stroke.
import { PHOSPHOR } from "./icon-data.js";

const stroke = (inner) => `<g fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
const solid = (inner) => `<g fill="currentColor" stroke="currentColor" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;

// Diya: a clay lamp with a flame.
const DIYA = '<path d="M28 136h200c0 50-44 80-100 80S28 186 28 136z"/><path d="M128 112c-30-26-22-62 0-88 22 26 30 62 0 88z"/>';
// Paisley (kairi / ambi): the mango motif woven into saris.
const PAISLEY = '<path d="M172 32c44 26 52 84 20 128-28 38-86 58-120 26-30-28-18-74 14-84 30-8 52 14 40 38-8 14-30 14-34 0"/>';

export const ICONS = {
  ...Object.fromEntries(Object.entries(PHOSPHOR).map(([k, v]) => [k, v])),
  diya: { regular: stroke(DIYA), fill: solid(DIYA) },
  paisley: { regular: stroke(PAISLEY), fill: solid(PAISLEY) },
};

const svg = (inner, cls) =>
  `<svg class="i${cls ? ` ${cls}` : ""}" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">${inner}</svg>`;

export function icon(name, cls = "", weight = "regular") {
  const set = ICONS[name];
  return set ? svg(set[weight] || set.regular, cls) : "";
}

// Both weights, so CSS can swap them (active nav item, saved heart).
export function iconPair(name, cls = "") {
  return icon(name, `i-reg ${cls}`.trim()) + icon(name, `i-fill ${cls}`.trim(), "fill");
}

// Rangoli lozenge in four dye colors: sindoor, turmeric, peacock, paan.
export function brandMark(size = 22) {
  return `<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 0l10 10H10z" fill="#D42A1F"/><path d="M20 10 10 20V10z" fill="#E7A81E"/><path d="M10 20 0 10h10z" fill="#0F5F7C"/><path d="M0 10 10 0v10z" fill="#2F7D4B"/></svg>`;
}
