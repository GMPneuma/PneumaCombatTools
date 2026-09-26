import { polygon } from "../dist/scripts/aoe/geometry.js";
/** Positive footprint overlap; merely touching the boundary does not count. */
export function overlaps(area, box) {
  if(area.shape==="circle") {
    const x=Math.max(box.x,Math.min(area.origin.x,box.x+box.width)),y=Math.max(box.y,Math.min(area.origin.y,box.y+box.height));
    return Math.hypot(x-area.origin.x,y-area.origin.y)<area.length-0.001;
  }
  const a=polygon(area),b=[{x:box.x,y:box.y},{x:box.x+box.width,y:box.y},{x:box.x+box.width,y:box.y+box.height},{x:box.x,y:box.y+box.height}];
  const axes=[{x:1,y:0},{x:0,y:1},{x:Math.cos(area.direction),y:Math.sin(area.direction)},{x:-Math.sin(area.direction),y:Math.cos(area.direction)}];
  return axes.every(n=>{
    const aa=a.map(p=>p.x*n.x+p.y*n.y),bb=b.map(p=>p.x*n.x+p.y*n.y);
    return Math.min(Math.max(...aa),Math.max(...bb))-Math.max(Math.min(...aa),Math.min(...bb))>0.001;
  });
}
