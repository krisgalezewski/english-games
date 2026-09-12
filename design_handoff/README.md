# Handoff: English Games — bento redesign + shared stylesheet

## Overview

`krisgalezewski.github.io/english-games` is a static GitHub Pages site of 14 English-learning
browser games plus an index page. Today each game page carries its own styling. This handoff
covers two jobs, to be done **in this order**:

1. **Design** — apply one shared bento visual system across the index and all 14 game pages.
2. **Correctness** — audit each game so it plays reliably, one game (or small batch) at a time.

Do not bundle them. Reskinning is mechanical and low-risk; gameplay fixes are not. Mixing both
in one diff makes it impossible to tell which change broke what.

Related sites by the same author, to stay visually consistent with:
- `krisgalezewski.github.io/english-quiz`
- `krisgalezewski.github.io/english-lens`

## About the design files

The HTML files in this bundle are **design references created in HTML** — prototypes showing the
intended look, structure and states. They are not production code to paste in. The target repo is
plain static HTML/CSS/JS on GitHub Pages with no build step, so the right move is to lift the
**tokens, classes and measurements** from `styles.css` (included, production-ready) and apply them
to the existing pages. Keep the repo build-free: no bundler, no framework, no npm.

## Fidelity

**High fidelity.** Colours, type, spacing, radii and interaction states are final. Match them
exactly. The one exception is game artwork: the SVG motifs are flat geometric placeholders in the
right visual language, and may be replaced with better artwork later.

---

## Files in this bundle

| File | What it is |
|---|---|
| `styles.css` | **The deliverable.** Production shared stylesheet — tokens + all component classes. Drop into the repo root. |
| `game-of-the-week.js` | Production date-driven rotation for the featured tile. Drop into the repo root. |
| `English Games - Bento.dc.html` | Design reference: the full index page. |
| `Game Shell Kit.dc.html` | Design reference: the shared in-game screens (mode select, in play, game over) + token swatches. |

The `.dc.html` files open directly in a browser. Open them side by side with the pages you are
editing.

---

## Job 1 — the design

### 1.1 Shared stylesheet

Add `styles.css` to the repo root and link it from **every** page:

```html
<link rel="stylesheet" href="styles.css">
```

Then delete each page's local styling as you convert it. Any per-game CSS that survives should be
only that game's playfield (canvas, board grid, animation keyframes) — never colours, type, buttons,
or chrome. If you find yourself writing a hex code in a game file, it belongs in `styles.css` as a
token instead.

Font: **Archivo** (Google Fonts, variable width 75–125, weight 400–900). Already `@import`ed at the
top of `styles.css`. For faster paint, also add preconnect + a direct `<link>` in each page's
`<head>` and drop the `@import`.

### 1.2 The index page

See `English Games - Bento.dc.html`. Structure, top to bottom:

1. **Header** — wordmark "English Games" + "with Kris", nav (Fast Lane / Arcade / Workshop / Long Game / Leaderboard) and a pill button jumping to the game of the week.
2. **Hero row** — hero tile (`.eg-tile--hero`, `--eg-surface`) with H1 "Play your way to fluency" and three stats (14 games / 4 rooms / 1 leaderboard), beside the **game of the week** tile (`--eg-teal-deep`).
3. **The Fast Lane** — WordSnake (teal), WordDrop (red). Moving targets, real-time input.
4. **The Arcade** — Affix Runner (green), English Ace (dark). Reflex games with high scores.
5. **The Workshop** — Conditional Constructor (gold), Irregular Verb Sprint (teal-deep). In-depth practice of one structure.
6. **The Long Game** — the remaining 8 games as `.eg-card` in an auto-fit grid. Self-paced, streak- or round-based.
7. **Leaderboard row** — wide leaderboard tile + two cross-link cards (English Quiz, English Lens).
8. **Footer**.

Group names are part of the design — keep them. Every section head is title-left / meta-right
(`.eg-section-head`).

Gutter is `14px` everywhere (`--eg-gap`). Rows are flex-wrap with `flex: 1 1 <basis>`, so tiles
reflow to one column on narrow screens without media queries. Card grid is
`repeat(auto-fit, minmax(260px, 1fr))`.

### 1.3 Game of the week

`game-of-the-week.js` rotates the featured tile from the ISO week number — deterministic, so every
student sees the same game, and the cycle repeats every 14 weeks. No Monday edit required.

Markup contract for the tile:

```html
<a id="gotw" class="eg-tile eg-tile--teal-deep" href="#">
  <div class="eg-row" style="justify-content:space-between;align-items:center">
    <span class="eg-badge">Game of the week</span>
    <span class="eg-eyebrow eg-eyebrow--on-color" data-gotw="week"></span>
  </div>
  <div class="eg-art">
    <svg data-gotw-art="wordsnake" hidden>…</svg>
    <svg data-gotw-art="worddrop"  hidden>…</svg>
    <!-- one per game -->
  </div>
  <h2 class="eg-h3" data-gotw="title"></h2>
  <p class="eg-body" data-gotw="blurb"></p>
  <span class="eg-link">Play this week's pick →</span>
</a>
```

Server-side rendering is not possible on GitHub Pages, so this runs client-side. Put honest
fallback text in the `data-gotw` elements so the tile is never blank if JS fails.

To change the order, reorder `EG_GAMES`. To force a specific game for a week, special-case it at
the top of `gameOfTheWeek()`.

### 1.4 Game pages

See `Game Shell Kit.dc.html`. Every game reuses the same four screens, which is why one shell
serves all 14 — do **not** design each game separately.

**Mode select** — back link + best score, eyebrow + game title + blurb, mode cards in an auto-fit
grid (selected mode takes the game's accent colour; others are `.eg-card`), then Start / How to play.
Games with a single mode skip the mode cards and keep the rest.

**In play** — `.eg-hud` stat row (Score / Streak / Round / Time; omit what a game doesn't track),
`.eg-progress` bar, `.eg-prompt` (cream ground, black ink — the focal point), `.eg-options` grid,
then `.eg-feedback`. Arcade games (Affix Runner, English Ace, WordSnake, WordDrop) replace prompt +
options with their canvas but keep the HUD and progress bar unchanged.

**Game over** — score tile (`--eg-teal-deep`) with `.eg-display` score, three summary stats, Submit
score + Play again, beside a `.eg-board` leaderboard card with the player's row marked `.is-you`.

**Artwork** — one flat geometric SVG motif per game, sitting in an `.eg-art` well (a darkened version
of the parent tile colour). Single colour, opacity steps of 1 / .75 / .6 / .45 / .35, no gradients,
no strokes under 4px. Tile viewBox ≈ 300×110–130; card viewBox ≈ 260×80. All 14 motifs are in the
two reference files — copy them verbatim.

### 1.5 Per-game accent

| Game | Tile class / accent |
|---|---|
| WordSnake | `eg-tile--teal` |
| WordDrop | `eg-tile--red` |
| Affix Runner | `eg-tile--green` |
| English Ace | `eg-tile--dark` |
| Conditional Constructor | `eg-tile--gold` |
| Irregular Verb Sprint | `eg-tile--teal-deep` |
| WordSpark, WordChain, Anagram, Word Builder | `eg-card eg-card--teal` |
| PhrasalBlitz, SpellIt! | `eg-card eg-card--gold` |
| CollocationCrash | `eg-card eg-card--rose` |
| Dictation Drill | `eg-card eg-card--green` |

A game's accent is the same on the index tile and inside the game — that continuity is what makes
the site feel like one product.

---

## Job 2 — gameplay audit

Only after the design is applied and committed. **One game per session**, or batches of 2–3 at most.
Large scopes are where regressions come from.

Per game, check:

- **Start and restart.** A second run after "Play again" behaves identically to the first: timers reset, no stacked intervals, no leaked event listeners, score back to zero.
- **Timers.** `clearInterval` / `cancelAnimationFrame` on end, on restart, and on `visibilitychange` (a backgrounded tab must not burn the clock).
- **Answer checking.** Trim whitespace, normalise case, accept legitimate alternative answers (both British and American spellings where relevant).
- **Question pool.** No repeats within a run; the pool is large enough for the round count; shuffling is real (Fisher–Yates, not `sort(() => Math.random() - .5)`).
- **Edge inputs.** Empty submit, Enter on an empty field, rapid double-click, answering after time expires, keyboard-only play.
- **Scoring.** Streak multipliers reset on a wrong answer; the score submitted to the leaderboard equals the score shown.
- **Mobile.** Touch targets ≥ 44px, no fixed widths, no hover-only affordances. Canvas games need touch controls, not just arrow keys.
- **Accessibility.** Options reachable by keyboard with a visible focus ring; feedback announced via `aria-live`; `prefers-reduced-motion` respected (already handled in `styles.css`).

Keep a short `AUDIT.md` in the repo: one row per game, what was found, what was fixed. It is the
only way to know where you are 14 games in.

---

## Design tokens

Authoritative list is `:root` in `styles.css`. Summary:

**Surfaces** — bg `#0A0A0A` · surface `#121212` · card `#141414` · card hover `#1B1B1B` · border `#1F1F1F` · border strong `#2A2A2A`

**Ink** — primary `#F4EFE6` · muted `#C9C3B8` · dim `#A39D93` · faint `#8F8980` · on-light `#0A0A0A`

**Accent tiles** — teal deep `#0E4655` · teal `#11736A` · green `#12632F` · red `#96162F` · gold `#8A6510`

**Accent tints** (labels on dark cards only, never a tile background) — teal light `#45A89B` · green light `#7FB08D` · gold light `#D9A520` · rose `#CF4F66`

**Radii** — tile 20 · card 16 · well 14 · inner 12 · pill 999

**Spacing** — gutter 14 · small gap 10 · tile padding `clamp(22px,2.6vw,32px)` · hero padding `clamp(26px,3vw,44px)` · card padding 20 · section gap 44

**Type** — Archivo. Display: weight 900, `font-stretch` 110–115%, uppercase, line-height .9–1.05.
Body: weight 400, line-height 1.5, `text-wrap: pretty`. Eyebrow: 11–11.5px, weight 700,
letter-spacing .2em, uppercase.

**Motion** — 140ms ease on background/border; 300ms ease on the progress bar. Nothing longer.

### Two rules that are easy to break

1. **Text on a colour tile is full-opacity `#F4EFE6`.** Never alpha-muted, never `color-mix`. Muted greys are for dark surfaces only. This is a contrast requirement, not a preference.
2. **Accent tints are ink, not ground.** `#D9A520`, `#45A89B`, `#CF4F66`, `#7FB08D` are for labels and SVG motifs on dark cards. Using one as a tile background fails contrast against cream text — use the deeper variant.

## Assets

No image assets. All artwork is inline SVG in the reference files. Archivo loads from Google Fonts.

## Suggested commit sequence

1. `styles.css` + index converted, all 14 tiles and motifs in place.
2. `game-of-the-week.js` + the rotating tile.
3. Shell applied to one game end to end (**PhrasalBlitz** is the best first case — three modes, so it exercises every screen). Review before continuing.
4. Remaining 13 games, in small batches.
5. Gameplay audit, one game per session, `AUDIT.md` updated each time.
