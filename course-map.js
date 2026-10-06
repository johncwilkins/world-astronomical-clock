export function mapProjection(course,boats){
 const points=[...course,...boats],xs=points.map(p=>p.x),zs=points.map(p=>p.z);
 const cx=(Math.min(...xs)+Math.max(...xs))/2,cz=(Math.min(...zs)+Math.max(...zs))/2;
 const span=Math.max(160,Math.max(...xs)-Math.min(...xs)+36,Math.max(...zs)-Math.min(...zs)+36),scale=136/span;
 return p=>({x:80+(p.z-cz)*scale,y:80-(p.x-cx)*scale});
}
const NS='http://www.w3.org/2000/svg';
export function createCourseMap(svg){
 const add=(tag,attrs,parent=svg)=>{const e=document.createElementNS(NS,tag);for(const [key,value]of Object.entries(attrs))e.setAttribute(key,value);parent.append(e);return e};
 add('rect',{width:160,height:160,rx:10,fill:'#092132df',stroke:'#8bb0c5','stroke-width':1});
 const startLine=add('path',{stroke:'#fff','stroke-width':1.5,'stroke-dasharray':'2 2'}),committee=add('rect',{width:5,height:7,fill:'#dce8ee',stroke:'#fff','stroke-width':.5});
 const route=add('path',{fill:'none',stroke:'#aac6d1','stroke-opacity':.5,'stroke-dasharray':'3 4'});
 const marks=Array.from({length:3},()=>add('circle',{r:5,stroke:'#fff','stroke-width':1}));
 const boats=['#e54e58','#2879ed','#f4c72d','#35b759','#16191d','#f3f2e9'].map((color,i)=>add('path',{d:i===0?'M0 -7 L-5 5 L0 3 L5 5 Z':'M0 -6 L-4 4 L0 2 L4 4 Z',fill:color,stroke:'#fff','stroke-width':i===0?1.8:1}));
 const wind=add('g',{});add('path',{d:'M18 31 V16 M18 12 L14 19 L22 19 Z',stroke:'#48d9df',fill:'#48d9df','stroke-width':1.8},wind);const windLabel=add('text',{x:18,y:43,'text-anchor':'middle',fill:'#48d9df','font-size':8});windLabel.textContent='WIND';
 const north=add('text',{x:80,y:12,'text-anchor':'middle',fill:'#c5e1ed','font-size':10});north.textContent='N';
 return (course,positions,active,direction=70,strength=12,race=null)=>{wind.setAttribute('transform',`rotate(${direction+180} 18 22)`);wind.setAttribute('opacity',strength>0?1:.25);const project=mapProjection(race?[...course,race.b]:course,positions);startLine.setAttribute('visibility',race?.lineVisible===false?'hidden':'visible');committee.setAttribute('visibility',race?.lineVisible===false?'hidden':'visible');if(race){const a=project(race.a),b=project(race.b);startLine.setAttribute('d',`M${a.x} ${a.y} L${b.x} ${b.y}`);committee.setAttribute('x',b.x-2.5);committee.setAttribute('y',b.y-3.5)}marks.forEach((m,i)=>m.setAttribute('visibility',i<course.length?'visible':'hidden'));const mp=course.map(project);route.setAttribute('d',mp.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+' Z');mp.forEach((p,i)=>{marks[i].setAttribute('cx',p.x);marks[i].setAttribute('cy',p.y);marks[i].setAttribute('fill',course[i].color);marks[i].setAttribute('stroke-width',i===active?2.5:1)});positions.forEach((p,i)=>{const m=project(p);boats[i].setAttribute('transform',`translate(${m.x} ${m.y}) rotate(${(p.heading||0)*180/Math.PI})`)})};
}
