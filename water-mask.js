import * as THREE from './vendor/three.module.js';
// Tag only visible cockpit interior pixels, leaving the exterior hull to meet the sea.
export function installWaterOcclusion(hulls,sea){
 for(const mesh of hulls){mesh.renderOrder=-1;
  const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  if(!materials.some(m=>m.name==='gELcOAY'))continue;
  const material=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,colorWrite:false,depthWrite:false,stencilWrite:true,stencilRef:1,stencilFunc:THREE.AlwaysStencilFunc,stencilZPass:THREE.ReplaceStencilOp});
  material.onBeforeCompile=shader=>{shader.vertexShader='varying vec3 cockpitPosition;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ncockpitPosition=position;');shader.fragmentShader='varying vec3 cockpitPosition;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(cockpitPosition.x < -2.70 || cockpitPosition.x > -1.20 || abs(cockpitPosition.z)>0.36) discard;');};
  material.customProgramCacheKey=()=> 'cockpit-stencil-v2';
  const mask=new THREE.Mesh(mesh.geometry,material);mask.name='CockpitWaterStencil';mask.renderOrder=-.5;mesh.add(mask);
 }
 sea.material.stencilWrite=true;sea.material.stencilRef=1;sea.material.stencilFunc=THREE.NotEqualStencilFunc;sea.material.stencilFail=sea.material.stencilZFail=sea.material.stencilZPass=THREE.KeepStencilOp;
}
