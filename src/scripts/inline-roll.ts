import {escapeHTML as esc} from "./shared.js";
/** Native disclosure keeps each result compact without discarding its original roll. */
export function inlineRoll(total:number|undefined,html:string|undefined,label="Roll result"):string {
  if(!html)return total===undefined?"":'<strong>'+esc(total)+'</strong>';
  return '<details class="pneuma-inline-roll"><summary title="Show roll details" aria-label="'+esc(label)+' — show roll details">'+esc(total??"Roll")+'</summary><div class="pneuma-inline-roll-details">'+html+'</div></details>';
}
