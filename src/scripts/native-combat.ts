import { checkedLuck } from "./evasion-rules.js";
export interface NativeRoll {
  rollTitle: string; rollCard: string; resultTotal: number; luck: number; formula?: string;
  mods: { id?: string; value: number; source: string }[];
  entityData?: { actor: string; token: string; item: string; tokens: string[] };
  criticalCard?: boolean; location?: string; isAimed?: boolean; isAutofire?: boolean; autofireMultiplier?: number; autofireMultiplierMax?: number; _roll?: Roll; _critRoll?: Roll;
  addMod(mods: { id?: string; value: number; source: string }[]): void;
  handleRollDialog(event: unknown, actor: Actor, item: Item): Promise<boolean>;
  roll(): Promise<void>; wasCritical(): boolean;
}
export interface RollItem extends Item {
  hasAmmo?(roll: NativeRoll): boolean;
  createRoll(type: string, actor: Actor, options?: unknown): NativeRoll;
  confirmRoll(roll: NativeRoll): Promise<NativeRoll>;
}
interface NativeAPI {
  Dice: { handle3dDice(roll: Roll, mode?: string): Promise<void> };
}
let api: Promise<NativeAPI> | undefined;
const hiddenDice = new WeakSet<Roll>();
export async function nativeAPI(): Promise<NativeAPI> {
  api ??= (async () => {
    const path = "/systems/cyberpunk-red-core/modules/extern/cpr-dice-handler.js";
    const Dice = (await import(path)).default as NativeAPI["Dice"];
    const original = Dice.handle3dDice;
    Dice.handle3dDice = function(roll, mode) {
      return hiddenDice.has(roll) ? Promise.resolve() : original.call(this, roll, mode);
    };
    return { Dice };
  })();
  return api;
}
/** Mark only this native roll's dice; never change the user's global roll mode. */
export async function rollHidden(roll: NativeRoll): Promise<void> {
  await nativeAPI();
  for (const key of ["_roll", "_critRoll"] as const) {
    let value = roll[key];
    Object.defineProperty(roll, key, { configurable: true, enumerable: true,
      get: () => value, set: (next: Roll) => { value = next; if (next) hiddenDice.add(next); } });
  }
  await roll.roll();
}
export function diceJSON(roll: NativeRoll): string[] {
  return [roll._roll, roll._critRoll].filter((die): die is Roll => !!die).map(die => JSON.stringify(die.toJSON()));
}
export async function nativeCard(roll: NativeRoll): Promise<string> {
  roll.criticalCard = roll.wasCritical();
  return renderTemplate(roll.rollCard, roll);
}
const dialogNotes = new WeakMap<NativeRoll, { penalty: number; fee: number }>();
export function registerEvasionDialog(): void {
  Hooks.on("renderCPRRollDialog", (app: FormApplication & { rollData?: NativeRoll }, html: JQuery) => {
    if (!app.rollData) return;
    const note = dialogNotes.get(app.rollData);
    if (!note) return;
    html.find(".pneuma-evasion-note").remove();
    const total = html.find(".total-mods").first();
    for (const text of [
      note.penalty ? "Additional ranged evasion: " + note.penalty : "",
      note.fee ? "This evasion will spend " + note.fee + " Luck" : "",
    ].filter(Boolean)) {
      const row = document.createElement("li");
      row.className = "dialog-item flexrow pneuma-evasion-note";
      row.textContent = text;
      total.before(row);
    }
  });
}
export async function evasionDialog(roll: NativeRoll, actor: Actor, item: Item,
  penalty: number, fee: number): Promise<boolean> {
  if (penalty) roll.addMod([{ id: "pneuma-ranged-evasion", source: "Additional ranged evasion", value: penalty }]);
  dialogNotes.set(roll, { penalty, fee });
  try {
    // Always show the required cost, independent of Ctrl-to-skip preferences.
    return await roll.handleRollDialog({ type: "pneuma-evasion", ctrlKey: false, metaKey: false }, actor, item);
  } finally { dialogNotes.delete(roll); }
}
export async function spendBonusLuck(actor: Actor, bonus: number): Promise<void> {
  const current = Number(foundry.utils.getProperty(actor, "system.stats.luck.value"));
  const remaining = checkedLuck(current, 0, bonus);
  if (bonus) await actor.update({ "system.stats.luck.value": remaining } as Parameters<Actor["update"]>[0]);
}
interface AttackChoice { unaware: boolean; improvised: boolean; improvisedDice?: number }
const attackChoices = new WeakMap<NativeRoll, AttackChoice>();
/** Keep native form inputs/listeners and footer; only split scrolling from actions. */
export function layoutAttackDialog(app: FormApplication, root?: HTMLElement): void {
  if(!root)return;
  const form=root.matches("form.dialog-sheet")?root:root.querySelector<HTMLElement>("form.dialog-sheet");
  const windowRoot=root.closest<HTMLElement>(".window-app")??(root.matches(".window-app")?root:null);
  const footer=form?.querySelector<HTMLElement>(".dialog-footer");
  if(!form||!windowRoot||!footer)return;
  windowRoot.classList.add("pneuma-attack-dialog");
  let body=form.querySelector<HTMLElement>(":scope > .pneuma-attack-dialog-body");
  if(!body){body=document.createElement("div");body.className="pneuma-attack-dialog-body";
    for(const child of Array.from(form.childNodes))if(child!==footer)body.append(child);
    form.prepend(body);
  }
  const mods=form.querySelector<HTMLInputElement>('input[name="additionalMods"]');
  if(mods){
    mods.setAttribute("aria-label","Additional modifiers");mods.placeholder="e.g. 1, -2";
    mods.closest(".dialog-item")?.classList.add("pneuma-additional-mods-row");
    if(!form.querySelector(".pneuma-modifier-hint")){
      const hint=document.createElement("p");hint.className="pneuma-modifier-hint";
      hint.id=windowRoot.id+"-modifier-hint";hint.textContent="Separate modifiers with commas, e.g. 1, -2.";
      mods.closest(".dialog-item")?.append(hint);mods.setAttribute("aria-describedby",hint.id);
    }
  }
  requestAnimationFrame(()=>{
    if(!windowRoot.isConnected)return;
    const previousFlex=body!.style.flex;body!.style.flex="0 0 auto";
    const contentHeight=body!.scrollHeight;body!.style.flex=previousFlex;
    const chromeHeight=windowRoot.getBoundingClientRect().height-body!.getBoundingClientRect().height;
    const height=Math.min(window.innerHeight-16,Math.ceil(contentHeight+chromeHeight+2));
    const top=Math.max(8,Math.min(windowRoot.getBoundingClientRect().top,window.innerHeight-height-8));
    app.setPosition({height,top});
  });
}
export function registerAttackDialog(): void {
  Hooks.on("renderCPRRollDialog", (app: FormApplication & { rollData?: NativeRoll }, html: JQuery) => {
    const choice = app.rollData && attackChoices.get(app.rollData);
    if (!choice) return;
    html.find(".pneuma-unaware-choice, .pneuma-improvised-damage-choice").remove();
    if (choice.improvised) {
      const row = document.createElement("li");
      row.className = "dialog-item flexrow pneuma-improvised-damage-choice";
      const label = document.createElement("label");
      label.append(document.createTextNode("Improvised damage (GM agreed) "));
      const select = document.createElement("select");
      select.required = true; select.setAttribute("aria-label", "Improvised damage (GM agreed)");
      select.append(new Option("Choose damage", ""));
      for (let dice = 1; dice <= 6; dice++) select.append(new Option(dice + "d6", String(dice)));
      select.value = choice.improvisedDice ? String(choice.improvisedDice) : "";
      const validate = () => {
        const dice = Number(select.value);
        choice.improvisedDice = Number.isInteger(dice) && dice >= 1 && dice <= 6 ? dice : undefined;
        html.find('.cpr-dialog-button[name="confirm"]').prop("disabled", choice.improvisedDice === undefined);
      };
      select.addEventListener("change", validate);
      validate(); label.append(select); row.append(label);
      html.find(".total-mods").first().before(row);
    }
    layoutAttackDialog(app,html[0]);
    if (!game.user?.isGM) return;
    const row = document.createElement("li");
    row.className = "dialog-item flexrow pneuma-unaware-choice";
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "checkbox"; input.checked = choice.unaware;
    input.addEventListener("change", () => { choice.unaware = input.checked; });
    label.append(input, document.createTextNode(" Defender is unaware"));
    row.append(label); html.find(".total-mods").first().before(row);
  });
}
export async function attackDialog(roll: NativeRoll, actor: Actor, item: Item, event: unknown, improvised = false) {
  const choice: AttackChoice = { unaware: false, improvised };
  if (game.user?.isGM || improvised) attackChoices.set(roll, choice);
  try {
    const confirmed = await roll.handleRollDialog(game.user?.isGM || improvised
      ? { type: "pneuma-attack", ctrlKey: false, metaKey: false } : event, actor, item);
    if (confirmed && improvised && choice.improvisedDice === undefined)
      throw new Error("Choose improvised damage from 1d6 to 6d6 before attacking.");
    return { confirmed, unaware: !!game.user?.isGM && choice.unaware,
      ...(improvised ? { improvisedDice: choice.improvisedDice } : {}) };
  } finally { attackChoices.delete(roll); }
}
