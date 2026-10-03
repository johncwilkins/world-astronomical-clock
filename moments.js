import {calculate} from './astro.js';

const guideParts=new Set(['time','sun','moon','star','zodiac','background','hours','bohemian','earth','cancer','equator','capricorn']);
export function zoneOffset(date,zone){
 const value=new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'longOffset'}).formatToParts(date).find(p=>p.type==='timeZoneName').value;
 const match=value.match(/GMT([+-])(\d+)(?::(\d+))?/);
 return match?(match[1]==='-'?-1:1)*(Number(match[2])+Number(match[3]||0)/60):0;
}
export function localMidnight(year,month,day,zone){
 const wall=Date.UTC(year,month-1,day);let date=new Date(wall);
 for(let i=0;i<3;i++)date=new Date(wall-zoneOffset(date,zone)*3600000);
 return date;
}
export function demoMoment(kind,date,lat,lon,zone){
 const year=Number(new Intl.DateTimeFormat('en-US',{timeZone:zone,year:'numeric'}).format(date));
 if(kind==='summer'||kind==='winter')return {date:localMidnight(year,kind==='summer'?6:12,21,zone),part:'hours',description:kind==='summer'?'A June day: follow the Sun through the long daylight hours.':'A December day: compare the short daylight hours with summer.'};
 if(kind==='equinox'){
  let best=Infinity,when;
  for(let t=Date.UTC(year,2,18);t<=Date.UTC(year,2,23);t+=3600000){const decl=Math.abs(calculate(new Date(t),lat,lon,0).declination);if(decl<best){best=decl;when=new Date(t)}}
  const local=new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'numeric',day:'numeric'}).formatToParts(when),number=type=>Number(local.find(p=>p.type===type).value);
  return {date:localMidnight(number('year'),number('month'),number('day'),zone),part:'equator',description:'An equinox day: watch the Sun travel close to the equator circle.'};
 }
 if(kind==='moon'){
  let best=calculate(date,lat,lon,0).illumination,when=+date,previous=best,rising=false;
  // Stop at the first future peak, even when the interval contains two full Moons.
  for(let t=+date+3600000;t<=+date+35*86400000;t+=3600000){const illumination=calculate(new Date(t),lat,lon,0).illumination;if(illumination>previous)rising=true;if(rising&&illumination<previous&&previous>.99){when=t-3600000;best=previous;break}previous=illumination}
  const coarse=when;for(let t=Math.max(+date,coarse-3600000);t<=coarse+3600000;t+=60000){const illumination=calculate(new Date(t),lat,lon,0).illumination;if(illumination>best){best=illumination;when=t}}
  return {date:new Date(when),part:'moon',description:'Near the next modeled full Moon: follow its own hand as it circles the dial.'};
 }
 throw new Error('Unknown clock demo');
}
export function momentURL(base,{date,lat,lon,zone,location,useDST,part}){
 const url=new URL(base);url.search='';url.hash='';
 for(const [key,value] of Object.entries({at:date.toISOString(),lat,lon,zone,location,dst:useDST?'1':'0'}))url.searchParams.set(key,String(value));
 if(guideParts.has(part))url.searchParams.set('part',part);
 return url.href;
}
export function readMoment(search){
 const p=new URLSearchParams(search);if(!p.has('at'))return null;
 const date=new Date(p.get('at')),lat=Number(p.get('lat')),lon=Number(p.get('lon')),zone=p.get('zone');
 if(!p.get('lat')||!p.get('lon')||!Number.isFinite(+date)||date.getUTCFullYear()<1||date.getUTCFullYear()>9999||!Number.isFinite(lat)||lat<1||lat>66||!Number.isFinite(lon)||Math.abs(lon)>180||!zone||zone.length>100)return null;
 try{zoneOffset(date,zone)}catch{return null}
 return {date,lat,lon,zone,location:p.get('location')||'custom',useDST:p.get('dst')!=='0',part:guideParts.has(p.get('part'))?p.get('part'):null};
}
