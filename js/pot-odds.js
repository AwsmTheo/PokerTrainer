'use strict';

/* =====================================================================
   POT ODDS DRILL
   ===================================================================== */

const pc1 = x => { const v = Math.round(x * 1000) / 10; return (Number.isInteger(v) ? String(v) : v.toFixed(1)) + '%'; };
const num = x => { const v = Math.round(x * 10) / 10; return Number.isInteger(v) ? String(v) : v.toFixed(1); };
const ratio = (x, d = 2) => String(Math.round(x * Math.pow(10, d)) / Math.pow(10, d));
const signed = x => (x >= 0 ? '+' : '−') + num(Math.abs(x));
const two = n => 1 - (47 - n) * (46 - n) / (47 * 46);    // hit by the river, from the flop, seeing both cards
const round5 = x => Math.max(5, Math.round(x / 5) * 5);
const fBet = s => (Math.cbrt(1 + 2 * s) - 1) / 2;          // equal bet (share of pot) that gets SPR s all-in over three streets
const toCard = code => Object.assign({r: code[0]}, SUITS.find(s => s.k === code[1]));
function suitMapper() {   // relabel suits at random so the same spot looks fresh
  const perm = shuffle(['s', 'h', 'd', 'c']);
  const m = {s:perm[0], h:perm[1], d:perm[2], c:perm[3]};
  return code => toCard(code[0] + m[code[1]]);
}
const pcHTML = c => `<div class="pc${c.red ? ' red' : ''}" role="img" aria-label="${cap(RNAME[c.r])} of ${c.name}">${showRank(c.r)}<span>${c.sym}</span></div>`;

// Options: the correct answer first in the list, common mistakes next; shuffled for display.
function opts(correct, wrongs, max = 4) {
  const labels = [correct];
  for (const w of wrongs) if (w != null && !labels.includes(w) && labels.length < max) labels.push(w);
  return shuffle(labels.map((l, i) => ({label: l, correct: i === 0})));
}
function pctOpts(x, wrongs) {
  const vals = [x];
  const fits = v => isFinite(v) && v > 0.004 && v < 0.996 && vals.every(u => Math.abs(u - v) >= 0.015 && pc1(u) !== pc1(v));
  for (const w of wrongs) if (vals.length < 4 && fits(w)) vals.push(w);
  for (const d of [0.08, -0.06, 0.14, -0.1, 0.2, 0.05]) if (vals.length < 4 && fits(x + d)) vals.push(x + d);
  return shuffle(vals.map((v, i) => ({label: pc1(v), correct: i === 0})));
}
const fixedOpts = list => list.map(([label, correct]) => ({label, correct}));

const SIZE_ROWS = [
  {n:'1/4 pot', f:0.25}, {n:'1/3 pot', f:1/3}, {n:'1/2 pot', f:0.5}, {n:'2/3 pot', f:2/3},
  {n:'3/4 pot', f:0.75}, {n:'Pot', f:1}, {n:'1.5x pot', f:1.5}, {n:'2x pot', f:2}
];
const sz = f => ({odds:(1 + f) / f, need:f / (1 + 2 * f), bluff:f / (1 + f), mdf:1 / (1 + f)});

// Flop spots: outs are invariant under relabelling suits.
const DRAWS = [
  {name:'Gutshot straight draw', outs:4, hero:['9c','8d'], board:['Qs','Th','3c'], blank:'2s', why:'Only a jack completes your straight (Q-J-T-9-8): 4 outs.'},
  {name:'Two overcards', outs:6, hero:['Ad','Kc'], board:['8s','6h','2c'], blank:'3d', why:'Three aces and three kings give you top pair: 6 outs, and often only partly live.'},
  {name:'Open-ended straight draw', outs:8, hero:['Jh','Tc'], board:['9s','8d','3c'], blank:'2h', why:'Any queen or any seven makes your straight: 4 + 4 = 8 outs.'},
  {name:'Flush draw', outs:9, hero:['7h','6h'], board:['Kh','9h','2c'], blank:'3s', why:'There are 13 cards in your suit and you can see 4, so 9 remain.'},
  {name:'Flush draw + gutshot', outs:12, hero:['9s','8s'], board:['Qs','Ts','3d'], blank:'2c', why:'9 flush cards, plus the 3 jacks that are not in your suit: 12 outs.'},
  {name:'Flush draw + overcard', outs:12, hero:['As','9s'], board:['Qs','7s','3d'], blank:'2c', why:'9 flush cards, plus the 3 aces that are not in your suit: 12 outs.'},
  {name:'Flush draw + open-ended straight draw', outs:15, hero:['9h','8h'], board:['Th','7h','2c'], blank:'3d', why:'9 flush cards, plus the 3 jacks and 3 sixes that are not in your suit: 15 outs.'},
  {name:'Two pair to a full house', outs:4, hero:['Kc','9d'], board:['Kh','9s','4c'], blank:'2d', why:'The two remaining kings and two remaining nines make a full house: 4 outs.'}
];
const DIRTY = [
  {hero:['9s','8s'], board:['Ks','5s','2c'], raw:9, worth:6,
   why:'You have 9 raw flush outs, but your opponent’s range holds bigger flush draws, so some of your flushes still lose. Poker Skill counts this draw as worth about 6 outs, which turns a call into a fold.'},
  {hero:['Ts','9d'], board:['Ac','7h','8h'], raw:8, worth:6,
   why:'Any six or jack makes your straight, but the six and jack of the board’s two-flush suit also complete a flush for anyone holding two of that suit. Only 6 outs are clean.'}
];
const IMPLIED_DRAWS = [   // draws to the nuts, for implied-odds spots
  {name:'nut flush draw', outs:9, hero:['Kh','Qh'], board:['Ah','7h','2c'], blank:'4s'},
  {name:'open-ended straight draw to the nuts', outs:8, hero:['Jh','Tc'], board:['9s','8d','3c'], blank:'2h'}
];

function qPrice() {
  if (rand(4) === 0) {   // facing a raise
    const P = pick([60, 80, 100, 120, 150, 200]);
    const B = round5(P * pick([1/3, 0.5, 2/3, 0.75]));
    const R = round5(B * pick([2.5, 3, 3.5, 4]));
    const call = R - B, final = P + 2 * R, need = call / final;
    return {
      scene:{facts:[{k:'Pot', v:P}, {k:'Your bet', v:B}, {k:'Raised to', v:R}]},
      prompt:`You bet ${B} into a pot of ${P} and your opponent raises to ${R}. What equity do you need to call?`,
      options:pctOpts(need, [call / (P + B + R), call / (P + B), R / (P + 2 * R)]),
      work:`You call <b>${call}</b> more (${R} − ${B}). After your call the pot is ${P} + ${B} + ${R} + ${call} = <b>${final}</b>. ${call} ÷ ${final} = <b>${pc1(need)}</b>.`,
      rule:'Equity needed = your call ÷ the pot after you call. It works the same way when you face a raise.'
    };
  }
  const P = pick([40, 60, 80, 100, 120, 150, 180, 200, 240, 300]);
  const b = round5(P * pick([0.25, 1/3, 0.4, 0.5, 0.6, 2/3, 0.75, 0.8, 1, 1.5, 2]));
  const final = P + 2 * b, need = b / final;
  return {
    scene:{facts:[{k:'Pot', v:P}, {k:'Bet', v:b}]},
    prompt:`The pot is ${P} and your opponent bets ${b}. What equity do you need to call?`,
    options:pctOpts(need, [b / P, b / (P + b)]),
    work:`You call <b>${b}</b> to win a final pot of ${P} + ${b} + ${b} = <b>${final}</b>. ${b} ÷ ${final} = <b>${pc1(need)}</b>.` +
      (b < P ? ` Dividing ${b} by the ${P} already in the middle gives ${pc1(b / P)}: that is the classic mistake of using the pot before the bet.` : ''),
    rule:'Divide your call by the pot after you call.'
  };
}

function qSizes() {
  const i = rand(SIZE_ROWS.length), row = SIZE_ROWS[i], s = sz(row.f), P = 120, b = Math.round(P * row.f);
  const near = [i - 1, i + 1, i - 2, i + 2].filter(j => j >= 0 && j < SIZE_ROWS.length).map(j => sz(SIZE_ROWS[j].f));
  const size = row.f === 1 ? 'a pot-sized bet' : `a ${row.n} bet`;
  const scene = {facts:[{k:'Bet size', v:row.f === 1 ? 'Pot' : row.n}]};
  const kind = pick(['need', 'need', 'odds', 'bluff', 'mdf', 'vb']);
  if (kind === 'need') return {scene,
    prompt:`Your opponent makes ${size}. What equity do you need to call?`,
    options:pctOpts(s.need, [s.bluff, ...near.map(x => x.need)]),
    work:`Take a pot of ${P}: the bet is ${b}. You call ${b} to win ${P} + ${b} + ${b} = ${P + 2 * b}, and ${b} ÷ ${P + 2 * b} = <b>${pc1(s.need)}</b>.`,
    rule:'Half-pot needs a quarter, pot needs a third, and no bet ever needs 50%.'};
  if (kind === 'odds') return {scene,
    prompt:`What pot odds does ${size} offer the caller?`,
    options:opts(ratio(s.odds) + ' : 1', near.map(x => ratio(x.odds) + ' : 1')),
    work:`Take a pot of ${P}: after a bet of ${b} there is ${P + b} to win for a call of ${b}. ${P + b} : ${b} = <b>${ratio(s.odds)} : 1</b>.`,
    rule:'Pot odds = what you can win : what you must call.'};
  if (kind === 'bluff') return {scene,
    prompt:`You bluff with ${size}. How often must your opponent fold for the bluff to break even?`,
    options:pctOpts(s.bluff, [s.need, s.mdf, ...near.map(x => x.bluff)]),
    work:`A bluff risks the bet to win the pot. Break-even (“alpha”) = bet ÷ (bet + pot) = ${b} ÷ (${b} + ${P}) = <b>${pc1(s.bluff)}</b>.`,
    rule:'A pot-sized bluff must work half the time; a one-third-pot bluff needs only 25%.'};
  if (kind === 'mdf') return {scene,
    prompt:`Your opponent bets ${size}. What is your minimum defence frequency?`,
    options:pctOpts(s.mdf, [s.bluff, 1 - s.need, ...near.map(x => x.mdf)]),
    work:`MDF = pot ÷ (pot + bet) = ${P} ÷ (${P} + ${b}) = <b>${pc1(s.mdf)}</b>. Continue less often than that and your opponent profits by bluffing with any two cards.`,
    rule:'MDF is a sanity check, not an instruction to call with junk. Fold more against players who rarely bluff.'};
  return {scene,
    prompt:`A balanced river bet of ${row.f === 1 ? 'pot' : row.n} carries how many value hands per bluff?`,
    options:opts(ratio(s.odds) + ' : 1', near.map(x => ratio(x.odds) + ' : 1').concat(['1 : 1'])),
    work:`The balanced value-to-bluff ratio equals the pot odds you offer the caller: (${P} + ${b}) : ${b} = <b>${ratio(s.odds)} : 1</b>.`,
    rule:'A half-pot bet offers 3 : 1, so it carries three value hands per bluff.'};
}

function qOuts() {
  const kind = pick(['count', 'count', 'dirty', 'river', 'turn', 'against', 'rule']);
  const m = suitMapper();
  const d = pick(DRAWS), n = d.outs;
  const flop = {board:d.board.map(m), hero:d.hero.map(m), street:'Flop'};
  const otherOuts = [...new Set(DRAWS.map(x => x.outs))].filter(x => x !== n).sort((a, b) => Math.abs(a - n) - Math.abs(b - n));
  const rule24 = 'Rule of 2 and 4: outs × 4 with two cards to come, × 2 with one. Above 8 outs, subtract (outs − 8) from the × 4 figure.';
  if (kind === 'count') return {scene:flop,
    prompt:'How many outs do you have? Count the unseen cards that should make your hand the winner.',
    options:opts(String(n), otherOuts.map(String)),
    work:`${d.name}. ${d.why}`,
    rule:'An out is an unseen card that should make your hand the winner.'};
  if (kind === 'dirty') {
    const x = pick(DIRTY);
    return {scene:{board:x.board.map(m), hero:x.hero.map(m), street:'Flop'},
      prompt:'You face a bet with this draw. How many outs should you really count?',
      options:opts(`About ${x.worth}`, [`All ${x.raw}`, `About ${x.raw + 3}`, `About ${x.worth - 3}`]),
      work:x.why,
      rule:'Count only outs that win. Discount bigger draws in your opponent’s range and cards that complete someone else’s flush.'};
  }
  if (kind === 'river') return {scene:Object.assign(flop, {facts:[{k:'Outs', v:n}, {k:'Stacks', v:'All-in'}]}),
    prompt:`${d.name}, ${n} outs, and someone is all-in on the flop, so you see both the turn and the river. How often do you hit by the river?`,
    options:pctOpts(two(n), [n / 46, ...otherOuts.map(two)]),
    work:`Exact: 1 − (${47 - n}/47 × ${46 - n}/46) = <b>${pc1(two(n))}</b>. The Rule of 4 estimate is ${n} × 4 = ${n * 4}%${n > 8 ? `, or ${n * 4 - (n - 8)}% after subtracting (outs − 8)` : ''}.`,
    rule:rule24};
  if (kind === 'turn') {
    const turnBoard = d.board.map(m).concat(m(d.blank));
    return {scene:{board:turnBoard, hero:d.hero.map(m), street:'Turn', facts:[{k:'Outs', v:n}]},
      prompt:`${d.name}, ${n} outs, on the turn. How often do you hit on the river?`,
      options:pctOpts(n / 46, [two(n), ...otherOuts.map(o => o / 46)]),
      work:`${n} of the 46 unseen cards hit: ${n} ÷ 46 = <b>${pc1(n / 46)}</b>. The Rule of 2 gives ${n * 2}%.`,
      rule:rule24};
  }
  if (kind === 'against') {
    const odds = x => ratio((46 - x) / x, 1) + ' : 1';
    return {scene:{facts:[{k:'Outs', v:n}, {k:'Cards to come', v:1}]},
      prompt:`You have ${n} outs with one card to come (turn to river). What are the odds against hitting?`,
      options:opts(odds(n), otherOuts.map(odds)),
      work:`${46 - n} cards miss and ${n} hit, so the odds are ${46 - n} : ${n} = <b>${odds(n)}</b> against. Call when the pot odds you are offered are bigger than that.`,
      rule:'Compare the odds against hitting with the pot odds on offer.'};
  }
  // Rule of 2 and 4 estimate
  const twoCards = rand(2) === 0;
  const est = twoCards ? n * 4 - Math.max(0, n - 8) : n * 2;
  const wrongs = twoCards ? [n * 4, n * 2, n * 3, n * 4 + 8] : [n * 4, n, n * 3];
  return {scene:{facts:[{k:'Outs', v:n}, {k:'Cards to come', v:twoCards ? '2 (all-in)' : 1}]},
    prompt:`Estimate it at the table with the Rule of 2 and 4: ${n} outs with ${twoCards ? 'two cards to come, and someone is all-in' : 'one card to come'}.`,
    options:opts(est + '%', wrongs.map(w => w + '%')),
    work:twoCards
      ? `${n} × 4 = ${n * 4}%${n > 8 ? `, minus (${n} − 8) = <b>${est}%</b>. The shortcut overstates big draws; the exact figure is ${pc1(two(n))}` : ` = <b>${est}%</b>. The exact figure is ${pc1(two(n))}`}.`
      : `${n} × 2 = <b>${est}%</b>. The exact figure is ${pc1(n / 46)}.`,
    rule:rule24};
}

function qEV() {
  for (let t = 0; t < 80; t++) {
    const d = pick(DRAWS), n = d.outs, m = suitMapper();
    const mode = pick(['allin', 'allin', 'behind', 'turn']);
    const P = pick([60, 80, 100, 120, 150, 200]);
    const b = round5(P * pick([1/3, 0.5, 2/3, 0.75, 1, 1.5]));
    const e = mode === 'allin' ? two(n) : mode === 'behind' ? n / 47 : n / 46;
    const need = b / (P + 2 * b);
    if (Math.abs(e - need) < 0.03) continue;
    const ev = e * (P + b) - (1 - e) * b, call = e > need;
    const board = d.board.map(m);
    if (mode === 'turn') board.push(m(d.blank));
    const draw = d.name.toLowerCase();
    const prompt = mode === 'allin'
      ? `Your opponent moves all-in for ${b} into a pot of ${P}, and you have them covered. You hold a ${draw}. Call or fold?`
      : mode === 'behind'
      ? `Your opponent bets ${b} into a pot of ${P}. Stacks are deep, so you will probably face another bet on the turn. You hold a ${draw}. On direct pot odds, call or fold?`
      : `Your opponent bets ${b} into a pot of ${P} on the turn. You hold a ${draw}. On direct pot odds, call or fold?`;
    const eqTxt = mode === 'allin'
      ? `You are all-in, so you see both cards: ${n} outs give <b>${pc1(e)}</b> by the river.`
      : mode === 'behind'
      ? `With stacks behind you are only paying to see the turn: ${n} ÷ 47 = <b>${pc1(e)}</b>. Using the two-card ${pc1(two(n))} here is the Rule of 4 trap.`
      : `One card to come: ${n} ÷ 46 = <b>${pc1(e)}</b>.`;
    return {
      scene:{board, hero:d.hero.map(m), street:mode === 'turn' ? 'Turn' : 'Flop',
             facts:[{k:'Pot', v:P}, {k:'Bet', v:b, note:mode === 'allin' ? 'all-in' : ''}]},
      prompt, two:true,
      options:fixedOpts([['Call', call], ['Fold', !call]]),
      work:`Price: ${b} ÷ (${P} + ${b} + ${b}) = <b>${pc1(need)}</b>. ${eqTxt} EV of calling = ${pc1(e)} × ${P + b} − ${pc1(1 - e)} × ${b} = <b>${signed(ev)}</b>, so ${call ? 'call' : 'fold'}.` +
        (mode !== 'allin' && !call ? ' Only implied odds could close the gap.' : ''),
      rule:'The two-card figure applies only when someone is all-in. With stacks behind, compare the one-card odds with the current price.'
    };
  }
  return qPrice();
}

function qImplied() {
  const kind = pick(['needed', 'needed', 'stack']);
  for (let t = 0; t < 80; t++) {
    const d = pick(IMPLIED_DRAWS), n = d.outs, e = n / 46, m = suitMapper();
    const P = pick([20, 30, 40, 50, 60, 80, 100]);
    const b = round5(P * pick([0.5, 2/3, 0.75, 1]));
    const need = b / (P + 2 * b);
    if (e >= need - 0.02) continue;
    const X = Math.round(b / e - (P + 2 * b));
    const scene = {board:d.board.map(m).concat(m(d.blank)), hero:d.hero.map(m), street:'Turn', facts:[{k:'Pot', v:'$' + P}, {k:'Bet', v:'$' + b}]};
    const work = `Direct price: ${b} ÷ ${P + 2 * b} = ${pc1(need)}, but ${n} outs give only ${pc1(e)}. To break even the final pot must reach ${b} ÷ ${pc1(e)} ≈ $${Math.round(b / e)}. After your call it holds $${P + 2 * b}, so you must win about <b>$${X}</b> more on the river when you hit.`;
    if (kind === 'needed') return {scene,
      prompt:`The pot is $${P} and your opponent bets $${b}. Your ${d.name} hits the river ${pc1(e)} of the time. How much more must you win on the river, when you hit, for calling to break even?`,
      options:opts('$' + X, ['$' + (X + b), '$' + Math.round(b / e), '$' + Math.max(5, Math.round(X / 2))]),
      work,
      rule:'Implied odds are the extra money you expect to win on later streets when you hit. They pay only when stacks are deep and your hand is hidden.'};
    const short = rand(2) === 0;
    const S = short ? Math.max(5, Math.round(X * pick([0.3, 0.45, 0.6]))) : Math.round(X * pick([1.8, 2.5, 4]));
    scene.facts.push({k:'They have behind', v:'$' + S});
    return {scene, two:true,
      prompt:`The pot is $${P}. Your opponent bets $${b} and has $${S} left behind. You hold a ${d.name} (${pc1(e)} to hit) and will be paid in full when you hit. Can implied odds justify a call?`,
      options:fixedOpts([['Call: enough is left to win', !short], ['Fold: too little left behind', short]]),
      work:work + (short ? ` Your opponent only has $${S} left, so you can never win that much: fold.` : ` Your opponent has $${S} behind, enough to pay you: the call is justified.`),
      rule:'You can never win more than your opponent has left. If you will not have the nuts when you hit, expect to win less.'};
  }
  return qPrice();
}

function qSetMine() {
  for (let t = 0; t < 80; t++) {
    const pr = pick(['2', '3', '4', '5', '6']);
    const ip = rand(2) === 0;
    const r = pick([4, 6, 8, 10, 12, 15]);
    const you = pick([100, 150, 200, 300, 500]);
    const them = rand(3) === 0 ? pick([60, 80, 100, 120, 150]) : pick([150, 200, 300, 400, 600]);
    const eff = Math.min(you, them), mult = ip ? 15 : 25, x = eff / r;
    if (Math.abs(x - mult) / mult < 0.2) continue;
    const call = x >= mult;
    const suits = shuffle(['s', 'h', 'd', 'c']);
    return {
      scene:{hero:[toCard(pr + suits[0]), toCard(pr + suits[1])], facts:[{k:'Raise to', v:'$' + r}, {k:'Your stack', v:'$' + you}, {k:'Their stack', v:'$' + them}]},
      prompt:`Preflop. An opponent raises to $${r} and you hold ${pr}${pr} ${ip ? 'in position' : 'out of position'}. Is calling to set-mine profitable?`,
      two:true,
      options:fixedOpts([['Call to set-mine', call], ['Fold', !call]]),
      work:`The effective stack is the smaller one: <b>$${eff}</b>, which is ${num(x)}× the raise. You flop a set only 11.8% of the time (about 7.5-to-1) and you won’t always get paid, so you want at least ${mult}× ${ip ? 'in position' : 'out of position'}. ${call ? 'That is enough: call.' : 'That is not enough: fold.'}`,
      rule:'Set mining needs at least 15× the raise in effective stacks, and about 25× out of position.'
    };
  }
  return qPrice();
}

function qBluff() {
  const kind = pick(['alpha', 'ev', 'ev', 'mdf']);
  for (let t = 0; t < 80; t++) {
    const P = pick([40, 60, 80, 100, 120, 150, 200]);
    const b = round5(P * pick([1/3, 0.5, 2/3, 0.75, 1, 1.25, 1.5]));
    const alpha = b / (P + b);
    if (kind === 'alpha') return {scene:{facts:[{k:'Pot', v:P}, {k:'Your bluff', v:b}]},
      prompt:`You bluff ${b} into a pot of ${P}. How often must your opponent fold for the bluff to break even?`,
      options:pctOpts(alpha, [b / (P + 2 * b), P / (P + b), b / P]),
      work:`You risk ${b} to win ${P}. Break-even (“alpha”) = bet ÷ (bet + pot) = ${b} ÷ (${b} + ${P}) = <b>${pc1(alpha)}</b>.`,
      rule:'A bluff needs folds at least bet ÷ (bet + pot) of the time.'};
    if (kind === 'mdf') { const mdf = P / (P + b); return {scene:{facts:[{k:'Pot', v:P}, {k:'Their bet', v:b}]},
      prompt:`Your opponent bets ${b} into a pot of ${P}. What is your minimum defence frequency?`,
      options:pctOpts(mdf, [alpha, 1 - b / (P + 2 * b), b / (P + 2 * b)]),
      work:`MDF = pot ÷ (pot + bet) = ${P} ÷ (${P} + ${b}) = <b>${pc1(mdf)}</b>. It is 1 − alpha: continue less often and any two cards bluff profitably.`,
      rule:'MDF is a sanity check. Against players who almost never bluff, folding more is correct.'}; }
    const F = pick([0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7]);
    if (Math.abs(F - alpha) < 0.05) continue;
    const ev = F * P - (1 - F) * b;
    return {scene:{facts:[{k:'Pot', v:P}, {k:'Your bluff', v:b}, {k:'They fold', v:Math.round(F * 100) + '%'}]},
      prompt:`You bluff ${b} into a pot of ${P}, and your opponent folds ${Math.round(F * 100)}% of the time. What is the bluff’s expected value?`,
      options:opts(signed(ev), [signed(F * (P + b) - (1 - F) * b), signed((1 - F) * P - F * b), signed(F * P - b)]),
      work:`EV(bluff) = fold% × pot − call% × bet = ${pc1(F)} × ${P} − ${pc1(1 - F)} × ${b} = <b>${signed(ev)}</b>. It needs ${pc1(alpha)} folds to break even, so this bluff ${ev > 0 ? 'makes' : 'loses'} money.`,
      rule:'EV(bluff) = fold% × pot − call% × bet. Choose the option with the highest EV, not the one most likely to win this hand.'};
  }
  return qPrice();
}

function sprZone(s) {
  if (s < 3) return 'Below about 3, top pair with a good kicker or better is happy to go all-in.';
  if (s <= 6) return 'Between 3 and 6, overpairs and strong top pairs can commit on safe boards.';
  if (s <= 10) return 'Between 6 and 10 the sources differ; most want two pair or better before stacking off.';
  return 'Above about 10, one pair is a pot-control hand: you want two pair or better for your whole stack.';
}
function qSPR() {
  const kind = pick(['calc', 'calc', 'plan', 'size']);
  if (kind === 'calc') {
    for (let t = 0; t < 80; t++) {
      const S = pick([50, 60, 100, 100, 100, 150, 200]);
      const open = pick([2, 2.25, 2.5, 3]);
      const type = pick(['single', 'single', '3bet', '4bet']);
      const t3 = Math.round(open * 4 * 2) / 2, t4 = Math.round(t3 * 2.4 * 2) / 2;
      const put = type === 'single' ? open : type === '3bet' ? t3 : t4;
      if (put >= S * 0.7) continue;
      const pot = 2 * put + 0.5, behind = S - put, spr = behind / pot;
      const vals = [spr];
      for (const w of [S / pot, behind / (2 * put), spr * 1.6, spr * 0.6, spr + 3]) {
        if (vals.length < 4 && vals.every(v => Math.abs(v - w) >= 0.3)) vals.push(w);
      }
      const action = type === 'single' ? 'The big blind calls.'
        : type === '3bet' ? `The big blind 3-bets to ${t3}bb and the button calls.`
        : `The big blind 3-bets to ${t3}bb, the button 4-bets to ${t4}bb and the big blind calls.`;
      return {scene:{facts:[{k:'Stacks', v:S + 'bb'}, {k:'Pot type', v:type === 'single' ? 'Single raised' : type === '3bet' ? '3-bet' : '4-bet'}]},
        prompt:`Stacks are ${S}bb. The button opens to ${open}bb and the small blind folds. ${action} What is the SPR on the flop?`,
        options:shuffle(vals.map((v, i) => ({label:v.toFixed(1), correct:i === 0}))),
        work:`Pot on the flop: ${put} + ${put} + 0.5 (the small blind) = <b>${num(pot)}bb</b>. Behind: ${S} − ${put} = <b>${num(behind)}bb</b>. SPR = ${num(behind)} ÷ ${num(pot)} = <b>${spr.toFixed(1)}</b>. ${sprZone(spr)}`,
        rule:'SPR = effective stack ÷ pot on the flop.'};
    }
  }
  if (kind === 'plan') {
    const zone = rand(3);
    const spr = zone === 0 ? pick([1.2, 1.6, 2, 2.5]) : zone === 1 ? pick([3.5, 4, 4.5, 5, 5.5]) : pick([11, 13, 15, 17.7, 20]);
    const hand = pick(['an overpair', 'top pair with a good kicker']);
    return {scene:{facts:[{k:'SPR', v:spr}, {k:'Board', v:'Dry'}]},
      prompt:`The SPR on the flop is ${spr}. You have ${hand} on a dry, safe board. What is your stack plan?`,
      options:fixedOpts([['Happy to get all-in', zone === 0], ['Can commit on a safe board', zone === 1], ['Pot control: want two pair or better', zone === 2]]),
      work:`${sprZone(spr)} To get all-in with three equal bets at SPR ${spr} you would bet about ${Math.round(fBet(spr) * 100)}% of the pot each street.`,
      rule:'Below about 3, commit with top pair good kicker or better. From 3 to 6, overpairs and strong top pairs can commit on safe boards. Above about 10, one pair is pot control.'};
  }
  const spr = pick([2, 3, 4, 6, 8, 10, 15, 18]), f = fBet(spr);
  const p = x => Math.round(x * 100) + '%';
  return {scene:{facts:[{k:'SPR', v:spr}, {k:'Streets', v:3}]},
    prompt:`The SPR on the flop is ${spr}. You want to get all-in by the river with three equal bets, each the same share of the pot. How big is each bet?`,
    options:opts(p(f), [p(fBet(spr / 2)), p(fBet(spr * 2)), p(spr / 3)]),
    work:`Each called bet of f × pot grows the pot by (1 + 2f). After three streets the whole stack is in, so (1 + 2f)³ = 1 + 2 × ${spr} = ${1 + 2 * spr}, which gives f ≈ <b>${p(f)}</b> of the pot.`,
    rule:'At SPR 4, three bets of about 54% pot get it in. At SPR 15–18 you would need more than pot every street, which only very strong hands want.'};
}

// Short stacks, from the seat chapter: what a stack in big blinds allows before the flop.
function qShortPlan() {
  const band = pick(['shove', 'mix', 'raise']);
  const bb = pick({shove:[5, 6, 7, 8, 9], mix:[16, 17, 18, 19], raise:[25, 30, 35, 40]}[band]);
  const seat = pick(['cutoff', 'button', 'hijack']);
  const work = {
    shove:`With ${bb}bb a normal raise puts a big share of your stack in, and you can’t fold after it. At about 10–15bb or less, preflop play becomes mostly <b>all-in or fold</b>.`,
    mix:`${bb}bb sits between about 10 and 20bb, where you <b>mix all-in shoves with small raises</b>.`,
    raise:`Above about 20bb a <b>small raise</b> usually beats shoving: it risks less and still lets you fold to a re-raise.`}[band];
  return {scene:{facts:[{k:'Game', v:'Tournament'}, {k:'Your stack', v:bb + 'bb'}, {k:'Seat', v:cap(seat)}]},
    prompt:`Tournament. Everyone folds to you on the ${seat} with ${bb}bb and a hand you want to play. What kind of move fits that stack?`,
    options:fixedOpts([['All-in or fold', band === 'shove'], ['Mix all-in shoves with small raises', band === 'mix'], ['A small raise (min-raise)', band === 'raise'], ['Limp and see a flop', false]]),
    work:work + ' Limping is never the plan: the guide’s first preflop rule is to raise when you are first in.',
    rule:'At about 10–15bb or less, play all-in or fold. Between about 10 and 20bb, mix shoves with small raises. Above about 20bb, a min-raise usually beats shoving.'};
}
function qShortSet() {
  const short = rand(2) === 0;
  const S = short ? pick([15, 20, 25, 30]) : pick([60, 80, 100, 150]);
  const r = pick([2.5, 3]), pr = pick(['2', '3', '4', '5', '6']), x = S / r;
  const call = x >= 15, suits = shuffle(['s', 'h', 'd', 'c']);
  return {scene:{hero:[toCard(pr + suits[0]), toCard(pr + suits[1])], facts:[{k:'Effective stack', v:S + 'bb'}, {k:'Raise to', v:fmtBB(r) + 'bb'}]},
    prompt:`Effective stacks are ${S}bb. A regular opens to ${fmtBB(r)}bb and you hold ${pr}${pr} on the button. Do you call to set-mine?`,
    two:true,
    options:fixedOpts([['Call to set-mine', call], ['Fold', !call]]),
    work:`${S}bb is ${num(x)}× the raise. Set mining wants at least 15× in position, because you flop a set only 11.8% of the time and need to be paid when you do. ${call ? 'There is enough behind: call.' : 'A short stack can’t pay you enough: fold. SplitSuit calls set mining against a 25bb stack “pointless”.'}`,
    rule:'Small pairs and suited connectors need deep stacks and opponents who pay you off when you hit.'};
}
function qShortHand() {
  const HIGH = ['K7s', 'K9s', 'Q9s', 'A8o', 'KTo', 'A9s', 'QJo'], SPEC = ['43s', '54s', '65s', '76s', '22', '33', '44', '64s'];
  const short = rand(2) === 0;
  const right = pick(short ? HIGH : SPEC), wrongs = shuffle(short ? SPEC : HIGH).slice(0, 3);
  return {prompt:short
      ? 'Stacks are short, about 25bb. Which of these hands goes up in value?'
      : 'Stacks are deep, about 150bb, and the players behind you pay off too much. Which of these hands gains most from the deep stacks?',
    options:opts(right, wrongs),
    work:short
      ? `High-card hands like <b>${right}</b> win by making top pair, which is often enough at a short stack. ${wrongs.join(', ')} need deep stacks: they hit rarely and must win a big pot when they do.`
      : `<b>${right}</b> is a speculative hand: it hits rarely but can win a big pot when it does, which needs deep stacks. Deeper stacks add hands like 43s to button opens, while ${wrongs.join(', ')} mostly win by making top pair.`,
    rule:'Shorter stacks favour high-card hands like K7s; deeper stacks favour small pairs and suited connectors.'};
}

const CONCEPTS = [
  {cat:'price', prompt:'The pot is 100 and your opponent bets 50. A friend says you need 50% equity to call. What went wrong?',
   options:['They compared the call with the pot before the bet. You need 25%.', 'Nothing. You need 50%.', 'They forgot implied odds. You need 33%.', 'They should divide by the bet. You need 100%.'],
   work:'You call 50 to win a final pot of 200 (100 + 50 + 50), so you need 50 ÷ 200 = <b>25%</b>. Comparing 50 with the 100 already in the pot is the most common beginner mistake.',
   rule:'Divide your call by the pot after you call.'},
  {cat:'sizes', prompt:'Which statement about calling a bet is true?',
   options:['No bet, however big, asks for 50% equity.', 'A pot-sized bet needs 50% equity.', 'A half-pot bet needs a third.', 'A 2x pot overbet needs more than half.'],
   work:'Even a 2x pot overbet needs only 40%: you call 2 to win 5. Half-pot needs a quarter and pot needs a third.',
   rule:'Half-pot needs a quarter, pot needs a third, and no bet ever needs 50%.'},
  {cat:'outs', prompt:'When does the Rule of 4 (outs × 4 on the flop) give your real chance of winning?',
   options:['Only when someone is all-in, so you see both cards for one price.', 'Any time you are on the flop.', 'Only on the turn.', 'Only with fewer than 8 outs.'],
   work:'With stacks still behind you will probably face another bet on the turn, so you are only paying to see one card. A 50 all-in into 100 with a flush draw is worth about +20 on the flop, but the same bet on the turn is worth about −11.',
   rule:'Unless someone is all-in, compare the one-card odds with the current price.'},
  {cat:'outs', prompt:'Your opponent has flopped a set and you hold ace-high. How many outs do your three remaining aces give you?',
   options:['None: a pair of aces still loses to a set.', 'Three.', 'Six.', 'Three, but only on the river.'],
   work:'An out has to make your hand the winner. Pairing your ace against a set wins nothing.',
   rule:'Count only outs that actually win.'},
  {cat:'implied', prompt:'You hold 66 on a K-9-3 rainbow flop with 39% equity, and the bet only asks for 30%. What should you do?',
   options:['Fold: you lose the pot every time your opponent bets the river.', 'Call: 39% beats 30%.', 'Raise to protect your hand.', 'Call and plan to bluff the river.'],
   work:'Raw equity is not enough. Reverse implied odds, the money you lose on later streets, make this a fold: you can rarely win at showdown when your opponent keeps betting.',
   rule:'Before calling, ask whether you are sure to be best when you hit. If not, count fewer outs and expect to win less.'},
  {cat:'implied', prompt:'You have $500 and your opponent has $80. They raise to $8 and you hold 44. Which stack decides whether set mining works?',
   options:['Their $80: you can never win more than they have.', 'Your $500.', 'Both stacks added together.', 'Neither: only the pot size matters.'],
   work:'The effective stack is the smaller of the two, $80. 15 × $8 = $120 is more than $80, so calling to hit a set fails the test.',
   rule:'Implied-odds multiples apply to the effective stack.'},
  {cat:'implied', prompt:'Why does a J-7 suited flush draw, out of position against a player with $117 behind, fail the implied odds test?',
   options:['You won’t have the nuts when you hit, and little money is left to win.', 'Flush draws never have implied odds.', 'Being out of position adds outs.', 'Because $117 is too much to win.'],
   work:'Implied odds need deep stacks and a hand that is best when it hits. A low flush can lose a big pot to a better flush, and a short stack caps what you can win.',
   rule:'Implied odds pay only when stacks are deep and your hand is hidden and strong.'},
  {cat:'bluff', prompt:'A passive low-stakes player makes a big river bet. MDF says to continue 50% of the time. What should you do?',
   options:['Fold more: their big bets are mostly value.', 'Call with the top 50% of your range anyway.', 'Raise as a bluff.', 'Call with any pair.'],
   work:'MDF assumes your opponent bluffs at a balanced rate. Low-stakes live players bluff far less, so mechanically defending MDF against them is a leak.',
   rule:'MDF is a sanity check, not an instruction to call with junk.'},
  {cat:'spr', prompt:'Effective stacks are 30bb. An opponent opens to 3bb and a normal 3-bet would be about 10bb. You want to play a strong hand. What does the guide suggest?',
   options:['Shove or fold instead of 3-betting to 10bb.', '3-bet to 10bb and decide on the flop.', 'Min-3-bet to 6bb.', 'Always just call.'],
   work:'A 10bb 3-bet commits about a third of a 30bb stack. At that point PokerCoaching says to shove or fold rather than make a raise you can’t fold after.',
   rule:'If a 3-bet would commit about a third of your stack, shove or fold instead.'},
  {cat:'spr', prompt:'In a normal single-raised pot (SPR about 15–18) you have top pair. How should you think about value?',
   options:['The SPR is usually too high to bet top pair for three streets.', 'Bet big on all three streets to get it in.', 'Always check and fold.', 'Shove the flop.'],
   work:'Getting all-in by the river at SPR 15–18 takes more than a pot-sized bet every street. Only very strong hands want that much money in, so one pair controls the pot.',
   rule:'Above about 10, one pair is a pot-control hand.'},
  {cat:'spr', prompt:'What continuation-bet size does Upswing suggest in 3-bet pots, where the SPR is low?',
   options:['Small: about 25–40% of the pot.', 'An overbet of 150% of the pot.', 'Always pot-sized.', 'Never c-bet in 3-bet pots.'],
   work:'With SPR around 4, smaller bets on each street still get the stacks in by the river, so bet small and plan your sizes across all streets.',
   rule:'Plan bet sizes across all streets so you don’t leave an awkward tiny river bet.'},
  {cat:'short', prompt:'You are close to the prize-money places in a tournament with 10bb. How does payout pressure (ICM) change your shoving range?',
   options:['It tightens it: you shove fewer hands.', 'It widens it: shove more to build a stack.', 'It changes nothing below 20bb.', 'You should limp instead.'],
   work:'Near the money, busting costs more than doubling up gains. At 10bb from under the gun, Upswing’s ICM-adjusted chart shoves only 8.5% of hands, against 16.9% in PokerCoaching’s standard chart.',
   rule:'Near the prize-money places, payout pressure tightens everything.'},
  {cat:'short', prompt:'What do antes do to tournament ranges?',
   options:['They add money to every pot, which widens opening and shoving ranges.', 'They tighten ranges, since every hand costs more.', 'Nothing: only the blinds matter.', 'They make limping correct.'],
   work:'Antes are small forced bets from every player, so there is more to win before the flop. Stealing it is worth more, and ranges widen.',
   rule:'Rising blinds and antes push tournament stacks short fast.'},
  {cat:'short', prompt:'When does the guide say the tournament adjustments make most sense to learn?',
   options:['After cash-game basics are solid.', 'Before anything else.', 'Only once you play for a living.', 'Never: cash rules apply unchanged.'],
   work:'The guide’s staged plan puts push/fold and ICM last, as an optional stage after preflop, maths, postflop play, hand reading and opponent adjustments.',
   rule:'These tournament adjustments make most sense after cash-game basics are solid.'}
];

const PCATS = [
  {id:'mixed', name:'Mixed'},
  {id:'price', name:'Price to call', gen:[qPrice]},
  {id:'sizes', name:'Bet-size table', gen:[qSizes]},
  {id:'outs', name:'Outs & odds', gen:[qOuts]},
  {id:'ev', name:'Call or fold', gen:[qEV]},
  {id:'implied', name:'Implied odds', gen:[qImplied, qSetMine]},
  {id:'bluff', name:'Bluffs & defence', gen:[qBluff]},
  {id:'spr', name:'Stack-to-pot ratio', gen:[qSPR]},
  {id:'short', name:'Short stacks', gen:[qShortPlan, qShortSet, qShortHand]}
];
const catById = id => PCATS.find(c => c.id === id);
if (!catById(prefs.potCat)) prefs.potCat = 'mixed';

const freshPot = () => ({total:0, correct:0, streak:0, best:0, cats:{}});
let potStats = Object.assign(freshPot(), loadJSON(STORE + ':pot'));
const pot = {q:null, answered:false, choice:null, qNo:1, lastPrompt:''};

function makeQuestion() {
  const id = prefs.potCat === 'mixed' ? pick(PCATS.slice(1)).id : prefs.potCat;
  const concepts = CONCEPTS.filter(c => c.cat === id && c.prompt !== pot.lastPrompt);
  let q;
  if (concepts.length && rand(100) < 18) {
    const c = pick(concepts);
    q = {prompt:c.prompt, options:opts(c.options[0], c.options.slice(1)), work:c.work, rule:c.rule, single:true};
  } else {
    for (let t = 0; t < 5; t++) { q = pick(catById(id).gen)(); if (q.prompt !== pot.lastPrompt) break; }
  }
  q.cat = id;
  pot.lastPrompt = q.prompt;
  return q;
}
function newQuestion() { showQuestion(makeQuestion()); }
function showQuestion(q) {
  pot.q = q;
  pot.answered = false;
  pot.choice = null;
  pot.qNo = potStats.total + 1;
  renderPot();
}
function answerPot(i) {
  if (pot.answered || !pot.q.options[i]) return;
  pot.answered = true;
  pot.choice = i;
  const ok = pot.q.options[i].correct;
  potStats.total++;
  if (ok) { potStats.correct++; potStats.streak++; potStats.best = Math.max(potStats.best, potStats.streak); }
  else potStats.streak = 0;
  const c = potStats.cats[pot.q.cat] || (potStats.cats[pot.q.cat] = {n:0, c:0});
  c.n++; if (ok) c.c++;
  saveJSON(STORE + ':pot', potStats);
  rvRecord('pot', ok, pot.q.rv, () => pot.q);
  renderPot();
  const nb = $('#nextQ'); if (nb) nb.focus({preventScroll:true});
}

function sceneHTML(s) {
  if (!s) return '';
  const groups = [];
  if (s.board) groups.push(`<div class="cardgroup"><span class="lbl">Board${s.street ? ' · ' + s.street : ''}</span><div class="cardrow">${s.board.map(pcHTML).join('')}</div></div>`);
  if (s.hero) groups.push(`<div class="cardgroup"><span class="lbl">Your hand</span><div class="cardrow">${s.hero.map(pcHTML).join('')}</div></div>`);
  const facts = (s.facts || []).map(f => `<div><dt>${f.k}</dt><dd>${f.v}${f.note ? `<small>${f.note}</small>` : ''}</dd></div>`).join('');
  return `<div class="scene">${groups.length ? `<div class="scene-cards">${groups.join('')}</div>` : ''}${facts ? `<dl class="facts">${facts}</dl>` : ''}</div>`;
}
function renderPotCats() {
  $('#pcats').innerHTML = PCATS.map(c => {
    const s = c.id === 'mixed' ? {n:potStats.total, c:potStats.correct} : (potStats.cats[c.id] || {n:0, c:0});
    return `<button type="button" class="cat" data-cat="${c.id}" aria-pressed="${c.id === prefs.potCat}">${c.name}${s.n ? `<small>${s.c}/${s.n}</small>` : ''}</button>`;
  }).join('');
}
function renderPotScore() {
  $('#pst-correct').textContent = `${potStats.correct}/${potStats.total}`;
  $('#pst-acc').textContent = potStats.total ? Math.round(potStats.correct / potStats.total * 100) + '%' : '–';
  $('#pst-streak').textContent = potStats.streak;
  $('#pst-best').textContent = potStats.best;
}
function renderPot() {
  renderPotCats();
  renderPotScore();
  const q = pot.q;
  $('#q-eyebrow').textContent = `${rvLabel(q.rv) || 'Question ' + pot.qNo} · ${catById(q.cat).name}`;
  $('#q-scene').innerHTML = cash(sceneHTML(q.scene));
  $('#q-scene').hidden = !q.scene;
  $('#q-prompt').textContent = cash(q.prompt);
  $('#q-options').innerHTML = q.options.map((o, i) => {
    let cls = 'opt';
    if (pot.answered && o.correct) cls += ' right';
    else if (pot.answered && i === pot.choice) cls += ' wrong';
    return `<button type="button" class="${cls}" data-opt="${i}"${pot.answered ? ' disabled' : ''}><kbd>${i + 1}</kbd><span>${cash(o.label)}</span></button>`;
  }).join('');
  const el = $('#q-result');
  if (!pot.answered) { el.hidden = true; el.innerHTML = ''; return; }
  const ok = q.options[pot.choice].correct;
  const right = cash(q.options.find(o => o.correct).label);
  el.hidden = false;
  el.innerHTML = `
    <div class="verdict ${ok ? 'ok' : 'bad'}">
      <span class="mark" aria-hidden="true">${ok ? '✓' : '✕'}</span>
      <div class="v-text"><h3>${ok ? 'Correct.' : 'Not quite.'}</h3><p>${ok ? 'Streak: ' + potStats.streak : 'Answer: ' + right}</p></div>
      <button type="button" class="new-hand" id="nextQ">Next question <kbd>N</kbd></button>
    </div>
    <p class="work">${cash(q.work)}</p>
    <p class="rule"><strong>Rule from the chapter</strong>${q.rule}</p>`;
}

$('#q-options').addEventListener('click', e => { const b = e.target.closest('[data-opt]'); if (b) answerPot(+b.dataset.opt); });
$('#q-result').addEventListener('click', e => { if (e.target.closest('#nextQ')) rvNext() || newQuestion(); });
$('#pcats').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b || b.dataset.cat === prefs.potCat) return;
  prefs.potCat = b.dataset.cat; savePrefs(); newQuestion();
});
armReset($('#preset'), () => { potStats = freshPot(); saveJSON(STORE + ':pot', potStats); renderPotScore(); renderPotCats(); rvClear('pot'); });

/* ---------- Workbench ---------- */
const val = id => { const v = parseFloat($(id).value); return isFinite(v) && v >= 0 ? v : 0; };
const dl = rows => rows.map(([k, v, cls]) => `<dt>${k}</dt><dd${cls ? ` class="${cls}"` : ''}>${v}</dd>`).join('');
function updateBench() {
  const P = val('#w-pot'), b = val('#w-bet');
  if (b > 0) {
    $('#w-price').innerHTML = dl([
      ['You call', `${num(b)} to win ${num(P + 2 * b)}`],
      ['Bet size', P > 0 ? pc1(b / P) + ' of pot' : '–'],
      ['Equity needed', pc1(b / (P + 2 * b))],
      ['Pot odds', ratio((P + b) / b) + ' : 1'],
      ['Bluff must work', pc1(b / (P + b))],
      ['Minimum defence', pc1(P / (P + b))],
      ['River value : bluff', ratio((P + b) / b) + ' : 1']
    ]);
    const e = Math.min(100, val('#w-eq')) / 100;
    const ev = e * (P + b) - (1 - e) * b;
    $('#w-ev').innerHTML = dl([
      ['EV of calling', signed(ev), ev >= 0 ? 'pos' : 'neg'],
      ['Verdict', ev >= 0 ? 'Calling profits' : 'Calling loses']
    ]);
  } else {
    $('#w-price').innerHTML = dl([['Enter a bet', '–']]);
    $('#w-ev').innerHTML = dl([['EV of calling', '–']]);
  }
  const n = Math.min(20, Math.max(0, Math.round(val('#w-outs'))));
  $('#w-outsout').innerHTML = n ? dl([
    ['By the river, all-in on flop', pc1(two(n))],
    ['Turn card only (n ÷ 47)', pc1(n / 47)],
    ['River card only (n ÷ 46)', pc1(n / 46)],
    ['Odds against, one card', ratio((46 - n) / n, 1) + ' : 1'],
    ['Rule of 4 / Rule of 2', `${n * 4 - Math.max(0, n - 8)}% / ${n * 2}%`]
  ]) : dl([['Enter your outs', '–']]);
  const S = val('#w-stack'), fp = val('#w-fpot');
  if (fp > 0) {
    const s = S / fp;
    $('#w-spr').innerHTML = dl([
      ['SPR', num(s)],
      ['Bet per street to be all-in', Math.round(fBet(s) * 100) + '% pot']
    ]);
    $('#w-sprnote').textContent = sprZone(s);
  } else {
    $('#w-spr').innerHTML = dl([['Enter the flop pot', '–']]);
    $('#w-sprnote').textContent = '';
  }
}
['#w-pot', '#w-bet', '#w-eq', '#w-outs', '#w-stack', '#w-fpot'].forEach(id => $(id).addEventListener('input', updateBench));

function buildTables() {
  $('#tbl-sizes').innerHTML = `<thead><tr><th>Bet size</th><th>Pot odds offered</th><th>Caller needs equity</th><th>A pure bluff must succeed</th><th>Minimum defence frequency</th><th>Balanced river value : bluff</th></tr></thead><tbody>` +
    SIZE_ROWS.map(r => { const s = sz(r.f); return `<tr><td>${r.n}</td><td>${ratio(s.odds)} : 1</td><td>${pc1(s.need)}</td><td>${pc1(s.bluff)}</td><td>${pc1(s.mdf)}</td><td>${ratio(s.odds)} : 1</td></tr>`; }).join('') + '</tbody>';
  const rows = [['Gutshot, or two pair to full house', 4], ['Two overcards', 6], ['Open-ended straight draw', 8], ['Flush draw', 9], ['Flush draw + gutshot or overcard', 12], ['Flush draw + open-ended', 15]];
  $('#tbl-outs').innerHTML = `<thead><tr><th>Draw</th><th>Outs</th><th>By river (from flop)</th><th>On river (from turn)</th><th>Odds against, one card</th></tr></thead><tbody>` +
    rows.map(([name, n]) => `<tr><td>${name}</td><td>${n}</td><td>${pc1(two(n))}</td><td>${pc1(n / 46)}</td><td>${ratio((46 - n) / n, 1)} : 1</td></tr>`).join('') + '</tbody>';
}
