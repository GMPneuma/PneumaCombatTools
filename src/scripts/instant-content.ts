import {inlineRoll} from './inline-roll.js';
import {instantEffects,escapeInstant as esc} from './instant-catalog.js';
import {masterStatuses} from './status-catalog.js';
import type {InstantState} from './instant-effects.js';

export function effectDefinition(state:InstantState) {
  if(state.id!=='status')return instantEffects[state.id];
  const status=CONFIG.statusEffects.find(effect=>effect.id===state.statusId);
  return {name:game.i18n!.localize(status?.name??status?.label??state.statusId??'Status'),color:'#a7afb7',skill:'',dv:0,damage:''};
}

const glyphs={incendiary:'fa-fire',emp:'fa-bolt',microwaver:'fa-bolt',poison:'fa-skull',biotoxin:'fa-skull-crossbones',sleep:'fa-moon',flashbang:'fa-sun',teargas:'fa-cloud',smoke:'fa-smog',status:'fa-circle-dot'};
function effectGlyph(state:InstantState,name:string):string {
  const status=state.id==='status'?CONFIG.statusEffects.find(effect=>effect.id===state.statusId)
    :masterStatuses.find(effect=>effect.name===(state.id==='incendiary'?'On Fire (Mild)':state.id==='emp'||state.id==='microwaver'?'EMP':name));
  const image=status?.img??(status&&'icon' in status?status.icon:undefined);
  return image?'<img class="pneuma-effect-glyph" src="'+esc(image)+'" alt="" aria-hidden="true">'
    :'<i class="fas '+glyphs[state.id]+'" aria-hidden="true"></i>';
}

/** Presentation only. Ordinary, attached and pending fire rows share this markup. */
export function instantContent(state:InstantState,scope='',compact=false):string {
  const effect=effectDefinition(state);
  const awaitingDamage=state.id==='incendiary'&&state.state==='pending';
  const label={pending:'',rolling:'Rolling…',failed:'',resisted:'Resisted',applying:'Applying — do not repeat',applied:state.summary??'Applied',skipped:'Unaffected (GM)',review:'Interrupted — GM review required'}[state.state];
  const glyph=effectGlyph(state,effect.name);
  const button=(action:string,content:string,title='',disabled=false,inert=false,classes='')=>
    '<button type="button"'+(classes?' class="'+classes+'"':'')
    +(inert?'':' data-instant-action="'+action+'" data-instant-scope="'+esc(scope)+'"')
    +(title?' title="'+esc(title)+'" aria-label="'+esc(title)+'"':'')
    +(disabled?' disabled':'')+'>'+content+'</button>';
  const iconButton=(action:string,icon:string,title:string,text='')=>
    button(action,'<i class="fas '+icon+'" aria-hidden="true"></i>'+esc(text),title);

  const canApply=state.state==='pending'||state.state==='failed';
  const applyTitle='Apply '+effect.name+(state.state==='pending'?' — awaiting '+(awaitingDamage?'penetrating damage':'resistance'):'');
  const apply=canApply?button('apply',glyph+'<span>'+(compact?'Apply':'Apply Effect')+'</span>',applyTitle,state.state==='pending',awaitingDamage,'pneuma-effect-apply'):'';
  const completion=state.state==='applied'||state.state==='resisted'||state.state==='skipped'
    ?'<span class="pneuma-effect-complete" data-effect-state="'+state.state+'" title="'+esc(effect.name+' — '+label)+'" aria-label="'+esc(effect.name+' — '+label)+'">'
      +glyph+(state.state==='resisted'?'<i class="fas fa-shield-halved pneuma-effect-state" aria-hidden="true"></i>':state.state==='skipped'?'<i class="fas fa-ban pneuma-effect-state" aria-hidden="true"></i>':'')+'</span>':'';
  const progress=['rolling','applying','review'].includes(state.state)
    ?'<span class="pneuma-effect-progress" title="'+esc(label)+'" aria-label="'+esc(label)+'">'+glyph+'</span>':'';
  const resistance=state.state==='pending'
    ?iconButton('roll','fa-shield-halved','Resist '+effect.name+' DV'+effect.dv,' Resist')
    :inlineRoll(state.total,state.html,effect.skill,compact);

  let overrides='';
  if(!awaitingDamage) {
    if(canApply)overrides=compact?iconButton('skip','fa-user-shield','GM: unaffected by '+effect.name):button('skip','Unaffected');
    else if(state.state==='rolling')overrides=compact?iconButton('reset','fa-unlock','GM: release '+effect.name+' resistance roll'):button('reset','Release roll');
    else if(state.state==='review'||state.state==='applying')overrides=compact?iconButton('review','fa-check-double','GM: mark '+effect.name+' resolved after review'):button('review','Mark resolved');
  }
  const gm='<span class="pneuma-effect-gm-slot"><span class="pneuma-effect-gm-controls">'+overrides+'</span></span>';
  const actions=compact?(effect.skill?'<span class="pneuma-effect-resistance">'+resistance+'</span>':'')
    +'<span class="pneuma-effect-application">'+apply+completion+progress+'</span>'
    :(state.state==='pending'&&!awaitingDamage?resistance:'')+apply+completion;
  const damage=state.damageHTML?'<div class="pneuma-instant-damage"><span>Damage</span> '+inlineRoll(state.damage,state.damageHTML,'Damage roll',compact)+'</div>':'';
  const wake=state.state==='applied'&&state.id==='sleep'&&!compact?button('wake','Wake (touching Action)'):'';

  return '<div class="pneuma-instant-effect'+(compact?' pneuma-aoe-inline-effect':'')+'" title="'+esc(effect.name+(label?' — '+label:''))+'" data-effect="'+state.id+'" data-state="'+state.state+'" style="--pneuma-ammo-color:'+effect.color+'">'
    +(compact?'':damage)+'<strong>'+esc(effect.name)+(effect.skill?' DV'+effect.dv:'')+'</strong> '
    +(compact?'':inlineRoll(state.total,state.html,effect.skill))
    +(!compact&&label?'<span>'+esc(label)+'</span> ':'')
    +'<span class="pneuma-effect-actions">'+actions+'</span>'+gm+(compact?damage:'')+wake+'</div>';
}
