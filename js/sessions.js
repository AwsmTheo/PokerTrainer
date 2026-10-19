'use strict';

/* =====================================================================
   SESSION LOG
   Not a drill: real games, logged once per session when you get up from
   the table. Each session keeps the currency it was logged in, and totals
   are shown in the chosen one. The bankroll is the starting amount plus
   every result, counted in buy-ins of your game against the guide's
   bands. Kept under its own key.
   ===================================================================== */
// The guide's 2026 cash-game guidance, in buy-ins.
const BK_BANDS = [
  {min:0,  label:'Under 20 buy-ins: move down', why:'Below 20 buy-ins the guide says to move down to a smaller game.'},
  {min:20, label:'20–29 buy-ins: aggressive', why:'20 buy-ins is the aggressive end of the guidance.'},
  {min:30, label:'30–49 buy-ins: standard', why:'30 buy-ins is the standard bankroll.'},
  {min:50, label:'50 or more: conservative', why:'50 buy-ins or more is the conservative bankroll.'}
];
const bkBand = n => BK_BANDS.filter(b => n >= b.min).pop();
const LG_KEY = STORE + ':log';
const lgNum = x => typeof x === 'number' && isFinite(x) && x >= 0;
const lgData = (() => {
  const d = loadJSON(LG_KEY), amt = a => a && lgNum(a.n) && CUR[a.cur] ? {n:a.n, cur:a.cur} : null;
  const sessions = (Array.isArray(d.sessions) ? d.sessions : []).filter(x =>
    x && typeof x.id === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && lgNum(x.buyin) && lgNum(x.cashout) && lgNum(x.hours) && x.hours > 0 && CUR[x.cur]
  ).map(x => ({id:x.id, date:x.date, stakes:typeof x.stakes === 'string' ? x.stakes.slice(0, 40) : '', buyin:x.buyin, cashout:x.cashout, hours:x.hours, cur:x.cur}));
  const game = amt(d.game);
  return {sessions, start:amt(d.start), game:game && game.n > 0 ? game : null};
})();
const lgSave = () => saveJSON(LG_KEY, lgData);
const lg = {editing:null, cur:prefs.cur};   // cur: the currency the form is filled in
const lgEsc = t => String(t).replace(/[&<>"]/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;'})[c]);
const lgConv = (n, from, to = prefs.cur) => from === to ? n : n * CUR[from].nok / CUR[to].nok;
const lgRound = n => Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
const lgMoney = (n, c = prefs.cur) => money(lgRound(n), c);
const lgSigned = (n, c = prefs.cur) => { const r = lgRound(n); return r > 0 ? '+' + money(r, c) : r < 0 ? '−' + money(-r, c) : money(0, c); };
const lgRate = (n, c) => Math.abs(n) >= 10 ? (n > 0 ? '+' : '−') + money(Math.round(Math.abs(n)), c) : lgSigned(n, c);   // per hour, in whole units
const lgTone = n => lgRound(n) > 0 ? 'lg-up' : lgRound(n) < 0 ? 'lg-down' : '';
const lgUnit = c => CUR[c].show('').trim();
const lgDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
const lgSplit = h => { let H = Math.floor(h + 1e-9), m = Math.round((h - H) * 60); if (m === 60) { H++; m = 0; } return [H, m]; };
const lgHours = h => { const [H, m] = lgSplit(h); return m ? (H ? `${H} h ${m} min` : `${m} min`) : `${H} h`; };
const lgSorted = () => lgData.sessions.map((x, i) => [x, i]).sort((a, b) => b[0].date.localeCompare(a[0].date) || b[1] - a[1]).map(p => p[0]);

// Amounts as typed on any keyboard: "1 250", "1,250", "1250,50", "12.5" or "300 kr".
function lgAmount(t) {
  if (/-/.test(t)) return NaN;
  let s = String(t).replace(/[^\d.,]/g, '');
  if (s.includes('.') && s.includes(',')) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
  else if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, '');
  else s = s.replace(',', '.');
  return /^(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(s) : NaN;
}
// Hours as 2.5, 2,5 or 2:30.
function lgParseHours(t) {
  const m = /^\s*(\d{1,2}):([0-5]?\d)\s*$/.exec(t);
  const h = m ? +m[1] + m[2] / 60 : lgAmount(String(t).replace(/h(ours?)?/i, ''));
  return h > 0 && h <= 48 ? h : NaN;
}
const lgRead = () => ({date:$('#lg-date').value, stakes:$('#lg-stakes').value.trim().slice(0, 40), hours:lgParseHours($('#lg-hours').value),
                       buyin:lgAmount($('#lg-in').value), cashout:lgAmount($('#lg-out').value)});
function lgSay(text, ok) { const el = $('#lg-msg'); el.textContent = text || ''; el.classList.toggle('ok', !!ok); }

function lgPreview() {
  const f = lgRead(), c = lg.cur, r = f.cashout - f.buyin;
  $('#lg-preview').innerHTML = isNaN(r) ? '' :
    `Result: <b class="${lgTone(r)}">${lgSigned(r, c)}</b>${f.hours > 0 ? ` · <b>${lgRate(r / f.hours, c)}</b> an hour` : ''}`;
}
function lgResetForm() {
  const last = lgSorted()[0];
  lg.editing = null; lg.cur = prefs.cur;
  $('#lg-date').value = dyDay();
  $('#lg-stakes').value = last ? last.stakes : '';
  ['#lg-hours', '#lg-in', '#lg-out'].forEach(id => { $(id).value = ''; });
  document.querySelectorAll('#lg-form [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  $('#lg-head').textContent = 'Log a session';
  $('#lg-save').textContent = 'Save session';
  $('#lg-cancel').hidden = true;
  lgSay('');
}
function lgEdit(id) {
  const x = lgData.sessions.find(s => s.id === id);
  if (!x) return;
  const [H, m] = lgSplit(x.hours);
  lg.editing = id; lg.cur = x.cur;
  $('#lg-date').value = x.date;
  $('#lg-stakes').value = x.stakes;
  $('#lg-hours').value = m % 15 ? `${H}:${String(m).padStart(2, '0')}` : String(H + m / 60);
  $('#lg-in').value = String(x.buyin);
  $('#lg-out').value = String(x.cashout);
  document.querySelectorAll('#lg-form [aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
  $('#lg-head').textContent = `Edit session · ${lgDate(x.date)}`;
  $('#lg-save').textContent = 'Save changes';
  $('#lg-cancel').hidden = false;
  lgSay('');
  renderLog();
  $('#lg-head').scrollIntoView({block:'center', behavior:'smooth'});
  $('#lg-head').focus({preventScroll:true});   // not an input, so a phone doesn't open its keyboard or date picker
}
function lgSubmit(e) {
  e.preventDefault();
  const f = lgRead(), bad = [];
  const check = (id, ok, text) => { $(id).setAttribute('aria-invalid', String(!ok)); if (!ok) bad.push([id, text]); };
  check('#lg-date', /^\d{4}-\d{2}-\d{2}$/.test(f.date), 'Pick the date you played.');
  check('#lg-hours', !isNaN(f.hours), 'Enter how long you played, like 2.5 or 2:30.');
  check('#lg-in', !isNaN(f.buyin), 'Enter what you bought in for, rebuys included.');
  check('#lg-out', !isNaN(f.cashout), 'Enter what you cashed out, or 0 if you lost it.');
  if (bad.length) { lgSay(bad[0][1]); $(bad[0][0]).focus(); return; }
  const entry = {date:f.date, stakes:f.stakes, buyin:f.buyin, cashout:f.cashout, hours:Math.round(f.hours * 1000) / 1000, cur:lg.cur};
  const old = lg.editing && lgData.sessions.find(x => x.id === lg.editing);
  if (old) Object.assign(old, entry);
  else lgData.sessions.push(Object.assign({id:Date.now().toString(36) + '-' + rand(46656).toString(36)}, entry));
  lgSave();
  lgResetForm();
  lgSay(`${old ? 'Session updated' : 'Session saved'}: ${lgSigned(entry.cashout - entry.buyin, entry.cur)}.`, true);
  renderLog();
}

// The starting bankroll and your game's buy-in, shown in the chosen currency.
function lgFillSet() {
  [['#lg-start', lgData.start, 2000], ['#lg-game', lgData.game, 50]].forEach(([id, a, eg]) => {
    $(id).value = a ? String(lgRound(lgConv(a.n, a.cur))) : '';
    $(id).placeholder = 'e.g. ' + fromNok(eg).toLocaleString('en-US');
    $(id).removeAttribute('aria-invalid');
  });
}
function renderLogBank(res) {
  const st = lgData.start, g = lgData.game, rows = [['Results so far', lgData.sessions.length ? `<span class="${lgTone(res)}">${lgSigned(res)}</span>` : '–']];
  let note = 'Add your starting bankroll and your game’s buy-in to count your bankroll in buy-ins.';
  if (st) rows.push(['Bankroll now', lgMoney(lgConv(st.n, st.cur) + res)]);
  if (st && g) {
    const B = lgConv(st.n, st.cur) + res, Y = lgConv(g.n, g.cur), n = Math.max(0, Math.floor(B / Y * 10) / 10), band = bkBand(n);
    rows.push([`In ${lgMoney(Y)} buy-ins`, `${num(n)} buy-ins`], ['The guide says', band.label], ['30 buy-ins (standard)', lgMoney(30 * Y)]);
    note = `${band.why}${n < 40 ? ' Newer players at micro stakes are advised to keep at least 40.' : ''} Move up only with both the money and a win rate proven over 30,000–50,000 hands.`;
  }
  $('#lg-bank').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  $('#lg-bank-note').textContent = note + ' Judge each session by your decisions, not the result, and your results over months, not days.';
}
function renderLogList() {
  const L = lgSorted();
  $('#lg-list-note').hidden = !L.length;
  $('#lg-list').innerHTML = !L.length ? '<p class="lg-empty">No sessions yet. Log your first one when you get up from the table.</p>' :
    `<ul class="lg-list">${L.map(x => { const r = x.cashout - x.buyin; return `
      <li class="lg-item${x.id === lg.editing ? ' editing' : ''}">
        <div class="lg-when">${lgDate(x.date)}${x.stakes ? ` <span>· ${lgEsc(x.stakes)}</span>` : ''}</div>
        <div class="lg-sub">${lgHours(x.hours)} · in ${lgMoney(x.buyin, x.cur)} · out ${lgMoney(x.cashout, x.cur)}</div>
        <div class="lg-res ${lgTone(r)}">${lgSigned(r, x.cur)}<small>${lgRate(r / x.hours, x.cur)} an hour</small></div>
        <div class="lg-acts"><button type="button" class="link-btn" data-lgedit="${lgEsc(x.id)}">Edit</button><button type="button" class="link-btn" data-lgdel="${lgEsc(x.id)}">Delete</button></div>
      </li>`; }).join('')}</ul>`;
  const by = new Map();
  L.forEach(x => {
    const k = x.stakes.toLowerCase(), s = by.get(k) || {name:x.stakes, n:0, h:0, r:0};
    s.n++; s.h += x.hours; s.r += lgConv(x.cashout - x.buyin, x.cur); by.set(k, s);
  });
  $('#lg-by-wrap').hidden = by.size < 2;
  $('#lg-by').innerHTML = [...by.values()].map(s =>
    `<div><dt>${s.name ? lgEsc(s.name) : 'No stakes given'} · ${s.n} ${s.n === 1 ? 'session' : 'sessions'}, ${lgHours(s.h)}</dt><dd class="${lgTone(s.r)}">${lgSigned(s.r)} · ${lgRate(s.r / s.h)} an hour</dd></div>`).join('');
  $('#lg-stakes-list').innerHTML = [...by.values()].filter(s => s.name).map(s => `<option value="${lgEsc(s.name)}"></option>`).join('');
}
function renderLog() {
  const S = lgData.sessions;
  document.querySelectorAll('#lg-form .lg-unit').forEach(el => { el.textContent = `(${lgUnit(lg.cur)})`; });
  document.querySelectorAll('#view-log .lg-set .lg-unit').forEach(el => { el.textContent = `(${lgUnit(prefs.cur)})`; });
  const res = S.reduce((t, x) => t + lgConv(x.cashout - x.buyin, x.cur), 0), hrs = S.reduce((t, x) => t + x.hours, 0);
  $('#lgst-n').textContent = S.length;
  $('#lgst-res').textContent = S.length ? lgSigned(res) : '–';
  $('#lgst-res').className = S.length ? lgTone(res) : '';
  $('#lgst-hr').textContent = hrs ? lgRate(res / hrs) : '–';
  $('#lgst-hr').className = hrs ? lgTone(res / hrs) : '';
  $('#lgst-h').textContent = (Math.round(hrs * 10) / 10).toLocaleString('en-US');
  lgPreview();
  renderLogBank(res);
  renderLogList();
}

$('#lg-form').addEventListener('submit', lgSubmit);
$('#lg-form').addEventListener('input', e => { e.target.removeAttribute('aria-invalid'); lgSay(''); lgPreview(); });
$('#lg-cancel').addEventListener('click', () => { lgResetForm(); renderLog(); });
$('#lg-list').addEventListener('click', e => {
  const ed = e.target.closest('[data-lgedit]');
  if (ed) { lgEdit(ed.dataset.lgedit); return; }
  const del = e.target.closest('[data-lgdel]');
  if (!del) return;
  if (!del.classList.contains('armed')) {   // two taps, since the app has no confirm() dialog
    del.classList.add('armed'); del.textContent = 'Tap again to delete';
    setTimeout(() => { del.classList.remove('armed'); del.textContent = 'Delete'; }, 3000);
    return;
  }
  const id = del.dataset.lgdel;
  lgData.sessions = lgData.sessions.filter(x => x.id !== id);
  lgSave();
  if (lg.editing === id) lgResetForm();
  renderLog();
});
[['#lg-start', 'start'], ['#lg-game', 'game']].forEach(([id, k]) => $(id).addEventListener('input', () => {
  const t = $(id).value.trim(), n = lgAmount(t), ok = !t || (!isNaN(n) && (k === 'start' || n > 0));
  $(id).setAttribute('aria-invalid', String(!ok));
  if (!ok) return;
  lgData[k] = t ? {n, cur:prefs.cur} : null;
  lgSave(); renderLog();
}));

/* ---------- Currency ---------- */
function renderCur() {
  document.querySelectorAll('[data-cur]').forEach(b => b.setAttribute('aria-checked', String(b.dataset.cur === prefs.cur)));
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-cur]');
  if (!b || b.dataset.cur === prefs.cur || !CUR[b.dataset.cur]) return;
  prefs.cur = b.dataset.cur; savePrefs(); renderCur();
  if (pot.q) renderPot();
  if (!lg.editing) lg.cur = prefs.cur;   // a session being edited keeps its own currency
  lgFillSet(); renderLog();
});
