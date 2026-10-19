'use strict';

/* =====================================================================
   TABS AND KEYS
   ===================================================================== */
const TABS = {
  daily:{hash:'daily', title:'Daily Set',
         tag:'Nine questions a day, played right here: two from each tab, then a full hand. Finish the set on consecutive days to build your streak.'},
  seats:{hash:'seats', title:'Preflop Seat Drill',
         tag:'You get a random seat and a random hand, and everyone before you has folded. Decide how to open: raise, call or fold.'},
  pot:{hash:'pot-odds', title:'Pot Odds Drill',
       tag:'Fresh spots on pot odds, outs, expected value, implied odds, bluffs, stack-to-pot ratio and short stacks. Pick a topic or mix them, and check your maths on the workbench.'},
  board:{hash:'board-texture', title:'Board Texture Drill',
         tag:'Random flops to read: name the texture, decide whose range it favours, pick a continuation-bet plan and sort your hand into a bucket.'},
  opp:{hash:'opponents', title:'Opponent Adjustment Drill',
       tag:'Label the player in front of you, then pick the adjustment that beats them: when to value bet thin, when to bluff, and when to believe a big bet.'},
  hand:{hash:'full-hand', title:'Full Hand Drill',
        tag:'Play a whole hand one decision at a time: open or defend, read the flop, price each call and adjust to the player. Every decision is checked against the guide.'},
  log:{hash:'session-log', title:'Session Log',
       tag:'Log each real session when you get up from the table: the stakes, what you bought in for, what you cashed out and how long you played. See your results, what you win an hour and your bankroll in buy-ins.'}
};
function setTab(id) {
  if (!TABS[id]) id = 'seats';
  dyLeave();
  prefs.tab = id; savePrefs();
  document.querySelectorAll('[data-tab]').forEach(b => {
    const on = b.dataset.tab === id;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  $('#view-daily').hidden = id !== 'daily';
  $('#view-seats').hidden = id !== 'seats';
  $('#view-pot').hidden = id !== 'pot';
  $('#view-board').hidden = id !== 'board';
  $('#view-opp').hidden = id !== 'opp';
  $('#view-hand').hidden = id !== 'hand';
  $('#view-log').hidden = id !== 'log';
  const T = TABS[id];
  $('#app-title').textContent = T.title;
  $('#app-tag').textContent = T.tag;
  try { history.replaceState(null, '', '#' + T.hash); } catch (e) { /* sandboxed */ }
  if (id === 'pot' && !pot.q) newQuestion();
  if (id === 'board' && !bt.q) btNew();
  if (id === 'opp' && !opp.q) newOpp();
  if (id === 'hand' && !fh.hand) fhNew();
  if (id === 'daily') dyEnter();
}
const tabBtns = [...document.querySelectorAll('[data-tab]')];
tabBtns.forEach((b, i) => {
  b.addEventListener('click', () => setTab(b.dataset.tab));
  b.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = tabBtns[(i + (e.key === 'ArrowRight' ? 1 : tabBtns.length - 1)) % tabBtns.length];
    setTab(next.dataset.tab); next.focus();
  });
});

document.addEventListener('keydown', e => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const tag = e.target && e.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const k = e.key.toLowerCase();
  const tab = prefs.tab === 'daily' ? dy.active && dy.tab : prefs.tab;   // on the Daily tab, the drill it is showing
  if (!tab || tab === 'log') return;
  if (tab === 'board') {
    if (!bt.answered && /^[1-5]$/.test(k)) btAnswer(+k - 1);
    else if (bt.answered && k === 'n') { e.preventDefault(); rvNext() || btNew(); }
    return;
  }
  if (tab === 'hand') {
    if (!fh.answered && /^[1-4]$/.test(k)) fhAnswer(+k - 1);
    else if (fh.answered && k === 'n') { e.preventDefault(); fhNext(); }   // fhNext calls rvNext() at the end of a hand
    return;
  }
  if (tab === 'opp') {
    if (!opp.answered && /^[1-4]$/.test(k)) answerOpp(+k - 1);
    else if (opp.answered && k === 'n') { e.preventDefault(); rvNext() || newOpp(); }
    return;
  }
  if (tab === 'pot') {
    if (!pot.answered && /^[1-4]$/.test(k)) answerPot(+k - 1);
    else if (pot.answered && k === 'n') { e.preventDefault(); rvNext() || newQuestion(); }
    return;
  }
  if (!state.answered) {
    if (k === 'f') answer('fold'); else if (k === 'c') answer('call'); else if (k === 'r') answer('raise');
  } else if (k === 'n') {
    e.preventDefault(); rvNext() || newHand();
  }
});

buildTables();
updateBench();
renderCur();
newHand();
renderRv();
lgResetForm();
lgFillSet();
renderLog();
const fromHash = (location.hash || '').slice(1);
setTab(Object.keys(TABS).find(k => TABS[k].hash === fromHash) || prefs.tab);
