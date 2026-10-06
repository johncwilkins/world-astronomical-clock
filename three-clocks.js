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
 frame.title = `Live ${name} astronomical clock with teal dial background`;
 const url = new URL('./clock-pane.html',location.href);
 url.search = new URLSearchParams({desktop:'1',location:selection.city,theme:'teal',size:'95',readout:'0',position:'center',background:'black',dst:'1'}).toString();
 frame.src = url;
}
function update() { selectDaily(new Date()); }
update(); setInterval(update,1000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)update()});
