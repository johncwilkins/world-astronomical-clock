export const MARK_RADIUS=12;
export const COURSE_TYPES=['starboard','port','updown','long-starboard','long-port','long-updown'];
export function makeCourse(windDegrees,type='starboard'){
 if(!COURSE_TYPES.includes(type))type='starboard';
 const long=type.startsWith('long-'),base=type.replace('long-',''),r=windDegrees*Math.PI/180,c=Math.cos(r),s=Math.sin(r),scale=long?2:1;
 // Offset legs are symmetric about downwind: 45 degrees normally, 20 on long triangles.
 const width=70*scale*(long?Math.tan(20*Math.PI/180):1)*(base==='port'?-1:1);
 const course=[{x:90*scale*c,z:90*scale*s,color:'#ff7b22',name:'Orange · Upwind'}];
 if(base!=='updown')course.push({x:20*scale*c-width*s,z:20*scale*s+width*c,color:'#9d294b',name:'Maroon · Offset mark'});
 course.push({x:-50*scale*c,z:-50*scale*s,color:'#ffdb32',name:'Yellow · Downwind'});course.layout=type;
 const area=course.reduce((sum,p,i)=>{const q=course[(i+1)%course.length];return sum+p.x*q.z-p.z*q.x},0),side=Math.sign(area)||1;
 for(const [i,mark]of course.entries()){const prev=course[(i+course.length-1)%course.length],next=course[(i+1)%course.length],ix=mark.x-prev.x,iz=mark.z-prev.z,ox=next.x-mark.x,oz=next.z-mark.z,il=Math.hypot(ix,iz),ol=Math.hypot(ox,oz);mark.entryNormal={x:side*iz/il,z:-side*ix/il};mark.exitNormal={x:side*oz/ol,z:-side*ox/ol};const x=mark.entryNormal.x+mark.exitNormal.x,z=mark.entryNormal.z+mark.exitNormal.z,d=Math.hypot(x,z);mark.outsideNormal=d>1e-8?{x:x/d,z:z/d}:{x:ix/il,z:iz/il};}return course;}
export function nextMark(index,count){return (index+1)%count}

export function markBearing(mark,x,z,heading){const deg=(Math.atan2(mark.z-z,mark.x-x)-heading)*180/Math.PI;return ((deg+540)%360+360)%360-180}
export function roundingNormal(mark,next){const x=mark.x-next.x,z=mark.z-next.z,d=Math.hypot(x,z)||1;return {x:x/d,z:z/d}}
// Clip each movement segment to the capture circle AND the far-side half-plane.
export function reachesMark(mark,from,to,next){
 if(!next)return false;const n=roundingNormal(mark,next),x=from.x-mark.x,z=from.z-mark.z,dx=to.x-from.x,dz=to.z-from.z;
 let lo=0,hi=1;const a=dx*dx+dz*dz,b=2*(x*dx+z*dz),c=x*x+z*z-MARK_RADIUS*MARK_RADIUS;
 if(a<1e-12){if(c>0)return false}else{const disc=b*b-4*a*c;if(disc<0)return false;const root=Math.sqrt(disc);lo=Math.max(lo,(-b-root)/(2*a));hi=Math.min(hi,(-b+root)/(2*a))}
 const start=x*n.x+z*n.z-.5,delta=dx*n.x+dz*n.z;if(Math.abs(delta)<1e-12){if(start<0)return false}else if(delta>0)lo=Math.max(lo,-start/delta);else hi=Math.min(hi,-start/delta);
 return lo<=hi&&hi>=0&&lo<=1;
}
export function roundingPoints(mark,next,boat){const n=roundingNormal(mark,next),entry=mark.entryNormal||{x:n.z,z:-n.x},exit=mark.exitNormal||{x:-n.z,z:n.x},outside=mark.outsideNormal||n;boat.roundSide=1;return [{x:mark.x+entry.x*10,z:mark.z+entry.z*10},{x:mark.x+outside.x*7,z:mark.z+outside.z*7},{x:mark.x+exit.x*10,z:mark.z+exit.z*10}];}
export function roundingWaypoint(mark,next,boat){const points=roundingPoints(mark,next,boat);if(!boat.roundPhase)boat.roundPhase=1;if(boat.roundPhase===1&&Math.hypot(boat.x-points[0].x,boat.z-points[0].z)<4)boat.roundPhase=2;return points[boat.roundPhase===1?0:1];}
export function hasRoundedWaypoint(mark,next,boat){const far=roundingPoints(mark,next,boat)[1];return boat.roundPhase===2&&Math.hypot(boat.x-far.x,boat.z-far.z)<4;}
// The third point must be reached before navigating toward the next mark.
export function markExitPath(mark,next,boat){return [roundingPoints(mark,next,boat)[2]];}
export function exitWaypoint(boat){
 if(!boat.exitPath?.length)return null;
 while(boat.exitPath.length&&Math.hypot(boat.x-boat.exitPath[0].x,boat.z-boat.exitPath[0].z)<4)boat.exitPath.shift();
 return boat.exitPath[0]||null;
}
export function avoidMarks(boat,desired,course){
 let adjusted=desired;
 for(const mark of course){
  const dx=mark.x-boat.x,dz=mark.z-boat.z,d=Math.hypot(dx,dz);if(d>14||d<.01)continue;
  const toward=Math.atan2(dz,dx),error=Math.atan2(Math.sin(adjusted-toward),Math.cos(adjusted-toward));
  const safe=3.6,cone=Math.asin(Math.min(.99,safe/d));
  if(Math.abs(error)<cone){const side=Math.sign(error)||boat.roundSide||1;adjusted=toward+side*(cone+.14)}
 }
 return adjusted;
}
