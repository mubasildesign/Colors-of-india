// Palette generator: five roles from one anchor, lockable, with alternates per role. Space regenerates.
import { $, $$, t, esc, el, icon, library, byId, colorUrl, paramId, palettes, copyText, ratioBadge, contrast, bestTextOn, fmt } from "../core.js";
import { anchorPicker } from "../picker.js";
import { ROLES, METHODS, rolePalette } from "../../lib/palette.js";

const EXPORTS = {
  css: (pal) => `:root {\n${ROLES.map((r) => `  --${r}: ${pal[r].hex}; /* ${pal[r].en} */`).join("\n")}\n}\n`,
  json: (pal) => JSON.stringify(Object.fromEntries(ROLES.map((r) => [r, { hex: pal[r].hex, name: pal[r].en }])), null, 2),
  tailwind: (pal) => `// tailwind.config.js\ntheme: {\n  extend: {\n    colors: {\n${ROLES.map((r) => `      ${r}: "${pal[r].hex}",`).join("\n")}\n    },\n  },\n},\n`,
  scss: (pal) => `${ROLES.map((r) => `$${r}: ${pal[r].hex}; // ${pal[r].en}`).join("\n")}\n`,
};
const EXPORT_LABEL = { css: "gen.fmtCss", json: "gen.fmtJson", tailwind: "gen.fmtTailwind", scss: "gen.fmtScss" };

export default async function initGenerator(root) {
  const lib = await library();
  let anchor = byId(paramId(lib, "044"));
  let method = "auto";
  let pal = {};
  const locked = new Set();

  const picker = anchorPicker(lib, {
    value: anchor.id,
    onChange: (id) => {
      anchor = byId(id);
      locked.clear();
      generate();
    },
  });
  root.appendChild(picker.node);
  root.appendChild(el(`<div>
    <div class="toolbar">
      <div class="join" role="group" aria-label="${esc(t("gen.method"))}">${METHODS.map((m) => `<button type="button" data-method="${m}" aria-pressed="${m === method}">${esc(t(`method.${m}`))}</button>`).join("")}</div>
    </div>
    <div class="gen" data-gen></div>
    <div class="bar sticky">
      <span class="bar-note" data-note></span>
      <div class="row">
        <span class="bar-note hide-sm"><kbd class="kbd">Space</kbd> ${esc(t("gen.spaceHint"))}</span>
        <button type="button" class="btn btn-ghost btn-icon" data-save aria-label="${esc(t("ui.save"))}" title="${esc(t("ui.save"))}">${icon("heart")}</button>
        <details class="dropdown">
          <summary class="btn">${icon("download")}<span>${esc(t("gen.export"))}</span></summary>
          <div class="dropdown-panel up">${Object.keys(EXPORTS).map((k) => `<button type="button" data-export="${k}">${esc(t(EXPORT_LABEL[k]))}</button>`).join("")}</div>
        </details>
        <button type="button" class="btn" data-replace-all>${icon("swap")}<span>${esc(t("gen.replaceAll"))}</span></button>
        <button type="button" class="btn btn-primary" data-generate>${icon("sparkle")}<span>${esc(t("gen.generate"))}</span></button>
      </div>
    </div>
  </div>`));
  const grid = $("[data-gen]", root);

  const lockedMap = () => Object.fromEntries([...locked].map((r) => [r, pal[r]]));

  function generate() {
    pal = rolePalette(lib, anchor, { method, locked: lockedMap() });
    render();
  }

  // Candidates for one role with the other four held fixed.
  function alternatives(role) {
    const others = Object.fromEntries(ROLES.filter((r) => r !== role).map((r) => [r, pal[r]]));
    const seen = new Set([pal[role].id]);
    const out = [];
    for (let i = 0; i < 14 && out.length < 4; i++) {
      const c = rolePalette(lib, anchor, { method, locked: others })[role];
      if (!seen.has(c.id)) {
        seen.add(c.id);
        out.push(c);
      }
    }
    return out;
  }

  function replace(role) {
    const alt = alternatives(role)[0];
    if (alt) pal[role] = alt;
    render();
  }

  function render() {
    const bg = pal.background.hex;
    grid.innerHTML = ROLES.map((role) => {
      const c = pal[role];
      const ink = bestTextOn(c.hex);
      const isLocked = locked.has(role);
      const sample =
        role === "background"
          ? `<div class="gen-sample"><span class="rule" style="background:${pal.accent.hex}"></span><strong style="color:${pal.headline.hex}">${esc(t("gen.sampleTitle"))}</strong><p style="color:${pal.body.hex}">${esc(t("gen.sampleBody"))}</p><span style="background:${pal.button.hex};color:${bestTextOn(pal.button.hex)}">${esc(t("gen.sampleCta"))}</span></div>`
          : "<span></span>";
      let badge = "";
      if (role === "headline" || role === "body") badge = ratioBadge(contrast(c.hex, bg));
      else if (role === "button" || role === "accent") badge = ratioBadge(contrast(c.hex, bg), { graphic: true });
      const alts = isLocked ? [] : alternatives(role);
      return `<div class="gen-col">
        <div class="gen-swatch" style="background:${c.hex};color:${ink}">
          <div class="gen-tools">
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-lock="${role}" aria-pressed="${isLocked}" aria-label="${esc(t(isLocked ? "gen.unlock" : "gen.lock"))}" title="${esc(t(isLocked ? "gen.unlock" : "gen.lock"))}">${icon(isLocked ? "lock" : "unlock")}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-replace="${role}" aria-label="${esc(t("gen.replace"))}" title="${esc(t("gen.replace"))}" ${isLocked ? "disabled" : ""}>${icon("refresh")}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="${c.hex}" aria-label="${esc(t("ui.copy"))} ${c.hex}" title="${esc(t("ui.copy"))}">${icon("copy")}</button>
          </div>
          ${sample}
        </div>
        <div class="gen-info">
          <span class="gen-role">${esc(t(`role.${role}`))}</span>
          <a class="gen-name" href="${colorUrl(c.id)}">${esc(c.en)}</a>
          <button type="button" class="gen-val" data-copy="${c.hex}" title="${esc(t("ui.copy"))}"><span>${c.hex}</span>${icon("copy")}</button>
          <button type="button" class="gen-val sub" data-copy="${fmt.rgb(c)}"><span>RGB ${c.rgb.join(" ")}</span>${icon("copy")}</button>
          <button type="button" class="gen-val sub" data-copy="${fmt.hsl(c)}"><span>HSL ${c.hsl.h} ${c.hsl.s} ${c.hsl.l}</span>${icon("copy")}</button>
          <div class="gen-badge">${badge}</div>
          <div class="gen-alts" role="group" aria-label="${esc(t("gen.alternatives"))}">${alts
            .map((a) => `<button type="button" class="alt" data-alt="${role}:${a.id}" style="background:${a.hex}" title="${esc(a.en)} ${a.hex}" aria-label="${esc(a.en)}"></button>`)
            .join("")}</div>
        </div>
      </div>`;
    }).join("");
    $("[data-note]", root).textContent = t("gen.methodNote", { method: t(`method.${method}`), name: anchor.en });
    for (const b of $$("[data-method]", root)) b.setAttribute("aria-pressed", String(b.dataset.method === method));
  }

  root.addEventListener("click", (e) => {
    const lock = e.target.closest("[data-lock]");
    if (lock) {
      const r = lock.dataset.lock;
      locked.has(r) ? locked.delete(r) : locked.add(r);
      return render();
    }
    const rep = e.target.closest("[data-replace]");
    if (rep) return replace(rep.dataset.replace);
    const alt = e.target.closest("[data-alt]");
    if (alt) {
      const [role, id] = alt.dataset.alt.split(":");
      pal[role] = byId(id);
      return render();
    }
    const m = e.target.closest("[data-method]");
    if (m) {
      method = m.dataset.method;
      return generate();
    }
    const ex = e.target.closest("[data-export]");
    if (ex) {
      copyText(EXPORTS[ex.dataset.export](pal));
      ex.closest("details")?.removeAttribute("open");
      return;
    }
    if (e.target.closest("[data-replace-all]")) {
      locked.clear();
      return generate();
    }
    if (e.target.closest("[data-generate]")) generate();
    if (e.target.closest("[data-save]")) palettes.add(ROLES.map((r) => pal[r].id), `${anchor.en} · ${t(`method.${method}`)}`);
  });
  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || /^(INPUT|TEXTAREA|SELECT|BUTTON|A|SUMMARY)$/.test(document.activeElement?.tagName || "")) return;
    e.preventDefault();
    generate();
  });

  generate();
}
