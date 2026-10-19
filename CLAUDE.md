# CLAUDE.md

Notes for Claude sessions working in this repo. Read this first; it is meant to save you from reading the whole trainer.

## What's here

| Path | What it is |
| --- | --- |
| `preflop-seat-drill.html` | The trainer page (~75 KB, ~1,060 lines): every tab's HTML and CSS, then one `<script src>` tag per file in `js/`. No build step. |
| `js/` | The trainer's JavaScript, one plain script per section (~250 KB in all), loaded in order by the page. |
| `index.html` | Site root; forwards to the trainer, keeping any `#tab` hash. |
| `docs/texas-holdem-strategy.md` | The strategy guide the drills are built on (~50 KB). Read it only for poker content, not for code work. |
| `tests/trainer.spec.js` | Playwright browser test, run on every PR. |
| `app/` | iPhone app (Capacitor 8, SPM). Wraps the same page; see `app/README.md`. |
| `.github/workflows/` | `browser-tests.yml` (every PR and push to main) and `ios.yml` (simulator build when `app/**`, `js/**` or the page changes). |

Live site: https://awsmtheo.github.io/PokerTrainer/ (GitHub Pages from `main`). The repo is public: never commit secrets.

Older copies of the page and the guide sit in the project's shared folder (`/mnt/project-files/New folder/…`). They are stale originals; always edit the repo copy.

## Reading the trainer page

Don't read the files top to bottom. Print the section map, then read only the ranges you need with `sed -n 'START,ENDp'` or Read with an offset:

```
grep -n -E '^/\* |<!-- =====' preflop-seat-drill.html
grep -n -E '^/\* -{5,}' js/*.js
```

The first lists every CSS section (`/* Pot odds drill */`) and every HTML section (`<!-- ===== Pot odds drill ===== -->`); the second lists the sub-sections inside each JS file (`/* ---------- Workbench ---------- */`). Line numbers move with every PR, so trust the grep, not remembered numbers.

The page has three blocks in this order:

1. **`<style>`**: tokens on `:root` (dark mode in `@media (prefers-color-scheme: dark)`), shared layout, then one section per drill in tab order, then the phone tab bar, Session log, Progress and review (which also holds the Daily `.dy` styles), Move your progress.
2. **HTML** inside `<div class="app">`: `<header class="top">` with the tab bar (`nav.tabs`), title (`#app-title`, `#app-tag`) and the Review misses dropdown (`details#rv`); then `<main>` with one `<section class="view" id="view-…" role="tabpanel">` per tab; then `details#sv` (Move your progress) at the bottom.
3. **`<script src="js/….js">` tags**, one per file, in this order:

| File | Section |
| --- | --- |
| `js/core.js` | Shared helpers (`$`, cards, `rand`/`pick`/`shuffle`), storage (`STORE`, `loadJSON`, `saveJSON`, `prefs`), currency (`CUR`, `money`, `cash`), `armReset` |
| `js/seats.js` | SEAT DRILL |
| `js/pot-odds.js` | POT ODDS DRILL (with Workbench) |
| `js/board.js` | BOARD TEXTURE DRILL |
| `js/opponents.js` | OPPONENT DRILL |
| `js/sessions.js` | SESSION LOG (bankroll bands `BK_BANDS` at its start, the Currency switch at its end) |
| `js/review.js` | PROGRESS AND REVIEW |
| `js/daily.js` | DAILY SET |
| `js/full-hand.js` | FULL HAND DRILL |
| `js/save.js` | MOVE YOUR PROGRESS |
| `js/tabs.js` | TABS AND KEYS (`TABS`, `setTab`, arrow keys, the keyboard handler), and last the init calls |

The files are plain classic scripts (not modules, which `file://` blocks) that share one global scope: each starts with `'use strict'`, and a top-level `const`, `let` or `function` in one file is visible to all the others. So a name must be unique across all of `js/`, and code that runs while a file loads (not inside a function or handler) may only use names from that file or an earlier one; init calls belong at the end of `tabs.js`. Never name a top-level binding `top`, `window`, `document` or `location` (the browser throws).

## The tabs

All storage keys are `preflop-seat-drill:v1:<suffix>` (`STORE + ':suffix'` in code). `prefs` (`:prefs`) holds shared settings: `fmt`, `deal`, `tab`, `potCat`, `cur`.

| Tab | Hash | Panel | HTML id prefix (score bar) | State / record | Storage suffix | Main functions |
| --- | --- | --- | --- | --- | --- | --- |
| Daily | `#daily` | `#view-daily` | `dy-` | `dy`, `dyData` | `:daily` | `dyEnter`, `dyDeal`, `dyRecord`, `renderDy` |
| Seats | `#seats` | `#view-seats` | none (`st-`) | `state`, `stats`, `FORMATS` | `:stats` | `newHand`, `dealHand`, `answer` |
| Pot odds | `#pot-odds` | `#view-pot` | `q-`, `w-` workbench (`pst-`) | `pot`, `potStats` | `:pot` | `makeQuestion`, `showQuestion`, `answerPot`, `renderPot`, `updateBench`, `buildTables` |
| Board | `#board-texture` | `#view-board` | `bt-` (`bst-`) | `bt`, `btStats` | `:board` | `btMake`, `btShow`, `btAnswer` |
| Opponents | `#opponents` | `#view-opp` | `o-` (`ost-`) | `opp`, `oppStatsRec` | `:opp`, `:opp-prefs` | `makeOpp`, `showOpp`, `answerOpp` |
| Full hand | `#full-hand` | `#view-hand` | `fh-` (`fst-`) | `fh`, `fhStats`, `FH_HANDS` (38 scripted hands) | `:hand` | `fhNew`, `fhShow`, `fhAnswer`, `fhNext`, `fhLast` |
| Sessions | `#session-log` | `#view-log` (`data-tool`) | `lg-` (`lgst-`) | `lg`, `lgData` | `:log` | `renderLog`, `lgResetForm`, `lgFillSet` |

Each quiz drill follows the same shape: `makeX()` builds a question, `showX(q)` renders a given one (so review can replay a saved question), `answerX(i)` scores it, and a `{q, answered, choice, qNo}` state object. Sessions is not a drill: it has no questions, so it isn't in review, Daily or the drill test.

## Shared pieces

- **Tab switcher** (TABS AND KEYS): `TABS[id]` gives each tab its hash, title and tagline. `setTab(id)` calls `dyLeave()`, sets `aria-selected`, toggles each `#view-…` with its own `hidden` line, updates the title and hash, deals a first question lazily, and calls `dyEnter()` for Daily. The keyboard handler has one branch per drill; on Daily it routes to whichever drill `dy.tab` is showing.
- **Review hooks** (PROGRESS AND REVIEW): misses are saved under `:review` (30 per tab). `RV` has one entry per drill: `{name, rec, fresh, show}`. Every drill calls `rvRecord(tab, ok, id, snap)` after scoring, `rvNext() || newX()` on Next, `rvLabel(id)` in its eyebrow and `rvClear(tab)` on reset. `renderRv()` draws the dropdown's tiles (5 per row from 900px).
- **Daily plan** (DAILY SET): `DY_PLAN` (2 each of seats, pot, board, opp, shuffled) plus one full hand last; then uncounted extras from `DY_EXTRA`. It plays by moving the drill's own `#view-…` into `#dy-host` (`dyMount`/`dyUnmount`, a comment node marks its home), so drill code must find its elements by id, never by position. It gets answers through the review hooks (`rvRecord` calls `dyRecord`, `rvNext` calls `dyNext`, `rvLabel` calls `dyLabel`); drills need nothing Daily-specific except an entry in `dyAnswered`.
- **Save export/import** (MOVE YOUR PROGRESS): `svCollect()` takes every localStorage key under `STORE + ':'`, so a new key is exported automatically. Codes are `PT1z.` (gzip + base64url) or `PT1.`; `svApply` replaces all keys and reloads.
- **Currency switch** (end of SESSION LOG): `[data-cur]` radio buttons on the Pot odds and Sessions tabs set `prefs.cur` (NOK default, USD, EUR). Drill text writes amounts as `$40` and `cash()` swaps the symbol; guide NOK amounts go through `fromNok` (1 USD = 10 NOK, 1 EUR = 11.5 NOK). Logged sessions keep their own currency.
- **Resets** are two clicks via `armReset` (the app has no `confirm()` dialog). Don't use `confirm`/`alert`.

## Conventions

- **No build step.** The website and the app both load `preflop-seat-drill.html` and `js/` as they are (`app/build-web.js` copies both and appends `<script src="native.js">`). A new JS file needs a `<script src>` tag in the page, in load order; `build-web.js` copies the whole `js/` folder, so it reaches the app on its own.
- **Keep each drill self-contained**: its own CSS section, HTML section, JS file, id prefix and storage key.
- **The test and the app read the page's conventions**, so keep them: a tab is a `role="tab"` button whose `aria-controls` names its `role="tabpanel"`; answer buttons carry a `<kbd>` shortcut and are disabled once answered; the next button carries `<kbd>N</kbd>`; the score bar has an element whose id ends in `st-correct` showing `right/total`. `app/native.js` buzzes on any button with a `<kbd>` and reads `…st-correct` to pick the buzz. To hide a key hint, hide the `<kbd>` with CSS; never remove it. On touch devices (no hover, coarse pointer) key hints are hidden this way (PR #20: `kbd:not(.count)`), so new buttons get it for free; a `<kbd>` used as a number badge that must stay visible needs `class="count"`.
- **Contrast**: new text, borders and colour tokens must meet WCAG AA in both light and dark mode (set both in `:root` and the dark-mode block).
- **Adding a drill** touches: a tab button in `nav.tabs`, its CSS and HTML sections, its `js/` file and `<script src>` tag, `TABS`, a `hidden` line and a lazy deal in `setTab`, a keyboard branch, an `RV` entry plus the four hooks, `dyAnswered` (and `DY_PLAN`/`DY_EXTRA` if it joins Daily), the `.rv-grid` column count, the phone tab bar (below 600px it is a 4-column grid; 7 tabs today, room for 8), and the hash list in README.md. Check it at 320px wide.
- **Layout limits**: CI fails on any horizontal scroll at 360px wide or any console error. iOS zooms inputs under 16px font, so inputs use 16px on phones.
- **Theo's preferences**: a clean screen. New controls start collapsed; no chapter line above drill titles; the review panel stays in its dropdown. Don't re-add a Bankroll tab or the tilt and study plan topics (Theo removed them; old `:bank` and `:bank-prefs` keys may still sit in storage, harmlessly).
- **Git**: branch from `main`, target `main`, merge `main` in when it moves (no rebase or force-push on shared branches). Never stack a PR on another PR's branch. Theo merges PRs himself.
- **README.md** describes every tab for users; update it when a tab's behaviour changes.

## Checks

Browser test (Playwright, desktop and a 360px phone). In a Claude cloud container Chromium is already installed, so skip `playwright install`:

```
npm install --no-audit --no-fund
npx playwright test                    # all 26 tests, about 3 minutes
npx playwright test -g "view-pot"      # one drill
npx playwright test --project=phone    # phone width only
```

Elsewhere, run `npx playwright install chromium` once first. The test opens the file directly (`file://`), stubs web fonts, answers 40 questions in every drill tab it finds, plays a daily set, moves a save by code and by file, and exercises the session log.

iPhone app: the simulator build runs only on macOS (GitHub Actions `macos-26`); you can't run it here. `cd app && npm run build` builds `app/www/` locally if you need to check the wrapped page. Publishing to TestFlight is a manual "Run workflow" that needs four repo secrets (see `app/README.md`).
