const linear = c => { const v=c/255; return v<=.04045?v/12.92:((v+.055)/1.055)**2.4; };
const luminance = (r,g,b) => .2126*linear(r)+.7152*linear(g)+.0722*linear(b);
export function flagNumberColors(pixels,size,x,y) {
 let light=0,count=0;
 for(let dy=-12;dy<=12;dy+=4)for(let dx=-12;dx<=12;dx+=4){
  const k=4*(Math.max(0,Math.min(size-1,y+dy))*size+Math.max(0,Math.min(size-1,x+dx)));
  light+=luminance(pixels[k],pixels[k+1],pixels[k+2]);count++;
 }
 light/=count;
 const goldLight=luminance(255,224,155);
 const goldContrast=(Math.max(goldLight,light)+.05)/(Math.min(goldLight,light)+.05);
 const color=goldContrast>=4.5?0xffe09b:light>.19?0x111111:0xffffff;
 return {color,outline:color===0x111111?0xffffff:0x111111};
}
