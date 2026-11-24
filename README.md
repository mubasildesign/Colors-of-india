# Colors of India

A free, open source web tool for traditional Indian colors: 999 named colors with English names, romanized traditional names, approximate sRGB values, 36 states and union territories with five-color palettes, and tools for palettes, scene previews, UI themes and terminal themes.

Live site: https://colors.mubasil.me
Source: https://github.com/mubasildesign/Colors-of-india

Interface languages: English (default), Tamil, Hindi, Telugu. Color names are English everywhere. The welcome card greets visitors in 13 Indian languages and scripts.

## Pages

| Group | Pages |
| --- | --- |
| Find | Browse color cards, All colors, States of India, Color explorer, Color dictionary, one detail page per color |
| Palettes | Palette generator (five roles, lockable, Space to regenerate), Palette ideas (harmonies and curated sets), Usage cards (WCAG text/background pairs), Gradients |
| Apply | Scene preview (web, slide, poster, mobile mocks), Theme generator (product dashboard mock, shadcn/ui, daisyUI 5 and JSON export), Terminal themes (Ghostty, Alacritty, Kitty, WezTerm, Windows Terminal) |
| Share | Color of the day (SVG and PNG card), Saved (colors and palettes in localStorage), Skills (SKILL.md for AI agents) |

**States of India** shows 28 states and 8 union territories. Each has five library colors that suggest the place (its festivals, crafts, landscapes or food), a short English note, a legend linking to each color, copy and save actions, a scene preview link, and region and text filters.

The shell has search (⌘K or `/`), light/dark/system theme, an accent color (the filled primary, like daisyUI), a collapsible icon sidebar with tooltips, a mobile drawer and a language menu. Preferences are stored in `localStorage` under `itc.prefs`.

## Welcome card

A small card opens once per browser. It greets the visitor in 13 languages (English, Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Odia, Assamese, Sanskrit), cycling every two seconds. A countdown bar runs for 30 seconds, then the card closes. Hovering or focusing inside the card pauses the timers. The card is remembered in `localStorage` under `itc.welcome`, so it does not return. Text and greetings are in `data/welcome.json`.

## Design system

A warm base so the colors are the only strong color on the page: Geist and Geist Mono (Noto Sans for Tamil, Devanagari and Telugu), 1px warm borders (`#E6DDCB` light, `#322D25` dark), near-flat surfaces and a default accent of Peacock Blue (`#0F5F7C`). The ten accent choices are named after Indian colors: Peacock Blue, Neel Blue, Mor Teal, Paan Leaf, Turmeric, Kesar Saffron, Terracotta, Sindoor, Rani Pink and Jamun.

Component class names follow daisyUI's vocabulary (`btn`, `join`, `badge`, `toggle`, `tabs`, `kbd`, `card`, `input`, `select`, `dropdown`), but the CSS is self-contained in `src/assets/site.css`. daisyUI is not loaded from a CDN, so the site keeps zero runtime dependencies. The theme generator exports daisyUI 5 `@plugin "daisyui/theme"` blocks for projects that do use it.

### India in the details

- **Toran** (pennant garland): the strip across the top bar, the welcome card and the value index dialog. It drifts slowly.
- **Jaali** (carved lattice): page headers and the author card.
- **Ogee and buta** motifs: a faint background ground and card corners. Low opacity, and a warmer gold in dark mode.
- **Kolam**: the divider above the footer.
- **Diya** (clay lamp): the loading screen, with a flickering flame. Also a custom icon.
- **Paisley**: a custom icon. The rangoli lozenge is the logo mark.
- **Hanging ornament**: top right corner, a damped pendulum that sways gently and reacts to hover and click. Hidden on small screens.
- **Gulal burst**: a short burst of color when you copy a value, like powdered color at Holi.

All motion is disabled under `prefers-reduced-motion`.

## License and attribution

MIT, see `LICENSE`.

The color library, the names, the hex values, the state notes and the UI strings were written for this project. The names were drawn from general knowledge of Indian vocabulary (spices, flora, textiles, pigments, festivals, crafts and places). They were not copied from another color library, paint catalog or dataset. Common color words (for example Turmeric, Saffron, Indigo, Vermilion) may also appear in other catalogs; that is ordinary vocabulary, not copying.

The tool set and the layout were inspired by [xiaoxiaodong.ai](https://xiaoxiaodong.ai) and by the public project (GPL-3.0). Only the general idea (which tools to offer) was taken; no code, data or assets were copied from either. If you ever copy code from that project into this one, this repository must be relicensed under GPL-3.0 as well.

Brand names used in the site (shadcn/ui, daisyUI, Ghostty, Alacritty, Kitty, WezTerm, Windows Terminal, Geist, Google Fonts) are referenced for export targets and credit only. Their logos are not used. The GitHub and LinkedIn icons link to the author's profiles.

Icons: Phosphor Icons (MIT). Motifs and the rangoli mark: drawn for this project.

## Requirements

- Node.js 18 or newer
- No npm dependencies

## Commands

```bash
npm run build    # generate dist/ (about 4,050 HTML pages, SVG cards, sitemap, robots, llms.txt, SKILL.md)
npm run verify   # data, contrast, theme, terminal, role palette, SEO/hreflang, link and locale checks
npm run check    # build, then verify
npm run serve    # serve dist/ at http://localhost:8080
```

Set `SITE_URL` before building to set canonical, sitemap and `llms.txt` URLs. The default is `http://localhost:8080`.

## Deployment

The generated `dist/` folder is not committed. The host builds it.

**Cloudflare Pages** (the live site uses this)
- Build command: `npm run build`
- Build output directory: `dist`
- Build variables: `SITE_URL=https://colors.mubasil.me`, `NODE_VERSION=20`
- Custom domain: add the subdomain in the Pages project, then a CNAME record at your DNS provider pointing to the `*.pages.dev` address.

**Netlify**: `netlify.toml` sets the build command, the publish folder and Node 20. Add `SITE_URL` in the site's environment variables.

**Cloudflare Workers**: `wrangler.jsonc` serves `dist/` as static assets. Pages ignores this file.

## Layout

- `data/colors.json`: the color library (`en`, `tr` romanization, `hex`, `family`, `cat`; legacy `ta`/`taRoman` fields are kept in the source but not published)
- `data/states.json`: the 36 states and union territories, with names in four languages, region, English note and five library color names
- `data/welcome.json`: the welcome card title, paragraphs and 13 greetings
- `data/site.json`: author, portfolio, repository, LinkedIn and license links, plus the inspiration credit
- `data/strings/{en,ta,hi,te}.json`: UI strings per locale
- `src/lib/color.js`: color math (sRGB, HSL, CMYK, Lab, OKLab/OKLCH), WCAG contrast, harmony relations
- `src/lib/palette.js`: role palettes, usage pairs, OKLCH theme tokens and exports, terminal palettes and exports
- `src/lib/icons.js`: icon helpers, custom India motifs (diya, paisley) and the rangoli logo mark
- `src/lib/icon-data.js`: generated Phosphor Icons (MIT), regular and fill. Regenerate with `node scripts/gen-icons.mjs`
- `src/assets/app.js`: boots the shell and loads `src/assets/js/pages/<page>.js` for the current page
- `src/assets/js/`: `core.js` (strings, library, copy, saved items, search), `shell.js` (theme, accent, sidebar, ⌘K, drawer, value index, ornament, welcome card), `picker.js` (anchor color picker), `pages/states.js` (States of India filters)
- `scripts/build.mjs`: static site generator. It validates `states.json` and `welcome.json` and fails the build on errors.
- `scripts/verify.mjs`: checks run against the source and `dist/`

## What verify checks

- Site tokens: text, secondary text and muted text reach 4.5:1 on every surface in light and dark.
- Theme generator: every text pair in `THEME_TEXT_PAIRS` for all 999 anchors in both modes (foreground 7:1, others 4.5:1), and primary at 3:1 on the background.
- Terminal themes: all 12 colored slots at 3:1 or more and foreground at 7:1, for every anchor, both modes and all three depths.
- Role palettes: headline and body 4.5:1, button 3:1, for every anchor and harmony method.
- Curated collection and preset names exist in the library; client string keys exist in `en.json`.
- Every page has title, description, canonical, five hreflang links and the sidebar; no broken internal links; no Tamil color words outside the Tamil UI.

The build also checks that every state has exactly five colors that exist in the library, a valid region and a name in each language, and that the welcome card has 13 complete greetings.

## Caveats

- **Hex values are approximate.** They have not been checked against a pigment, dye or textile reference.
- **Tamil, Hindi and Telugu UI strings are machine-drafted** and marked in `_status`. They need native-speaker review.
- **The welcome card text is English** in every locale, and its 13 greetings need native-speaker review.
- **State notes are English only**, and state palettes are interpretations, not official color standards.
- **Mock content** in scene previews and the product dashboard is English in every locale.
- **Harmony results** are computed from the library. Some harmony groups are thin, so fallback picks may be weaker.
- **PNG export** on Color of the day draws the SVG to a canvas, so it uses system fonts instead of Geist.
- **Fonts** load from Google Fonts.

## Site details

- `data/site.json` holds the author, portfolio, GitHub repository, LinkedIn and license links used by the top bar, footer and home page. Edit it and rebuild; nothing else needs changing.
- Value index: the list button on the home and All colors pages opens every color in a searchable dialog. A row copies "name HEX"; the button copies the whole (filtered) list.
- `/llms.txt`, `/llms-full.txt`, `/data/colors.csv` and `/data/colors.json` are generated on every build.
- Motion (toran drift, ornament sway, diya flicker, gulal burst on copy, rising cards, welcome countdown) is disabled or reduced under `prefers-reduced-motion`.

## Contributing

- Feedback, new colors and better color names: https://mubasil.me/contact
- Issues and pull requests: https://github.com/mubasildesign/Colors-of-india
