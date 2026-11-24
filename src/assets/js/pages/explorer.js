// Color explorer: large preview, values, pairs, family filter and a sortable spectrum.
import { $, t, esc, el, icon, iconPair, library, byId, fmt, colorUrl, paramId, setParam, randomColor, copyButton, syncFavs, bestTextOn } from "../core.js";
import { FAMILIES } from "../../lib/color.js";
import { oklchOf } from "../../lib/palette.js";

const PAIR_KEYS = ["complementary", "analogous", "triadic", "same", "lighter", "darker", "neutral"];

export default async function initExplorer(root) {
  const lib = await library();
  let current = byId(paramId(lib, "044"));
  let family = "";
  let sort = "hue";

  const sorters = {
    hue: (a, b) => (a.hsl.s < 10) - (b.hsl.s < 10) || (a.hsl.s < 10 ? a.hsl.l - b.hsl.l : a.hsl.h - b.hsl.h || a.hsl.l - b.hsl.l),
    light: (a, b) => b.hsl.l - a.hsl.l,
    sat: (a, b) => b.hsl.s - a.hsl.s,
    no: (a, b) => a.id.localeCompare(b.id),
  };

  root.appendChild(el(`<div>
    <div class="toolbar">
      <div class="fchips" data-families>
        <button type="button" class="fchip" data-family="" aria-pressed="true">${esc(t("ui.allFamilies"))}</button>
        ${FAMILIES.map((f) => `<button type="button" class="fchip" data-family="${f}" aria-pressed="false"><span class="dot" style="background:${lib.find((c) => c.family === f).hex}"></span>${esc(t(`family.${f}`))}</button>`).join("")}
      </div>
      <span class="spacer"></span>
      <label class="row"><span class="sr-only">${esc(t("ui.sort"))}</span>
        <select class="select" data-sort>
          <option value="hue">${esc(t("sort.hue"))}</option>
          <option value="light">${esc(t("sort.light"))}</option>
          <option value="sat">${esc(t("sort.sat"))}</option>
          <option value="no">${esc(t("sort.no"))}</option>
        </select>
      </label>
    </div>
    <div class="tool">
      <div class="stack">
        <div data-hero></div>
        <div class="stepper">
          <button type="button" class="btn btn-icon" data-step="-1" aria-label="${esc(t("ui.prev"))}">${icon("chevronLeft")}</button>
          <button type="button" class="btn" data-random>${icon("shuffle")}<span>${esc(t("ui.random"))}</span></button>
          <button type="button" class="btn btn-icon" data-step="1" aria-label="${esc(t("ui.next"))}">${icon("chevronRight")}</button>
        </div>
        <div class="card" style="padding:14px"><div class="spectrum" data-spectrum role="group" aria-label="${esc(t("nav.explorer"))}"></div></div>
      </div>
      <aside class="tool-side" data-side></aside>
    </div>
  </div>`));

  const hero = $("[data-hero]", root);
  const side = $("[data-side]", root);
  const spectrum = $("[data-spectrum]", root);

  const visible = () => lib.filter((c) => !family || c.family === family).sort(sorters[sort]);

  function renderSpectrum() {
    spectrum.innerHTML = visible()
      .map((c) => `<button type="button" data-id="${c.id}" style="background:${c.hex}" aria-pressed="${c.id === current.id}" aria-label="${esc(c.en)}" title="${esc(c.en)} ${c.hex}"></button>`)
      .join("");
  }

  function renderCurrent() {
    const c = current;
    const ink = bestTextOn(c.hex);
    hero.innerHTML = `<div class="hero-swatch" style="background:${c.hex};color:${ink}">
      <span class="hero-no">No. ${c.id} · ${esc(t(`family.${c.family}`))}</span>
      <div><h2 class="hero-name">${esc(c.en)}</h2><p class="hero-sub">${esc(c.tr)} · ${c.hex}</p></div>
    </div>`;
    const values = [["HEX", fmt.hex(c)], ["RGB", fmt.rgb(c)], ["HSL", fmt.hsl(c)], ["CMYK", fmt.cmyk(c)], ["OKLCH", oklchOf(c.hex)]]
      .map(([k, v]) => `<div class="kv"><span class="kv-label">${k}</span><span class="kv-value"><span class="mono">${esc(v)}</span>${copyButton(v, `${t("ui.copy")} ${k}`)}</span></div>`)
      .join("");
    const seen = new Set([c.id]);
    const pairs = [];
    for (const key of PAIR_KEYS) {
      for (const id of c.relations[key] || []) {
        if (seen.has(id) || pairs.length >= 6) continue;
        seen.add(id);
        pairs.push({ o: byId(id), key });
      }
    }
    side.innerHTML = `
      <div class="row">
        <button type="button" class="btn" data-fav="${c.id}">${iconPair("heart")}<span>${esc(t("ui.save"))}</span></button>
        <a class="btn" href="${colorUrl(c.id)}">${esc(t("ui.details"))}${icon("arrowUpRight")}</a>
      </div>
      <div class="card"><div class="card-head"><h2>${esc(t("detail.values"))}</h2></div>${values}</div>
      <div class="card"><div class="card-head"><h2>${esc(t("detail.pairs"))}</h2></div>
        <ul class="pair-list">${pairs.map(({ o, key }) => `<li><a href="?c=${o.id}" data-id="${o.id}"><span class="sw" style="background:${o.hex}"></span><span class="pl-text"><b>${esc(o.en)}</b><span>${esc(t(`rel.${key}`))} · ${o.hex}</span></span></a></li>`).join("")}</ul>
      </div>`;
    syncFavs(side);
    for (const b of spectrum.children) b.setAttribute("aria-pressed", String(b.dataset.id === c.id));
  }

  function select(id) {
    current = byId(id);
    setParam("c", id);
    renderCurrent();
  }

  root.addEventListener("click", (e) => {
    const f = e.target.closest("[data-family]");
    if (f) {
      family = f.dataset.family;
      for (const b of root.querySelectorAll("[data-family]")) b.setAttribute("aria-pressed", String(b === f));
      renderSpectrum();
      const list = visible();
      if (list.length && !list.includes(current)) select(list[0].id);
      return;
    }
    const sw = e.target.closest("[data-spectrum] button, .pair-list a[data-id]");
    if (sw) {
      e.preventDefault();
      select(sw.dataset.id);
      return;
    }
    const step = e.target.closest("[data-step]");
    if (step) {
      const list = visible();
      const i = list.indexOf(current);
      select(list[(i + Number(step.dataset.step) + list.length) % list.length].id);
    }
    if (e.target.closest("[data-random]")) {
      const list = visible();
      select(randomColor(list.length ? list : lib, current.id).id);
    }
  });
  $("[data-sort]", root).addEventListener("change", (e) => {
    sort = e.target.value;
    renderSpectrum();
  });
  document.addEventListener("keydown", (e) => {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      const list = visible();
      const i = list.indexOf(current);
      select(list[(i + (e.key === "ArrowRight" ? 1 : -1) + list.length) % list.length].id);
    }
  });

  renderSpectrum();
  renderCurrent();
}
