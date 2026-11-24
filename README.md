# Colors of India

A static color tool for traditional Indian colors: 999 named colors with English names, romanized traditional names, approximate sRGB values, and tools for palettes, scene previews, UI themes and terminal themes.

Interface languages: English (default), Tamil, Hindi, Telugu. Color names are English everywhere.

## Pages

| Group | Pages |
| --- | --- |
| Find | Browse color cards, All colors, Color explorer, Color dictionary, one detail page per color |
| Palettes | Palette generator (five roles, lockable, Space to regenerate), Palette ideas (harmonies and curated sets), Usage cards (WCAG text/background pairs), Gradients |
| Apply | Scene preview (web, slide, poster, mobile mocks), Theme generator (product dashboard mock, shadcn/ui, daisyUI 5 and JSON export), Terminal themes (Ghostty, Alacritty, Kitty, WezTerm, Windows Terminal) |
| Share | Color of the day (SVG and PNG card), Saved (colors and palettes in localStorage), Skills (SKILL.md for AI agents) |

The shell has search (⌘K or `/`), light/dark/system theme, an accent color (the filled primary, like daisyUI), a collapsible icon sidebar and a language menu. Preferences are stored in `localStorage` under `itc.prefs`.

## Design system

Warm monochrome UI: Geist and Geist Mono, 1px `#EAEAEA` borders, near-flat surfaces, color reserved for the colors themselves. Component class names follow daisyUI's vocabulary (`btn`, `join`, `badge`, `toggle`, `tabs`, `kbd`, `card`, `input`, `select`, `dropdown`) but the CSS is self-contained in `src/assets/site.css`. daisyUI is not loaded from a CDN, so the site keeps zero runtime dependencies. The theme generator exports daisyUI 5 `@plugin "daisyui/theme"` blocks for projects that do use it.

## License and attribution

MIT, see `LICENSE`. The code, the color library, the names and the UI strings are original work.

The tool set and layout were inspired by [colors.xiaoxiaodong.ai](https://colors.xiaoxiaodong.ai) and by the public project [nevertoday/zhongguo-traditional-colors](https://github.com/nevertoday/zhongguo-traditional-colors) (GPL-3.0). Only the general idea (which tools to offer) was taken; no code, data or assets were copied. If you ever copy code from that project into this one, this repository must be relicensed under GPL-3.0 as well.

## Requirements

- Node.js 18 or newer
- No npm dependencies

## Commands

```bash
npm run build    # generate dist/ (4052 HTML pages, SVG cards, sitemap, robots, llms.txt, SKILL.md)
npm run verify   # data, contrast, theme, terminal, role palette, SEO/hreflang, link and locale checks
npm run check    # build, then verify
npm run serve    # serve dist/ at http://localhost:8080
```

Set `SITE_URL` before building to set canonical and sitemap URLs (default `http://localhost:8080`).

## Layout

- `data/colors.json`: the color library (`en`, `tr` romanization, `hex`, `family`, `cat`; legacy `ta`/`taRoman` fields are kept in the source but not published)
- `data/strings/{en,ta,hi,te}.json`: UI strings per locale
- `src/lib/color.js`: color math (sRGB, HSL, CMYK, Lab, OKLab/OKLCH), WCAG contrast, harmony relations
- `src/lib/palette.js`: role palettes, usage pairs, OKLCH theme tokens and exports, terminal palettes and exports
- `src/lib/icons.js`: icon helpers, custom India motifs (diya, paisley) and the rangoli logo mark
- `src/lib/icon-data.js`: generated Phosphor Icons (MIT), regular and fill. Regenerate with `node scripts/gen-icons.mjs`
- `src/assets/app.js`: boots the shell and loads `src/assets/js/pages/<page>.js` for the current page
- `src/assets/js/`: `core.js` (strings, library, copy, saved items, search), `shell.js` (theme, accent, sidebar collapse, ⌘K, drawer), `picker.js` (anchor color picker)
- `scripts/build.mjs`: static site generator
- `scripts/verify.mjs`: checks run against the source and `dist/`

## What verify checks

- Site tokens: text, secondary text and muted text reach 4.5:1 on every surface in light and dark.
- Theme generator: every text pair in `THEME_TEXT_PAIRS` for all 999 anchors in both modes (foreground 7:1, others 4.5:1), and primary at 3:1 on the background.
- Terminal themes: all 12 colored slots at 3:1 or more and foreground at 7:1, for every anchor, both modes and all three depths.
- Role palettes: headline and body 4.5:1, button 3:1, for every anchor and harmony method.
- Curated collection and preset names exist in the library; client string keys exist in `en.json`.
- Every page has title, description, canonical, five hreflang links and the sidebar; no broken internal links; no Tamil color words outside the Tamil UI.

## Caveats

- **Hex values are approximate.** They have not been checked against a pigment, dye or textile reference.
- **Tamil, Hindi and Telugu UI strings are machine-drafted** and marked in `_status`. They need native-speaker review.
- **Mock content** in scene previews and the product dashboard is English in every locale.
- **Harmony results** are computed from the library. Some harmony groups are thin, so fallback picks may be weaker.
- **PNG export** on Color of the day draws the SVG to a canvas, so it uses system fonts instead of Geist.
- **Fonts** load from Google Fonts. **SITE_URL** defaults to localhost; set it before deploying.

## Site details

- `data/site.json` holds the author, portfolio, GitHub repository, LinkedIn and license links used by the top bar, footer and home page. Edit it and rebuild; nothing else needs changing.
- Value index: the list button on the home and All colors pages opens every color in a searchable dialog. A row copies "name HEX"; the button copies the whole (filtered) list.
- `/llms.txt`, `/llms-full.txt` and `/data/colors.csv` are generated on every build.
- Motion (kolam and toran drift, diya flicker, gulal burst on copy, rising cards) is disabled under `prefers-reduced-motion`.
