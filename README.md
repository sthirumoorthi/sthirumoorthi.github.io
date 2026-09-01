# sthirumoorthi.github.io

Personal portfolio for **Thirumoorthi Samiyappan — Technical Architect**.
Static HTML, one CSS file, one JS file. No build step, no dependencies.

## Structure

```
index.html            one page, five views (Overview / Projects / Reference Hub / Resume & Skills / Contact)
assets/
  css/style.css        design tokens + all styling
  js/main.js           view routing, theme, command palette, project tools, motion
.nojekyll              serve files as-is on GitHub Pages
```

## How it works

It is a **single page** with client-side view switching (hash routing —
`#overview`, `#projects`, …). Every view is real HTML in the document, so it is
crawlable and works with JavaScript disabled — without JS the five views simply
stack into one long scrollable page.

### Interactive features (all vanilla JS)

- **Nav** — pill navigation switches views without a reload; back/forward and
  deep links (`/#projects`) work
- **Quick search (⌘K / Ctrl-K)** — command palette over sections, projects, and
  reference notes; arrow keys + enter; jumps to the item and flashes it
- **Projects** — category filter, live text search (title + tech), sort
  (featured / A–Z / newest), and a grid ⇄ list layout toggle
- **Theme** — light / dark, follows the OS by default; the header toggle
  overrides and remembers the choice in `localStorage`
- **AI Copilot / Studio Manager** — visual affordances from the design; on the
  public site they show a short "not here" toast

### Motion

Scroll-reveal, view-enter transitions, stat count-up, hover micro-interactions.
Everything is disabled under `prefers-reduced-motion` (block at the end of
`style.css`).

## Design

- **Style** — editorial / studio. Warm paper background, high-contrast serif
  display, monospace for labels and chips.
- **Type** — Fraunces (display + italic), Inter (text), JetBrains Mono (labels).
- **Colour** — near-monochrome with one deep-green accent. Reskin by changing
  `--accent` and the `--paper` ramp in the `:root` block of `style.css`.

## Editing

Search the files for `EDIT`. The important spots:

- `you@example.com` — hero, contact, and footer
- `your-handle` — LinkedIn URL
- Hero positioning line and the focus-area chips in the Overview view
- The five project cards in `#projects` — update `data-cat`, `data-featured`,
  `data-date`, `data-title`, `data-tech` **and** the visible text to match, and
  point each `href="#"` at a repo / demo / write-up
- The six notes in `#references` — point each at your write-up
- Experience, education, and skill lists in `#resume`; link the résumé PDF
- The stat numbers in the Overview view

Asset links carry `?v=4` for cache-busting — bump the number when you change
`style.css` or `main.js` so returning visitors get the update.

## Preview locally

```bash
cd portfolio && python3 -m http.server 8000
```

Then open http://localhost:8000

## Deploy

GitHub Pages serves the `main` branch at `https://sthirumoorthi.github.io`.
Push to `main` and it is live in a minute or two.
