import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import Handlebars from 'handlebars';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:'msedge',headless:true});
const icon='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="11" fill="gray"/></svg>');
const rows=[
 {id:'native',name:'Synthcoke',img:icon,source:'Synthcoke',effects:[{name:'Synthcoke Primary'},{name:'Synthcoke Addicted Primary'}]},
 {id:'empty',name:'Broken Arm',img:icon,source:'Broken Arm',effects:[]},
 {id:'module',name:'Intoxicated',img:icon,source:'Combat Tools',effects:[],customized:true,automation:'Fixture automation description'},
 {id:'user',name:'Custom modifier',img:'icons/svg/aura.svg',effects:[]}
];
const tabs=['System effects','System statuses','Combat Tools Statuses','Custom User Statuses'].map((label,i)=>({id:['native','native-empty','module','custom'][i],label,color:'#ffffff',description:'Configure this status using the system editor.',isCustom:i===3,rows:[rows[i]]}));
rows.forEach(row=>row.showEffectState=true);rows[1].canEditEffect=true;rows[2].canEditEffect=true;rows[2].automationLabel='Combat Tools automation';
Object.assign(rows[0],{readOnly:true,effectState:'native',effectLabel:'Has effect',effectDetail:'2 modifiers configured'});
Object.assign(rows[1],{effectState:'none',effectLabel:'No effect',effectDetail:'No modifier effect configured.'});
Object.assign(rows[2],{effectState:'custom',effectLabel:'Has effect',effectDetail:'0 modifiers configured'});
Object.assign(rows[3],{inheritColor:true,colorValue:'#ffffff',effectState:'none',effectLabel:'No effect',effectDetail:'No modifier effect configured.'});
tabs[0].rows.push(...Array.from({length:28},(_,i)=>({...rows[0],id:'fixture-'+i,name:'Native status '+(i+2)})));
try {
 const page=await browser.newPage({viewport:{width:950,height:780}});
 const html=Handlebars.compile(await readFile('src/templates/custom-statuses.hbs','utf8'))({tabs});
 // Foundry v12's form notes have a full-width flex basis. In a column this
 // becomes full HEIGHT unless the module overrides it (live-world regression).
 await page.setContent('<style>*{box-sizing:border-box}body{font:14px Arial;background:#282828}#pneuma-custom-statuses{display:flex;flex-direction:column;width:850px;height:680px;background:#eee;color:#222}.window-header{flex:0 0 30px;padding:6px;background:#333;color:white}.window-content{display:flex;flex-direction:column;flex:1;min-height:0;padding:8px;overflow:hidden auto}form{flex:1}form .notes,form .hint{flex:0 0 100%}button,input,select{height:30px}nav{display:flex;justify-content:space-between}a{cursor:pointer}p{line-height:1.4}.sheet-footer button{width:100%}</style><section id="pneuma-custom-statuses" class="window-app"><header class="window-header">Status effects</header><section class="window-content">'+html+'</section></section>');
 await page.addStyleTag({content:await readFile('src/styles/pneuma-combattools.css','utf8')});
 const colorsSource=(await readFile('dist/scripts/status-colors.js','utf8')).replace(/^import .*;\s*/gm,'').replace(/export /g,'');
 const source=(await readFile('dist/scripts/status-manager.js','utf8')).replace(/^import .*;\s*/gm,'');
 await page.addScriptTag({type:'module',content:`
 const {DEFAULT_STATUS_COLOR,sectionColors,STATUS_COLOR_TABS,validateStatusColor,statusColor,paintStatusIcon}=(()=>{${colorsSource};return {DEFAULT_STATUS_COLOR,sectionColors,STATUS_COLOR_TABS,validateStatusColor,statusColor,paintStatusIcon};})();
 window.paintStatusIcon=paintStatusIcon;
 const data=${JSON.stringify(rows)};
 let custom=[data[3]];const saved={module:{effectUuid:'Item.old.ActiveEffect.old'}};
 const masterStatuses=data.slice(0,3).map(row=>({...row,group:'general'}));
 const customStatuses=()=>structuredClone(custom);
 const validateCustomStatuses=rows=>{if(rows.some(row=>!row.name))throw Error('Name required');return rows;};
 const registeredNativeStatuses=()=>[{id:'native',name:'Synthcoke',changes:[{key:'REF',mode:2,value:'1'}]}];
 const nativeStatusItem=async()=>null;
 const statusAutomationPolicy=()=>({});
 const nativeEffectsForStatus=()=>[];
 const statusTemplates=()=>saved;
 const saveStatusTemplate=async(id,value)=>{if(value)saved[id]=value;else delete saved[id];window.saved=saved;};
 const createCustomEffectTemplate=async status=>({uuid:'Item.template.ActiveEffect.'+status.id,sheet:{render:()=>window.edited=status.id},update:async()=>{}});
 const fromUuid=async()=>null;
 const ActiveEffect=class{};const Item=class{};
 const game={i18n:{localize:s=>s},user:{isGM:true},settings:{get:(_m,key)=>key==='separateCustomStatuses'?(window.separate??false):window.colors,set:async(_m,key,rows)=>{if(key==='separateCustomStatuses'){window.separate=rows;return;}if(key==='statusSectionColors'){window.colors=rows;return;}custom=structuredClone(rows);window.custom=custom;}}};
 const foundry={utils:{randomID:()=> 'new-user'}};
 const ui={notifications:{error:message=>window.error=message}};
 const FilePicker=class{constructor(options){this.options=options}render(){this.options.callback('chosen.svg')}};
 const renderTemplate=async(_path,data)=>{window.viewData=data;return '<p>View only</p>';};
 const Dialog=class{constructor(data){window.viewButtons=Object.keys(data.buttons);}render(){window.viewed=true;}};
 const root=document.querySelector('#pneuma-custom-statuses');
 // Minimal fixture for Foundry's delegated jQuery listeners and native tab controller.
 const adapter=element=>({0:element,find(selector){return {on(event,fn){element.querySelectorAll(selector).forEach(node=>node.addEventListener(event,fn));},append(row){element.querySelector(selector).append(row);}};},on(event,selector,fn){event.split(' ').forEach(type=>element.addEventListener(type,e=>{const target=e.target.closest(selector);if(target)fn({currentTarget:target,preventDefault:()=>e.preventDefault()});}));}});
 const FormApplication=class{constructor(){this.element=adapter(root)}activateListeners(){}render(){window.renders=(window.renders??0)+1}};
 ${source}
 const manager=new StatusManager();manager.activateListeners(adapter(root));
 root.querySelectorAll('.status-tabs .item').forEach(link=>link.addEventListener('click',()=>{root.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===link.dataset.tab));}));
 root.querySelector('.status-tabs .item').click();
 root.querySelector('form').addEventListener('submit',e=>{e.preventDefault();manager._updateObject();});
 `});
 await page.waitForFunction(()=>typeof window.paintStatusIcon==='function');
 const pixels=await page.evaluate(async()=>{
  const svg=fill=>'data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><rect x="3" y="3" width="22" height="22" fill="'+fill+'"/></svg>');
  const img=document.createElement('img');img.src=svg('white');document.body.append(img);
  await window.paintStatusIcon(img,'#12ab34');await img.decode();
  const canvas=document.createElement('canvas');canvas.width=28;canvas.height=28;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  const pixel=Array.from(ctx.getImageData(14,14,1,1).data);
  await window.paintStatusIcon(img,'#ffffff');const whiteWell=img.style.getPropertyValue('--pneuma-icon-well');
  await window.paintStatusIcon(img,'#000000');const blackWell=img.style.getPropertyValue('--pneuma-icon-well');
  const red=document.createElement('img');red.src=svg('red');const original=red.src;await window.paintStatusIcon(red,undefined);
  img.remove();return {pixel,whiteWell,blackWell,redUnchanged:red.src===original};
 });
 assert.deepEqual(pixels,{pixel:[18,171,52,255],whiteWell:'#242424',blackWell:'#eeeeee',redUnchanged:true});
 assert.equal(await page.locator('.status-tabs .item').count(),4);
 const tabFrame=await page.locator('#pneuma-custom-statuses').evaluate(root=>{
   const nav=root.querySelector('.status-tabs').getBoundingClientRect(),panel=root.querySelector('.status-panels');
   return {gap:panel.getBoundingClientRect().top-nav.bottom,border:getComputedStyle(panel).borderLeftWidth};
 });
 assert.ok(Math.abs(tabFrame.gap)<1);assert.equal(tabFrame.border,'1px');
 assert.ok(await page.locator('[data-status-id=native] [data-view-status]').evaluate(el=>el.getBoundingClientRect().height>=32));
 assert.equal(await page.locator('[data-status-id="native"] .status-effect-badge').innerText(),'Has effect');
 const checkLayout=async()=>{
  const layout=await page.locator('#pneuma-custom-statuses').evaluate(root=>{
   const rect=el=>el.getBoundingClientRect();const frame=rect(root),tabs=rect(root.querySelector('.status-tabs')),panel=root.querySelector('.status-panels'),footer=rect(root.querySelector('footer'));
   return {tabOffset:tabs.top-frame.top,panelHeight:panel.clientHeight,panelScroll:panel.scrollHeight,footerBottom:footer.bottom,frameBottom:frame.bottom,overflow:root.scrollHeight-root.clientHeight};
  });
  assert.ok(layout.tabOffset<150,JSON.stringify(layout));assert.ok(layout.panelHeight>200,JSON.stringify(layout));assert.ok(layout.footerBottom<=layout.frameBottom,JSON.stringify(layout));assert.ok(layout.overflow<=1,JSON.stringify(layout));
  return layout;
 };
 const layout=await checkLayout();assert.ok(layout.panelScroll>layout.panelHeight);
 await page.locator('.pneuma-status-config-row').filter({hasText:'Native status 29'}).scrollIntoViewIfNeeded();
 assert.ok((await checkLayout()).tabOffset<150);
 await page.locator('.status-panels').evaluate(el=>el.scrollTop=0);
 assert.equal(await page.locator('[data-status-id="native"] [data-edit-status]').count(),0);
 assert.equal(await page.locator('[data-status-id="native"] [data-reset-status]').count(),0);
 await page.locator('[data-status-id="native"]').getByRole('button',{name:'View effect',exact:true}).click();await page.waitForFunction(()=>window.viewed);
 assert.equal(await page.evaluate(()=>window.viewData.name),'Synthcoke');
 assert.deepEqual(await page.evaluate(()=>window.viewButtons),['close']);
 assert.equal(await page.evaluate(()=>window.custom),undefined);assert.equal(await page.evaluate(()=>window.saved),undefined);assert.equal(await page.evaluate(()=>window.edited),undefined);
 await page.getByText('System statuses',{exact:false}).first().click();assert.equal(await page.getByText('Broken Arm',{exact:true}).first().isVisible(),true);
 assert.equal(await page.locator('[data-status-id="empty"] .status-effect-badge').innerText(),'No effect');
 await page.getByRole('button',{name:'Add effect',exact:true}).click();await page.waitForFunction(()=>window.edited==='empty');
 await page.locator('.status-tabs [data-tab=module]').click();assert.equal(await page.getByText('Intoxicated',{exact:true}).isVisible(),true);
 assert.equal(await page.locator('.status-automation-badge').isVisible(),true);
 assert.equal(await page.getByText('Fixture automation description',{exact:true}).isVisible(),true);
 assert.equal(await page.locator('[data-status-id="module"] .status-effect-badge').innerText(),'Has effect');
 assert.equal(await page.locator('.status-effect-summary select').count(),0);
 assert.ok(await page.locator('[data-status-id=module] [data-reset-status]').evaluate(el=>el.getBoundingClientRect().height>=32));
 await page.locator('[data-status-id=module] [data-reset-status]').click();await page.waitForFunction(()=>window.saved.module===undefined);
 await page.getByRole('button',{name:'Edit',exact:true}).click();await page.waitForFunction(()=>window.edited==='module');
 await page.getByText('Custom User Statuses',{exact:false}).first().click();await page.getByRole('button',{name:'Add user effect',exact:true}).click();
 const grouping=page.locator('.tab[data-tab=custom] input[name=separateCustomStatuses]');
 assert.equal(await grouping.isChecked(),false);
 await grouping.check();
 const added=page.locator('[data-status-id="pneuma-custom-new-user"]');
 assert.deepEqual(await added.evaluate(row=>Array.from(row.children).map(el=>el.className||el.tagName)),['status-user-icon','status-user-color','LABEL','status-user-effect','BUTTON','BUTTON']);await added.getByRole('textbox',{name:'Status name',exact:true}).fill('Radiation exposure');
 await added.getByRole('button',{name:'Edit icon',exact:true}).click();assert.equal(await added.locator('.status-img').inputValue(),'chosen.svg');
 await added.locator('.status-color').fill('#12ab34');
 await page.locator('.status-section-color[data-section=custom]').fill('#abc123');
 await added.getByRole('button',{name:'Edit effect',exact:true}).click();await page.waitForFunction(()=>window.edited==='pneuma-custom-new-user');
 assert.equal(await page.evaluate(()=>window.custom.find(s=>s.name==='Radiation exposure').effectUuid),'Item.template.ActiveEffect.pneuma-custom-new-user');
 assert.equal(await page.evaluate(()=>window.custom.find(s=>s.name==='Radiation exposure').color),'#12ab34');
 assert.equal(await page.evaluate(()=>window.colors.custom),'#abc123');
 assert.equal(await page.evaluate(()=>window.separate),true);
 await grouping.uncheck();
 await added.getByRole('button',{name:'Reset status icon color',exact:true}).click();
 assert.equal(await added.locator('.status-inherit-color').isChecked(),true);
 assert.equal(await added.locator('.status-color').inputValue(),'#abc123');
 await page.locator('[data-tab=custom] [data-reset-section-color]').click();
 assert.equal(await page.locator('.status-section-color[data-section=custom]').inputValue(),'#888888');
 await page.getByRole('button',{name:'Save settings',exact:true}).click();
 await page.waitForFunction(()=>window.colors.custom==='#888888' && window.custom.find(s=>s.name==='Radiation exposure').color===undefined);
 await page.waitForFunction(()=>window.separate===false);
 assert.equal(await page.evaluate(()=>window.error),undefined);
 for(const width of [850,700]){
  await page.locator('#pneuma-custom-statuses').evaluate((el,width)=>el.style.width=width+'px',width);
  assert.ok(await page.locator('#pneuma-custom-statuses').evaluate(el=>el.scrollWidth<=el.clientWidth));
  await checkLayout();
 }
 await page.locator('#pneuma-custom-statuses').evaluate(el=>el.style.width='850px');await page.getByText('System effects',{exact:false}).first().click();
 for(const width of [700,850]){
  await page.locator('#pneuma-custom-statuses').evaluate((el,w)=>el.style.width=w+'px',width);
  assert.ok(await page.locator('.tab.active .pneuma-status-list').evaluate(el=>el.scrollWidth<=el.clientWidth));
  assert.equal(await page.locator('[data-status-id=native] > [role=cell]').count(),4);
 }
 if(process.env.PNEUMA_UI_SCREENSHOT)await page.screenshot({path:process.env.PNEUMA_UI_SCREENSHOT});
 console.log('Status manager UI passed: Foundry v12 notes sizing, 29-row scrolling, pinned tabs/footer, four tabs, editor actions, user rows, icons and width checks.');
}finally{await browser.close();}

