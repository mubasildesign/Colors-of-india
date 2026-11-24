// Terminal themes: anchor -> 16 ANSI colors + UI colors, previewed in a faux zsh session.
import { $, $$, t, esc, el, icon, library, byId, paramId, slugify, download, copyText, ratioBadge, contrast } from "../core.js";
import { anchorPicker } from "../picker.js";
import { terminalPalette, ANSI_KEYS, exportGhostty, exportAlacritty, exportKitty, exportWezterm, exportWindowsTerminal } from "../../lib/palette.js";

const FORMATS = {
  ghostty: { label: "Ghostty", file: (n) => n, fn: exportGhostty, hint: "~/.config/ghostty/themes/" },
  alacritty: { label: "Alacritty", file: (n) => `${n}.toml`, fn: exportAlacritty, hint: "~/.config/alacritty/themes/" },
  kitty: { label: "Kitty", file: (n) => `${n}.conf`, fn: exportKitty, hint: "~/.config/kitty/themes/" },
  wezterm: { label: "WezTerm", file: (n) => `${n}.toml`, fn: exportWezterm, hint: "~/.config/wezterm/colors/" },
  windows: { label: "Windows Terminal", file: (n) => `${n}.json`, fn: exportWindowsTerminal, hint: "settings.json → schemes" },
};

function session(p, themeName) {
  const a = p.ansi;
  const c = (key, text, bold = false) => `<span style="color:${a[key].hex}">${bold ? `<b>${esc(text)}</b>` : esc(text)}</span>`;
  const dim = (text) => c("brightBlack", text);
  const prompt = (cmd, branch = "main") => `${c("blue", "~/kanchi", true)} ${c("magenta", `(${branch})`)} ${c("green", "❯")} ${esc(cmd)}`;
  const blocks = (keys) => keys.map((k) => `<span style="color:${a[k].hex}">███</span>`).join("");
  const logo = [
    c("red", "   ▄▄▄▄▄▄▄   "),
    c("yellow", " ▄█████████▄ "),
    c("green", " ███ ▀▀▀ ███ "),
    c("cyan", " ███ ▄▄▄ ███ "),
    c("blue", " ▀█████████▀ "),
    c("magenta", "   ▀▀▀▀▀▀▀   "),
    "             ",
    "             ",
  ];
  const info = [
    `${c("cyan", "priya", true)}@${c("cyan", "kanchi", true)}`,
    dim("------------"),
    `${c("yellow", "OS")}       macOS 15.2 arm64`,
    `${c("yellow", "Shell")}    zsh 5.9`,
    `${c("yellow", "Terminal")} Ghostty 1.1`,
    `${c("yellow", "Theme")}    ${esc(themeName)}`,
    blocks(ANSI_KEYS.slice(0, 8)),
    blocks(ANSI_KEYS.slice(8)),
  ];
  const sel = `<span style="background:${p.ui.selection.hex};color:${p.ui.selectionForeground.hex}">festivalDiscount</span>`;
  return [
    prompt("fastfetch"),
    ...logo.map((l, i) => `${l}  ${info[i]}`),
    "",
    prompt("ls"),
    `${c("blue", "public", true)}  ${c("blue", "src", true)}  README.md  package.json  ${c("green", "build.sh", true)}  ${dim(".env")}`,
    "",
    prompt("git status", "diwali-sale"),
    `On branch ${c("magenta", "diwali-sale")}`,
    "Changes not staged for commit:",
    `  ${c("red", "modified:   src/cart.ts")}`,
    `  ${c("red", "deleted:    src/legacy/coupon.ts")}`,
    "Untracked files:",
    `  ${c("red", "src/sale-banner.tsx")}`,
    "",
    prompt("git diff src/cart.ts", "diwali-sale"),
    c("cyan", "@@ -12,7 +12,8 @@ export function total(cart: Cart) {"),
    c("red", "-  const tax = subtotal * 0.18;"),
    c("green", "+  const gst = subtotal * GST_RATE;"),
    `${c("green", "+  const discount = ")}${sel}${c("green", "(cart);")}`,
    "",
    prompt("bat src/tax.ts", "diwali-sale"),
    `${dim("   1 │")} ${c("magenta", "export const")} ${c("yellow", "GST_RATE")} = ${c("cyan", "0.18")};`,
    `${dim("   2 │")} ${dim("// prices are stored in paise")}`,
    `${dim("   3 │")} ${c("magenta", "export function")} ${c("blue", "festivalDiscount")}(cart: ${c("yellow", "Cart")}) {`,
    `${dim("   4 │")}   ${c("magenta", "return")} cart.code === ${c("green", '"DIWALI10"')} ? ${c("cyan", "0.1")} : ${c("cyan", "0")};`,
    `${dim("   5 │")} }`,
    "",
    `${prompt("")}<span style="background:${p.ui.cursor.hex}"> </span>`,
  ].join("\n");
}

export default async function initTerminal(root) {
  const lib = await library();
  let anchor = byId(paramId(lib, "179"));
  let mode = "dark";
  let depth = "default";
  let format = "ghostty";
  let pal;

  const picker = anchorPicker(lib, { value: anchor.id, onChange: (id) => ((anchor = byId(id)), render()), step: false });
  picker.node.appendChild(el(`<div class="join" role="group" aria-label="${esc(t("ui.theme"))}">
    <button type="button" data-mode="dark" aria-pressed="true">${icon("moon")}<span>${esc(t("ui.theme.dark"))}</span></button>
    <button type="button" data-mode="light" aria-pressed="false">${icon("sun")}<span>${esc(t("ui.theme.light"))}</span></button>
  </div>`));
  root.appendChild(picker.node);

  root.appendChild(el(`<div class="tool">
    <div class="stack">
      <div class="term" data-term>
        <div class="term-bar" data-bar><span class="term-dots"><i></i><i></i><i></i></span><span data-title></span></div>
        <div class="term-body" data-body></div>
      </div>
      <div><p class="side-title">ANSI</p><div class="ansi" data-ansi></div></div>
    </div>
    <aside class="tool-side">
      <div class="card">
        <div class="card-head"><h2>${esc(t("term.depth"))}</h2>
          <div class="join" role="group" aria-label="${esc(t("term.depth"))}">${["subtle", "default", "deep"].map((d) => `<button type="button" data-depth="${d}" aria-pressed="${d === depth}">${esc(t(`term.${d}`))}</button>`).join("")}</div>
        </div>
        <div data-ui></div>
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
      <p class="count" data-hint></p>
    </aside>
  </div>`));

  const themeName = () => `${anchor.en} ${mode === "dark" ? "Dark" : "Light"}`;
  const fileBase = () => slugify(themeName());
  const exportText = () => FORMATS[format].fn(pal, themeName());

  function render() {
    pal = terminalPalette(lib, anchor.hex, { mode, depth });
    const term = $("[data-term]", root);
    term.style.background = pal.ui.background.hex;
    term.style.color = pal.ui.foreground.hex;
    const bar = $("[data-bar]", root);
    bar.style.borderBottom = `1px solid color-mix(in srgb, ${pal.ui.foreground.hex} 10%, transparent)`;
    $$(".term-dots i", bar).forEach((d, i) => (d.style.background = [pal.ansi.red.hex, pal.ansi.yellow.hex, pal.ansi.green.hex][i]));
    $("[data-title]", root).textContent = `priya@kanchi — zsh — ${themeName()}`;
    $("[data-body]", root).innerHTML = session(pal, themeName());

    $("[data-ansi]", root).innerHTML = ANSI_KEYS.map((k) => {
      const tok = pal.ansi[k];
      return `<button type="button" data-copy="${tok.hex}" style="background:${tok.hex}" title="${k} ${tok.hex}${tok.named ? ` · ${esc(tok.named)}` : ""}" aria-label="${k} ${tok.hex}"></button>`;
    }).join("");

    const ui = pal.ui;
    const rows = [["background", ui.background], ["foreground", ui.foreground], ["cursor", ui.cursor], ["selection", ui.selection]];
    $("[data-ui]", root).innerHTML =
      rows.map(([k, tok]) => `<div class="kv"><span class="kv-label">${k}</span><span class="kv-value"><span class="sw-dot" style="background:${tok.hex}"></span><span class="mono">${tok.hex}</span>${tok.named ? "" : `<span class="badge">${esc(t("theme.adjusted"))}</span>`}</span></div>`).join("") +
      `<div class="kv"><span class="kv-label">${esc(t("term.minSlot"))}</span>${ratioBadge(Math.min(...ANSI_KEYS.filter((k) => !/black|white/i.test(k)).map((k) => contrast(pal.ansi[k].hex, ui.background.hex))), { graphic: true })}</div>`;

    $("[data-export]", root).textContent = exportText();
    $("[data-hint]", root).textContent = `${FORMATS[format].file(fileBase())} → ${FORMATS[format].hint}`;
  }

  root.addEventListener("click", (e) => {
    const md = e.target.closest("[data-mode]");
    if (md) {
      mode = md.dataset.mode;
      for (const b of $$("[data-mode]", root)) b.setAttribute("aria-pressed", String(b === md));
      render();
    }
    const d = e.target.closest("[data-depth]");
    if (d) {
      depth = d.dataset.depth;
      for (const b of $$("[data-depth]", root)) b.setAttribute("aria-pressed", String(b === d));
      render();
    }
    if (e.target.closest("[data-copy-export]")) copyText(exportText());
    if (e.target.closest("[data-download]")) download(FORMATS[format].file(fileBase()), exportText());
  });
  $("[data-format]", root).addEventListener("change", (e) => {
    format = e.target.value;
    render();
  });

  render();
}
