'use strict';

/* =====================================================================
   MOVE YOUR PROGRESS
   Progress lives in this device's storage only, so it moves by hand. A
   save holds every key under STORE, either as a file or as a text code
   (gzip and base64 when the browser can) that survives being pasted
   through Notes or Messages. Loading one replaces this device's progress
   after asking, then reloads so every drill reads it fresh.
   ===================================================================== */
const SV_APP = 'PokerTrainer';
const SV_DONE = STORE + ':loaded';   // in sessionStorage: says "loaded" after the reload
const svKeys = () => {
  const out = [];
  try {
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith(STORE + ':')) out.push(k); }
  } catch (e) { /* no storage */ }
  return out;
};
function svCollect() {
  const data = {};
  svKeys().forEach(k => { const v = loadJSON(k); if (Object.keys(v).length) data[k.slice(STORE.length + 1)] = v; });
  return {app:SV_APP, v:1, saved:new Date().toISOString(), data};
}
const svB64 = bytes => {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const svUnB64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const svPipe = (bytes, Stream) =>
  new Response(new Blob([bytes]).stream().pipeThrough(new Stream('gzip'))).arrayBuffer().then(b => new Uint8Array(b));
async function svEncode(save) {
  const bytes = new TextEncoder().encode(JSON.stringify(save));
  if (window.CompressionStream) {
    try { return 'PT1z.' + svB64(await svPipe(bytes, CompressionStream)); } catch (e) { /* send it uncompressed */ }
  }
  return 'PT1.' + svB64(bytes);
}
// Reads a save from a code (text around it is fine) or from a save file. Returns null if it isn't one.
async function svDecode(text) {
  try {
    let json = String(text).trim();
    if (!json.startsWith('{')) {
      const m = /PT1(z?)\.([A-Za-z0-9_-]+)/.exec(json);
      if (!m) return null;
      const bytes = svUnB64(m[2]);
      json = new TextDecoder().decode(m[1] ? await svPipe(bytes, DecompressionStream) : bytes);
    }
    const save = JSON.parse(json), data = save && save.data;
    if (save.app !== SV_APP || !data || typeof data !== 'object') return null;
    const ok = Object.keys(data).every(k => /^[a-z][a-z-]{0,31}$/.test(k) && data[k] && typeof data[k] === 'object');
    return ok ? save : null;
  } catch (e) { return null; }
}
const SV_RECS = ['stats', 'pot', 'board', 'opp', 'hand'];
function svSummary(data) {
  const n = SV_RECS.reduce((sum, k) => sum + (data[k] && data[k].total > 0 ? Math.floor(data[k].total) : 0), 0);
  const d = data.daily || {}, today = dyDay();
  const streak = d.last === today || d.last === dyBefore(today) ? Math.floor(d.streak) || 0 : 0;
  const logged = data.log && Array.isArray(data.log.sessions) ? data.log.sessions.length : 0;
  return `${n} ${n === 1 ? 'answer' : 'answers'}${streak ? `, a ${streak}-day streak` : ''}${logged ? `, ${logged} logged ${logged === 1 ? 'session' : 'sessions'}` : ''}`;
}
const svNative = () => !!(window.Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
function svSay(el, text, bad) { el.innerHTML = text ? `<p${bad ? ' class="sv-bad"' : ''}>${text}</p>` : ''; }

$('#sv-copy').addEventListener('click', async () => {
  const box = $('#sv-code'), out = $('#sv-out');
  const code = svEncode(svCollect());
  let copied = false;
  try {   // Safari wants the clipboard call inside the tap, with the text still on its way
    if (window.ClipboardItem && navigator.clipboard.write) {
      await navigator.clipboard.write([new ClipboardItem({'text/plain':code.then(c => new Blob([c], {type:'text/plain'}))})]);
    } else await navigator.clipboard.writeText(await code);
    copied = true;
  } catch (e) { /* show it to copy by hand */ }
  box.value = await code;
  box.hidden = false;
  box.select();
  if (!copied) { try { copied = document.execCommand('copy'); } catch (e) { /* by hand */ } }
  svSay(out, copied
    ? '<b>Copied.</b> Send it to yourself, in Notes or Messages for example, and paste it under Load a save on your other device.'
    : 'Your code is above. Select all of it and copy it, then paste it under Load a save on your other device.');
});

$('#sv-file').addEventListener('click', async () => {
  const out = $('#sv-out'), name = `pokertrainer-save-${dyDay()}.json`;
  const blob = new Blob([JSON.stringify(svCollect(), null, 1)], {type:'application/json'});
  if (svNative()) {   // the app can't download, so the file goes to the share sheet (Save to Files, AirDrop)
    const file = new File([blob], name, {type:'application/json'});
    try {
      await navigator.share({files:[file]});
      svSay(out, `<b>Saved ${name}.</b> Load it on your other device with Load file.`);
    } catch (e) {
      if (e && e.name !== 'AbortError') svSay(out, 'This app can’t save the file. Use Copy code instead.', true);
    }
    return;
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  svSay(out, `<b>Downloading ${name}.</b> Load it on your other device with Load file.`);
});

let svPending = null;
async function svRead(text) {
  const ask = $('#sv-ask');
  svPending = await svDecode(text);
  if (!svPending) {
    svSay(ask, 'That isn’t a PokerTrainer save. Check that you copied the whole code or picked the right file.', true);
    return;
  }
  const when = new Date(svPending.saved);
  const from = isNaN(when) ? '' : ` from ${when.toLocaleString(undefined, {day:'numeric', month:'short', hour:'2-digit', minute:'2-digit'})}`;
  ask.innerHTML = `<div class="sv-ask">
    <p><b>Save${from}:</b> ${svSummary(svPending.data)}.</p>
    <p>Loading it replaces the progress on this device (${svSummary(svCollect().data)}), saved misses, session log and settings included.</p>
    <div class="sv-row"><button type="button" class="sv-btn go" id="sv-yes">Replace my progress</button><button type="button" class="sv-btn" id="sv-no">Cancel</button></div>
  </div>`;
}
function svApply(save) {
  const old = svKeys().map(k => [k, localStorage.getItem(k)]);
  try {
    old.forEach(([k]) => localStorage.removeItem(k));
    Object.keys(save.data).forEach(k => localStorage.setItem(STORE + ':' + k, JSON.stringify(save.data[k])));
  } catch (e) {   // put back what was here
    try { svKeys().forEach(k => localStorage.removeItem(k)); old.forEach(([k, v]) => localStorage.setItem(k, v)); } catch (e2) { /* nothing more to do */ }
    svSay($('#sv-ask'), 'This device wouldn’t store the save, so nothing changed. Private browsing can block it.', true);
    return;
  }
  try { sessionStorage.setItem(SV_DONE, '1'); } catch (e) { /* no note after the reload */ }
  location.reload();
}
$('#sv-load').addEventListener('click', () => svRead($('#sv-in').value));
$('#sv-pick').addEventListener('click', () => $('#sv-input').click());
$('#sv-input').addEventListener('change', async e => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (f) svRead(f.size < 2e6 ? await f.text() : '');
});
$('#sv-ask').addEventListener('click', e => {
  if (e.target.closest('#sv-yes') && svPending) svApply(svPending);
  else if (e.target.closest('#sv-no')) { svPending = null; svSay($('#sv-ask'), ''); }
});
try {
  if (sessionStorage.getItem(SV_DONE)) {
    sessionStorage.removeItem(SV_DONE);
    $('#sv').open = true;
    svSay($('#sv-ask'), `<b>Your save is loaded:</b> ${svSummary(svCollect().data)}.`);
  }
} catch (e) { /* no storage */ }
