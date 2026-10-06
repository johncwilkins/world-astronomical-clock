import {locations} from './locations.js';
const countriesByZone = {
 'America/New_York':'us','America/Sitka':'us','Africa/Cairo':'eg','Atlantic/Reykjavik':'is',
 'Europe/Helsinki':'fi','Europe/Oslo':'no','Europe/London':'gb','America/Mexico_City':'mx',
 'Asia/Karachi':'pk','America/Chicago':'us','America/Denver':'us','America/Vancouver':'ca',
 'Pacific/Honolulu':'us','Europe/Rome':'it','Asia/Kolkata':'in','Asia/Seoul':'kr',
 'Asia/Tokyo':'jp','Europe/Prague':'cz','America/Los_Angeles':'us','Europe/Paris':'fr','America/St_Thomas':'us'
};
export const dailyCountries = [...new Set(Object.values(countriesByZone))];
export function localDay(date = new Date()) {
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function chooseDailyCity(previous = null, random = Math.random, day = localDay()) {
 const valid = previous && locations[previous.city] && countriesByZone[locations[previous.city][3]] === previous.country;
 if (valid && previous.day === day) return previous;
 const countries = dailyCountries.filter(code => !valid || code !== previous.country);
 const country = countries[Math.floor(random()*countries.length)];
 const cities = Object.keys(locations).filter(id => countriesByZone[locations[id][3]] === country);
 const city = cities[Math.floor(random()*cities.length)];
 return {day,country,city};
}
