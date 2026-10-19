'use strict';

/* =====================================================================
   SEAT DRILL
   ===================================================================== */

// Range notation from the guide: "s" suited, "o" offsuit, "+" = that hand and every better one of its kind.
function expand(token) {
  const plus = token.endsWith('+');
  const t = plus ? token.slice(0, -1) : token;
  const hi = t[0], lo = t[1], kind = t[2] || '';
  const out = [];
  if (hi === lo) {
    if (plus) for (let i = ri(hi); i >= 0; i--) out.push(RANKS[i] + RANKS[i]);
    else out.push(t);
  } else if (plus) {
    for (let i = ri(lo); i > ri(hi); i--) out.push(hi + RANKS[i] + kind);
  } else {
    out.push(t);
  }
  return out;
}
const combos = c => c.length === 2 ? 6 : (c[2] === 's' ? 4 : 12);

const RANGES = {
  UTG9:   {txt:'77+, ATs+, KTs+, QTs+, T9s, AQo+',
           src:"Upswing's simpler 9-handed beginner list for under the gun."},
  UTG1_9: {txt:'66+, A9s+, KTs+, QTs+, JTs, T9s, AJo+, KQo', interp:true,
           src:"Not charted in the guide. Interpolated between UTG and the lojack, sized to PokerCoaching's 11.4% 8-handed UTG."},
  UTG2_9: {txt:'55+, A7s+, A5s, K9s+, QTs+, JTs, T9s, 98s, AJo+, KQo', interp:true,
           src:'Not charted in the guide. Interpolated between UTG+1 and the lojack.'},
  LJ:     {txt:'55+, A2s+, K9s+, Q9s+, J9s+, T8s+, 98s, 87s, 76s, AJo+, KQo', pub:16.0,
           src:'Upswing 6-max UTG/LJ opening range, 100bb.'},
  HJ:     {txt:'44+, A2s+, K9s+, Q9s+, J9s+, T8s+, 97s+, 87s, 76s, 65s, ATo+, KJo+, QJo', pub:20.4,
           src:'Upswing 6-max HJ opening range, 100bb.'},
  CO:     {txt:'22+, A2s+, K8s+, Q8s+, J8s+, T8s+, 97s+, 86s+, 76s, 65s, 54s, ATo+, KTo+, QTo+, JTo', pub:24.9,
           src:'Upswing 6-max CO opening range, 100bb.'},
  BTN:    {txt:'22+, A2s+, K3s+, Q5s+, J6s+, T6s+, 96s+, 85s+, 75s+, 64s+, 54s, 43s, A2o+, K9o+, Q9o+, J9o+, T9o', pub:40.9,
           src:'Upswing 6-max BTN opening range, 100bb.'},
  SB:     {txt:'22+, A2s+, K2s+, Q4s+, J6s+, T6s+, 95s+, 84s+, 74s+, 63s+, 53s+, 43s, 32s, A2o+, K8o+, Q8o+, J8o+, T8o+, 98o', pub:47.8,
           src:'Upswing 6-max SB opening range, 100bb, played raise-or-fold.'}
};
for (const key in RANGES) {
  const R = RANGES[key];
  R.set = new Set(R.txt.split(',').map(s => s.trim()).flatMap(expand));
  R.pct = [...R.set].reduce((n, c) => n + combos(c), 0) / 13.26;
}
const pctText = R => (R.pub != null ? R.pub : R.pct).toFixed(1) + '%';

const NOTE = {
  CO: 'Late position. Only the button and the blinds are left behind you, and you will often act last after the flop.',
  BTN: 'The button acts last on every street after the flop. That information edge, plus control of the pot size, is why it opens around 41% of hands.',
  SB: 'The hardest seat: you act first on every street after the flop. Upswing opens about 40–50% here to about 3 bb and plays raise-or-fold. Even strong players lose about 15 bb/100 from the small blind.'
};
const BB = {label:'BB', full:'Big blind', group:'blinds', range:null};
const FORMATS = {
  six: {
    name:'6-max',
    ring:['BTN','SB','BB','UTG','HJ','CO'],          // clockwise from the button
    order:['UTG','HJ','CO','BTN','SB'],               // preflop action order (BB never opens)
    legend:[['early','none in 6-max'],['middle','UTG (LJ), HJ (MP)'],['late','CO, BTN'],['blinds','SB, BB']],
    seats:{
      UTG:{label:'UTG', alias:'LJ', full:'Under the gun', group:'middle', range:'LJ', ref:'UTG', pc:17.6,
           note:'In 6-max the three early full-ring seats disappear, so UTG plays like the full-ring lojack.'},
      HJ:{label:'HJ', alias:'MP', full:'Hijack', group:'middle', range:'HJ', ref:'the hijack', where:'in the hijack', pc:21.4,
          note:'Middle position. With one player fewer behind you than UTG, the range widens to about 20%.'},
      CO:{label:'CO', full:'Cutoff', group:'late', range:'CO', ref:'the cutoff', where:'in the cutoff', pc:27.8, note:NOTE.CO},
      BTN:{label:'BTN', full:'Button', group:'late', range:'BTN', ref:'the button', where:'on the button', pc:43.5, note:NOTE.BTN},
      SB:{label:'SB', full:'Small blind', group:'blinds', range:'SB', ref:'the small blind', where:'in the small blind', pc:62.3, pcNote:'raise or call', note:NOTE.SB},
      BB:BB
    }
  },
  nine: {
    name:'9-handed',
    ring:['BTN','SB','BB','UTG','UTG1','UTG2','LJ','HJ','CO'],
    order:['UTG','UTG1','UTG2','LJ','HJ','CO','BTN','SB'],
    legend:[['early','UTG, UTG+1, UTG+2'],['middle','LJ (MP), HJ'],['late','CO, BTN'],['blinds','SB, BB']],
    seats:{
      UTG:{label:'UTG', full:'Under the gun', group:'early', range:'UTG9', ref:'UTG',
           note:"Early position with eight players behind you, any of whom may raise, so this is the tightest range. Red Chip's live advice goes tighter still: 77+, AQs+, AKo."},
      UTG1:{label:'UTG+1', full:'Under the gun +1', group:'early', range:'UTG1_9', ref:'UTG+1', where:'at UTG+1', pc:11.4, pcNote:'8-handed UTG',
            note:"Early position with seven players behind you. The guide doesn't chart this seat, so the range is interpolated to match PokerCoaching's 8-handed UTG, which has the same seven players behind it."},
      UTG2:{label:'UTG+2', full:'Under the gun +2', group:'early', range:'UTG2_9', ref:'UTG+2', where:'at UTG+2',
            note:"Early position with six players behind you. The guide doesn't chart this seat, so the range is interpolated between UTG+1 and the lojack."},
      LJ:{label:'LJ', alias:'MP', full:'Lojack', group:'middle', range:'LJ', ref:'the lojack', where:'in the lojack', pc:15.7, pcNote:'8-handed',
          note:'Middle position. From here on a full-ring table plays like 6-max, so the lojack uses the 6-max UTG/LJ chart.'},
      HJ:{label:'HJ', full:'Hijack', group:'middle', range:'HJ', ref:'the hijack', where:'in the hijack',
          note:'Middle position, using the 6-max hijack chart.'},
      CO:{label:'CO', full:'Cutoff', group:'late', range:'CO', ref:'the cutoff', where:'in the cutoff', pc:26.1, pcNote:'8-handed', note:NOTE.CO},
      BTN:{label:'BTN', full:'Button', group:'late', range:'BTN', ref:'the button', where:'on the button', pc:40.3, pcNote:'8-handed', note:NOTE.BTN},
      SB:{label:'SB', full:'Small blind', group:'blinds', range:'SB', ref:'the small blind', where:'in the small blind', note:NOTE.SB},
      BB:BB
    }
  }
};
const GROUP = {early:'Early', middle:'Middle', late:'Late', blinds:'Blinds'};
const GROUP_LONG = {early:'Early position', middle:'Middle position', late:'Late position', blinds:'Blinds'};

const freshStats = () => ({total:0, correct:0, streak:0, best:0, seats:{}});
let stats = Object.assign(freshStats(), loadJSON(STORE + ':stats'));
if (!FORMATS[prefs.fmt]) prefs.fmt = 'six';
if (prefs.deal !== 'any' && prefs.deal !== 'close') prefs.deal = 'any';

const state = {seat:null, cards:null, hand:null, answered:false, choice:null, chartSeat:null, handNo:1, dealId:0};

function dealTwo() {
  const a = rand(52); let b = rand(51); if (b >= a) b++;
  return [a, b].map(i => Object.assign({r: RANKS[i % 13]}, SUITS[Math.floor(i / 13)])).sort((x, y) => ri(x.r) - ri(y.r));
}
const codeOf = ([h, l]) => h.r === l.r ? h.r + l.r : h.r + l.r + (h.k === l.k ? 's' : 'o');
const seatSet = (F, key) => RANGES[F.seats[key].range].set;
function isContested(code, F) {
  const ins = F.order.map(k => seatSet(F, k).has(code));
  return ins.some(Boolean) && !ins.every(Boolean);
}
const fmtNow = () => FORMATS[prefs.fmt];
const correctAction = () => seatSet(fmtNow(), state.seat).has(state.hand) ? 'raise' : 'fold';
const playersBehind = () => { const F = fmtNow(); return F.order.length - F.order.indexOf(state.seat); };

function newHand() {
  const F = fmtNow();
  const seat = F.order[rand(F.order.length)];
  let cards = dealTwo();
  if (prefs.deal === 'close') {
    for (let tries = 0; tries < 300; tries++) {
      if (isContested(codeOf(cards), F) || Math.random() < 0.2) break;
      cards = dealTwo();
    }
  }
  dealHand(seat, cards, null);
}
function dealHand(seat, cards, rvId) {   // rvId: set when the hand is a saved miss
  if (!fmtNow().seats[seat] || cards.length !== 2) throw new Error('bad hand');
  state.seat = seat;
  state.rv = rvId;
  state.cards = cards;
  state.hand = codeOf(cards);
  state.answered = false;
  state.choice = null;
  state.chartSeat = state.seat;
  state.handNo = stats.total + 1;
  state.dealId++;
  render();
}

function answer(choice) {
  if (state.answered) return;
  state.answered = true;
  state.choice = choice;
  const ok = choice === correctAction();
  stats.total++;
  if (ok) { stats.correct++; stats.streak++; stats.best = Math.max(stats.best, stats.streak); }
  else stats.streak = 0;
  const key = prefs.fmt + ':' + state.seat;
  const s = stats.seats[key] || (stats.seats[key] = {n:0, c:0});
  s.n++; if (ok) s.c++;
  saveJSON(STORE + ':stats', stats);
  rvRecord('seats', ok, state.rv, () => ({fmt:prefs.fmt, seat:state.seat, cards:state.cards}));
  render();
  const nb = $('#newHand'); if (nb) nb.focus({preventScroll:true});
}

/* ---------- Feedback text, built from the chapter ---------- */
function handName(code) {
  if (code.length === 2) return 'Pocket ' + RPLURAL[code[0]];
  return cap(RNAME[code[0]]) + '-' + RNAME[code[1]] + (code[2] === 's' ? ' suited' : ' offsuit');
}
function cutoffLine(code, set, ref) {
  if (code.length === 2) {
    const pairs = [...RANKS].filter(r => set.has(r + r));
    if (!pairs.length) return 'No pairs are opened from ' + ref + '.';
    const low = pairs[pairs.length - 1];
    return low === '2' ? `Pairs from ${ref}: every pair, 22 and up.` : `Pairs from ${ref}: ${low}${low} and up.`;
  }
  const hi = code[0], kind = code[2];
  const kick = [...RANKS.slice(ri(hi) + 1)];
  const cat = (kind === 's' ? 'suited ' : 'offsuit ') + RPLURAL[hi];
  const hits = kick.map(k => set.has(hi + k + kind));
  if (!hits.some(Boolean)) return `No ${cat} are opened from ${ref}.`;
  const parts = [];
  let i = 0;
  while (i < kick.length) {
    if (!hits[i]) { i++; continue; }
    let j = i;
    while (j + 1 < kick.length && hits[j + 1]) j++;
    const a = hi + kick[i] + kind, b = hi + kick[j] + kind;
    if (i === 0) parts.push(j === 0 ? a : b + '+');
    else parts.push(i === j ? a : a + '–' + b);
    i = j + 1;
  }
  return `${cap(cat)} from ${ref}: ${parts.join(', ')}.`;
}
function dominators(code) {
  const a = code[0], b = code[1];
  const list = [...RANKS.slice(0, ri(b))].filter(k => k !== a).map(k => ri(k) < ri(a) ? k + a : a + k).slice(0, 3);
  return list.length > 1 ? list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1] : list[0];
}
function typeNote(code, first) {
  const a = code[0], b = code[1], pair = code.length === 2, suited = code[2] === 's';
  if ((pair && ri(a) <= ri('T')) || (a === 'A' && (b === 'K' || b === 'Q')))
    return 'TT+ and AK/AQ are raised from every seat. They are the core of every opening range.';
  if (pair) {
    if (ri(a) >= ri('4'))
      return 'Pairs 22–44 are not raised from early seats. They earn mainly by set mining: a pair flops a set 11.8% of the time (about 7.5-to-1), which only pays when deep stacks are behind.';
    return 'Middle pairs are good hands, but play them less aggressively than big pairs. A pair flops a set 11.8% of the time, while an unpaired hand flops a pair about 29% of the time.';
  }
  if (first === -1) return suited
    ? 'Suitedness alone is not a big factor in hand strength. With cards this weak, even the small blind folds it.'
    : 'Hands like Q5o or 84o are never opened. Don’t start opening trash out of boredom.';
  if (suited) {
    if (a === 'A') return 'Suited aces come in early in every chart.' + ('5432'.includes(b) ? ' The small ones (A5s–A2s) also make good 3-bet bluffs from the button or small blind, because they block strong aces.' : '');
    if (ri(a) >= ri('T') && ri(b) - ri(a) <= 2)
      return 'Suited connectors flop a straight only about 1.3% of the time and a flush less than 1%. Their value comes from draws and strong hands that are hard to see coming, so they widen toward the button.';
    if (ri(b) <= ri('T')) return 'Suited high cards come in early. From there, suited kings, queens and connectors widen steadily toward the button.';
    return 'Suited kings, queens and jacks with low kickers widen steadily toward the button. Suitedness alone is not a big factor in hand strength, so a weak kicker needs a late seat.';
  }
  if (ri(b) <= ri('T'))
    return `Offsuit high cards suffer from domination: when ${code} pairs its ${RNAME[a]}, it loses big pots to ${dominators(code)}. They come in last, big cards first: AJo and KQo early, then ATo, KJo and QJo.`;
  if (a === 'A' || a === 'K') return 'Weak offsuit aces and kings only come in on the button and in the small blind.';
  return 'Low offsuit hands come in last of all. Only the button and small blind open them, with few players left to act.';
}
function limpNote(isSB) {
  return 'Calling when you are first in is an open-limp, and the guide’s most important preflop rule is to raise instead. Raising builds the pot, cuts the number of opponents, gives you the initiative and stops you getting raised off your hand.' +
    (isSB ? ' Solver charts do mix in some small-blind limps, but the guide says beginners can skip that and play raise-or-fold.' : '');
}
function sizeNote(seatKey) {
  return seatKey === 'SB'
    ? 'Size: open to about 3 bb from the small blind.'
    : 'Size: open to 2–2.5 bb online (Upswing uses 2.25 bb, or 2.5 bb on the button). Live, about 3 bb is standard, plus 1 bb for each limper.';
}
function feedback() {
  const F = fmtNow(), seat = F.seats[state.seat], R = RANGES[seat.range];
  const code = state.hand, inR = R.set.has(code);
  const correct = inR ? 'raise' : 'fold', choice = state.choice, ok = choice === correct;
  const first = F.order.map(k => seatSet(F, k).has(code)).indexOf(true);
  const reach = first === -1 ? 'No seat opens it, not even the small blind.'
    : first === 0 ? 'Every seat opens it.'
    : `It becomes an open from ${F.seats[F.order[first]].ref} onward.`;
  const items = [
    `<b>${code}</b> is ${inR ? 'in' : 'not in'} the ${seat.label} opening range (${pctText(R)} of hands). ${reach}`,
    cutoffLine(code, R.set, seat.ref),
    typeNote(code, first)
  ];
  if (choice === 'call') items.push(limpNote(state.seat === 'SB'));
  else if (!ok && choice === 'raise') {
    const n = playersBehind();
    items.push(`Opening hands below the cut-off is how players end up in too many pots. From ${seat.ref}, ${n === 1 ? 'the big blind is' : n + ' players are'} still to act behind you.`);
  } else if (!ok && choice === 'fold') items.push('The hand is profitable to open from this seat, so folding it gives up money.');
  if (correct === 'raise' && choice !== 'call') items.push(sizeNote(state.seat));
  items.push(seat.note);
  return {
    ok, correct, items,
    title: ok ? `Correct. ${cap(correct)}.` : `The chart says ${correct}.`,
    sub: ok ? `Streak: ${stats.streak}` : `You chose ${choice === 'call' ? 'call, which is an open-limp' : choice}.`
  };
}

/* ---------- Rendering ---------- */
const RX = 42.5, RY = 41, SQ = 2.6;   // seat ring radii (% of table box) and squareness of the rail
function ringPos(ang, t) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const sx = Math.sign(c) * Math.pow(Math.abs(c), 2 / SQ), sy = Math.sign(s) * Math.pow(Math.abs(s), 2 / SQ);
  return {x: (50 + RX * t * sx).toFixed(2), y: (50 + RY * t * sy).toFixed(2)};
}
const blindOf = key => key === 'SB' ? 0.5 : key === 'BB' ? 1 : 0;
function heroBet() {
  if (state.choice === 'raise') return state.seat === 'SB' ? 3 : 2.5;
  if (state.choice === 'call') return 1;
  return blindOf(state.seat);
}
const betFor = key => (key === state.seat && state.answered) ? heroBet() : blindOf(key);
const potSize = () => 1.5 + (state.answered ? heroBet() - blindOf(state.seat) : 0);
const ACT_DONE = {fold:'Folded', call:'Limped', raise:'Raised'};

function seatTitle(F, key) {
  const s = F.seats[key];
  if (!s.range) return `${s.full}. Never opens: if everyone folds, the big blind wins the pot.`;
  return `${s.full} · ${GROUP_LONG[s.group]} · opens ${pctText(RANGES[s.range])} of hands`;
}
const miniCard = c => `<div class="mini${c.red ? ' red' : ''}">${showRank(c.r)}<span>${c.sym}</span></div>`;
const bigCard = (c, i) => `<div class="card${c.red ? ' red' : ''}" style="--d:${i * 110}ms" role="img" aria-label="${cap(RNAME[c.r])} of ${c.name}"><span class="r">${showRank(c.r)}</span><span class="s">${c.sym}</span><span class="pip">${c.sym}</span></div>`;

function renderControls() {
  document.querySelectorAll('[data-fmt]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.fmt === prefs.fmt)));
  document.querySelectorAll('[data-deal]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.deal === prefs.deal)));
}
function renderScore() {
  $('#st-correct').textContent = `${stats.correct}/${stats.total}`;
  $('#st-acc').textContent = stats.total ? Math.round(stats.correct / stats.total * 100) + '%' : '–';
  $('#st-streak').textContent = stats.streak;
  $('#st-best').textContent = stats.best;
}
function renderTable() {
  const F = fmtNow(), n = F.ring.length;
  const heroOrder = F.order.indexOf(state.seat);
  const out = [`<div class="felt"><div class="felt-mid"><span class="pot-label">Pot</span><span class="pot">${fmtBB(potSize())} bb</span><span class="felt-note">${F.name} · 100bb deep · no antes</span></div></div>`];
  F.ring.forEach((key, i) => {
    const seat = F.seats[key];
    const ang = (90 + i * 360 / n) * Math.PI / 180;
    const p = ringPos(ang, 1);
    const ord = F.order.indexOf(key);
    const hero = key === state.seat;
    let cls = 'seat', status;
    if (hero) { cls += ' hero' + (state.answered ? '' : ' acting'); status = `<span class="status">${state.answered ? ACT_DONE[state.choice] : 'You'}</span>`; }
    else if (ord !== -1 && ord < heroOrder) { cls += ' folded'; status = '<span class="status">Folded</span>'; }
    else status = '<span class="backs" aria-label="Still to act"><b></b><b></b></span>';
    out.push(`<div class="${cls}" style="left:${p.x}%;top:${p.y}%;--gc:var(--g-${seat.group})" title="${seatTitle(F, key)}"><span class="pos">${seat.label}</span>${seat.alias ? `<span class="alias">aka ${seat.alias}</span>` : ''}${status}</div>`);
    // Cards sit straight in from the seat; chips sit just clockwise of it, the dealer button just counter-clockwise.
    const bet = betFor(key);
    if (bet) { const c = ringPos(ang + 20 * Math.PI / 180, 0.64); out.push(`<div class="chip" style="left:${c.x}%;top:${c.y}%"><i></i>${fmtBB(bet)}</div>`); }
    if (key === 'BTN') { const d = ringPos(ang - 22 * Math.PI / 180, 0.66); out.push(`<div class="dealer" style="left:${d.x}%;top:${d.y}%" title="Dealer button">D</div>`); }
    if (hero && state.choice !== 'fold') { const c = ringPos(ang, 0.55); out.push(`<div class="mini-cards" style="left:${c.x}%;top:${c.y}%">${state.cards.map(miniCard).join('')}</div>`); }
  });
  $('#table').innerHTML = out.join('');
}
function renderExtras() {
  const F = fmtNow();
  $('#groups').innerHTML = F.legend.map(([g, seats]) => `<li><i class="dot" style="--gc:var(--g-${g})"></i><b>${GROUP[g]}</b><span>${seats}</span></li>`).join('');
  $('#records').innerHTML = F.order.map(k => {
    const s = stats.seats[prefs.fmt + ':' + k] || {n:0, c:0}, seat = F.seats[k];
    const pct = s.n ? Math.round(s.c / s.n * 100) : 0;
    return `<div class="rec"><span class="rec-pos"><i class="dot" style="--gc:var(--g-${seat.group})"></i>${seat.label}</span><span class="rec-n">${s.n ? s.c + '/' + s.n : '–'}</span><span class="bar"><span style="width:${pct}%"></span></span></div>`;
  }).join('');
}
function renderPanel() {
  const F = fmtNow(), seat = F.seats[state.seat], idx = F.order.indexOf(state.seat), behind = playersBehind();
  $('#sc-eyebrow').textContent = `${rvLabel(state.rv) || 'Hand ' + state.handNo} · ${F.name} · 100bb cash`;
  $('#sc-head').textContent = idx === 0 ? 'You are first to act, under the gun' : `It folds to you ${seat.where}`;
  $('#sc-meta').innerHTML = `<span class="pill"><i class="dot" style="--gc:var(--g-${seat.group})"></i>${seat.label}${seat.alias ? ' (' + seat.alias + ')' : ''} · ${GROUP_LONG[seat.group]}</span><span class="pill">${behind} ${behind === 1 ? 'player' : 'players'} left to act</span>`;
  const handEl = $('#hand');
  if (handEl.dataset.deal !== String(state.dealId)) {   // only redraw (and re-animate) on a new deal
    handEl.dataset.deal = String(state.dealId);
    handEl.innerHTML = `<div class="cards">${state.cards.map(bigCard).join('')}</div><div class="hand-txt"><span class="hand-code">${state.hand}</span><span class="hand-name">${handName(state.hand)}</span></div>`;
  }
  $('#sub-call').textContent = state.seat === 'SB' ? 'complete to 1 bb' : 'limp 1 bb';
  $('#sub-raise').textContent = state.seat === 'SB' ? 'open to 3 bb' : 'open to 2.5 bb';
  const correct = correctAction();
  document.querySelectorAll('.act').forEach(b => {
    b.disabled = state.answered;
    b.classList.toggle('chosen', state.answered && b.dataset.act === state.choice);
    b.classList.toggle('answer', state.answered && b.dataset.act === correct);
  });
}
function renderResult() {
  const el = $('#result');
  if (!state.answered) { el.hidden = true; el.innerHTML = ''; return; }
  const fb = feedback();
  el.hidden = false;
  el.innerHTML = `
    <div class="verdict ${fb.ok ? 'ok' : 'bad'}">
      <span class="mark" aria-hidden="true">${fb.ok ? '✓' : '✕'}</span>
      <div class="v-text"><h3>${fb.title}</h3><p>${fb.sub}</p></div>
      <button type="button" class="new-hand" id="newHand">New hand <kbd>N</kbd></button>
    </div>
    <ul class="why">${fb.items.map(t => `<li>${t}</li>`).join('')}</ul>
    <div>
      <h4 class="mini-head">${state.hand} at every seat · pick one to see its chart</h4>
      <div class="strip" id="strip"></div>
    </div>
    <div class="chart" id="chart"></div>`;
  renderChart();
}
function renderChart() {
  const F = fmtNow(), seat = F.seats[state.chartSeat], R = RANGES[seat.range];
  $('#strip').innerHTML = F.order.map(k => {
    const inR = seatSet(F, k).has(state.hand);
    return `<button type="button" data-chart="${k}" aria-pressed="${k === state.chartSeat}"><span>${F.seats[k].label}${k === state.seat ? ' <span class="you">(you)</span>' : ''}</span><span class="yn ${inR ? 'raise' : 'fold'}">${inR ? 'Raise' : 'Fold'}</span></button>`;
  }).join('');
  let cells = '';
  for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
    const c = i === j ? RANKS[i] + RANKS[j] : i < j ? RANKS[i] + RANKS[j] + 's' : RANKS[j] + RANKS[i] + 'o';
    cells += `<div class="cell${R.set.has(c) ? ' in' : ''}${c === state.hand ? ' me' : ''}">${c}</div>`;
  }
  const pub = R.pub != null ? `${R.pub.toFixed(1)}% (Upswing)` : `${R.pct.toFixed(1)}%${R.interp ? ' (interpolated)' : ''}`;
  const pc = seat.pc ? ` · PokerCoaching${seat.pcNote ? ' ' + seat.pcNote : ''}: ${seat.pc}%` : '';
  $('#chart').innerHTML = `
    <p class="chart-head"><b>${seat.label}</b> opens ${pub}${pc}</p>
    <div class="grid" role="img" aria-label="${seat.label} opening chart: ${R.txt}">${cells}</div>
    <div class="chart-legend"><span><i class="sw in"></i>Raise</span><span><i class="sw"></i>Fold</span><span><i class="sw me"></i>Your hand</span><span>Suited above the diagonal, offsuit below</span></div>
    <p class="notation">${R.txt}</p>
    <p class="src">${R.src}</p>`;
}
function render() {
  renderControls(); renderScore(); renderTable(); renderExtras(); renderPanel(); renderResult();
}

document.querySelectorAll('.act').forEach(b => b.addEventListener('click', () => answer(b.dataset.act)));
$('#result').addEventListener('click', e => {
  if (e.target.closest('#newHand')) { rvNext() || newHand(); return; }
  const tab = e.target.closest('[data-chart]');
  if (tab) {
    state.chartSeat = tab.dataset.chart;
    renderChart();
    const again = document.querySelector(`[data-chart="${state.chartSeat}"]`);
    if (again) again.focus({preventScroll:true});
  }
});
document.querySelectorAll('[data-fmt]').forEach(b => b.addEventListener('click', () => {
  if (prefs.fmt === b.dataset.fmt) return;
  prefs.fmt = b.dataset.fmt; savePrefs(); newHand();
}));
document.querySelectorAll('[data-deal]').forEach(b => b.addEventListener('click', () => {
  if (prefs.deal === b.dataset.deal) return;
  prefs.deal = b.dataset.deal; savePrefs();
  if (state.answered) renderControls(); else newHand();
}));
armReset($('#reset'), () => { stats = freshStats(); saveJSON(STORE + ':stats', stats); renderScore(); renderExtras(); rvClear('seats'); });
