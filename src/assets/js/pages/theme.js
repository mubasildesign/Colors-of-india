// Theme generator: anchor -> shadcn-style tokens (light/dark) shown on a product dashboard mock.
import { $, $$, t, esc, el, icon, library, byId, paramId, slugify, download, copyText, ratioBadge, contrast } from "../core.js";
import { anchorPicker } from "../picker.js";
import { THEME_KEYS, THEME_TEXT_PAIRS, themeTokens, exportShadcn, exportDaisy, exportTokensJson, oklchOf } from "../../lib/palette.js";

const RADII = [["0", "0rem"], ["S", "0.375rem"], ["M", "0.625rem"], ["L", "1rem"]];
const FORMATS = {
  shadcn: { label: "shadcn/ui", ext: "css" },
  daisy: { label: "daisyUI 5", ext: "css" },
  json: { label: "JSON", ext: "json" },
};

function chartSvg() {
  const a = [42, 58, 50, 72, 64, 86, 78, 94];
  const b = [30, 36, 44, 40, 52, 48, 60, 66];
  const W = 400, H = 150, gap = W / a.length;
  const bars = a
    .map((v, i) => {
      const x = i * gap + 8;
      return `<rect x="${x}" y="${H - v * 1.4}" width="${gap / 2 - 6}" height="${v * 1.4}" rx="2" fill="var(--m-chart-1)"/><rect x="${x + gap / 2 - 4}" y="${H - b[i] * 1.4}" width="${gap / 2 - 6}" height="${b[i] * 1.4}" rx="2" fill="var(--m-chart-2)"/>`;
    })
    .join("");
  const grid = [0.25, 0.5, 0.75].map((f) => `<line x1="0" x2="${W}" y1="${H * f}" y2="${H * f}" stroke="var(--m-border)" stroke-dasharray="3 4"/>`).join("");
  return `<svg class="m-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Revenue by week, online and in-store">${grid}${bars}</svg>`;
}

function productMock() {
  const nav = [["grid", "Overview", true], ["box", "Orders"], ["palette", "Products"], ["users", "Customers"], ["chart", "Analytics"], ["settings", "Settings"]];
  const delta = (v, up = true) =>
    `<span class="m-delta" style="background:color-mix(in oklab, var(${up ? "--m-primary" : "--m-destructive"}) 14%, transparent);color:var(--m-foreground)">${v}</span>`;
  const badge = (label, bg, fg, extra = "") => `<span class="m-badge" style="background:var(${bg});color:var(${fg});${extra}">${label}</span>`;
  return `
    <aside class="m-side">
      <div class="m-logo"><i></i>Kanchi Looms</div>
      ${nav.map(([ic, label, on]) => `<div class="m-nav${on ? " on" : ""}">${icon(ic)}${label}</div>`).join("")}
    </aside>
    <div class="m-main">
      <div class="m-head">
        <div><div class="m-crumb">Dashboard / Overview</div><div class="m-title">Overview</div></div>
        <div class="row" style="gap:8px;flex-wrap:nowrap">
          <div class="m-search">${icon("search")}Search orders</div>
          <div class="m-iconbtn">${icon("bell")}</div>
          <span class="m-btn m-btn-primary">${icon("plus")}&nbsp;New product</span>
        </div>
      </div>
      <div class="m-alert">${icon("bell")}<span>3 sarees are low on stock. Restock before the Pongal sale.</span></div>
      <div class="m-stats">
        <div class="m-card"><div class="m-card-title">Revenue</div><div class="m-big">₹4,82,300</div>${delta("+12.4%")}</div>
        <div class="m-card"><div class="m-card-title">Orders</div><div class="m-big">1,284</div>${delta("+4.1%")}</div>
        <div class="m-card"><div class="m-card-title">Return rate</div><div class="m-big">2.3%</div>${delta("+0.4%", false)}</div>
      </div>
      <div class="m-grid2">
        <div class="m-card">
          <div class="m-card-title">Revenue by week</div>
          ${chartSvg()}
          <div class="m-legend"><span><i style="background:var(--m-chart-1)"></i>Online</span><span><i style="background:var(--m-chart-2)"></i>In-store</span></div>
          <div class="m-bars"><span style="flex:5;background:var(--m-chart-1)"></span><span style="flex:3;background:var(--m-chart-2)"></span><span style="flex:2;background:var(--m-chart-3)"></span><span style="flex:1.4;background:var(--m-chart-4)"></span><span style="flex:1;background:var(--m-chart-5)"></span></div>
        </div>
        <div class="m-card">
          <div class="m-card-title">Store settings</div>
          <div class="m-tabs"><span class="on">General</span><span>Payments</span><span>Shipping</span></div>
          <span class="m-label">Store name</span><div class="m-input">Kanchi Looms</div>
          <span class="m-label">Support email</span><div class="m-input">help@kanchilooms.in</div>
          <div class="m-switch-row"><span>Accept cash on delivery</span><span class="m-switch"></span></div>
          <div class="m-btns"><span class="m-btn m-btn-primary">Save</span><span class="m-btn m-btn-secondary">Preview</span><span class="m-btn m-btn-outline">Cancel</span></div>
        </div>
      </div>
      <div class="m-card">
        <div class="m-card-title">Recent orders</div>
        <table class="m-table">
          <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            <tr><td>#4821</td><td>Ananya Iyer</td><td>${badge("Paid", "--m-primary", "--m-primary-foreground")}</td><td style="text-align:right">₹18,400</td></tr>
            <tr><td>#4820</td><td>Rohan Mehta</td><td>${badge("Shipped", "--m-secondary", "--m-secondary-foreground")}</td><td style="text-align:right">₹7,250</td></tr>
            <tr><td>#4819</td><td>Fatima Sheikh</td><td>${badge("Pending", "--m-muted", "--m-muted-foreground")}</td><td style="text-align:right">₹12,900</td></tr>
            <tr><td>#4818</td><td>Arjun Reddy</td><td>${badge("Refunded", "--m-destructive", "--m-destructive-foreground")}</td><td style="text-align:right">₹3,600</td></tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

export default async function initTheme(root) {
  const lib = await library();
  let anchor = byId(paramId(lib, "179"));
  let mode = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
  let radius = "0.625rem";
  let format = "shadcn";
  let theme;

  const picker = anchorPicker(lib, { value: anchor.id, onChange: (id) => ((anchor = byId(id)), build()), step: false });
  const modeJoin = el(`<div class="join" role="group" aria-label="${esc(t("ui.theme"))}">
    <button type="button" data-mode="light" aria-pressed="${mode === "light"}">${icon("sun")}<span>${esc(t("ui.theme.light"))}</span></button>
    <button type="button" data-mode="dark" aria-pressed="${mode === "dark"}">${icon("moon")}<span>${esc(t("ui.theme.dark"))}</span></button>
  </div>`);
  picker.node.appendChild(modeJoin);
  root.appendChild(picker.node);

  root.appendChild(el(`<div class="tool tool-wide">
    <div class="stack">
      <div class="app-mock" data-mock>${productMock()}</div>
      <div><p class="side-title">${esc(t("theme.tokens"))}</p><div class="tokens" data-tokens></div></div>
    </div>
    <aside class="tool-side">
      <div class="card" data-anchor-card></div>
      <div class="card">
        <div class="card-head"><h2>${esc(t("theme.radius"))}</h2>
          <div class="join" role="group" aria-label="${esc(t("theme.radius"))}">${RADII.map(([l, v]) => `<button type="button" data-radius="${v}" aria-pressed="${v === radius}">${l}</button>`).join("")}</div>
        </div>
        <div data-checks></div>
      </div>
      <div class="code">
        <div class="code-head">
          <select class="select" data-format aria-label="${esc(t("ui.format"))}" style="height:28px">${Object.entries(FORMATS).map(([k, f]) => `<option value="${k}">${f.label}</option>`).join("")}</select>
          <span class="row" style="gap:2px">
            <button type="button" class="btn btn-ghost btn-sm" data-copy-export>${icon("copy")}${esc(t("ui.copy"))}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-download aria-label="${esc(t("ui.download"))}">${icon("download")}</button>
          </span>
        </div>
        <pre data-export></pre>
      </div>
    </aside>
  </div>`));

  const mock = $("[data-mock]", root);
  const name = () => `${slugify(anchor.en)}`;
  const exportText = () =>
    format === "shadcn"
      ? exportShadcn(theme, { title: anchor.en, radius })
      : format === "daisy"
        ? exportDaisy(theme, lib, { name: name(), radius })
        : exportTokensJson(theme);

  function build() {
    theme = themeTokens(anchor.hex, lib);
    render();
  }

  function render() {
    const m = theme[mode];
    for (const k of THEME_KEYS) mock.style.setProperty(`--m-${k}`, m[k].hex);
    mock.style.setProperty("--m-r", radius);
    mock.style.colorScheme = mode;

    $("[data-tokens]", root).innerHTML = THEME_KEYS.filter((k) => !k.startsWith("sidebar-") && k !== "popover" && k !== "popover-foreground")
      .map((k) => `<button type="button" class="token" data-copy="${m[k].hex}" title="${esc(m[k].named || t("theme.adjusted"))}"><span class="sw-dot" style="background:${m[k].hex}"></span><div><b>${k}</b><span>${m[k].hex}${m[k].named ? "" : " · " + esc(t("theme.adjusted"))}</span></div></button>`)
      .join("");

    const p = m.primary;
    $("[data-anchor-card]", root).innerHTML = `
      <div style="height:84px;background:${anchor.hex};border-bottom:1px solid var(--border)"></div>
      <div class="kv"><span class="kv-label">${esc(t("ui.anchor"))}</span><span class="kv-value"><b>${esc(anchor.en)}</b></span></div>
      <div class="kv"><span class="kv-label">HEX</span><span class="kv-value"><span class="mono">${anchor.hex}</span><button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="${anchor.hex}" aria-label="${esc(t("ui.copy"))} HEX">${icon("copy")}</button></span></div>
      <div class="kv"><span class="kv-label">OKLCH</span><span class="kv-value"><span class="mono">${oklchOf(anchor.hex)}</span></span></div>
      <div class="kv"><span class="kv-label">primary</span><span class="kv-value"><span class="sw-dot" style="background:${p.hex}"></span><span class="mono">${p.hex}</span>${p.named ? "" : `<span class="badge">${esc(t("theme.adjusted"))}</span>`}</span></div>`;

    $("[data-checks]", root).innerHTML = THEME_TEXT_PAIRS.slice(0, 6)
      .map(([fg, bg]) => `<div class="kv"><span class="kv-label">${fg} / ${bg}</span>${ratioBadge(contrast(m[fg].hex, m[bg].hex))}</div>`)
      .join("");

    $("[data-export]", root).textContent = exportText();
  }

  root.addEventListener("click", (e) => {
    const md = e.target.closest("[data-mode]");
    if (md) {
      mode = md.dataset.mode;
      for (const b of $$("[data-mode]", root)) b.setAttribute("aria-pressed", String(b === md));
      render();
    }
    const r = e.target.closest("[data-radius]");
    if (r) {
      radius = r.dataset.radius;
      for (const b of $$("[data-radius]", root)) b.setAttribute("aria-pressed", String(b === r));
      render();
    }
    if (e.target.closest("[data-copy-export]")) copyText(exportText());
    if (e.target.closest("[data-download]")) {
      const f = FORMATS[format];
      download(`${name()}-${format}.${f.ext}`, exportText(), f.ext === "json" ? "application/json" : "text/css");
    }
  });
  $("[data-format]", root).addEventListener("change", (e) => {
    format = e.target.value;
    render();
  });

  build();
}
