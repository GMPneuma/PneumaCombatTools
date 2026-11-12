import assert from "node:assert/strict";
import {test} from "node:test";
import {scatterImpact} from "../dist/scripts/aoe/scatter.js";

test("margin scatter uses the requested ring, excludes off-scene squares and falls back when none fit",()=>{
  const area={origin:{x:0,y:0}};
  globalThis.canvas={dimensions:{sceneRect:{contains:(x,y)=>x>=0&&y>=0}},grid:{
    getOffset:({x,y})=>({i:y,j:x}), getCenterPoint:({i,j})=>({x:j,y:i}),
    getAdjacentOffsets:({i,j})=>[-1,0,1].flatMap(y=>[-1,0,1].filter(x=>x||y).map(x=>({i:i+y,j:j+x})))
  }};
  for(const miss of [0,1,3,4,20]){
    const {x,y}=scatterImpact(area,"margin",miss);assert.ok(x>=0&&y>=0);
    assert.equal(Math.max(x,y),miss<=3?1:2);
  }
  canvas.dimensions.sceneRect.contains=()=>false;
  assert.equal(scatterImpact(area,"margin",4),undefined);
});

test("true random draws only from highlighted on-scene cells other than aim",()=>{
  const area={shape:"square",origin:{x:5,y:5},direction:0,length:30,width:30};
  globalThis.game={user:{id:"gm"}};
  globalThis.PIXI={Polygon:class {constructor(points){this.points=points;}}};
  const backend={create:(_origin,opts)=>opts.boundaryShapes[0]};
  globalThis.CONST={GRID_TYPES:{GRIDLESS:0}};
  globalThis.CONFIG={Canvas:{polygonBackends:{move:backend,sight:backend}},MeasuredTemplate:{objectClass:class {
    _getGridHighlightPositions(){return [{x:0,y:0},{x:10,y:0},{x:-10,y:0}];}
  }}};
  globalThis.canvas={scene:{grid:{size:10,distance:2}},dimensions:{sceneRect:{contains:(x,y)=>x>=0&&y>=0}},grid:{
    type:1,getOffset:({x,y})=>({i:Math.floor(y/10),j:Math.floor(x/10)}),getCenterPoint:p=>p,
    getVertices:({x,y})=>[{x,y},{x:x+10,y},{x:x+10,y:y+10},{x,y:y+10}]
  }};
  assert.deepEqual(scatterImpact(area,"random",9),{x:15,y:5});
});
