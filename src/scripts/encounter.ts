/** Encounter selection never depends on the client-local Combat Tracker selection. */
export interface EncounterRef {combatId: string | null; combatEpoch?: string; combatScene?: string; combatTokens?: string[]}
export const encounterEpoch=(combat:Combat)=>String(foundry.utils.getProperty(combat,"flags.pneuma-combattools.evasionEpoch")??"");
export function sceneEncounter(sceneId:string|null|undefined=(typeof canvas === "undefined"?undefined:canvas.scene?.id)):Combat|undefined {
  if(!sceneId)return;
  const matches=Array.from(game.combats?.values()??[]).filter(c=>c.active&&c.started&&(c.scene?.id===sceneId||!c.scene&&c.combatants.some(p=>p.token?.parent?.id===sceneId)));
  if(matches.length>1)throw Error("Multiple active encounters for this scene. The GM must make only one encounter active.");
  return matches[0];
}
/** Rendering must not choose an arbitrary encounter or throw on every frame. Actions use the strict lookup. */
export function displayedEncounter(sceneId:string|null|undefined=(typeof canvas === "undefined"?undefined:canvas.scene?.id)):Combat|undefined {
  try{return sceneEncounter(sceneId);}catch{return undefined;}
}
export function requireParticipants(combat:Combat,tokens:string[]):void {
  if(!tokens.every(uuid=>combat.combatants.some(p=>p.token?.uuid===uuid)))
    throw Error("Add all participating tokens to the active encounter for this scene before continuing.");
}
export function tokenEncounter(sceneId:string|null|undefined,tokens:string[]):Combat|undefined {
  const combat=sceneEncounter(sceneId);if(combat)requireParticipants(combat,tokens);return combat;
}
export function encounterRef(combat:Combat|undefined,sceneId?:string|null,tokens:string[]=[]):EncounterRef {
  return {combatId:combat?.id??null,combatEpoch:combat?encounterEpoch(combat):undefined,combatScene:sceneId??undefined,combatTokens:tokens};
}
/** A saved action stays in its original encounter, even after another one becomes active. */
export function resolveEncounter(ref:Partial<EncounterRef>):Combat|undefined {
  if(ref.combatId===null)return;
  const combat=(ref.combatId?game.combats?.get(ref.combatId):undefined) as Combat|undefined;
  if(!combat?.started||encounterEpoch(combat)!==(ref.combatEpoch??""))
    throw Error("The originating encounter ended or was reset or deleted. Start a new action.");
  if(ref.combatScene&&combat.scene&&combat.scene.id!==ref.combatScene)
    throw Error("The originating encounter changed scenes. Start a new action.");
  requireParticipants(combat,ref.combatTokens??[]);return combat;
}
/** Actor-only sheet actions use this scene; synthetic actors retain their exact token identity. */
export function actorEncounter(actor:Actor):Combat|undefined {
  const token=actor.isToken?actor.token:undefined;
  if(token)return tokenEncounter(token.parent?.id,[token.uuid]);
  const combat=sceneEncounter();
  const rows=combat?.combatants.filter(p=>p.actor?.uuid===actor.uuid)??[];
  if(rows.length>1)throw Error("This actor has multiple tokens in the active encounter. Use a token-specific action.");
  return rows.length?combat:undefined;
}
