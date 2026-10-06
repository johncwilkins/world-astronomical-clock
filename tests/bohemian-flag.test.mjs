import test from 'node:test';
import assert from 'node:assert/strict';
import {flagNumberColors} from '../bohemian-flag.js';
function colors(rgb){const p=new Uint8ClampedArray(4*32*32);for(let i=0;i<p.length;i+=4)p.set([...rgb,255],i);return flagNumberColors(p,32,16,16)}
test('yellow and white flag areas use dark numerals with a light outline',()=>{
 for(const rgb of [[255,215,0],[255,255,255]])assert.deepEqual(colors(rgb),{color:0x111111,outline:0xffffff});
});
test('dark blue flag areas retain gold numerals with a dark outline',()=>{
 assert.deepEqual(colors([0,20,100]),{color:0xffe09b,outline:0x111111});
});
test('mid-tone flag areas can use white when gold loses contrast',()=>{
 assert.deepEqual(colors([110,110,110]),{color:0xffffff,outline:0x111111});
});
