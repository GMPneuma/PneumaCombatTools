import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage({viewport:{width:1080,height:1740}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.setContent('<style>body{margin:0}</style>');
 await page.addScriptTag({path:process.env.PNEUMA_PIXI_SOURCE||resolve(tmpdir(),'pneuma-pixi-7.4.3.min.js')});
 await page.addScriptTag({type:'module',content:(await readFile('dist/scripts/turn-marker-art.js','utf8'))+'\nwindow.createMarkerArt=createMarkerArt;window.styles=MARKER_STYLES;'});await page.waitForFunction(()=>window.createMarkerArt);
 const tools=await page.evaluate(()=>{
  const art=createMarkerArt(77,{style:'tech',color:0xa1de73,thickness:2,opacity:1,speed:1}),cursor=art.root.children.find(n=>n.name==='tech-cursor');art.frame(.1);const before=cursor.y;art.frame(.3);const result={checks:art.root.children.filter(n=>n.name==='tech-check').length,progress:art.root.children.filter(n=>n.name==='tech-progress').length,moving:cursor.y!==before,oldTools:art.root.children.some(n=>['tech-gear','tech-wrench'].includes(n.name))};art.root.destroy({children:true});return result;
 });assert.deepEqual(tools,{checks:3,progress:8,moving:true,oldTools:false});
 const revisions=await page.evaluate(()=>{
  const rocker=createMarkerArt(77,{style:'rockerboy',color:0xffffff,thickness:2,opacity:1,speed:1});rocker.root.getLocalBounds();
  const bottom=rocker.root.children.find(n=>n.name==='rocker-level-0'),top=rocker.root.children.find(n=>n.name==='rocker-level-6');
  const color=n=>n.geometry.graphicsData.at(-1).lineStyle.color;
  const exec=createMarkerArt(77,{style:'exec',color:0xffc36a,thickness:2,opacity:1,speed:1}),mail=exec.root.children.find(n=>n.name==='exec-command');exec.frame(.1);const x=mail.x;exec.frame(.6);
  rocker.frame((Math.PI/2+1)/(Math.PI*4));if(top.alpha<.9)throw Error("Rockerboy red peak never lights");
  const result={bottom:color(bottom),top:color(top),org:exec.root.children.filter(n=>n.name==='exec-rank').length,mailMoves:mail.x!==x};rocker.root.destroy({children:true});exec.root.destroy({children:true});return result;
 });assert.deepEqual(revisions,{bottom:0x36dc68,top:0xff3030,org:3,mailMoves:true});
 const money=await page.evaluate(()=>{
  const art=createMarkerArt(77,{style:'fixer',color:0xffc36a,thickness:2,opacity:1,speed:1});const bills=art.root.children.filter(n=>n.name==='fixer-banknote');art.frame(.1);const before=bills.map(n=>n.y);art.frame(.4);const result={currency:art.root.children.some(n=>n.name==='fixer-currency'),count:bills.length,moved:bills.every((n,i)=>n.y!==before[i])};art.root.destroy({children:true});return result;
 });assert.equal(money.currency,true);assert.equal(money.count,6);assert.equal(money.moved,true);
 const discharge=await page.evaluate(()=>{
  const art=createMarkerArt(77,{style:'arc',color:0xffc36a,thickness:2,opacity:1,speed:1});
  const bolts=art.root.children.filter(n=>n.name==='arc-bolt'),forks=art.root.children.filter(n=>n.name==='arc-fork'),states=[];
  for(let slot=0;slot<12;slot++){art.frame((slot+.2)/18);states.push(bolts.map((n,i)=>n.alpha>0?i:-1).filter(i=>i>=0));}
  art.frame(.95/18);const result={contacts:art.root.children.filter(n=>n.name==='arc-contact').length,states,rest:bolts.every(n=>n.alpha===0)&&forks.every(n=>n.alpha===0)};art.root.destroy({children:true});return result;
 });
 assert.equal(discharge.contacts,6);assert.ok(discharge.states.every(s=>s.length>=1&&s.length<=2));assert.ok(new Set(discharge.states.flat()).size>=6);assert.equal(discharge.rest,true,'Bolts fully disappear between flashes');
 const accents=await page.evaluate(()=>{
  const make=(style,color)=>createMarkerArt(77,{style,color,thickness:2,opacity:1,speed:1});
  const colors=root=>root.children.flatMap(node=>(node.geometry?.graphicsData??[]).map(data=>data.lineStyle?.color));
  const lawA=make('lawman',0x00ff00),lawB=make('lawman',0xff00ff),nomad=make('nomad',0x123456),med=make('medtech',0x00ff00),media=make('media',0x00ff00),solo=make('solo',0xffc36a);
  for(const art of [lawA,lawB,nomad,med,media,solo])art.root.getLocalBounds();
  const lamp=media.root.children.find(n=>n.name==='media-lamp');media.frame(.1);const lit=lamp.alpha;media.frame(.35);const dim=lamp.alpha;
  if(med.root.children.length>26||med.root.children.filter(n=>n.name==='medtech-dose').length!==10)throw Error('Medical treatment cartridges missing or excessively complex');
  if(!media.root.children.some(n=>n.name==='media-live'))throw Error('Media LIVE label missing');
  if(lamp.getLocalBounds().width<77*.2)throw Error('Media lamp too small');
  if(!med.root.children.some(n=>n.name==='medtech-cross')||med.root.children.some(n=>n.name?.includes('lamp')))throw Error('Medtech must have a medical cross, not a recording lamp');
  if(!med.root.children.find(n=>n.name==='medtech-cross').geometry.graphicsData.some(d=>d.lineStyle.color===0xff3030))throw Error('Medical cross must be fixed red');
  const probe=med.root.children.find(n=>n.name==='medtech-probe');med.frame(.1);const probeY=probe.y;med.frame(.6);if(probe.y===probeY)throw Error('Medical probe must scan');
  const scan=solo.root.children.find(n=>n.name==='solo-scan');solo.frame(.1);const scanBefore=scan.y;solo.frame(.6);const scanAfter=scan.y;
  const speedArc=nomad.root.children.find(n=>n.name==='nomad-speed-arc'),gradient=speedArc.geometry.graphicsData.map(d=>d.lineStyle.color);
  const result={lawA:colors(lawA.root),lawB:colors(lawB.root),lamp:{x:lamp.x,y:lamp.y,lit,dim,red:lamp.geometry.graphicsData.some(d=>d.fillStyle?.color===0xff3030)},scanBefore,scanAfter,gradient};
  for(const art of [lawA,lawB,nomad,med,media,solo])art.root.destroy({children:true});return result;
 });
 assert.deepEqual(accents.lawA,accents.lawB,'Lawman ignores chosen color');assert.ok(accents.lawA.includes(0x449fff)&&accents.lawA.includes(0xff3030));
 assert.ok(accents.lamp.x>0&&accents.lamp.y<0&&accents.lamp.red&&accents.lamp.lit>accents.lamp.dim);assert.notEqual(accents.scanBefore,accents.scanAfter,'Solo visibly moves');
 assert.ok(new Set(accents.gradient).size>50,'Nomad arc has a smooth cached color ramp');assert.ok(accents.gradient.includes(0x36dc68)&&accents.gradient.includes(0xff3030));assert.ok(!accents.gradient.includes(0x123456));
 assert.equal(accents.gradient[1],0x36dc68,'RPM arc starts green at the upper end');assert.equal(accents.gradient.at(-1),0xff3030,'RPM arc progresses clockwise to the redline');
 for(const light of [false,true]){
  const result=await page.evaluate(light=>{
   const app=new PIXI.Application({width:1080,height:1740,antialias:true,backgroundColor:light?0xc3b9a3:0x18242d});app.stop();document.body.append(app.view);window.markerApp=app;
   const grid=new PIXI.Graphics();grid.lineStyle(1,light?0xafa591:0x263641);for(let x=0;x<=1080;x+=50)grid.moveTo(x,0).lineTo(x,1740);for(let y=0;y<=1740;y+=50)grid.moveTo(0,y).lineTo(1080,y);app.stage.addChild(grid);
   window.arts=[];
   for(const [i,[style,label]] of Object.entries(styles).entries()){
    const x=180+(i%3)*360,y=150+Math.floor(i/3)*290;
    const token=new PIXI.Graphics();token.position.set(x,y);token.lineStyle(2,0x8ba9b4).beginFill(0x233847).drawCircle(0,0,65).endFill();
    token.lineStyle(0).beginFill(0x668391).drawPolygon([-23,-30,-9,-44,17,-39,31,-20,25,13,9,31,-11,28,-28,4]).endFill();token.beginFill(0x101e29).drawPolygon([-46,43,-16,30,0,53,16,30,46,45,33,55,-33,55]).endFill();token.beginFill(0x162e3b).drawPolygon([-27,-11,28,-13,25,0,-23,4]).endFill();
    const color=({glitch:0x43dcee,echo:0xa6e7af,stream:0xc793f4,rockerboy:0xf258cb,netrunner:0x43dcee,tech:0xa1de73,medtech:0x6ae4c4,media:0xffdf86,lawman:0xff695e,nomad:0xffa23c})[style]??0xffc36a;
    const art=createMarkerArt(77,{style,color,thickness:2,opacity:.9,speed:1});art.root.position.set(x,y);app.stage.addChild(art.root);app.stage.addChild(token);arts.push(art);
    const title=new PIXI.Text(label,{fontFamily:'Arial',fontSize:18,fill:light?0x202a31:0xe1e8ed});title.anchor.set(.5);title.position.set(x,y-132);app.stage.addChild(title);
   }
   for(const art of arts)art.frame(.32);app.renderer.render(app.stage);
   return {counts:arts.map(a=>a.root.children.length),bounds:arts.map(a=>{const b=a.root.getBounds();return {width:b.width,height:b.height}})};
  },light);
  assert.equal(result.counts.length,16);assert.ok(result.counts.every(n=>n>0&&n<70));assert.ok(result.bounds.every(b=>b.width<300&&b.height<300));
  await page.screenshot({path:resolve(tmpdir(),`pct-all-indicators-${light?'light':'dark'}.png`)});
  const changed=await page.evaluate(()=>{
   const state=art=>JSON.stringify(art.root.children.map(n=>[n.x,n.y,n.rotation,n.alpha,n.scale.x,n.scale.y]));const before=arts.map(state);
   const original=PIXI.Graphics.prototype.lineTo;PIXI.Graphics.prototype.lineTo=()=>{throw Error('Geometry redrawn during animation');};
   const changed=arts.map(()=>false);for(let n=0;n<120;n++)for(const [i,art] of arts.entries()){art.frame(n/121);changed[i] ||= state(art)!==before[i];}
   PIXI.Graphics.prototype.lineTo=original;return {changed,counts:arts.map(art=>art.root.children.length)};
  });
  assert.ok(changed.changed.every(Boolean),'Every effect has moving or pulsing elements');assert.deepEqual(changed.counts,result.counts);
  await page.evaluate(()=>{for(const style of Object.keys(styles)){for(const thickness of [1,10]){const art=createMarkerArt(155,{style,color:0xffc36a,thickness,opacity:1,speed:3});art.frame(.5);const bounds=art.root.getLocalBounds();if(!Number.isFinite(bounds.width)||!Number.isFinite(bounds.height))throw Error('Invalid bounds: '+style);art.root.destroy({children:true});}}for(const art of arts)art.root.destroy({children:true});markerApp.destroy(true,{children:true});});
 }
 assert.deepEqual(errors,[]);console.log('All 16 styles render on dark/light maps, animate without redrawing geometry, retain object counts, accept thickness 1–10 and larger distance, and clean up.');
}finally{await browser.close();}
