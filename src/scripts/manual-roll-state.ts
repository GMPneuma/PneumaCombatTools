import { escapeHTML as manualEscape } from "./shared.js";
import type { DamageState } from "./damage-flow.js";
export const MANUAL_MODULE = "pneuma-combattools";
export interface GroupRow { id?: string; user: string; actor: string; actorName?: string; name?: string; state: "waiting" | "rolling" | "done"; nonce?: string; roller?: string; total?: number; html?: string }
export interface InjuryResult { location: "body" | "head"; item: string; name: string; html: string }
export interface ManualCard {
  kind: "damage" | "critical" | "group"; creator: string; title: string; rollMode: string;
  damage?: DamageState; injury?: InjuryResult; rows?: GroupRow[]; skill?: string; dv?: number; hideDV?: boolean;
  injuryApplications?: string[]; injuryBusy?: boolean;
}
export { escapeHTML as manualEscape } from "./shared.js";
export function manualNumber(value: unknown, name: string, min: number, max: number): number {
  const number = Number(value);
  if (value === "" || !Number.isInteger(number) || number < min || number > max) throw Error(name + " must be a whole number from " + min + " to " + max + ".");
  return number;
}
export function groupOutcome(total: number, dv?: number): string {
  return dv === undefined ? "" : total > dv ? "Success" : "Fail";
}
function groupActorName(row: GroupRow): string {
  if (row.actorName !== undefined) return row.actorName;
  const legacy = row.name ?? "";
  const player = game.users?.get(row.user)?.name;
  if (player && legacy.startsWith(player + " - ")) return legacy.slice(player.length + 3);
  const separator = legacy.indexOf(" - ");
  if (separator < 0) return legacy;
  const actor = typeof fromUuidSync === "function" ? fromUuidSync(row.actor) as Actor | null : null;
  return actor?.name ?? legacy.slice(separator + 3);
}
export function groupContent(data: ManualCard, gm = false): string {
  const esc = manualEscape;
  return '<div class="rollcard-top"><div class="cpr-block pneuma-group-heading"><span class="text-normal text-semi">'+esc(data.skill)+'</span>'
    +(data.dv===undefined?'':'<span class="pneuma-group-dv text-normal">'+(data.hideDV&&!gm?'DV hidden':'DV '+data.dv)+'</span>')+'</div></div>'
    + '<div class="rollcard-bottom"><div class="cpr-block"><ul class="pneuma-group-rows">'  + (data.rows ?? []).map(row => {
      const actorName = groupActorName(row);
      const outcome=row.state === "done" ? groupOutcome(row.total!,data.dv) : "";
      const total=row.html ? '<a class="pneuma-group-total" role="button" tabindex="0" aria-expanded="false" aria-label="Show roll details for '+esc(actorName)+'"><strong>'+esc(row.total)+'</strong></a>' : '<strong>'+esc(row.total)+'</strong>';
      return '<li data-group-user="'+esc(row.user)+'"'+(row.id ? ' data-group-id="'+esc(row.id)+'"' : '')+'><span class="pneuma-group-actor">'+esc(actorName)+'</span><span>'
        +(row.state === "done" ? total+(outcome?' <span class="pneuma-group-outcome" data-outcome="'+outcome.toLowerCase()+'">'+outcome+'</span>':'') : row.state === "rolling" ? 'Rolling…' : 'Waiting')
        +'</span><span class="pneuma-group-action"></span>'+(row.html?'<div class="pneuma-group-details" hidden>'+row.html+'</div>':'')+'</li>';
    }).join('')+'</ul></div></div>';
}
