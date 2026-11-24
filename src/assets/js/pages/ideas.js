// Palette ideas: every anchor x harmony as a five-role palette, plus curated India collections.
import { $, $$, t, esc, el, icon, iconPair, library, colorUrl, pageUrl, palettes, copyText, ratioBadge, contrast, bestTextOn } from "../core.js";
import { ROLES, METHODS, rolePalette, mulberry32 } from "../../lib/palette.js";

const COLLECTIONS = {
  holi: ["Gulal Pink", "Holi Magenta", "Kesar Saffron", "Parrot Green", "Sky"],
  temple: ["Sindoor", "Turmeric", "Sandal Paste", "Kumkum", "Sacred Ash"],
  kanjivaram: ["Rani Pink", "Kanchi Gold", "Peacock Blue", "Mulberry", "Paan Leaf"],
  spice: ["Turmeric", "Chilli", "Cinnamon", "Cardamom", "Cumin"],
  ajrakh: ["Ajrakh Indigo", "Madder", "Ivory", "Kohl", "Indigo"],
  mughal: ["Mughal Blue", "Mughal Gold", "Mughal Rose", "Mughal Green", "Ivory"],
  monsoon: ["Monsoon Green", "Rain Blue", "Stormcloud", "Peepal Leaf", "Mist"],
  desert: ["Desert Dawn", "Sandstone", "Terracotta", "Camel", "Rust"],
  chai: ["Ghee", "Jaggery", "Chai", "Filter Coffee", "Cardamom"],
  peacock: ["Peacock Blue", "Peacock Feather", "Mor Teal", "Emerald", "Gold Leaf"],
  madhubani: ["Ivory", "Turmeric", "Sindoor", "Madhubani Green", "Kohl"],
  lotus: ["Lotus White", "Lotus Pink", "Lotus Yellow", "Paan Leaf", "Ganga Water"],
};
const PAGE = 36;

function strip(list) {
  return `<div class="strip">${list
    .map((c) => `<a href="${colorUrl(c.id)}" style="background:${c.hex};color:${bestTextOn(c.hex)}" title="${esc(c.en)} ${c.hex}"><span>${esc(c.en)}<small>${c.hex}</small></span></a>`)
    .join("")}</div>`;
}

function collection(title, list) {
  const ids = list.map((c) => c.id).join(",");
  const hexes = list.map((c) => c.hex).join(" ");
  return `<section class="idea">
    <div class="idea-head"><h3>${esc(title)}</h3>
      <div class="row">
        <button type="button" class="btn btn-ghost btn-sm" data-copy="${hexes}">${icon("copy")}<span>${esc(t("ui.copy"))}</span></button>
        <button type="button" class="btn btn-ghost btn-sm" data-save-ids="${ids}" data-label="${esc(title)}">${icon("heart")}<span>${esc(t("ui.save"))}</span></button>
      </div>
    </div>
    ${strip(list)}
  </section>`;
}

const toneOf = (bg) => (bg.hsl.l >= 85 ? "light" : bg.hsl.l <= 30 ? "dark" : "color");
const keyOf = (p) => ROLES.map((r) => p.pal[r].id).join(",");

function demo(p) {
  const { pal } = p;
  return `<div class="pdemo" style="background:${pal.background.hex};color:${pal.body.hex}">
    <i class="pdemo-bar" style="background:${pal.accent.hex}"></i>
    <b style="color:${pal.headline.hex}">Handloom week</b>
    <span>Silk and cotton from 30 weaving towns.</span>
    <em style="background:${pal.button.hex};color:${bestTextOn(pal.button.hex)}">Shop now</em>
  </div>`;
}

export default async function initIdeas(root) {
  const lib = await library();
  const byName = new Map(lib.map((c) => [c.en, c]));
  const all = [];
  for (const anchor of lib) {
    METHODS.forEach((method, mi) => {
      const pal = rolePalette(lib, anchor, { method, rand: mulberry32(Number(anchor.id) * 131 + mi * 17 + 3) });
      all.push({ anchor, method, pal, tone: toneOf(pal.background), ratio: contrast(pal.headline.hex, pal.background.hex) });
    });
  }

  const S = { q: "", harmony: "", tone: "", sort: "number", view: "cards", limit: PAGE, tab: "palettes" };
  const picked = new URLSearchParams(location.search).get("c");
  if (picked) S.q = lib.find((c) => c.id === picked)?.en || "";
  const selected = new Set();
  let order = all.slice();

  root.appendChild(el(`<div>
    <div class="scene-bar" style="margin:0 0 14px">
      <div class="tabs" role="tablist">
        <button type="button" class="tab" role="tab" data-tab="palettes" aria-selected="true">${esc(t("nav.ideas"))}</button>
        <button type="button" class="tab" role="tab" data-tab="collections" aria-selected="false">${esc(t("ideas.collections"))}</button>
      </div>
      <button type="button" class="btn btn-primary" data-copy-selected disabled>${icon("copy")}<span data-sel-label>${esc(t("ideas.copySelected"))}</span></button>
    </div>
    <div data-pane="palettes">
      <div class="toolbar">
        <label class="field grow"><span class="sr-only">${esc(t("ui.searchColors"))}</span>${icon("search")}<input class="input" type="search" placeholder="${esc(t("ui.searchColors"))}" value="${esc(S.q)}" data-q></label>
        <select class="select" data-harmony aria-label="${esc(t("gen.method"))}"><option value="">${esc(t("ideas.allHarmonies"))}</option>${METHODS.map((m) => `<option value="${m}">${esc(t(`method.${m}`))}</option>`).join("")}</select>
        <select class="select" data-tone aria-label="${esc(t("ideas.allTones"))}"><option value="">${esc(t("ideas.allTones"))}</option>${["light", "dark", "color"].map((k) => `<option value="${k}">${esc(t(`ideas.tone.${k}`))}</option>`).join("")}</select>
        <div class="join" role="group">${["number", "random", "saved"].map((k) => `<button type="button" data-sort="${k}" aria-pressed="${k === S.sort}">${esc(t(`ideas.sort${k[0].toUpperCase()}${k.slice(1)}`))}</button>`).join("")}</div>
        <div class="join" role="group">${["cards", "demo"].map((k) => `<button type="button" data-view="${k}" aria-pressed="${k === S.view}">${esc(t(`ideas.view${k[0].toUpperCase()}${k.slice(1)}`))}</button>`).join("")}</div>
        <button type="button" class="btn" data-shuffle>${icon("shuffle")}<span>${esc(t("ideas.shuffle"))}</span></button>
      </div>
      <p class="count" data-count aria-live="polite"></p>
      <div class="pgrid" data-grid></div>
      <p class="empty" data-empty hidden>${esc(t("ui.noResults"))}</p>
      <div class="more"><button type="button" class="btn" data-more hidden>${esc(t("ui.showMore"))}</button></div>
    </div>
    <div data-pane="collections" hidden>${Object.entries(COLLECTIONS)
      .map(([key, names]) => collection(t(`coll.${key}`), names.map((n) => byName.get(n)).filter(Boolean)))
      .join("")}</div>
  </div>`));

  const grid = $("[data-grid]", root);
  const savedKeys = () => new Set(palettes.all().map((p) => p.ids.join(",")));

  function list() {
    const q = S.q.trim().toLowerCase();
    const saved = savedKeys();
    return order.filter(
      (p) =>
        (!S.harmony || p.method === S.harmony) &&
        (!S.tone || p.tone === S.tone) &&
        (S.sort !== "saved" || saved.has(keyOf(p))) &&
        (!q || p.anchor.en.toLowerCase().includes(q) || ROLES.some((r) => p.pal[r].en.toLowerCase().includes(q) || p.pal[r].hex.toLowerCase().includes(q)))
    );
  }

  function card(p, saved) {
    const key = keyOf(p);
    const hexes = ROLES.map((r) => p.pal[r].hex).join(" ");
    return `<article class="pcard${selected.has(key) ? " is-selected" : ""}" data-key="${key}">
      <button type="button" class="pcard-pick" data-pick aria-pressed="${selected.has(key)}" aria-label="${esc(p.anchor.en)}">
        ${S.view === "demo" ? demo(p) : `<div class="pbars">${ROLES.map((r) => `<i style="background:${p.pal[r].hex}"></i>`).join("")}</div>`}
        <div class="plabels">${ROLES.map((r) => `<span><small>${esc(t(`role.${r}`))}</small><b>${p.pal[r].hex}</b></span>`).join("")}</div>
      </button>
      <div class="pcard-foot">
        <div class="row-between"><a class="pname" href="${colorUrl(p.anchor.id)}">${esc(p.anchor.en)}</a>${ratioBadge(p.ratio)}</div>
        <div class="row-between"><span class="hint">${esc(t(`method.${p.method}`))} · ${esc(t("ideas.mainAccents"))}</span>
          <span class="row">
            <button type="button" class="btn btn-ghost btn-sm btn-icon fav${saved.has(key) ? " is-on" : ""}" data-save-key="${key}" aria-label="${esc(t("ui.save"))}">${iconPair("heart")}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="${hexes}" aria-label="${esc(t("ui.copy"))}">${icon("copy")}</button>
            <a class="btn btn-ghost btn-sm btn-icon" href="${pageUrl("scene/")}?c=${p.anchor.id}" aria-label="${esc(t("usage.open"))}">${icon("arrowUpRight")}</a>
          </span></div>
      </div>
    </article>`;
  }

  function selectedLabel() {
    $("[data-copy-selected]", root).disabled = selected.size === 0;
    $("[data-sel-label]", root).textContent = selected.size ? `${t("ideas.copySelected")} (${selected.size})` : t("ideas.copySelected");
  }

  function render() {
    const items = list();
    const saved = savedKeys();
    grid.innerHTML = items.slice(0, S.limit).map((p) => card(p, saved)).join("");
    $("[data-count]", root).textContent = `${t("ui.showing", { count: Math.min(S.limit, items.length), total: items.length })} ${t("ideas.palettes")}`;
    $("[data-empty]", root).hidden = items.length > 0;
    $("[data-more]", root).hidden = items.length <= S.limit;
    selectedLabel();
    for (const b of $$("[data-sort]", root)) b.setAttribute("aria-pressed", String(b.dataset.sort === S.sort));
    for (const b of $$("[data-view]", root)) b.setAttribute("aria-pressed", String(b.dataset.view === S.view));
  }

  const reshuffle = () => {
    S.sort = "random";
    order = all.slice().sort(() => Math.random() - 0.5);
    S.limit = PAGE;
    render();
  };

  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) {
      S.tab = tab.dataset.tab;
      for (const b of $$(".tab", root)) b.setAttribute("aria-selected", String(b === tab));
      for (const pane of $$("[data-pane]", root)) pane.hidden = pane.dataset.pane !== S.tab;
      return;
    }
    const sort = e.target.closest("[data-sort]");
    if (sort) {
      if (sort.dataset.sort === "random") return reshuffle();
      S.sort = sort.dataset.sort;
      order = all.slice();
      S.limit = PAGE;
      return render();
    }
    const view = e.target.closest("[data-view]");
    if (view) {
      S.view = view.dataset.view;
      return render();
    }
    if (e.target.closest("[data-shuffle]")) return reshuffle();
    if (e.target.closest("[data-more]")) {
      S.limit += PAGE * 2;
      return render();
    }
    const saveKey = e.target.closest("[data-save-key]");
    if (saveKey) {
      const key = saveKey.dataset.saveKey;
      const existing = palettes.all().find((p) => p.ids.join(",") === key);
      if (existing) palettes.remove(existing.id);
      else {
        const p = all.find((x) => keyOf(x) === key);
        palettes.add(key.split(","), `${p.anchor.en} · ${t(`method.${p.method}`)}`);
      }
      return render();
    }
    if (e.target.closest("[data-copy-selected]")) {
      const lines = all.filter((p) => selected.has(keyOf(p))).map((p) => `/* ${p.anchor.en} · ${t(`method.${p.method}`)} */ ${ROLES.map((r) => `${r}: ${p.pal[r].hex}`).join("; ")}`);
      return copyText(lines.join("\n"));
    }
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      const key = pick.closest("[data-key]").dataset.key;
      selected.has(key) ? selected.delete(key) : selected.add(key);
      pick.closest(".pcard").classList.toggle("is-selected", selected.has(key));
      pick.setAttribute("aria-pressed", String(selected.has(key)));
      return selectedLabel();
    }
    const sv = e.target.closest("[data-save-ids]");
    if (sv) palettes.add(sv.dataset.saveIds.split(","), sv.dataset.label);
  });
  $("[data-q]", root).addEventListener("input", (e) => {
    S.q = e.target.value;
    S.limit = PAGE;
    render();
  });
  $("[data-harmony]", root).addEventListener("change", (e) => ((S.harmony = e.target.value), (S.limit = PAGE), render()));
  $("[data-tone]", root).addEventListener("change", (e) => ((S.tone = e.target.value), (S.limit = PAGE), render()));

  render();
}
