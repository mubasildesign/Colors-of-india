// Color of the day: a date maps to one color; build a share card (SVG/PNG) and ready-to-post copy.
import { $, $$, t, esc, el, icon, library, byId, colorUrl, pageUrl, slugify, setParam, copyText, LOCALE, bestTextOn, fmt, randomColor } from "../core.js";

const SIZES = { tall: [1080, 1350], square: [1080, 1080], wide: [1600, 900] };
const SIZE_KEY = { tall: "today.story", square: "today.square", wide: "today.wide" };
const FONT = "Geist, -apple-system, 'Helvetica Neue', Arial, 'Noto Sans Tamil', 'Noto Sans Devanagari', 'Noto Sans Telugu', sans-serif";
const MONO = "'Geist Mono', 'SF Mono', Menlo, monospace";
const PRESETS = {
  post: { size: "square", bg: "light", cmyk: false, partners: true, dodont: false },
  story: { size: "tall", bg: "color", cmyk: false, partners: false, dodont: false },
  notes: { size: "wide", bg: "light", cmyk: true, partners: true, dodont: true },
};
const NEXT = [["generator", "nav.generator"], ["scene", "nav.scene"], ["theme", "nav.theme"], ["terminal", "nav.terminal"], ["palettes", "nav.ideas"], ["usage", "nav.usage"], ["gradients", "nav.gradients"]];

const isoDay = (d) => d.toISOString().slice(0, 10);
function colorForDate(lib, iso) {
  const days = Math.floor(Date.parse(`${iso}T00:00:00Z`) / 86400000);
  return lib[(((days * 7919) % lib.length) + lib.length) % lib.length];
}

// Usage advice derived from lightness and saturation only.
function kindOf(c) {
  if (c.hsl.s < 12) return "neutral";
  if (c.hsl.l < 30) return "dark";
  if (c.hsl.l >= 82) return "light";
  if (c.hsl.s >= 55) return "vivid";
  return "soft";
}

function partnersOf(c, lib) {
  const seen = new Set([c.id]);
  const out = [];
  for (const key of ["analogous", "complementary", "triadic", "neutral", "same", "lighter", "darker"]) {
    for (const id of c.relations[key] || []) {
      if (seen.has(id) || out.length >= 4) continue;
      const p = lib.find((x) => x.id === id);
      if (!p) continue;
      seen.add(id);
      out.push(p);
      break;
    }
  }
  return out;
}

function wrap(text, max) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines;
}

function cardSvg(c, S, { lib, dateLabel }) {
  const [W, H] = SIZES[S.size];
  const wide = S.size === "wide";
  const full = S.bg === "color";
  const surface = full ? c.hex : S.bg === "dark" ? "#14110E" : "#FFFDF8";
  const ink = full ? bestTextOn(c.hex) : S.bg === "dark" ? "#EFE8D9" : "#1E1A14";
  const muted = full ? ink : S.bg === "dark" ? "#A39A87" : "#6B6253";
  const mo = full ? 0.8 : 1;
  const u = wide ? 0.85 : 1;
  const pad = Math.round(64 * (wide ? 0.9 : 1));
  const x0 = wide && !full ? W / 2 + pad : pad;
  const colW = wide ? W / 2 - pad * 2 : W - pad * 2;
  const wrapMax = Math.floor(colW / (26 * u * 0.52));
  const out = [];
  const text = (x, y, size, fill, { weight = 400, family = FONT, opacity = 1, spacing = "", anchor = "" } = {}, str) =>
    out.push(`<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}"${opacity !== 1 ? ` opacity="${opacity}"` : ""}${spacing ? ` letter-spacing="${spacing}"` : ""}${anchor ? ` text-anchor="${anchor}"` : ""}>${esc(str)}</text>`);

  // content height first, so the color band takes whatever is left
  const partners = S.partners ? partnersOf(c, lib) : [];
  const kind = kindOf(c);
  const dd = S.dodont ? [[t("today.do"), t(`dd.${kind}.do`)], [t("today.dont"), t(`dd.${kind}.dont`)]] : [];
  const ddLines = dd.map(([, s]) => wrap(s, wrapMax - 8 - Math.round(Math.max(0, Math.max(...dd.map(([l]) => l.length)) - 5) * 0.6)));
  let need = 40 * u + 96 * u + (S.local ? 42 * u : 0) + 80 * u + 44 * u + (S.cmyk ? 44 * u : 0) + 56 * u; // meta, name, local, hex, rgb, cmyk, footer
  if (partners.length) need += (46 + Math.ceil(partners.length / 2) * 58) * u;
  if (dd.length) need += (30 + ddLines.reduce((n, l) => n + l.length, 0) * 32 + dd.length * 14) * u;
  const bandH = wide ? 0 : Math.max(H * 0.16, Math.min(H * 0.5, H - pad * 2 - need));
  let y = (wide ? pad : pad + bandH + pad * 0.7);

  let block = "";
  if (!full) {
    block = wide
      ? `<rect x="0" y="0" width="${W / 2}" height="${H}" fill="${c.hex}"/>`
      : `<rect x="${pad}" y="${pad}" width="${W - pad * 2}" height="${bandH}" rx="22" fill="${c.hex}"/>`;
  } else if (!wide) y = pad;
  if (wide && full) y = pad;

  const small = 24 * u;
  y += small;
  text(x0, y, small, muted, { family: MONO, opacity: mo }, `${dateLabel} · No. ${c.id} · ${t(`family.${c.family}`)}`);
  y += 92 * u;
  text(x0, y, 84 * u, ink, { weight: 650, spacing: "-0.02em" }, c.en);
  if (S.local) {
    y += 46 * u;
    text(x0, y, 30 * u, muted, { opacity: mo }, c.tr);
  }
  y += 78 * u;
  text(x0, y, 56 * u, ink, { weight: 600, family: MONO }, c.hex);
  y += 42 * u;
  text(x0, y, 24 * u, muted, { family: MONO, opacity: mo }, `RGB ${c.rgb.join(" ")}${S.cmyk ? `   CMYK ${c.cmyk.c} ${c.cmyk.m} ${c.cmyk.y} ${c.cmyk.k}` : ""}`);

  if (partners.length) {
    y += 52 * u;
    text(x0, y, 22 * u, muted, { opacity: mo }, t("today.partnersLabel"));
    partners.forEach((p, i) => {
      const col = i % 2, row = Math.floor(i / 2);
      const px = x0 + col * (colW / 2);
      const py = y + 18 * u + row * 58 * u;
      out.push(`<rect x="${px}" y="${py}" width="${34 * u}" height="${34 * u}" rx="8" fill="${p.hex}" stroke="${full ? ink : "#000"}" stroke-opacity="0.15"/>`);
      text(px + 46 * u, py + 25 * u, 24 * u, ink, {}, p.en.length > 20 ? `${p.en.slice(0, 19)}…` : p.en);
    });
    y += 18 * u + (Math.ceil(partners.length / 2) - 1) * 58 * u + 34 * u;
  }
  if (dd.length) {
    y += 40 * u;
    out.push(`<line x1="${x0}" y1="${y - 22 * u}" x2="${x0 + colW}" y2="${y - 22 * u}" stroke="${ink}" stroke-opacity="0.18"/>`);
    const off = Math.max(96, ...dd.map(([label]) => label.length * 15 + 28)) * u;
    dd.forEach(([label], i) => {
      text(x0, y, 23 * u, ink, { weight: 700 }, label);
      ddLines[i].forEach((line, j) => text(x0 + off, y + j * 32 * u, 23 * u, ink, { opacity: 0.9 }, line));
      y += ddLines[i].length * 32 * u + 14 * u;
    });
  }
  text(x0, H - pad * 0.7, 20 * u, muted, { opacity: full ? 0.75 : 1 }, t("today.cardFoot"));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${surface}"/>
${block}
${out.join("\n")}
</svg>`;
}

function copyBody(c, S, lib) {
  const lines = [t(`today.line.${S.tone}`, { name: c.en, hex: c.hex, id: c.id }), ""];
  lines.push(`HEX ${c.hex}    RGB ${c.rgb.join(",")}${S.cmyk ? `    CMYK ${c.cmyk.c}/${c.cmyk.m}/${c.cmyk.y}/${c.cmyk.k}` : ""}`);
  if (S.dodont) {
    const k = kindOf(c);
    lines.push(`${t("today.do")} → ${t(`dd.${k}.do`)}`, `${t("today.dont")} → ${t(`dd.${k}.dont`)}`);
  }
  if (S.partners) {
    const [a, b, d] = partnersOf(c, lib);
    if (a && b) lines.push(t("today.pairing", { main: c.en, second: a.en, accent: (d || b).en }));
  }
  lines.push("", t("today.allColors", { total: lib.length, url: `${location.host}/${LOCALE}/` }), "#ColorPalette #DesignResources #IndianColors #TraditionalColors");
  return lines.join("\n");
}

export default async function initToday(root) {
  const lib = await library();
  const params = new URLSearchParams(location.search);
  let date = /^\d{4}-\d{2}-\d{2}$/.test(params.get("d") || "") ? params.get("d") : isoDay(new Date());
  let color = byId(params.get("c")) || colorForDate(lib, date);
  const S = { size: "square", bg: "light", cmyk: true, partners: true, dodont: true, local: false, tone: "practical", preset: "" };

  const seg = (name, items) =>
    `<div class="join seg" role="group">${items.map(([v, label]) => `<button type="button" data-set="${name}" data-v="${v}" aria-pressed="false">${esc(label)}</button>`).join("")}</div>`;
  const toggle = (name, label) => `<label class="opt"><span>${esc(label)}</span><input class="toggle" type="checkbox" data-toggle="${name}"></label>`;

  root.appendChild(el(`<div class="tool today">
    <div class="tool-main">
      <div class="today-stage"><img data-preview alt=""></div>
      <div class="today-actions">
        <a class="btn btn-ghost" data-theme-link href="#">${icon("palette")}<span>${esc(t("today.useTheme"))}</span></a>
        <button type="button" class="btn" data-svg>${icon("download")}<span>SVG</span></button>
        <button type="button" class="btn btn-primary" data-png>${icon("download")}<span>PNG</span></button>
      </div>
      <div class="continue"><h3>${esc(t("today.continue"))}</h3>
        <div class="fchips" data-continue></div>
      </div>
    </div>
    <aside class="tool-side">
      <section class="side-sec"><h3>${esc(t("today.color"))}</h3>
        <div class="card">
          <div class="opt-block"><label class="opt-label" for="today-date">${esc(t("today.date"))}</label>
            <input id="today-date" class="input" type="date" value="${date}" data-date style="width:100%"></div>
          <div class="opt-block"><label class="opt-label" for="today-pick">${esc(t("today.pick"))}</label>
            <select id="today-pick" class="select" data-pick style="width:100%">${lib.map((c) => `<option value="${c.id}">No. ${c.id} · ${esc(c.en)} · ${c.hex}</option>`).join("")}</select></div>
          <div class="opt-block row-between"><span class="opt-label">${esc(t("today.change"))}</span>
            <div class="row"><button type="button" class="btn btn-icon btn-sm" data-step="-1" aria-label="${esc(t("ui.prev"))}">${icon("chevronLeft")}</button>
            <button type="button" class="btn btn-sm" data-random>${icon("shuffle")}<span>${esc(t("ui.random"))}</span></button>
            <button type="button" class="btn btn-icon btn-sm" data-step="1" aria-label="${esc(t("ui.next"))}">${icon("chevronRight")}</button></div></div>
        </div>
      </section>
      <section class="side-sec"><h3>${esc(t("today.format"))}</h3>
        <div class="card">
          <div class="opt-block"><span class="opt-label">${esc(t("today.size"))}</span><p class="hint">${esc(t("today.sizeHint"))}</p>
            ${seg("size", Object.keys(SIZES).map((k) => [k, t(SIZE_KEY[k])]))}</div>
          <div class="opt-block"><span class="opt-label">${esc(t("today.background"))}</span>
            ${seg("bg", [["color", t("today.bg.color")], ["light", t("today.bg.light")], ["dark", t("today.bg.dark")]])}</div>
          <div class="opt-block opt-list">${toggle("local", t("today.localName"))}${toggle("cmyk", t("today.cmyk"))}${toggle("partners", t("today.partners"))}${toggle("dodont", t("today.dodont"))}</div>
          <div class="opt-block"><span class="opt-label">${esc(t("today.presets"))}</span>
            <div class="fchips">${Object.keys(PRESETS).map((k) => `<button type="button" class="fchip" data-preset="${k}" aria-pressed="false">${esc(t(`today.preset.${k}`))}</button>`).join("")}</div></div>
        </div>
      </section>
      <section class="side-sec"><h3>${esc(t("today.tone"))}</h3>
        <div class="card"><div class="opt-block">${seg("tone", ["poetic", "practical", "trendy"].map((k) => [k, t(`today.tone.${k}`)]))}</div></div>
      </section>
      <section class="side-sec"><h3>${esc(t("today.copy"))}</h3>
        <div class="card"><div class="opt-block"><pre class="copybox" data-copybox></pre>
          <button type="button" class="btn btn-sm" data-copytext>${icon("copy")}<span>${esc(t("today.copyText"))}</span></button></div></div>
        <p class="hint" style="margin-top:8px">${esc(t("today.note"))}</p>
      </section>
    </aside>
  </div>`));

  let svgText = "";
  const dateLabel = () => new Intl.DateTimeFormat(LOCALE, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
  const fileBase = () => `${slugify(color.en)}-${date}-${S.size}`;

  function render() {
    svgText = cardSvg(color, S, { lib, dateLabel: dateLabel() });
    const img = $("[data-preview]", root);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    img.alt = `${color.en} ${color.hex}`;
    const [W, H] = SIZES[S.size];
    img.width = W;
    img.height = H;
    $("[data-pick]", root).value = color.id;
    $("[data-theme-link]", root).href = `${pageUrl("theme/")}?c=${color.id}`;
    $("[data-continue]", root).innerHTML =
      `<a class="fchip" href="${colorUrl(color.id)}">${esc(t("grad.details"))}</a>` +
      NEXT.map(([slug, key]) => `<a class="fchip" href="${pageUrl(`${slug}/`)}?c=${color.id}">${esc(t(key))}</a>`).join("");
    for (const b of $$("[data-set]", root)) b.setAttribute("aria-pressed", String(S[b.dataset.set] === b.dataset.v));
    for (const i of $$("[data-toggle]", root)) i.checked = !!S[i.dataset.toggle];
    for (const b of $$("[data-preset]", root)) b.setAttribute("aria-pressed", String(S.preset === b.dataset.preset));
    $("[data-copybox]", root).textContent = copyBody(color, S, lib);
  }

  function setColor(c) {
    color = c;
    setParam("c", c.id);
    render();
  }
  function saveBlob(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => (URL.revokeObjectURL(a.href), a.remove()), 0);
  }

  root.addEventListener("click", (e) => {
    const s = e.target.closest("[data-set]");
    if (s) {
      S[s.dataset.set] = s.dataset.v;
      S.preset = "";
      render();
    }
    const p = e.target.closest("[data-preset]");
    if (p) {
      Object.assign(S, PRESETS[p.dataset.preset], { preset: p.dataset.preset });
      render();
    }
    const st = e.target.closest("[data-step]");
    if (st) {
      const i = lib.findIndex((c) => c.id === color.id);
      setColor(lib[(i + Number(st.dataset.step) + lib.length) % lib.length]);
    }
    if (e.target.closest("[data-random]")) setColor(randomColor(lib, color.id));
    if (e.target.closest("[data-copytext]")) copyText($("[data-copybox]", root).textContent);
    if (e.target.closest("[data-svg]")) saveBlob(new Blob([svgText], { type: "image/svg+xml" }), `${fileBase()}.svg`);
    if (e.target.closest("[data-png]")) {
      const [W, H] = SIZES[S.size];
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        canvas.getContext("2d").drawImage(img, 0, 0, W, H);
        canvas.toBlob((blob) => blob && saveBlob(blob, `${fileBase()}.png`), "image/png");
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
    }
  });
  root.addEventListener("change", (e) => {
    const tg = e.target.closest("[data-toggle]");
    if (tg) {
      S[tg.dataset.toggle] = tg.checked;
      S.preset = "";
      render();
    }
    if (e.target.matches("[data-pick]")) setColor(byId(e.target.value));
    if (e.target.matches("[data-date]") && e.target.value) {
      date = e.target.value;
      color = colorForDate(lib, date);
      setParam("d", date);
      setParam("c", null);
      render();
    }
  });

  render();
}
