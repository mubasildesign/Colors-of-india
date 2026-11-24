// States of India: filter by region, search, save a state palette.
import { $, $$, palettes } from "../core.js";

export default function initStates() {
  const grid = $("[data-states]");
  if (!grid) return;
  const cards = $$(".scard", grid);
  const search = $("[data-states-search]");
  const count = $("[data-states-count]");
  const empty = $("[data-states-empty]");
  let region = "";

  function apply() {
    const q = search.value.trim().toLowerCase();
    let n = 0;
    for (const c of cards) {
      const show = (!region || c.dataset.region === region) && (!q || c.dataset.search.includes(q));
      c.hidden = !show;
      if (show) n++;
    }
    count.textContent = count.dataset.template.replace("{count}", n).replace("{total}", cards.length);
    empty.hidden = n > 0;
  }

  search.addEventListener("input", apply);
  for (const chip of $$("[data-states-regions] [data-region]")) {
    chip.addEventListener("click", () => {
      region = chip.dataset.region;
      for (const b of $$("[data-states-regions] [data-region]")) b.setAttribute("aria-pressed", String(b === chip));
      apply();
    });
  }
  grid.addEventListener("click", (e) => {
    const save = e.target.closest("[data-save-palette]");
    if (save) palettes.add(save.dataset.savePalette.split(","), save.dataset.label);
  });
  apply();
}
