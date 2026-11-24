// Color dictionary: filter by text and family, sort by column.
import { $, $$ } from "../core.js";

export default function initDictionary() {
  const table = $("[data-dict]");
  if (!table) return;
  const body = $("tbody", table);
  const rows = $$("tr", body);
  const filter = $("[data-dict-filter]");
  const family = $("[data-dict-family]");
  const count = $("[data-dict-count]");
  let sortKey = "id";
  let dir = 1;

  const value = (row, key) => {
    if (key === "id") return Number(row.dataset.id);
    if (key === "h") return Number(row.dataset.h) * 1000 + Number(row.dataset.l);
    return row.dataset[key];
  };

  function apply() {
    const q = filter.value.trim().toLowerCase();
    const f = family.value;
    let shown = 0;
    for (const r of rows) {
      const ok = (!f || r.dataset.family === f) && (!q || r.dataset.search.includes(q));
      r.hidden = !ok;
      if (ok) shown++;
    }
    count.textContent = count.dataset.template.replace("{count}", shown).replace("{total}", rows.length);
  }

  function sort(key) {
    dir = key === sortKey ? -dir : 1;
    sortKey = key;
    const sorted = [...rows].sort((a, b) => {
      const x = value(a, key), y = value(b, key);
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * dir;
    });
    for (const r of sorted) body.appendChild(r);
    for (const th of $$("th", table)) th.removeAttribute("aria-sort");
    $(`[data-sort="${key}"]`, table).closest("th").setAttribute("aria-sort", dir === 1 ? "ascending" : "descending");
  }

  for (const b of $$("[data-sort]", table)) b.addEventListener("click", () => sort(b.dataset.sort));
  filter.addEventListener("input", apply);
  family.addEventListener("change", apply);
  apply();
}
