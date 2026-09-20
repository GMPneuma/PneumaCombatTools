/** Stable presentation sections; content is already-rendered native/module markup. */
const labels = {
  pending: "Pending attack", attack: "Attack", evade: "Evasion", result: "Result",
  "damage-roll": "Damage roll", "damage-apply": "Apply damage", recovery: "Recovery",
} as const;

export function resolutionSection(kind: keyof typeof labels, content: string, classes = ""): string {
  return '<section class="pneuma-resolution-section pneuma-resolution-' + kind + (classes ? ' ' + classes : '')
    + '" data-pneuma-section="' + kind + '" aria-label="' + labels[kind] + '">'
    + '<h4 class="pneuma-resolution-label pneuma-resolution-' + kind + '-label">' + labels[kind] + '</h4>'
    + '<div class="pneuma-resolution-body pneuma-resolution-' + kind + '-body">' + content + '</div></section>';
}

/** Shared presentation only: workflow permissions and rule resolution stay with their owners. */
export function rollOutcomeClass(won: boolean | undefined): string {
  return won === undefined ? "" : won ? "pneuma-roll-winner" : "pneuma-roll-loser";
}
export function styleRollOutcome(root: HTMLElement, won: boolean | undefined): void {
  root.classList.toggle("pneuma-roll-winner",won === true);
  root.classList.toggle("pneuma-roll-loser",won === false);
}
export function styleOpposedRolls(root: HTMLElement, sourceWins: boolean | undefined): void {
  Array.from(root.children).forEach((row,index) => styleRollOutcome(row as HTMLElement,
    sourceWins === undefined ? undefined : index === 0 ? sourceWins : !sourceWins));
}
export function combatCardKind(message: ChatMessage): "exchange" | "grapple" | "quickhack" | "aoe" | undefined {
  return (["exchange","grapple","quickhack","aoe"] as const).find(kind =>
    !!foundry.utils.getProperty(message,"flags.pneuma-combattools." + kind));
}
export function canRenderCombatCard(message: ChatMessage): boolean {
  return !!message.visible && message.isContentVisible !== false && (!message.blind || !!game.user?.isGM);
}
/** Add common scope without replacing any native or third-party-decorated nodes. */
export function decorateSharedCard(root: HTMLElement, message: ChatMessage): void {
  const kind = combatCardKind(message);
  if (!kind || !canRenderCombatCard(message)) return;
  root.classList.add("pneuma-combat-message");
  root.dataset.pneumaCardKind = kind;
}
