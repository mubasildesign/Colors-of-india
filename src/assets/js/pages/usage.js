// Usage cards: background/text pairs from the library, filtered by hue, use case and contrast.
import { $, $$, t, esc, el, icon, library, colorUrl, ratioBadge, palettes } from "../core.js";
import { usagePairs } from "../../lib/palette.js";
import { FAMILIES } from "../../lib/color.js";

const PAGE = 24;
const RELATIONS = ["", "complementary", "analogous", "triadic", "same", "neutral"];
const CASE_MIN = { "": 4.5, body: 7, heading: 4.5, button: 4.5, caption: 7 };

export default async function initUsage(root) {
  const lib = await library();
  const cache = {};
  // Interleave backgrounds so the first page is not eight cards on the same color.
  const interleave = (list) => {
    const rank = new Map();
    const hue = (c) => (c.hsl.s < 15 ? 400 : (c.hsl.h * 37) % 360);
    return list
      .map((p) => {
        const r = rank.get(p.bg.id) || 0;
        rank.set(p.bg.id, r + 1);
        return { ...p, rank: r };
      })
      .sort((a, b) => a.rank - b.rank || hue(a.bg) - hue(b.bg));
  };
  const pairsFor = (min) => (cache[min] ??= interleave(usagePairs(lib, min, 8)));
  const S = { q: "", family: "", useCase: "", style: "text", bias: 0, low: false, relation: "", limit: PAGE };
  const swapped = new Set();

  root.appendChild(el(`<div>
    <div class="toolbar">
      <label class="field grow"><span class="sr-only">${esc(t("ui.searchColors"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t("usage.placeholder"))}" data-q></label>
      <select class="select" data-family aria-label="${esc(t("usage.bgFamily"))}">
        <option value="">${esc(t("usage.allHues"))}</option>
        ${FAMILIES.map((f) => `<option value="${f}">${esc(t(`family.${f}`))}</option>`).join("")}
      </select>
      <select class="select" data-case aria-label="${esc(t("usage.useCase"))}">
        <option value="">${esc(t("usage.useCase"))}</option>
        ${["body", "heading", "button", "caption"].map((k) => `<option value="${k}">${esc(t(`usage.case.${k}`))}</option>`).join("")}
      </select>
      <select class="select" data-style aria-label="${esc(t("usage.style"))}">
        ${["text", "block", "outline"].map((k) => `<option value="${k}">${esc(t("usage.style"))}: ${esc(t(`usage.style.${k}`))}</option>`).join("")}
      </select>
      <label class="slider"><span class="bar-note">${esc(t("usage.biasDark"))}</span><input type="range" min="-2" max="2" step="1" value="0" data-bias aria-label="${esc(t("usage.bias"))}"><span class="bar-note">${esc(t("usage.biasLight"))}</span></label>
    </div>
    <div class="toolbar">
      <label class="toggle-row"><input class="toggle" type="checkbox" data-low><span>${esc(t("usage.lowContrast"))}</span></label>
      <span class="spacer"></span>
      <div class="fchips" data-rels>
        ${RELATIONS.map((r) => `<button type="button" class="fchip" data-rel="${r}" aria-pressed="${r === ""}">${esc(r ? t(`rel.${r}`) : t("ui.all"))}</button>`).join("")}
      </div>
    </div>
    <p class="count" data-count aria-live="polite"></p>
    <div class="ucards" data-cards></div>
    <p class="empty" data-empty hidden>${esc(t("ui.noResults"))}</p>
    <div class="more"><button type="button" class="btn" data-more hidden>${esc(t("ui.showMore"))}</button></div>
  </div>`));

  const cards = $("[data-cards]", root);
  const minNow = () => (S.low ? Math.min(CASE_MIN[S.useCase], 3) : CASE_MIN[S.useCase]);
  const hits = (c, term) => {
    if (term === "dark") return c.hsl.l < 40;
    if (term === "light") return c.hsl.l >= 70;
    if (term === "cool") return ["blue", "green", "purple"].includes(c.family);
    if (term === "warm") return ["red", "orange", "yellow", "pink", "brown"].includes(c.family);
    return `${c.en} ${c.hex} ${c.family}`.toLowerCase().includes(term);
  };

  function filtered() {
    const parts = S.q.toLowerCase().split("&").map((x) => x.trim()).filter(Boolean);
    let list = pairsFor(minNow()).filter((p) => {
      if (S.relation && p.relation !== S.relation) return false;
      if (S.family && p.bg.family !== S.family) return false;
      if (parts.length >= 2) return (hits(p.bg, parts[0]) && hits(p.fg, parts[1])) || (hits(p.fg, parts[0]) && hits(p.bg, parts[1]));
      if (parts.length === 1) return hits(p.bg, parts[0]) || hits(p.fg, parts[0]);
      return true;
    });
    if (S.bias !== 0) list = list.slice().sort((a, b) => (a.bg.hsl.l - b.bg.hsl.l) * Math.sign(S.bias));
    return list;
  }

  function preview(bg, fg, ratio) {
    const sample = t("usage.sample");
    if (S.style === "block")
      return `<div class="ucard-preview" style="background:${bg.hex};color:${fg.hex}"><div class="ublock" style="background:${fg.hex};color:${bg.hex}"><strong>${esc(fg.en)}</strong><span>${esc(t("usage.on"))} ${esc(bg.en)}</span></div><p>${esc(sample)}</p></div>`;
    if (S.style === "outline")
      return `<div class="ucard-preview" style="background:${bg.hex};color:${fg.hex}"><div class="ublock" style="border:2px solid ${fg.hex}"><strong>${esc(fg.en)}</strong><span>${esc(t("usage.on"))} ${esc(bg.en)}</span></div><p>${esc(sample)}</p></div>`;
    return `<div class="ucard-preview" style="background:${bg.hex};color:${fg.hex}"><strong>${esc(fg.en)}</strong><span>${esc(t("usage.on"))} ${esc(bg.en)}</span><p>${esc(sample)}</p></div>`;
  }

  function render() {
    const list = filtered();
    cards.innerHTML = list
      .slice(0, S.limit)
      .map((p) => {
        const key = `${p.bg.id}-${p.fg.id}`;
        const flip = swapped.has(key);
        const bg = flip ? p.fg : p.bg;
        const fg = flip ? p.bg : p.fg;
        const css = `background: ${bg.hex}; /* ${bg.en} */\ncolor: ${fg.hex}; /* ${fg.en} */`;
        return `<article class="ucard">
          ${preview(bg, fg, p.ratio)}
          <div class="ucard-foot">
            <div class="row-between"><span class="names"><a href="${colorUrl(fg.id)}">${esc(fg.en)}</a> &amp; <a href="${colorUrl(bg.id)}">${esc(bg.en)}</a></span>${ratioBadge(p.ratio)}</div>
            <div class="row-between"><span class="mono muted">${esc(t("usage.background"))} ${bg.hex} · ${esc(t("usage.text"))} ${fg.hex}</span></div>
            <div class="row-between"><span class="hint">${esc(t("usage.harmony"))}: ${esc(t(`rel.${p.relation}`))}</span>
              <span class="row">
                <button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="${esc(css)}" aria-label="${esc(t("ui.copy"))} CSS" title="${esc(t("ui.copy"))} CSS">${icon("copy")}</button>
                <button type="button" class="btn btn-ghost btn-sm btn-icon" data-swap="${key}" aria-label="${esc(t("usage.swap"))}" title="${esc(t("usage.swap"))}">${icon("swap")}</button>
                <button type="button" class="btn btn-ghost btn-sm btn-icon" data-save-pair="${bg.id},${fg.id}" data-label="${esc(fg.en)} &amp; ${esc(bg.en)}" aria-label="${esc(t("ui.save"))}" title="${esc(t("ui.save"))}">${icon("heart")}</button>
                <a class="btn btn-ghost btn-sm btn-icon" href="${colorUrl(fg.id)}" aria-label="${esc(t("usage.open"))}" title="${esc(t("usage.open"))}">${icon("arrowUpRight")}</a>
              </span></div>
          </div>
        </article>`;
      })
      .join("");
    let note = t("ui.showing", { count: Math.min(S.limit, list.length), total: list.length });
    if (!S.low && minNow() > 3) {
      const hidden = pairsFor(3).length - pairsFor(minNow()).length;
      if (hidden > 0) note += ` · ${t("usage.hidden", { count: hidden.toLocaleString(), min: minNow() })}`;
    }
    $("[data-count]", root).textContent = note;
    $("[data-empty]", root).hidden = list.length > 0;
    $("[data-more]", root).hidden = list.length <= S.limit;
  }

  const reset = (patch) => {
    Object.assign(S, patch, { limit: PAGE });
    render();
  };
  root.addEventListener("click", (e) => {
    const r = e.target.closest("[data-rel]");
    if (r) {
      for (const b of $$("[data-rel]", root)) b.setAttribute("aria-pressed", String(b === r));
      return reset({ relation: r.dataset.rel });
    }
    if (e.target.closest("[data-more]")) {
      S.limit += PAGE * 2;
      return render();
    }
    const sw = e.target.closest("[data-swap]");
    if (sw) {
      const k = sw.dataset.swap;
      swapped.has(k) ? swapped.delete(k) : swapped.add(k);
      return render();
    }
    const sv = e.target.closest("[data-save-pair]");
    if (sv) palettes.add(sv.dataset.savePair.split(","), sv.dataset.label.replace(/&amp;/g, "&"));
  });
  $("[data-q]", root).addEventListener("input", (e) => reset({ q: e.target.value }));
  $("[data-family]", root).addEventListener("change", (e) => reset({ family: e.target.value }));
  $("[data-case]", root).addEventListener("change", (e) => reset({ useCase: e.target.value }));
  $("[data-style]", root).addEventListener("change", (e) => reset({ style: e.target.value }));
  $("[data-bias]", root).addEventListener("input", (e) => reset({ bias: Number(e.target.value) }));
  $("[data-low]", root).addEventListener("change", (e) => reset({ low: e.target.checked }));

  render();
}
