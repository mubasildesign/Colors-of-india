// Saved colors and palettes, stored in this browser.
import { t, esc, el, icon, iconPair, library, byId, colorUrl, pageUrl, slugify, favs, palettes, syncFavs, bestTextOn } from "../core.js";

export default async function initSaved(root) {
  await library();
  const box = el(`<div></div>`);
  root.appendChild(box);

  function render() {
    const colorIds = favs.all().filter(byId);
    const pals = palettes.all();
    const colorCards = colorIds
      .map((id) => {
        const c = byId(id);
        return `<li class="ccard">
          <div class="ccard-swatch" style="background:${c.hex}"></div>
          <div class="ccard-body">
            <div class="ccard-row"><a class="ccard-name" href="${colorUrl(c.id)}">${esc(c.en)}</a><span class="ccard-no">${c.id}</span></div>
            <div class="ccard-row"><span class="ccard-val">${c.hex}</span><span class="ccard-actions">
              <button type="button" class="btn btn-ghost btn-sm btn-icon" data-fav="${c.id}" aria-label="${esc(t("ui.remove"))}: ${esc(c.en)}">${iconPair("heart")}</button>
              <a class="btn btn-ghost btn-sm btn-icon" href="/cards/${c.id}.svg" download="${slugify(c.en)}-${c.id}.svg" aria-label="${esc(t("ui.download"))}: ${esc(c.en)}">${icon("download")}</a>
            </span></div>
          </div>
        </li>`;
      })
      .join("");
    const palRows = pals
      .map((p) => {
        const list = p.ids.map(byId).filter(Boolean);
        return `<div class="saved-pal">
          <div style="min-width:0">
            <div class="row" style="justify-content:space-between;margin-bottom:6px"><b style="font-weight:500">${esc(p.label)}</b><span class="count" style="margin:0">${new Date(p.created).toLocaleDateString()}</span></div>
            <div class="strip">${list.map((c) => `<a href="${colorUrl(c.id)}" style="background:${c.hex};color:${bestTextOn(c.hex)}" title="${esc(c.en)} ${c.hex}"><span>${esc(c.en)}</span></a>`).join("")}</div>
          </div>
          <div class="row" style="flex-direction:column;gap:4px">
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-copy="${list.map((c) => c.hex).join(" ")}" aria-label="${esc(t("ui.copy"))}">${icon("copy")}</button>
            <button type="button" class="btn btn-ghost btn-sm btn-icon" data-del="${p.id}" aria-label="${esc(t("ui.remove"))}">${icon("trash")}</button>
          </div>
        </div>`;
      })
      .join("");
    box.innerHTML = `
      <section>
        <div class="section-head"><h2>${esc(t("saved.colors"))} <span class="count">${colorIds.length}</span></h2></div>
        ${colorIds.length ? `<ul class="cards">${colorCards}</ul>` : `<div class="empty">${esc(t("saved.noColors"))} <a href="${pageUrl("")}">${esc(t("nav.home"))}</a></div>`}
      </section>
      <section class="section">
        <div class="section-head"><h2>${esc(t("saved.palettes"))} <span class="count">${pals.length}</span></h2>
          ${pals.length ? `<button type="button" class="btn btn-ghost btn-sm" data-clear>${icon("trash")}<span>${esc(t("saved.clear"))}</span></button>` : ""}</div>
        ${pals.length ? palRows : `<div class="empty">${esc(t("saved.noPalettes"))} <a href="${pageUrl("generator/")}">${esc(t("nav.generator"))}</a></div>`}
      </section>`;
    syncFavs(box);
  }

  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-fav]")) setTimeout(render, 0);
    const del = e.target.closest("[data-del]");
    if (del) {
      palettes.remove(del.dataset.del);
      render();
    }
    if (e.target.closest("[data-clear]") && confirm(t("saved.confirmClear"))) {
      palettes.clear();
      render();
    }
  });

  render();
}
