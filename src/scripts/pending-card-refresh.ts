/** Track only unresolved cards and batch each affected card once per frame. */
export class PendingCardRefresh {
  private cards = new Map<string, { message: ChatMessage; actor: string; combat: string | null | undefined }>();
  private queued = new Set<string>();
  private scheduled = false;
  constructor(private update: (message: ChatMessage) => void) {}
  remember(message: ChatMessage): void {
    if (!message.id) return;
    const data = foundry.utils.getProperty(message, "flags.pneuma-combattools.exchange") as
      { state?: string; defenderActor: string; combatId?: string | null; round?: string } | undefined;
    if (!data || !["waiting", "applying"].includes(data.state ?? "")) { this.forget(message.id); return; }
    this.cards.set(message.id, { message, actor: data.defenderActor,
      combat: data.combatId !== undefined ? data.combatId : data.round === "outside-combat" ? null : data.round?.split(":")[0] });
  }
  forget(id: string): void { this.cards.delete(id); this.queued.delete(id); }
  refresh(actor?: string, combat?: string): void {
    for (const [id, card] of this.cards) {
      if (actor !== undefined && card.actor !== actor) continue;
      if (combat !== undefined && card.combat !== combat) continue;
      this.queued.add(id);
    }
    if (!this.queued.size || this.scheduled) return;
    this.scheduled = true;
    requestAnimationFrame(() => {
      this.scheduled = false;
      const ids = [...this.queued]; this.queued.clear();
      for (const id of ids) {
        const card = this.cards.get(id);
        if (card?.message.visible && (!card.message.blind || game.user?.isGM)) this.update(card.message);
      }
    });
  }
}
