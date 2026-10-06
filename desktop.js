const positions = new Set(['left', 'center', 'right']);
const backgrounds = new Set(['midnight', 'black', 'slate']);
const defaults = {size: 80, position: 'center', background: 'midnight', readout: false};

export function desktopSettings(value = {}) {
  const size = Number(value.size);
  return {
    size: Number.isFinite(size) && size >= 30 && size <= 95 ? size : defaults.size,
    position: positions.has(value.position) ? value.position : defaults.position,
    background: backgrounds.has(value.background) ? value.background : defaults.background,
    readout: value.readout === true || value.readout === '1'
  };
}

export function desktopURL(base, settings, place) {
  const url = new URL(base);
  url.search = ''; url.hash = '';
  const config = desktopSettings(settings);
  for (const [key, value] of Object.entries({desktop: '1', size: config.size, position: config.position, background: config.background, readout: config.readout ? '1' : '0', ...place})) {
    url.searchParams.set(key, String(value));
  }
  return url.href;
}

export function initDesktop({getPlace, applyPlace, onMode, onEvent}) {
  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem('astronomical-clock.desktop')) || {}; } catch {}
  const overrides = {};
  for (const key of Object.keys(defaults)) if (params.has(key)) overrides[key] = params.get(key);
  let config = desktopSettings({...saved, ...overrides});
  let active = false, timer, returnFocus;
  const panel = $('desktopSettings'), toolbar = $('desktopToolbar');
  const city = $('desktopLocation');
  city.replaceChildren(...[...$('location').options].map(option => option.cloneNode(true)));

  function wake() {
    if (!active) return;
    document.body.classList.add('desktop-awake');
    clearTimeout(timer);
    timer = setTimeout(() => document.body.classList.remove('desktop-awake'), 2500);
  }
  function draw() {
    document.body.style.setProperty('--desktop-size', `${config.size}vmin`);
    document.body.dataset.desktopPosition = config.position;
    document.body.dataset.desktopBackground = config.background;
    $('desktopReadout').hidden = !active || !config.readout;
    $('desktopSizeValue').textContent = `${config.size}%`;
    if (!location.pathname.endsWith('/clock-pane.html')) {
      try { localStorage.setItem('astronomical-clock.desktop', JSON.stringify(config)); } catch {}
    }
  }
  function fill() {
    $('desktopSize').value = config.size;
    $('desktopPosition').value = config.position;
    $('desktopBackground').value = config.background;
    $('desktopShowTime').checked = config.readout;
    city.value = getPlace().location;
    draw();
  }
  function link() {
    return desktopURL(location.href, config, getPlace());
  }
  function setActive(value) {
    active = value;
    document.body.classList.toggle('desktop-mode', active);
    toolbar.hidden = !active;
    $('desktopEnter').textContent = active ? 'Done' : 'Use desktop mode';
    onMode(active);
    draw(); wake();
  }
  function close(restoreFocus = true) {
    panel.hidden = true;
    if (active) wake();
    if (active && restoreFocus) $('desktopConfigure').focus();
    else if (active) document.activeElement?.blur();
    else returnFocus?.focus();
  }
  function open(event) {
    returnFocus = event.currentTarget;
    fill(); panel.hidden = false;
    $('desktopLinkFallback').hidden = true;
    $('desktopStatus').textContent = '';
    $('desktopSize').focus();
  }
  $('desktopMode').onclick = open;
  $('desktopConfigure').onclick = open;
  $('desktopClose').onclick = () => close();
  $('desktopExit').onclick = () => {
    setActive(false); panel.hidden = true;
    const url = new URL(location.href);
    // Desktop links always open live. Remove their parameters when returning to the site.
    url.search = ''; url.hash = '';
    history.replaceState(null, '', url);
    $('desktopMode').focus();
  };
  $('desktopEnter').onclick = () => {
    applyPlace({location: city.value});
    setActive(true); close(false);
    history.replaceState(null, '', link());
    onEvent('desktop-mode', 'Use desktop mode');
  };
  function changed() {
    config = desktopSettings({size: $('desktopSize').value, position: $('desktopPosition').value, background: $('desktopBackground').value, readout: $('desktopShowTime').checked});
    applyPlace({location: city.value}); draw();
    if (active) history.replaceState(null, '', link());
  }
  for (const id of ['desktopSize', 'desktopPosition', 'desktopBackground', 'desktopShowTime', 'desktopLocation']) $(id).addEventListener('input', changed);
  $('desktopCopy').onclick = async () => {
    changed();
    const url = link(); $('desktopLink').value = url;
    try { await navigator.clipboard.writeText(url); $('desktopStatus').textContent = 'Link copied. Paste it into Lively’s Add wallpaper → URL field.'; }
    catch { $('desktopLinkFallback').hidden = false; $('desktopLink').focus(); $('desktopLink').select(); $('desktopStatus').textContent = 'Copy the link below, then paste it into Lively.'; }
    onEvent('desktop-link', 'Copy desktop wallpaper link');
  };
  document.addEventListener('pointermove', wake, {passive: true});
  document.addEventListener('keydown', event => {
    wake();
    if (event.key === 'Escape' && !panel.hidden) { event.preventDefault(); close(); }
    if (event.key === 'Tab' && !panel.hidden) {
      const items = [...panel.querySelectorAll('button, input, select, a[href]')].filter(item => !item.closest('[hidden]'));
      const first = items[0], last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  fill();
  if (params.get('desktop') === '1') {
    const place = Object.fromEntries(['location', 'lat', 'lon', 'zone', 'dst'].filter(key => params.has(key)).map(key => [key, params.get(key)]));
    applyPlace(place); setActive(true);
  }
  return {
    get active() { return active; },
    updateReadout(time, date, place) {
      if (!active || !config.readout) return;
      $('desktopTime').textContent = time;
      $('desktopDate').textContent = `${place} · ${date}`;
    }
  };
}
