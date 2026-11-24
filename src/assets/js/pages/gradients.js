// Gradients: color sets per anchor shown as stacked two-color gradients, plus curated pairs.
import { $, $$, t, esc, el, icon, library, byId, colorUrl, paramId, copyText } from "../core.js";
import { anchorPicker } from "../picker.js";
import { FAMILIES } from "../../lib/color.js";

const CURATED = [
  ["Kesar Saffron", "Rani Pink"], ["Turmeric", "Sindoor"], ["Peacock Blue", "Mor Teal"], ["Dawn Pink", "Lavender"],
  ["Mango", "Pomegranate Flower"], ["Ganga Water", "Lotus Pink"], ["Indigo", "Jamun"], ["Paan Leaf", "Lime"],
  ["Night Sky", "Peacock Feather"], ["Sandal Paste", "Terracotta"], ["Gulal Pink", "Holi Magenta", "Jamun"], ["Diya Flame", "Kesar Saffron", "Kumkum"],
];
const SETS = ["tonal", "analogous", "complementary", "triadic", "neutral"];
const PAGE = 18;

// One set = up to four colors with a role label each.
function setFor(c, kind) {
  const rel = (k, n) => (c.relations[k] || []).slice(0, n).map(byId).filter(Boolean);
  let items;
  if (kind === "tonal") items = [[rel("lighter", 1)[0], "light"], [c, "base"], [rel("same", 1)[0], "family"], [rel("darker", 1)[0], "deep"]];
  else if (kind === "analogous") items = [[c, "base"], ...rel("analogous", 3).map((x) => [x, "partner"])];
  else if (kind === "complementary") items = [[c, "base"], ...rel("complementary", 2).map((x) => [x, "partner"]), [rel("same", 1)[0], "family"]];
  else if (kind === "triadic") items = [[c, "base"], ...rel("triadic", 3).map((x) => [x, "partner"])];
  else items = [[c, "base"], ...rel("neutral", 3).map((x) => [x, "partner"])];
  const seen = new Set();
  const out = [];
  for (const [col, role] of items) {
    if (!col || seen.has(col.id)) continue;
    seen.add(col.id);
    out.push({ c: col, role });
  }
  if (kind === "tonal") out.sort((a, b) => b.c.hsl.l - a.c.hsl.l);
  return out.length >= 3 ? out.slice(0, 4) : null;
}

export default async function initGradients(root) {
  const lib = await library();
  const byName = new Map(lib.map((c) => [c.en, c]));
  let anchor = byId(paramId(lib, "029"));
  let kind = SETS.find((k) => setFor(anchor, k)) || "tonal";
  let angle = 135;
  let space = "oklch";
  const F = { q: "", family: "", type: "", limit: PAGE };

  const everything = [];
  for (const c of lib) for (const k of SETS) {
    const items = setFor(c, k);
    if (items) everything.push({ c, kind: k, items });
  }
  let order = everything.slice();

  const picker = anchorPicker(lib, {
    value: anchor.id,
    onChange: (id) => {
      anchor = byId(id);
      if (!setFor(anchor, kind)) kind = SETS.find((k) => setFor(anchor, k)) || kind;
      renderDetail();
    },
  });
  root.appendChild(picker.node);
  root.appendChild(el(`<div>
    <section class="gdetail card" data-detail></section>
    <div class="section"><div class="section-head"><h2>${esc(t("grad.all"))}</h2>
      <button type="button" class="btn btn-ghost" data-random-card>${icon("shuffle")}<span>${esc(t("grad.randomCard"))}</span></button></div>
      <div class="toolbar">
        <label class="field grow"><span class="sr-only">${esc(t("ui.searchColors"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t("ui.searchColors"))}" data-q></label>
        <select class="select" data-type aria-label="${esc(t("grad.allTypes"))}"><option value="">${esc(t("grad.allTypes"))}</option>${SETS.map((k) => `<option value="${k}">${esc(t(`grad.set.${k}`))}</option>`).join("")}</select>
      </div>
      <div class="fchips" style="margin-bottom:12px" data-families>
        <button type="button" class="fchip" data-family="" aria-pressed="true">${esc(t("ui.all"))}</button>
        ${FAMILIES.map((f) => `<button type="button" class="fchip" data-family="${f}" aria-pressed="false"><span class="dot" style="background:${lib.find((c) => c.family === f).hex}"></span>${esc(t(`family.${f}`))}</button>`).join("")}
      </div>
      <p class="count" data-count aria-live="polite"></p>
      <div class="gsets" data-grid></div>
      <p class="empty" data-empty hidden>${esc(t("ui.noResults"))}</p>
      <div class="more"><button type="button" class="btn" data-more hidden>${esc(t("ui.showMore"))}</button></div>
    </div>
    <div class="section"><div class="section-head"><h2>${esc(t("grad.curated"))}</h2></div><div class="gcards" data-curated></div></div>
  </div>`));

  const css = (a, b) => `linear-gradient(${angle}deg${space === "oklch" ? " in oklch" : ""}, ${a.hex}, ${b.hex})`;
  const bands = (items) => items.map((it, i) => [it.c, items[(i + 1) % items.length].c]);
  const stack = (items, cls = "") =>
    `<div class="gstack ${cls}">${bands(items)
      .map(([a, b]) => `<button type="button" style="background:${css(a, b)}" data-copy="background: ${esc(css(a, b))};" aria-label="${esc(t("ui.copy"))} CSS: ${esc(a.en)} → ${esc(b.en)}"></button>`)
      .join("")}</div>`;
  const allCss = (items) => bands(items).map(([a, b]) => `background: ${css(a, b)};`).join("\n");

  function renderDetail() {
    const items = setFor(anchor, kind);
    const pos = (i) => (items.length === 1 ? 0 : Math.round((i / (items.length - 1)) * 100));
    $("[data-detail]", root).innerHTML = `
      <div class="gdetail-head">
        <div><h2>${esc(anchor.en)} · ${esc(t(`grad.set.${kind}`))}</h2><p class="hint">${anchor.hex} · ${esc(t(`family.${anchor.family}`))}</p></div>
        <div class="row">
          <div class="join" role="group" aria-label="${esc(t("grad.angle"))}">${[90, 135, 180].map((a) => `<button type="button" data-angle="${a}" aria-pressed="${a === angle}">${a}°</button>`).join("")}</div>
          <div class="join" role="group" aria-label="${esc(t("grad.space"))}"><button type="button" data-space="oklch" aria-pressed="${space === "oklch"}">OKLCH</button><button type="button" data-space="srgb" aria-pressed="${space === "srgb"}">sRGB</button></div>
        </div>
      </div>
      <div class="tabs" role="tablist" style="margin:0 16px 14px">${SETS.filter((k) => setFor(anchor, k)).map((k) => `<button type="button" class="tab" role="tab" data-kind="${k}" aria-selected="${k === kind}">${esc(t(`grad.set.${k}`))}</button>`).join("")}</div>
      <div class="gdetail-body">
        ${stack(items, "big")}
        <div class="gtable">
          <div class="gtable-head"><span>${esc(t("grad.colorName"))}</span><span>${esc(t("grad.role"))}</span><span>HEX</span><span>${esc(t("grad.position"))}</span></div>
          ${items.map((it, i) => `<div class="gtable-row"><a href="${colorUrl(it.c.id)}"><i style="background:${it.c.hex}"></i>${esc(it.c.en)}</a><span>${esc(t(`grad.r.${it.role}`))}</span><span class="mono">${it.c.hex}</span><span>${pos(i)}%</span></div>`).join("")}
          <div class="row" style="margin-top:14px">
            <a class="btn" href="${colorUrl(anchor.id)}">${esc(t("grad.viewDetails"))}</a>
            <button type="button" class="btn btn-primary" data-copy-all>${icon("copy")}<span>${esc(t("grad.copyAll"))}</span></button>
          </div>
        </div>
      </div>`;
  }

  function filtered() {
    const q = F.q.trim().toLowerCase();
    return order.filter(
      (g) => (!F.family || g.c.family === F.family) && (!F.type || g.kind === F.type) && (!q || g.items.some((it) => it.c.en.toLowerCase().includes(q) || it.c.hex.toLowerCase().includes(q)))
    );
  }

  function renderGrid() {
    const list = filtered();
    $("[data-grid]", root).innerHTML = list
      .slice(0, F.limit)
      .map(
        (g) => `<article class="gset">
          ${stack(g.items)}
          <div class="gset-body">
            <b>${esc(g.c.en)}</b><span class="hint">${esc(t(`grad.set.${g.kind}`))} · ${esc(t(`family.${g.c.family}`))} · No.${g.c.id}</span>
            <div class="gset-chips">${g.items.map((it) => `<span><i style="background:${it.c.hex}"></i>${esc(it.c.en)}</span>`).join("")}</div>
            <div class="row-between"><button type="button" class="btn btn-ghost btn-sm" data-copy="${esc(allCss(g.items))}">${icon("copy")}<span>${esc(t("grad.copyAll"))}</span></button>
              <button type="button" class="btn btn-ghost btn-sm" data-open="${g.c.id}:${g.kind}"><span>${esc(t("grad.details"))}</span>${icon("chevronRight")}</button></div>
          </div>
        </article>`
      )
      .join("");
    $("[data-count]", root).textContent = t("ui.showing", { count: Math.min(F.limit, list.length), total: list.length });
    $("[data-empty]", root).hidden = list.length > 0;
    $("[data-more]", root).hidden = list.length <= F.limit;
  }

  function renderCurated() {
    $("[data-curated]", root).innerHTML = CURATED.map((names) => names.map((n) => byName.get(n)).filter(Boolean))
      .filter((s) => s.length >= 2)
      .map((stops) => {
        const value = `linear-gradient(${angle}deg${space === "oklch" ? " in oklch" : ""}, ${stops.map((c) => c.hex).join(", ")})`;
        return `<article class="gcard">
          <button type="button" class="gcard-preview" style="background:${value}" data-copy="background: ${esc(value)};" aria-label="${esc(t("ui.copy"))} CSS: ${esc(stops.map((c) => c.en).join(", "))}"></button>
          <div class="gcard-foot"><div style="min-width:0"><div>${esc(stops.map((c) => c.en).join(" → "))}</div><div class="mono">${stops.map((c) => c.hex).join(" ")}</div></div>
          <button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="background: ${esc(value)};" aria-label="${esc(t("ui.copy"))} CSS">${icon("copy")}</button></div>
        </article>`;
      })
      .join("");
  }

  function renderAll() {
    renderDetail();
    renderGrid();
    renderCurated();
  }

  root.addEventListener("click", (e) => {
    const a = e.target.closest("[data-angle]");
    if (a) {
      angle = Number(a.dataset.angle);
      return renderAll();
    }
    const s = e.target.closest("[data-space]");
    if (s) {
      space = s.dataset.space;
      return renderAll();
    }
    const k = e.target.closest("[data-kind]");
    if (k) {
      kind = k.dataset.kind;
      return renderDetail();
    }
    if (e.target.closest("[data-copy-all]")) return copyText(allCss(setFor(anchor, kind)));
    const fam = e.target.closest("[data-family]");
    if (fam) {
      F.family = fam.dataset.family;
      F.limit = PAGE;
      for (const b of $$("[data-family]", root)) b.setAttribute("aria-pressed", String(b === fam));
      return renderGrid();
    }
    if (e.target.closest("[data-more]")) {
      F.limit += PAGE * 2;
      return renderGrid();
    }
    if (e.target.closest("[data-random-card]")) {
      order = everything.slice().sort(() => Math.random() - 0.5);
      F.limit = PAGE;
      return renderGrid();
    }
    const open = e.target.closest("[data-open]");
    if (open) {
      const [id, kd] = open.dataset.open.split(":");
      kind = kd;
      picker.select(id);
      $("[data-detail]", root).scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  $("[data-q]", root).addEventListener("input", (e) => ((F.q = e.target.value), (F.limit = PAGE), renderGrid()));
  $("[data-type]", root).addEventListener("change", (e) => ((F.type = e.target.value), (F.limit = PAGE), renderGrid()));

  renderAll();
}
