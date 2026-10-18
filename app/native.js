// Extras that only the iPhone app has. build-web.js adds this file to the
// trainer page when it builds the app, so the website never loads it.
//   - A practice reminder at 7pm on each day you haven't opened the app yet.
//   - A haptic tap when you answer: a "success" buzz when the answer was right.
(function () {
  const cap = window.Capacitor;
  if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return;

  const Haptics = cap.registerPlugin('Haptics');
  const LocalNotifications = cap.registerPlugin('LocalNotifications');

  // --- Practice reminders ---------------------------------------------------
  // Reminders are one-off notifications for the next week, rescheduled every
  // time the app comes to the front, starting tomorrow. So a day you practise
  // never gets one, and the reminders stop on their own if you stop using it.
  const REMIND_HOUR = 19;
  const REMIND_DAYS = 7;
  const ids = Array.from({ length: REMIND_DAYS }, (_, i) => i + 1);
  const messages = [
    'A few hands a day keeps your reads sharp. Your drills are ready.',
    'Time for a quick session: seats, pot odds or a full hand.',
    'Ten minutes of drills tonight beats an hour next week.',
  ];

  async function scheduleReminders() {
    try {
      let perm = await LocalNotifications.checkPermissions();
      if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
        perm = await LocalNotifications.requestPermissions();
      }
      await LocalNotifications.cancel({ notifications: ids.map(id => ({ id })) });
      if (perm.display !== 'granted') return;
      const now = new Date();
      await LocalNotifications.schedule({
        notifications: ids.map((id, i) => {
          const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + i, REMIND_HOUR, 0, 0);
          return { id, title: 'PokerTrainer', body: messages[at.getDate() % messages.length], schedule: { at } };
        }),
      });
    } catch (e) {
      console.warn('Could not schedule reminders', e);
    }
  }

  scheduleReminders();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleReminders();
  });

  // --- Haptics on answers ---------------------------------------------------
  // Answer buttons carry a <kbd> shortcut (the same convention the browser test
  // relies on). Each drill shows its record as "right/total" in an element
  // whose id ends in "st-correct", so a higher "right" count after the click
  // means the answer was right.
  const rightCount = panel => {
    const el = panel && panel.querySelector('[id$="st-correct"]');
    const m = el && /^(\d+)\//.exec(el.textContent.trim());
    return m ? Number(m[1]) : null;
  };

  document.addEventListener('click', e => {
    const btn = e.target.closest && e.target.closest('button');
    if (!btn || btn.disabled || !btn.querySelector('kbd') || /\bN\b/.test(btn.querySelector('kbd').textContent)) return;
    const panel = btn.closest('[role="tabpanel"]');
    const before = rightCount(panel);
    setTimeout(() => {
      const after = rightCount(panel);
      const answered = btn.disabled;
      let buzz;
      if (answered && before !== null && after !== null) {
        buzz = after > before ? Haptics.notification({ type: 'SUCCESS' }) : Haptics.notification({ type: 'WARNING' });
      } else {
        buzz = Haptics.impact({ style: 'LIGHT' });
      }
      buzz.catch(() => {});
    }, 0);
  }, true);
})();
