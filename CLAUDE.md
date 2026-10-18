# CLAUDE.md

Notes for Claude sessions working in this repo. Read this first; it is meant to save you from reading the whole trainer page.

## What's here

| Path | What it is |
| --- | --- |
| `preflop-seat-drill.html` | The whole trainer: one self-contained page (~350 KB, ~4,500 lines) holding every tab's HTML, CSS and JS. No build step. |
| `index.html` | Site root; forwards to the trainer, keeping any `#tab` hash. |
| `docs/texas-holdem-strategy.md` | The strategy guide the drills are built on (~50 KB). Read it only for poker content, not for code work. |
| `tests/trainer.spec.js` | Playwright browser test, run on every PR. |
| `app/` | iPhone app (Capacitor 8, SPM). Wraps the same page; see `app/README.md`. |
| `.github/workflows/` | `browser-tests.yml` (every PR and push to main) and `ios.yml` (simulator build when `app/**` or the page changes). |

Live site: https://awsmtheo.github.io/PokerTrainer/ (GitHub Pages from `main`). The repo is public: never commit secrets.

Older copies of the page and the guide sit in the project's shared folder (`/mnt/project-files/New folder/…`). They are stale originals; always edit the repo copy.

## Reading the trainer page

Don't read the file top to bottom. Print its section map, then read only the ranges you need with `sed -n 'START,ENDp'` or Read with an offset:

```
grep -n -E '^/\* |<!-- =====|^  /\* =====|^  /\* -{5,}' preflop-seat-drill.html
```

That lists every CSS section (`/* Pot odds drill */`), every HTML section (`<!-- ===== Pot odds drill ===== -->`) and every JS section (`/* ===== POT ODDS DRILL ===== */`, sub-sections as `/* ---------- Workbench ---------- */`). Line numbers move with every PR, so trust the grep, not remembered numbers.

The file has three blocks in this order:

1. **`<style>`**: tokens on `:root` (dark mode in `@media (prefers-color-scheme: dark)`), shared layout, then one section per drill in tab order, then the phone tab bar, Session log, Progress and review (which also holds the Daily `.dy` styles), Move your progress.
2. **HTML** inside `<div class="app">`: `<header class="top">` with the tab bar (`nav.tabs`), title (`#app-title`, `#app-tag`) and the Review misses dropdown (`details#rv`); then `<main>` with one `<section class="view" id="view-…" role="tabpanel">` per tab; then `details#sv` (Move your progress) at the bottom.
3. **One `<script>`**, a single IIFE. Order: shared helpers (`$`, cards, `rand`/`pick`/`shuffle`), storage (`STORE`, `loadJSON`, `saveJSON`, `prefs`), currency (`CUR`, `money`, `cash`), `armReset`; then SEAT DRILL, POT ODDS DRILL (with Workbench), BOARD TEXTURE DRILL, OPPONENT DRILL, BANKROLL DRILL, SESSION LOG (with the Currency switch at its end), PROGRESS AND REVIEW, DAILY SET, FULL HAND DRILL, MOVE YOUR PROGRESS, and last TABS AND KEYS (`TABS`, `setTab`, arrow keys, the keyboard handler, and the init calls).

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
| Bankroll | `#bankroll` | `#view-bank` | `bk-` (`bkst-`) | `bk`, `bkStats` | `:bank`, `:bank-prefs` | `makeBank`, `showBank`, `answerBank`, `renderBank` |
| Sessions | `#session-log` | `#view-log` (`data-tool`) | `lg-` (`lgst-`) | `lg`, `lgData` | `:log` | `renderLog`, `lgResetForm`, `lgFillSet` |

Each quiz drill follows the same shape: `makeX()` builds a question, `showX(q)` renders a given one (so review can replay a saved question), `answerX(i)` scores it, and a `{q, answered, choice, qNo}` state object. Sessions is not a drill: it has no questions, so it isn't in review, Daily or the drill test.

## Shared pieces

- **Tab switcher** (TABS AND KEYS): `TABS[id]` gives each tab its hash, title and tagline. `setTab(id)` calls `dyLeave()`, sets `aria-selected`, toggles each `#view-…` with its own `hidden` line, updates the title and hash, deals a first question lazily, and calls `dyEnter()` for Daily. The keyboard handler has one branch per drill; on Daily it routes to whichever drill `dy.tab` is showing.
- **Review hooks** (PROGRESS AND REVIEW): misses are saved under `:review` (30 per tab). `RV` has one entry per drill: `{name, rec, fresh, show}`. Every drill calls `rvRecord(tab, ok, id, snap)` after scoring, `rvNext() || newX()` on Next, `rvLabel(id)` in its eyebrow and `rvClear(tab)` on reset. `renderRv()` draws the dropdown's tiles (6 per row from 900px).
- **Daily plan** (DAILY SET): `DY_PLAN` (2 each of seats, pot, board, opp, shuffled) plus one full hand last; then uncounted extras from `DY_EXTRA`. It plays by moving the drill's own `#view-…` into `#dy-host` (`dyMount`/`dyUnmount`, a comment node marks its home), so drill code must find its elements by id, never by position. It gets answers through the review hooks (`rvRecord` calls `dyRecord`, `rvNext` calls `dyNext`, `rvLabel` calls `dyLabel`); drills need nothing Daily-specific except an entry in `dyAnswered`.
- **Save export/import** (MOVE YOUR PROGRESS): `svCollect()` takes every localStorage key under `STORE + ':'`, so a new key is exported automatically. Codes are `PT1z.` (gzip + base64url) or `PT1.`; `svApply` replaces all keys and reloads.
- **Currency switch** (end of SESSION LOG): `[data-cur]` radio buttons on the Pot odds, Bankroll and Sessions tabs set `prefs.cur` (NOK default, USD, EUR). Drill text writes amounts as `$40` and `cash()` swaps the symbol; guide NOK amounts go through `fromNok` (1 USD = 10 NOK, 1 EUR = 11.5 NOK). Logged sessions keep their own currency.
- **Resets** are two clicks via `armReset` (the app has no `confirm()` dialog). Don't use `confirm`/`alert`.

## Conventions

- **Keep it one page.** The website and the app both load `preflop-seat-drill.html` as is (`app/build-web.js` copies it and appends `<script src="native.js">`). Don't split it into files or add a build step.
- **Keep each drill self-contained**: its own CSS section, HTML section, JS section, id prefix and storage key.
- **The test and the app read the page's conventions**, so keep them: a tab is a `role="tab"` button whose `aria-controls` names its `role="tabpanel"`; answer buttons carry a `<kbd>` shortcut and are disabled once answered; the next button carries `<kbd>N</kbd>`; the score bar has an element whose id ends in `st-correct` showing `right/total`. `app/native.js` buzzes on any button with a `<kbd>` and reads `…st-correct` to pick the buzz. To hide a key hint, hide the `<kbd>` with CSS; never remove it. On touch devices (no hover, coarse pointer) key hints are hidden this way (PR #20), so new buttons with `<kbd>` get the same treatment for free.
- **Contrast**: new text, borders and colour tokens must meet WCAG AA in both light and dark mode (set both in `:root` and the dark-mode block).
- **Adding a drill** touches: a tab button in `nav.tabs`, its CSS/HTML/JS sections, `TABS`, a `hidden` line and a lazy deal in `setTab`, a keyboard branch, an `RV` entry plus the four hooks, `dyAnswered` (and `DY_PLAN`/`DY_EXTRA` if it joins Daily), the `.rv-grid` column count, the phone tab bar (below 600px it is a 4-column grid fitting 8 tabs), and the hash list in README.md. Check it at 320px wide.
- **Layout limits**: CI fails on any horizontal scroll at 360px wide or any console error. iOS zooms inputs under 16px font, so inputs use 16px on phones.
- **Theo's preferences**: a clean screen. New controls start collapsed; no chapter line above drill titles; the review panel stays in its dropdown. Don't re-add the tilt or study plan topics.
- **Git**: branch from `main`, target `main`, merge `main` in when it moves (no rebase or force-push on shared branches). Never stack a PR on another PR's branch. Theo merges PRs himself.
- **README.md** describes every tab for users; update it when a tab's behaviour changes.

## Checks

Browser test (Playwright, desktop and a 360px phone). In a Claude cloud container Chromium is already installed, so skip `playwright install`:

```
npm install --no-audit --no-fund
npx playwright test                    # all 28 tests, about 3 minutes
npx playwright test -g "view-pot"      # one drill
npx playwright test --project=phone    # phone width only
```

Elsewhere, run `npx playwright install chromium` once first. The test opens the file directly (`file://`), stubs web fonts, answers 40 questions in every drill tab it finds, plays a daily set, moves a save by code and by file, and exercises the session log.

iPhone app: the simulator build runs only on macOS (GitHub Actions `macos-26`); you can't run it here. `cd app && npm run build` builds `app/www/` locally if you need to check the wrapped page. Publishing to TestFlight is a manual "Run workflow" that needs four repo secrets (see `app/README.md`).
