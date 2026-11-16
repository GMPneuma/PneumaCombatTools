import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage();
 const source=(await readFile('dist/scripts/status-colors.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'');
 await page.addScriptTag({content:source+'\nwindow.statusTest={colorTokenEffects,setStatusColorRows,paintStatusIcon};'});
 const result=await page.evaluate(async()=>{
  const svg=body=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128">'+body+'</svg>');
  const glyph=svg('<path fill="white" d="M40 16h24v64h40v24H40z"/>');
  const opaque=svg('<path fill="#1b1f21" d="M0 0h128v128H0z"/><path fill="red" d="M40 16h24v64h40v24H40z"/>');
  window.game={settings:{get:()=>({native:'#888888',custom:'#224466',module:'#888888','native-empty':'#888888'})}};
  window.PIXI={Texture:class {constructor(image){this.image=image;}}};
  window.loadTexture=async src=>{const image=new Image();image.src=src;await image.decode();return new PIXI.Texture(image);};
  const native=await loadTexture(opaque);
  const row=(id,img,extra={})=>({id,name:id,img,tab:'native',...extra});
  statusTest.setStatusColorRows([row('leg',glyph,{aliases:['native-leg']}),row('boxed',opaque,{tab:'custom'}),row('addiction',glyph,{group:'addiction'}),row('missing','data:image/png,invalid')]);
  const effects=[{statuses:new Set(['native-leg']),img:opaque,name:'leg'},{statuses:new Set(['boxed']),img:opaque},{statuses:new Set(['unknown']),img:opaque},{statuses:new Set(['addiction']),img:opaque},{statuses:new Set(['missing']),img:opaque}];
  const before=JSON.stringify(effects.map(e=>({...e,statuses:[...e.statuses]})));
  const sprites=effects.map((_,zIndex)=>({zIndex,texture:native,tint:0xff0000,width:24,height:24,alpha:zIndex===0?.8:1,filters:['foreign-filter']}));
  const bg={zIndex:-1};await statusTest.colorTokenEffects({actor:{temporaryEffects:effects},effects:{children:[bg,...sprites]}});
  const ctx=document.createElement('canvas').getContext('2d');ctx.canvas.width=128;ctx.canvas.height=128;ctx.drawImage(sprites[0].texture.image,0,0);
  const corner=[...ctx.getImageData(0,0,1,1).data],leg=[...ctx.getImageData(45,30,1,1).data],hole=[...ctx.getImageData(80,40,1,1).data];
  const preview=new Image();preview.src=opaque;await statusTest.paintStatusIcon(preview,'#888888');
  const transparentPreview=new Image();transparentPreview.src=glyph;await statusTest.paintStatusIcon(transparentPreview,'#224466');await transparentPreview.decode();ctx.clearRect(0,0,128,128);ctx.drawImage(transparentPreview,0,0);
  return {corner,leg,hole,previewOriginal:preview.getAttribute('src')===opaque,previewGlyph:[...ctx.getImageData(45,30,1,1).data],unchanged:before===JSON.stringify(effects.map(e=>({...e,statuses:[...e.statuses]}))),fallbacks:sprites.slice(1).every(s=>s.texture===native&&s.tint===0xff0000),dimensions:[sprites[0].width,sprites[0].height,sprites[0].alpha],filters:sprites[0].filters,bgUnchanged:Object.keys(bg).length===1};
 });
 assert.deepEqual(result.corner,[0,0,0,0]);assert.deepEqual(result.hole,[0,0,0,0]);assert.deepEqual(result.leg,[136,136,136,255]);assert.deepEqual(result.previewGlyph,[34,68,102,255]);
 assert.equal(result.previewOriginal,true);assert.equal(result.unchanged,true);assert.equal(result.fallbacks,true);assert.equal(result.bgUnchanged,true);assert.deepEqual(result.dimensions,[24,24,.8]);assert.deepEqual(result.filters,['foreign-filter']);
 console.log('Status icon rendering passed: transparent glyph replaces opaque native art; pixel contrast, fallback art, overlays, filters, dimensions and effect documents preserved.');
}finally{await browser.close();}
