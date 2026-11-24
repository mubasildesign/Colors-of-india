// Anchor picker: preset swatches, a searchable combobox, and optional step/random buttons.
import { $, $$, t, esc, el, icon, matchColors, setParam, randomColor } from "./core.js";

export const PRESET_NAMES = ["Sindoor", "Kesar Saffron", "Turmeric", "Paan Leaf", "Mor Teal", "Peacock Blue", "Neel Blue", "Jamun", "Rani Pink", "Terracotta"];

export function anchorPicker(lib, { value, onChange, step = true, random = true, param = "c" }) {
  const presets = PRESET_NAMES.map((n) => lib.find((c) => c.en === n)).filter(Boolean);
  let current = value;
  const node = el(`<div class="picker">
    <div class="presets" role="group" aria-label="${esc(t("ui.anchor"))}">
      ${presets.map((c) => `<button type="button" class="preset" data-id="${c.id}" style="background:${c.hex}" aria-pressed="false" aria-label="${esc(c.en)}" title="${esc(c.en)}"></button>`).join("")}
    </div>
    <div class="combo">
      <label class="field"><span class="sr-only">${esc(t("ui.searchColors"))}</span>${icon("search")}
        <input class="input" type="search" placeholder="${esc(t("ui.searchColors"))}" autocomplete="off" role="combobox" aria-expanded="false" aria-autocomplete="list">
      </label>
      <div class="listbox" role="listbox" hidden></div>
    </div>
    <span class="spacer"></span>
    ${step ? `<button type="button" class="btn btn-icon" data-step="-1" aria-label="${esc(t("ui.prev"))}">${icon("chevronLeft")}</button>` : ""}
    ${random ? `<button type="button" class="btn" data-random>${icon("shuffle")}<span>${esc(t("ui.random"))}</span></button>` : ""}
    ${step ? `<button type="button" class="btn btn-icon" data-step="1" aria-label="${esc(t("ui.next"))}">${icon("chevronRight")}</button>` : ""}
  </div>`);
  const input = $("input", node);
  const list = $(".listbox", node);
  let hits = [];
  let active = -1;

  const sync = () => {
    for (const b of $$(".preset", node)) b.setAttribute("aria-pressed", String(b.dataset.id === current));
  };
  const select = (id) => {
    if (!id) return;
    current = id;
    sync();
    if (param) setParam(param, id);
    onChange(id);
  };
  const close = () => {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
  };
  const highlight = (i) => {
    active = i;
    $$(".option", list).forEach((o, j) => o.setAttribute("aria-selected", String(j === i)));
  };
  const render = () => {
    hits = matchColors(lib, input.value, 8);
    if (!input.value.trim()) return close();
    list.innerHTML = hits.length
      ? hits.map((c) => `<div class="option" role="option" data-id="${c.id}"><span class="sw" style="background:${c.hex}"></span>${esc(c.en)}<span class="end">${c.hex}</span></div>`).join("")
      : `<div class="lb-empty">${esc(t("ui.noResults"))}</div>`;
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    highlight(hits.length ? 0 : -1);
  };

  node.addEventListener("click", (e) => {
    const p = e.target.closest(".preset");
    if (p) select(p.dataset.id);
    const o = e.target.closest(".option");
    if (o) {
      select(o.dataset.id);
      input.value = "";
      close();
    }
    const s = e.target.closest("[data-step]");
    if (s) {
      const i = lib.findIndex((c) => c.id === current);
      select(lib[(i + Number(s.dataset.step) + lib.length) % lib.length].id);
    }
    if (e.target.closest("[data-random]")) select(randomColor(lib, current).id);
  });
  input.addEventListener("input", render);
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      highlight(Math.min(hits.length - 1, active + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      highlight(Math.max(0, active - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hits[active]) {
        select(hits[active].id);
        input.value = "";
        close();
      }
    } else if (e.key === "Escape") close();
  });
  document.addEventListener("click", (e) => !node.contains(e.target) && close());
  sync();
  return { node, select, get value() { return current; } };
}
