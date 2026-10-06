export function sailResponse(windDegrees,knots,sheet){
 const a=Math.abs(windDegrees), side=Math.sign(Math.sin(windDegrees*Math.PI/180))||1;
 const sail=Math.min(a,sheet), incidence=Math.min(Math.abs(a-sail),180-Math.abs(a-sail));
 const luff=a<sheet+3, calm=knots<0.5;
 const load=calm?0:Math.sin(incidence*Math.PI/180);
 const sideLoad=load*Math.sin(a*Math.PI/180);
 return {sail:-side*sail,load,heel:-side*Math.min(32,sideLoad*(knots/12)**2*18),status:calm?'No wind':luff?'Luffing':a>145?'Running':incidence>35?'Over-trimmed':'Drawing',incidence};
}

export const KNOT=.514444;
export const MIN_SPEED=.1*KNOT;
export const ARCADE_SPEED=1.85;
export function apparentWind(direction,knots,speed){
 const rad=direction*Math.PI/180,x=Math.cos(rad)*knots*KNOT+speed/ARCADE_SPEED,z=Math.sin(rad)*knots*KNOT;
 return {direction:Math.atan2(z,x)*180/Math.PI,strength:Math.hypot(x,z)/KNOT};
}
export function advanceBoat(speed,windDirection,windKnots,sheet,dt,shadow=0,gust=0){
 const apparent=apparentWind(windDirection,windKnots,speed),sail=sailResponse(apparent.direction,apparent.strength,sheet);
 if(Math.abs(windDirection)<noGoHalfAngle(windKnots,speed,gust)&&windKnots>=.5){sail.status='Luffing';sail.load=0;sail.heel=0}
 const a=Math.abs(apparent.direction)*Math.PI/180,alpha=sail.incidence*Math.PI/180;
 const lift=Math.sin(2*alpha),drag=Math.sin(alpha)**2;
 const drive=Math.abs(windDirection)<noGoHalfAngle(windKnots,speed,gust)||sail.status==='Luffing'||windKnots===0?0:Math.max(0,.95*lift*Math.sin(a)-.9*drag*Math.cos(a));
 const force=.5*1.225*(apparent.strength*KNOT)**2*7.06*drive;
 const physicalSpeed=speed/ARCADE_SPEED;const resistance=14*physicalSpeed+18*physicalSpeed*physicalSpeed;
 const shadowDrag=resistance;const shadowDrive=force*(1-.15*Math.max(0,Math.min(1,shadow/.65)));
 const nextSpeed=dt===0?speed:Math.max(MIN_SPEED,speed+(shadowDrive-shadowDrag)/55*ARCADE_SPEED*dt);
 return {shadow,speed:nextSpeed,advance:(speed+nextSpeed)*.5*dt,apparent,sail,force};
}
export function relativeWind(worldDegrees,heading){return ((worldDegrees-heading*180/Math.PI+540)%360+360)%360-180}
export function tillerInput(fraction){const n=Math.max(-1,Math.min(1,(fraction-.5)*2));return Math.abs(n)<.06?0:Math.sign(n)*(Math.abs(n)-.06)/.94}
export function steerHeading(heading,tiller,speed,dt){return heading-tiller*(speed>0?Math.min(1,Math.max(.22,speed/1.8)):0)*2.65*dt}
export function telltaleState(sail){if(sail.status==='No wind')return 'drooping';if(sail.incidence<10)return 'windward';if(sail.incidence>32&&sail.status!=='Running')return 'leeward';if(sail.status==='Running')return 'running';return 'streaming'}

export function windDialRotation(worldDegrees,heading){return relativeWind(worldDegrees,heading)}

export function waterSpeedGain(speed){return 2+Math.min(8,speed/KNOT)*.45}
export function boatBob(time){return .07*Math.sin(time*2*Math.PI/2.8)}
export function noGoHalfAngle(knots=0,speed=0,gust=0){return 35-3*Math.max(0,Math.min(1,(gust-.3)/.4))}
export function trimHint(speed,direction,knots,sheet,gust=0){
 if(knots<.5)return 'Add wind to build speed';
 const current=advanceBoat(speed,direction,knots,sheet,0,0,gust);
 if(Math.abs(direction)<noGoHalfAngle(knots,speed,gust))return 'Steer out of the red sector';
 let best={sheet,force:current.force};for(let candidate=5;candidate<=90;candidate++){const force=advanceBoat(speed,direction,knots,candidate,0,0,gust).force;if(force>best.force)best={sheet:candidate,force}}
 if(Math.abs(best.sheet-sheet)<=3||best.force-current.force<Math.max(1,best.force*.03))return 'Hold trim · good drive';
 return best.sheet<sheet?'Sheet in · left mouse':'Ease out · right mouse';
}
