// Prague's fixed Roman scale is the reference frame for CET, without DST.
// Rotate every astronomical element together so all relative readings survive.
export function isPragueDial(lat,lon,zone){
 return Math.abs(lat-50.08)<.0001&&Math.abs(lon-14.4208)<.0001&&zone==='Europe/Prague';
}
export function displayDial(a,prague=false,dstShift=0){
 const skyRotation=prague?a.timeDialRotation:0;
 return {
  skyRotation,
  numeralRotation:prague?0:a.timeDialRotation+dstShift,
  sunAngle:a.sunAngle+skyRotation,
  moonAngle:a.moonAngle+skyRotation,
  zodiacAngle:a.zodiacAngle+skyRotation,
  sunsetAngle:a.sunsetAngle+skyRotation
 };
}
