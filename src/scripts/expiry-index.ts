import {updateTouchesPath} from "./update-path.js";

/** Keep world and synthetic actors eligible for expiry across scene changes and GM handoffs. */
export function registerExpiryIndex(matches:(actor:Actor)=>boolean):()=>Actor[] {
  const candidates=new Map<string,Actor>();
  const dirty=new Set<Actor>();
  const tokensByBase=new Map<string,Set<TokenDocument>>();
  const bindings=new Map<TokenDocument,{base:string; actor?:Actor}>();
  const pendingTokens=new Set<TokenDocument>();
  let seeded=false;

  function forgetToken(token:TokenDocument) {
    const old=bindings.get(token);
    if(!old)return;
    const tokens=tokensByBase.get(old.base);
    tokens?.delete(token);
    if(!tokens?.size)tokensByBase.delete(old.base);
    if(old.actor){
      candidates.delete(old.actor.uuid);
      dirty.delete(old.actor);
    }
    bindings.delete(token);
  }
  function bind(token:TokenDocument) {
    forgetToken(token);
    if(token.actorLink||!token.actorId)return;
    const base=token.actorId;
    const tokens=tokensByBase.get(base)??new Set<TokenDocument>();
    tokens.add(token);tokensByBase.set(base,tokens);
    const actor=token.actor??undefined;
    bindings.set(token,{base,actor});
    if(actor)dirty.add(actor);
  }
  function mark(actor:Actor) {
    if(actor.isToken&&actor.token){
      pendingTokens.add(actor.token);
      return;
    }
    dirty.add(actor);
    if(actor.id)for(const token of tokensByBase.get(actor.id)??[])pendingTokens.add(token);
  }
  function changed(doc:Item|ActiveEffect) {
    const actor=doc.parent instanceof Actor?doc.parent:doc.parent instanceof Item?doc.parent.parent:null;
    if(actor instanceof Actor)mark(actor);
  }
  for(const hook of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(hook,changed);
  Hooks.on("createActor",mark);
  Hooks.on("updateActor",(actor:Actor)=>mark(actor));
  Hooks.on("deleteActor",(actor:Actor)=>{
    mark(actor);dirty.delete(actor);candidates.delete(actor.uuid);
  });
  Hooks.on("createToken",(token:TokenDocument)=>pendingTokens.add(token));
  Hooks.on("updateToken",(token:TokenDocument,changes:object)=>{
    if(["actorId","actorLink","delta"].some(path=>updateTouchesPath(changes,path)))pendingTokens.add(token);
  });
  const remove=(token:TokenDocument)=>{pendingTokens.delete(token);forgetToken(token);};
  Hooks.on("deleteToken",remove);
  Hooks.on("createScene",(scene:Scene)=>{for(const token of scene.tokens)pendingTokens.add(token);});
  Hooks.on("deleteScene",(scene:Scene)=>{for(const token of scene.tokens)remove(token);});

  function collect(){
    if(!seeded){
      for(const actor of game.actors??[])dirty.add(actor);
      for(const scene of game.scenes??[])for(const token of scene.tokens)pendingTokens.add(token);
      seeded=true;
    }
    for(const token of pendingTokens)bind(token);
    pendingTokens.clear();
    for(const actor of dirty){
      if(matches(actor))candidates.set(actor.uuid,actor);
      else candidates.delete(actor.uuid);
    }
    dirty.clear();
    return [...candidates.values()];
  }
  Hooks.once("ready",collect);
  return collect;
}
