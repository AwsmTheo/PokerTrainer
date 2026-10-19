'use strict';

/* =====================================================================
   FULL HAND DRILL
   ===================================================================== */

// Scripted hands played street by street. Each decision is tagged with the chapter its rule comes from.
// Pots, calls and stacks are in big blinds; 6-max, 100bb deep. Suits are relabelled at random, so no text names a suit.
const FH_CH = {
  seats:{name:'Seats', gc:'var(--g-late)'}, pot:{name:'Pot odds', gc:'var(--call)'},
  board:{name:'Board', gc:'var(--good)'}, opp:{name:'Opponents', gc:'var(--g-early)'}
};
const FH_STREET = {pre:'Preflop', flop:'Flop', turn:'Turn', river:'River'};
const FH_SHOWN = {pre:0, flop:3, turn:4, river:5};
const FH_SEAT = {UTG:'under the gun', HJ:'hijack', CO:'cutoff', BTN:'button', SB:'small blind', BB:'big blind'};
const RAISE_FIRST = ['Raise to 2.5bb', true];
const FH_HANDS = [
  {id:'tptk', name:'Top pair on a dry board', seat:'BTN', hero:['As','Js'], opp:'Big blind, a calling station', board:['Jd','7c','2h','4s','2s'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you on the button.',
     o:[RAISE_FIRST, ['Limp: just call 1bb'], ['Fold']],
     why:'Ace-jack suited is inside the button’s opening range of about 41% of hands. When everyone folds to you, raise rather than limp: raising builds a pot with a playable hand, cuts the field and gives you the betting lead. Online, open to 2–2.5bb.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb. The small blind folds and the big blind calls.'},
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'The big blind checks to you. You have top pair with the top kicker.',
     o:[['Bet small, about 2bb (a third of the pot)', true], ['Check back to keep the pot small'], ['Bet big, about 5bb (90% pot)'], ['Go all-in for 97.5bb']],
     why:'A dry, jack-high flop with three suits keeps your raising range’s advantage, and top pair, top kicker is a strong made hand worth two to three streets. Dry, static boards call for a small bet of about 25–33% pot. With an SPR near 18, one pair is not a hand to go all-in with yet.',
     rule:'C-bet 25–35% pot on dry, static boards and 55–80% on wet, dynamic ones.',
     next:'You bet 2bb and the big blind calls.'},
    {st:'turn', ch:'board', pot:9.5, stack:95.5, say:'The turn is a low card that changes little. The big blind checks again.',
     o:[['Bet again, about 6.5bb (two-thirds pot)', true], ['Check back for pot control'], ['Bet a small 2bb again']],
     why:'A safe turn leaves top pair, top kicker well ahead of the hands that called the flop: weaker jacks, sevens and straight draws. Upswing’s rule for a second barrel is two-thirds pot or more, which charges those hands and grows a pot your strong hand expects to win.',
     rule:'Bet the turn again at 66% pot or more.',
     next:'You bet 6.5bb and the big blind calls.'},
    {st:'river', ch:'opp', pot:22.5, stack:89, say:'The river pairs the deuce. The big blind checks to you once more.',
     o:[['Bet about 15bb (two-thirds pot) for value', true], ['Check back and show down'], ['Bet a tiny 4bb so they call']],
     why:'A calling station plays half their hands and rarely folds. Weaker jacks, sevens and smaller pairs will call, so value bet big. Checking wins nothing extra, and a tiny bet leaves behind money a station would have paid.',
     rule:'Calling stations: value bet big and often, and never bluff.',
     next:'You bet 15bb. The big blind calls with a weaker jack, and your ace kicker takes the pot.'}]},

  {id:'read', name:'Read the river', seat:'BB', hero:['Kh','8h'], opp:'Cutoff, a regular', board:['Ks','5d','4s','9c','2s'], steps:[
    {st:'pre', ch:'seats', pot:4, call:1.5, stack:99, say:'The cutoff opens to 2.5bb and everyone else folds to you in the big blind.',
     o:[['Call 1.5bb', true], ['Fold: king-eight is too weak'], ['Re-raise to 11bb']],
     why:'You call 1.5bb to win a final pot of 5.5bb, so you need only about 27% equity. That price is why the big blind defends wide, and suited hands like king-eight suited are on the list. It is too weak to re-raise for value, which starts around queens and ace-king.',
     rule:'Defend the big blind widely: against a 2.5bb open you need only about 27%.',
     next:'You call, and two of you see the flop.'},
    {st:'flop', ch:'board', pot:7.5, call:2, stack:97.5, say:'You flop top pair with a weak kicker. You check, and the cutoff bets 2bb into 5.5bb.',
     o:[['Call', true], ['Fold'], ['Check-raise to 8bb']],
     why:'Top pair with a weak kicker is a medium hand: one to two streets of value. Out of position a medium hand usually wants to check and call, and the price is small: 2bb to win 9.5bb, about 21%. Check-raises should come mainly from strong hands and big draws.',
     rule:'Out of position, medium hands check and call. Check-raise strong hands and big draws.',
     next:'You call. The pot is 9.5bb.'},
    {st:'turn', ch:'pot', pot:16.5, call:7, stack:95.5, say:'You check, and the cutoff bets 7bb into 9.5bb. Against the hands that bet here, you have about 38.9% equity.',
     o:[['Call: you need 29.8%', true], ['Fold: you need 42.4%'], ['Fold: you need 73.7%']],
     why:'You call 7bb to win a final pot of 23.5bb: 7 ÷ 23.5 = 29.8%. Your 38.9% beats that, so the call makes money on average. Dividing by the pot before your call gives 42.4%, and comparing the call with the pot before the bet gives 73.7%. Both are the classic mistakes.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The pot is 23.5bb.'},
    {st:'river', ch:'board', pot:40.5, call:17, stack:88.5, say:'The river completes the flush draw and makes ace-three a straight. You check, and the cutoff bets 17bb into 23.5bb.',
     o:[['Fold', true], ['Call: you still have top pair'], ['Raise all-in']],
     why:'Narrow the cutoff’s range. One- and two-pair hands would check this river, so the hands that bet are sets, straights, flushes and missed draws. Against that range top pair has 26.8% equity, short of the 17 ÷ 57.5 = 29.6% the call needs. Upswing’s answer is a fold.',
     rule:'Ranges get smaller as the hand goes on: each bet removes the hands that would have checked.',
     next:'You fold, and keep the 17bb.'}]},

  {id:'setmine', name:'Set mining', seat:'BTN', hero:['4c','4d'], opp:'Under the gun, a tight-aggressive regular', board:['Kd','Qs','8h'], steps:[
    {st:'pre', ch:'pot', pot:4, call:2.5, stack:100, say:'A tight-aggressive regular opens to 2.5bb under the gun, and everyone folds to you on the button. Both of you have 100bb.',
     o:[['Call to try to flop a set', true], ['Re-raise to 7.5bb'], ['Fold: small pairs never play']],
     why:'You flop a set only about once in eight tries (7.5 to 1 against), so the call relies on winning a big pot when you hit. The test is at least 15 times the raise behind: 15 × 2.5bb = 37.5bb, and the effective stack is 100bb, so the call passes. Re-raising adds little: against an under-the-gun open the button 3-bets only about 4% of hands.',
     rule:'Set mine only with at least 15 times the raise in the effective stack, and about 25 times out of position.',
     next:'You call, and both blinds fold.'},
    {st:'flop', ch:'board', pot:10.5, call:4, stack:97.5, say:'You miss. The raiser bets 4bb into 6.5bb.',
     o:[['Fold', true], ['Call: you might still be ahead'], ['Raise as a bluff']],
     why:'Fours below two overcards are weak showdown value at best, and a tight opener’s range is full of kings, queens and big pairs. You set mined and missed, so let it go. Even when the price looks right, reverse implied odds hurt: you can rarely win at showdown when they keep betting. Bluff-raising a TAG is the kind of marginal spot to avoid.',
     rule:'An underpair is weak showdown value: check, or fold to pressure.',
     next:'You fold. The 2.5bb call was the price of the eight-to-one shot.'}]},

  {id:'draw', name:'The nut flush draw', seat:'CO', hero:['Ah','5h'], opp:'Big blind, a regular', board:['Kh','8h','2c','3s','9d'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you in the cutoff.',
     o:[RAISE_FIRST, ['Limp: just call 1bb'], ['Fold: ace-five is too weak']],
     why:'Ace-five suited is in the cutoff’s opening range of about 25%: every suited ace opens from here. Raise first in.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb, and only the big blind calls.'},
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'The big blind checks. You have the nut flush draw.',
     o:[['Bet about 2bb as a semi-bluff', true], ['Check back for a free card'], ['Go all-in for 97.5bb']],
     why:'A strong draw is a semi-bluff: it wins when they fold now and when it hits later. Solvers bet ace- and king-high flush draws 70–80% of the time in position. This king-high flop keeps the raiser’s advantage, so a small bet does the job.',
     rule:'Strong draws: semi-bluff or call. Good bluffs have little showdown value and some chance to improve.',
     next:'You bet 2bb and the big blind calls.'},
    {st:'turn', ch:'pot', pot:17.5, call:8, stack:95.5, say:'The turn gives you a wheel gutshot as well. The big blind leads out for 8bb into 9.5bb.',
     o:[['Call: implied odds cover the gap', true], ['Fold: 26% is less than the 31% you need'], ['Call: 12 outs hit 48% of the time']],
     why:'Nine cards make your flush and three more make the wheel: 12 outs, 26.1% with one card to come. The price is 8 ÷ 25.5 = 31.4%, so today’s price alone says fold. The call is still right: you are drawing to the nuts with about 95bb behind, and you need to win only about 5bb more on the river when you hit. The 48% figure is the Rule of 4, which applies only when you see two cards for one price.',
     rule:'Implied odds pay only when stacks are deep and you will hold the best hand when you hit.',
     next:'You call. The pot is 25.5bb.'},
    {st:'river', ch:'board', pot:25.5, stack:87.5, say:'The river misses you. The big blind checks.',
     o:[['Check and give up', true], ['Bet about 17bb (two-thirds pot) as a bluff'], ['Go all-in as a bluff']],
     why:'Good river bluffs block the hands that call and leave alone the hands that fold. A missed flush draw does the opposite: it holds cards from the opponent’s own missed flush draws, which would have folded. Your ace-high may even win at showdown against their missed draws. Check.',
     rule:'River bluffs should block calls, not folds. Missed straight draws usually bluff better than missed flush draws.',
     next:'You check. The big blind shows a king and takes the pot.'}]},

  {id:'nit', name:'Steal from a nit', seat:'BTN', hero:['Kc','9d'], opp:'Big blind, a nit', board:['Qd','7c','3s'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you on the button. The big blind is a nit who has folded for an hour.',
     o:[RAISE_FIRST, ['Fold: king-nine offsuit is too weak'], ['Limp: just call 1bb']],
     why:'King-nine offsuit is inside the button’s range of about 41%. The button acts last on every street, and a nit in the big blind folds too often, so this steal pays.',
     rule:'Steal from nits: widen your button opens.',
     next:'You open to 2.5bb, and for once the nit calls.'},
    {st:'flop', ch:'opp', pot:5.5, stack:97.5, say:'The nit checks to you. You have king-high.',
     o:[['C-bet small, about 2bb', true], ['Check back and give up'], ['Bet big, about 5bb']],
     why:'A dry, queen-high flop favours your range, and a nit folds to most continuation bets unless they hit hard. A small bet risks 2bb to win 5.5bb, so it needs to work only about 27% of the time.',
     rule:'Against nits, c-bet and raise to force folds.',
     next:'You bet 2bb.'},
    {st:'flop', lbl:'Check-raise', ch:'opp', pot:15.5, call:6, stack:95.5, say:'The nit check-raises to 8bb.',
     o:[['Fold', true], ['Call and see a turn'], ['Re-raise as a bluff']],
     why:'A nit rarely raises or bluffs, so a check-raise from them means a strong hand: a set, two pair or a big queen. Against a raise from a nitty, passive player the only exploit is to over-fold heavily, because king-high has close to no equity against that range.',
     rule:'Believe a nit’s strength.',
     next:'You fold. This steal cost 4.5bb, but most of the time a nit folds before it gets here.'}]},

  {id:'lag', name:'Overpair at a low SPR', seat:'HJ', hero:['Qs','Qh'], opp:'Button, a loose-aggressive player', board:['Jc','7d','3h'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you in the hijack.',
     o:[RAISE_FIRST, ['Limp to trap'], ['Go all-in for 100bb']],
     why:'Queens open from every seat. Raise: limping a strong hand to trap gives the table a cheap flop, and a shove wins only the blinds.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb. The button, a loose-aggressive player, re-raises to 7.5bb, and the blinds fold.'},
    {st:'pre', lbl:'Facing a 3-bet', ch:'opp', pot:11.5, call:5, stack:97.5, say:'The button has re-raised you to 7.5bb.',
     o:[['4-bet to about 18bb', true], ['Call and see a flop'], ['Fold']],
     why:'When your open is re-raised, AA–JJ mostly 4-bet. A loose-aggressive player re-raises with a wide range, so your queens are far ahead, and the adjustment is to re-raise your strong hands. A 4-bet is about 2.3–2.5 times the 3-bet: about 18bb.',
     rule:'Against loose-aggressive players, re-raise your strong hands before the flop.',
     next:'You 4-bet to 18bb and the button calls.'},
    {st:'flop', ch:'pot', pot:37.5, stack:82, say:'You act first, with an overpair to the board.',
     o:[['Bet about 12bb, and go all-in if raised', true], ['Check, and fold if they bet'], ['Check and call once, then fold']],
     why:'The stack-to-pot ratio is 82 ÷ 37.5, about 2.2. Below about 3, top pair with a good kicker or better is happy to go all-in, and an overpair is better than that. Bet about a third of the pot, the 25–40% size for 3-bet pots, and you are committed if they raise.',
     rule:'Below an SPR of about 3, one strong pair is worth your stack.',
     next:'You bet 12bb and the button moves all-in. You call: at this SPR that was the plan, whatever they show.'}]},

  {id:'multi', name:'Three-way pot', seat:'CO', hero:['Kd','Qd'], opp:'Button and big blind', board:['9c','7s','5h'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you in the cutoff.',
     o:[RAISE_FIRST, ['Limp: just call 1bb'], ['Fold']],
     why:'King-queen suited is an easy open from the cutoff, which raises about 25% of hands.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb. The button calls, and so does the big blind.'},
    {st:'flop', ch:'board', pot:8, stack:97.5, say:'The big blind checks to you, and the button is still to act. You missed: two overcards.',
     o:[['Check', true], ['C-bet small, about 3bb'], ['C-bet big, about 6bb']],
     why:'With three players there are no automatic c-bets. A bluff has to get past both opponents, and this low, connected flop hits the callers’ ranges far harder than yours. Bet strong value and strong draws; check the rest.',
     rule:'Three or more players: no automatic c-bets.',
     next:'You check. The button bets 6bb and the big blind folds.'},
    {st:'flop', lbl:'Facing a bet', ch:'pot', pot:14, call:6, stack:97.5, say:'The button bets 6bb into 8bb, and the big blind folds.',
     o:[['Fold', true], ['Call: you have six outs'], ['Raise as a bluff']],
     why:'You call 6bb to win 20bb, so you need 30%. Two overcards are six outs, about 13% on the turn, and often only part of them are live: a king or queen can still lose to two pair or a straight. Fold.',
     rule:'Count only the outs that actually win, and compare the one-card odds with the price.',
     next:'You fold, losing only your 2.5bb open.'}]},

  {id:'sb', name:'Small blind, raise or fold', seat:'SB', hero:['Ah','9c'], opp:'Big blind, a regular', board:['Ac','7d','2s','Th','7c'], steps:[
    {st:'pre', ch:'seats', pot:1.5, call:0.5, stack:99.5, say:'Everyone folds to you in the small blind.',
     o:[['Raise to 3bb', true], ['Complete: just call 0.5bb'], ['Fold']],
     why:'Ace-nine offsuit is well inside the small blind’s range of about 48%. Upswing’s simple plan for this seat: open about 40–50% of hands to about 3bb and play raise-or-fold, because you will act first on every street after the flop.',
     rule:'Play the small blind raise-or-fold.',
     next:'You raise to 3bb and the big blind calls.'},
    {st:'flop', ch:'board', pot:6, stack:97, say:'You act first, out of position, with top pair and a nine kicker.',
     o:[['Bet small, about 2bb', true], ['Check: always check out of position'], ['Bet big, about 5bb']],
     why:'Out of position the raiser should usually check much more. Ace-seven-deuce is one of the exceptions, with 4-4-2, K-K-3 and A-K-J: a dry, ace-high flop that strongly favours the raiser, where a small, wide c-bet still works.',
     rule:'Out of position, check much more; bet small only on strongly raiser-friendly boards.',
     next:'You bet 2bb and the big blind calls.'},
    {st:'turn', ch:'board', pot:10, stack:95, say:'The turn is a ten. You act first again.',
     o:[['Check, planning to call a normal bet', true], ['Bet two-thirds pot for value'], ['Check and fold to any bet']],
     why:'Top pair with a nine kicker is a medium hand, worth one to two streets, and the ten adds ace-ten to the hands that now beat you. Out of position a medium hand usually wants to check and call.',
     rule:'Strong hands grow the pot, medium hands check, and weak hands bluff or give up.',
     next:'You check, the big blind bets 5bb, and you call.'},
    {st:'river', ch:'opp', pot:40, call:20, stack:90, say:'The river pairs the seven. You check, and the big blind bets 20bb, the size of the pot.',
     o:[['Fold', true], ['Call: you need only 33%'], ['Raise all-in']],
     why:'A pot-size bet needs a third of it to be bluffs before a bluff-catcher pays, and Upswing’s database found the player pool bluffing only about 22% at that size. Your top pair beats few of the hands that bet this big. Unless you beat a good part of their value range, fold.',
     rule:'Big river bets at low stakes are mostly value.',
     next:'You fold, and keep the 20bb.'}]},

  // 3-bet pots
  {id:'bb3bet', name:'Ace-king in a 3-bet pot', seat:'BB', hero:['Ah','Kh'], opp:'Button, a regular', board:['Kd','7c','2s','4d'], steps:[
    {st:'pre', ch:'seats', pot:4, call:1.5, stack:99, say:'The button opens to 2.5bb, the small blind folds, and you have ace-king suited in the big blind.',
     o:[['Re-raise to 11bb', true], ['Call 1.5bb'], ['Fold']],
     why:'Ace-king is a value re-raise in every chart: queens or better and ace-king, plus jacks and ace-queen suited against a late opener like the button. Out of position, re-raise to about 4 times the open. Calling plays a premium hand in a small pot and hands the button the lead.',
     rule:'Re-raise for value with QQ+ and AK, to about 3 times the open in position and 4 times out of position.',
     next:'You re-raise to 11bb and the button calls.'},
    {st:'flop', ch:'board', pot:22.5, stack:89, say:'You flop top pair with the top kicker on a dry board, and you act first.',
     o:[['Bet small, about 7bb (a third of the pot)', true], ['Check and hope they bet'], ['Go all-in for 89bb']],
     why:'A dry, king-high flop favours the re-raiser, and top pair, top kicker is a strong made hand. In a 3-bet pot the stack-to-pot ratio is only about 4, so small bets are enough to get the stacks in by the river. Upswing’s size for 3-bet pots is 25–40% of the pot. Going all-in folds every worse hand.',
     rule:'C-bet 25–40% pot in 3-bet pots.',
     next:'You bet 7bb and the button calls.'},
    {st:'turn', ch:'pot', pot:36.5, stack:82, say:'The turn is a four, a blank. You act first again.',
     o:[['Bet about 18bb (half the pot), then go all-in on the river', true], ['Check, and fold if they bet'], ['Bet a small 4bb']],
     why:'The SPR is now 82 ÷ 36.5, about 2.2. Below about 3, top pair with a good kicker is happy to get all its chips in, so plan the last two bets now. Half the pot grows it to 72.5bb if called and leaves 64bb, less than a pot-sized bet for the river. A small bet leaves an awkward river, and checking gives worse kings a free card.',
     rule:'Below an SPR of about 3, one strong pair is worth your stack. Plan your sizes so the stacks go in by the river.',
     next:'You bet 18bb and the button calls. On the river you move all-in for 64bb, and they call with king-queen.'}]},

  {id:'call3bet', name:'Call a 3-bet in position', seat:'BTN', hero:['9c','9d'], opp:'Big blind, a tight-aggressive regular', board:['7h','5s','2d','Kc'], steps:[
    {st:'pre', lbl:'Facing a 3-bet', ch:'seats', pot:14, call:8.5, stack:97.5, say:'You open nines to 2.5bb on the button. The small blind folds and the big blind re-raises to 11bb.',
     o:[['Call', true], ['4-bet to about 25bb'], ['Fold']],
     why:'When your open is re-raised and you will have position, Upswing’s defaults are to 4-bet aces to jacks and ace-king, call with tens to sixes, ace-jack, king-queen and suited connectors, and usually fold the smallest pairs. Nines are a call: too good to fold, while a 4-bet folds out the worse hands and gets called by better ones.',
     rule:'When your open is re-raised in position: AA–JJ and AK mostly 4-bet; TT–66, AJ, KQ and suited connectors call.',
     next:'You call. The pot is 22.5bb.'},
    {st:'flop', ch:'pot', pot:29.5, call:7, stack:89, say:'The flop is low and dry. The big blind bets 7bb into 22.5bb.',
     o:[['Call: you need 19.2%', true], ['Fold: you need 31.1%'], ['Raise all-in for 89bb']],
     why:'You call 7bb to win a final pot of 36.5bb: 7 ÷ 36.5 = 19.2%. Your nines beat ace-king, ace-queen and every bluff on this board, far more than a fifth of a re-raiser’s range. Comparing the call with the pot before the bet gives 31.1%. Raising all-in folds the hands you beat and gets called by queens or better.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The pot is 36.5bb.'},
    {st:'turn', ch:'opp', pot:60.5, call:24, stack:82, say:'The turn is a king. The big blind bets 24bb, two-thirds of the pot.',
     o:[['Fold', true], ['Call: you need only 28.4%'], ['Raise all-in']],
     why:'A tight-aggressive player re-raises the button with a narrow range: big pairs, ace-king, ace-queen and a few bluffs. The king pairs ace-king, and a second big bet after it removes most of the bluffs. Nines now beat little of what keeps betting, so 28.4% is more than they have. Against a TAG, avoid marginal spots like this one.',
     rule:'Against a TAG, avoid marginal spots and respect their narrow range.',
     next:'You fold. The big blind shows ace-king.'}]},

  {id:'kkwet', name:'Kings on a connected board', seat:'BTN', hero:['Kc','Kd'], opp:'Cutoff, a regular', board:['9d','8c','3h','7s'], steps:[
    {st:'pre', ch:'seats', pot:4, call:2.5, stack:100, say:'The cutoff opens to 2.5bb, and you have kings on the button.',
     o:[['Re-raise to 7.5bb', true], ['Call 2.5bb'], ['Fold']],
     why:'Kings are a value re-raise from any seat. In position, re-raise to about 3 times the open: 7.5bb. Calling lets the blinds in cheaply and keeps the pot small with one of the best hands you can hold.',
     rule:'Re-raise for value with QQ+ and AK, to about 3 times the open in position and 4 times out of position.',
     next:'You re-raise to 7.5bb. The blinds fold and the cutoff calls.'},
    {st:'flop', ch:'board', pot:16.5, stack:92.5, say:'The cutoff checks. No straight is possible yet, and you have an overpair.',
     o:[['Bet small, about 5.5bb (a third of the pot)', true], ['Check back'], ['Go all-in for 92.5bb']],
     why:'With no straight on the board yet, an overpair is a strong made hand. In a 3-bet pot the SPR is about 5.6, so a third of the pot is enough to keep building it, and it keeps the cutoff’s pairs and draws in. All-in folds them.',
     rule:'C-bet 25–40% pot in 3-bet pots.',
     next:'You bet 5.5bb and the cutoff calls.'},
    {st:'turn', ch:'board', pot:27.5, stack:87, say:'The turn is a seven: now three cards in a row on the board. The cutoff checks again.',
     o:[['Check back', true], ['Bet about 18bb (two-thirds of the pot) for value'], ['Go all-in for 87bb']],
     why:'With nine-eight-seven on the board, jack-ten has a straight, nine-eight and eight-seven have two pair, and nines, eights and sevens have sets. Your kings dropped from a strong hand to a medium one: the hands that call a big bet now mostly beat you, and an overpair can be nearly dead against a made straight. Check back, keep the pot small and show down.',
     rule:'Overpairs on wet boards are medium hands: one to two streets, often check back.',
     next:'You check back. The river is a deuce; the cutoff checks, you bet a third of the pot, and they call with ace-nine.'}]},

  {id:'sb3bet', name:'Small blind re-raise', seat:'SB', hero:['Ah','Qh'], opp:'Button, a loose-aggressive player', board:['Qs','7d','2c'], steps:[
    {st:'pre', ch:'seats', pot:4, call:2, stack:99.5, say:'The button, a loose-aggressive player, opens to 2.5bb. You have ace-queen suited in the small blind.',
     o:[['Re-raise to 11bb', true], ['Call 2bb'], ['Fold']],
     why:'From the small blind, Upswing’s advice against a raise is to re-raise or fold, not call: you will act first on every street, and the big blind can still squeeze behind you. Ace-queen suited is a value re-raise against a late opener, and a loose-aggressive player opens and calls with many worse hands.',
     rule:'From the small blind, re-raise or fold against a raise. Don’t call.',
     next:'You re-raise to 11bb. The big blind folds and the button calls.'},
    {st:'flop', ch:'board', pot:23, stack:89, say:'You flop top pair with the top kicker on a dry board, and you act first.',
     o:[['Bet small, about 7.5bb (a third of the pot)', true], ['Check, and fold if they bet'], ['Go all-in for 89bb']],
     why:'A dry, queen-high flop suits the re-raiser’s range of big pairs and big aces, and top pair, top kicker is a strong made hand. The SPR is about 3.9, so a small bet keeps the button’s weaker queens, sevens and bluffs in and still lets the stacks go in by the river.',
     rule:'C-bet 25–40% pot in 3-bet pots.',
     next:'You bet 7.5bb. The button moves all-in for 89bb.'},
    {st:'flop', lbl:'Facing all-in', ch:'pot', pot:119.5, call:81.5, stack:81.5, say:'The button has moved all-in, and it costs you 81.5bb to call.',
     o:[['Call: you need 40.5%', true], ['Fold: top pair is only one pair'], ['Fold: you need 68.2%']],
     why:'You call 81.5bb to win a final pot of 201bb: 81.5 ÷ 201 = 40.5%. The flop SPR was about 4, where overpairs and strong top pairs can commit on a safe board, and this is the best top pair there is. A loose-aggressive player shoves weaker queens, pocket pairs and bluffs too, so let them bluff. Dividing by the pot before your call gives 68.2%.',
     rule:'Between an SPR of 3 and 6, overpairs and strong top pairs can commit on safe boards.',
     next:'You call. The button shows king-queen, and your ace kicker wins a 201bb pot.'}]},

  {id:'bluff3bet', name:'A bluff re-raise meets a 4-bet', seat:'BTN', hero:['As','5s'], opp:'Cutoff, a tight-aggressive regular', board:['Kd','8c','3h'], steps:[
    {st:'pre', ch:'seats', pot:4, call:2.5, stack:100, say:'The cutoff opens to 2.5bb. You have ace-five suited on the button.',
     o:[['Re-raise to 7.5bb as a bluff', true], ['Call 2.5bb'], ['Fold']],
     why:'Jonathan Little’s framework re-raises small suited aces from the button as bluffs. The ace blocks the cutoff’s strongest hands, aces and ace-king, and you have position if they call. Re-raise to about 3 times the open.',
     rule:'Re-raise as a bluff with A5s–A2s from the button or small blind: they block the opener’s strong aces.',
     next:'You re-raise to 7.5bb. The blinds fold, and the cutoff 4-bets to 18bb.'},
    {st:'pre', lbl:'Facing a 4-bet', ch:'opp', pot:27, call:10.5, stack:92.5, say:'The cutoff, a tight regular, has 4-bet you to 18bb.',
     o:[['Fold', true], ['Call and see a flop'], ['Move all-in']],
     why:'A tight-aggressive player 4-bets a narrow range, and Upswing’s advice against a tight player is to continue with only the top of your range. Ace-five was a bluff: it did its job if the cutoff folded, and it is in bad shape now that they haven’t. The guide gives no 4-bet range; queens or better and ace-king is this drill’s picture of a tight one.',
     rule:'Against a TAG, avoid marginal spots and respect their narrow range.',
     next:'You fold. The bluff loses 7.5bb when it meets a 4-bet, and wins the 4bb in the middle every time the cutoff folds.'}]},

  {id:'squeeze', name:'Squeeze with queens', seat:'BTN', hero:['Qc','Qh'], opp:'Hijack and cutoff', board:['Jd','6s','2c','4h'], steps:[
    {st:'pre', ch:'seats', pot:6.5, call:2.5, stack:100, say:'The hijack opens to 2.5bb and the cutoff calls. You have queens on the button.',
     o:[['Re-raise to 10bb', true], ['Re-raise to 7.5bb'], ['Call 2.5bb']],
     why:'Queens are a value re-raise. Size it at about 3 times the open in position, plus one extra open-size for each player who has already called: 7.5bb + 2.5bb = 10bb. A plain 3x re-raise gives both players a good price to call, and calling invites the blinds in too.',
     rule:'Re-raise to about 3 times the open in position, adding one open-size for each caller.',
     next:'You re-raise to 10bb. The blinds fold, the hijack calls and the cutoff folds.'},
    {st:'flop', ch:'board', pot:24, stack:90, say:'The hijack checks. You have an overpair on a dry, jack-high board.',
     o:[['Bet small, about 8bb (a third of the pot)', true], ['Check back'], ['Go all-in for 90bb']],
     why:'An overpair on a dry board is a strong made hand. The SPR is about 3.8, so a third of the pot is the 3-bet-pot size and still lets the stacks go in by the river. The hijack calls with jacks, sixes and smaller pairs.',
     rule:'C-bet 25–40% pot in 3-bet pots.',
     next:'You bet 8bb and the hijack calls.'},
    {st:'turn', ch:'pot', pot:122, call:82, stack:82, say:'The turn is a four. The hijack moves all-in for 82bb into 40bb.',
     o:[['Call: you need 40.2%', true], ['Fold: you need 67.2%'], ['Fold: an overpair is only one pair']],
     why:'You call 82bb to win a final pot of 204bb: 82 ÷ 204 = 40.2%. The SPR before this bet was about 2, and below about 3 an overpair is happy to go all-in. At this depth plenty of worse hands go all-in too, such as ace-jack and king-jack, alongside the sets. Dividing by the pot before your call gives 67.2%.',
     rule:'Below an SPR of about 3, one strong pair is worth your stack.',
     next:'You call. The hijack shows ace-jack, and your queens hold.'}]},

  {id:'kjo3bet', name:'King-jack against a 3-bet', seat:'CO', hero:['Kd','Jc'], opp:'Button, a tight-aggressive regular', board:['Ks','9h','4d'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you in the cutoff.',
     o:[RAISE_FIRST, ['Limp: just call 1bb'], ['Fold']],
     why:'King-jack offsuit is inside the cutoff’s opening range, which takes offsuit kings down to king-ten. Raise first in.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb. The button, a tight-aggressive regular, re-raises to 7.5bb, and the blinds fold.'},
    {st:'pre', lbl:'Facing a 3-bet', ch:'seats', pot:11.5, call:5, stack:97.5, say:'The button has re-raised you to 7.5bb, and you will be out of position for the rest of the hand.',
     o:[['Fold', true], ['Call and see a flop'], ['4-bet to about 18bb']],
     why:'King-jack offsuit is dominated by the hands a tight player re-raises: when you pair your king you lose big pots to ace-king and king-queen, and when you are ahead you win a small one. Jonathan Little folds dominated offsuit hands like king-jack and ace-ten to a re-raise. Upswing’s list keeps king-jack only when you have position, and here you don’t.',
     rule:'Fold dominated offsuit hands like KJ and AT when your open is re-raised.',
     next:'You fold, losing only your 2.5bb open.'}]},

  {id:'station3bet', name:'Value re-raise against a station', seat:'BTN', hero:['Ac','Qc'], opp:'Cutoff, a calling station', board:['Ah','9d','5s','3c'], steps:[
    {st:'pre', ch:'seats', pot:4, call:2.5, stack:100, say:'The cutoff, a calling station who plays half their hands, opens to 2.5bb. You have ace-queen suited on the button.',
     o:[['Re-raise to 7.5bb', true], ['Call 2.5bb'], ['Fold']],
     why:'Ace-queen suited is a value re-raise against a late opener. Against players who call everything, re-raise only for value, and this is a value hand: the station calls with many weaker aces and broadway hands, and you play a bigger pot in position with the better hand.',
     rule:'Against players who call everything, re-raise only for value.',
     next:'You re-raise to 7.5bb, the blinds fold, and the station calls.'},
    {st:'flop', ch:'board', pot:16.5, stack:92.5, say:'You flop top pair with a queen kicker. The station checks.',
     o:[['Bet small, about 5.5bb (a third of the pot)', true], ['Check back to keep the pot small'], ['Go all-in for 92.5bb']],
     why:'Top pair with a good kicker on a dry, ace-high board is a strong made hand, and a station calls with any ace, nines and fives. In 3-bet pots, c-bet 25–40% of the pot. Checking gives away a street of value, and all-in folds most of what you beat.',
     rule:'C-bet 25–40% pot in 3-bet pots.',
     next:'You bet 5.5bb and the station calls.'},
    {st:'turn', ch:'opp', pot:27.5, stack:87, say:'The turn is a three. The station checks again.',
     o:[['Bet about 18bb (two-thirds of the pot)', true], ['Check back for pot control'], ['Bet a tiny 4bb']],
     why:'A calling station rarely folds, so worse aces, nines and fives keep calling. Value bet big: a two-thirds bet wins far more from them than a tiny one, and checking wins nothing. Pot control is for opponents who continue only with better hands.',
     rule:'Calling stations: value bet big and often, and never bluff.',
     next:'You bet 18bb and the station calls. The river is a king; you bet 40bb, and they call with ace-ten.'}]},

  // Multiway pots
  {id:'isolate', name:'Raise over limpers', seat:'BTN', hero:['Ad','Jc'], opp:'Two limpers; the hijack is a calling station', board:['Js','8h','3d','2c'], steps:[
    {st:'pre', ch:'seats', pot:3.5, call:1, stack:100, say:'Under the gun and the hijack both limp in for 1bb. You have ace-jack on the button.',
     o:[['Raise to 4.5bb', true], ['Limp behind for 1bb'], ['Raise to 2.5bb']],
     why:'Ace-jack is a strong hand in position against limpers, who have already shown weak ranges. Raise rather than limp, so you take the betting lead and cut the field. Size up: Red Chip adds 1bb for each limper, so 2.5bb + 2bb = 4.5bb. A normal 2.5bb raise gives both limpers a cheap call.',
     rule:'Never limp behind. Raise, adding 1bb for each player who limped.',
     next:'You raise to 4.5bb. The blinds fold and both limpers call.'},
    {st:'flop', ch:'board', pot:15, stack:95.5, say:'You flop top pair with an ace kicker, and both players check to you.',
     o:[['Bet about 5bb (a third of the pot)', true], ['Check back'], ['Bet 15bb, the size of the pot']],
     why:'Three players means no automatic c-bets, but this isn’t a bet with air: top pair, top kicker is strong value, and worse jacks, eights and straight draws will call. Multiway, GTO Wizard’s rules favour smaller sizes, so bet about a third of the pot.',
     rule:'Three or more players: no automatic c-bets. Bet strong value and strong draws, with smaller sizes.',
     next:'You bet 5bb. Under the gun folds and the hijack calls.'},
    {st:'turn', ch:'opp', pot:25, stack:90.5, say:'The turn is a deuce. The hijack, a calling station, checks.',
     o:[['Bet about 16bb (two-thirds of the pot)', true], ['Check back'], ['Bet a small 4bb']],
     why:'You are heads-up now against a calling station, who called the flop with any jack, any eight and many weaker hands, and will call again. Value bet big and often: a two-thirds bet wins much more from those hands than a small one.',
     rule:'Calling stations: value bet big and often, and never bluff.',
     next:'You bet 16bb and the hijack calls with jack-nine. Your ace kicker plays on the river.'}]},

  {id:'setmulti', name:'Set in a four-way pot', seat:'BB', hero:['6c','6d'], opp:'Cutoff, button and small blind', board:['9s','6h','2s','Kd'], steps:[
    {st:'pre', ch:'pot', pot:8.5, call:1.5, stack:99, say:'The cutoff opens to 2.5bb, the button and the small blind call, and you have sixes in the big blind.',
     o:[['Call 1.5bb', true], ['Re-raise to 14bb'], ['Fold']],
     why:'You call 1.5bb to win a final pot of 10bb: 1.5 ÷ 10 = 15%. Small pairs make their money by flopping a set, and the set-mining test asks for at least 15 times the raise behind, about 25 times out of position: 25 × 2.5bb = 62.5bb, and you have 99bb. With three opponents, someone is likely to pay you when you hit.',
     rule:'Set mine only with at least 15 times the raise in the effective stack, and about 25 times out of position.',
     next:'You call, and four of you see the flop.'},
    {st:'flop', ch:'board', pot:10, stack:97.5, say:'You flop middle set on a board with a flush draw. The small blind checks to you, and two players act after you.',
     o:[['Bet about 6bb (60% of the pot)', true], ['Check to trap'], ['Bet a tiny 1bb']],
     why:'A set is a monster: build the pot over three streets. Slowplay only on dry boards, and this one has a flush draw and straight draws that a check lets see a free card. With three opponents, someone holds a nine, a draw or an overpair and will call.',
     rule:'Monsters build the pot over three streets; slowplay only on dry boards.',
     next:'You bet 6bb. The cutoff folds, the button calls and the small blind folds.'},
    {st:'turn', ch:'board', pot:22, stack:91.5, say:'The turn is a king, which misses the flush draw. You act first.',
     o:[['Bet about 15bb (two-thirds of the pot)', true], ['Check to trap'], ['Bet a small 4bb']],
     why:'The flush draw missed, and the king adds king-nine and other kings that may pay. Keep growing the pot: a second bet of two-thirds or more charges the button’s draws and nines and sets up a river bet that gets the most from a strong hand.',
     rule:'Bet the turn again at 66% pot or more.',
     next:'You bet 15bb and the button calls with a flush draw. The river misses, and your set takes the pot.'}]},

  {id:'blockbet', name:'A small bet into three players', seat:'BB', hero:['Th','9h'], opp:'Button and small blind', board:['Tc','6d','3s','Kh','2c'], steps:[
    {st:'pre', ch:'seats', pot:6, call:1.5, stack:99, say:'The button opens to 2.5bb, the small blind calls, and you have ten-nine suited in the big blind.',
     o:[['Call 1.5bb', true], ['Fold'], ['Re-raise to 14bb']],
     why:'You call 1.5bb to win a final pot of 7.5bb: 1.5 ÷ 7.5 = 20%. The big blind gets the best price at the table, and suited connectors are on every defence list. Ten-nine suited is too weak to re-raise for value.',
     rule:'Defend the big blind widely: suited connectors, suited aces and suited broadways call.',
     next:'You call, and three of you see the flop.'},
    {st:'flop', ch:'board', pot:12.5, call:2.5, stack:97.5, say:'You flop top pair with a nine kicker. The small blind and you check, the button bets 2.5bb, and the small blind calls.',
     o:[['Call', true], ['Check-raise to 10bb'], ['Fold']],
     why:'Top pair with a nine kicker is a medium hand: one to two streets of value. Out of position, medium hands check and call, and the price is tiny: 2.5 ÷ 15 = 16.7%. Check-raises should come mainly from strong hands and big draws.',
     rule:'Out of position, medium hands check and call. Check-raise strong hands and big draws.',
     next:'You call. The turn is a king, and everyone checks.'},
    {st:'river', ch:'opp', pot:20, call:5, stack:95, say:'The river is a deuce. The small blind leads out for 5bb into 15bb, and the button is still to act behind you.',
     o:[['Fold', true], ['Call: you need only 20%'], ['Raise to 18bb']],
     why:'Upswing’s database found small multiway river bets even more value-heavy than heads-up ones: about 7% bluffs for block bets, against about 18% in theory. The small blind checked the turn king, so a lead now is mostly a king or a better ten. Your ten beats few of those, and the button can still raise behind you. Unless you beat a good part of their value range, fold.',
     rule:'Small multiway river bets are mostly value: fold unless you beat a good part of the value range.',
     next:'You fold. The small blind shows king-queen.'}]},

  {id:'mwnit', name:'Three-way pot, then a big lead', seat:'UTG', hero:['As','Kd'], opp:'Cutoff and big blind, a nit', board:['Ah','8h','4c','2h'], steps:[
    {st:'flop', ch:'board', pot:8, stack:97.5, say:'You opened ace-king under the gun to 2.5bb, and the cutoff and the big blind, a nit, called. You flop top pair, top kicker, and the big blind checks to you.',
     o:[['Bet small, about 3bb', true], ['Check'], ['Bet 8bb, the size of the pot']],
     why:'With three players there are no automatic c-bets, but top pair, top kicker is strong value: worse aces, eights and flush draws will call. Multiway, GTO Wizard’s advice is to use smaller sizes, so bet about a third of the pot.',
     rule:'Three or more players: no automatic c-bets. Bet strong value and strong draws, with smaller sizes.',
     next:'You bet 3bb. The cutoff folds and the big blind calls.'},
    {st:'turn', ch:'opp', pot:28, call:14, stack:94.5, say:'The turn completes the flush draw. The big blind, a nit, leads out for 14bb, the size of the pot.',
     o:[['Fold', true], ['Call: you need 33.3%'], ['Raise all-in']],
     why:'A nit rarely bets or raises without a strong hand, and leading for the whole pot on the card that completes the flush is about as strong as a nit’s line gets: a flush, a set or two pair. Top pair beats almost none of that, so 33.3% is far more than you have. Believe a nit’s strength.',
     rule:'Believe a nit’s strength.',
     next:'You fold. The nit shows a flush.'}]},

  {id:'mwwet', name:'Overpair in a four-way pot', seat:'HJ', hero:['Ts','Tc'], opp:'Cutoff, button and big blind', board:['9h','8h','7d'], steps:[
    {st:'flop', ch:'board', pot:10.5, stack:97.5, say:'You opened tens in the hijack to 2.5bb, and the cutoff, the button and the big blind called. The flop is nine-eight-seven with two of a suit, and the big blind checks.',
     o:[['Check', true], ['Bet small, about 3.5bb'], ['Bet big, about 8bb']],
     why:'Jack-ten, ten-six and six-five already have straights here, and against three opponents someone often has one, or two pair, a set or a big draw. An overpair on a board this connected is a medium hand, and any bet has to get through three players. Multiway, bet only strong value and strong draws; check this.',
     rule:'Three or more players: no automatic c-bets.',
     next:'You check. The cutoff checks too, the button bets 7bb, and the big blind check-raises to 24bb.'},
    {st:'flop', lbl:'Facing a check-raise', ch:'board', pot:41.5, call:24, stack:97.5, say:'The button bet 7bb and the big blind check-raised to 24bb. You act next, with the cutoff and the button still to act behind you.',
     o:[['Fold', true], ['Call: you need 36.6%'], ['Re-raise all-in']],
     why:'Ranges get smaller with every bet. A bet and a check-raise in a four-way pot on nine-eight-seven come from straights, sets, two pair and big draws: hands that beat tens or have plenty of equity against them. You need 24 ÷ 65.5 = 36.6% and still have two players behind you. Fold.',
     rule:'Ranges get smaller as the hand goes on: each bet removes the hands that would have checked.',
     next:'You fold, losing only your 2.5bb open.'}]},

  {id:'nutdraw3', name:'Nut flush draw three ways', seat:'BB', hero:['Ad','3d'], opp:'Cutoff and button', board:['Kd','8d','4s','Jc','Td'], steps:[
    {st:'pre', ch:'seats', pot:6.5, call:1.5, stack:99, say:'The cutoff opens to 2.5bb, the button calls and the small blind folds. You have ace-three suited in the big blind.',
     o:[['Call 1.5bb', true], ['Fold'], ['Re-raise to 14bb']],
     why:'You call 1.5bb to win a final pot of 8bb: 1.5 ÷ 8 = 18.8%. Suited aces are on every big blind defence list, and in a multiway pot nut potential is king: ace-three suited can make the best possible flush.',
     rule:'Defend the big blind widely: suited connectors, suited aces and suited broadways call.',
     next:'You call, and three of you see the flop.'},
    {st:'flop', ch:'pot', pot:14, call:3, stack:97.5, say:'You flop the nut flush draw. You check, the cutoff bets 3bb into 8bb, and the button calls.',
     o:[['Call', true], ['Fold: you need 37.5%'], ['Fold: you have only ace-high']],
     why:'You call 3bb to win a final pot of 17bb: 3 ÷ 17 = 17.6%. Nine outs make the nut flush about 19% of the time on the next card, and with two opponents there is more to win when it comes. Comparing the call with the pot before the bet gives 37.5%.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The pot is 17bb.'},
    {st:'turn', ch:'pot', pot:25, call:8, stack:94.5, say:'The turn is a jack, no help. You check, the cutoff bets 8bb into 17bb, and the button folds.',
     o:[['Call: implied odds cover the gap', true], ['Fold: 19.6% is less than the 24.2% you need'], ['Call: 9 outs hit 36% of the time']],
     why:'Nine outs hit 19.6% of the time with one card to come, and the price is 8 ÷ 33 = 24.2%, so today’s price alone says fold. The call is still right: you are drawing to the nuts with about 94bb behind, and you need to win only about 8bb more on the river when you hit. The 36% figure is the Rule of 4, which applies only when you see two cards for one price.',
     rule:'Implied odds pay only when stacks are deep and you will hold the best hand when you hit.',
     next:'You call. The pot is 33bb.'},
    {st:'river', ch:'board', pot:33, stack:86.5, say:'The river makes your nut flush. The cutoff checks.',
     o:[['Bet about 22bb (two-thirds of the pot)', true], ['Check to give them a chance to bluff'], ['Bet a small 5bb']],
     why:'You hold the best possible hand, so grow the pot. The cutoff bet twice and can call with a king, two pair or a smaller flush. A player who just checked rarely bluffs, so checking usually wins nothing more, and a small bet leaves money behind.',
     rule:'Strong hands grow the pot, medium hands check, and weak hands bluff or give up.',
     next:'You bet 22bb, the cutoff calls with king-jack, and your flush takes a 77bb pot.'}]},

  {id:'bluff3way', name:'No bluff into two players', seat:'CO', hero:['7h','6h'], opp:'Button and big blind', board:['Ad','Kc','4s'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you in the cutoff.',
     o:[RAISE_FIRST, ['Limp: just call 1bb'], ['Fold']],
     why:'Seven-six suited is in the cutoff’s opening range, which takes suited connectors down to five-four. Raise first in.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb. The button calls, and so does the big blind.'},
    {st:'flop', ch:'board', pot:8, stack:97.5, say:'The big blind checks to you, and the button is still to act. You have nothing: no pair and no draw.',
     o:[['Check and give up', true], ['Bet half the pot, about 4bb, as a bluff'], ['Bet a third of the pot, about 2.5bb']],
     why:'A half-pot bluff needs folds 4 ÷ 12 = 33.3% of the time heads-up. Against two players it needs about 58% folds from each, since both have to fold, and 0.58 × 0.58 is about a third. An ace-king flop hits both callers’ ranges, and seven-high has no drawing equity. Multiway, almost never bluff without solid drawing equity.',
     rule:'Three or more players: no automatic c-bets. Almost never bluff without solid drawing equity.',
     next:'You check. The button bets, the big blind calls, and you fold, losing only your 2.5bb open.'}]},

  {id:'limped', name:'Two pair in a limped pot', seat:'BB', hero:['8s','5d'], opp:'Hijack, cutoff and small blind', board:['8c','5h','2d','6s'], steps:[
    {st:'flop', ch:'board', pot:4, stack:99, say:'The hijack and the cutoff limp, the small blind completes, and you check in the big blind with eight-five. You flop two pair, and the small blind checks to you.',
     o:[['Bet about 2bb (half the pot)', true], ['Check to trap'], ['Go all-in for 99bb']],
     why:'Two pair is a monster here, and with three opponents someone has an eight, a five, a pair or a straight draw that will call. Bet your strong hand yourself: multiway, smaller sizes work best, so about half the pot. Checking gives a free card to every draw at the table.',
     rule:'Multiway, bet strong value and strong draws, with smaller sizes.',
     next:'You bet 2bb. The hijack folds, the cutoff calls and the small blind folds.'},
    {st:'turn', ch:'board', pot:8, stack:97, say:'The turn is a six, which makes a straight for seven-four and nine-seven. You act first.',
     o:[['Bet about 5bb (60% of the pot)', true], ['Check, and fold to a bet'], ['Check to trap']],
     why:'The six fills a straight for a few hands, but most of what calls a flop bet in a limped pot is a weaker eight, a five, a pair or a draw, and two pair still beats all of it. Strong hands grow the pot. Checking and folding throws away a hand that is usually best, and checking to trap gives every draw a free river.',
     rule:'Strong hands grow the pot, medium hands check, and weak hands bluff or give up.',
     next:'You bet 5bb and the cutoff calls with eight-seven. The river misses, and your two pair wins.'}]},

  // Single-raised pots with a turn decision
  {id:'potctrl', name:'Pot control with a weak kicker', seat:'BTN', hero:['Qd','9d'], opp:'Big blind, a regular', board:['Qs','7c','3h','Jd'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened queen-nine suited on the button and the big blind called. You flop top pair, and the big blind checks.',
     o:[['Bet small, about 2bb (a third of the pot)', true], ['Bet big, about 5bb'], ['Go all-in for 97.5bb']],
     why:'A dry, queen-high flop favours the raiser, so bet most hands small: about a third of the pot. Top pair gets value from weaker queens, sevens and the pairs below.',
     rule:'C-bet 25–35% pot on dry, static boards and 55–80% on wet, dynamic ones.',
     next:'You bet 2bb and the big blind calls.'},
    {st:'turn', ch:'pot', pot:9.5, stack:95.5, say:'The turn is a jack, which brings straight draws and queen-jack into play. The big blind checks to you.',
     o:[['Check back', true], ['Bet about 6.5bb (two-thirds of the pot)'], ['Go all-in for 95.5bb']],
     why:'The SPR is 95.5 ÷ 9.5, about 10. Above about 10, one pair is a pot-control hand. Top pair with a nine kicker is a medium hand worth one or two streets, and it has had one. A big bet now gets called mostly by better queens, queen-jack and draws; checking back reaches a cheap showdown.',
     rule:'Above an SPR of about 10, one pair is a pot-control hand.',
     next:'You check back. The river is a blank, you both check, and your queen beats their pair of sevens.'}]},

  {id:'combo', name:'Combination draw on the turn', seat:'BTN', hero:['Jh','Th'], opp:'Big blind, a regular', board:['9h','8c','2h','3d'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened jack-ten suited on the button and the big blind called. You flop a flush draw and an open-ended straight draw, and the big blind checks.',
     o:[['Bet about 4bb (two-thirds of the pot)', true], ['Check back'], ['Go all-in for 97.5bb']],
     why:'Solvers bet combination draws about 85% of the time in position. A semi-bluff wins when the big blind folds now and when the draw hits later. On a connected, two-tone middling board, bet less often but bigger: 66–75% of the pot.',
     rule:'Strong draws: semi-bluff or call. Good bluffs have little showdown value and some chance to improve.',
     next:'You bet 4bb and the big blind calls.'},
    {st:'turn', ch:'pot', pot:22.5, call:9, stack:93.5, say:'The turn is a three, a blank. The big blind leads out for 9bb into 13.5bb.',
     o:[['Call: 15 outs come in 32.6% of the time', true], ['Fold: you need 40%'], ['Fold: you need a pair first']],
     why:'Nine cards make your flush, and the six queens and sevens outside your suit make a straight: 15 outs, 32.6% with one card to come. You call 9bb to win a final pot of 31.5bb: 9 ÷ 31.5 = 28.6%, so the call pays before you count any implied odds. Dividing by the pot before your call gives 40%, the classic mistake.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The river is a queen, and you make your straight.'}]},

  {id:'turnxr', name:'Turn check-raise from a passive player', seat:'BTN', hero:['Ac','Jd'], opp:'Big blind, a tight-passive player', board:['Js','6h','4c','9d'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened ace-jack on the button and the big blind called. You flop top pair, top kicker on a dry board, and the big blind checks.',
     o:[['Bet small, about 2bb (a third of the pot)', true], ['Check back'], ['Bet big, about 5bb']],
     why:'A dry, jack-high flop with three suits favours the raiser, and top pair, top kicker is worth two to three streets. Bet small, 25–35% of the pot.',
     rule:'C-bet 25–35% pot on dry, static boards and 55–80% on wet, dynamic ones.',
     next:'You bet 2bb and the big blind calls.'},
    {st:'turn', ch:'board', pot:9.5, stack:95.5, say:'The turn is a nine. The big blind checks again.',
     o:[['Bet about 6.5bb (two-thirds of the pot)', true], ['Check back'], ['Bet a small 2bb']],
     why:'The nine adds a few straight draws, but top pair, top kicker is still well ahead of what called the flop: weaker jacks, sixes and draws. Bet the turn again at two-thirds of the pot or more to charge them.',
     rule:'Bet the turn again at 66% pot or more.',
     next:'You bet 6.5bb. The big blind check-raises to 22bb.'},
    {st:'turn', lbl:'Check-raise', ch:'opp', pot:38, call:15.5, stack:89, say:'The big blind, a tight-passive player who rarely raises, check-raises to 22bb.',
     o:[['Fold', true], ['Call: you need only 29%'], ['Re-raise all-in']],
     why:'A passive player who called the flop and now check-raises the turn shows two pair or a set far more often than a bluff. Against a raise from a nitty, passive player the only exploit is to over-fold heavily, because one pair has close to no equity against that range. A big check-raise from a passive player is a fold more often than your instincts suggest.',
     rule:'Believe a nit’s strength.',
     next:'You fold. The big blind shows jack-nine for two pair.'}]},

  {id:'gutshot', name:'Gutshot on the turn', seat:'BB', hero:['7c','6c'], opp:'Cutoff, a regular', board:['Qd','9h','5s','2d'], steps:[
    {st:'pre', ch:'seats', pot:4, call:1.5, stack:99, say:'The cutoff opens to 2.5bb and everyone else folds to you in the big blind.',
     o:[['Call 1.5bb', true], ['Fold'], ['Re-raise to 11bb']],
     why:'You call 1.5bb to win a final pot of 5.5bb, so you need only about 27%. Suited connectors are on every big blind defence list: they make strong draws and hidden straights. Seven-six suited is too weak to re-raise for value.',
     rule:'Defend the big blind widely: against a 2.5bb open you need only about 27%.',
     next:'You call. On the flop you check, and the cutoff checks behind.'},
    {st:'turn', ch:'pot', pot:9, call:3.5, stack:97.5, say:'The turn is a deuce. You have a gutshot: any eight makes your straight. You check, and the cutoff bets 3.5bb into 5.5bb.',
     o:[['Fold', true], ['Call: implied odds will cover it'], ['Call: 4 outs hit 16% of the time']],
     why:'Four outs come in only 8.7% of the time with one card to come, and the price is 3.5 ÷ 12.5 = 28%. To make up the gap you would need to win about 28bb more on the river every time you hit, three times the pot, and an eight also gives jack-ten a higher straight. Implied odds don’t stretch that far. The 16% figure is the Rule of 4, which applies only when you see two cards for one price.',
     rule:'Implied odds pay only when stacks are deep and you will hold the best hand when you hit.',
     next:'You fold. The 2.5bb defence was the price of a cheap look at the flop.'}]},

  {id:'turnshove', name:'Flush draw facing an all-in', seat:'BTN', hero:['Qh','Jh'], opp:'Big blind, a regular', board:['Kh','7h','3c','2d'], steps:[
    {st:'flop', ch:'pot', pot:29.5, call:7, stack:89, say:'You opened queen-jack suited on the button, the big blind re-raised to 11bb, and you called. You flop a flush draw, and the big blind bets 7bb into 22.5bb.',
     o:[['Call', true], ['Fold: you need 31.1%'], ['Fold: nine outs are not enough']],
     why:'You call 7bb to win a final pot of 36.5bb: 7 ÷ 36.5 = 19.2%. Nine outs come in about 19% of the time on the next card, right at the price, and with 89bb behind you win more when the flush comes. Comparing the call with the pot before the bet gives 31.1%, the classic mistake.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The pot is 36.5bb.'},
    {st:'turn', ch:'pot', pot:118.5, call:82, stack:82, say:'The turn is a deuce, and the big blind moves all-in for 82bb.',
     o:[['Fold', true], ['Call: the flush came in 35% of the time from the flop'], ['Call: implied odds cover the gap']],
     why:'With one card to come, nine outs hit 19.6% of the time. You call 82bb to win a final pot of 200.5bb: 82 ÷ 200.5 = 40.9%, about twice what your draw is worth. There are no implied odds when the other player is all-in, since nothing is left to win later. The 35% figure is the two-card chance from the flop, and it no longer applies.',
     rule:'With one card to come, compare the one-card odds with the price.',
     next:'You fold. Calling would have lost about 43bb on average.'}]},

  {id:'thinvalue', name:'Thin value against a station', seat:'BTN', hero:['Ad','8d'], opp:'Big blind, a calling station', board:['Ac','Qh','6s','3h','9c'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened ace-eight suited on the button and the big blind, a calling station, called. You flop top pair with a weak kicker, and the big blind checks.',
     o:[['Bet small, about 2bb (a third of the pot)', true], ['Check back'], ['Bet big, about 5bb']],
     why:'A dry, ace-high flop is one where the raiser in position bets most hands small, and a station calls with any ace, any queen and many worse hands. Top pair is a value hand against them.',
     rule:'C-bet 25–35% pot on dry, static boards and 55–80% on wet, dynamic ones.',
     next:'You bet 2bb and the station calls.'},
    {st:'turn', ch:'opp', pot:9.5, stack:95.5, say:'The turn is a three. The station checks.',
     o:[['Bet about 6.5bb (two-thirds of the pot)', true], ['Check back for pot control'], ['Bet a tiny 2bb']],
     why:'Against a regular, top pair with an eight kicker might check back here. Against a calling station, value bet much more: Upswing bets hands like ace-eight suited on all three streets against them, because stations call with worse aces, queens and sixes. Size up, since a station doesn’t fold to big bets either.',
     rule:'Value bet much more against calling stations, including hands like 99 and A8s on all three streets.',
     next:'You bet 6.5bb and the station calls.'},
    {st:'river', ch:'opp', pot:22.5, stack:89, say:'The river is a nine. The station checks once more.',
     o:[['Bet about 11bb (half the pot)', true], ['Check back'], ['Go all-in for 89bb']],
     why:'A thin value bet wins only a bit more than half the time when called, and that is fine against a player who calls too much. Weaker aces, queens and pairs still call half the pot. All-in folds all of them, and checking wins nothing extra.',
     rule:'Thin value bets matter most against players who call too much.',
     next:'You bet 11bb, and the station calls with ace-five.'}]},

  {id:'riverbluff', name:'Bluff the missed straight draw', seat:'BTN', hero:['9s','8s'], opp:'Big blind, a regular', board:['Jd','Td','4c','2h','3c'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened nine-eight suited on the button and the big blind called. You flop an open-ended straight draw on a two-tone board, and the big blind checks.',
     o:[['Bet about 4bb (two-thirds of the pot)', true], ['Bet a tiny 1bb'], ['Go all-in for 97.5bb']],
     why:'Solvers bet open-ended straight draws about 70% of the time in position: the bet can win now, and the draw can still hit. On a connected, two-tone board, bet less often and bigger: about two-thirds of the pot.',
     rule:'C-bet 25–35% pot on dry, static boards and 55–80% on wet, dynamic ones.',
     next:'You bet 4bb and the big blind calls. On the turn deuce you both check.'},
    {st:'river', ch:'board', pot:13.5, stack:93.5, say:'The river is a three, and you missed. So did the flush draw. The big blind checks.',
     o:[['Bet about 9bb (two-thirds of the pot) as a bluff', true], ['Check and show down'], ['Bet a tiny 2bb']],
     why:'Nine-high almost never wins at showdown, so checking gives up the pot. Good river bluffs leave the opponent’s folding hands in their range: you hold none of the flush suit, so every missed flush draw the big blind has is still there to fold. That is why missed straight draws usually bluff better than missed flush draws. A two-thirds bet needs 9 ÷ 22.5 = 40% folds.',
     rule:'River bluffs should block calls, not folds. Missed straight draws usually bluff better than missed flush draws.',
     next:'You bet 9bb and the big blind folds.'}]},

  {id:'bbxr', name:'Check-raise a big draw', seat:'BB', hero:['7h','6h'], opp:'Button, a regular', board:['8h','5h','2c','Kd'], steps:[
    {st:'pre', ch:'seats', pot:4, call:1.5, stack:99, say:'The button opens to 2.5bb and the small blind folds. You have seven-six suited in the big blind.',
     o:[['Call 1.5bb', true], ['Fold'], ['Re-raise to 11bb']],
     why:'Against a 2.5bb open you need only about 27% to call, and suited connectors are a standard big blind defence. Seven-six suited uses its equity well: it makes strong draws and hidden straights. It is too weak to re-raise for value.',
     rule:'Defend the big blind widely: against a 2.5bb open you need only about 27%.',
     next:'You call. The pot is 5.5bb.'},
    {st:'flop', ch:'board', pot:7.5, call:2, stack:97.5, say:'You flop a flush draw and an open-ended straight draw. You check, and the button bets 2bb into 5.5bb.',
     o:[['Check-raise to about 8bb', true], ['Fold'], ['Check-raise all-in for 97.5bb']],
     why:'Fifteen outs make this one of the biggest draws you can flop, and out of position check-raises should come mainly from strong hands and big draws. The big blind should also play more aggressively on low, connected boards, which suit its range. A check-raise can win the pot now and builds one you are well placed to win later. All-in risks 97.5bb to win 7.5bb.',
     rule:'Out of position, medium hands check and call. Check-raise strong hands and big draws.',
     next:'You check-raise to 8bb and the button calls.'},
    {st:'turn', ch:'pot', pot:32.5, call:11, stack:89.5, say:'The turn is a king, a blank for you. You check, and the button bets 11bb into 21.5bb.',
     o:[['Call: you need 25.3%', true], ['Fold: you need 33.8%'], ['Fold: you missed']],
     why:'Nine cards make your flush, and the six fours and nines outside your suit make a straight: 15 outs, 32.6% with one card to come. You call 11bb to win a final pot of 43.5bb: 11 ÷ 43.5 = 25.3%, so the call pays before any implied odds. Dividing by the pot before your call gives 33.8%.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The river is a nine, and you make your straight.'}]},

  {id:'lagdown', name:'Let the aggressor bluff', seat:'CO', hero:['Ad','Qs'], opp:'Button, a loose-aggressive player', board:['Qc','7d','2h','4s','9c'], steps:[
    {st:'flop', ch:'board', pot:6.5, stack:97.5, say:'You opened ace-queen in the cutoff and the button, a loose-aggressive player, called. You flop top pair, top kicker, and you act first.',
     o:[['Check, planning to call', true], ['Bet big, about 5bb'], ['Check, and fold to a bet']],
     why:'Out of position the raiser should check much more, because an edge in range rarely makes up for acting first. Against a loose-aggressive player that is also the exploit: they bet far more hands than you need to beat, so let them bluff, and call down with a strong hand like top pair, top kicker.',
     rule:'Out of position, check much more; bet small only on strongly raiser-friendly boards.',
     next:'You check, the button bets 4.5bb, and you call.'},
    {st:'turn', ch:'pot', pot:25.5, call:10, stack:93, say:'The turn is a four. You check, and the button bets 10bb into 15.5bb.',
     o:[['Call: you need 28.2%', true], ['Fold: you need 39.2%'], ['Fold: a second bet means they beat you']],
     why:'You call 10bb to win a final pot of 35.5bb: 10 ÷ 35.5 = 28.2%. A loose-aggressive player keeps betting with draws, weaker queens and pure air, and top pair, top kicker beats well over 28% of that range. Dividing by the pot before your call gives 39.2%.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The pot is 35.5bb.'},
    {st:'river', ch:'opp', pot:60.5, call:25, stack:83, say:'The river is a nine. You check, and the button bets 25bb, about two-thirds of the pot.',
     o:[['Call', true], ['Fold'], ['Raise all-in']],
     why:'Against a nit or a passive player, a third big bet would be a fold. Against a loose-aggressive player it is a call: they pressure every street, and their missed draws and bluffs are still in the range. You need 25 ÷ 85.5 = 29.2%. Raising folds the bluffs you beat and gets called only by better hands.',
     rule:'Against loose-aggressive players, let them bluff: check-raise and call down with strong hands.',
     next:'You call, and the button shows six-five, a missed straight draw.'}]},

  {id:'monotone', name:'Monotone flop', seat:'BTN', hero:['Ad','Kc'], opp:'Big blind, a regular', board:['9h','6h','3h','Ks','7h'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened ace-king on the button and the big blind called. The flop is all one suit, and you hold none of it. The big blind checks.',
     o:[['Check back', true], ['Bet big, about 5bb'], ['Bet 5.5bb, the size of the pot']],
     why:'On monotone flops c-bet frequency and size drop sharply: every flush and flush draw in the big blind’s range is happy to continue, and ace-king with none of the suit has no pair and no flush draw. Check back and take a free card.',
     rule:'Monotone flops: bet less often and smaller.',
     next:'You check back.'},
    {st:'turn', ch:'board', pot:5.5, stack:97.5, say:'The turn is a king, giving you top pair, top kicker. The big blind checks.',
     o:[['Bet about 3.5bb (two-thirds of the pot)', true], ['Check back again'], ['Go all-in for 97.5bb']],
     why:'Before any bet, name the worse hands that call. Here there are plenty: weaker kings, nines, sixes and single cards of the flush suit. Top pair, top kicker beats them, so bet for value. All-in folds every one of them.',
     rule:'For value, worse hands must call often enough. Before you bet, name them.',
     next:'You bet 3.5bb and the big blind calls.'},
    {st:'river', ch:'opp', pot:25, call:12.5, stack:94, say:'The river is a fourth card of the flush suit. The big blind bets 12.5bb, the size of the pot.',
     o:[['Fold', true], ['Call: you need only 33.3%'], ['Raise all-in']],
     why:'A pot-size bet needs a third of its range to be bluffs before a bluff-catcher pays, and Upswing’s database found the player pool bluffing only about 22% at that size. With four of a suit on the board, any single card of that suit makes a flush, and top pair beats almost none of the hands that bet the pot.',
     rule:'Big river bets at low stakes are mostly value.',
     next:'You fold. The big blind shows a flush.'}]},

  {id:'setwet', name:'Set on a wet board', seat:'CO', hero:['7s','7c'], opp:'Big blind, a calling station', board:['9d','7d','6h','2s','Ac'], steps:[
    {st:'flop', ch:'board', pot:5.5, stack:97.5, say:'You opened sevens in the cutoff and the big blind, a calling station, called. You flop a set on a connected board with a flush draw, and the big blind checks.',
     o:[['Bet about 4bb (three-quarters of the pot)', true], ['Check to trap'], ['Bet a tiny 1bb']],
     why:'A set is a monster, and on a wet, dynamic board it should build the pot: bet 55–80% of the pot. Slowplay only on dry boards. Here a free card can give the big blind a straight or a flush, and plenty of their hands (nines, eights, draws) will call a big bet now.',
     rule:'Monsters build the pot over three streets; slowplay only on dry boards.',
     next:'You bet 4bb and the big blind calls.'},
    {st:'turn', ch:'opp', pot:13.5, stack:93.5, say:'The turn is a deuce, a blank. The big blind checks again.',
     o:[['Bet about 9.5bb (70% of the pot)', true], ['Check to let them bluff'], ['Bet a small 3bb']],
     why:'Against passive players, bet your strong hands yourself instead of checking to induce a bluff: a calling station rarely bluffs, but they call. Their nines, draws and pairs will pay a big bet, so value bet big and often.',
     rule:'Calling stations: value bet big and often, and never bluff.',
     next:'You bet 9.5bb and the station calls with nine-eight. The river is an ace; you bet again, and they call.'}]},

  {id:'smallpair3bet', name:'Small pair against a 3-bet', seat:'HJ', hero:['4h','4s'], opp:'Button, a regular', board:['Kc','Qd','8h'], steps:[
    {st:'pre', ch:'seats', pot:1.5, stack:100, say:'Everyone folds to you in the hijack.',
     o:[RAISE_FIRST, ['Limp: just call 1bb'], ['Fold']],
     why:'Fours are the smallest pair in the hijack’s opening range. Raise first in.',
     rule:'Raise when you are first in. Never open-limp.',
     next:'You open to 2.5bb. The button re-raises to 7.5bb, and the blinds fold.'},
    {st:'pre', lbl:'Facing a 3-bet', ch:'pot', pot:11.5, call:5, stack:97.5, say:'The button has re-raised to 7.5bb. You have 97.5bb left, and you would be out of position after the flop.',
     o:[['Fold', true], ['Call to try to flop a set'], ['4-bet to about 18bb']],
     why:'Set mining needs at least 15 times the raise behind, and about 25 times out of position. 15 × 7.5bb = 112.5bb, already more than your 97.5bb, so the call fails even the easier test. Upswing’s defaults agree: when your open is re-raised, pairs from deuces to fives usually fold.',
     rule:'Set mine only with at least 15 times the raise in the effective stack, and about 25 times out of position.',
     next:'You fold, losing only your 2.5bb open.'}]},

  {id:'oesdprice', name:'Open-ended draw at a small price', seat:'BTN', hero:['8d','7d'], opp:'Cutoff, a regular', board:['9h','6c','2s','3h'], steps:[
    {st:'pre', ch:'seats', pot:4, call:2.5, stack:100, say:'The cutoff opens to 2.5bb, and you have eight-seven suited on the button.',
     o:[['Call 2.5bb', true], ['Re-raise to 7.5bb'], ['Fold']],
     why:'Against a raise, Jonathan Little’s framework calls with suited connectors, medium pairs and big cards that play well in position, and keeps re-raises for value hands and a few suited-ace bluffs. Eight-seven suited on the button is a classic call.',
     rule:'Against a raise, call with suited connectors and medium pairs that play well in position.',
     next:'You call, and the blinds fold.'},
    {st:'flop', ch:'pot', pot:9, call:2.5, stack:97.5, say:'You flop an open-ended straight draw. The cutoff bets 2.5bb into 6.5bb.',
     o:[['Call', true], ['Fold: 8 outs hit only 17% of the time'], ['Fold: you need 38.5%']],
     why:'You call 2.5bb to win a final pot of 11.5bb: 2.5 ÷ 11.5 = 21.7%. Eight outs come in about 17% of the time on the next card, a little short, but you need to win only about 3bb more on later streets when you hit, and in position with deep stacks you usually will. Comparing the call with the pot before the bet gives 38.5%.',
     rule:'Implied odds pay only when stacks are deep and you will hold the best hand when you hit.',
     next:'You call. The pot is 11.5bb.'},
    {st:'turn', ch:'pot', pot:14.5, call:3, stack:95, say:'The turn is a three, no help. The cutoff bets 3bb into 11.5bb.',
     o:[['Call: 8 outs hit 17.4%, and you need 17.1%', true], ['Fold: you need 26.1%'], ['Fold: draws need two cards to come']],
     why:'You call 3bb to win a final pot of 17.5bb: 3 ÷ 17.5 = 17.1%. Eight outs hit 17.4% of the time with one card to come, so this small bet lets you call on today’s price alone, before any implied odds. Comparing the call with the pot before the bet gives 26.1%.',
     rule:'The equity you need is your call divided by the pot after you call.',
     next:'You call. The river is a five, and you make your straight.'}]},

  {id:'stationbtn', name:'No bluffs against a station', seat:'BTN', hero:['As','4s'], opp:'Cutoff, a calling station', board:['9d','6c','2h','Ad'], steps:[
    {st:'pre', ch:'seats', pot:4, call:2.5, stack:100, say:'The cutoff, a calling station, opens to 2.5bb. You have ace-four suited on the button.',
     o:[['Call 2.5bb', true], ['Re-raise to 7.5bb as a bluff'], ['Go all-in']],
     why:'A small suited ace is a standard bluff re-raise from the button, but against players who call everything, re-raise only for value: a bluff needs folds, and a station doesn’t fold. In position, ace-four suited still plays well as a call.',
     rule:'Against players who call everything, re-raise only for value.',
     next:'You call, and the blinds fold.'},
    {st:'flop', ch:'opp', pot:6.5, stack:97.5, say:'You have ace-high and nothing else. The station checks to you.',
     o:[['Check back', true], ['Bet about 3bb as a bluff'], ['Bet 6.5bb, the size of the pot, as a bluff']],
     why:'A bet with ace-high here is a bluff, and bluffs work only against players who fold. A station calls with any pair and many draws, so a bluff just loses chips. Check back and keep your ace-high for a cheap showdown.',
     rule:'Calling stations: value bet big and often, and never bluff.',
     next:'You check back.'},
    {st:'turn', ch:'opp', pot:6.5, stack:97.5, say:'The turn is an ace, giving you top pair. The station checks again.',
     o:[['Bet about 4.5bb (two-thirds of the pot)', true], ['Check back'], ['Bet a tiny 1bb']],
     why:'Now you have value: the station calls with nines, sixes, deuces, weaker aces and many draws. Top pair with a four kicker is a thin value hand, and thin value is what pays against players who call too much. Bet big and often.',
     rule:'Thin value bets matter most against players who call too much.',
     next:'You bet 4.5bb and the station calls with nine-eight.'}]}
];

const freshHand = () => ({hands:0, perfect:0, total:0, correct:0, ch:{}});
let fhStats = Object.assign(freshHand(), loadJSON(STORE + ':hand'));
const fh = {hand:null, step:0, answered:false, choice:null, log:[], deck:[], handNo:1, rv:null};

// Deal a hand: H from FH_HANDS, with its cards already relabelled.
function fhDeal(H, hero, board, step, rvId) {
  fh.hand = Object.assign({}, H, {hero, board,
    steps:H.steps.map(s => Object.assign({}, s, {opts:shuffle(s.o.map(([label, correct]) => ({label, correct:!!correct})))}))});
  fh.step = step; fh.answered = false; fh.choice = null; fh.rv = rvId || null;
  fh.log = H.steps.slice(0, step).map(() => ({skip:true}));
  fh.handNo = fhStats.hands + 1;
  fhRender();
}
// A saved miss is one decision: the review replays that street of the same hand, with the same cards.
function fhShow(q, id) {
  const H = FH_HANDS.find(h => h.id === q.id);
  if (!H || !H.steps[q.step] || !Array.isArray(q.hero) || !Array.isArray(q.board)) throw new Error('bad hand');
  fhDeal(H, q.hero, q.board, q.step, id);
}
function fhNew() {
  if (!fh.deck.length) fh.deck = shuffle(FH_HANDS.filter(h => !fh.hand || h.id !== fh.hand.id || FH_HANDS.length < 2));
  const H = fh.deck.pop(), m = suitMapper();
  fhDeal(H, H.hero.map(m), H.board.map(m), 0);
}
const fhLast = () => !!fh.rv || fh.step === fh.hand.steps.length - 1;
function fhAnswer(i) {
  const S = fh.hand.steps[fh.step];
  if (fh.answered || !S.opts[i]) return;
  fh.answered = true; fh.choice = i;
  const ok = S.opts[i].correct;
  fh.log.push({i, ok});
  fhStats.total++; if (ok) fhStats.correct++;
  const c = fhStats.ch[S.ch] || (fhStats.ch[S.ch] = {n:0, c:0});
  c.n++; if (ok) c.c++;
  if (fhLast() && !fh.rv) { fhStats.hands++; if (fh.log.every(l => l.ok)) fhStats.perfect++; }
  saveJSON(STORE + ':hand', fhStats);
  const H = fh.hand, step = fh.step;
  rvRecord('hand', ok, fh.rv, () => ({id:H.id, step, hero:H.hero, board:H.board}));
  fhRender();
  const nb = $('#fh-next'); if (nb) nb.focus({preventScroll:true});
}
function fhNext() {
  if (!fh.answered) return;
  if (fhLast()) { rvNext() || fhNew(); return; }
  fh.step++; fh.answered = false; fh.choice = null;
  fhRender();
}

const fhLbl = S => S.lbl || FH_STREET[S.st];
const fhChTag = k => `<span class="fh-ch" style="--gc:${FH_CH[k].gc}"><span class="dot" aria-hidden="true"></span>${FH_CH[k].name}</span>`;
function fhSceneHTML(H, S) {
  const shown = FH_SHOWN[S.st];
  const board = H.board.slice(0, shown).map(pcHTML).join('') +
    Array.from({length:5 - shown}, () => '<div class="pc back" aria-hidden="true"></div>').join('');
  const facts = [{k:'Pot', v:fmtBB(S.pot) + 'bb'}];
  if (S.call) facts.push({k:'To call', v:fmtBB(S.call) + 'bb'});
  facts.push({k:'Behind', v:fmtBB(S.stack) + 'bb'});
  if (S.st === 'flop' && !S.call && !S.lbl) facts.push({k:'SPR', v:num(S.stack / S.pot)});
  return `<div class="scene fh-scene"><div class="scene-cards">
    <div class="cardgroup"><span class="lbl">Board · ${FH_STREET[S.st]}</span><div class="cardrow" role="img" aria-label="${shown ? H.board.slice(0, shown).map(c => showRank(c.r) + ' of ' + c.name).join(', ') : 'No cards yet'}">${board}</div></div>
    <div class="cardgroup"><span class="lbl">Your hand</span><div class="cardrow">${H.hero.map(pcHTML).join('')}</div></div>
  </div><dl class="facts">${facts.map(f => `<div><dt>${f.k}</dt><dd>${f.v}</dd></div>`).join('')}</dl></div>`;
}
function fhRenderScore() {
  const R = fhStats;
  $('#fst-hands').textContent = R.hands;
  $('#fst-correct').textContent = `${R.correct}/${R.total}`;
  $('#fst-acc').textContent = R.total ? Math.round(R.correct / R.total * 100) + '%' : '–';
  $('#fst-perfect').textContent = R.perfect;
  $('#fh-chs').innerHTML = Object.keys(FH_CH).map(k => {
    const s = R.ch[k] || {n:0, c:0};
    return `<div class="rec"><span class="rec-pos" style="--gc:${FH_CH[k].gc}"><span class="dot" aria-hidden="true"></span>${FH_CH[k].name}</span><span class="rec-n">${s.n ? s.c + '/' + s.n : '–'}</span><span class="bar"><span style="width:${s.n ? Math.round(s.c / s.n * 100) : 0}%"></span></span></div>`;
  }).join('');
}
function fhRender() {
  fhRenderScore();
  const H = fh.hand, S = H.steps[fh.step];
  $('#fh-eyebrow').textContent = `${rvLabel(fh.rv) || 'Hand ' + fh.handNo} · ${H.name}`;
  $('#fh-meta').innerHTML = `<span class="pill">You: ${cap(FH_SEAT[H.seat])}</span><span class="pill">Against: ${H.opp}</span><span class="pill">6-max · 100bb</span>`;
  $('#fh-steps').innerHTML = H.steps.map((s, i) => {
    const l = fh.log[i] && !fh.log[i].skip ? fh.log[i] : null, cls = l ? (l.ok ? 'ok' : 'bad') : i === fh.step ? 'now' : '';
    return `<li class="${cls}"${i === fh.step ? ' aria-current="step"' : ''}>${l ? (l.ok ? '✓ ' : '✕ ') : ''}${fhLbl(s)}</li>`;
  }).join('');
  $('#fh-scene').innerHTML = fhSceneHTML(H, S);
  $('#fh-say').textContent = S.say;
  $('#fh-prompt').textContent = 'What do you do?';
  $('#fh-options').innerHTML = S.opts.map((o, i) => {
    let cls = 'opt';
    if (fh.answered && o.correct) cls += ' right';
    else if (fh.answered && i === fh.choice) cls += ' wrong';
    return `<button type="button" class="${cls}" data-fhopt="${i}"${fh.answered ? ' disabled' : ''}><kbd>${i + 1}</kbd><span>${o.label}</span></button>`;
  }).join('');
  $('#fh-log').innerHTML = H.steps.map((s, i) => {
    const l = fh.log[i];
    if (l && l.skip) return `<li class="todo"><span class="m" aria-hidden="true">${i + 1}</span><b>${fhLbl(s)}</b><span>${s.opts.find(o => o.correct).label}</span></li>`;
    if (fh.rv && i > fh.step) return '';
    if (!l) return `<li class="todo"><span class="m" aria-hidden="true">${i + 1}</span><b>${fhLbl(s)}</b><span>${i === fh.step ? 'Your decision now' : 'Still to come'}</span></li>`;
    const right = s.opts.find(o => o.correct).label;
    return `<li class="${l.ok ? 'ok' : 'bad'}"><span class="m" aria-hidden="true">${l.ok ? '✓' : '✕'}</span><b>${fhLbl(s)} · ${FH_CH[s.ch].name}</b><span>${l.ok ? right : `You: ${s.opts[l.i].label}. Better: ${right}`}</span></li>`;
  }).join('');
  const el = $('#fh-result');
  if (!fh.answered) { el.hidden = true; el.innerHTML = ''; return; }
  const ok = S.opts[fh.choice].correct, right = S.opts.find(o => o.correct).label, last = fhLast();
  const got = fh.log.filter(l => l.ok).length;
  const head = fh.rv ? (ok ? 'Review: this one is cleared from your misses.' : 'Better: ' + right) : last ? `Hand over: ${got} of ${H.steps.length} decisions right.` : ok ? fhChTag(S.ch) : 'Better: ' + right;
  el.hidden = false;
  el.innerHTML = `
    <div class="verdict ${ok ? 'ok' : 'bad'}">
      <span class="mark" aria-hidden="true">${ok ? '✓' : '✕'}</span>
      <div class="v-text"><h3>${ok ? 'Correct.' : 'Not quite.'}</h3><p>${head}</p></div>
      <button type="button" class="new-hand" id="fh-next">${fh.rv ? 'Next' : last ? 'New hand' : 'Next decision'} <kbd>N</kbd></button>
    </div>
    <p class="work">${S.why}</p>
    <p class="rule"><strong>Rule from the ${FH_CH[S.ch].name} chapter</strong>${S.rule}</p>
    <p class="fh-then"><strong>${last && !fh.rv ? 'How the hand ends' : ok ? 'What happens next' : `The hand goes on as if you had played: ${right}`}</strong>${S.next}</p>
    ${ok ? '' : `<button type="button" class="fh-go" data-fhgo="${S.ch}">Practise this in the ${FH_CH[S.ch].name} tab</button>`}`;
}

$('#fh-options').addEventListener('click', e => { const b = e.target.closest('[data-fhopt]'); if (b) fhAnswer(+b.dataset.fhopt); });
$('#fh-result').addEventListener('click', e => {
  if (e.target.closest('#fh-next')) fhNext();
  const g = e.target.closest('[data-fhgo]'); if (g) setTab(g.dataset.fhgo);
});
armReset($('#fh-reset'), () => { fhStats = freshHand(); saveJSON(STORE + ':hand', fhStats); fhRenderScore(); rvClear('hand'); });
