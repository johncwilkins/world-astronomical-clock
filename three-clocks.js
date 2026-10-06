const panels = [...document.querySelectorAll('.clock-panel')].map(panel => ({
  panel,
  time: new Intl.DateTimeFormat('en-GB', {timeZone: panel.dataset.zone, hour: '2-digit', minute: '2-digit', second: '2-digit'}),
  date: new Intl.DateTimeFormat('en-US', {timeZone: panel.dataset.zone, weekday: 'long', month: 'long', day: 'numeric'})
}));
function update() {
  const now = new Date();
  for (const {panel, time, date} of panels) {
    const output = panel.querySelector('time');
    output.dateTime = now.toISOString(); output.textContent = time.format(now);
    panel.querySelector('.local-date').textContent = date.format(now);
  }
}
update();
setInterval(update, 1000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
