// Browse color cards: search, family chips, value format, shuffle and paging.
// The page ships its first cards as HTML; the full library is loaded and rendered here, page by page.
import { $, $$, t, esc, icon, iconPair, library, fmt, colorUrl, slugify, store, syncFavs } from "../core.js";

const PAGE_SIZE = 30;

function cardHtml(c, format, i) {
  const val = { hex: c.hex, rgb: fmt.rgb(c), hsl: fmt.hsl(c), cmyk: fmt.cmyk(c) };
  return `<li class="ccard" data-id="${c.id}" data-family="${c.family}" style="--i:${i}">
  <div class="ccard-swatch" style="background:${c.hex}"></div>
  <div class="ccard-body">
    <div class="ccard-row"><a class="ccard-name" href="${colorUrl(c.id)}">${esc(c.en)}</a><span class="ccard-no">${c.id}</span></div>
    <div class="ccard-row"><button type="button" class="ccard-val" data-val data-copy="${esc(val[format])}" title="${esc(t("ui.copy"))}" data-hex="${val.hex}" data-rgb="${val.rgb}" data-hsl="${val.hsl}" data-cmyk="${val.cmyk}">${esc(val[format])}</button><span class="ccard-actions"><button type="button" class="btn btn-ghost btn-sm btn-icon fav" data-fav="${c.id}" aria-pressed="false" aria-label="${esc(t("ui.save"))}: ${esc(c.en)}">${iconPair("heart")}</button><a class="btn btn-ghost btn-sm btn-icon" href="/cards/${c.id}.svg" download="${slugify(c.en)}-${c.id}.svg" aria-label="${esc(t("ui.download"))}: ${esc(c.en)}">${icon("download")}</a></span></div>
  </div>
</li>`;
}

export default async function initHome() {
  const grid = $("[data-gallery]");
  if (!grid) return;
  const search = $("[data-filter-search]");
  const count = $("[data-count]");
  const empty = $("[data-empty]");
  const more = $("[data-more]");
  const lib = await library();
  let order = [...lib];
  let family = "";
  let limit = PAGE_SIZE;
  let format = store.get("itc.format", "hex");
  let rendered = 0;
  let lastKey = "";

  const matches = () => {
    const q = search.value.trim().toLowerCase().replace(/^#/, "");
    return order.filter(
      (c) => (!family || c.family === family) && (!q || `${c.en} ${c.tr} ${c.hex} ${c.id}`.toLowerCase().includes(q))
    );
  };

  function apply(reset = true) {
    const list = matches();
    const shown = list.slice(0, limit);
    const key = shown.map((c) => c.id).join(",");
    if (reset || rendered === 0 || !key.startsWith(lastKey)) {
      grid.innerHTML = shown.map((c, i) => cardHtml(c, format, Math.min(i, 14))).join("");
    } else {
      // Appending: keep existing cards so they do not replay their entrance.
      grid.insertAdjacentHTML("beforeend", shown.slice(rendered).map((c, i) => cardHtml(c, format, Math.min(i, 14))).join(""));
    }
    rendered = shown.length;
    lastKey = key;
    count.textContent = count.dataset.template.replace("{count}", shown.length).replace("{total}", list.length);
    empty.hidden = list.length > 0;
    more.hidden = list.length <= limit;
    syncFavs();
  }

  search.addEventListener("input", () => {
    limit = PAGE_SIZE;
    apply();
  });
  for (const chip of $$("[data-filter-family] [data-family]")) {
    chip.addEventListener("click", () => {
      family = chip.dataset.family;
      for (const b of $$("[data-filter-family] [data-family]")) b.setAttribute("aria-pressed", String(b === chip));
      limit = PAGE_SIZE;
      apply();
    });
  }
  more.addEventListener("click", () => {
    limit += PAGE_SIZE * 2;
    apply(false);
  });

  const setFormat = (f) => {
    format = f;
    for (const b of $$("[data-format]")) b.setAttribute("aria-pressed", String(b.dataset.format === f));
    for (const v of $$("[data-val]", grid)) {
      v.textContent = v.dataset[f];
      v.dataset.copy = v.dataset[f];
    }
    store.set("itc.format", f);
  };
  for (const b of $$("[data-format]")) b.addEventListener("click", () => setFormat(b.dataset.format));
  setFormat(format);

  $("[data-shuffle]").addEventListener("click", () => {
    order = [...order].sort(() => Math.random() - 0.5);
    apply();
  });

  // Keep the cards that shipped in the HTML (no replayed entrance); render the rest on demand.
  rendered = grid.children.length;
  lastKey = order.slice(0, rendered).map((c) => c.id).join(",");
  apply(false);
}
