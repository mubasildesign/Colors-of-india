// Shared client helpers: strings, library, copy, saved items, color search, URL state.
import { icon, iconPair } from "../lib/icons.js";
import { contrast, bestTextOn, deltaE, rgbToLab, hexToRgb } from "../lib/color.js";

export { icon, iconPair, contrast, bestTextOn };

export const I18N = JSON.parse(document.getElementById("i18n")?.textContent || "{}");
export const LOCALE = document.documentElement.lang || "en";
export const t = (key, vars = {}) =>
  (I18N[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ""));

export const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const pageUrl = (slug) => `/${LOCALE}/${slug}`;
export const colorUrl = (id) => `/${LOCALE}/colors/${id}/`;
export const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function el(html) {
  const tpl = document.createElement("template");
  tpl.innerHTML = html.trim();
  return tpl.content.firstElementChild;
}

// ---------- library ----------
let LIB = null;
let BY_ID = null;
export async function library() {
  if (!LIB) {
    const res = await fetch("/data/colors.json");
    LIB = await res.json();
    BY_ID = new Map(LIB.map((c) => [c.id, c]));
  }
  return LIB;
}
export const byId = (id) => BY_ID?.get(id);

export const fmt = {
  hex: (c) => c.hex,
  rgb: (c) => `rgb(${c.rgb.join(", ")})`,
  hsl: (c) => `hsl(${c.hsl.h}, ${c.hsl.s}%, ${c.hsl.l}%)`,
  cmyk: (c) => `cmyk(${c.cmyk.c}%, ${c.cmyk.m}%, ${c.cmyk.y}%, ${c.cmyk.k}%)`,
};

export function ratioBadge(r, { graphic = false } = {}) {
  if (graphic) {
    const ok = r >= 3;
    return `<span class="badge ${ok ? "badge-ok" : "badge-warn"}">${r.toFixed(1)}:1</span>`;
  }
  const label = r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "—";
  const cls = r >= 4.5 ? "badge-ok" : r >= 3 ? "badge-warn" : "badge-bad";
  return `<span class="badge ${cls}">${label} ${r.toFixed(1)}:1</span>`;
}

// Search by name, traditional name, number or HEX. A full HEX also returns the nearest colors.
export function matchColors(lib, query, limit = 8) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hex = q.replace(/^#/, "");
  if (/^[0-9a-f]{6}$/.test(hex)) {
    const lab = rgbToLab(hexToRgb(`#${hex}`));
    return [...lib].sort((a, b) => deltaE(lab, rgbToLab(a.rgb)) - deltaE(lab, rgbToLab(b.rgb))).slice(0, limit);
  }
  const scored = [];
  for (const c of lib) {
    const name = c.en.toLowerCase(), tr = c.tr.toLowerCase();
    let score = -1;
    if (c.id === q.padStart(3, "0") && /^\d+$/.test(q)) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 2;
    else if (tr.startsWith(q) || c.hex.toLowerCase().startsWith(`#${hex}`)) score = 3;
    else if (name.includes(q) || tr.includes(q)) score = 4;
    if (score >= 0) scored.push([score, c]);
  }
  return scored.sort((a, b) => a[0] - b[0] || a[1].en.localeCompare(b[1].en)).slice(0, limit).map((x) => x[1]);
}

// ---------- copy + toast ----------
export function toast(message) {
  let node = $(".toast");
  if (!node) {
    node = document.createElement("div");
    node.className = "toast";
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    document.body.appendChild(node);
  }
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(node._timer);
  node._timer = setTimeout(() => node.classList.remove("show"), 1600);
}

// Gulal burst: a small puff of Holi colors where the copy happened.
const GULAL = ["#D42A1F", "#E7A81E", "#0F5F7C", "#2F7D4B", "#D5307E", "#7C3DB0"];
export function burst(x, y) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || x === undefined) return;
  const wrap = document.createElement("div");
  wrap.className = "gulal";
  wrap.style.left = `${x}px`;
  wrap.style.top = `${y}px`;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + Math.random() * 0.5;
    const d = 18 + Math.random() * 20;
    const p = document.createElement("i");
    p.style.cssText = `--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;background:${GULAL[i % GULAL.length]};--s:${3 + Math.random() * 3}px`;
    wrap.appendChild(p);
  }
  document.body.appendChild(wrap);
  setTimeout(() => wrap.remove(), 800);
}

export async function copyText(text, message = t("ui.copied")) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  toast(message);
}

export function download(filename, text, type = "text/plain") {
  const blob = new Blob([text], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 0);
}

// ---------- storage ----------
export const store = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

export const favs = {
  all: () => store.get("itc.favs", []),
  has: (id) => favs.all().includes(id),
  toggle(id) {
    const list = favs.all();
    const i = list.indexOf(id);
    if (i >= 0) list.splice(i, 1);
    else list.unshift(id);
    store.set("itc.favs", list);
    syncFavs();
    toast(i >= 0 ? t("ui.removed") : t("ui.savedToast"));
    return i < 0;
  },
};

export const palettes = {
  all: () => store.get("itc.palettes", []),
  add(ids, label) {
    const list = palettes.all();
    list.unshift({ id: Date.now().toString(36), label, ids, created: new Date().toISOString() });
    store.set("itc.palettes", list.slice(0, 100));
    toast(t("ui.savedToast"));
  },
  remove(id) {
    store.set("itc.palettes", palettes.all().filter((p) => p.id !== id));
  },
  clear() {
    store.set("itc.palettes", []);
  },
};

export function syncFavs(root = document) {
  const set = new Set(favs.all());
  for (const b of $$("[data-fav]", root)) {
    const on = set.has(b.dataset.fav);
    b.setAttribute("aria-pressed", String(on));
    b.classList.add("fav");
    b.classList.toggle("is-on", on);
  }
}

// ---------- URL state ----------
export function paramId(lib, fallbackId) {
  const id = new URLSearchParams(location.search).get("c");
  return id && lib.some((c) => c.id === id) ? id : fallbackId;
}
export function setParam(key, value) {
  const u = new URL(location.href);
  if (value === null || value === undefined || value === "") u.searchParams.delete(key);
  else u.searchParams.set(key, value);
  history.replaceState(null, "", u);
}

export const randomColor = (lib, exceptId) => {
  let c;
  do c = lib[Math.floor(Math.random() * lib.length)];
  while (lib.length > 1 && c.id === exceptId);
  return c;
};

export function copyButton(value, label = t("ui.copy"), cls = "btn btn-ghost btn-sm btn-icon") {
  return `<button type="button" class="${cls}" data-copy="${esc(value)}" aria-label="${esc(label)}" title="${esc(label)}">${icon("copy")}</button>`;
}

// Delegated actions available on every page.
export function initGlobalActions() {
  document.addEventListener("click", (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy) {
      e.preventDefault();
      if (e.clientX || e.clientY) burst(e.clientX, e.clientY);
      copyText(copy.dataset.copy);
      return;
    }
    const fav = e.target.closest("[data-fav]");
    if (fav) {
      e.preventDefault();
      favs.toggle(fav.dataset.fav);
      fav.classList.remove("pop");
      void fav.offsetWidth;
      fav.classList.add("pop");
    }
  });
  syncFavs();
}
