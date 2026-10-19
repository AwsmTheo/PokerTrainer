'use strict';

/* =====================================================================
   BOARD TEXTURE DRILL
   ===================================================================== */

const btVal = r => 14 - ri(r);                          // A = 14 … 2 = 2
const btRank = v => RANKS[14 - (v === 1 ? 14 : v)];
const btFlopTxt = f => f.map(c => showRank(c.r) + c.sym).join(' ');
const btFlopHTML = f => `<span class="bt-flop" role="img" aria-label="${btFlopTxt(f)}">${f.map(miniCard).join('')}</span>`;
function btDeal() {
  return shuffle([...Array(52).keys()]).slice(0, 3)
    .map(i => Object.assign({r: RANKS[i % 13]}, SUITS[Math.floor(i / 13)]))
    .sort((a, b) => ri(a.r) - ri(b.r));
}
function btInfo(f) {
  const v = f.map(c => btVal(c.r)), uniq = [...new Set(v)];
  const suits = Math.max(...SUITS.map(s => f.filter(c => c.k === s.k).length));
  let straight = false;   // three different ranks that fit inside five (the ace also plays low)
  if (uniq.length === 3) for (let lo = 1; lo <= 10 && !straight; lo++) {
    straight = uniq.every(x => (x >= lo && x <= lo + 4) || (x === 14 && lo === 1));
  }
  const gap = uniq.length === 3 ? Math.min(v[0] - v[1], v[1] - v[2]) : 0;
  return {v, high:v[0], paired:uniq.length === 2, trips:uniq.length === 1, suits, straight, gap};
}
// Only flops that clearly fit one row of the chapter's c-bet table get a texture; the rest are redealt.
function btTexture(i) {
  if (i.trips) return null;
  if (i.paired) return 'paired';
  if (i.suits === 3) return 'mono';
  if (i.high <= 9 && i.straight) return 'low';
  if (i.high >= 12 && i.suits === 1 && !i.straight && i.gap >= 4) return 'dry';
  if ((i.high === 10 || i.high === 11) && (i.straight || i.gap <= 1 || (i.suits === 2 && i.gap <= 2))) return 'wet';
  return null;
}
function btFlop(want) {   // want: a texture id, or a test on the flop's info
  for (let t = 0; t < 20000; t++) {
    const f = btDeal(), info = btInfo(f), tex = btTexture(info);
    if (tex && (typeof want === 'function' ? want(info, tex) : tex === want)) return {f, info, tex};
  }
  return btFlop('dry');
}
function btTags(i) {
  const tags = [btRank(i.high) === 'T' ? '10-high' : btRank(i.high) + '-high'];
  tags.push(i.suits === 3 ? 'Monotone' : i.suits === 2 ? 'Two-tone' : 'Rainbow');
  if (i.paired) tags.push('Paired');
  else tags.push(i.straight ? 'Straight possible' : i.gap <= 2 ? 'Straight draws' : 'Disconnected');
  return tags;
}

const BT_TEX = {
  dry:   {name:'Dry and high', plan:'small', fav:'raiser',
          read:'A dry, high flop: one big card, three suits and nothing that connects. It keeps the preflop raiser’s range advantage and gives the caller few draws.'},
  wet:   {name:'Wet and middling', plan:'big', fav:null,
          read:'A wet, middling flop: J- or 10-high with connected or two-tone cards. The caller has many draws and two-pair hands here.'},
  low:   {name:'Low and connected', plan:'check', fav:'caller',
          read:'A low, connected flop: three cards 9 or lower that fit inside five ranks. The big blind’s range “includes sets, two pair, straights, and connected hands,” while an early raiser’s best hand is usually an overpair.'},
  mono:  {name:'Monotone', plan:'mono', fav:null,
          read:'A monotone flop: all three cards share a suit. GTO Wizard: “frequency and sizing drop sharply.”'},
  paired:{name:'Paired', plan:'small', fav:'raiser',
          read:'A paired flop misses almost every range, and the caller rarely holds trips. GTO Wizard bets more often on paired and disconnected flops.'}
};
const BT_TEX_ORDER = ['dry', 'wet', 'low', 'mono', 'paired'];
const BT_PLAN = {
  small: 'Bet often and small, about 25–33% pot',
  big:   'Bet less often, 66–75% pot, with good value and strong draws',
  check: 'Check a lot; bet strong hands and draws large and polarised',
  mono:  'Bet less often and smaller',
  oop:   'Check much more; bet small only on strongly raiser-friendly boards',
  multi: 'No automatic c-bet: bet strong value and strong draws, check the rest'
};
const BT_SIZE_RULE = 'C-bet 25–35% pot on dry, static boards and 55–80% on wet, dynamic ones. Bet the turn again at 66% or more, and use 25–40% in 3-bet pots.';

function btQTexture() {
  if (rand(3) === 0) {   // pick the flop that fits a description
    const forBB = rand(2) === 0;
    const right = forBB ? 'low' : pick(['dry', 'paired']);
    const others = forBB ? shuffle(['dry', 'paired', pick(['dry', 'paired'])]) : shuffle(['wet', 'low', 'mono']);
    const flops = [btFlop(right)].concat(others.map(t => btFlop(t)));
    const options = shuffle(flops.map((x, i) => ({label: btFlopHTML(x.f), correct: i === 0, flop: x})));
    return {
      prompt: forBB ? 'Which flop hits the big blind’s calling range hardest?' : 'You opened on the button and the big blind called. Which flop suits a small, frequent c-bet?',
      options, flopOpts:true,
      work: options.map(o => `<b>${btFlopTxt(o.flop.f)}</b>: ${BT_TEX[o.flop.tex].name.toLowerCase()}.`).join(' ') + ' ' +
        (forBB ? BT_TEX.low.read : `Dry, high flops and paired flops keep the raiser’s edge, so a small bet with most of the range works. Wet, low connected and monotone flops call for fewer bets.`),
      rule: 'Bet more on high-card flops that keep the raiser’s advantage, and on paired and disconnected flops. Bet less on flops that complete straights or flushes for the caller.'
    };
  }
  const tex = pick(['dry', 'dry', 'wet', 'wet', 'low', 'low', 'mono', 'paired']);
  const x = btFlop(tex);
  return {
    scene:{board:x.f, street:'Flop'},
    prompt: 'Which texture is this flop?',
    options: BT_TEX_ORDER.map(t => ({label: BT_TEX[t].name, correct: t === tex})),
    tags: btTags(x.info), work: BT_TEX[tex].read + ' Default c-bet heads-up in position: ' + BT_PLAN[BT_TEX[tex].plan].toLowerCase() + '.',
    rule: 'Texture is how high, connected, suited and paired the flop is. It decides whose range the flop helps.'
  };
}

const BT_FAV = {
  raiser: 'The preflop raiser (you)',
  caller: 'The big blind (the caller)',
  shared: 'Shared: both hold plenty of nut hands'
};
function btQRange() {
  const seat = pick([['UTG', 'under the gun'], ['HJ', 'the hijack'], ['CO', 'the cutoff']]);
  const fav = pick(['raiser', 'raiser', 'caller', 'caller', 'shared']);
  const x = fav === 'raiser' ? btFlop((i, t) => t === 'dry' || t === 'paired')
    : fav === 'caller' ? btFlop('low')
    : btFlop((i, t) => t === 'mono' && i.straight);
  const why = {
    raiser: (x.tex === 'paired' ? BT_TEX.paired.read : BT_TEX.dry.read) +
      (x.info.high === 14 && x.tex === 'dry' ? ' Ace-high flops are still bet less often than 8- to K-high ones, because the big blind holds many aces and check-raises more.' : '') +
      ` The tighter your opening seat, the bigger the edge: opening from ${seat[1]} leaves you with more big pairs and big cards than the big blind.`,
    caller: BT_TEX.low.read + ' Expect strong players to check-raise a lot here, so check more and bet only strong hands and strong draws.',
    shared: 'Monotone and connected: both players hold plenty of flushes, straights and draws, and draws won’t fold. On Q♦J♦T♦ a solver drops back to small bets about half the time.'
  }[fav];
  return {
    scene:{board:x.f, street:'Flop', facts:[{k:'You opened', v:seat[0]}, {k:'Caller', v:'BB'}]},
    prompt: `You open from ${seat[1]} and only the big blind calls. Whose range does this flop favour?`,
    options: ['raiser', 'caller', 'shared'].map(k => ({label: BT_FAV[k], correct: k === fav})),
    tags: btTags(x.info), work: why,
    rule: 'Range advantage (more total equity) decides how often you bet. Nut advantage (more of the very best hands) decides how big.'
  };
}

function btQCbet() {
  const r = rand(10), mode = r < 6 ? 'ip' : r < 8 ? 'oop' : 'multi';
  const x = btFlop(pick(BT_TEX_ORDER)), T = BT_TEX[x.tex];
  let spot, facts, right, work;
  if (mode === 'ip') {
    const seat = pick(['the hijack', 'the cutoff', 'the button']);
    spot = `You open to 2.5bb from ${seat} and only the big blind calls. You will act last on every street.`;
    facts = [{k:'Pot', v:'5.5bb'}, {k:'Position', v:'In position'}, {k:'Players', v:2}];
    right = T.plan;
    work = T.read + ' ' + {
      small: 'Bet most of your range small, about a quarter to a third of the pot, and check some weak showdown hands.',
      big: 'Bet less often but bigger, 66–75% pot: top pair with a good kicker or better, strong draws and good backdoor bluffs. Check medium hands. Upswing’s T♠9♥4♣ plan: bet QT or better for value, check 55 to JT and some ace-high, bluff with straight and backdoor draws.',
      check: 'Check a lot. When you do bet, bet strong hands and strong draws, and bet them larger and polarised.',
      mono: 'Bet less often and smaller.'
    }[T.plan];
  } else if (mode === 'oop') {
    const s = pick([['the cutoff', 'the button', '6.5bb'], ['the hijack', 'the button', '6.5bb'], ['the small blind', 'the big blind', '6bb']]);
    spot = `You open from ${s[0]} and ${s[1]} calls. You act first on every street after the flop.`;
    facts = [{k:'Pot', v:s[2]}, {k:'Position', v:'Out of position'}, {k:'Players', v:2}];
    right = 'oop';
    work = 'Out of position, the raiser’s range edge “usually doesn’t offset the informational disadvantage,” so check much more. Checking your whole range out of position is “a decent strategy that is simpler to implement.” ' +
      (T.plan === 'small' ? 'This flop is one of the exceptions, like A72, 442, KK3 and AKJ, where a small, wide c-bet still works.' : `This ${T.name.toLowerCase()} flop is not one of the raiser-friendly exceptions (A72, 442, KK3, AKJ), so lean towards checking.`);
  } else {
    spot = 'You open from the cutoff, and the button and the big blind both call. Three players see the flop.';
    facts = [{k:'Pot', v:'8bb'}, {k:'Position', v:'Middle'}, {k:'Players', v:3}];
    right = 'multi';
    work = 'With three or more players there are no automatic c-bets. A bluff has to get past everyone: a half-pot bluff that needs 33% folds heads-up needs about 58% folds from each of two opponents. GTO Wizard’s multiway rules: “tight is right,” “stop range betting,” and “almost never bluff without solid drawing equity.”';
  }
  const decoys = mode === 'ip' ? shuffle(['small', 'big', 'check', 'mono'].filter(p => p !== right)).concat(['multi'])
    : [T.plan].concat(shuffle(['small', 'big', 'check', 'mono', mode === 'oop' ? 'multi' : 'oop'].filter(p => p !== T.plan)));
  const keys = [right].concat(decoys.filter(k => k !== right).slice(0, 3));
  return {
    scene:{board:x.f, street:'Flop', facts},
    prompt: spot + ' What is your default continuation-bet plan?',
    options: shuffle(keys.map((k, i) => ({label: BT_PLAN[k], correct: i === 0}))),
    tags: btTags(x.info).concat(mode === 'ip' ? [] : [mode === 'oop' ? 'Out of position' : 'Multiway']), work,
    rule: BT_SIZE_RULE
  };
}

const BT_BUCKETS = {
  monster:{name:'Monster', holds:'Sets, straights, flushes, strong two pair',
           plan:'Build the pot over three streets; slowplay only on dry boards where you block the opponent’s continuing hands.'},
  strong: {name:'Strong made hand', holds:'Overpairs and top pair, top kicker on static boards', plan:'Two to three streets of value.'},
  medium: {name:'Medium hand', holds:'Top pair weak kicker, second pair, overpairs on wet boards', plan:'One to two streets; often check-call or check back.'},
  weak:   {name:'Weak showdown value', holds:'Bottom pair, underpairs, ace-high', plan:'Check and try to reach a cheap showdown.'},
  sdraw:  {name:'Strong draw', holds:'Nut flush draw, open-ended straight draw, combination draws', plan:'Semi-bluff (bet a draw that can still improve) or call.'},
  wdraw:  {name:'Weak draw', holds:'Gutshots, backdoor draws, overcards', plan:'Selective bluffs, usually in position.'},
  air:    {name:'Air', holds:'Nothing', plan:'Bluff players who fold; otherwise give up.'}
};
const BT_NEAR = {
  monster:['strong', 'medium', 'sdraw'], strong:['monster', 'medium', 'weak'], medium:['strong', 'weak', 'wdraw'],
  weak:['medium', 'air', 'wdraw'], sdraw:['wdraw', 'medium', 'monster'], wdraw:['sdraw', 'air', 'weak'], air:['wdraw', 'weak', 'sdraw']
};
// Worked hands from the chapter. Suits are relabelled at random, which never changes the bucket.
const BT_SPOTS = [
  {hero:['7h','7c'], board:['Ks','7d','2c'], b:'monster', why:'A set. On a board this dry you block little of what the opponent continues with, so build the pot rather than slowplay.'},
  {hero:['Kd','9s'], board:['Kh','9c','4d'], b:'monster', why:'Top two pair is strong two pair: build the pot over three streets.'},
  {hero:['8s','7s'], board:['6d','5h','4c'], b:'monster', why:'You flopped the nut straight, 8-7-6-5-4.'},
  {hero:['Jh','Th'], board:['Kh','7h','2h'], b:'monster', why:'You flopped a flush.'},
  {hero:['As','Js'], board:['Jd','7c','2h'], b:'strong', why:'Top pair, top kicker on a dry, static board. Red Chip puts it at about three streets of value; the guide’s plan is a small flop bet, then two-thirds pot or more on a safe turn.'},
  {hero:['Kd','Jc'], board:['Ks','7d','2c'], b:'strong', why:'The guide’s own example: top pair with a good kicker on K-7-2 rainbow is a strong two-to-three-street hand.'},
  {hero:['Qc','Qd'], board:['9s','8h','3d'], b:'strong', why:'An overpair with no straight possible yet. PokerCoaching calls it “effectively the super nuts” here, so bet big.'},
  {hero:['Kd','Jc'], board:['Ks','8s','3s'], b:'medium', why:'The same top pair as on K-7-2 drops to medium on a monotone board, because any flush beats it.'},
  {hero:['Qc','Qd'], board:['Js','9h','7c'], b:'medium', why:'Three straight cards are out, so an overpair can be “nearly dead” against a made straight. Overpairs on wet boards are medium hands: PokerCoaching drops the bet to about 60% pot.'},
  {hero:['Kc','4d'], board:['Kh','8s','2d'], b:'medium', why:'Top pair with a weak kicker. On A♥T♦9♠ a solver bets only 57 of 102 top-pair combinations; roughly the best five kickers are a practical cut-off.'},
  {hero:['Qd','Tc'], board:['Ks','Th','4c'], b:'medium', why:'Second pair. Expect one to two streets at most.'},
  {hero:['Jc','4c'], board:['Qd','9s','4h'], b:'weak', why:'Bottom pair beats only bluffs. Check and try to reach a cheap showdown.'},
  {hero:['6c','6d'], board:['Ks','9h','3d'], b:'weak', why:'An underpair. Even when the price looks right, reverse implied odds hurt: you can rarely win at showdown when your opponent keeps betting.'},
  {hero:['Ac','6d'], board:['Ks','9h','4h'], b:'weak', why:'Ace-high with no draw. It sometimes wins at showdown, so check rather than turn it into a bluff.'},
  {hero:['Ah','5h'], board:['Kh','8h','2c'], b:'sdraw', why:'The nut flush draw. Solvers bet ace- and king-high flush draws 70–80% of the time in position.'},
  {hero:['Jh','Tc'], board:['9s','8d','3c'], b:'sdraw', why:'An open-ended straight draw: any queen or seven. Solvers c-bet these about 70% of the time in position.'},
  {hero:['9h','8h'], board:['Th','7h','2c'], b:'sdraw', why:'A combination draw: a flush draw plus an open-ended straight draw, 15 outs. Solvers bet these about 85% of the time in position.'},
  {hero:['9c','8d'], board:['Qs','Th','3c'], b:'wdraw', why:'A gutshot: only a jack makes your straight, 4 outs.'},
  {hero:['Ad','Kc'], board:['8s','6h','2c'], b:'wdraw', why:'Two overcards: six cards make top pair, and often only part of that is live.'},
  {hero:['6d','5d'], board:['As','Kc','Jc'], b:'air', why:'No pair and no draw. Bluff only players who fold; otherwise give up.'}
];
function btQHand() {
  const s = pick(BT_SPOTS), m = suitMapper();
  const board = s.board.map(m), B = BT_BUCKETS[s.b];
  return {
    scene:{board, hero:s.hero.map(m), street:'Flop'},
    prompt: 'Heads-up on the flop. Which bucket is your hand in?',
    options: shuffle([s.b].concat(BT_NEAR[s.b]).map((k, i) => ({label: BT_BUCKETS[k].name, correct: i === 0}))),
    tags: btTags(btInfo(board)), work: `${s.why} Default plan for ${B.name.toLowerCase()}: ${B.plan.charAt(0).toLowerCase() + B.plan.slice(1)}`,
    rule: 'Hand strength is relative. Re-sort your hand into a bucket on every street, because the board decides what it is really worth.'
  };
}

const BT_CONCEPTS = [
  {cat:'texture', prompt:'What does a flop’s “texture” describe?',
   options:['How high, connected, suited and paired it is.', 'How many players saw it.', 'How big the pot is compared with the stacks.', 'Whether you hit it.'],
   work:'Texture is about the three cards themselves. It decides whose range the flop helps, and so how often and how big the raiser bets.',
   rule:'Texture decides whose range owns the flop.'},
  {cat:'texture', prompt:'Older advice said to c-bet small on low, disconnected flops like 8♦4♣2♠. What did solvers change?',
   options:['They prefer large bets there.', 'They never bet there.', 'They bet only with sets.', 'Nothing: small is still best.'],
   work:'Upswing’s editors now note that solvers prefer large bets on low, disconnected boards like 8-4-2. The raiser holds all the overpairs, and the caller’s range has few strong hands.',
   rule:'The default tables are a starting point; solver work keeps refining them.'},
  {cat:'range', prompt:'Range advantage and nut advantage: which one decides how big you bet?',
   options:['Nut advantage: holding more of the very best hands.', 'Range advantage: more total equity.', 'Position.', 'Neither: size is always a third of the pot.'],
   work:'GTO Wizard separates the two. Range advantage mainly decides how often you bet; nut advantage decides how big. A solver bets mostly 33% on Q♥Q♣6♦ but mostly 75% plus 125% overbets on K♥J♥7♦.',
   rule:'Range advantage decides how often. Nut advantage decides how big.'},
  {cat:'range', prompt:'Why is an ace-high flop c-bet less often than a king-high one?',
   options:['The big blind holds many aces and check-raises more.', 'Aces are rarely in the raiser’s range.', 'Ace-high flops are always wet.', 'It isn’t; ace-high is bet more often.'],
   work:'GTO Wizard’s flop rules: ace-high flops are bet less often than 8- through K-high ones, because the big blind defends many aces and check-raises more.',
   rule:'Bet more on high-card flops that keep the raiser’s advantage, but respect the aces in the big blind’s range.'},
  {cat:'range', prompt:'On Q♦J♦T♦ a solver goes back to small bets about half the time. Why?',
   options:['Both players hold plenty of nut hands, and draws won’t fold.', 'The raiser has the nut advantage.', 'Monotone boards are always checked.', 'The caller can’t have a flush.'],
   work:'When both ranges are full of flushes, straights and strong draws, neither player has the nut advantage that justifies a big bet, and a bet rarely makes a draw fold.',
   rule:'Bet less, and smaller, on flops that complete straights or flushes for the caller.'},
  {cat:'cbet', prompt:'Your opponent folds about 45% of the time to a two-thirds pot c-bet. What does Red Chip’s check say?',
   options:['C-betting profits automatically: above about 40% folds it pays.', 'Only c-bet with top pair or better.', 'Never c-bet against this player.', 'C-bet only a third of the pot.'],
   work:'Red Chip’s quick exploit check: if an opponent folds more than about 40% to a two-thirds pot bet, the c-bet profits on its own. At about 60% folds, c-bet nearly everything.',
   rule:'Fold more than about 40% to two-thirds pot: c-bet. About 60%: c-bet nearly everything.'},
  {cat:'cbet', prompt:'A half-pot bluff needs 33% folds heads-up. Against two opponents, how often must each one fold?',
   options:['About 58% each.', 'About 33% each.', 'About 17% each.', 'About 66% each.'],
   work:'Both players must fold for a bluff to win. 0.58 × 0.58 ≈ 0.33, so each must fold about 58% of the time. This is why multiway pots call for tight, value-heavy betting.',
   rule:'Multiway: almost never bluff without solid drawing equity.'},
  {cat:'cbet', prompt:'A 2018 PokerNews article says to keep c-betting multiway at soft small-stakes tables. How should you treat that?',
   options:['As a table-specific exploit, not a default.', 'As the new default.', 'As a reason to bluff more heads-up.', 'As a rule for 3-bet pots only.'],
   work:'GTO Wizard’s multiway rules say stop range betting and bet smaller and tighter. Betting into soft multiway tables can work against players who fold too much, but that is an adjustment to a specific table.',
   rule:'Three or more players: no automatic c-bets.'},
  {cat:'hand', prompt:'Which of these is a good reason to bet?',
   options:['Worse hands will call often enough.', 'To see where you are.', 'To protect your hand, whatever the opponent holds.', 'To stay balanced against a low-stakes live player.'],
   work:'For value, worse hands must call often enough; as a bluff, better hands must fold often enough. A fold tells you nothing and a call is ambiguous, so “betting for information” fails both tests.',
   rule:'Before betting, name which worse hands call or which better hands fold. If neither group is meaningful, check.'},
  {cat:'hand', prompt:'Which draw do solvers c-bet least often in position?',
   options:['A queen-high or lower flush draw, about 22%.', 'A combination draw, about 85%.', 'An open-ended straight draw, about 70%.', 'An ace-high flush draw, 70–80%.'],
   work:'Upswing’s solver figures: combination draws about 85%, open-enders about 70%, ace- and king-high flush draws 70–80%, but queen-high and lower flush draws only about 22%.',
   rule:'Good bluffs have little showdown value and some chance to improve.'},
  {cat:'hand', prompt:'On the river your draw missed. Which usually makes the better bluff?',
   options:['A missed straight draw.', 'A missed flush draw.', 'They are always equal.', 'Neither: never bluff the river.'],
   work:'Pick bluffs that block your opponent’s calling hands and don’t block their folding hands. A missed flush draw removes some of their own missed flush draws, which would have folded.',
   rule:'River bluffs should block calls, not folds.'}
];

const BT_CATS = [
  {id:'mixed', name:'Mixed'},
  {id:'texture', name:'Name the texture', gen:btQTexture},
  {id:'range', name:'Whose flop?', gen:btQRange},
  {id:'cbet', name:'C-bet plan', gen:btQCbet},
  {id:'hand', name:'Your hand', gen:btQHand}
];
const btCat = id => BT_CATS.find(c => c.id === id);
if (!btCat(prefs.boardCat)) prefs.boardCat = 'mixed';

const freshBoard = () => ({total:0, correct:0, streak:0, best:0, cats:{}});
let btStats = Object.assign(freshBoard(), loadJSON(STORE + ':board'));
const bt = {q:null, answered:false, choice:null, qNo:1, lastPrompt:''};

function btMake() {
  const id = prefs.boardCat === 'mixed' ? pick(BT_CATS.slice(1)).id : prefs.boardCat;
  const concepts = BT_CONCEPTS.filter(c => c.cat === id && c.prompt !== bt.lastPrompt);
  let q;
  if (concepts.length && rand(100) < 18) {
    const c = pick(concepts);
    q = {prompt:c.prompt, options:opts(c.options[0], c.options.slice(1)), work:c.work, rule:c.rule};
  } else {
    for (let t = 0; t < 5; t++) { q = btCat(id).gen(); if (q.prompt !== bt.lastPrompt || q.scene) break; }
  }
  q.cat = id;
  bt.lastPrompt = q.prompt;
  return q;
}
function btNew() { btShow(btMake()); }
function btShow(q) {
  bt.q = q;
  bt.answered = false;
  bt.choice = null;
  bt.qNo = btStats.total + 1;
  btRender();
}
function btAnswer(i) {
  if (bt.answered || !bt.q.options[i]) return;
  bt.answered = true;
  bt.choice = i;
  const ok = bt.q.options[i].correct;
  btStats.total++;
  if (ok) { btStats.correct++; btStats.streak++; btStats.best = Math.max(btStats.best, btStats.streak); }
  else btStats.streak = 0;
  const c = btStats.cats[bt.q.cat] || (btStats.cats[bt.q.cat] = {n:0, c:0});
  c.n++; if (ok) c.c++;
  saveJSON(STORE + ':board', btStats);
  rvRecord('board', ok, bt.q.rv, () => bt.q);
  btRender();
  const nb = $('#bt-next'); if (nb) nb.focus({preventScroll:true});
}

function btRenderCats() {
  $('#bt-cats').innerHTML = BT_CATS.map(c => {
    const s = c.id === 'mixed' ? {n:btStats.total, c:btStats.correct} : (btStats.cats[c.id] || {n:0, c:0});
    return `<button type="button" class="cat" data-btcat="${c.id}" aria-pressed="${c.id === prefs.boardCat}">${c.name}${s.n ? `<small>${s.c}/${s.n}</small>` : ''}</button>`;
  }).join('');
}
function btRenderScore() {
  $('#bst-correct').textContent = `${btStats.correct}/${btStats.total}`;
  $('#bst-acc').textContent = btStats.total ? Math.round(btStats.correct / btStats.total * 100) + '%' : '–';
  $('#bst-streak').textContent = btStats.streak;
  $('#bst-best').textContent = btStats.best;
}
function btRender() {
  btRenderCats();
  btRenderScore();
  const q = bt.q;
  $('#bt-eyebrow').textContent = `${rvLabel(q.rv) || 'Question ' + bt.qNo} · ${btCat(q.cat).name}`;
  $('#bt-scene').innerHTML = sceneHTML(q.scene);
  $('#bt-scene').hidden = !q.scene;
  $('#bt-prompt').textContent = q.prompt;
  $('#bt-options').innerHTML = q.options.map((o, i) => {
    let cls = 'opt';
    if (bt.answered && o.correct) cls += ' right';
    else if (bt.answered && i === bt.choice) cls += ' wrong';
    return `<button type="button" class="${cls}" data-btopt="${i}"${bt.answered ? ' disabled' : ''}><kbd>${i + 1}</kbd><span>${o.label}</span></button>`;
  }).join('');
  const el = $('#bt-result');
  if (!bt.answered) { el.hidden = true; el.innerHTML = ''; return; }
  const ok = q.options[bt.choice].correct;
  const right = q.options.find(o => o.correct);
  el.hidden = false;
  el.innerHTML = `
    <div class="verdict ${ok ? 'ok' : 'bad'}">
      <span class="mark" aria-hidden="true">${ok ? '✓' : '✕'}</span>
      <div class="v-text"><h3>${ok ? 'Correct.' : 'Not quite.'}</h3><p>${ok ? 'Streak: ' + btStats.streak : 'Answer: ' + (q.flopOpts ? btFlopTxt(right.flop.f) : right.label)}</p></div>
      <button type="button" class="new-hand" id="bt-next">Next question <kbd>N</kbd></button>
    </div>
    ${q.tags ? `<ul class="bt-tags" aria-label="What the flop shows">${q.tags.map(t => `<li>${t}</li>`).join('')}</ul>` : ''}
    <p class="work">${q.work}</p>
    <p class="rule"><strong>Rule from the chapter</strong>${q.rule}</p>`;
}

$('#bt-buckets').innerHTML = Object.values(BT_BUCKETS).map(b => `<tr><td>${b.name}</td><td>${b.holds}</td><td>${b.plan}</td></tr>`).join('');
$('#bt-options').addEventListener('click', e => { const b = e.target.closest('[data-btopt]'); if (b) btAnswer(+b.dataset.btopt); });
$('#bt-result').addEventListener('click', e => { if (e.target.closest('#bt-next')) rvNext() || btNew(); });
$('#bt-cats').addEventListener('click', e => {
  const b = e.target.closest('[data-btcat]');
  if (!b || b.dataset.btcat === prefs.boardCat) return;
  prefs.boardCat = b.dataset.btcat; savePrefs(); btNew();
});
armReset($('#bt-reset'), () => { btStats = freshBoard(); saveJSON(STORE + ':board', btStats); btRenderScore(); btRenderCats(); rvClear('board'); });
