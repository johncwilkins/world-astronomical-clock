// Offline parameter search. Skill/physics parameters are intentionally excluded.
import {spawn} from 'node:child_process';import{readFileSync,writeFileSync,mkdirSync}from'node:fs';
const candidates=[
 {lookAhead:7,clearance:4.8,yieldClearance:6.5,riskWeight:24,turnBias:.12,markClearance:4.5},
 {lookAhead:7,clearance:6,yieldClearance:8,riskWeight:45,turnBias:.12,markClearance:5.6},
 {lookAhead:8,clearance:6.5,yieldClearance:8.5,riskWeight:60,turnBias:.12,markClearance:5.8},
 {lookAhead:6,clearance:6,yieldClearance:8,riskWeight:60,turnBias:.2,markClearance:6.2},
 {lookAhead:8,clearance:6,yieldClearance:8.5,riskWeight:45,turnBias:.25,markClearance:5.6},
 {lookAhead:9,clearance:7,yieldClearance:9,riskWeight:70,turnBias:.18,markClearance:6},
 {lookAhead:7,clearance:6.5,yieldClearance:8,riskWeight:70,turnBias:.15,markClearance:6.2},
 {lookAhead:7,clearance:7,yieldClearance:9,riskWeight:90,turnBias:.22,markClearance:6.5}
];
mkdirSync('scripts/ai-reports',{recursive:true});const results=[];
for(const [index,tuning]of candidates.entries()){
 const out=`scripts/ai-reports/tuning-${index}.json`;
 await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['scripts/ai-lab.mjs','--count','48','--tuning',JSON.stringify(tuning),'--out',out],{stdio:['ignore','ignore','inherit']});p.on('error',reject);p.on('exit',code=>code?reject(Error('Candidate failed')):resolve())});
 const {summary}=JSON.parse(readFileSync(out));results.push({index,tuning,summary});console.log(JSON.stringify({candidate:index,summary}));
}
results.sort((a,b)=>a.summary.meanScore-b.summary.meanScore);writeFileSync('scripts/ai-reports/tuning-selection.json',JSON.stringify({winner:results[0],results},null,2));console.log(JSON.stringify({selected:results[0]}));
