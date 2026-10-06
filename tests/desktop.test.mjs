import test from 'node:test';
import assert from 'node:assert/strict';
import {desktopSettings, desktopURL} from '../desktop.js';

test('invalid URL layout settings cannot create oversized or unknown layouts', () => {
  for (const size of ['NaN', -1, 0, 10000]) {
    assert.deepEqual(desktopSettings({size, position: 'invalid', background: 'invalid'}),
      {size: 80, position: 'center', background: 'midnight', readout: false});
  }
  assert.equal(desktopSettings({size: '30', readout: '1'}).size, 30);
  assert.equal(desktopSettings({readout: '0'}).readout, false);
});

test('wallpaper URLs pin layout and place without freezing time or opening Learn mode', () => {
  const place = {location: 'custom', lat: 39.9421, lon: -74.1499, zone: 'America/New_York', dst: '0'};
  const url = new URL(desktopURL('https://worldastronomicalclock.com/?at=2026-10-03&part=moon#old',
    {size: 55, position: 'right', background: 'black', readout: true}, place));
  assert.equal(url.origin, 'https://worldastronomicalclock.com');
  assert.equal(url.searchParams.has('at'), false);
  assert.equal(url.searchParams.has('part'), false);
  assert.equal(url.hash, '');
  for (const [key, value] of Object.entries({...place, desktop: '1', size: 55, position: 'right', background: 'black', readout: '1'})) {
    assert.equal(url.searchParams.get(key), String(value));
  }
});
