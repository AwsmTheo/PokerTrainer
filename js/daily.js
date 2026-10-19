'use strict';

/* =====================================================================
   DAILY SET
   Its own tab: a short mixed set each day, two questions from each quiz
   tab and then one full hand, played inside the Daily tab. Each question
   is the drill's own view, moved into the tab while it is asked. Answers
   reach the set through the review hooks (rvRecord counts the answer,
   rvNext moves on, rvLabel names it), so drills need nothing extra. After
   the set, extra mixed questions keep coming but don't count. Finishing a
   set on consecutive days builds a streak. Kept under its own key.
   ===================================================================== */
const DY_KEY = STORE + ':daily';
const DY_PLAN = ['seats', 'seats', 'pot', 'pot', 'board', 'board', 'opp', 'opp'];   // shuffled; the full hand comes last
const DY_EXTRA = ['seats', 'pot', 'board', 'opp'];
const dyData = loadJSON(DY_KEY);   // {day, plan, res, streak, best, last}: res holds 1 or 0 for each answered item
const dy = {active:false, tab:null, counted:false, handOk:true, extra:false, home:null};
const dyDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dyBefore = day => { const d = new Date(day + 'T12:00:00'); d.setDate(d.getDate() - 1); return dyDay(d); };
const dyPos = () => dyData.res.length;
const dyDone = () => dyPos() >= dyData.plan.length;
const dyStreak = () => dyData.last === dyDay() || dyData.last === dyBefore(dyDay()) ? dyData.streak || 0 : 0;
const dySave = () => saveJSON(DY_KEY, dyData);
const dyAnswered = t => ({seats:state.answered, pot:pot.answered, board:bt.answered, opp:opp.answered, hand:fh.answered})[t];

function dyToday() {   // today's plan, made on the first visit of the day
  const ok = dyData.day === dyDay() && Array.isArray(dyData.plan) && dyData.plan.length && dyData.plan.every(t => RV[t]) &&
             Array.isArray(dyData.res) && dyData.res.length <= dyData.plan.length;
  if (ok) return;
  let plan = DY_PLAN;
  for (let i = 0; i < 50; i++) { plan = shuffle(DY_PLAN); if (plan.every((t, j) => !j || t !== plan[j - 1])) break; }
  Object.assign(dyData, {day:dyDay(), plan:plan.concat('hand'), res:[]});
}
// Moves a drill's view into the Daily tab, leaving a marker where it lives, and back again.
function dyMount(t) {
  dyUnmount();
  const v = $('#view-' + t);
  dy.home = document.createComment('daily');
  v.before(dy.home);
  $('#dy-host').append(v);
  v.hidden = false;
}
function dyUnmount() {
  if (!dy.home) return;
  const v = $('#dy-host').firstElementChild;
  if (v) { v.hidden = true; dy.home.replaceWith(v); }
  dy.home = null;
}
// Called by setTab when the Daily tab opens: carry on with the question on screen, or deal the next one.
function dyEnter() {
  if (rv.active) rvStop();
  dyToday();
  dy.active = true;
  if (dy.tab && !dy.counted && !dyAnswered(dy.tab) && dy.extra === dyDone()) { dyMount(dy.tab); renderRv(); }
  else dyDeal();
}
function dyLeave() { dy.active = false; dyUnmount(); }
function dyDeal() {
  dy.extra = dyDone();
  const t = dy.extra ? DY_EXTRA[rand(DY_EXTRA.length)] : dyData.plan[dyPos()];
  Object.assign(dy, {tab:t, counted:false, handOk:true});
  RV[t].fresh();
  dyMount(t);
  renderRv();
}
// Called by rvRecord. Counts the first answer to the set's question; a full hand counts once, at its last decision, and is right only if every decision was.
function dyRecord(tab, ok, id) {
  if (!dy.active || dy.extra || dy.counted || id || dyDone() || tab !== dy.tab) return;
  dy.handOk = dy.handOk && ok;
  if (tab === 'hand' && !fhLast()) return;
  dy.counted = true;
  dyData.res.push(dy.handOk ? 1 : 0);
  if (dyDone()) {
    if (dyData.last !== dyData.day) dyData.streak = dyData.last === dyBefore(dyData.day) ? (dyData.streak || 0) + 1 : 1;
    dyData.last = dyData.day;
    dyData.best = Math.max(dyData.best || 0, dyData.streak);
  }
  dySave();
}
// Called by rvNext while the Daily tab is open.
function dyNext() { dyDeal(); return true; }
function dyLabel() {
  if (!dy.active) return '';
  if (dy.extra) return 'Extra question';
  const i = dyPos() - (dy.counted ? 1 : 0);
  return `Daily set ${i + 1} of ${dyData.plan.length}`;
}

function renderDy() {
  if (!dy.active) dyToday();   // a set that runs past midnight finishes as yesterday's
  const n = dyData.plan.length, pos = dyPos(), right = dyData.res.reduce((a, b) => a + b, 0), streak = dyStreak();
  const days = k => `${k} ${k === 1 ? 'day' : 'days'}`;
  $('#dy-tabsub').textContent = dyDone() ? 'Done for today' : streak ? `${streak}-day streak` : 'Today’s set';
  const cur = dy.active && !dy.extra ? pos - (dy.counted ? 1 : 0) : -1;
  const dots = `<ol class="dy-dots" aria-hidden="true">${dyData.plan.map((t, i) =>
    `<li class="${i < pos ? (dyData.res[i] ? 'ok' : 'bad') : i === cur ? 'now' : ''}" title="${RV[t].name}"></li>`).join('')}</ol>`;
  let text;
  if (dyDone()) text = `<b>Today’s set is done:</b> ${right} of ${n} right. ${streak > 1 ? `That makes ${days(streak)} in a row` : 'Your streak has started'}. A new set comes tomorrow; until then, extra mixed questions keep coming here but don’t count.`;
  else if (dy.active && cur >= 0) text = `<b>Question ${cur + 1} of ${n}</b> · ${RV[dyData.plan[cur]].name} · ${right} right so far. Two from each tab, then a full hand.`;
  else text = `<b>Today’s set</b> · ${n} mixed questions: two from each tab, then a full hand.${streak ? ` Finish it to keep your ${streak}-day streak.` : ''}`;
  $('#dy').innerHTML = `<span class="dy-streak" title="Days in a row with a finished daily set"><b>${streak}</b>day streak</span>
    ${dyData.best ? `<span class="dy-best">Best ${days(dyData.best)}</span>` : ''}${dots}<p class="dy-text">${text}</p>`;
}
