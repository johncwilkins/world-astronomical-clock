import {advanceBoat,apparentWind,MIN_SPEED,noGoHalfAngle,relativeWind} from './physics.js';
import {reachesMark,hasRoundedWaypoint,nextMark,roundingWaypoint,markExitPath,exitWaypoint,avoidMarks} from './course.js';
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const RACER_PROFILES=[
 {skill:'expert',name:'Ace',color:0x155fc8,hex:'#72aaff',badge:1},
 {skill:'weekend',name:'Weekend Warrior',color:0xf4c72d,hex:'#f4c72d',badge:2},
 {skill:'spider',name:'Spider',color:0x35b759,hex:'#65de89',badge:3},
 {skill:'marquee',name:'Marquee',color:0x16191d,hex:'#c2c8ce',badge:4},
 {skill:'scope',name:'Scope',color:0xf3f2e9,hex:'#f3f2e9',badge:5}
];
export const SAILOR_SKILLS={expert:{point:3,turn:2.3,error:0,wobble:0,response:9},marquee:{point:3,turn:2.3,error:0,wobble:0,response:9},scope:{point:4,turn:2.1,error:2,wobble:.02,response:5},spider:{point:5,turn:1.95,error:3,wobble:.04,response:3.5},weekend:{point:6,turn:1.8,error:6,wobble:.065,response:2},novice:{point:10,turn:1.3,error:20,wobble:.19,response:.65}};
export const AI_NAVIGATION={"lookAhead":9,"clearance":7,"yieldClearance":9,"riskWeight":70,"turnBias":0.18,"markClearance":6};
let nextRacerId=0;
export function createRacer(skill){const profile=RACER_PROFILES.find(r=>r.skill===skill);return {skill,racerId:++nextRacerId,...profile,x:skill==='weekend'?-3:5,z:skill==='expert'?-4.5:skill==='weekend'?8:4.5,heading:0,speed:MIN_SPEED,sheet:40,tack:skill==='expert'?-1:1,target:0,rounded:0,angle:0,heel:0,shadow:0,roundPhase:0,roundSide:0,exitPath:[],clock:0,recoverUntil:0,stalled:0,lastContact:-100,progressAt:0,bestDistance:Infinity}}
export function bestSheet(speed,direction,wind,shadow=0,gust=0){
 const apparent=apparentWind(direction,wind,speed),a=Math.abs(apparent.direction),rad=a*Math.PI/180;
 const incidence=Math.atan2(.95*Math.sin(rad),.45*Math.cos(rad))*90/Math.PI;
 const candidates=new Set([5,90,Math.floor(a-3)]);
 for(const ideal of [a-incidence,a-180+incidence]){candidates.add(Math.floor(ideal));candidates.add(Math.ceil(ideal))}
 let best=5,force=-1;for(const sheet of [...candidates].filter(n=>n>=5&&n<=90).sort((a,b)=>a-b)){const f=advanceBoat(speed,direction,wind,sheet,0,shadow,gust).force;if(f>force){best=sheet;force=f}}
 return best;
}
export function stepRacer(r,course,wind,knots,time,dt,traffic=[],navigation={}){
 if(dt<=0)return;r.clock=time;const ability=SAILOR_SKILLS[r.skill]||SAILOR_SKILLS.weekend;
 const target=course[r.target],next=course[nextMark(r.target,course.length)],waypoint=navigation.waypoint||exitWaypoint(r)||roundingWaypoint(target,next,r),bearing=Math.atan2(waypoint.z-r.z,waypoint.x-r.x),windRad=wind*Math.PI/180;
 const closeAngle=Math.min(78,noGoHalfAngle(knots,r.speed,navigation.gust)+ability.point)*Math.PI/180;
 const relative=wrap(bearing-windRad);let desired=bearing;
 if(Math.abs(relative)<closeAngle){if(relative*r.tack<-.2)r.tack=Math.sign(relative);desired=windRad+r.tack*closeAngle}else if(Math.abs(relative)<Math.PI/2){r.tack=Math.sign(relative)||r.tack}
 desired+=Math.sin(time*.42)*ability.wobble;if(r.skill==='novice')desired+=Math.sin(time*1.7)*.08;
 const distance=Math.hypot(waypoint.x-r.x,waypoint.z-r.z);
 const waypointKey=`${waypoint.x.toFixed(1)},${waypoint.z.toFixed(1)}`;if(r.waypointKey!==waypointKey){r.waypointKey=waypointKey;r.bestDistance=Infinity;r.progressAt=time}
 if(distance<r.bestDistance-.5){r.bestDistance=distance;r.progressAt=time}
 if(time-r.progressAt>7){r.recoverUntil=time+3;r.tack*=-1;r.progressAt=time;r.bestDistance=Infinity;r.recoveryCount=(r.recoveryCount||0)+1;}
 const recovering=time<r.recoverUntil;
 if(recovering)desired=recoveryHeading(r,navigation.obstacles||course,traffic,wind);
 const avoidance=avoidTraffic(r,desired,traffic,wind,navigation.obstacles||course,closeAngle,distance);
 desired=avoidance.heading;

 const error=wrap(desired-r.heading),rate=ability.turn;r.heading+=Math.max(-rate*dt,Math.min(rate*dt,error));
 const rel=relativeWind(wind,r.heading),optimal=bestSheet(r.speed,rel,knots,r.shadow,navigation.gust);
 const wanted=recovering||distance<15||ability.error===0?optimal:Math.max(5,Math.min(90,optimal+ability.error*.65+ability.error*Math.sin(time*.27)));
 r.sheet+=(wanted-r.sheet)*(1-Math.exp(-dt*ability.response));
 const from={x:r.x,z:r.z},m=advanceBoat(r.speed,rel,knots,r.sheet,dt,r.shadow,navigation.gust);r.speed=Math.max(MIN_SPEED,m.speed*Math.exp(-avoidance.brake*dt));const advance=(r.speed+m.speed)*.5*dt;r.x+=advance*Math.cos(r.heading);r.z+=advance*Math.sin(r.heading);r.motion=m;
 r.angle+=(m.sail.sail-r.angle)*(1-Math.exp(-dt*4));r.heel+=(m.sail.heel-r.heel)*(1-Math.exp(-dt*1.5));
 if(navigation.score!==false&&!r.exitPath.length&&hasRoundedWaypoint(target,next,r)&&reachesMark(target,from,r,next)){r.exitPath=markExitPath(target,next,r);r.target=nextMark(r.target,course.length);r.rounded++;r.roundPhase=0;r.roundSide=0;r.bestDistance=Infinity;r.progressAt=time}
}
function spine(b){const c=Math.cos(b.heading),s=Math.sin(b.heading);return [{x:b.x-.1*c,z:b.z-.1*s},{x:b.x-2.9*c,z:b.z-2.9*s}]}
function closest(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return {x:a.x+t*dx,z:a.z+t*dz}}
function closestPair(a,b){const candidates=[];for(const p of a)candidates.push([p,closest(p,...b)]);for(const p of b)candidates.push([closest(p,...a),p]);
 const ax=a[1].x-a[0].x,az=a[1].z-a[0].z,bx=b[1].x-b[0].x,bz=b[1].z-b[0].z,den=ax*bz-az*bx;
 if(Math.abs(den)>1e-9){const dx=b[0].x-a[0].x,dz=b[0].z-a[0].z,t=(dx*bz-dz*bx)/den,u=(dx*az-dz*ax)/den;if(t>=0&&t<=1&&u>=0&&u<=1){const p={x:a[0].x+t*ax,z:a[0].z+t*az};return [p,p]}}
 return candidates.sort((p,q)=>Math.hypot(p[0].x-p[1].x,p[0].z-p[1].z)-Math.hypot(q[0].x-q[1].x,q[0].z-q[1].z))[0];}
function normal(a,b,fallback){let x=a.x-b.x,z=a.z-b.z,d=Math.hypot(x,z);if(d<1e-6){x=fallback.x;z=fallback.z;const n=Math.hypot(x,z)||1;return {x:x/n,z:z/n,d:0}}return {x:x/d,z:z/d,d}}
export function boatTack(boat,wind){const sailAngle=boat.sailAngle??boat.angle;if(Number.isFinite(sailAngle)&&Math.abs(sailAngle)>2)return sailAngle>0?-1:1;return Math.sign(Math.sin(relativeWind(wind,boat.heading)*Math.PI/180))||1;}
export function collisionFault(a,b,wind){
 const tack=boat=>boatTack(boat,wind);
 if(tack(a)!==tack(b))return {offender:tack(a)<0?a:b,reason:'Port tack must keep clear'};
 const parallel=Math.abs(wrap(a.heading-b.heading))<Math.PI/3;
 if(parallel){const alongA=(a.x-b.x)*Math.cos(b.heading)+(a.z-b.z)*Math.sin(b.heading),alongB=-((a.x-b.x)*Math.cos(a.heading)+(a.z-b.z)*Math.sin(a.heading));if(alongA<-.35&&a.speed>=b.speed*.85)return {offender:a,reason:'Overtaking boat must keep clear'};if(alongB<-.35&&b.speed>=a.speed*.85)return {offender:b,reason:'Overtaking boat must keep clear'}}
 const rad=wind*Math.PI/180,upwind=(a.x-b.x)*Math.cos(rad)+(a.z-b.z)*Math.sin(rad);return {offender:Math.abs(upwind)<.05?(a.speed>=b.speed?a:b):(upwind>0?a:b),reason:'Windward boat must keep clear'};
}
export function bumpBoats(a,b,wind=0,priorFault=null,penalize=true){const pair=closestPair(spine(a),spine(b)),n=normal(...pair,{x:a.x-b.x||Math.sin(a.heading),z:a.z-b.z||Math.cos(a.heading)});if(n.d>=1.5)return false;const current=collisionFault(a,b,wind),fault=current.reason==='Port tack must keep clear'?current:priorFault||current;const push=(1.5-n.d+.01)*.5;a.x+=n.x*push;a.z+=n.z*push;b.x-=n.x*push;b.z-=n.z*push;if(penalize&&(!fault.offender.skill||fault.offender.clock-fault.offender.lastContact>.9)){fault.offender.speed=Math.max(MIN_SPEED,fault.offender.speed*.5);fault.offender.lastContact=fault.offender.clock}for(const body of [a,b])if(body.skill&&body.clock>=body.recoverUntil)body.recoverUntil=body.clock+3;return fault}
export function windShadow(receiver,others,wind){const rad=wind*Math.PI/180,flow={x:-Math.cos(rad),z:-Math.sin(rad)};let intensity=0;for(const other of others){if(other===receiver)continue;const dx=receiver.x-other.x,dz=receiver.z-other.z,along=dx*flow.x+dz*flow.z,lateral=Math.abs(dx*flow.z-dz*flow.x),width=1.5+along*.16;if(along>0&&along<28&&lateral<width)intensity=Math.max(intensity,.65*(1-along/28)*(1-(lateral/width)**2))}return intensity}

export function bumpMark(b,mark){const p=closest(mark,...spine(b)),n=normal(p,mark,{x:-Math.cos(b.heading),z:-Math.sin(b.heading)});const radius=mark.radius||1.8;if(n.d>=radius)return false;b.x+=n.x*(radius-n.d+.01);b.z+=n.z*(radius-n.d+.01);if(!b.skill||b.clock-b.lastContact>.9){b.speed=Math.max(MIN_SPEED,b.speed*.4);b.lastContact=b.clock}if(b.skill&&b.clock>=b.recoverUntil)b.recoverUntil=b.clock+3;return true}

// Evaluate several sailable escape headings together, so one avoidance does not steer into another boat.
export function avoidTraffic(boat,desired,traffic,wind,marks=[],closeAngle=null,waypointDistance=Infinity){
 const config=AI_NAVIGATION,ability=SAILOR_SKILLS[boat.skill]||SAILOR_SKILLS.weekend,windRad=wind*Math.PI/180;
 closeAngle??=(35+ability.point)*Math.PI/180;
 const sailHeading=h=>{const rel=wrap(h-windRad);return Math.abs(rel)<closeAngle?windRad+(Math.sign(rel)||boat.tack||1)*closeAngle:h};
 desired=sailHeading(desired);
 const center=b=>({x:b.x-1.5*Math.cos(b.heading),z:b.z-1.5*Math.sin(b.heading)}),origin=center(boat);
 const nearby=traffic.filter(o=>o!==boat&&(boat.racerId===undefined||o.racerId!==boat.racerId)&&Math.hypot(o.x-boat.x,o.z-boat.z)<45);
 const obstacles=marks.filter(m=>Math.hypot(m.x-boat.x,m.z-boat.z)<24);
 if(!nearby.length&&!obstacles.length)return {heading:desired,brake:0};
 const candidates=[0,.25,-.25,.5,-.5,.85,-.85,1.2,-1.2,1.65,-1.65].map(delta=>sailHeading(desired+delta));candidates.push(windRad-closeAngle,windRad+closeAngle);
 let best={heading:desired,cost:Infinity,risk:0,immediate:Infinity};
 for(const heading of candidates){
  const vx=Math.cos(heading)*boat.speed,vz=Math.sin(heading)*boat.speed;
  let cost=Math.abs(wrap(heading-desired))+config.turnBias*Math.abs(wrap(heading-boat.heading)),risk=0,immediate=Infinity;
  for(const other of nearby){
   const p=center(other),dx=p.x-origin.x,dz=p.z-origin.z,rvx=other.speed*Math.cos(other.heading)-vx,rvz=other.speed*Math.sin(other.heading)-vz,v2=rvx*rvx+rvz*rvz;
   const t=Math.max(0,Math.min(config.lookAhead,-(dx*rvx+dz*rvz)/(v2||1))),closest=Math.hypot(dx+rvx*t,dz+rvz*t);
   const yieldBoat=collisionFault(boat,other,wind).offender===boat,clearance=yieldBoat?config.yieldClearance:config.clearance;
   const danger=Math.max(0,1-closest/clearance)**2*(1-t/(config.lookAhead+2));
   cost+=danger*config.riskWeight*(yieldBoat?1.8:1);risk=Math.max(risk,danger);if(closest<3&&t<1.5)immediate=Math.min(immediate,Math.hypot(dx,dz));
  }
  for(const mark of obstacles){
   const dx=mark.x-origin.x,dz=mark.z-origin.z,v2=vx*vx+vz*vz,horizon=Math.min(4,Math.max(.6,waypointDistance/Math.max(.5,boat.speed)));
   const t=Math.max(0,Math.min(horizon,(dx*vx+dz*vz)/(v2||1))),closest=Math.hypot(dx-vx*t,dz-vz*t),clearance=Math.max(config.markClearance,(mark.radius||1.8)+2.2);
   const danger=Math.max(0,1-closest/clearance)**2;cost+=danger*config.riskWeight*3;risk=Math.max(risk,danger);if(closest<clearance*.7&&t<1.2)immediate=Math.min(immediate,Math.hypot(dx,dz));
  }
  if(cost<best.cost)best={heading,cost,risk,immediate};
 }
 const brake=best.immediate<5&&best.risk>.12?Math.min(1.1,(5-best.immediate)*.3):0;
 return {heading:best.heading,brake};
}

export function recoveryHeading(boat,course,traffic,wind){
 let x=0,z=0;const center={x:boat.x-1.5*Math.cos(boat.heading),z:boat.z-1.5*Math.sin(boat.heading)};
 for(const p of [...course,...traffic.filter(o=>o!==boat&&(boat.racerId===undefined||o.racerId!==boat.racerId))]){const px=p.heading===undefined?p.x:p.x-1.5*Math.cos(p.heading),pz=p.heading===undefined?p.z:p.z-1.5*Math.sin(p.heading),dx=center.x-px,dz=center.z-pz,d=Math.hypot(dx,dz);if(d<12){x+=dx/(d*d+.5);z+=dz/(d*d+.5)}}
 const angle=Math.hypot(x,z)>.01?Math.atan2(z,x):boat.heading+(boat.skill==='expert'?-1:1)*Math.PI/3,wr=wind*Math.PI/180,rel=wrap(angle-wr);
 return Math.abs(rel)<.85?wr+(Math.sign(rel)||boat.tack)*.85:angle;
}
