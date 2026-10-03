import {calculate} from './astro.js';

const rad=Math.PI/180,wrap=(n,m)=>((n%m)+m)%m;
const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
function duration(hours){
 const minutes=Math.max(0,Math.round(hours*60));
 if(minutes===0)return 'less than a minute';
 const h=Math.floor(minutes/60),m=minutes%60;
 return [h?`${h} hour${h===1?'':'s'}`:'',m?`${m} minute${m===1?'':'s'}`:''].filter(Boolean).join(' ');
}
function dialTime(hours){
 const minutes=wrap(Math.round(hours*60),1440),h=Math.floor(minutes/60);
 return `${h%12||12}:${String(minutes%60).padStart(2,'0')} ${h<12?'a.m.':'p.m.'}`;
}
function sky(alt){return alt>=0?'daylight':alt>=-18?'twilight':'night';}
function altitude(lat,declination,hourAngle){return Math.asin(Math.max(-1,Math.min(1,Math.sin(lat*rad)*Math.sin(declination*rad)+Math.cos(lat*rad)*Math.cos(declination*rad)*Math.cos(hourAngle))))/rad;}

export function interpretClock({a,date,lat,lon,zone,place,standardOffset,civilOffset,useDST,pragueDial=false}){
 // Read the astronomical angles used by the dial; civil time is carried
 // by the corrected Roman scale, independently of the Sun's hour angle.
 const hourAngle=wrap(a.sunAngle+Math.PI,2*Math.PI)-Math.PI;
 const solarHours=wrap(a.sunAngle/rad/15+12,24);
 const standardHours=a.standardHours;
 const dst=civilOffset-standardOffset,appliedDST=pragueDial?0:useDST?dst:0;
 const sunAlt=altitude(lat,a.declination,hourAngle),state=sky(sunAlt);
 const movement=Math.abs(Math.sin(hourAngle))<1e-5?'near its daily turning point':hourAngle<0?'rising':'setting';
 const moonAlt=altitude(lat,a.moonDeclination,a.moonAngle);
 const elongation=wrap(a.phase-180,360);
 const phase=elongation<10||elongation>=350?'near new Moon':elongation<80?'waxing crescent':elongation<100?'near first quarter':elongation<170?'waxing gibbous':elongation<190?'near full Moon':elongation<260?'waning gibbous':elongation<280?'near last quarter':'waning crescent';
 const longitude=wrap(a.sunLongitude,360),sign=signs[Math.floor(longitude/30)];
 const H=a.daylight/2,sunrise=12-H,sunset=12+H;
 const fmt=d=>new Intl.DateTimeFormat('en-US',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(d);
 // Anchor each modeled day to standard local midnight; calculate each day's
 // sunrise and sunset separately, including after-midnight and seasonal cases.
 const day=86400000,base=Math.floor((+date+standardOffset*3600000)/day)*day-standardOffset*3600000;
 const events=[];
 for(let delta=-2;delta<=2;delta++){
  const midnight=base+delta*day;
  for(const [kind,direction] of [['sunrise',-1],['sunset',1]]){
   let event=midnight+12*3600000,available=true;
   for(let i=0;i<4;i++){
    const daily=calculate(new Date(event),lat,lon,standardOffset);
    if(daily.daylight<=0||daily.daylight>=24){available=false;break}
    event=midnight+(12+direction*daily.daylight/2+daily.timeDialRotation/rad/15)*3600000;
   }
   if(available)events.push({kind,date:new Date(event)});
  }
 }
 const sunsets=events.filter(e=>e.kind==='sunset').sort((x,y)=>x.date-y.date);
 const last=sunsets.filter(e=>e.date<=date).at(-1),next=sunsets.find(e=>e.date>date);
 const nextRise=events.filter(e=>e.kind==='sunrise'&&e.date>date).sort((x,y)=>x.date-y.date)[0];
 const until=next?duration((next.date-date)/3600000):null;
 const since=last?duration((date-last.date)/3600000):null;
 const eventSummary=state==='daylight'&&next?`Sunset is in ${until}, at ${fmt(next.date)}.`:nextRise?`The next sunrise is in ${duration((nextRise.date-date)/3600000)}, at ${fmt(nextRise.date)}.`:'The dial has no sunrise or sunset at this latitude on this date.';
 const elapsed=(solarHours-sunrise)*12/a.daylight;
 const unequal=a.daylight>0&&a.daylight<24&&solarHours>=sunrise&&solarHours<sunset
  ?`The Sun is in daylight hour ${Math.min(12,Math.floor(elapsed)+1)} of 12, ${Math.round((elapsed%1)*100)}% through that hour. Each unequal hour lasts ${duration(a.daylight/12)} today. ${eventSummary}`
  :`No daylight hour is currently being counted: the Sun is below the dial’s horizon. Today’s twelve daylight hours each last ${duration(a.daylight/12)}. ${eventSummary}`;
 const reading=wrap(solarHours+12-H,24);
 const readingText=reading<.008?'24 / the start of a new day':reading.toFixed(2);
 const bohemian=last&&next
  ?`The gold hand reads approximately ${readingText} on the Bohemian scale. We are ${since} past the previous modeled sunset and ${until} from the next, at ${fmt(next.date)}. The scale reaches 24 and begins a new day at sunset.`
  :'The Bohemian sunset reading is unavailable because this modeled day has no sunset.';
 const siderealSeconds=wrap(Math.round(wrap(a.zodiacAngle/rad-270,360)/15*3600),86400);
 const sidereal=[Math.floor(siderealSeconds/3600),Math.floor(siderealSeconds/60)%60,siderealSeconds%60].map(n=>String(n).padStart(2,'0')).join(':');
 const relative=label=>`The Sun is currently at ${Math.abs(a.declination).toFixed(1)}° ${a.declination>=0?'north':'south'} declination. ${label}`;
 return {
  cancer:relative(`It is ${(23.44-a.declination).toFixed(1)}° of declination south of the Cancer limit. ${a.declination>22.5?'It is very close to the outer circle, near its northern seasonal extreme.':'Watch the Sun move outward toward this circle as its northern declination increases.'}`),
  equator:relative(Math.abs(a.declination)<1?'It is close to the equator circle, near an equinox.':`It sits ${a.declination>0?'outside':'inside'} the equator circle, on the ${a.declination>0?'Cancer':'Capricorn'} side. The gap measures seasonal declination, not the Sun’s distance from Earth.`),
  capricorn:relative(`It is ${(a.declination+23.44).toFixed(1)}° of declination north of the Capricorn limit. ${a.declination<-22.5?'It is very close to the inner circle, near its southern seasonal extreme.':'Watch the Sun move inward toward this circle as its southern declination increases.'}`),
  time:`The gold hand reads ${dialTime(standardHours+appliedDST)} on the Roman scale. Local civil time in ${place} is ${fmt(date)}. ${pragueDial?'Prague’s XII marks stay fixed at noon and midnight. Its astronomical dial shows CET throughout the year, so it is one hour behind local civil time during daylight saving.':appliedDST?`The Roman scale includes a ${duration(appliedDST)} daylight-saving shift.`:dst&&!useDST?'The dial shows standard time; local civil time includes daylight saving.':'No daylight-saving shift is applied for this date.'}`,
  sun:`The Sun is ${Math.abs(sunAlt).toFixed(1)}° ${sunAlt>=0?'above':'below'} the dial’s horizon and ${movement}. It lies in the ${state==='daylight'?'blue daylight':state==='twilight'?'red twilight':'black night'} region. Its declination is ${Math.abs(a.declination).toFixed(1)}° ${a.declination>=0?'north':'south'} of the equator, putting it ${Math.abs(a.declination)<1?'close to the equator circle':a.declination>0?'between the equator and Cancer circles':'between the equator and Capricorn circles'}. ${eventSummary}`,
  moon:`The Moon is ${phase}, ${Math.round(a.illumination*100)}% illuminated. Its position is ${Math.abs(moonAlt).toFixed(1)}° ${moonAlt>=0?'above':'below'} the modeled horizon. Its distance from the center places it at ${Math.abs(a.moonDeclination).toFixed(1)}° ${a.moonDeclination>=0?'north':'south'} declination. This describes its modeled position; daylight can still make it difficult to see.`,
  star:`For ${place}, the model’s local sidereal time is ${sidereal} (hours:minutes:seconds). Celestial objects with right ascension near ${sidereal.slice(0,5)} are crossing the local meridian. The star stays at the Aries–Pisces boundary as the ring turns. Use Explore to watch its slightly faster daily motion; at the same ordinary time tomorrow, sidereal time will be about four minutes later. This value follows the selected longitude and instant, without a daylight-saving adjustment.`,
  zodiac:`The Sun currently lies in the ${sign} sector, ${(longitude%30).toFixed(1)}° into its 30° section. Its ecliptic longitude is ${longitude.toFixed(1)}°. This is the seasonal zodiac shown by the ring, rather than the boundaries of modern constellations. The ring’s current rotation places that sector beneath the Sun.`,
  background:`At the Sun’s current position, the dial shows ${state}: ${state==='daylight'?'blue, above the horizon':state==='twilight'?'red, between the horizon and 18° below it':'black, more than 18° below the horizon'}. The modeled Sun is ${Math.abs(sunAlt).toFixed(1)}° ${sunAlt>=0?'above':'below'} the horizon at ${place}. ${eventSummary}`,
  hours:unequal,
  bohemian,
  earth:`The atlas is centered on ${place}, at ${Math.abs(lat).toFixed(2)}° ${lat>=0?'N':'S'}, ${Math.abs(lon).toFixed(2)}° ${lon>=0?'E':'W'}. The center dot marks this spot. At the selected time it is ${state} here according to the dial. ${eventSummary}`
 };
}
