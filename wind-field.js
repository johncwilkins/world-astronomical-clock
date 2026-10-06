const wrap=a=>((a+540)%360+360)%360-180;
export function windPatches(time,baseDirection){
 const r=baseDirection*Math.PI/180,c=Math.cos(r),s=Math.sin(r);
 return Array.from({length:12},(_,i)=>{const lane=(i%4-1.5)*68,along=((Math.floor(i/4)*115-time*1.3+370)%370+370)%370-185;return {x:along*c-lane*s,z:along*s+lane*c,angle:r,radiusX:(23+(i%3)*4)*2.3,radiusZ:(13+(i%2)*4)*2.3,power:.65+.35*Math.sin(time*.19+i*2)**2}});
}
export function gustAt(x,z,patches){let gust=0;for(const p of patches){const dx=x-p.x,dz=z-p.z,c=Math.cos(p.angle),s=Math.sin(p.angle),q=((dx*c+dz*s)/p.radiusX)**2+((-dx*s+dz*c)/p.radiusZ)**2;gust=Math.max(gust,Math.max(0,1-q)**1.2*p.power)}return gust;}
export function sampleWind(baseDirection,baseStrength,time,x=0,z=0,patches=windPatches(time,baseDirection)){
 const shift=12*Math.sin(time*.08)+6*Math.sin(time*.21)+2*Math.sin(time*.047),ambient=.08*Math.sin(time*.35)+.06*Math.sin(time*.13),gust=gustAt(x,z,patches),factor=Math.max(.8,Math.min(1.2,1+ambient+.20*gust));
 return {direction:wrap(baseDirection+shift),strength:baseStrength*factor,gust};
}
