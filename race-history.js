export const HISTORY_BOATS=['You','Ace','Weekend Warrior','Spider','Marquee','Scope'];
const KEY='regatta-finish-history-v2',OLD_KEY='regatta-finish-history-v1',OLD_NAMES=['You','Skilled','Weekend Warrior','Rookie'];
const empty=()=>Object.fromEntries(HISTORY_BOATS.map(name=>[name,Array(6).fill(0)]));
const valid=(saved,names,size)=>saved&&names.every(name=>Array.isArray(saved[name])&&saved[name].length===size&&saved[name].every(n=>Number.isSafeInteger(n)&&n>=0));
export function createRaceHistory(storage){
 let persistent=Boolean(storage),counts=empty();
 const save=()=>{try{storage?.setItem(KEY,JSON.stringify(counts))}catch{persistent=false}};
 try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(valid(saved,HISTORY_BOATS,6))counts=Object.fromEntries(HISTORY_BOATS.map(name=>[name,saved[name]]));else if(!saved){const old=JSON.parse(storage?.getItem(OLD_KEY)||'null');if(valid(old,OLD_NAMES,4)){OLD_NAMES.forEach((name,i)=>{counts[HISTORY_BOATS[i]]=[...old[name],0,0]});save()}}}catch{persistent=false}
 return {get persistent(){return persistent},get counts(){return counts},get races(){return counts.You.reduce((sum,n)=>sum+n,0)},record(boats){if(boats.length!==6||new Set(boats.map(b=>b.name)).size!==6||new Set(boats.map(b=>b.place)).size!==6||boats.some(b=>!HISTORY_BOATS.includes(b.name)||!Number.isInteger(b.place)||b.place<1||b.place>6))return false;for(const boat of boats)counts[boat.name][boat.place-1]++;save();return true},reset(){counts=empty();save()}};
}
