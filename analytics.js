// Count page views and named actions without sending clock coordinates or dates.
const endpoint = 'https://worldastronomicalclock.goatcounter.com/count';
// Wallpaper reloads should not inflate visitor statistics.
const enabled = ['worldastronomicalclock.com', 'www.worldastronomicalclock.com'].includes(location.hostname) && new URLSearchParams(location.search).get('desktop') !== '1';
const pending = [];
export function countEvent(path, title) {
  if (!enabled) return;
  const event = {path, title, event: true, no_session: true};
  try {
    if (typeof window.goatcounter?.count === 'function') window.goatcounter.count(event);
    else if (pending.length < 100) pending.push(event);
  } catch {} // Statistics must never interrupt the clock.
}
if (enabled) {
  window.goatcounter = {path: location.pathname};
  const script = document.createElement('script');
  script.src = 'https://gc.zgo.at/count.js';
  script.async = true;
  script.dataset.goatcounter = endpoint;
  script.addEventListener('load', () => {
    for (const event of pending.splice(0)) {
      try { window.goatcounter.count(event); } catch {}
    }
  });
  document.head.append(script);
  const clicks = {
    explainToggle: ['learn-dial', 'Learn the dial'],
    learnView: ['learn-dial', 'Learn the dial'],
    controlsView: ['controls', 'Controls'],
    reset: ['front-view', 'Front view'],
    live: ['live-time', 'Live time'],
    explore: ['explore-time', 'Explore time'],
    geo: ['use-my-location', 'Use my location'],
    back: ['previous-day', 'Previous day'],
    backHour: ['previous-hour', 'Previous hour'],
    forwardHour: ['next-hour', 'Next hour'],
    forward: ['next-day', 'Next day'],
    
    dismissHint: ['dismiss-hint', 'Dismiss first visit hint']
  };
  document.addEventListener('click', event => {
    if (!event.isTrusted) return;
    const target = event.target.closest('button, a');
    if (!target) return;
    const counter = clicks[target.id];
    if (counter) countEvent(...counter);
    if (['play', 'quickPause'].includes(target.id)) {
      const action = target.textContent.trim() === 'Pause' ? 'pause' : 'play';
      countEvent('simulation-' + action, 'Simulation ' + action);
    }
    if (target.matches('a[href="./about.html"]')) countEvent('about', 'About page link');
    if (target.matches('a[href="./index.html"]')) countEvent('return-to-clock', 'Return to clock');
    if (target.matches('a[href^="mailto:"]')) countEvent('contact-email', 'Contact email link');
  }, true);
  document.addEventListener('change', event => {
    if (!event.isTrusted) return;
    const target = event.target;
    if (target.id === 'location') countEvent('location-change', 'Change location');
    if (target.id === 'guideChoice') countEvent('learn-part-' + target.value, 'Learn dial: ' + target.options[target.selectedIndex].text);
    if (target.id === 'speed') countEvent('simulation-speed', 'Change simulation speed');
    if (target.id === 'datetime') countEvent('simulation-date', 'Change simulation date');
    if (target.id === 'dst') countEvent('daylight-saving', 'Change daylight saving setting');
  });
}
