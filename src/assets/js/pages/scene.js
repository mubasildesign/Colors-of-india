// Scene preview: one anchor -> five roles -> web, slide, app, cover, poster, brand and social mocks.
import { $, $$, t, esc, el, icon, iconPair, library, byId, colorUrl, pageUrl, paramId, setParam, palettes, copyText, bestTextOn, contrast, fmt } from "../core.js";
import { anchorPicker } from "../picker.js";
import { ROLES, rolePalette, mulberry32 } from "../../lib/palette.js";

const SCENES = ["web", "slide", "mobile", "cover", "poster", "brand", "social"];
const WEIGHT = { background: 60, headline: 20, body: 12, button: 6, accent: 2 };
const MODES = { safe: "analogous", bold: "triadic", refined: "neutral" };

const mock = (cls, p, inner, extra = "") => `<div class="mock ${cls}" style="background:${p.background.hex};color:${p.body.hex};${extra}"><div class="mock-in">${inner}</div></div>`;

function mockWeb(p) {
  const ink = bestTextOn(p.button.hex);
  return mock("mock-web", p, `
    <div class="mock-nav"><span class="logo" style="color:${p.headline.hex}"><i style="background:${p.button.hex}"></i>Kanchi Looms</span><nav><span>Sarees</span><span>Weavers</span><span>Journal</span></nav></div>
    <div class="mock-hero">
      <div>
        <div class="mock-eyebrow" style="color:${p.headline.hex}">New season</div>
        <div class="mock-title" style="color:${p.headline.hex}">Handwoven silk from Kanchipuram</div>
        <div class="mock-body">Pure mulberry silk and real zari, woven by 40 families in Tamil Nadu.</div>
        <span class="mock-cta" style="background:${p.button.hex};color:${ink}">Shop the collection</span>
      </div>
      <div class="mock-art" style="background:${p.accent.hex};color:${bestTextOn(p.accent.hex)}">K</div>
    </div>`);
}

function mockSlide(p) {
  return `<div class="mock mock-slide" style="background:${p.headline.hex};color:${p.background.hex}"><div class="mock-in">
    <div>
      <div class="mock-eyebrow" style="opacity:.8">Q3 review</div>
      <div class="mock-title">Monsoon orders up 38%</div>
      <div class="mock-body" style="opacity:.85">Repeat buyers in Pune and Kochi drove most of the growth.</div>
    </div>
    <div class="num" style="background:${p.accent.hex};color:${bestTextOn(p.accent.hex)}">38%</div>
    <div class="foot"><span>Sales offsite · Bengaluru</span><span>04</span></div>
  </div></div>`;
}

function mockMobile(p) {
  const ink = bestTextOn(p.button.hex);
  const row = (a, b) => `<div class="rowx" style="border-color:color-mix(in srgb, ${p.body.hex} 18%, transparent)"><span>${a}</span><b style="color:${p.headline.hex}">${b}</b></div>`;
  return mock("mock-phone", p, `
    <div class="mock-body">Good morning, Priya</div>
    <div class="mock-title" style="color:${p.headline.hex}">This month</div>
    <div class="tile" style="background:${p.button.hex};color:${ink}"><span>Saved</span><b>₹12,480</b><span>+18% vs October</span></div>
    ${row("Groceries", "₹2,140")}${row("Rent", "₹18,000")}${row("Chai Point", "₹320")}
    <span class="mock-cta" style="background:${p.headline.hex};color:${p.background.hex}">Add expense</span>`, `box-shadow:0 0 0 2px ${p.headline.hex}33`);
}

function mockCover(p) {
  return mock("mock-cover", p, `
    <div class="mock-eyebrow" style="color:${p.accent.hex}">Notebook series</div>
    <div class="mock-title" style="color:${p.headline.hex}">Rain on the<br>Western Ghats</div>
    <span class="rule" style="background:${p.accent.hex}"></span>
    <div class="mock-body">Field notes from the first week of the monsoon.</div>
    <div class="by">Compiled by Meera Nair</div>`);
}

function mockPoster(p) {
  const bg = p.button.hex;
  const ink = bestTextOn(bg);
  return `<div class="mock mock-poster" style="background:${bg};color:${ink}"><div class="mock-in">
    <div class="mock-eyebrow">Sunday market</div>
    <div class="mock-title">Diwali Night Bazaar</div>
    <div class="mock-body">Lamps, sweets and handloom from 60 makers</div>
    <span class="mock-cta" style="background:${p.background.hex};color:${p.headline.hex}">Free entry</span>
    <div class="date">12 Nov · 6 pm · Dilli Haat</div>
  </div></div>`;
}

function mockBrand(p) {
  const sw = (r, label) => `<div class="bsw"><i style="background:${p[r].hex}"></i><span>${label}</span></div>`;
  return mock("mock-brand", p, `
    <div class="brand-l">
      <span class="mark" style="background:${p.accent.hex};color:${bestTextOn(p.accent.hex)}">C</span>
      <div class="mock-title" style="color:${p.headline.hex}">Chai Naturals</div>
      <div class="mock-body">Small-batch Assam tea, packed in Kolkata.</div>
    </div>
    <div class="brand-r"><div class="bars">${ROLES.map((r) => `<i style="background:${p[r].hex};flex:${WEIGHT[r]}"></i>`).join("")}</div>
      ${sw("headline", "Main")}${sw("button", "Action")}${sw("accent", "Accent")}</div>`);
}

function mockSocial(p) {
  return mock("mock-social", p, `
    <span class="tag" style="background:${p.button.hex};color:${bestTextOn(p.button.hex)}">Monsoon diary</span>
    <div class="mock-title" style="color:${p.headline.hex}">The rains reach Kerala first</div>
    <div class="mock-body">Ten days before the rest of India. Here is what it smells like.</div>
    <div class="by" style="color:${p.accent.hex}">@meera.writes</div>`);
}

const MOCKS = { web: mockWeb, slide: mockSlide, mobile: mockMobile, cover: mockCover, poster: mockPoster, brand: mockBrand, social: mockSocial };

export default async function initScene(root) {
  const lib = await library();
  let anchor = byId(paramId(lib, "044"));
  let seed = Number(new URLSearchParams(location.search).get("s")) || 1;
  let tab = "all";
  let mode = "safe";
  let format = "hex";
  let pal;

  const picker = anchorPicker(lib, { value: anchor.id, onChange: (id) => ((anchor = byId(id)), generate()) });
  root.appendChild(picker.node);
  root.appendChild(el(`<div class="stack">
    <div class="roles" data-roles></div>
    <div class="scene-bar">
      <div class="tabs" role="tablist" aria-label="${esc(t("nav.scene"))}">
        ${["all", ...SCENES].map((s) => `<button type="button" class="tab" role="tab" data-tab="${s}" aria-selected="${s === "all"}">${esc(t(`scene.${s}`))}</button>`).join("")}
      </div>
      <div class="mode">
        <div class="join" role="group">${Object.keys(MODES).map((m) => `<button type="button" data-mode="${m}" aria-pressed="${m === mode}">${esc(t(`scene.mode.${m}`))}</button>`).join("")}</div>
        <span class="hint" data-mode-desc></span>
      </div>
    </div>
    <div class="scene-grid" data-scenes></div>
    <div class="bar sticky">
      <div class="bar-status"><span class="dot-status" data-dot></span>
        <div><div data-status></div><div class="bar-note" data-ratios></div></div></div>
      <div class="row">
        <select class="select" data-format aria-label="${esc(t("ui.copy"))}"><option value="hex">HEX</option><option value="rgb">RGB</option><option value="hsl">HSL</option></select>
        <button type="button" class="btn btn-ghost" data-copy-palette>${icon("copy")}<span>${esc(t("scene.copyPalette"))}</span></button>
        <button type="button" class="btn btn-ghost" data-copy-css>${icon("sliders")}<span>${esc(t("scene.copyCss"))}</span></button>
        <button type="button" class="btn btn-ghost" data-save>${icon("heart")}<span>${esc(t("scene.savePalette"))}</span></button>
        <a class="btn btn-ghost" data-send href="#">${icon("sparkle")}<span>${esc(t("scene.toGenerator"))}</span></a>
        <button type="button" class="btn btn-primary" data-random>${icon("shuffle")}<span>${esc(t("scene.randomColor"))}</span></button>
      </div>
    </div>
  </div>`));

  const css = () => `:root {\n${ROLES.map((r) => `  --${r}: ${pal[r].hex}; /* ${pal[r].en} */`).join("\n")}\n}\n`;
  const paletteText = () => ROLES.map((r) => `${t(`role.${r}`)}: ${fmt[format](pal[r])} ${pal[r].en}`).join("\n");

  function generate() {
    pal = rolePalette(lib, anchor, { method: MODES[mode], rand: mulberry32(seed * 7919 + Number(anchor.id)) });
    render();
  }

  function render() {
    $("[data-roles]", root).innerHTML = ROLES.map((r) => {
      const c = pal[r];
      return `<a class="role" href="${colorUrl(c.id)}"><div class="role-sw" style="background:${c.hex}"></div><div class="role-info"><span>${esc(t(`role.${r}`))} ${WEIGHT[r]}%</span><b>${esc(c.en)}</b><span class="mono">${c.hex}</span></div></a>`;
    }).join("");
    $("[data-mode-desc]", root).textContent = t(`scene.mode.${mode}.desc`);
    const list = tab === "all" ? SCENES : [tab];
    const grid = $("[data-scenes]", root);
    grid.classList.toggle("single", tab !== "all");
    grid.innerHTML = list
      .map((s) => `<article class="scene-card">
        <button type="button" class="scene-stage" data-tab="${s}" ${tab === "all" ? "" : "tabindex='-1'"} aria-label="${esc(t(`scene.${s}`))}">${MOCKS[s](pal)}</button>
        <div class="scene-info">
          <div class="scene-title"><h3>${esc(t(`scene.${s}`))}</h3><span class="badge">${esc(t(`scene.mode.${mode}`))}</span>
            <span class="spacer"></span>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy-palette aria-label="${esc(t("scene.copyPalette"))}" title="${esc(t("scene.copyPalette"))}">${icon("copy")}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-save aria-label="${esc(t("scene.savePalette"))}" title="${esc(t("scene.savePalette"))}">${icon("heart")}</button></div>
          <p class="scene-desc">${esc(t(`scene.d.${s}`))}</p>
          <dl class="scene-kv"><dt>${esc(t("scene.layout"))}</dt><dd>${esc(t(`scene.l.${s}`))}</dd><dt>${esc(t("scene.placement"))}</dt><dd>${esc(t(`scene.p.${s}`))}</dd></dl>
        </div>
      </article>`)
      .join("");
    const hl = contrast(pal.headline.hex, pal.background.hex);
    const bd = contrast(pal.body.hex, pal.background.hex);
    const bt = contrast(bestTextOn(pal.button.hex), pal.button.hex);
    const ok = Math.min(hl, bd, bt) >= 4.5;
    const lab = (r) => (r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA Large" : "—");
    $("[data-dot]", root).className = `dot-status ${ok ? "ok" : "warn"}`;
    $("[data-status]", root).textContent = t(ok ? "scene.statusOk" : "scene.statusLow");
    $("[data-ratios]", root).textContent = `${t("role.headline")} ${hl.toFixed(1)}:1 ${lab(hl)} · ${t("role.body")} ${bd.toFixed(1)}:1 ${lab(bd)} · ${t("role.button")} ${bt.toFixed(1)}:1 ${lab(bt)}`;
    $("[data-send]", root).href = `${pageUrl("generator/")}?c=${anchor.id}`;
    for (const b of $$(".tab", root)) b.setAttribute("aria-selected", String(b.dataset.tab === tab));
    for (const b of $$("[data-mode]", root)) b.setAttribute("aria-pressed", String(b.dataset.mode === mode));
  }

  root.addEventListener("click", (e) => {
    const tb = e.target.closest("[data-tab]");
    if (tb) {
      tab = tb.dataset.tab === tab && tb.classList.contains("scene-stage") ? "all" : tb.dataset.tab;
      render();
      return;
    }
    const md = e.target.closest("[data-mode]");
    if (md) {
      mode = md.dataset.mode;
      generate();
      return;
    }
    if (e.target.closest("[data-random]")) {
      picker.select(lib[Math.floor(Math.random() * lib.length)].id);
      return;
    }
    if (e.target.closest("[data-save]")) palettes.add(ROLES.map((r) => pal[r].id), `${t("nav.scene")} · ${anchor.en}`);
    if (e.target.closest("[data-copy-css]")) copyText(css());
    if (e.target.closest("[data-copy-palette]")) copyText(paletteText());
  });
  $("[data-format]", root).addEventListener("change", (e) => (format = e.target.value));

  generate();
}
