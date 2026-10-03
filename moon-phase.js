// Orient the illuminated hemisphere toward the Sun across the dial.
// Its component toward the front of the dial preserves the phase fraction.
export function moonLightVector(illumination,sunX,sunZ,moonX,moonZ){
 const front=2*Math.max(0,Math.min(1,illumination))-1;
 const side=Math.sqrt(Math.max(0,1-front*front));
 let x=sunX-moonX,z=sunZ-moonZ,length=Math.hypot(x,z);
 if(length<1e-9){x=1;z=0;length=1}
 return [side*x/length,front,side*z/length];
}
