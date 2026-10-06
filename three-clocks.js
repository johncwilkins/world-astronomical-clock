import {locations} from './locations.js';
import {chooseDailyCity,localDay} from './daily-city.js';
const panels = [...document.querySelectorAll('.clock-panel')];
const dailyPanel = panels[0], storageKey = 'astronomical-clock.daily-country';
let selection, selectedDay;
function selectDaily(now) {
 const day = localDay(now);
 if (day === selectedDay) return;
 let previous = selection;
 try { previous = JSON.parse(localStorage.getItem(storageKey)) || previous; } catch {}
 selection = chooseDailyCity(previous,Math.random,day); selectedDay = day;
 try { localStorage.setItem(storageKey,JSON.stringify(selection)); } catch {}
 const [name,,,zone] = locations[selection.city];
 dailyPanel.dataset.zone = zone;
 dailyPanel.querySelector('h1').textContent = name;
 const frame = dailyPanel.querySelector('iframe');
 frame.title = `Live ${name} astronomical clock with national flag`;
 const url = new URL('./clock-pane.html',location.href);
 url.search = new URLSearchParams({desktop:'1',location:selection.city,theme:selection.country==='is'?'iceland':`country-${selection.country}`,size:'95',readout:'0',position:'center',background:'black',dst:'1'}).toString();
 frame.src = url;
}
function update() {
 const now = new Date(); selectDaily(now);
 for (const panel of panels) {
  const zone = panel.dataset.zone, output = panel.querySelector('time');
  output.dateTime = now.toISOString();
  output.textContent = new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(now);
  panel.querySelector('.local-date').textContent = new Intl.DateTimeFormat('en-US',{timeZone:zone,weekday:'long',month:'long',day:'numeric'}).format(now);
 }
}
update(); setInterval(update,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
