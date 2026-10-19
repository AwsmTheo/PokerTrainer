'use strict';

/* =====================================================================
   PROGRESS AND REVIEW
   Every missed question is saved so it can be asked again. A drill hooks
   in with rvRecord() after scoring an answer, rvNext() before dealing its
   next question, rvLabel() in its eyebrow and rvClear() on reset.
   ===================================================================== */
const RV_KEY = STORE + ':review';
const RV_CAP = 30;   // misses kept per tab; the oldest drop off
const RV = {   // per tab: its record, how to show a saved question, and how to deal a fresh one
  seats:{name:'Seats', rec:() => stats, fresh:newHand,
         show:(q, id) => { if (!FORMATS[q.fmt]) throw new Error('bad format'); prefs.fmt = q.fmt; savePrefs(); dealHand(q.seat, q.cards, id); }},
  pot:  {name:'Pot odds', rec:() => potStats, fresh:newQuestion, show:(q, id) => { q.rv = id; showQuestion(q); }},
  board:{name:'Board', rec:() => btStats, fresh:btNew, show:(q, id) => { q.rv = id; btShow(q); }},
  opp:  {name:'Opponents', rec:() => oppStatsRec, fresh:newOpp, show:(q, id) => { q.rv = id; showOpp(q); }},
  hand: {name:'Full hand', rec:() => fhStats, fresh:() => fhNew(), show:(q, id) => fhShow(q, id)}
};
const rvData = loadJSON(RV_KEY);
rvData.items = (Array.isArray(rvData.items) ? rvData.items : []).filter(m => m && m.id && m.q && RV[m.tab]);
const rv = {active:false, ended:false, queue:[], n:0, pos:0, done:0, right:0, cur:null, counted:false};
let rvSeq = 0;
const rvSave = () => saveJSON(RV_KEY, rvData);
const rvFind = id => rvData.items.find(m => m.id === id);
const rvDrop = id => { rvData.items = rvData.items.filter(m => m.id !== id); };
const rvClone = q => JSON.parse(JSON.stringify(q));

function rvRecord(tab, ok, id, snap) {
  dyRecord(tab, ok, id);
  if (id && id === rv.cur && !rv.counted) { rv.counted = true; rv.done++; if (ok) rv.right++; }
  const m = id && rvFind(id);
  if (m && ok) rvDrop(id);
  else if (m) { m.misses = (m.misses || 1) + 1; m.at = Date.now(); }
  else if (!ok) {   // a new miss, or a saved one that was cleared while on screen
    rvData.items.push({id:Date.now().toString(36) + '-' + (rvSeq++), tab, q:rvClone(snap()), at:Date.now()});
    const mine = rvData.items.filter(m => m.tab === tab);
    if (mine.length > RV_CAP) rvDrop(mine[0].id);
  }
  rvSave(); renderRv();
}
function rvClear(tab) {
  rvData.items = rvData.items.filter(m => m.tab !== tab);
  rvSave(); renderRv();
}
const rvLabel = id => !id ? dyLabel() : id === rv.cur && rv.n ? `Review ${rv.pos} of ${rv.n}` : 'Review';

function rvStart(tab) {
  dy.active = false;   // a review opens on the drills' own tabs, which pauses the daily set
  rv.queue = shuffle(rvData.items.filter(m => !tab || m.tab === tab).map(m => m.id));
  if (!rv.queue.length) return;
  Object.assign(rv, {active:true, ended:false, n:rv.queue.length, pos:0, done:0, right:0});
  rvNext();
}
// Shows the next saved miss, on its own tab. Returns false when no review is running, so the drill deals as usual.
function rvNext() {
  if (dy.active) return dyNext();
  if (!rv.active) return false;
  while (rv.queue.length) {
    const id = rv.queue.shift(), m = rvFind(id);
    if (!m) { rv.n--; continue; }
    rv.cur = id; rv.counted = false; rv.pos = rv.n - rv.queue.length;
    try { RV[m.tab].show(rvClone(m.q), id); }
    catch (e) {   // a saved question this version can't show
      rvDrop(id); rvSave(); rv.n--;
      try { RV[m.tab].fresh(); } catch (e2) { /* ignore */ }
      continue;
    }
    setTab(m.tab);
    renderRv();
    return true;
  }
  rv.active = false; rv.ended = rv.done > 0; rv.cur = null;
  renderRv();
  return false;
}
function rvStop() { rv.active = false; rv.queue = []; renderRv(); }

function renderRv() {
  const counts = {};
  rvData.items.forEach(m => { counts[m.tab] = (counts[m.tab] || 0) + 1; });
  $('#rv-grid').innerHTML = Object.keys(RV).map(t => {
    const R = RV[t].rec(), k = counts[t] || 0;
    return `<div class="rv-tile${k ? ' has' : ''}">
      <span class="rv-name">${RV[t].name}</span>
      <b class="rv-acc">${R.total ? Math.round(R.correct / R.total * 100) + '%' : '–'}</b>
      <span class="rv-sub">${R.total ? `${R.correct} of ${R.total} right` : 'Not started'}</span>
      ${k ? `<span class="rv-sub rv-k">${k} to review</span>` : ''}
      ${k ? `<button type="button" class="rv-btn" data-rvtab="${t}"${rv.active ? ' disabled' : ''}>Review ${k} ${k === 1 ? 'miss' : 'misses'}</button>` : '<span class="rv-sub">No misses saved</span>'}
    </div>`;
  }).join('');
  $('#rv').classList.toggle('on', rv.active);
  const total = rvData.items.length, wrong = rv.done - rv.right;
  $('#rv-sum').innerHTML = rv.active ? `Reviewing ${rv.pos} of ${rv.n}`
    : rv.ended ? `Review done: ${rv.right} of ${rv.done} right`
    : total ? `Review misses <span class="rv-count">${total}</span>` : 'Your progress';
  $('#rv-side').innerHTML = rv.active
    ? `<p><b>Reviewing your misses</b> · ${rv.pos} of ${rv.n} · ${rv.right} right so far</p><button type="button" class="link-btn" id="rv-stop">Stop review</button>`
    : rv.ended
    ? `<p><b>Review done.</b> You got ${rv.right} of ${rv.done} right.${wrong ? ` The ${wrong === 1 ? 'one' : wrong} you missed ${wrong === 1 ? 'stays' : 'stay'} saved.` : ' Those are cleared from your misses.'}</p><button type="button" class="link-btn" id="rv-close">OK</button>`
    : total
    ? `<button type="button" class="new-hand" data-rvtab="">Review all misses <kbd class="count">${total}</kbd></button>`
    : '<p>Questions you miss are saved here so you can try them again.</p>';
  renderDy();
}
$('#rv').addEventListener('click', e => {
  const b = e.target.closest('[data-rvtab]');
  if (b && !b.disabled) { $('#rv').open = false; rvStart(b.dataset.rvtab || null); return; }
  if (e.target.closest('#rv-stop')) rvStop();
  else if (e.target.closest('#rv-close')) { rv.ended = false; renderRv(); }
});
// A dropdown: closes on Escape or a click anywhere outside it.
document.addEventListener('click', e => { if ($('#rv').open && !e.target.closest('#rv')) $('#rv').open = false; });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('#rv').open) { $('#rv').open = false; $('#rv-sum').focus(); }
});
