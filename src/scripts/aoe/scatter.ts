import {areaCells} from "./placement.js";
import type {Area, Point} from "./geometry.js";

export function scatterImpact(area: Area, mode: "random" | "margin", missBy: number): Point | undefined {
  const grid=canvas.grid!;
  const origin=grid.getOffset(area.origin);
  const sameCell=(cell:typeof origin)=>cell.i===origin.i && cell.j===origin.j;
  let points:Point[];
  if(mode==="random") {
    points=areaCells(area).map(cell=>{
      const vertices=cell.length/2;
      let x=0,y=0;
      for(let i=0;i<cell.length;i+=2){x+=cell[i]!;y+=cell[i+1]!;}
      return grid.getCenterPoint({x:x/vertices,y:y/vertices});
    }).filter(point=>!sameCell(grid.getOffset(point)));
  } else {
    const near=grid.getAdjacentOffsets(origin);
    const key=(cell:typeof origin)=>cell.i+","+cell.j;
    const seen=new Set([key(origin),...near.map(key)]);
    const far=near.flatMap(cell=>grid.getAdjacentOffsets(cell)).filter(cell=>{
      const id=key(cell);if(seen.has(id))return false;seen.add(id);return true;
    });
    points=(missBy<=3?near:far).map(cell=>grid.getCenterPoint(cell));
  }
  const candidates=points.filter(point=>canvas.dimensions!.sceneRect.contains(point.x,point.y));
  return candidates[Math.floor(Math.random()*candidates.length)];
}
