// Convex leading-edge envelope of the exported flat sail, in local X/Y.
export function leadingEdge(points){
 const p=[...new Map(points.map(v=>[`${v[0]},${v[1]}`,v])).values()].sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 const lo=[],hi=[];for(const v of p){while(lo.length>1&&cross(lo.at(-2),lo.at(-1),v)<=0)lo.pop();lo.push(v)}for(const v of [...p].reverse()){while(hi.length>1&&cross(hi.at(-2),hi.at(-1),v)<=0)hi.pop();hi.push(v)}const hull=[...lo.slice(0,-1),...hi.slice(0,-1)];
 const footHeight=p.at(-1)[1];
 return y=>{y=Math.max(y,footHeight);let x=-Infinity;for(let i=0;i<hull.length;i++){const a=hull[i],b=hull[(i+1)%hull.length];if(y<Math.min(a[1],b[1])-1e-5||y>Math.max(a[1],b[1])+1e-5)continue;if(Math.abs(a[1]-b[1])<1e-8)x=Math.max(x,a[0],b[0]);else{x=Math.max(x,a[0]+(b[0]-a[0])*Math.max(0,Math.min(1,(y-a[1])/(b[1]-a[1]))))}}return x};
}
export function swingVertex(x,y,z,pivot,angle){return [pivot+(x-pivot)*Math.cos(angle),y,z-(x-pivot)*Math.sin(angle)]}
