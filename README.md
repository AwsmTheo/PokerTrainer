# PokerTrainer

Drills for getting past beginner-level Texas hold'em: which hands to open from each seat, and how to price every call.

## The trainer

[`preflop-seat-drill.html`](preflop-seat-drill.html) is a single self-contained page with no build step and no install. It has two drills:

- **Seats: which hands to open.** You get a random seat and hand with everyone before you folded, and choose fold, call or raise. Switch between 6-max and 9-handed tables, and between any hand or close calls only. Your record is tracked by seat.
- **Pot odds: price every call.** A quiz on the equity a call needs, how often a bluff must work, and the minimum defence frequency (MDF) for a given pot and bet. Each answer shows the working.

The pot odds tab also has a **Workbench** where you plug in your own numbers: the price of a call, its expected value, outs to equity, and stack-to-pot ratio, plus a reference table for common bet sizes.

Keyboard shortcuts: `F`, `C` and `R` fold, call or raise in the seat drill, and `N` deals the next hand or question. Progress and settings are saved in your browser's local storage, so they stay on the machine and browser you use.

### How to open it

1. Download or clone the repo: `git clone https://github.com/AwsmTheo/PokerTrainer.git`
2. Open `preflop-seat-drill.html` in any modern browser (double-click it, or drag it onto a browser window).

That's it. An internet connection is only used to load the web fonts; the drills work offline with fallback fonts. You can link straight to a drill with `#seats` or `#pot-odds` at the end of the URL.

## Strategy guide

[`docs/texas-holdem-strategy.md`](docs/texas-holdem-strategy.md) is the research the drills are built on: position and opening ranges, pot odds and stack-to-pot ratio, board texture, adjusting to low-stakes opponents, and bankroll and tilt. Each claim cites its source.
