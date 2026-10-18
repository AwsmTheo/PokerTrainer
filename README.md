# PokerTrainer

Drills for getting past beginner-level Texas hold'em: which hands to open from each seat, and how to price every call.

## The trainer

[`preflop-seat-drill.html`](preflop-seat-drill.html) is a single self-contained page with no build step and no install. Its drills:

- **Seats: which hands to open.** You get a random seat and hand with everyone before you folded, and choose fold, call or raise. Switch between 6-max and 9-handed tables, and between any hand or close calls only. Your record is tracked by seat.
- **Pot odds: price every call.** A quiz on the equity a call needs, how often a bluff must work, and the minimum defence frequency (MDF) for a given pot and bet. Each answer shows the working.
- **Board: read the flop.** Random flops to classify by texture (dry, wet, low and connected, monotone, paired), decide whose range they favour, choose a continuation-bet plan in or out of position and multiway, and sort a hand into a strength bucket. Each answer explains the read and the default plan, with reference tables for c-bets and hand buckets.
- **Full hand: play it to the river.** One scripted hand at a time, from the preflop decision to the river, with a decision on each street. Every decision is tagged with the chapter its rule comes from (seats, pot odds, board or opponents), a wrong answer plays on along the right line, and your accuracy is tracked per chapter. Suits are relabelled at random each time.

The pot odds tab also has a **Workbench** where you plug in your own numbers: the price of a call, its expected value, outs to equity, and stack-to-pot ratio, plus a reference table for common bet sizes.

The **progress panel** under the title shows your accuracy on every tab. Each question you miss is saved, and **Review all misses** (or the review button on one tab) asks them again, moving between tabs as needed. A miss you get right on review is cleared; one you miss again stays saved. Resetting a tab's record also clears its saved misses.

The **daily set** at the top of the panel is a short mixed set each day: two questions from each quiz tab in a shuffled order, then one full hand, moving between tabs for you. You can stop and pick it up later the same day. Finishing a set on consecutive days builds a streak; a full hand counts as right only if every decision in it was. The set and streak are saved under their own key, apart from each tab's record.

Keyboard shortcuts: `F`, `C` and `R` fold, call or raise in the seat drill, number keys pick an answer in the quizzes, and `N` deals the next hand or question. Progress and settings are saved in your browser's local storage, so they stay on the machine and browser you use.

### How to open it

**On any device, including your phone:** go to [awsmtheo.github.io/PokerTrainer](https://awsmtheo.github.io/PokerTrainer/). The site is published from `main` with GitHub Pages, so it always has the latest drills. On a phone you can use your browser's "Add to Home Screen" to keep it one tap away. Progress is saved separately on each device and browser.

**Offline, from a copy of the repo:**

1. Download or clone the repo: `git clone https://github.com/AwsmTheo/PokerTrainer.git`
2. Open `preflop-seat-drill.html` in any modern browser (double-click it, or drag it onto a browser window).

That's it. An internet connection is only used to load the web fonts; the drills work offline with fallback fonts. You can link straight to a drill with `#seats`, `#pot-odds`, `#board-texture`, `#opponents` or `#full-hand` at the end of the URL.

### iPhone app

[`app/`](app/) wraps the same page as an iPhone app, with practice reminders and haptics on top. See [app/README.md](app/README.md) for how it's built and the one-time setup to publish it on the App Store.

## Strategy guide

[`docs/texas-holdem-strategy.md`](docs/texas-holdem-strategy.md) is the research the drills are built on: position and opening ranges, pot odds and stack-to-pot ratio, board texture, adjusting to low-stakes opponents, and bankroll and tilt. Each claim cites its source.

## Automated checks

Every pull request and every push to `main` runs a browser test in GitHub Actions ([`tests/trainer.spec.js`](tests/trainer.spec.js)). It opens the page in headless Chromium at desktop and phone width, fails on any console error, checks that each tab shows only its own panel without the page scrolling sideways, answers 40 questions in every drill, and plays a whole daily set.

The test finds tabs, answer buttons and the "next" button from the page itself, so a new drill is covered without touching the test as long as it follows the same pattern as the others: a `role="tab"` button whose `aria-controls` names its panel, answer buttons with a `<kbd>` shortcut that are disabled once answered, and a next button with `<kbd>N</kbd>`.

To run it locally (needs Node 18 or later):

```
npm install
npx playwright install chromium
npm test
```
