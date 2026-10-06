import * as THREE from './vendor/three.module.js';
export function addYachtClub(scene){
 const club=new THREE.Group();club.name='Island Heights Yacht Club · stylized';club.position.set(170,0,-170);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.85});const shingle=mat(0x9c9386),trim=mat(0xece2c9),roof=mat(0x485c50),wood=mat(0x806548),glass=mat(0x344e5b);
 const box=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);club.add(o);return o};
 const shore=new THREE.Mesh(new THREE.CylinderGeometry(48,52,1.5,48),mat(0x6c8250));shore.scale.z=.65;shore.position.set(0,.15,13);club.add(shore);
 box(38,1.2,24,0,1,0,wood);box(29,9,17,0,6,3,shingle);
 const top=new THREE.Mesh(new THREE.ConeGeometry(22,5,4),roof);top.rotation.y=Math.PI/4;top.scale.z=.65;top.position.set(0,13,3);club.add(top);
 box(36,.65,5,0,6,-8,trim);box(36,.4,5,0,2,-8,trim);
 for(let x=-17;x<=17;x+=4.25){box(.3,4, .3,x,4,-10,trim);box(.28,3,.28,x,8,-10,trim)}
 for(const y of [6.4,9.4]){box(36,.22,.22,0,y,-10,trim);box(36,.18,.18,0,y-1,-10,trim)}
 for(let x=-12;x<=12;x+=4){box(2.2,2.4,.18,x,8, -5.6,glass);box(2.5,.16,.25,x,9.3,-5.8,trim);box(.12,2.4,.25,x,8,-5.8,trim)}
 box(4,.7,31,12,.9,-26,wood);for(let z=-38;z<-11;z+=6)box(.4,2,.4,14,0,z,wood);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,17,8),trim);pole.position.set(-21,9,-9);club.add(pole);
 const flag=new THREE.Mesh(new THREE.PlaneGeometry(4,2,16,4),new THREE.MeshBasicMaterial({color:0xd94243,side:THREE.DoubleSide}));flag.position.set(2,0,0);const flagPivot=new THREE.Group();flagPivot.name='Yacht club wind flag';flagPivot.position.set(-21,16,-9);flagPivot.add(flag);club.add(flagPivot);club.userData.windFlag=flagPivot;
 for(let i=0;i<5;i++){const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.5,.7,6,6),wood);trunk.position.set(-30+i*14,3,26);club.add(trunk);const tree=new THREE.Mesh(new THREE.ConeGeometry(5,11,7),mat(0x355d3d));tree.position.set(-30+i*14,10,26);club.add(tree)}
 scene.add(club);return club;
}
export function createPuffVisuals(scene){
 const geometry=new THREE.PlaneGeometry(2,2);geometry.rotateX(-Math.PI/2);
 const puffs=Array.from({length:12},()=>{const material=new THREE.MeshBasicMaterial({color:0x003858,transparent:true,opacity:.2,depthWrite:false,side:THREE.DoubleSide,stencilWrite:true,stencilRef:1,stencilFunc:THREE.NotEqualStencilFunc});material.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= 1.0-smoothstep(0.12,0.5,length(vMapUv-vec2(0.5)));\n#include <opaque_fragment>');};
 // A tiny white map enables the standard UV varying for the soft edge.
 const map=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);map.needsUpdate=true;material.map=map;
 const mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=2;scene.add(mesh);return mesh});
 return patches=>patches.forEach((p,i)=>{const mesh=puffs[i];mesh.position.set(p.x,.09,p.z);mesh.scale.set(p.radiusX,1,p.radiusZ);mesh.rotation.y=-p.angle;mesh.material.opacity=.21+.16*p.power});
}

export function addCommitteeBoat(scene){
 const root=new THREE.Group();root.name='Committee boat';
 const navy=new THREE.MeshStandardMaterial({color:0x173f62,roughness:.4}),cream=new THREE.MeshStandardMaterial({color:0xf2eee0,roughness:.6}),glass=new THREE.MeshStandardMaterial({color:0x33576b,roughness:.2,metalness:.25}),teak=new THREE.MeshStandardMaterial({color:0x9a643b,roughness:.8});
 const box=(name,w,h,d,x,y,z,material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.name=name;mesh.position.set(x,y,z);root.add(mesh);return mesh};
 // Flared Downeast hull: broad transom, fine raised bow, and a lower V-shaped bottom.
 const stations=[[-3.5,1.12,.65,-.45],[-2.4,1.3,.68,-.55],[0,1.28,.72,-.55],[1.8,.95,.85,-.34],[2.9,.45,1.02,.05],[3.45,.025,1.12,.5]],vertices=[],indices=[];
 for(const [x,w,top,bottom]of stations)vertices.push(x,top,w,x,bottom,w*.56,x,bottom,-w*.56,x,top,-w);
 for(let i=0;i<stations.length-1;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=(i+1)*4+(j+1)%4,d=(i+1)*4+j;indices.push(a,b,d,b,c,d)}
 indices.push(0,3,1,1,3,2,20,21,23,21,22,23);
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setIndex(indices);geometry.computeVertexNormals();const hull=new THREE.Mesh(geometry,navy);hull.name='Downeast flared hull';root.add(hull);
 // Cream deck follows the sheer instead of a rectangular barge outline.
 const deck=new THREE.Shape();stations.forEach(([x,w],i)=>i?deck.lineTo(x,w):deck.moveTo(x,w));for(const [x,w]of [...stations].reverse())deck.lineTo(x,-w);deck.closePath();const deckGeo=new THREE.ShapeGeometry(deck);deckGeo.rotateX(Math.PI/2);const dp=deckGeo.attributes.position;for(let i=0;i<dp.count;i++){const x=dp.getX(i);let y=.65;for(let j=0;j<stations.length-1;j++)if(x>=stations[j][0]&&x<=stations[j+1][0]){const t=(x-stations[j][0])/(stations[j+1][0]-stations[j][0]);y=stations[j][2]+t*(stations[j+1][2]-stations[j][2])}dp.setY(i,y+.015)}deckGeo.computeVertexNormals();const deckMesh=new THREE.Mesh(deckGeo,new THREE.MeshStandardMaterial({color:0xf2eee0,side:THREE.DoubleSide}));deckMesh.name='Raised sheer deck';root.add(deckMesh);
 box('Teak aft cockpit',2.35,.06,1.8,-2.1,.73,0,teak);
 box('Wheelhouse',2.4,1.25,1.95,.35,1.4,0,cream);
 for(const side of [-1,1]){box('Side window',1.7,.63,.035,.35,1.66,side*.99,glass);box('Cockpit coaming',2.6,.35,.1,-2,.85,side*1.12,cream)}
 const windshield=box('Raked windscreen',.055,.68,1.7,1.58,1.68,0,glass);windshield.rotation.z=.13;
 box('Wheelhouse roof',3.25,.17,2.25,.15,2.09,0,cream);box('Aft canopy',1.8,.12,2.1,-2.15,2.06,0,cream);
 for(const z of [-.94,.94])box('Canopy support',.07,1.2,.07,-2.95,1.4,z,cream);
 box('Bow rail',1.05,.08,.06,2.4,1.23,0,cream);
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,2.9,8),cream);pole.position.set(-.3,3.5,0);root.add(pole);
 const flag=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.65),new THREE.MeshBasicMaterial({color:0xf3df37,side:THREE.DoubleSide}));flag.position.set(.3,4.6,0);root.add(flag);
 scene.add(root);return root;
}

export function addCoastalLandmarks(scene){
 const timber=new THREE.MeshStandardMaterial({color:0x996547,roughness:.85}),white=new THREE.MeshStandardMaterial({color:0xefe7d7,roughness:.6}),steel=new THREE.MeshStandardMaterial({color:0x52778a,metalness:.25,roughness:.5});
 const boardwalk=new THREE.Group();boardwalk.position.set(145,0,201);scene.add(boardwalk);
 const box=(w,h,d,x,y,z,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);boardwalk.add(o);return o};
 box(32,.6,9,0,2,0,timber);for(const x of [-14,-7,0,7,14])for(const z of [-3,3])box(.5,4,.5,x,.5,z,timber);
 const wheel=new THREE.Group();wheel.position.set(0,13,0);wheel.rotation.y=Math.PI/2;boardwalk.add(wheel);const rotor=new THREE.Group();wheel.add(rotor);
 for(const radius of [9,10]){const ring=new THREE.Mesh(new THREE.TorusGeometry(radius,.18,6,48),white);rotor.add(ring)}
 const cabins=[];for(let i=0;i<12;i++){const a=i*Math.PI/6,spoke=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,10,6),steel);spoke.position.set(5*Math.cos(a),5*Math.sin(a),0);spoke.rotation.z=a-Math.PI/2;rotor.add(spoke);const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.8,1.3),new THREE.MeshStandardMaterial({color:[0xf26739,0xe6bc35,0x37a7b5,0xb73562][i%4],roughness:.6}));cabin.position.set(10*Math.cos(a),10*Math.sin(a),0);rotor.add(cabin);cabins.push(cabin)}
 for(const z of [-2,2]){const leg=new THREE.Mesh(new THREE.CylinderGeometry(.25,.35,12,8),steel);leg.position.set(0,6,z);leg.rotation.x=z>0?.22:-.22;boardwalk.add(leg)}
 for(const x of [-11,11]){box(5,3.5,6,x,4,0,new THREE.MeshStandardMaterial({color:x<0?0xf2c386:0x72b6b3,roughness:.8}));box(5.7,.6,6.7,x,6,0,white)}
 const ferry=addCommitteeBoat(scene);ferry.name='Distant coastal ferry';ferry.position.set(195,0,-125);ferry.scale.set(2.8,1.6,2.2);ferry.rotation.y=.7;
 return time=>{rotor.rotation.z=time*.035;for(const cabin of cabins)cabin.rotation.z=-rotor.rotation.z;ferry.position.y=.12*Math.sin(time*1.2)};
}

export function updateYachtClubWind(club,time,wind,strength=12){const pivot=club.userData.windFlag;if(!pivot)return;pivot.rotation.y=-(wind*Math.PI/180+Math.PI);const flag=pivot.children[0],p=flag.geometry.attributes.position;for(let i=0;i<p.count;i++){const along=(p.getX(i)+2)/4;p.setZ(i,Math.sin(time*3.8+along*7)*along*.22*Math.min(1,strength/8))}p.needsUpdate=true;flag.geometry.computeBoundingSphere();}
