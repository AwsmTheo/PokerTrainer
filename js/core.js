'use strict';
const $ = s => document.querySelector(s);
const RANKS = 'AKQJT98765432';
const ri = r => RANKS.indexOf(r);
const RNAME = {A:'ace',K:'king',Q:'queen',J:'jack',T:'ten','9':'nine','8':'eight','7':'seven','6':'six','5':'five','4':'four','3':'three','2':'deuce'};
const RPLURAL = {A:'aces',K:'kings',Q:'queens',J:'jacks',T:'tens','9':'nines','8':'eights','7':'sevens','6':'sixes','5':'fives','4':'fours','3':'threes','2':'deuces'};
const SUITS = [
  {k:'s', sym:'♠', red:false, name:'spades'},
  {k:'h', sym:'♥', red:true,  name:'hearts'},
  {k:'d', sym:'♦', red:true,  name:'diamonds'},
  {k:'c', sym:'♣', red:false, name:'clubs'}
];
const showRank = r => r === 'T' ? '10' : r;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmtBB = n => (n % 1 ? n.toFixed(1) : String(n));

function rand(n) {
  if (window.crypto && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; }
  return Math.floor(Math.random() * n);
}
const pick = arr => arr[rand(arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Storage is a per-viewer convenience; the drills work without it.
const STORE = 'preflop-seat-drill:v1';
function loadJSON(key) { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; } }
function saveJSON(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* ignore */ } }
const prefs = Object.assign({fmt:'six', deal:'any', tab:'seats', potCat:'mixed', cur:'NOK'}, loadJSON(STORE + ':prefs'));
const savePrefs = () => saveJSON(STORE + ':prefs', prefs);

// Money is shown in the viewer's currency. Drill amounts are example sizes, so only the sign changes;
// amounts the guide gives in NOK are converted at a rough general rate.
const CUR = {
  NOK:{nok:1,    show:t => t + ' kr'},
  USD:{nok:10,   show:t => '$' + t},
  EUR:{nok:11.5, show:t => '€' + t}
};
if (!CUR[prefs.cur]) prefs.cur = 'NOK';
const money = (n, c = prefs.cur) => CUR[c].show(n.toLocaleString('en-US', {maximumFractionDigits:2}));
const nice = x => x < 10 ? Math.max(0.5, Math.round(x * 2) / 2) : x < 100 ? Math.round(x) : x < 1000 ? Math.round(x / 5) * 5 : Math.round(x / 50) * 50;
const fromNok = (n, c = prefs.cur) => c === 'NOK' ? n : nice(n / CUR[c].nok);
// Drill text writes amounts as $40; this shows them in the chosen currency.
const cash = t => String(t).replace(/\$(\d[\d,]*(?:\.\d+)?)/g, (m, n) => money(+n.replace(/,/g, '')));

// Two-click reset, since the viewer has no confirm() dialog.
function armReset(btn, onReset) {
  let timer = null;
  btn.addEventListener('click', () => {
    if (!timer) {
      btn.textContent = 'Click again to reset'; btn.classList.add('armed');
      timer = setTimeout(() => { timer = null; btn.textContent = 'Reset record'; btn.classList.remove('armed'); }, 3000);
      return;
    }
    clearTimeout(timer); timer = null;
    btn.classList.remove('armed'); btn.textContent = 'Record cleared';
    setTimeout(() => { if (!timer) btn.textContent = 'Reset record'; }, 1500);
    onReset();
  });
}
