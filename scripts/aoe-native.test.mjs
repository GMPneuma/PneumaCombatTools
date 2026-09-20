import assert from "node:assert/strict";
import {test} from "node:test";
import {readFileSync,existsSync} from "node:fs";
// Optional integration fixture: exercise the installed v12 algorithms without redistributing Foundry source.
const path=process.env.PNEUMA_FOUNDRY_SOURCE;
const source=path&&existsSync(path)?readFileSync(path,"utf8"):null;
function method(name){const start=source.indexOf("  "+name+"(",source.indexOf("class MeasuredTemplate extends"));assert.ok(start>0);return source.slice(start,source.indexOf("\n  }",start)+4)}
class Polygon {
 constructor(...points){this.points=Array.isArray(points[0])?points[0]:points}
 contains(x,y){let inside=false;const p=this.points;for(let i=0,j=p.length-2;i<p.length;j=i,i+=2){const a=p[i],b=p[i+1],c=p[j],d=p[j+1];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside}return inside}
 getBounds(){const xs=this.points.filter((_,i)=>i%2===0),ys=this.points.filter((_,i)=>i%2);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys),fit(){},pad(n){this.x-=n;this.y-=n;this.width+=n*2;this.height+=n*2}}}
}
function setup(){
 globalThis.PIXI={Polygon,Circle:class{constructor(x,y,radius){Object.assign(this,{x,y,radius})}}};
 globalThis.Ray={fromAngle:(x,y,a,d)=>({B:{x:x+Math.cos(a)*d,y:y+Math.sin(a)*d}})};
 Math.toRadians=d=>d*Math.PI/180;Array.fromRange=n=>Array.from({length:n},(_,i)=>i);
 globalThis.game={user:{id:"player"},settings:{get:(_m,k)=>k==="coneTemplateType"?"round":false}};
 globalThis.CONST={GRID_TYPES:{GRIDLESS:0}};
 const grid={type:1,size:100,distance:2,getOffsetRange:b=>[Math.floor(b.y/100),Math.floor(b.x/100),Math.ceil((b.y+b.height)/100),Math.ceil((b.x+b.width)/100)],
 getCenterPoint:p=>({x:(p.j??Math.floor(p.x/100))*100+50,y:(p.i??Math.floor(p.y/100))*100+50}),getTopLeftPoint:p=>({x:p.j*100,y:p.i*100}),
 getVertices:p=>[{x:p.x,y:p.y},{x:p.x+100,y:p.y},{x:p.x+100,y:p.y+100},{x:p.x,y:p.y+100}]};
 globalThis.canvas={grid,scene:{grid},dimensions:{distancePixels:50,rect:{x:0,y:0,width:2000,height:2000}}};
 const Native=Function("return class {"+["static getRayShape","static getConeShape","static getCircleShape","_getGridHighlightPositions"].map(method).join("\n")+"}")();
 globalThis.CONFIG={MeasuredTemplate:{objectClass:Native},Canvas:{polygonBackends:{move:{create:(_p,c)=>c.boundaryShapes[0]},sight:{create:(_p,c)=>c.boundaryShapes[0]}}}};
 return Native;
}
const {areaCoverage,clippedPoints,templateData}=await import("../dist/scripts/aoe/placement.js");
test("native v12 diagonal ray highlights and recipients agree",{skip:!source},()=>{
 const Native=setup();const area={shape:"ray",origin:{x:150,y:150},direction:Math.PI/4,length:600,width:100};
 const d=templateData(area),points=clippedPoints(area);
 const cells=Native.prototype._getGridHighlightPositions.call({document:d,shape:new Polygon(points.map((n,i)=>n-(i%2?d.y:d.x)))});
 const covered=areaCoverage(area);
 for(let x=0;x<900;x+=100)for(let y=0;y<900;y+=100)assert.equal(covered({x,y,width:100,height:100}),cells.some(p=>p.x===x&&p.y===y),x+","+y);
 assert.equal(covered({x:300,y:300,width:100,height:100}),true);assert.equal(covered({x:600,y:100,width:100,height:100}),false);
 assert.equal(covered({x:200,y:0,width:300,height:400}),true);
});
test("native cones respect angles and gridless footprints",{skip:!source},()=>{
 setup();const cone={shape:"cone",origin:{x:150,y:150},direction:0,length:600,width:0,angle:45};
 assert.equal(areaCoverage(cone)({x:450,y:350,width:100,height:100}),false);
 assert.equal(areaCoverage({...cone,angle:90})({x:450,y:350,width:100,height:100}),true);
 canvas.grid.type=0;assert.equal(areaCoverage(cone)({x:300,y:140,width:20,height:20}),true);
 assert.equal(areaCoverage(cone)({x:300,y:500,width:20,height:20}),false);
});
test("clipped wall polygon controls both native cell highlights and coverage",{skip:!source},()=>{
 setup();const area={shape:"square",origin:{x:350,y:350},direction:0,length:500,width:500};
 CONFIG.Canvas.polygonBackends.move.create=()=>new Polygon([100,100,300,100,300,600,100,600]);
 const covered=areaCoverage(area);assert.equal(covered({x:200,y:200,width:100,height:100}),true);assert.equal(covered({x:300,y:200,width:100,height:100}),false);
});

test("native grid measurement and cone style settings remain authoritative",{skip:!source},()=>{
 setup();game.settings.get=(_m,k)=>k==="gridTemplates";
 let translations=0,cones=0;canvas.grid.getTranslatedPoint=(p,direction,distance)=>{translations++;return {x:p.x+distance*50,y:p.y+distance*50}};
 canvas.grid.getCone=(origin,distance,direction,angle)=>{cones++;assert.equal(distance,12);assert.equal(direction,45);assert.equal(angle,90);return [0,0,600,0,0,600]};
 clippedPoints({shape:"ray",origin:{x:150,y:150},direction:Math.PI/4,length:600,width:100});assert.equal(translations,2);
 clippedPoints({shape:"cone",origin:{x:150,y:150},direction:Math.PI/4,length:600,width:0,angle:90});assert.equal(cones,1);
});
