import {locations} from './locations.js';
import {flagPixels} from './dial-flags.js?v=three-clocks-3';
import {initDesktop} from './desktop.js';
import {countEvent} from './analytics.js';
import {moonLightVector} from './moon-phase.js';
import {displayDial,isPragueDial} from './dial-frame.js';
import {demoMoment,momentURL,readMoment} from './moments.js';
import {FontLoader} from './vendor/FontLoader.js';import {TextGeometry} from './vendor/TextGeometry.js';
import * as T from 'three';import {GLTFLoader} from './vendor/GLTFLoader.js';import {OrbitControls} from './vendor/OrbitControls.js';import {calculate} from './astro.js';import {interpretClock} from './guide.js';

const $=id=>document.getElementById(id),stage=$('stage'),scene=new T.Scene(),camera=new T.PerspectiveCamera(36,1,.01,100);camera.up.set(0,0,-1);camera.position.set(0,7.4,0);const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));stage.appendChild(renderer.domElement);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=3.5;controls.maxDistance=12;controls.maxPolarAngle=Math.PI*.44;scene.add(new T.HemisphereLight(0xffffff,0x5c6f94,3));const light=new T.DirectionalLight(0xffe7b4,4);light.position.set(-3,6,-3);scene.add(light);const fill=new T.DirectionalLight(0xb8d4ff,2);fill.position.set(4,4,3);scene.add(fill);let model,parts={},instant=new Date(),live=true,playing=false,previous=performance.now(),lastPlate='',demoEnd=null;
function resize(){renderer.setSize(stage.clientWidth,stage.clientHeight);camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix()}new ResizeObserver(resize).observe(stage);$('reset').onclick=()=>{camera.position.set(0,7.4,0);controls.target.set(0,0,0);controls.update()};
function offset(date){const p=new Intl.DateTimeFormat('en-US',{timeZone:$('zone').value,timeZoneName:'longOffset'}).formatToParts(date).find(p=>p.type==='timeZoneName').value,m=p.match(/GMT([+-])(\d+)(?::(\d+))?/);return m?(m[1]==='-'?-1:1)*(+m[2]+ +(m[3]||0)/60):0}function standard(){const y=instant.getUTCFullYear();return Math.min(offset(new Date(Date.UTC(y,0,15))),offset(new Date(Date.UTC(y,6,15))))}function localInput(){try{$('datetime').value=new Intl.DateTimeFormat('sv-SE',{timeZone:$('zone').value,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(instant).replace(' ','T')}catch(e){$('message').textContent='Enter a valid time zone, such as America/New_York.'}}function syncPlayback(){$('play').textContent=playing?'Pause':'Play';$('quickPause').textContent=playing?'Pause':'Play';$('quickPause').hidden=live}function mode(v){demoEnd=null;live=v;playing=false;syncPlayback();$('live').classList.toggle('active',v);$('explore').classList.toggle('active',!v);$('exploreControls').hidden=v;localInput()}$('live').onclick=()=>mode(true);$('explore').onclick=()=>mode(false);$('datetime').onchange=()=>{try{let d=new Date($('datetime').value+'Z');for(let i=0;i<3;i++)d=new Date(new Date($('datetime').value+'Z').getTime()-offset(d)*3600000);instant=d;playing=false;syncPlayback()}catch(e){$('message').textContent=e.message}};$('back').onclick=()=>{instant=new Date(+instant-86400000);localInput()};$('forward').onclick=()=>{instant=new Date(+instant+86400000);localInput()};$('backHour').onclick=()=>{instant=new Date(+instant-3600000);localInput()};$('forwardHour').onclick=()=>{instant=new Date(+instant+3600000);localInput()};$('play').onclick=()=>{playing=!playing;syncPlayback()};$('quickPause').onclick=()=>$('play').onclick();$('location').onchange=()=>{$('locationDetails').open=$('location').value==='custom';const place=locations[$('location').value];if(place){$('lat').value=place[1];acceptedLatitude=place[1];$('lon').value=place[2];$('zone').value=place[3]}localInput()};$('geo').onclick=()=>navigator.geolocation.getCurrentPosition(p=>{if(p.coords.latitude<1||p.coords.latitude>66){$('message').textContent='Your location is outside the supported range of 1°–66° north.';return} $('location').value='custom';$('locationDetails').open=true;$('lat').value=p.coords.latitude.toFixed(4);acceptedLatitude=+$('lat').value;$('lon').value=p.coords.longitude.toFixed(4);$('zone').value=Intl.DateTimeFormat().resolvedOptions().timeZone;localInput();rememberLocation()},e=>{$('message').textContent=e.message});let acceptedLatitude=+$('lat').value;for(const id of ['lat','lon'])$(id).onchange=()=>{if(id==='lat'){const value=Number($('lat').value);if($('lat').value.trim()===''||!Number.isFinite(value)||value<1||value>66){$('lat').value=acceptedLatitude;$('message').textContent='Latitude must be between 1° and 66° north.';return}acceptedLatitude=value;$('message').textContent=''}$('location').value='custom'};$('zone').onchange=localInput;
// Store only the selected place; live time starts fresh on each visit.
function validLocation(value){
 if(!value||typeof value!=='object'||!Number.isFinite(value.lat)||value.lat<1||value.lat>66||!Number.isFinite(value.lon)||Math.abs(value.lon)>180||typeof value.zone!=='string')return false;
 try{new Intl.DateTimeFormat('en',{timeZone:value.zone}).format();return true}catch{return false}
}
function rememberLocation(){
 if(location.pathname.endsWith('/clock-pane.html'))return;
 const value={location:$('location').value,lat:Number($('lat').value),lon:Number($('lon').value),zone:$('zone').value};
 if($('lat').value.trim()===''||$('lon').value.trim()===''||!validLocation(value))return;
 try{localStorage.setItem('astronomical-clock.location',JSON.stringify(value))}catch{}
}
function restoreLocation(){
 try{const value=JSON.parse(localStorage.getItem('astronomical-clock.location'));if(!validLocation(value))return;
 const preset=locations[value.location];$('location').value=preset?value.location:'custom';$('lat').value=preset?preset[1]:value.lat;$('lon').value=preset?preset[2]:value.lon;$('zone').value=preset?preset[3]:value.zone;acceptedLatitude=Number($('lat').value);localInput();
 }catch{}
}
for(const id of ['location','lat','lon','zone'])$(id).addEventListener('change',rememberLocation);
restoreLocation();
const wallpaperPane=location.pathname.endsWith('/clock-pane.html');
const dialFlag=wallpaperPane?await flagPixels(new URLSearchParams(location.search).get('theme')):null;
const c=document.createElement('canvas');c.width=c.height=1024;const ctx=c.getContext('2d'),texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.flipY=false;
function backplate(lat){const key=lat.toFixed(4);if(lastPlate===key)return;lastPlate=key;const n=1024,R=1.6,phi=lat*Math.PI/180,im=ctx.createImageData(n,n);for(let j=0;j<n;j++)for(let i=0;i<n;i++){let x=(i/n-.5)*2*R,y=(.5-j/n)*2*R,r2=x*x+y*y,sdec=(r2-1)/(r2+1),cdec=2*Math.sqrt(r2)/(r2+1),cosH=r2?y/Math.sqrt(r2):0,alt=Math.asin(Math.max(-1,Math.min(1,Math.sin(phi)*sdec+Math.cos(phi)*cdec*cosH)))*180/Math.PI,col=(r2<.6565*.6565||alt>=0)?[8,24,92]:alt>=-18?[158,19,53]:[5,7,14],k=4*(j*n+i);if(dialFlag&&(r2<.6565*.6565||alt>=0)){im.data.set([dialFlag[k],dialFlag[k+1],dialFlag[k+2],255],k)}else im.data.set([...col,255],k)}ctx.putImageData(im,0,0);ctx.strokeStyle='#bca565';ctx.lineWidth=2;function path(points){ctx.beginPath();points.forEach(([x,y],i)=>{const X=512+x/R*512,Y=512-y/R*512;i?ctx.lineTo(X,Y):ctx.moveTo(X,Y)});ctx.stroke()}for(const r of [.6565,1,1.5235]){ctx.beginPath();ctx.arc(512,512,r/R*512,0,Math.PI*2);ctx.stroke()}ctx.strokeStyle='#6ab8c6';for(let k=1;k<12;k++){let pts=[];for(let d=-23.44;d<=23.44;d+=.25){let r=Math.tan(Math.PI/4+d*Math.PI/360),q=-Math.tan(phi)*Math.tan(d*Math.PI/180);if(Math.abs(q)>1)continue;let H=Math.acos(q),a=-H+k*2*H/12;pts.push([r*Math.sin(a),r*Math.cos(a)])}path(pts)}path([[0,-R],[0,R]]);texture.needsUpdate=true;}
function partKey(name){return name.toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^moonnhand$/,'moonhand')}
function part(name){return parts[name]||parts[name.replaceAll(' ','_')]||parts[partKey(name)]}

function addHourNumerals(){
 new FontLoader().load('./roman-font.json',font=>{
  const ring=new T.Group();ring.name='RomanHourNumerals';
  const roman=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  const material=new T.MeshStandardMaterial({color:0xffdc7d,metalness:.5,roughness:.18,emissive:0x99701c,emissiveIntensity:.3});
  for(let hour=0;hour<24;hour++){
   const geometry=new TextGeometry(roman[hour%12],{font,size:.20,depth:.007,curveSegments:8,bevelEnabled:true,bevelThickness:.0003,bevelSize:.0003,bevelSegments:2});
   geometry.computeBoundingBox();const box=geometry.boundingBox,w=box.max.x-box.min.x,h=box.max.y-box.min.y;
   geometry.translate(-(box.min.x+box.max.x)/2,-(box.min.y+box.max.y)/2,0);
   geometry.scale(Math.min(.84,.285/w),.205/h,1);
   const numeral=new T.Mesh(geometry,material),angle=(hour*15+180)*Math.PI/180;
   numeral.rotation.set(-Math.PI/2,0,-angle);numeral.position.set(1.385*Math.sin(angle),-.010,-1.385*Math.cos(angle));
   numeral.name='Hour_'+hour;ring.add(numeral);
  }
  model.add(ring);
 },undefined,e=>{$('message').textContent='Hour numerals could not load. Please reload.';console.error(e)});
}

function rebuildBohemianRing(){
 const old=part('Bohemia RINg');if(old)old.visible=false;
 const ring=new T.Group();ring.name='BohemianHourRing';
 const gold=new T.MeshStandardMaterial({color:0xe6c56c,metalness:.65,roughness:.32});
 const band=new T.Mesh(new T.RingGeometry(1.61,1.91,160),new T.MeshBasicMaterial({color:0x000000,side:T.DoubleSide}));
 band.rotation.x=-Math.PI/2;band.position.y=.011;ring.add(band);
 for(const radius of [1.61,1.91]){
  const border=new T.Mesh(new T.TorusGeometry(radius,.012,10,160),gold);
  border.rotation.x=-Math.PI/2;border.position.y=.023;ring.add(border);
 }
 model.add(ring);parts['Bohemia RINg']=ring;
 new FontLoader().load('./number-font.json',font=>{
  for(let hour=1;hour<=24;hour++){
   const geometry=new TextGeometry(String(hour),{font,size:.17,depth:.018,curveSegments:8,bevelEnabled:true,bevelThickness:.001,bevelSize:.001,bevelSegments:2});
   geometry.computeBoundingBox();const b=geometry.boundingBox,w=b.max.x-b.min.x,h=b.max.y-b.min.y;
   geometry.translate(-(b.min.x+b.max.x)/2,-(b.min.y+b.max.y)/2,0);geometry.scale(Math.min(1,.25/w),.17/h,1);
   const numeral=new T.Mesh(geometry,gold),angle=(hour%24)*Math.PI/12;
   numeral.rotation.set(-Math.PI/2,0,-angle);numeral.position.set(1.755*Math.sin(angle),.014,-1.755*Math.cos(angle));
   numeral.name='BohemianHour_'+hour;ring.add(numeral);
  }
 },undefined,e=>{$('message').textContent='Bohemian numbers could not load. Please reload.';console.error(e)});
}

let earthMap,earthPen,earthLand,earthKey='';
function addCentralEarth(){
 const canvas=document.createElement('canvas');canvas.width=canvas.height=768;earthPen=canvas.getContext('2d');earthMap=new T.CanvasTexture(canvas);earthMap.colorSpace=T.SRGBColorSpace;
 const globe=new T.Mesh(new T.PlaneGeometry(.8753333333,.8753333333),new T.MeshBasicMaterial({map:earthMap,transparent:true,depthWrite:false,side:T.DoubleSide}));
 globe.name='CentralEarthAtlas';globe.rotation.x=-Math.PI/2;globe.position.y=-.008;model.add(globe);
 fetch('./land.json').then(r=>{if(!r.ok)throw Error('Atlas unavailable');return r.json()}).then(data=>{earthLand=data;earthKey=''}).catch(e=>{$('message').textContent=e.message});
}
function updateCentralEarth(lat,lon){
 if(!earthMap||!earthLand)return;const key=lat.toFixed(4)+','+lon.toFixed(4);if(key===earthKey)return;earthKey=key;
 const pen=earthPen,phi=lat*Math.PI/180,lon0=lon*Math.PI/180;
 function project(lon,lat){const p=lat*Math.PI/180,d=lon*Math.PI/180-lon0;return [384+370*Math.cos(p)*Math.sin(d),384-370*(Math.cos(phi)*Math.sin(p)-Math.sin(phi)*Math.cos(p)*Math.cos(d)),Math.sin(phi)*Math.sin(p)+Math.cos(phi)*Math.cos(p)*Math.cos(d)]}
 pen.clearRect(0,0,768,768);pen.save();pen.beginPath();pen.arc(384,384,370,0,Math.PI*2);pen.fillStyle='#286799';pen.fill();pen.clip();
 pen.fillStyle='#c8b579';pen.strokeStyle='#ead291';pen.lineWidth=1.5;
 for(const polygon of earthLand){const points=polygon.map(p=>project(...p)).filter(p=>p[2]>=0);if(points.length<3)continue;pen.beginPath();points.forEach(([x,y],i)=>i?pen.lineTo(x,y):pen.moveTo(x,y));pen.closePath();pen.fill();pen.stroke()}
 pen.strokeStyle='#81a5b3';pen.lineWidth=1;
 function line(points){pen.beginPath();let drawing=false;for(const [x,y,v]of points){if(v<0){drawing=false;continue}drawing?pen.lineTo(x,y):pen.moveTo(x,y);drawing=true}pen.stroke()}
 for(let lat=-60;lat<=60;lat+=30){const points=[];for(let lon=-180;lon<=180;lon++)points.push(project(lon,lat));line(points)}
 for(let lon=-180;lon<180;lon+=30){const points=[];for(let lat=-90;lat<=90;lat++)points.push(project(lon,lat));line(points)}
 pen.restore();pen.beginPath();pen.arc(384,384,370,0,Math.PI*2);pen.strokeStyle='#d8b967';pen.lineWidth=10;pen.stroke();
 pen.beginPath();pen.arc(384,384,6,0,Math.PI*2);pen.fillStyle='#fff4d4';pen.fill();earthMap.needsUpdate=true;
}
let variableHourLabels=[],variableHourLatitude=null;
function addVariableHourLabels(){
 const group=new T.Group();group.name='VariableHourNumbers';
 for(let hour=1;hour<=12;hour++){
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=160;
  const pen=canvas.getContext('2d');pen.font='104px Arial, sans-serif';pen.textAlign='center';pen.textBaseline='middle';pen.fillStyle='#000000';pen.fillText(String(hour),96,84);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;
  const label=new T.Mesh(new T.PlaneGeometry(.17,.142),new T.MeshBasicMaterial({map,transparent:true,depthWrite:false,side:T.DoubleSide}));
  label.rotation.x=-Math.PI/2;label.position.y=-.007;label.name='VariableHour_'+hour;variableHourLabels.push(label);group.add(label);
 }
 model.add(group);
}
function updateVariableHourLabels(lat){
 if(!variableHourLabels.length||lat===variableHourLatitude)return;variableHourLatitude=lat;
 const r=1.115,decl=2*Math.atan(r)-Math.PI/2,q=-Math.tan(lat*Math.PI/180)*Math.tan(decl);
 const visible=Math.abs(q)<=1,H=Math.acos(Math.max(-1,Math.min(1,q)));
 variableHourLabels.forEach((label,i)=>{label.visible=visible;const angle=-H+(i+.65)*2*H/12;label.position.x=r*Math.sin(angle);label.position.z=-r*Math.cos(angle)});
}
function addGoldPointingHand(){
 const map=new T.TextureLoader().load('./gold-compact-hand.png');map.colorSpace=T.SRGBColorSpace;
 const hand=new T.Mesh(new T.PlaneGeometry(.135,.18),new T.MeshBasicMaterial({map,color:new T.Color().setRGB(1.9,1.75,1.2),toneMapped:false,transparent:true,depthWrite:false,side:T.DoubleSide}));
 hand.name='GoldHumanHand';hand.position.y=.038;model.add(hand);parts['GoldHumanHand']=hand;
}
function addSunRays(){
 const rays=new T.Group();rays.name='SunRays';
 const material=new T.MeshStandardMaterial({color:0xffdf32,metalness:.5,roughness:.15,emissive:0xffc400,emissiveIntensity:.45});
 for(let i=0;i<16;i++){
  const angle=i*Math.PI/8,length=i%2?.026:.043;
  const ray=new T.Mesh(new T.ConeGeometry(.008,length,4),material);
  ray.rotation.set(-Math.PI/2,0,0);ray.rotateOnWorldAxis(new T.Vector3(0,1,0),-angle);
  const r=.066+length/2;ray.position.set(r*Math.sin(angle),0,-r*Math.cos(angle));rays.add(ray);
 }
 rays.position.y=.068;model.add(rays);parts['SunRays']=rays;
}
function refineZodiac(){
 const disk=part('AStroDISK');
 if(disk)disk.traverse(o=>{
  if(!o.isMesh||!o.material.map)return;
  const original=o.material.map,image=original.image;
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const pen=canvas.getContext('2d');pen.fillStyle='#303030';pen.fillRect(0,0,canvas.width,canvas.height);pen.drawImage(image,0,0);
  const pixels=pen.getImageData(0,0,canvas.width,canvas.height),mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
  const maskPen=mask.getContext('2d'),relief=maskPen.createImageData(mask.width,mask.height),finish=document.createElement('canvas');finish.width=mask.width;finish.height=mask.height;const finishPen=finish.getContext('2d'),roughness=finishPen.createImageData(mask.width,mask.height);
  // The gold pigment alone gets relief and metallic reflections. Gray remains flat.
  for(let i=0;i<pixels.data.length;i+=4){const r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];const gold=Math.max(0,Math.min(1,(Math.min(r-b,g-b)-18)/70));const value=Math.round(gold*255);relief.data.set([value,value,value,255],i);const rough=Math.round((.5-.28*gold)*255);roughness.data.set([rough,rough,rough,255],i)}
  maskPen.putImageData(relief,0,0);finishPen.putImageData(roughness,0,0);
  const bevel=document.createElement('canvas');bevel.width=mask.width;bevel.height=mask.height;const bevelPen=bevel.getContext('2d');bevelPen.filter='blur(1px)';bevelPen.drawImage(mask,0,0);
  const textureFor=(source,color=false)=>{const map=new T.CanvasTexture(source);map.flipY=original.flipY;map.channel=original.channel;map.offset.copy(original.offset);map.repeat.copy(original.repeat);map.rotation=original.rotation;map.center.copy(original.center);map.wrapS=original.wrapS;map.wrapT=original.wrapT;if(color)map.colorSpace=T.SRGBColorSpace;return map};
  const material=o.material.clone();material.map=textureFor(canvas,true);material.bumpMap=textureFor(bevel);material.bumpScale=.004;material.metalnessMap=textureFor(mask);material.metalness=.72;material.roughnessMap=textureFor(finish);material.roughness=1;material.emissive.set(0xffcc44);material.emissiveMap=textureFor(mask,true);material.emissiveIntensity=.06;material.needsUpdate=true;o.material=material;
 });
 const wheel=part('mONTH dISK');
 if(wheel)wheel.traverse(o=>{
  if(!o.isMesh||o.material.name!=='Material.001')return;
  const geometry=o.geometry,index=geometry.index,positions=geometry.attributes.position;
  const bright=new T.MeshStandardMaterial({color:0xffdf32,metalness:.62,roughness:.1,emissive:0xffc400,emissiveIntensity:.32,side:T.DoubleSide});
  // The star is joined to the wheel mesh. Assign just its triangles a second
  // material; leave the wheel borders and spokes in their existing finish.
  const starBounds=new T.Box3(),vertex=new T.Vector3();
  const count=index?index.count:positions.count;geometry.clearGroups();let start=0,last=-1;
  for(let i=0;i<count;i+=3){let x=0,z=0;for(let j=0;j<3;j++){const v=index?index.getX(i+j):i+j;x+=positions.getX(v)/3;z+=positions.getZ(v)/3}
   const material=x < -1.16 && Math.abs(z)<.12?1:0;
   if(material===1)for(let j=0;j<3;j++){const v=index?index.getX(i+j):i+j;starBounds.expandByPoint(vertex.fromBufferAttribute(positions,v))}
   if(material!==last){if(last!==-1)geometry.addGroup(start,i-start,last);start=i;last=material}
  }
  geometry.addGroup(start,count-start,last);o.material=[o.material,bright];
  if(!starBounds.isEmpty()){const marker=new T.Mesh(new T.BoxGeometry(...starBounds.getSize(new T.Vector3()).toArray()),new T.MeshBasicMaterial({visible:false}));marker.name="StarPointerGuide";marker.position.copy(starBounds.getCenter(new T.Vector3()));marker.raycast=()=>{};o.add(marker);parts.StarPointerGuide=marker;}
 });
}
new GLTFLoader().load('./clock.glb?v=3',g=>{model=g.scene;scene.add(model);model.traverse(o=>{if(o.name){parts[o.name]=o;parts[partKey(o.name)]=o}});for(const o of model.children)if(/^(LINE|Circle|Cylinder)/.test(o.name))o.visible=false;for(const name of ['AStroDISK','mONTH dISK']){const o=part(name);if(o)o.position.z=0}for(const name of ['Sun Hand','Moon Hand']){const hand=part(name);if(hand)hand.traverse(o=>{if(o.isMesh)o.material=new T.MeshStandardMaterial({color:0x9aa4b2,metalness:.8,roughness:.24,side:T.DoubleSide})})};const sun=part('Sun Spere');if(sun)sun.traverse(o=>{if(o.isMesh)o.material=new T.MeshStandardMaterial({color:0xffdf32,metalness:.62,roughness:.1,emissive:0xffc400,emissiveIntensity:.32,side:T.DoubleSide})});const plate=part('Sun Disk');if(plate)plate.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.map=texture;o.material.needsUpdate=true}});const moon=part('Moon SPhere');if(moon)moon.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.userData.moonPhaseDirection=new T.Vector3(0,1,0);o.material.onBeforeCompile=s=>{s.uniforms.moonLightDirection={value:o.userData.moonPhaseDirection};s.vertexShader='varying vec3 moonWorldNormal;\n'+s.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nmoonWorldNormal = normalize(inverseTransformDirection(normalMatrix * objectNormal, viewMatrix));');s.fragmentShader='uniform vec3 moonLightDirection; varying vec3 moonWorldNormal;\n'+s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat lit = smoothstep(-0.015,0.015,dot(normalize(moonWorldNormal),moonLightDirection)); diffuseColor.rgb *= mix(0.035,1.0,lit);')};o.material.needsUpdate=true}});addHourNumerals();rebuildBohemianRing();addCentralEarth();addVariableHourLabels();addGoldPointingHand();addSunRays();refineZodiac();$('loading').remove();window.clockReady=true;if(explaining)selectGuide(selectedPart||'time')},undefined,e=>{$('loading').textContent='Unable to load the clock. Please reload.';console.error(e)});

let explaining=false,selectedPart=null,highlight=null,highlightTarget=null,lastGuideKey="";
const referenceCircles={cancer:1.5235,equator:1,capricorn:.6565};
const guide={
 cancer:{title:'Tropic of Cancer · outer circle',text:'This is the Sun’s northern seasonal limit: about +23.44° declination. On this projection it is the largest of the three reference circles. The Sun approaches it at the June solstice, when days are longest in the supported northern locations. It marks a celestial latitude, not a physical orbit around Earth.',names:[]},
 equator:{title:'Celestial equator · middle circle',text:'This circle represents 0° declination: Earth’s equator projected onto the sky. The Sun crosses it at the March and September equinoxes. Outside this circle the Sun is north of the celestial equator; inside it the Sun is south. Its radius is the reference unit used to build the dial.',names:[]},
 capricorn:{title:'Tropic of Capricorn · inner circle',text:'This is the Sun’s southern seasonal limit: about −23.44° declination. It is the smallest of the three reference circles. The Sun approaches it at the December solstice, when days are shortest in the supported northern locations. The blue area inside it surrounds the atlas; it does not mean that region is always daylight.',names:[]},
 time:{title:'Gold hand & ordinary time',text:'The gold hand reads the Roman hour scale: one full turn is 24 hours, with XII marking noon and midnight. Why do the numerals shift? The Sun and zodiac follow the sky at your exact longitude, while ordinary clocks follow a shared time zone. Solar noon therefore does not always happen at 12:00 on your clock. A smaller seasonal difference also comes from Earth’s orbit and tilted axis. For locations outside Prague, this model rotates the Roman scale so the gold hand reads local clock time while the astronomical parts remain aligned. The daylight-saving option adds the summer-time adjustment to that scale. Prague is the fixed reference: its XII marks stay at the top and bottom, and the astronomical layer is calibrated to Central European standard time. Like the real Prague astronomical dial, it stays on CET year-round; the digital readout still shows local civil time.',names:['GoldHumanHand','Sun Hand','RomanHourNumerals']},
 sun:{title:'The Sun',text:'The gold Sun follows its arm and moves inward and outward through the year. It is nearest the Capricorn circle in northern winter and nearest the Cancer circle in northern summer. Its position against the colored background shows day, twilight, or night.',names:['Sun Spere','SunRays']},
 moon:{title:'The Moon',text:'The Moon has its own hand and motion across the dial. Its distance from the center reflects its declination. Its light and dark face shows the modeled lunar phase.',names:['Moon SPhere','Moon Hand']},
 star:{title:'Star pointer · sidereal time',text:'The bright gold star marks the Aries point, where Pisces meets Aries on the zodiac ring. This is the March equinox: the Sun’s northward crossing of the celestial equator, rather than an individual star. The pointer turns with the zodiac ring and tracks sidereal time, Earth’s rotation relative to the equinox. One turn takes about 23 hours 56 minutes 4 seconds, so it gains almost four minutes on ordinary clock time each day. Local sidereal time tells you which right ascension is crossing your meridian, the north–south line through the sky.',names:['StarPointerGuide']},
 zodiac:{title:'The zodiac ring',text:'This ring shows the Sun’s yearly path, divided into twelve seasonal zodiac signs. The sign beneath the Sun is a newborn’s Western Sun sign. When facing south, west is to your right and east to your left; due south does not mean directly overhead. These signs differ from modern constellations because of precession. The live reading below follows your selected time and location.',names:['AStroDISK','mONTH dISK']},
 background:{title:'Daylight, twilight & night',text:'Outside the inner blue circle, blue represents the sky above the horizon, red represents twilight down to 18° below the horizon, and black represents deeper night. The boundaries change with latitude. The circle inside Capricorn stays blue around the Earth atlas.',names:['Sun Disk']},
 hours:{title:'Twelve unequal daylight hours',text:'The curved blue lines divide sunrise to sunset into twelve equal parts for that day. These “hours” are longer in summer and shorter in winter. The black numbers label them. Follow the Sun to see which daylight hour it occupies.',names:['VariableHourNumbers']},
 bohemian:{title:'Hours counted from sunset',text:'The outer black-and-gold ring is the Bohemian hour scale. Its day begins at sunset, rather than midnight. The ring adjusts with the seasonal sunset hour angle, and the gold hand reads against its 1–24 numbers.',names:['BohemianHourRing']},
 earth:{title:'Earth at the center',text:'The atlas puts the selected location at the center of the globe. Change locations to see the Earth from another viewpoint. The central dot marks the selected coordinates; the atlas is a geographic illustration, not a moving planet indicator.',names:['CentralEarthAtlas']}
};
function guideTarget(key){if(!model)return null;for(const name of guide[key].names){const object=part(name)||model.getObjectByName(name);if(object)return object}return null}
function selectGuide(key){selectedPart=key;const item=guide[key];$('explainTitle').textContent=item.title;$('explainText').textContent=item.text;$('guideChoice').value=key;if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null}highlightTarget=guideTarget(key);if(referenceCircles[key]&&model){
 const points=Array.from({length:192},(_,i)=>{const angle=i*2*Math.PI/192,r=referenceCircles[key];return model.localToWorld(new T.Vector3(r*Math.sin(angle),.04,-r*Math.cos(angle)))});
 highlight=new T.LineLoop(new T.BufferGeometry().setFromPoints(points),new T.LineBasicMaterial({color:0x8de6ff,depthTest:false,transparent:true,opacity:.95}));highlight.renderOrder=1000;scene.add(highlight);
 }else if(highlightTarget){highlight=new T.BoxHelper(highlightTarget,0x8de6ff);highlight.material.depthTest=false;highlight.material.transparent=true;highlight.material.opacity=.85;highlight.renderOrder=1000;scene.add(highlight)}updateGuideValue();}
function updateGuideValue(){
 if(!explaining||!selectedPart||!window.clockState)return;
 const key=[selectedPart,Math.floor(+instant/1000),$('lat').value,$('lon').value,$('zone').value,$('location').value,$('dst').checked].join('|');
 if(key===lastGuideKey)return;lastGuideKey=key;
 const values=interpretClock({a:window.clockState,date:instant,lat:Number($('lat').value),lon:Number($('lon').value),zone:$('zone').value,place:$('place').textContent,standardOffset:standard(),civilOffset:offset(instant),useDST:$('dst').checked,pragueDial:isPragueDial(Number($('lat').value),Number($('lon').value),$('zone').value)});
 $('explainValue').textContent=values[selectedPart];
}
function setLearning(enabled){
 explaining=enabled;
 for(const id of ['explainToggle','learnView']){$(id).classList.toggle('active',enabled);$(id).setAttribute('aria-pressed',String(enabled))}
 $('controlsView').classList.toggle('active',!enabled);$('controlsView').setAttribute('aria-pressed',String(!enabled));
 $('controlsPanel').hidden=enabled;$('explainPanel').hidden=!enabled;$('menuBody').scrollTop=0;
 document.body.classList.toggle('explaining',enabled);
 if(enabled)selectGuide(selectedPart||'time');
 else if(highlight){scene.remove(highlight);highlight.geometry.dispose();highlight.material.dispose();highlight=null;highlightTarget=null}
}
$('explainToggle').onclick=()=>{setLearning(true);if(window.matchMedia?.('(max-width:800px)').matches)$('learnView').scrollIntoView({block:'start',behavior:'smooth'})};
$('learnView').onclick=()=>setLearning(true);
$('controlsView').onclick=()=>setLearning(false);
$('guideChoice').onchange=()=>selectGuide($('guideChoice').value);
// A shared link takes precedence over the remembered place and opens paused.
const sharedMoment=new URLSearchParams(window.location.search).get('desktop')==='1'?null:readMoment(window.location.search);
if(sharedMoment){
 const saved=locations[sharedMoment.location],matches=saved&&Math.abs(saved[1]-sharedMoment.lat)<.00001&&Math.abs(saved[2]-sharedMoment.lon)<.00001&&saved[3]===sharedMoment.zone;
 $('location').value=matches?sharedMoment.location:'custom';$('lat').value=sharedMoment.lat;$('lon').value=sharedMoment.lon;$('zone').value=sharedMoment.zone;acceptedLatitude=sharedMoment.lat;instant=sharedMoment.date;$('dst').checked=sharedMoment.useDST;mode(false);rememberLocation();
 if(sharedMoment.part){$('explainToggle').onclick();selectGuide(sharedMoment.part)}
}else if(new URLSearchParams(window.location.search).has('at')&&new URLSearchParams(window.location.search).get('desktop')!=='1')$('message').textContent='That shared moment has invalid time or location details. Showing your usual clock instead.';
$('locationDetails').open=$('location').value==='custom';
const hintKey='astronomical-clock.hint-dismissed';
try{$('firstVisitHint').hidden=localStorage.getItem(hintKey)==='1'}catch{$('firstVisitHint').hidden=false}
$('dismissHint').onclick=()=>{$('firstVisitHint').hidden=true;try{localStorage.setItem(hintKey,'1')}catch{}};
document.querySelectorAll('[data-demo]').forEach(button=>button.onclick=()=>{
 try{
  const value={lat:Number($('lat').value),lon:Number($('lon').value),zone:$('zone').value};if(!validLocation(value))throw Error('Choose a valid location before starting a demo.');
  const demo=demoMoment(button.dataset.demo,instant,value.lat,value.lon,value.zone);countEvent('demo-'+button.dataset.demo,'Start demo: '+button.textContent.trim());mode(false);instant=demo.date;localInput();$('speed').value='3600';demoEnd=+instant+86400000;playing=true;syncPlayback();$('demoDescription').textContent=demo.description+' One day plays in 24 seconds, then pauses.';$('message').textContent='';
  if(explaining)selectGuide(demo.part);$('firstVisitHint').hidden=true;try{localStorage.setItem(hintKey,'1')}catch{}
 }catch(error){$('message').textContent=error.message}
});
for(const id of ['datetime','back','backHour','forwardHour','forward'])$(id).addEventListener(id==='datetime'?'change':'click',()=>{demoEnd=null});
$('shareMoment').onclick=async()=>{
 try{
  const value={lat:Number($('lat').value),lon:Number($('lon').value),zone:$('zone').value};if(!validLocation(value))throw Error('Choose a valid location before sharing.');
  mode(false);
  const link=momentURL(window.location.href,{...value,date:instant,location:$('location').value,useDST:$('dst').checked,part:explaining?selectedPart:null});
  countEvent('share-moment','Share This Moment');$('shareLink').value=link;$('shareFallback').hidden=true;
  try{await navigator.clipboard.writeText(link);$('shareStatus').textContent='Link copied. It opens this location and time, paused.'}
  catch{$('shareFallback').hidden=false;$('shareLink').focus();$('shareLink').select();$('shareStatus').textContent='Copy the link below. It opens this location and time, paused.'}
 }catch(error){$('shareStatus').textContent=error.message}
};
const pickingRay=new T.Raycaster(),pickingPoint=new T.Vector2();let pressPoint=null;
renderer.domElement.addEventListener('pointerdown',e=>{pressPoint=[e.clientX,e.clientY]});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!explaining||!model||!pressPoint||Math.hypot(e.clientX-pressPoint[0],e.clientY-pressPoint[1])>6)return;
 const rect=renderer.domElement.getBoundingClientRect();pickingPoint.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);pickingRay.setFromCamera(pickingPoint,camera);
 for(const hit of pickingRay.intersectObject(model,true)){
  if(hit.face?.materialIndex===1&&Array.isArray(hit.object.material)&&partKey(hit.object.parent?.name||hit.object.name)===partKey('mONTH dISK')){selectGuide('star');return}
  let visible=true;for(let parent=hit.object;parent;parent=parent.parent)if(!parent.visible)visible=false;if(!visible)continue;
  for(let object=hit.object;object&&object!==model;object=object.parent){for(const [key,item]of Object.entries(guide)){if(item.names.some(name=>partKey(object.name)===partKey(name))){if(key==='background'){const local=model.worldToLocal(hit.point.clone()),r=Math.hypot(local.x,local.z);for(const [circle,radius] of Object.entries(referenceCircles)){if(Math.abs(r-radius)<.025){selectGuide(circle);return}}if(r>=.6565&&r<=1.5235){const decl=2*Math.atan(r)-Math.PI/2,q=-Math.tan(Number($('lat').value)*Math.PI/180)*Math.tan(decl);if(Math.abs(q)<=1){const H=Math.acos(q),angle=Math.atan2(hit.point.x,-hit.point.z),fraction=(angle+H)*12/(2*H),nearest=Math.round(fraction);if(nearest>=1&&nearest<=11&&Math.abs(fraction-nearest)*2*H/12*r<.025){selectGuide('hours');return}}}}selectGuide(key);return}}}
 }
});

const desktop=initDesktop({
 getPlace:()=>({location:$('location').value,lat:Number($('lat').value),lon:Number($('lon').value),zone:$('zone').value,dst:$('dst').checked?'1':'0'}),
 applyPlace:value=>{
  const preset=locations[value.location];
  if(preset){$('location').value=value.location;$('location').onchange()}
  else if(value.location==='custom'){
   const lat=Number(value.lat),lon=Number(value.lon);
   if(value.lat!==undefined&&value.lon!==undefined&&validLocation({lat,lon,zone:value.zone})){
    $('lat').value=lat;$('lon').value=lon;$('zone').value=value.zone;acceptedLatitude=lat;
   }
   $('location').value='custom';$('locationDetails').open=true;
  }
  if(value.dst!==undefined)$('dst').checked=value.dst!=='0';
  rememberLocation();localInput();
 },
 onMode:active=>{
  if(active){setLearning(false);mode(true);instant=new Date();controls.enableDamping=false;controls.reset();camera.position.set(0,7.4,0);controls.target.set(0,0,0);controls.update()}
  controls.enabled=!active;controls.enableDamping=!active;
  renderer.setPixelRatio(Math.min(devicePixelRatio,active?(wallpaperPane?1:1.5):2));resize();
 },
 onEvent:countEvent
});
let lastDesktopFrame=0;
function animate(now){requestAnimationFrame(animate);if(desktop.active){if(now-lastDesktopFrame<(wallpaperPane?100:50))return;lastDesktopFrame=now;}const dt=Math.min((now-previous)/1000,.25);previous=now;if(live)instant=new Date();else if(playing){instant=new Date(+instant+dt*+$('speed').value*1000);if(demoEnd!==null&&+instant>=demoEnd){instant=new Date(demoEnd);demoEnd=null;playing=false;syncPlayback();localInput()}}try{let lat=+$('lat').value,lon=+$('lon').value;if(!Number.isFinite(lat)||lat<1||lat>66||!Number.isFinite(lon)||Math.abs(lon)>180)throw Error('Use a latitude from 1° to 66° north and longitude from −180° to 180°.');const zone=$('zone').value,a=calculate(instant,lat,lon,standard());const dstShift=$('dst').checked?(offset(instant)-standard())*Math.PI/12:0;const prague=isPragueDial(lat,lon,zone),dial=displayDial(a,prague,dstShift);$('dst').disabled=prague;$('dstNote').hidden=!prague;if(model){for(const name of ['Sun Disk','VariableHourNumbers']){const layer=part(name)||model.getObjectByName(name);if(layer)layer.rotation.y=-dial.skyRotation}const hours=model.getObjectByName("RomanHourNumerals");if(hours)hours.rotation.y=dial.numeralRotation;}$('time').textContent=new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(instant);$('date').textContent=new Intl.DateTimeFormat('en-US',{timeZone:zone,dateStyle:'full'}).format(instant);$('place').textContent=locations[$('location').value]?.[0]||`${Math.abs(lat).toFixed(2)}° ${lat<0?"S":"N"}, ${Math.abs(lon).toFixed(2)}° ${lon<0?"W":"E"}`;$('decl').textContent=a.declination.toFixed(2)+'°';$('phase').textContent=Math.round(a.illumination*100)+'%';$('daylight').textContent=Math.floor(a.daylight)+'h '+Math.round((a.daylight%1)*60)+'m';if(model){const rays=part('SunRays');if(rays){rays.position.x=a.sunRadius*Math.sin(dial.sunAngle);rays.position.z=-a.sunRadius*Math.cos(dial.sunAngle)}const pointer=part('GoldHumanHand');if(pointer){pointer.rotation.set(-Math.PI/2,0,-dial.sunAngle);pointer.position.x=1.50*Math.sin(dial.sunAngle);pointer.position.z=-1.50*Math.cos(dial.sunAngle)}backplate(lat);updateCentralEarth(lat,lon);updateVariableHourLabels(lat);for(const name of ['AStroDISK','mONTH dISK']){let o=part(name);if(o)o.rotation.y=Math.PI-dial.zodiacAngle}for(const [name,angle]of [['Sun Hand',dial.sunAngle],['Moon Hand',dial.moonAngle],['Bohemia RINg',dial.sunsetAngle]]){let o=part(name);if(o)o.rotation.y=-angle}for(const [name,angle,r]of [['Sun Spere',dial.sunAngle,a.sunRadius],['Moon SPhere',dial.moonAngle,a.moonRadius]]){let o=part(name);if(o){o.position.x=r*Math.sin(angle);o.position.z=-r*Math.cos(angle)}}let moon=part('Moon SPhere');if(moon){const direction=moonLightVector(a.illumination,a.sunRadius*Math.sin(dial.sunAngle),-a.sunRadius*Math.cos(dial.sunAngle),a.moonRadius*Math.sin(dial.moonAngle),-a.moonRadius*Math.cos(dial.moonAngle));moon.traverse(o=>{if(o.userData.moonPhaseDirection)o.userData.moonPhaseDirection.set(...direction).transformDirection(model.matrixWorld)})}}window.clockState=a}catch(e){$('message').textContent=e.message}controls.update();if(explaining){if(highlight?.update)highlight.update();updateGuideValue()}desktop.updateReadout($('time').textContent,$('date').textContent,$('place').textContent);renderer.render(scene,camera)}requestAnimationFrame(animate);
