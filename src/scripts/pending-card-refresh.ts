/** Track workflow-selected cards and batch each affected card once per frame. */
type PendingScope = { actors: string[]; combat?: string | null };
function exchangeScope(message: ChatMessage): PendingScope | undefined {
  const data = foundry.utils.getProperty(message, "flags.pneuma-combattools.exchange") as
    { state?: string; defenderActor: string; combatId?: string | null; round?: string } | undefined;
  if (!data || !["waiting", "applying"].includes(data.state ?? "")) return;
  return { actors: [data.defenderActor], combat: data.combatId !== undefined ? data.combatId
    : data.round === "outside-combat" ? null : data.round?.split(":")[0] };
}
export class PendingCardRefresh {
  private cards = new Map<string, PendingScope & { message: ChatMessage }>();
  private actors = new Map<string, Set<string>>();
  private combats = new Map<string, Set<string>>();
  private source?: Iterable<ChatMessage>;
  private requests = new Map<string, [string | undefined, string | undefined]>();
  private queued = new Set<string>();
  private rendering = new Set<string>();
  private scheduled = false;
  constructor(private update: (message: ChatMessage) => unknown,
    private scope: (message: ChatMessage) => PendingScope | undefined = exchangeScope) {}
  seed(messages: Iterable<ChatMessage> | undefined): void {
    if (this.source === messages) return;
    this.source = messages;
    for (const id of this.cards.keys()) this.forget(id);
    for (const message of messages ?? []) this.remember(message);
  }
  private link(index: Map<string, Set<string>>, key: string, id: string): void {
    let ids = index.get(key);
    if (!ids) index.set(key, ids = new Set());
    ids.add(id);
  }
  private unlink(index: Map<string, Set<string>>, key: string, id: string): void {
    const ids = index.get(key);
    ids?.delete(id);
    if (!ids?.size) index.delete(key);
  }
  remember(message: ChatMessage): void {
    if (!message.id) return;
    const scope = this.scope(message);
    if (!scope) { this.forget(message.id); return; }
    const previous = this.cards.get(message.id);
    if (previous) {
      for (const actor of previous.actors) this.unlink(this.actors, actor, message.id);
      if (previous.combat) this.unlink(this.combats, previous.combat, message.id);
    }
    this.cards.set(message.id, { message, ...scope });
    for (const actor of scope.actors) this.link(this.actors, actor, message.id);
    if (scope.combat) this.link(this.combats, scope.combat, message.id);
  }
  forget(id: string): void {
    const card = this.cards.get(id);
    if (card) {
      for (const actor of card.actors) this.unlink(this.actors, actor, id);
      if (card.combat) this.unlink(this.combats, card.combat, id);
    }
    this.cards.delete(id); this.queued.delete(id);
  }
  find(actor: string, predicate: (message: ChatMessage) => boolean): ChatMessage | undefined {
    for (const id of this.actors.get(actor) ?? []) {
      const message = this.cards.get(id)!.message;
      if (predicate(message)) return message;
    }
    return undefined;
  }
  refresh(actor?: string, combat?: string): void {
    if (actor !== undefined && !this.actors.has(actor) || combat !== undefined && !this.combats.has(combat) || !this.cards.size) return;
    this.requests.set(JSON.stringify([actor, combat]), [actor, combat]);
    this.schedule();
  }
  private schedule(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      for (const [actor, combat] of this.requests.values()) {
        const ids = actor !== undefined ? this.actors.get(actor) : combat !== undefined ? this.combats.get(combat) : this.cards.keys();
        for (const id of ids ?? []) {
          const card = this.cards.get(id);
          if (card && (combat === undefined || card.combat === combat)) this.queued.add(id);
        }
      }
      this.requests.clear();
      const ids = [...this.queued]; this.queued.clear();
      for (const id of ids) {
        if (this.rendering.has(id)) { this.queued.add(id); continue; }
        const card = this.cards.get(id);
        // Native updateMessage inserts missing messages. Invalidation must only refresh mounted cards.
        if (card?.message.visible && (!card.message.blind || game.user?.isGM)
          && ui.chat?.element?.find(`[data-message-id="${id}"]`).length) {
          const result = this.update(card.message);
          if (result && typeof (result as PromiseLike<unknown>).then === "function") {
            this.rendering.add(id);
            void Promise.resolve(result).catch(error => console.error("Combat Tools: card refresh failed", error)).finally(() => {
              this.rendering.delete(id);
              if (this.queued.has(id)) this.schedule();
            });
          }
        }
      }
    });
  }
}

/** Shared actor/combat invalidation for condition-dependent card controls. */
export function registerConditionCardRefresh(scope:(message:ChatMessage)=>PendingScope|undefined):void {
  const index=new PendingCardRefresh(message=>ui.chat?.updateMessage(message,false),scope);
  Hooks.once("ready",()=>index.seed(game.messages));
  for(const hook of ["createChatMessage","updateChatMessage","renderChatMessage"])Hooks.on(hook,(message:ChatMessage)=>index.remember(message));
  Hooks.on("deleteChatMessage",(message:ChatMessage)=>index.forget(message.id!));
  Hooks.on("updateActor",(actor:Actor)=>index.refresh(actor.uuid));
  for(const hook of ["createItem","updateItem","deleteItem","createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(hook,(doc:Item|ActiveEffect)=>{
    const actor=doc.parent instanceof Actor?doc.parent:doc.parent?.parent instanceof Actor?doc.parent.parent:undefined;
    if(actor)index.refresh(actor.uuid);
  });
  for(const hook of ["updateCombat","deleteCombat"])Hooks.on(hook,(combat:Combat)=>index.refresh(undefined,combat.id!));
}
