# PokerTrainer

Drills for getting past beginner-level Texas hold'em: which hands to open from each seat, and how to price every call.

## The trainer

[`preflop-seat-drill.html`](preflop-seat-drill.html) is a single self-contained page with no build step and no install. Its drills:

- **Seats: which hands to open.** You get a random seat and hand with everyone before you folded, and choose fold, call or raise. Switch between 6-max and 9-handed tables, and between any hand or close calls only. Your record is tracked by seat.
- **Pot odds: price every call.** A quiz on the equity a call needs, how often a bluff must work, and the minimum defence frequency (MDF) for a given pot and bet. Each answer shows the working.
- **Board: read the flop.** Random flops to classify by texture (dry, wet, low and connected, monotone, paired), decide whose range they favour, choose a continuation-bet plan in or out of position and multiway, and sort a hand into a strength bucket. Each answer explains the read and the default plan, with reference tables for c-bets and hand buckets.
- **Full hand: play it to the river.** One scripted hand at a time, from the preflop decision to the river, with a decision on each street. There are 38 hands, including 3-bet pots, multiway pots and turn decisions. Every decision is tagged with the chapter its rule comes from (seats, pot odds, board or opponents), a wrong answer plays on along the right line, and your accuracy is tracked per chapter. Suits are relabelled at random each time.
- **Bankroll: size your bankroll.** Size a bankroll in buy-ins (20 aggressive, 30 standard, 50 conservative, 100–200 for tournaments), work out what a game needs and which buy-ins a budget supports, and decide whether to move up, stay or move down. A side panel lists the bankroll rules in your currency.
- **Sessions: log your real games.** Not a drill: when you get up from the table, log the date, stakes, what you bought in for (rebuys included), what you cashed out and how long you played. The tab shows your total result, what you win an hour, a breakdown by stakes once you play more than one, and, with your starting bankroll and your game's buy-in filled in, your bankroll in buy-ins and what the Bankroll tab's rules say about it. Any session can be edited or deleted.

The pot odds tab includes **short stacks**: set mining at 25bb, which hands gain when stacks are short or deep, and the tournament push/fold bands.

Money shows in **NOK, USD or EUR**, switched on the Pot odds, Bankroll or Sessions tab (NOK by default). Drill amounts are example sizes, so only the sign changes; the guide's own NOK amounts are converted at about 1 USD = 10 NOK and 1 EUR = 11.5 NOK. Logged sessions are real money, so each keeps the currency it was logged in, and totals in another currency are converted at the same rough rate.

The pot odds tab also has a **Workbench** where you plug in your own numbers: the price of a call, its expected value, outs to equity, and stack-to-pot ratio, plus a reference table for common bet sizes.

The **Review misses** button under the title opens a dropdown with your accuracy on every tab. Each question you miss is saved, and **Review all misses** (or the review button on one tab) asks them again, moving between tabs as needed. A miss you get right on review is cleared; one you miss again stays saved. Resetting a tab's record also clears its saved misses.

The **Daily** tab is a short mixed set each day: two questions from each quiz tab in a shuffled order, then one full hand, all played inside the tab. If you leave it, it carries on where you were when you come back the same day. Finishing a set on consecutive days builds a streak, shown in the tab; a full hand counts as right only if every decision in it was. After the set, extra mixed questions keep coming but don't count. The set and streak are saved under their own key, apart from each tab's record.

Keyboard shortcuts: `F`, `C` and `R` fold, call or raise in the seat drill, number keys pick an answer in the quizzes, and `N` deals the next hand or question. Progress and settings are saved in your browser's local storage, so they stay on the machine and browser you use.

**Move your progress** at the bottom of the page carries it to another device or browser, or between the website and the iPhone app. **Copy code** gives a text code you can send yourself in Notes or Messages, and **Save file** saves a `.json` file (in the app it opens the share sheet). On the other device, paste the code or pick the file under **Load a save**. Loading replaces that device's progress, saved misses, streak, session log and settings after you confirm.

### How to open it

**On any device, including your phone:** go to [awsmtheo.github.io/PokerTrainer](https://awsmtheo.github.io/PokerTrainer/). The site is published from `main` with GitHub Pages, so it always has the latest drills. On a phone you can use your browser's "Add to Home Screen" to keep it one tap away. Progress is saved separately on each device and browser; use **Move your progress** to carry it across.

**Offline, from a copy of the repo:**

1. Download or clone the repo: `git clone https://github.com/AwsmTheo/PokerTrainer.git`
2. Open `preflop-seat-drill.html` in any modern browser (double-click it, or drag it onto a browser window).

That's it. An internet connection is only used to load the web fonts; the drills work offline with fallback fonts. You can link straight to a drill with `#daily`, `#seats`, `#pot-odds`, `#board-texture`, `#opponents`, `#full-hand`, `#bankroll` or `#session-log` at the end of the URL.

### iPhone app

[`app/`](app/) wraps the same page as an iPhone app, with practice reminders and haptics on top. See [app/README.md](app/README.md) for how it's built and the one-time setup to publish it on the App Store.

## Strategy guide

[`docs/texas-holdem-strategy.md`](docs/texas-holdem-strategy.md) is the research the drills are built on: position and opening ranges, pot odds and stack-to-pot ratio, board texture, adjusting to low-stakes opponents, and bankroll and tilt. Each claim cites its source.

## Automated checks

Every pull request and every push to `main` runs a browser test in GitHub Actions ([`tests/trainer.spec.js`](tests/trainer.spec.js)). It opens the page in headless Chromium at desktop and phone width, fails on any console error, checks that each tab shows only its own panel without the page scrolling sideways, answers 40 questions in every drill, plays a whole daily set, and moves progress to a fresh device with a code and with a file.

The test finds tabs, answer buttons and the "next" button from the page itself, so a new drill is covered without touching the test as long as it follows the same pattern as the others: a `role="tab"` button whose `aria-controls` names its panel, answer buttons with a `<kbd>` shortcut that are disabled once answered, and a next button with `<kbd>N</kbd>`.

To run it locally (needs Node 18 or later):

```
npm install
npx playwright install chromium
npm test
```
