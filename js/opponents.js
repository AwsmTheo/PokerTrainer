'use strict';

/* =====================================================================
   OPPONENT DRILL
   ===================================================================== */

// The guide's four player types. Hands-played bands for TAG, LAG and station come from the guide; the rest are illustrative.
const OTYPES = {
  tag:{name:'Tight-aggressive (TAG)', a:'a tight-aggressive regular (TAG)', many:'tight-aggressive regulars', gc:'var(--g-late)', plays:[15, 20], raises:[12, 17], band:'15–20%',
    how:'They play about 15–20% of hands, raise and re-raise their strong ones, and mix in some well-timed bluffs.',
    tell:'few hands, and most of them raised.',
    adjust:'Avoid marginal spots and frequent bluffs, value bet relentlessly, and respect their narrow range.',
    habits:['Raises most hands they play and folds the rest.', 'Re-raises only with strong hands, with the odd well-timed bluff.', 'Bets when they connect and gives up when they miss.'],
    good:[
      ['Respect their raises: their range is narrow and strong.', 'A TAG plays only about 15–20% of hands and raises most of them. When they raise or re-raise, they usually have it.'],
      ['Value bet your good hands relentlessly, and skip the marginal spots.', 'A TAG calls with decent hands, so your strong ones get paid. Thin, marginal spots are where a good player outplays you.'],
      ['Keep your bluffs rare and well chosen.', 'A TAG defends sensibly, so frequent bluffs burn money. Save them for spots with a clear reason.']],
    bad:[
      ['Call their 3-bets light, since they bluff a lot.', 'A TAG re-raises strong hands with only some bluffs mixed in. Calling light pays off their value.'],
      ['Bet second pair for thin value on all three streets.', 'Against a TAG, thin value is a marginal spot: they fold worse hands and call with better ones.'],
      ['Bluff them often, because they fold to pressure.', 'Folding to pressure is the nit’s leak. A TAG defends well enough that frequent bluffs lose.']]},
  lag:{name:'Loose-aggressive (LAG)', a:'a loose-aggressive player (LAG)', many:'loose-aggressive players', gc:'var(--g-early)', plays:[30, 40], raises:[24, 32], band:'30%+',
    how:'They play 30% of hands or more and put pressure on every street.',
    tell:'lots of hands, and most of them raised.',
    adjust:'Let them bluff: check-raise and call down with strong hands, re-raise strong hands, and avoid marginal spots.',
    habits:['Raises or re-raises in most pots they enter.', 'Keeps firing on the turn and river with a wide range.', 'Puts pressure on every street, made hand or not.'],
    good:[
      ['Let them bluff: check-raise and call down with your strong hands.', 'A LAG bets every street with a wide range. Let them keep betting into your strong hands rather than folding them out.'],
      ['Re-raise your strong hands before the flop.', 'A LAG opens wide, so your strong hands are far ahead of their range. Build the pot now.'],
      ['Avoid marginal spots where they can push you off your hand.', 'A LAG keeps betting. Weak and marginal hands face pressure on every street, so don’t start fights with them.']],
    bad:[
      ['Fold top pair as soon as they bet twice.', 'A LAG barrels with a wide range, so two bets mean far less than from a passive player. Strong hands call down.'],
      ['Believe every big bet, because they only bet strong hands.', 'That is how to treat a passive player. A LAG puts pressure on every street, made hand or not.'],
      ['Bluff them off their hands with big bets.', 'A LAG fights back, and their wide range calls and raises often. Let them do the bluffing.']]},
  nit:{name:'Nit (tight-passive)', a:'a nit', many:'nits', gc:'var(--g-blinds)', plays:[8, 12], raises:[4, 8], band:'very few',
    how:'They play a very narrow range, rarely raise or bluff, and fold to pressure.',
    tell:'very few hands, and little aggression.',
    adjust:'Steal their blinds, widen your button opens, c-bet and raise to force folds, and believe their strength.',
    habits:['Folded for an hour, then raised under the gun with aces.', 'Folds to most continuation bets unless they hit hard.', 'Rarely raises or bluffs, and folds when you show aggression.'],
    good:[
      ['Steal their blinds and widen your button opens.', 'A nit plays very few hands and folds their blinds too often, so your steals work.'],
      ['C-bet and raise to make them fold.', 'A nit folds to pressure unless they hit hard, so aggression wins pots you could not win at showdown.'],
      ['Believe their strength when they bet or raise.', 'A nit rarely bluffs. When they show aggression their range is strong, so fold your bluff-catchers.']],
    bad:[
      ['Value bet second pair on every street, because they call too much.', 'Calling too much is the station’s leak. A nit calls only with hands that beat second pair.'],
      ['Call their river raise, because they could be bluffing.', 'A nitty, passive player’s raise is almost never a bluff. GTO Wizard puts your bluff-catcher’s real equity close to 0%.'],
      ['Tighten your steals, because they defend their blinds wide.', 'Nits defend too little, not too much. Widen your steals against them.']]},
  station:{name:'Calling station (loose-passive)', a:'a calling station', many:'calling stations', gc:'var(--g-middle)', plays:[50, 65], raises:[2, 6], band:'50%+',
    how:'They play 50% of hands or more, rarely fold and rarely bluff.',
    tell:'lots of hands, and almost none of them raised.',
    adjust:'Value bet big and often; never bluff.',
    habits:['Limps in, calls your raise, then calls all three streets with bottom pair.', 'Rarely raises, rarely folds, and almost never bluffs.', 'Called three streets and showed down ace-high.'],
    good:[
      ['Value bet big and often, even thin hands like 99 or A8s.', 'A station calls with worse hands far too often. Upswing advises betting hands like 99 and A8s on all three streets against them.'],
      ['Never bluff: they rarely fold.', 'A bluff needs better hands to fold, and a station hardly folds anything. Upswing: “never bluff a calling station.”'],
      ['Bet your strong hands yourself instead of slowplaying.', 'Passive players rarely bluff into a check. If you slowplay, you lose the bets they would have called.']],
    bad:[
      ['Bluff the river when your draw misses.', 'A station calls with any pair or even ace-high. A missed draw should give up.'],
      ['Check your strong hands to induce a bluff.', 'A station rarely bluffs, so checking gives them a free card and loses you value.'],
      ['C-bet every flop so they fold.', 'A station does not fold to a c-bet. Bet when you have a hand, and check when you don’t.']]}
};
const OKEYS = Object.keys(OTYPES);
const between = ([lo, hi]) => lo + rand(hi - lo + 1);
function oppStats(t) { const T = OTYPES[t], p = between(T.plays); return {plays:p, raises:Math.min(between(T.raises), p - 2)}; }

// Hand spots: the right action depends on who you face. Only types with a clear answer from the guide are dealt.
const OSPOTS = [
  {cat:'play', street:'River', variants:[
     {hero:['9s','9d'], board:['Kc','8d','4s','3h','3c'], what:'pocket nines on K-8-4-3-3'},
     {hero:['As','8s'], board:['Ad','Jc','7h','3s','3d'], what:'top pair with an eight kicker on A-J-7-3-3'}],
   prompt:(T, v) => `You hold ${v.what}, and your opponent, ${T.a}, checks the river to you. What do you do?`,
   options:[['Bet about half the pot for value', 'bet'], ['Check behind and take the showdown', 'check'], ['Bet small to see where you are', 'probe']],
   answers:{station:'bet', nit:'check', tag:'check'},
   why:{station:'Name the worse hands that call: a station calls with weaker pairs and even ace-high. This is the thin value Upswing means when it says to bet hands like 99 and A8s against calling stations.',
        nit:'Name the worse hands that call: against a nit there are almost none. They call only with hands that beat you, so a bet wins nothing. Check and take the showdown.',
        tag:'A TAG folds worse hands and calls with better ones, so a bet only gets called when you are beaten. Skip the marginal spot and take the free showdown.'},
   rule:'Before betting, name which worse hands call or which better hands fold. If neither group is meaningful, check.'},
  {cat:'play', street:'River', variants:[{hero:['Jh','Th'], board:['9h','8c','2h','3s','Kd']}],
   prompt:T => `The flop and turn were checked through. Your straight and flush draws both miss on the river, you have jack-high, and ${T.a} checks again. What do you do?`,
   options:[['Bet two-thirds of the pot as a bluff', 'bluff'], ['Check and give up', 'check'], ['Bet small to see where you are', 'probe']],
   answers:{station:'check', nit:'bluff'},
   why:{station:'A bluff needs better hands to fold, and a station doesn’t fold one pair or even ace-high. “Never bluff a calling station”: jack-high gives up.',
        nit:'A nit who checks three streets rarely has much, and nits fold to pressure. A two-thirds-pot bluff only has to work 40% of the time, and here it will work far more often.'},
   rule:'Bluff players who fold, never stations. A small bet “to see where you are” tells you nothing.'},
  {cat:'play', street:'Flop', variants:[{hero:['7c','7d'], board:['7s','Kh','2d']}],
   prompt:T => `You called a raise in the big blind from ${T.a} and flopped a set of sevens. You act first. What is your plan?`,
   options:[['Bet it yourself', 'bet'], ['Check, planning to check-raise', 'xr'], ['Check and just call to keep them in', 'slow']],
   answers:{station:'bet', nit:'bet', lag:'xr'},
   why:{station:'Passive players rarely bluff into a check, so a slowplay loses the bets they would have called. A station will call with a king, a deuce or less. Bet your strong hands yourself.',
        nit:'A nit is passive: if you check, they often check back or bet once and stop, and you lose value. Bet your strong hands yourself.',
        lag:'A LAG c-bets most flops and keeps firing with a wide range. Let them bluff: check, then check-raise to build the pot with your set.'},
   rule:'Against passive players, bet your strong hands yourself. Against aggressive ones, let them bluff into you.'},
  {cat:'play', street:'Flop', variants:[{hero:['Ts','9s'], board:['Kd','7c','2h']}],
   prompt:T => `You opened from the cutoff and ${T.a} called in the big blind. They check the K-7-2 flop to you, and you have no pair and no draw. What do you do?`,
   options:[['C-bet small, about a third of the pot', 'bet'], ['Check behind and give up', 'check'], ['Shove all-in', 'shove']],
   answers:{nit:'bet', station:'check'},
   why:{nit:'A nit folds to most continuation bets unless they hit hard, and a dry king-high board misses most hands. A third-pot bet risks little and only has to work 25% of the time.',
        station:'A station calls flops with any piece and many hands without one. With no pair and no draw, a c-bet is a bluff that gets called. Check and give up unless you improve.'},
   rule:'C-bet to force folds from players who fold. Never bluff a calling station.'},
  {cat:'play', street:'Preflop', variants:[{hero:['Jc','5d']}], facts:[['Seat', 'Button']],
   prompt:T => `It folds to you on the button with J-5 offsuit. Both blinds are ${T.many}. What do you do?`,
   options:[['Raise to about 2.5bb to steal', 'raise'], ['Fold', 'fold'], ['Limp in for 1bb', 'limp']],
   answers:{nit:'raise', station:'fold'},
   why:{nit:'Nits fold their blinds far too often, so a steal wins the pot outright most of the time. Against them, widen your button opens past the usual chart.',
        station:'J-5 offsuit is not a normal button open, so raising it is a steal, which is a bluff. Stations don’t fold. Against them, open hands that make strong pairs and bet those for value.'},
   rule:'Raise or fold when you are first in; open-limping is a leak. Steal from nits, not from stations.'},
  {cat:'play', street:'Preflop', variants:[{hero:['Qs','Qh']}], facts:[['Seat', 'Button'], ['Open', '3bb']],
   prompt:T => `${cap(T.a)} opens to 3bb from the cutoff. You are on the button with queens. What do you do?`,
   options:[['Re-raise to about 9bb', '3bet'], ['Just call to trap them', 'call'], ['Min-raise to 6bb', 'min']],
   answers:{lag:'3bet', tag:'3bet'},
   why:{lag:'Against a LAG, re-raise your strong hands: they open wide, so queens are far ahead. BlackRain79’s size is about 9bb in position against a 3bb open, not a min-raise.',
        tag:'Queens are strong even against a TAG’s narrow opening range. Re-raise to about 9bb in position; a min-3-bet gives them a great price to continue.'},
   rule:'Against a 3bb open, re-raise to about 9bb in position or 12bb out of position. Min-3-betting is a leak.'},
  {cat:'facing', street:'River', variants:[{hero:['As','Kd'], board:['Kh','8c','4d','Ts','2c']}],
   prompt:T => `You hold top pair, top kicker. ${cap(T.a)} bet the flop and turn, and now bets the pot on the river. What do you do?`,
   options:[['Call', 'call'], ['Fold', 'fold'], ['Raise all-in', 'raise']],
   answers:{lag:'call', nit:'fold', station:'fold'},
   why:{lag:'A LAG barrels with a wide range, bluffs included, and top pair, top kicker beats much of it. Let them bluff, and call down.',
        nit:'A nit rarely bluffs, and three streets of betting from one is usually two pair or better. Believe their strength and fold, even with a hand this good.',
        station:'A station rarely bets, let alone three times. Passive players make big river bets for value, and you beat very little of that. Unless you beat a good part of their value range, fold.'},
   rule:'Big river bets from passive players are mostly value. Against aggressive players who barrel wide, strong hands call down.'},
  {cat:'facing', street:'River', variants:[{hero:['Ah','Jd'], board:['Jc','9s','6h','2d','2c']}],
   prompt:T => `You hold top pair, top kicker on J-9-6-2-2 and bet the river. ${cap(T.a)} raises. What do you do?`,
   options:[['Fold', 'fold'], ['Call', 'call'], ['Re-raise all-in', 'shove']],
   answers:{nit:'fold', station:'fold'},
   why:{nit:'A raise from a nitty, passive player is almost never a bluff. GTO Wizard calls over-folding “the only exploit” here, because your bluff-catcher’s real equity is close to 0%.',
        station:'Stations call too much and raise almost only for value. At these limits a river raise is “clearly for value,” and one pair is rarely good.'},
   rule:'River raises from passive low-stakes players are value. Over-fold.'}
];

// Upswing's heads-up river data, pots under 20bb.
const RIVER_ROWS = [
  {band:'10–39% pot', pop:0.12, gto:0.18, sizes:[0.25, 1/3]},
  {band:'40–59% pot', pop:0.16, gto:0.25, sizes:[0.5]},
  {band:'60–89% pot', pop:0.19, gto:0.30, sizes:[2/3, 0.75]},
  {band:'90–110% pot', pop:0.22, gto:0.33, sizes:[1]},
  {band:'overbets', pop:0.25, gto:0.37, sizes:[1.5]}
];

const OCONCEPTS = [
  {cat:'read', prompt:'A player joins 50% of pots but raises only 3% of hands. What does that tell you?',
   options:['They limp or call with almost everything they play.', 'They are a tight-aggressive regular.', 'They raise every hand they enter.', 'Nothing until you see a showdown.'],
   work:'PokerCoaching’s example: a player who joins half the pots but raises only 3% limps almost everything. That gap between hands played and hands raised is the calling station’s fingerprint.',
   rule:'Identify the player type first. It decides how much logic their actions carry.'},
  {cat:'read', prompt:'What is the first step in PokerCoaching’s hand-reading routine?',
   options:['Identify the player type.', 'Count your outs.', 'Put them on one exact hand.', 'Work out the stack-to-pot ratio.'],
   work:'The routine runs in order: identify the player type, build a preflop range from position and action, narrow it street by street, check who the board favours, then adjust to how much logic that player’s actions carry.',
   rule:'Read ranges, not single hands, and start from the player type.'},
  {cat:'plan', prompt:'Why does the guide favour exploitative play over pure GTO against weak low-stakes players?',
   options:['It attacks their specific mistakes and is almost always more profitable.', 'GTO is impossible for a beginner to learn.', 'Exploitative play cannot lose money.', 'Low-stakes players already play balanced.'],
   work:'GTO is a balanced, unexploitable baseline. Card Player calls exploitative play “almost always more profitable” in soft games, and lists using GTO against weak players as a common mistake.',
   rule:'Learn GTO concepts as the baseline, then deviate to attack each opponent’s leaks.'},
  {cat:'plan', prompt:'Which player type do many beginners play like themselves?',
   options:['The calling station.', 'The nit.', 'The tight-aggressive regular.', 'The loose-aggressive player.'],
   work:'PokerListings notes that many beginners play like calling stations. The fix is to play about 20% of hands at 6-max and 15% at full ring, and to raise instead of calling.',
   rule:'Play about 20% of hands at 6-max and 15% at full ring.'},
  {cat:'play', prompt:'Which is the better version of the old advice “never bluff a fish”?',
   options:['Never bluff a calling station.', 'Never bluff anyone at low stakes.', 'Only bluff fish on the river.', 'Bluff fish with big overbets.'],
   work:'Upswing’s rewording: some weak players do fold. The ones you never bluff are the ones who don’t, the calling stations.',
   rule:'Bluff players who fold. Value bet the ones who don’t.'},
  {cat:'play', prompt:'Before you bet, what should you be able to name?',
   options:['Which worse hands call, or which better hands fold.', 'Your opponent’s exact hand.', 'What their response will tell you.', 'How big the pot will be on the river.'],
   work:'A bet is for value when worse hands call, or a bluff when better hands fold. Betting “for information” is a weak reason: a fold tells you nothing, and a call is ambiguous.',
   rule:'If neither group is meaningful, check.'},
  {cat:'facing', prompt:'At low stakes, how should you read a river raise?',
   options:['As almost always value.', 'As often a bluff to push you off your hand.', 'As a sign they are on a draw.', 'As a raise for information.'],
   work:'Players at these limits call too much, so a raise has to be strong to make sense. BlackRain79 says river raises here should be “clearly for value,” and that is how most players make them.',
   rule:'River raises at these limits are value. Over-fold to them.'},
  {cat:'facing', prompt:'Against typical, less aggressive opponents, about how often does Upswing have you fold to a flop check-raise?',
   options:['About 47%', 'About 34%', 'About 20%', 'About 70%'],
   work:'The solver folds about 34%, but typical players check-raise with fewer bluffs, so Upswing folds about 47% and re-raises about 1% instead of 6%.',
   rule:'Against players who bluff less than equilibrium, fold more than the solver does.'},
  {cat:'facing', prompt:'A nitty, passive player raises you. How much equity does your bluff-catcher really have?',
   options:['Close to 0%, so over-fold heavily.', 'About 33%, enough to call a pot-sized raise.', 'About 50%, a coin flip.', 'Whatever the pot odds say it needs.'],
   work:'GTO Wizard: against a raise from a nitty, passive player, “the only exploit… is to over-fold heavily,” because a bluff-catcher’s real equity is “closer to 0%.”',
   rule:'Against a nit’s raise, the only exploit is to over-fold.'},
  {cat:'facing', prompt:'In Upswing’s data, what share of small and medium multiway river bets were bluffs?',
   options:['About 7%', 'About 18%', 'About 33%', 'About 50%'],
   work:'Multiway block bets were even more value-heavy than heads-up bets: 7% bluffs, against about 18% at equilibrium.',
   rule:'Unless you beat a significant amount of the opponent’s value range, fold.'},
  {cat:'facing', prompt:'Low-stakes players bluff big rivers less than they should. Does that make every line honest?',
   options:['No: some lines, like the river after a checked turn, may be over-bluffed.', 'Yes: never call a big bet.', 'Yes: low-stakes players never bluff.', 'No: they over-bluff every river.'],
   work:'A low-reliability 2026 article claims some small-stakes players over-bluff rivers after a checked turn, and GTO Wizard has written about over-bluffed lines at lower limits. The aggregate leans to value, but individual players and lines vary.',
   rule:'Fold more to big bets by default, then adjust to the player and the line.'}
];

function oppBadge(b, answered) {
  const T = OTYPES[b.t], hide = b.hide && !answered;
  return `<div class="opp-badge" style="--gc:${hide ? 'var(--line)' : T.gc}">
    <span class="lbl">Opponent</span>
    <b class="opp-name${hide ? ' unknown' : ''}">${hide ? 'Unknown player' : T.name}</b>
    <span class="opp-stats">Plays ${b.stats.plays}% of hands · raises ${b.stats.raises}%</span>
    ${b.habit ? `<span class="opp-habit">${b.habit}</span>` : ''}
  </div>`;
}
function oppSceneHTML(s, answered) {
  const groups = [];
  if (s.board) groups.push(`<div class="cardgroup"><span class="lbl">Board${s.street ? ' · ' + s.street : ''}</span><div class="cardrow">${s.board.map(pcHTML).join('')}</div></div>`);
  if (s.hero) groups.push(`<div class="cardgroup"><span class="lbl">Your hand${!s.board && s.street ? ' · ' + s.street : ''}</span><div class="cardrow">${s.hero.map(pcHTML).join('')}</div></div>`);
  const facts = (s.facts || []).map(f => `<div><dt>${f.k}</dt><dd>${f.v}</dd></div>`).join('');
  return `<div class="scene">${s.badge ? oppBadge(s.badge, answered) : ''}${groups.length ? `<div class="scene-cards">${groups.join('')}</div>` : ''}${facts ? `<dl class="facts">${facts}</dl>` : ''}</div>`;
}

function qOppRead() {
  const t = pick(OKEYS), T = OTYPES[t];
  return {type:t, scene:{badge:{t, hide:true, stats:oppStats(t), habit:pick(T.habits)}},
    prompt:pick(['Which type of player is this?', 'How would you label this opponent?']),
    options:opts(T.name, OKEYS.filter(k => k !== t).map(k => OTYPES[k].name)),
    work:`This is ${T.a}. ${T.how} Compare how often they play a hand with how often they raise: ${T.tell}`,
    rule:T.adjust};
}
function qOppPlan() {
  const t = pick(OKEYS), T = OTYPES[t];
  const scene = {badge:{t, stats:oppStats(t)}};
  if (rand(3) === 0) {   // spot the mistake
    const [label, why] = pick(T.bad);
    return {type:t, scene, prompt:`Against ${T.a}, which of these is a mistake?`,
      options:opts(label, shuffle(T.good).map(g => g[0])), work:why, rule:T.adjust};
  }
  const [label, why] = pick(T.good);
  return {type:t, scene, prompt:pick([`Your opponent is ${T.a}. Which adjustment fits them?`, `Which adjustment beats ${T.a}?`]),
    options:opts(label, shuffle(T.bad).map(b => b[0])), work:why, rule:T.adjust};
}
function qOppSpot(cat) {
  const S = pick(OSPOTS.filter(s => s.cat === cat)), v = pick(S.variants);
  const t = pick(Object.keys(S.answers)), T = OTYPES[t], m = suitMapper();
  return {type:t,
    scene:{badge:{t, stats:oppStats(t)}, street:S.street, hero:v.hero.map(m), board:v.board && v.board.map(m), facts:(S.facts || []).map(([k, val]) => ({k, v:val}))},
    prompt:S.prompt(T, v),
    options:shuffle(S.options.map(([label, key]) => ({label, correct:key === S.answers[t]}))),
    work:S.why[t], rule:S.rule};
}
function qOppRiver() {
  const row = pick(RIVER_ROWS), f = pick(row.sizes);
  const P = pick([6, 8, 10, 12, 14, 16]), b = Math.max(1, Math.round(P * f * 2) / 2);
  const need = b / (P + 2 * b);
  const scene = {facts:[{k:'Pot', v:fmtBB(P) + 'bb'}, {k:'River bet', v:fmtBB(b) + 'bb'}, {k:'Bet size', v:Math.round(b / P * 100) + '%'}]};
  if (rand(3) === 0) {
    const others = shuffle(RIVER_ROWS.filter(r => r !== row)).flatMap(r => [r.pop, r.gto]);
    return {scene, prompt:`In Upswing’s data, what share of heads-up river bets of ${row.band} were bluffs?`,
      options:pctOpts(row.pop, [row.gto].concat(others)),
      work:`The player pool bluffed <b>${pc1(row.pop)}</b> of its ${row.band} river bets, against about ${pc1(row.gto)} at equilibrium. The pool under-bluffs at every size, so treat big river bets as mostly value.`,
      rule:'Unless you beat a significant amount of the opponent’s value range, fold.'};
  }
  return {scene, prompt:`Heads-up in a ${fmtBB(P)}bb pot, a typical low-stakes player bets ${fmtBB(b)}bb on the river. Your hand beats only their bluffs. What do you do?`,
    options:shuffle(fixedOpts([['Fold: too few of these bets are bluffs.', true], ['Call: the price is good enough.', false], ['Call: you have to defend your minimum defence frequency.', false], ['Raise all-in as a bluff.', false]])),
    work:`You call ${fmtBB(b)} to win ${fmtBB(P + 2 * b)}, so you need <b>${pc1(need)}</b>. A bluff-catcher wins only against bluffs, and in Upswing’s data river bets of ${row.band} were ${pc1(row.pop)} bluffs, against about ${pc1(row.gto)} at equilibrium. ${pc1(row.pop)} is less than ${pc1(need)}, so fold. MDF assumes a balanced bluffing rate this player pool doesn’t reach.`,
    rule:'Unless you beat a significant amount of the opponent’s value range, fold.'};
}

const OCATS = [
  {id:'mixed', name:'Mixed'},
  {id:'read', name:'Name the type', gen:[qOppRead]},
  {id:'plan', name:'Pick the adjustment', gen:[qOppPlan]},
  {id:'play', name:'Play the hand', gen:[() => qOppSpot('play')]},
  {id:'facing', name:'Facing big bets', gen:[() => qOppSpot('facing'), qOppRiver]}
];
const ocatById = id => OCATS.find(c => c.id === id);
const oprefs = Object.assign({cat:'mixed'}, loadJSON(STORE + ':opp-prefs'));
if (!ocatById(oprefs.cat)) oprefs.cat = 'mixed';

const freshOpp = () => ({total:0, correct:0, streak:0, best:0, cats:{}});
let oppStatsRec = Object.assign(freshOpp(), loadJSON(STORE + ':opp'));
const opp = {q:null, answered:false, choice:null, qNo:1, lastPrompt:''};

function makeOpp() {
  const id = oprefs.cat === 'mixed' ? pick(OCATS.slice(1)).id : oprefs.cat;
  const concepts = OCONCEPTS.filter(c => c.cat === id && c.prompt !== opp.lastPrompt);
  let q;
  if (concepts.length && rand(100) < 20) {
    const c = pick(concepts);
    q = {prompt:c.prompt, options:opts(c.options[0], c.options.slice(1)), work:c.work, rule:c.rule};
  } else {
    for (let t = 0; t < 5; t++) { q = pick(ocatById(id).gen)(); if (q.prompt !== opp.lastPrompt) break; }
  }
  q.cat = id;
  opp.lastPrompt = q.prompt;
  return q;
}
function newOpp() { showOpp(makeOpp()); }
function showOpp(q) {
  opp.q = q;
  opp.answered = false;
  opp.choice = null;
  opp.qNo = oppStatsRec.total + 1;
  renderOpp();
}
function answerOpp(i) {
  if (opp.answered || !opp.q.options[i]) return;
  opp.answered = true;
  opp.choice = i;
  const ok = opp.q.options[i].correct, R = oppStatsRec;
  R.total++;
  if (ok) { R.correct++; R.streak++; R.best = Math.max(R.best, R.streak); }
  else R.streak = 0;
  const c = R.cats[opp.q.cat] || (R.cats[opp.q.cat] = {n:0, c:0});
  c.n++; if (ok) c.c++;
  saveJSON(STORE + ':opp', R);
  rvRecord('opp', ok, opp.q.rv, () => opp.q);
  renderOpp();
  const nb = $('#oNext'); if (nb) nb.focus({preventScroll:true});
}

function renderOppCats() {
  $('#ocats').innerHTML = OCATS.map(c => {
    const s = c.id === 'mixed' ? {n:oppStatsRec.total, c:oppStatsRec.correct} : (oppStatsRec.cats[c.id] || {n:0, c:0});
    return `<button type="button" class="cat" data-cat="${c.id}" aria-pressed="${c.id === oprefs.cat}">${c.name}${s.n ? `<small>${s.c}/${s.n}</small>` : ''}</button>`;
  }).join('');
}
function renderOppScore() {
  const R = oppStatsRec;
  $('#ost-correct').textContent = `${R.correct}/${R.total}`;
  $('#ost-acc').textContent = R.total ? Math.round(R.correct / R.total * 100) + '%' : '–';
  $('#ost-streak').textContent = R.streak;
  $('#ost-best').textContent = R.best;
}
function renderOppTypes() {
  const on = opp.q && opp.answered ? opp.q.type : null;
  $('#o-types').innerHTML = OKEYS.map(k => {
    const T = OTYPES[k];
    return `<li class="opp-type${k === on ? ' on' : ''}" style="--gc:${T.gc}"><h4><span class="dot" aria-hidden="true"></span>${T.name}<small>${T.band} of hands</small></h4><p>${T.how}</p><p><b>Adjust:</b> ${T.adjust}</p></li>`;
  }).join('');
}
function renderOpp() {
  renderOppCats();
  renderOppScore();
  renderOppTypes();
  const q = opp.q;
  $('#o-eyebrow').textContent = `${rvLabel(q.rv) || 'Question ' + opp.qNo} · ${ocatById(q.cat).name}`;
  $('#o-scene').innerHTML = q.scene ? oppSceneHTML(q.scene, opp.answered) : '';
  $('#o-scene').hidden = !q.scene;
  $('#o-prompt').textContent = q.prompt;
  $('#o-options').innerHTML = q.options.map((o, i) => {
    let cls = 'opt';
    if (opp.answered && o.correct) cls += ' right';
    else if (opp.answered && i === opp.choice) cls += ' wrong';
    return `<button type="button" class="${cls}" data-opt="${i}"${opp.answered ? ' disabled' : ''}><kbd>${i + 1}</kbd><span>${o.label}</span></button>`;
  }).join('');
  const el = $('#o-result');
  if (!opp.answered) { el.hidden = true; el.innerHTML = ''; return; }
  const ok = q.options[opp.choice].correct;
  const right = q.options.find(o => o.correct).label;
  el.hidden = false;
  el.innerHTML = `
    <div class="verdict ${ok ? 'ok' : 'bad'}">
      <span class="mark" aria-hidden="true">${ok ? '✓' : '✕'}</span>
      <div class="v-text"><h3>${ok ? 'Correct.' : 'Not quite.'}</h3><p>${ok ? 'Streak: ' + oppStatsRec.streak : 'Answer: ' + right}</p></div>
      <button type="button" class="new-hand" id="oNext">Next question <kbd>N</kbd></button>
    </div>
    <p class="work">${q.work}</p>
    <p class="rule"><strong>Rule from the chapter</strong>${q.rule}</p>`;
}

$('#o-options').addEventListener('click', e => { const b = e.target.closest('[data-opt]'); if (b) answerOpp(+b.dataset.opt); });
$('#o-result').addEventListener('click', e => { if (e.target.closest('#oNext')) rvNext() || newOpp(); });
$('#ocats').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b || b.dataset.cat === oprefs.cat) return;
  oprefs.cat = b.dataset.cat; saveJSON(STORE + ':opp-prefs', oprefs); newOpp();
});
armReset($('#oreset'), () => { oppStatsRec = freshOpp(); saveJSON(STORE + ':opp', oppStatsRec); renderOppScore(); renderOppCats(); rvClear('opp'); });
