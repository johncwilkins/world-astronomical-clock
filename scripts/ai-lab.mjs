// Repeatable six-boat races with production physics, navigation, legal scoring and collisions.
// node scripts/ai-lab.mjs --count 1000 --version current --out scripts/ai-reports/current.json
// node scripts/ai-lab.mjs --replay 17 --version current --out /tmp/replay.json
import {Worker,isMainThread,parentPort,workerData} from 'node:worker_threads';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
import {makeCourse,COURSE_TYPES} from '../course.js';
import {sampleWind,windPatches} from '../wind-field.js';
const args=Object.fromEntries(process.argv.slice(2).reduce((a,v,i,all)=>v.startsWith('--')?[...a,[v.slice(2),all[i+1]]]:a,[]));
const options=isMainThread?{count:Number(args.count||1000),version:args.version||'current',dt:Number(args.dt||.05),seed:Number(args.seed||73491),replay:args.replay===undefined?null:Number(args.replay),tuning:args.tuning?JSON.parse(args.tuning):{}}:workerData.options;
const racers=await import(options.version==='baseline'?'./ai-baseline/racers.js':'../racers.js');
const races=await import(options.version==='baseline'?'./ai-baseline/race.js':'../race.js');
if(racers.AI_NAVIGATION)Object.assign(racers.AI_NAVIGATION,options.tuning);
const {createRacer,RACER_PROFILES,stepRacer,bumpBoats,bumpMark,windShadow}=racers;
const {makeRace,resetRaceBoat,tickRace,flagEarlyStarts,scoreRaceBoat,raceWaypoint,lineVisible}=races;
function seeded(seed){return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)}
function simulate(index,trace=false){
 const seed=(options.seed+Math.imul(index,2654435761))>>>0,random=seeded(seed),type=COURSE_TYPES[index%6],laps=1+Math.floor(random()*3),wind=random()*360,knots=6+random()*14,phase=random()*500;
 const course=makeCourse(wind,type),race=makeRace(course,wind,random,laps),fleet=RACER_PROFILES.map(p=>createRacer(p.skill));const proxy=createRacer(index%2?'spider':'weekend');proxy.name='Benchmark skipper';fleet.unshift(proxy);fleet.forEach((r,i)=>resetRaceBoat(r,race,i));
 const dt=options.dt,limit=(type.startsWith('long-')?500:300)*laps*(12/knots)+120,events=[],snapshots=[];let boatContacts=0,markContacts=0,portFaults=0,early=0,maxContactSeconds=0,contactRun=0;const lastContact=new Map(),finishTimes={},startTimes={},lastProgress=fleet.map(()=>30),maxNoProgress=fleet.map(()=>0);
 const event=(kind,time,data)=>{if(events.length<60)events.push({kind,time:+time.toFixed(2),...data})};
 for(let frame=0;frame<limit/dt;frame++){
  const time=frame*dt,was=race.stage==='countdown',previous=fleet.map(r=>({x:r.x,z:r.z,started:r.started,rounded:r.rounded}));tickRace(race,dt);if(was&&race.stage==='racing'){flagEarlyStarts(race,fleet);early=fleet.filter(r=>r.overEarly).length;event('gun',time,{early:fleet.filter(r=>r.overEarly).map(r=>r.name)})}
  const patches=windPatches(time+phase,wind),traffic=fleet.map(r=>({...r,isAI:true})),obstacles=[...course,...(lineVisible(race,fleet)?[{...race.b,radius:3.8,name:'Committee boat'}]:[])];
  const common=sampleWind(wind,knots,time+phase,proxy.x,proxy.z,patches);
  for(const r of fleet){const w=sampleWind(wind,knots,time+phase,r.x,r.z,patches);r.shadow=windShadow(r,traffic,w.direction);stepRacer(r,course,w.direction,w.strength,time,dt,traffic,{score:false,gust:w.gust,waypoint:raceWaypoint(r,race),obstacles})}
  let contact=false;const faults=new Map();for(let pass=0;pass<3;pass++)for(let a=0;a<fleet.length;a++){
   for(let b=a+1;b<fleet.length;b++){const key=`boat:${a}:${b}`,hit=bumpBoats(fleet[a],fleet[b],common.direction,faults.get(key),!faults.has(key));if(hit){contact=true;faults.set(key,hit);if(time-(lastContact.get(key)??-10)>.9){boatContacts++;if(hit.reason.startsWith('Port'))portFaults++;event('collision',time,{boats:[fleet[a].name,fleet[b].name],offender:hit.offender.name,reason:hit.reason})}lastContact.set(key,time)}}
   for(const [i,m]of obstacles.entries()){const key=`mark:${a}:${i}`;if(bumpMark(fleet[a],m)){contact=true;if(time-(lastContact.get(key)??-10)>.9){markContacts++;event('mark-contact',time,{boat:fleet[a].name,mark:m.name})}lastContact.set(key,time)}}
  }
  contactRun=contact?contactRun+dt:0;maxContactSeconds=Math.max(maxContactSeconds,contactRun);
  if(race.stage==='racing')fleet.forEach((r,i)=>{const result=scoreRaceBoat(r,race,course,previous[i]);if(!previous[i].started&&r.started){startTimes[r.name]=time-30;lastProgress[i]=time;event('start',time,{boat:r.name})}if(previous[i].rounded!==r.rounded){lastProgress[i]=time;event('round',time,{boat:r.name,marks:r.rounded})}if(result!==null){finishTimes[r.name]=time-30+result*dt;event('finish',time,{boat:r.name})}if(!r.finished)maxNoProgress[i]=Math.max(maxNoProgress[i],time-lastProgress[i])});
  if(trace&&frame%Math.round(1/dt)===0)snapshots.push({time:+time.toFixed(2),boats:fleet.map(r=>({name:r.name,x:+r.x.toFixed(2),z:+r.z.toFixed(2),heading:+r.heading.toFixed(3),speed:+r.speed.toFixed(2),started:r.started,early:r.overEarly,marks:r.rounded,phase:r.roundPhase,exit:r.exitPath.length,waypoint:r.waypointKey,recover:r.recoveryCount,finished:r.finished}))});
  if(fleet.every(r=>r.finished))break;
 }
 const unfinished=fleet.filter(r=>!r.finished).map(r=>({name:r.name,started:r.started,early:r.overEarly,marks:r.rounded,phase:r.roundPhase,exit:r.exitPath,waypoint:r.waypointKey,x:r.x,z:r.z}));
 const finishOrder=Object.entries(finishTimes).sort((a,b)=>a[1]-b[1]).map(([name])=>name);
 const metric={index,seed,type,laps,wind:+wind.toFixed(2),knots:+knots.toFixed(2),limit:+limit.toFixed(1),boatContacts,markContacts,portFaults,early,maxContactSeconds:+maxContactSeconds.toFixed(2),maxNoProgress:+Math.max(...maxNoProgress).toFixed(1),latestStart:+Math.max(0,...Object.values(startTimes)).toFixed(1),finished:fleet.length-unfinished.length,finishOrder,finishTimes,unfinished};
 metric.score=unfinished.length*10000+boatContacts*60+markContacts*80+Math.max(0,metric.latestStart-25)*10+maxContactSeconds*100;
 return {metric,...(trace?{events,snapshots}:{})};
}
if(!isMainThread){for(const index of workerData.indices){const result=simulate(index);parentPort.postMessage(result.metric)}parentPort.close()}
else if(options.replay!==null){const result=simulate(options.replay,true),out=args.out||'/tmp/regatta-ai-replay.json';mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify({options,...result},null,2));console.log({replay:options.replay,file:out,metric:result.metric})}
else{
 const count=options.count,workers=Math.min(4,count),results=[];const started=Date.now();let failure;
 await Promise.all(Array.from({length:workers},(_,slot)=>new Promise((resolve,reject)=>{const indices=Array.from({length:count},(_,i)=>i).filter(i=>i%workers===slot),worker=new Worker(new URL(import.meta.url),{workerData:{indices,options}});worker.on('message',metric=>{results.push(metric);if(results.length%50===0)console.log(JSON.stringify({progress:results.length,count,unfinishedRaces:results.filter(r=>r.finished<6).length,seconds:Math.round((Date.now()-started)/1000)}))});worker.on('error',reject);worker.on('exit',code=>code?reject(Error('Worker exited '+code)):resolve())}))).catch(e=>failure=e);
 if(failure)throw failure;results.sort((a,b)=>a.index-b.index);
 const sum=k=>results.reduce((n,r)=>n+r[k],0),summary={races:results.length,allSixFinished:results.filter(r=>r.finished===6).length,unfinishedBoats:results.reduce((n,r)=>n+6-r.finished,0),boatContacts:sum('boatContacts'),markContacts:sum('markContacts'),portFaults:sum('portFaults'),meanScore:sum('score')/count,meanLatestStart:sum('latestStart')/count,maxContactSeconds:Math.max(...results.map(r=>r.maxContactSeconds)),referenceWins:results.filter(r=>r.finishOrder[0]==='Benchmark skipper').length,seconds:(Date.now()-started)/1000};
 const report={options,summary,worst:[...results].sort((a,b)=>b.score-a.score).slice(0,20),results},out=args.out||`scripts/ai-reports/${options.version}.json`;mkdirSync(dirname(out),{recursive:true});writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify({summary,file:out}));
}
