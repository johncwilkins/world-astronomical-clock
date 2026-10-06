import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseDailyCity,localDay,dailyCountries} from '../daily-city.js';
import {locations} from '../locations.js';
test('refresh keeps the same country and city until the local date changes',()=>{
 const first=chooseDailyCity(null,()=>0,'2026-10-06');
 assert.deepEqual(chooseDailyCity(first,()=>.99,'2026-10-06'),first);
 const next=chooseDailyCity(first,()=>0,'2026-10-07');
 assert.notEqual(next.country,first.country);
 assert.equal(next.day,'2026-10-07');
 assert.ok(locations[next.city]);
});
test('all country choices lead to an existing dropdown location',()=>{
 for(let i=0;i<dailyCountries.length;i++){
  const choice=chooseDailyCity(null,()=> (i+.01)/dailyCountries.length,'2026-10-06');
  assert.equal(choice.country,dailyCountries[i]);assert.ok(locations[choice.city]);
 }
});
test('invalid saved selection is replaced and dates use the local calendar',()=>{
 const next=chooseDailyCity({day:'2026-10-06',country:'fr',city:'missing'},()=>0,'2026-10-06');
 assert.ok(locations[next.city]);assert.equal(localDay(new Date(2026,9,7,0,0)),'2026-10-07');
});
