import {displayedEncounter} from "./encounter.js";
import {bindStatusActions, closeStatusActions} from "./neural-intrusion.js";
import {forceOutEntries} from "./quickhack/force-out.js";
import {injuryGuidance} from "./injury-notices.js";
import { collectHUDConditions, lastingDrugs } from "./hud-conditions.js";
import {movementHUD} from "./aoe/movement.js";
import { grappleHUD } from "./grapple/state.js";
import { registerHUDMessages, postHUDMessage, listHUDMessages, dismissHUDMessage, hudMessageKey } from "./hud-messages.js";
import { getItemMarkers } from "./item-markers.js";
import { createEKGTrace, vitalState, indicatorState, signalExposure, clearRoundExposures, type LampId } from "./biomonitor.js";
const MODULE = "pneuma-combattools";
declare global { interface SettingConfig {
  "pneuma-combattools.biomonitorShowHP": boolean;
  "pneuma-combattools.eyeHUDMinimized": boolean;
  "pneuma-combattools.crewHUDIntegration": boolean;
  "pneuma-combattools.eyeHUDDock": string;
  "pneuma-combattools.biomonitorFlashSeconds": number;
  "pneuma-combattools.eyeHUDMessage": HUDMessage | null;
  "pneuma-combattools.eyeHUD": boolean;
  "pneuma-combattools.eyeHUDAnimateMessages": boolean;
  "pneuma-combattools.forcePlayerHUDAnimations": boolean;
  "pneuma-combattools.eyeHUDPosition": { x: number; y: number; right?: number } | null;
} }

function hudAnimationsEnabled(): boolean {
  return (!game.user?.isGM && game.settings!.get(MODULE, "forcePlayerHUDAnimations")) || game.settings!.get(MODULE, "eyeHUDAnimateMessages");
}
function syncAnimationSettingVisibility(scope: ParentNode = document): void {
  scope.querySelectorAll<HTMLElement>('[name="pneuma-combattools.forcePlayerHUDAnimations"]').forEach(control => { const row = control.closest<HTMLElement>(".form-group"); if (row) row.hidden = !game.user?.isGM; });
  const forced = !game.user?.isGM && game.settings!.get(MODULE, "forcePlayerHUDAnimations");
  scope.querySelectorAll<HTMLElement>('[name="pneuma-combattools.eyeHUDAnimateMessages"]').forEach(control => {
    const row = control.closest<HTMLElement>(".form-group");
    if (row) row.hidden = forced;
  });
}

const messageDurations = [[60, "60 Seconds"], [300, "5 Minutes"], [900, "15 Minutes"], [3600, "1 Hour"], [21600, "6 Hours"]] as const;
type HUDMessage = { id: string; text: string; recipients: string[]; expires: number };
let messageTimer: ReturnType<typeof setTimeout> | undefined;
const dismissedLegacyMessages = new Set<string>();
let hoveredHUDToken: Token | undefined;
let attachments: HTMLElement | undefined;
export function hasBiomonitor(actor: Actor): boolean {
  return Array.from(actor.items).some(item => {
    const system = item.system as unknown as { isInstalledInActor?: boolean; isInstalled?: boolean };
    const source = String(foundry.utils.getProperty(item, "flags.core.sourceId") ?? foundry.utils.getProperty(item, "_stats.compendiumSource") ?? "");
    return String(item.type) === "cyberware" && !!(system.isInstalledInActor ?? system.isInstalled)
      && (item.name?.trim().toLowerCase() === "biomonitor" || source.endsWith(".0d2bEozOFhfPgkUP"));
  });
}
function messageChanged() {
  if (messageTimer) clearTimeout(messageTimer);
  const message = game.settings!.get(MODULE, "eyeHUDMessage");
  if (message && message.expires > Date.now()) messageTimer = setTimeout(schedule, Math.min(message.expires - Date.now() + 20, 300020));
  schedule();
}
export async function sendHUDMessage(text: string, recipient: string, seconds: number) {
  if (!game.user?.isGM) throw new Error("Only a GM can send HUD messages.");
  text = text.trim();
  if (!text || text.length > 200) throw new Error("Enter a message of 1–200 characters.");
  if (!messageDurations.some(([value]) => value === seconds)) throw new Error("Choose a valid duration.");
  const recipients = recipient === "all" ? game.users!.filter(user => user.active && !user.isGM).map(user => user.id!)
    : game.users!.get(recipient)?.active ? [recipient] : [];
  if (!recipients.length) throw new Error("No connected recipients.");
  postHUDMessage({ source: MODULE, text, recipients, duration: seconds });
}
function openHUDMessageDialog(): void {
    if (!game.user?.isGM) return;
    const form = document.createElement("form");
    const users = document.createElement("select"); users.name = "recipient"; users.setAttribute("aria-label", "Recipient");
    users.append(new Option("All connected players", "all"));
    for (const user of game.users ?? []) if (user.active) users.append(new Option(user.name ?? "User", user.id!));
    const text = document.createElement("input"); text.name = "message"; text.maxLength = 200; text.placeholder = "HUD message"; text.setAttribute("aria-label", "Message");
    const duration = document.createElement("select"); duration.name = "duration"; duration.setAttribute("aria-label", "Duration");
    for (const [seconds, label] of messageDurations) duration.append(new Option(label, String(seconds), seconds === 60, seconds === 60));
    form.append(users, text, duration);
    new Dialog({ title: "Send HUD message", content: form.outerHTML, buttons: {
      send: { label: "Send", callback: async (html: JQuery) => {
        try { await sendHUDMessage(String(html.find('[name="message"]').val() ?? ""), String(html.find('[name="recipient"]').val()), Number(html.find('[name="duration"]').val())); }
        catch (error) { ui.notifications!.error((error as Error).message); }
      } },
      cancel: { label: "Cancel" }
    }, default: "send" }).render(true);
}

interface Notice { title: string; detail: string; icon?: string }
const guidance: Record<string, string> = {
  "Crushed Windpipe": "You cannot speak.",
  "Broken Arm": "Arm unusable. Drop what it was holding.",
  "Broken Jaw": "Speech actions are impaired.",
  "Spinal Injury": "Next turn: movement only.",
  "Broken Ribs": "Moving on foot may cause injury damage at turn end.",
  "Prone": "You are on the ground.",
};
let root: HTMLElement | undefined;
let hudBody: HTMLElement | undefined;
let medicalSignature = "";
let messageSignature = "";
let queued = false;
const dismissed = new Set<string>();
const attacks = new Map<string, ChatMessage>();
function actorInFocus(): Actor | undefined {
  const tokens = canvas.tokens?.controlled ?? [];
  if (tokens.length === 1 && tokens[0]?.actor?.isOwner) return tokens[0].actor;
  if (game.user?.isGM) return;
  const character = game.user?.character;
  const owned = (canvas.tokens?.placeables ?? []).filter(token => token.actor?.isOwner);
  // Players with one owned scene token need not also configure a User Character.
  if (!character) return owned.length === 1 ? owned[0]!.actor ?? undefined : undefined;
  // Unlinked tokens carry their own HP, connections and attack recipient UUID.
  const matches = owned.filter(token => token.document.actorId === character.id || token.actor!.uuid === character.uuid);
  if (matches.length === 1) return matches[0]!.actor ?? character;
  // Do not choose an arbitrary synthetic actor when several copies are on the scene.
  return character;
}
type HUDConditions = ReturnType<typeof collectHUDConditions>;
export function eyeConditions(actor: Actor, data: HUDConditions = collectHUDConditions(actor)): Notice[] {
  return data.medical.map(row => ({...row, detail: injuryGuidance[row.title] ?? guidance[row.title] ?? "View actor sheet for details."}));
}
function displayedActor(): Actor | undefined {
  const token = hoveredHUDToken;
  return token?.isVisible && !token.isPreview && canvas.activeLayer === canvas.tokens && token.actor && hasBiomonitor(token.actor)
    ? token.actor : actorInFocus();
}
interface CrewShortcutAPI {
  version: number;
  isAvailable(): boolean;
  getBounds?(): DOMRect | undefined;
  register(id: string, content: HTMLElement): void;
  unregister(id: string): void;
  subscribe(listener: () => void): () => void;
}
let crewShortcuts: CrewShortcutAPI | undefined;
function biomonLeftDock(): boolean {
  return game.settings!.get(MODULE, "combatBarDock") === "top-right" || game.settings!.get(MODULE, "eyeHUDDock") === "left";
}
function leftAlignedMessages(): boolean {
  return integratedHUD() || biomonLeftDock();
}
function readHUDVitals(actor: Actor | undefined) {
  const hp = Number(foundry.utils.getProperty(actor ?? {}, "system.derivedStats.hp.value"));
  const max = Number(foundry.utils.getProperty(actor ?? {}, "system.derivedStats.hp.max"));
  const valid = Number.isFinite(hp) && Number.isFinite(max) && max > 0;
  const state = valid ? vitalState(hp, max) : "unknown" as const;
  return { hp, max, valid, state };
}
function integratedHUD(): boolean {
  return !!game.settings!.get(MODULE, "crewHUDIntegration") && !!crewShortcuts?.isAvailable();
}
let crewButton: HTMLButtonElement | undefined;
function updateCrewButton(actor: Actor | undefined, alert: boolean, title: string): void {
  if (!integratedHUD()) { crewShortcuts?.unregister(MODULE); return; }
  if (!crewButton) {
    crewButton = control("", async () => {
      const open = game.settings!.get(MODULE, "eyeHUD") && !game.settings!.get(MODULE, "eyeHUDMinimized");
      await game.settings!.set(MODULE, "eyeHUD", true);
      await game.settings!.set(MODULE, "eyeHUDMinimized", !!open);
    });
    crewButton.id = "pneuma-biomon-shortcut";
    crewButton.append(biomonIcon());
  }
  const open = game.settings!.get(MODULE, "eyeHUD") && !game.settings!.get(MODULE, "eyeHUDMinimized");
  crewButton.title = title;
  crewButton.setAttribute("aria-label", open ? "Minimize Biomon" : "Open Biomon");
  crewButton.setAttribute("aria-expanded", String(!!open));
  crewButton.dataset.state = readHUDVitals(actor).state;
  crewButton.classList.toggle("has-alert", alert);
  crewShortcuts!.register(MODULE, crewButton);
}
function positionAttachments() {
  if (!root || !attachments) return;
  const bounds = root.getBoundingClientRect();
  const leftDock = leftAlignedMessages();
  const width = Math.min(600, Math.max(0, leftDock ? window.innerWidth - bounds.left - 8 : bounds.right - 8));
  attachments.style.width = width + "px";
  attachments.style.left = Math.max(8, leftDock ? bounds.left : bounds.right - width) + "px";
  attachments.style.top = bounds.bottom + "px";
  const identity = attachments.querySelector<HTMLElement>(".pneuma-eye-identity");
  if (identity) {
    identity.style.marginLeft = Math.max(0, bounds.left - parseFloat(attachments.style.left)) + "px";
    identity.style.width = bounds.width + "px";
  }
}
function exchange(message: ChatMessage): Record<string, unknown> | undefined {
  return foundry.utils.getProperty(message, "flags." + MODULE + ".exchange") as Record<string, unknown> | undefined;
}
function remember(message: ChatMessage) {
  if(foundry.utils.getProperty(message,"flags.pneuma-combattools.quickhack"))schedule();
  const data = exchange(message);
  const previous = attacks.get(message.id!);
  if (!data && !previous) return;
  if (data?.state === "waiting" || data?.state === "applying") attacks.set(message.id!, message);
  else { attacks.delete(message.id!); dismissed.delete(message.id!); }
  const actor = actorInFocus();
  if (actor && (data?.defenderActor === actor.uuid || (previous && exchange(previous)?.defenderActor === actor.uuid))) schedule();
}
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; render(); });
}
function element<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag); node.className = className;
  if (text) node.textContent = text;
  return node;
}
function biomonIcon(): HTMLElement {
  const icon = element("span", "pneuma-biomon-icon");
  icon.setAttribute("aria-hidden", "true");
  return icon;
}
function control(label: string, action: () => void) {
  const button = element("button", "pneuma-eye-button", label);
  button.type = "button"; button.addEventListener("click", action); return button;
}
function position(panel: HTMLElement, x: number, y: number) {
  panel.style.left = Math.max(8, Math.min(x, window.innerWidth - panel.offsetWidth - 8)) + "px";
  panel.style.top = Math.max(8, Math.min(y, window.innerHeight - panel.offsetHeight - 8)) + "px";
  positionAttachments();
}
let observedSidebar: HTMLElement | null = null;
const sidebarResizeObserver = new ResizeObserver(() => { if (root) dockHUD(root); });
const dockResizeObserver = new ResizeObserver(() => { if (root) dockHUD(root); });
function dockHUD(panel: HTMLElement) {
  if (biomonLeftDock()) {
    const controls = document.getElementById("controls")?.getBoundingClientRect();
    const navigation = document.getElementById("navigation")?.getBoundingClientRect();
    const crew = crewShortcuts?.getBounds?.();
    const x = Math.max(8, crew ? crew.right + 8 : controls && controls.width ? controls.right + 8 : 108);
    const y = Math.max(8, crew ? crew.bottom + 8 : navigation && navigation.height ? navigation.bottom + 8 : 80);
    panel.style.maxWidth = Math.max(0, window.innerWidth - x - 8) + "px";
    position(panel, x, y);
    return;
  }
  const sidebar = document.getElementById("sidebar");
  if (sidebar !== observedSidebar) {
    sidebarResizeObserver.disconnect();
    observedSidebar = sidebar;
    if (sidebar) sidebarResizeObserver.observe(sidebar);
  }
  const bounds = sidebar?.getBoundingClientRect();
  const edge = bounds && bounds.width > 0 ? Math.min(window.innerWidth, bounds.left) : window.innerWidth;
  panel.style.maxWidth = Math.max(0, edge - 16) + "px";
  position(panel, edge - 8 - panel.offsetWidth, 8);
}
function openCard(id: string) {
  void ui.sidebar!.activateTab("chat");
  const card = document.querySelector<HTMLElement>('#chat-log [data-message-id="' + CSS.escape(id) + '"]');
  if (card) { card.scrollIntoView({ block: "center", behavior: "smooth" }); }
  else ui.notifications!.info("Open the pending Combat Tools resolution card in chat.");
}

let ekgPaused = false;
let lampTimer: ReturnType<typeof setTimeout> | undefined;
function createEKG(state: ReturnType<typeof vitalState> | "unknown", compact = false) {
  const svg = createEKGTrace(state);
  svg.setAttribute("tabindex", "0"); svg.setAttribute("role", "button");
  const syncPlayback = () => {
    svg.classList.toggle("is-paused", ekgPaused);
    svg.setAttribute("aria-pressed", String(ekgPaused));
    svg.setAttribute("aria-label", (ekgPaused ? "Resume" : "Pause") + (compact ? " EKG animation." : " EKG animation. Focus or hover to reveal hit points."));
  };
  const togglePlayback = () => { ekgPaused = !ekgPaused; if (compact) medicalSignature = ""; syncPlayback(); };
  svg.addEventListener("click", togglePlayback);
  svg.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); togglePlayback(); }
  });
  syncPlayback();
  return svg;
}
function vitals(actor: Actor | undefined, states: ReturnType<typeof indicatorState>, data: HUDConditions) {
  const box = element("div", "pneuma-eye-vitals");
  const { hp, max, valid, state } = readHUDVitals(actor);
  box.dataset.state = state;
  box.append(element("div", "pneuma-eye-medical-label", "Vitals"));
  const reading = element("div", "pneuma-eye-hp");
  reading.append(element("strong", "", valid ? String(hp) : "—"), element("span", "", valid ? " / " + max : " / —"));
  box.append(reading);
  box.classList.toggle("conceal-hp", !game.settings!.get(MODULE, "biomonitorShowHP"));
  const svg = createEKG(state);
  box.append(svg);
  const labels = { normal: "Normal", wounded: "Wounded", serious: "Seriously wounded", critical: "Critical", flatline: "Flatline", unknown: "HP unavailable" };
  box.append(element("div", "pneuma-eye-vital-state", labels[state]));
  const activeDrugs = new Set(data.drugs);
  const drugLights = element("div", "pneuma-eye-drug-lights");
  for (const drug of lastingDrugs.filter(drug => activeDrugs.has(drug.name))) {
    const light = element("span", "pneuma-eye-drug-light is-on");
    light.dataset.kind = drug.kind; light.dataset.effectKey = "drug:" + drug.name;
    light.title = drug.name;
    light.dataset.tooltip = light.title;
    light.setAttribute("role", "img"); light.setAttribute("aria-label", light.title);
    light.append(element("i", "fas " + drug.icon)); drugLights.append(light);
  }
  box.append(drugLights);
  const indicators = element("div", "pneuma-eye-lamps");
  let next = Infinity;
  for (const lamp of states.filter(lamp => lamp.on)) {
    const light = element("span", "pneuma-eye-lamp" + (lamp.on ? " is-on" : "") + (lamp.flashing ? " is-flashing" : ""));
    light.dataset.effectKey = "exposure:" + lamp.id;
    light.dataset.kind = lamp.id; light.title = lamp.name + (lamp.on ? " detected" : " inactive");
    light.setAttribute("role", "img"); light.setAttribute("aria-label", light.title);
    const icon = element("i", "fas " + lamp.icon); icon.setAttribute("aria-hidden", "true");
    light.append(icon, element("span", "", lamp.name)); indicators.append(light);
    if (lamp.id === "intrusion") {
      const bolt = element("i", "fas fa-bolt pneuma-intrusion-bolt"); bolt.setAttribute("aria-hidden", "true"); light.append(bolt);
    }
    if (actor?.isOwner && (lamp.id === "fire" || lamp.id === "intrusion")) {
      light.title += lamp.id === "fire" ? " · Right-click: Extinguish" : " · Right-click: Eject Netrunner";
      light.setAttribute("aria-label", light.title);
    }
    if (lamp.expires) next = Math.min(next, lamp.expires);
  }
  if (lampTimer) clearTimeout(lampTimer);
  if (Number.isFinite(next)) lampTimer = setTimeout(schedule, Math.max(10, next - Date.now() + 20));
  if (actor?.isOwner) bindStatusActions(indicators, actor, schedule);
  box.append(indicators);
  return box;
}

type EffectArrival = { key: string; name: string; icon: string; color: string };
let effectActor: string | undefined;
let previousEffects = new Set<string>();
const effectArrivals = new Map<string, { node: HTMLElement; animation: Animation }>();
let effectOverlay: HTMLElement | undefined;
function syncArrivalLights() {
  root?.querySelectorAll<HTMLElement>("[data-effect-key]").forEach(light => {
    light.classList.toggle("is-arriving", effectArrivals.has(light.dataset.effectKey!));
  });
}
function clearEffectArrivals() {
  for (const { node, animation } of effectArrivals.values()) { animation.cancel(); node.remove(); }
  effectArrivals.clear(); effectOverlay?.remove(); effectOverlay = undefined;
  syncArrivalLights();
}
function updateEffectArrivals(actor: Actor | undefined, data: HUDConditions) {
  const identity = actor?.uuid;
  const active: EffectArrival[] = lastingDrugs.filter(drug => (data?.drugs ?? []).includes(drug.name))
    .map(drug => ({key: "drug:" + drug.name, name: drug.name, icon: drug.icon, color: drug.kind === "drug" ? "#ff666b" : "#65e9a0"}));
  const colors = { poison: "#76ef69", radiation: "#ffe16b", biotoxin: "#d892ff", fire: "#ff853e", addict: "#ff666b", jacked: "#64f1df", intrusion: "#e1a0ff", unconscious: "#ead56c" };
  if (identity) for (const lamp of indicatorState(identity, data?.exposures ?? [], game.settings!.get(MODULE, "biomonitorFlashSeconds"), !!displayedEncounter())) {
    if (lamp.on) active.push({ key: "exposure:" + lamp.id, name: lamp.name, icon: lamp.icon, color: colors[lamp.id] });
  }
  const current = new Set(active.map(effect => effect.key));
  const enabled = hudAnimationsEnabled() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Opening or switching a monitor establishes a baseline; existing conditions are not new events.
  if (identity !== effectActor || !enabled) {
    clearEffectArrivals(); effectActor = identity; previousEffects = current; return;
  }
  for (const [key, arrival] of effectArrivals) if (!current.has(key)) {
    arrival.animation.cancel(); arrival.node.remove(); effectArrivals.delete(key);
  }
  for (const effect of active.filter(effect => !previousEffects.has(effect.key))) {
    const overlay = effectOverlay ??= element("div", "pneuma-eye-effect-arrivals");
    if (!overlay.isConnected) document.body.append(overlay);
    const node = element("div", "pneuma-eye-effect-arrival");
    node.dataset.effectKey = effect.key; node.style.color = effect.color;
    node.setAttribute("role", "img"); node.setAttribute("aria-label", effect.name + " detected");
    const glyph = element("i", "fas " + effect.icon); glyph.setAttribute("aria-hidden", "true");
    const beam = element("span", "pneuma-eye-effect-beam"); beam.setAttribute("aria-hidden", "true");
    node.append(glyph, beam); overlay.append(node);
    const animation = node.animate([
      {clipPath:"inset(0 0 100% 0)",opacity:1,offset:0},
      {clipPath:"inset(0)",opacity:1,offset:.22},
      {opacity:1,offset:.30,easing:"steps(1,end)"},
      {opacity:0,offset:.34,easing:"steps(1,end)"},
      {opacity:1,offset:.40,easing:"steps(1,end)"},
      {opacity:0,offset:.48,easing:"steps(1,end)"},
      {opacity:1,offset:.54,easing:"steps(1,end)"},
      {opacity:0,offset:.62,easing:"steps(1,end)"},
      {opacity:1,offset:.68},
      {clipPath:"inset(0)",opacity:1,offset:.9},
      {clipPath:"inset(49% 0)",opacity:0,offset:1}
    ], {duration:2400,easing:"linear"});
    effectArrivals.set(effect.key, {node, animation});
    animation.onfinish = () => {
      node.remove(); effectArrivals.delete(effect.key); syncArrivalLights();
      if (!effectArrivals.size) { effectOverlay?.remove(); effectOverlay = undefined; }
    };
  }
  previousEffects = current;
  if (!effectArrivals.size) { effectOverlay?.remove(); effectOverlay = undefined; }
  syncArrivalLights();
}

/** Flash-only notices have no queued row or dismiss button. */
const flashNotices = new Map<string, { row: HTMLElement; timer: ReturnType<typeof setTimeout> }>();
function removeFlashNotice(key: string): void {
  const notice = flashNotices.get(key);
  if (!notice) return;
  clearTimeout(notice.timer);
  notice.row.remove();
  flashNotices.delete(key);
  if (!flashNotices.size) document.getElementById("pneuma-hud-flashes")?.remove();
}
function showFlashNotice(notice: import("./hud-messages.js").HUDNotice, remove = false): void {
  const key = hudMessageKey(notice);
  removeFlashNotice(key);
  if (remove || !game.settings!.get(MODULE, "eyeHUD")) return;
  const row = element("div", "pneuma-hud-flash");
  row.setAttribute("role", "status");
  row.textContent = notice.text;
  let stack = document.getElementById("pneuma-hud-flashes");
  if (!stack) { stack = element("div", "pneuma-hud-flashes"); stack.id = "pneuma-hud-flashes"; document.body.append(stack); }
  stack.append(row);
  const animated = hudAnimationsEnabled() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (animated) row.animate([
    { clipPath: "inset(0 0 100% 0)", opacity: 1, offset: 0 },
    { clipPath: "inset(0)", opacity: 1, offset: .18 },
    { clipPath: "inset(0)", opacity: 1, offset: .8 },
    { clipPath: "inset(49% 0)", opacity: 1, offset: .94 },
    { clipPath: "inset(50% 0)", opacity: 0, offset: 1 }
  ], { duration: 4000, fill: "forwards" });
  const timer = setTimeout(() => removeFlashNotice(key), 4000);
  flashNotices.set(key, { row, timer });
}

/** Animate the real text, retaining its layout slot and private recipient filtering. */
function animateIncomingMessages(rows: HTMLElement[]) {
  if (!hudAnimationsEnabled() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const entries = rows.map(row => {
    const text = row.firstElementChild as HTMLElement;
    const bounds = text.getBoundingClientRect();
    const scale = Math.max(1, Math.min(3, (window.innerWidth - 48) / Math.max(1, bounds.width), window.innerHeight * .22 / Math.max(1, bounds.height)));
    return { text, bounds, scale, height: bounds.height * scale };
  });
  const totalHeight = entries.reduce((sum, entry) => sum + entry.height + 16, -16);
  let top = (window.innerHeight - totalHeight) / 2;
  for (const { text, bounds, scale, height } of entries) {
    const x = window.innerWidth / 2 - (bounds.left + bounds.width / 2);
    const y = top + height / 2 - (bounds.top + bounds.height / 2);
    top += height + 16;
    const center = `translate(${x}px, ${y}px) scale(${scale})`;
    const line = element("span", "pneuma-eye-scanline");
    line.setAttribute("aria-hidden", "true");
    text.append(line);
    const beam = line.animate([
      { top: "0%", opacity: 1, offset: 0 },
      { top: "100%", opacity: 1, offset: .07 },
      { top: "100%", opacity: 0, offset: .09 },
      { top: "50%", opacity: 0, offset: .70 },
      { top: "50%", opacity: 1, offset: .82 },
      { top: "50%", opacity: 1, offset: .85 },
      { top: "50%", opacity: 0, offset: .88 },
      { top: "0%", opacity: 1, offset: .90 },
      { top: "100%", opacity: 1, offset: .98 },
      { top: "100%", opacity: 0, offset: 1 }
    ], { duration: 6000, easing: "linear" });
    const arrival = text.animate([
      { transform: center, clipPath: "inset(0 0 100% 0)", opacity: 1, offset: 0 },
      { transform: center, clipPath: "inset(0)", opacity: 1, offset: .07 },
      { transform: center, clipPath: "inset(0)", opacity: 1, offset: .70 },
      { transform: center, clipPath: "inset(49% 0)", opacity: 1, offset: .82 },
      { transform: center, clipPath: "inset(49% 0)", opacity: 1, offset: .85 },
      { transform: center, clipPath: "inset(50% 0)", opacity: 0, offset: .88 },
      { transform: "none", clipPath: "inset(0 0 100% 0)", opacity: 0, offset: .89 },
      { transform: "none", clipPath: "inset(0 0 100% 0)", opacity: 1, offset: .90 },
      { transform: "none", clipPath: "inset(0)", opacity: 1, offset: .98 },
      { transform: "none", clipPath: "inset(0)", opacity: 1, offset: 1 }
    ], { duration: 6000, easing: "linear" });
    const cleanup = () => { beam.cancel(); line.remove(); };
    arrival.onfinish = cleanup;
    arrival.oncancel = cleanup;
  }
}

/** Read-only integration: Visual Tools owns optional screen effects. */
function neuralIntrusionActor(): string | undefined {
  const actor = actorInFocus();
  return actor?.isOwner && forceOutEntries(actor).length ? actor.uuid : undefined;
}
let publishedIntrusion: string | undefined;
function publishIntrusionState(): void {
  const actorUuid = neuralIntrusionActor();
  if (actorUuid === publishedIntrusion) return;
  publishedIntrusion = actorUuid;
  Hooks.callAll("pneumaCombatToolsNeuralIntrusionChanged", actorUuid);
}
function render() {
  closeStatusActions();
  publishIntrusionState();
  const incomingRows: HTMLElement[] = [];
  if (!game.settings!.get(MODULE, "eyeHUD")) {
    for (const key of flashNotices.keys()) removeFlashNotice(key);
    updateCrewButton(actorInFocus(), false, "Open Biomon");
    clearEffectArrivals(); effectActor = undefined; previousEffects.clear();
    sidebarResizeObserver.disconnect(); observedSidebar = null;
    attachments?.remove(); attachments = undefined;
    root?.remove(); root = undefined; hudBody = undefined; medicalSignature = messageSignature = "";
    if (lampTimer) clearTimeout(lampTimer);
    return;
  }
  const prefersMinimized = game.settings!.get(MODULE, "eyeHUDMinimized");
  const ownActor = actorInFocus();
  const actor = displayedActor();
  const data: HUDConditions = actor ? collectHUDConditions(actor) : { medical: [], situational: [], drugs: [], exposures: [] };
  const shared = !!actor && actor.uuid !== ownActor?.uuid;
  const monitor = !!actor;
  const savedMessage = game.settings!.get(MODULE, "eyeHUDMessage");
  const custom = savedMessage && !dismissedLegacyMessages.has(savedMessage.id) && savedMessage.expires > Date.now() && savedMessage.recipients.includes(game.user!.id!) ? savedMessage : undefined;
  const pending = !ownActor ? [] : [...attacks.values()].filter(message => {
    const data = exchange(message);
    return message.visible && message.isContentVisible && !dismissed.has(message.id!)
      && data?.defenderActor === ownActor!.uuid;
  });
  type AlertEntry = { key: string; text: string; open?: () => void; clear: () => void };
  const messages: AlertEntry[] = [
    ...pending.map(message => ({ key: "attack:" + message.id!, text: "Incoming Attack", open: () => openCard(message.id!), clear: () => { dismissed.add(message.id!); } })),
    ...(custom ? [{ key: "legacy:" + custom.id, text: custom.text, clear: () => { dismissedLegacyMessages.add(custom.id); } }] : []),
    ...listHUDMessages().map(message => ({ key: hudMessageKey(message), text: message.text, clear: () => dismissHUDMessage(message.source, message.id) }))
  ];
  const minimized = prefersMinimized;
  const rows = minimized ? [] : monitor && actor ? eyeConditions(actor, data) : [];
  const panel = root ??= element("section", "pneuma-eye-hud");
  panel.id = "pneuma-eye-hud"; panel.setAttribute("aria-label", "Status HUD · " + (actor?.name ?? "No character") + (shared ? " · Biomonitor link" : ""));
  const header = element("header", "pneuma-eye-header");
  panel.classList.toggle("is-shared", shared);
  panel.classList.add("is-docked");
  if (game.user?.isGM && !minimized) {
    const send = control("", openHUDMessageDialog);
    send.append(element("i", "fas fa-envelope"));
    send.setAttribute("aria-label", "Send HUD Message");
    send.title = "Send a message to connected players";
    header.append(send);
  }
  delete panel.dataset.vitalState;
  if (minimized && monitor && actor) {
    const mini = element("div", "pneuma-eye-vitals pneuma-eye-mini-vitals");
    const { state } = readHUDVitals(actor);
    mini.dataset.state = state;
    panel.dataset.vitalState = state;
    mini.append(createEKG(state, true));
    header.append(mini);
  }
  if (!(minimized && integratedHUD())) {
    const toggle = control(minimized ? "" : "−", async () => {
      await game.settings!.set(MODULE, "eyeHUDMinimized", !minimized);
      schedule();
    });
    toggle.setAttribute("aria-label", minimized ? "Expand status HUD" : "Minimize status HUD");
    toggle.title = minimized ? (messages[0]?.text ?? "Open status HUD") : "Minimize status HUD";
    if (minimized) { toggle.append(biomonIcon()); }
    header.append(toggle);
  }
  panel.classList.toggle("is-minimized", minimized);
  panel.classList.toggle("has-mini-vitals", minimized && monitor);
  panel.classList.toggle("has-alert", messages.length > 0);
  const body = hudBody ??= element("div", "pneuma-eye-body");
  const extras = attachments ??= element("div", "pneuma-eye-attachments");
  extras.id = "pneuma-eye-attachments";
  const identity = extras.querySelector(".pneuma-eye-identity");
  if (actor && (game.user?.isGM || shared || integratedHUD())) {
    const name = identity ?? element("div", "pneuma-eye-identity");
    name.textContent = actor.name + (shared ? " · BIOMONITOR LINK" : "");
    if (!identity) extras.prepend(name);
  } else identity?.remove();
  const nextMessages = JSON.stringify([ownActor?.name, messages.map(message => [message.key, message.text])]);
  if (nextMessages !== messageSignature) {
    const previouslyShown = new Map(Array.from(extras.querySelectorAll<HTMLElement>("[data-notice-key]")).map(row => [row.dataset.noticeKey, row]));
    const messageArea = element("div", "pneuma-eye-notifications");
    messageArea.setAttribute("aria-label", "Private notifications for " + (ownActor?.name ?? game.user?.name ?? "you"));
    for (const message of messages.slice(0, 3)) {
      const existing = previouslyShown.get(message.key);
      if (existing?.dataset.noticeText === message.text) {
        messageArea.append(existing);
        continue;
      }
      const row = element("div", "pneuma-eye-notification" + (message.open ? " is-attack" : ""));
      row.dataset.noticeKey = message.key; row.dataset.noticeText = message.text;
      incomingRows.push(row);
      const text = message.open ? control(message.text, message.open) : element("span", "", message.text);
      if (message.open) text.setAttribute("aria-label", "Incoming attack: open chat card");
      row.append(text);
      const clear = control("×", () => { message.clear(); messageSignature = ""; render(); });
      clear.setAttribute("aria-label", "Clear notification: " + message.text);
      row.append(clear); messageArea.append(row);
    }
    const previous = extras.querySelector(".pneuma-eye-notifications");
    if (previous) previous.replaceWith(messageArea); else extras.append(messageArea);
    messageSignature = nextMessages;
  }
  if (!minimized) {
    const disabled = Array.from(actor?.items ?? [])
      .filter(item => String(item.type) === "cyberware" && (!!getItemMarkers(item).disabled || !!getItemMarkers(item).emp || !!getItemMarkers(item).cyberware))
      .map(item => ({ name: item.name ?? "Cyberware", detail: [getItemMarkers(item).emp?.label,getItemMarkers(item).cyberware?.label,getItemMarkers(item).disabled?.description].filter(Boolean).join("; ") || "Disabled", item }));
    const lampStates = monitor ? indicatorState(actor!.uuid, data.exposures,
      game.settings!.get(MODULE, "biomonitorFlashSeconds"), !!displayedEncounter()) : [];
    const grappleRows = actor ? [...grappleHUD(actor),...movementHUD(actor)] : [];
    const nextMedical = JSON.stringify([monitor, actor?.uuid, actor?.isOwner, grappleRows, data,
      actor && foundry.utils.getProperty(actor, "system.derivedStats.hp"), rows,
      disabled.map(entry => [entry.item?.id, entry.name, entry.detail]), lampStates,
      game.settings!.get(MODULE, "biomonitorShowHP")]);
    if (nextMedical !== medicalSignature) {
      const medical = element("div", "pneuma-eye-medical");
      const vitalColumn = element("div", "pneuma-eye-vitals-column");
      if (monitor) vitalColumn.append(vitals(actor, lampStates, data));
      medical.append(vitalColumn);
      const conditions = element("div", "pneuma-eye-conditions");
      conditions.append(element("div", "pneuma-eye-medical-label", "Biological Scan"));
      for (const notice of rows) {
        const text = notice.detail === "View actor sheet for details." ? notice.title : notice.title + " — " + notice.detail;
        const row = control("", () => { if (actor?.isOwner) actor.sheet?.render(true); });
        const glyph = element("span", "pneuma-eye-glyph", "+");
        glyph.setAttribute("aria-hidden", "true");
        if (notice.icon) { glyph.textContent = ""; const img = document.createElement("img"); img.src = notice.icon; img.alt = ""; glyph.append(img); }
        row.append(glyph, element("span", "pneuma-eye-condition-text", text));
        row.className = "pneuma-eye-condition"; row.title = text;
        conditions.append(row);
    }
    if (!rows.length) conditions.append(element("div", "pneuma-eye-condition-empty", "No Active Pathology"));
    if (monitor) medical.append(conditions);
    const cyber = element("div", "pneuma-eye-cyber");
    const cyberHeading = element("div", "pneuma-eye-cyber-heading");
    cyberHeading.append(element("div", "pneuma-eye-medical-label", "Implant Integrity"));
    cyber.append(cyberHeading);
    for (const entry of disabled) {
      const row = control(entry.name + (entry.detail === "Disabled — EMP" ? " — Disabled — EMP" : ""), () => { if (actor?.isOwner) entry.item?.sheet?.render(true); });
      row.className = "pneuma-eye-condition pneuma-eye-cyber-disabled";
      row.title = entry.name + " — " + (entry.detail || "Disabled");
      cyber.append(row);
  }
    if (!disabled.length) cyber.append(element("div", "pneuma-eye-condition-empty", "All Systems Normal"));
    if (monitor) medical.append(cyber);
    const previousMedical = body.querySelector(".pneuma-eye-medical");
    if (monitor || grappleRows.length) {
      if (previousMedical) previousMedical.replaceWith(medical); else body.prepend(medical);
    } else previousMedical?.remove();
    const dock = element("div", "pneuma-eye-status-dock");
    dock.setAttribute("aria-label", "Situational statuses");
    const statuses = data.situational;
    for (const status of [...statuses, ...grappleRows.map(row => ({title: row.text, detail: row.detail}))]) {
      const tile = element("span", "pneuma-eye-situation", status.title);
      tile.title = status.detail; dock.append(tile);
    }
    const previousDock = panel.querySelector(".pneuma-eye-status-dock");
    if (previousDock) previousDock.replaceWith(dock); else panel.append(dock);
    medicalSignature = nextMedical;
  }
  }
  if (!minimized && body.parentElement !== panel) panel.append(body);
  else if (minimized) body.remove();
  // Expanded HUD has no header row. Controls share the Implant Integrity label.
  const previousControls = Array.from(panel.querySelectorAll(".pneuma-eye-header, .pneuma-eye-inline-controls"));
  const controlParent = minimized ? panel : panel.querySelector(".pneuma-eye-cyber-heading") ?? panel;
  header.className = minimized ? "pneuma-eye-header" : "pneuma-eye-inline-controls";
  header.removeAttribute("title"); header.removeAttribute("aria-label");
  if (previousControls.length !== 1 || previousControls[0]?.outerHTML !== header.outerHTML || previousControls[0]?.parentElement !== controlParent) {
    previousControls.forEach(controls => controls.remove()); controlParent.append(header);
  }
  panel.classList.toggle("is-integrated-mini", minimized && integratedHUD());
  updateCrewButton(actor, messages.length > 0, messages[0]?.text ?? "Biomon");
  if (panel.parentElement !== document.body) document.body.append(panel);
  extras.classList.toggle("is-minimized", minimized);
  extras.classList.toggle("is-integrated", leftAlignedMessages());
  if (!extras.isConnected) document.body.append(extras);
  dockHUD(panel);
  animateIncomingMessages(incomingRows);
  updateEffectArrivals(actor, data);
}
export function registerEyeHUD() {
  registerHUDMessages(schedule, showFlashNotice);
  const module = game.modules!.get(MODULE) as unknown as {api?: Record<string, unknown>};
  module.api = {...module.api, getNeuralIntrusionActor: neuralIntrusionActor};
  const crewActive = !!game.modules?.get("pneuma-crewtools")?.active;
  game.settings!.register(MODULE, "crewHUDIntegration", { name: "Integrate with Pneuma’s Crew Tools HUD", hint: "Minimize Biomon into Crew Tools’ HUD. Falls back to the normal control when that HUD is unavailable.", scope: "client", config: crewActive, type: Boolean, default: true, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDDock", { name: "Biomon position", hint: "Choose the top-left or top-right position. Top left sits diagonally below Crew Tools when its HUD is visible, otherwise below navigation and beside canvas tools. Integration does not change placement. Combat bar Top right overrides this choice to Top left until that dock is changed.", scope: "client", config: true, type: String, choices: { right: "Top right", left: "Top left" }, default: "left", onChange: schedule });
  Hooks.once("ready", () => {
    const entry = game.modules?.get("pneuma-crewtools");
    const api = (entry as unknown as { api?: { hudShortcuts?: CrewShortcutAPI } } | undefined)?.api?.hudShortcuts;
    if (entry?.active && api?.version === 1) { crewShortcuts = api; api.subscribe(schedule); }
    for (const id of ["controls", "navigation"]) { const node = document.getElementById(id); if (node) dockResizeObserver.observe(node); }
    schedule();
  });
  Hooks.on("renderSceneNavigation", schedule);
  Hooks.on("renderSceneControls", schedule);
  game.settings!.register(MODULE, "biomonitorShowHP", { name: "Show Biomonitor HP numbers", hint: "When off, hover over or focus the heartbeat animation to reveal current and maximum HP.", scope: "client", config: true, type: Boolean, default: true, onChange: schedule });
  game.settings!.register(MODULE, "forcePlayerHUDAnimations", { name: "Force animated HUD messages for players", hint: "Hide the players’ animation setting and keep HUD message and effect animations enabled for them. GMs keep their own preference. Device reduced-motion preferences still apply.", scope: "world", config: true, type: Boolean, default: false, onChange: () => { syncAnimationSettingVisibility(); schedule(); } });
  Hooks.on("renderSettingsConfig", (_app: SettingsConfig, html: JQuery) => { if (html[0]) syncAnimationSettingVisibility(html[0]); });
  game.settings!.register(MODULE, "eyeHUDAnimateMessages", { name: "Animate HUD messages and effect icons", hint: "Scan new private messages into view at screen center, collapse them into a bright line, then reveal them below the HUD. New drug and exposure icons scan and blink three times before lighting up. Disable to show all indicators directly. Respects reduced-motion preferences.", scope: "client", config: true, type: Boolean, default: true, onChange: () => {
    clearEffectArrivals();
    attachments?.querySelectorAll<HTMLElement>(".pneuma-eye-notification > :first-child").forEach(text => text.getAnimations().forEach(animation => animation.cancel()));
    schedule();
  } });
  game.settings!.register(MODULE, "eyeHUDMinimized", { scope: "client", config: false, type: Boolean, default: false, onChange: schedule });
  game.settings!.register(MODULE, "biomonitorFlashSeconds", { name: "Biomonitor indicator flash duration", hint: "Seconds to flash a newly detected effect; ongoing conditions remain lit afterward. Zero disables flashing.", scope: "client", config: true, type: Number, default: 8, range: { min: 0, max: 60, step: 1 } });
  Hooks.on("pneumaCombatToolsExposure", (uuid: string, kind: LampId) => {
    signalExposure(uuid, kind, game.settings!.get(MODULE, "biomonitorFlashSeconds"), !!displayedEncounter());
    if(effectActor===uuid){const key="exposure:"+kind;previousEffects.delete(key);const arrival=effectArrivals.get(key);arrival?.animation.cancel();arrival?.node.remove();effectArrivals.delete(key);}
    schedule();
  });
  game.settings!.register(MODULE, "eyeHUDMessage", { scope: "world", config: false, type: Object, default: null, onChange: messageChanged });
  game.settings!.register(MODULE, "eyeHUD", { name: "Status HUD", hint: "Show your vitals, conditions, statuses and private notifications.", scope: "client", config: true, type: Boolean, default: true, onChange: schedule });
  // Keep the old hidden setting registered for compatibility; manual dragging is retired.
  game.settings!.register(MODULE, "eyeHUDPosition", { scope: "client", config: false, type: Object, default: null });
  Hooks.once("ready", () => { for (const message of game.messages ?? []) remember(message); messageChanged(); });
  Hooks.on("pneumaCombatBarDockChanged", schedule);
  for (const hook of ["controlToken", "canvasReady", "createToken", "deleteToken"]) Hooks.on(hook, schedule);
  Hooks.on("updateUser", (user: User) => { if (user.id === game.user?.id) schedule(); });
  Hooks.on("updateToken", (token: TokenDocument) => { if (hoveredHUDToken?.document === token || canvas.tokens?.controlled.some(controlled => controlled.document === token) || !game.user?.isGM && (token.actor?.isOwner || token.actorId === game.user?.character?.id)) schedule(); });
  Hooks.on("hoverToken", (token: Token, entered: boolean) => {
    if (entered) hoveredHUDToken = token;
    else if (hoveredHUDToken === token) hoveredHUDToken = undefined;
    schedule();
  });
  Hooks.on("canvasTearDown", () => { hoveredHUDToken = undefined; schedule(); });
  Hooks.on("updateCombat", (combat: Combat, change: {round?: number}) => {
    if (combat?.id === displayedEncounter()?.id && change?.round !== undefined) { clearRoundExposures(); schedule(); }
  });
  for (const hook of ["updateCombatant", "updateScene", "updateCombat", "deleteCombat", "deleteScene"]) Hooks.on(hook, schedule);
  for (const hook of ["createItem", "updateItem", "deleteItem", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect", "updateActor"]) {
    Hooks.on(hook, (doc: { uuid?: string; parent?: { uuid?: string; parent?: { uuid?: string } } }) => {
      const changed = [doc.uuid, doc.parent?.uuid, doc.parent?.parent?.uuid];
      if ([actorInFocus(), displayedActor(), hoveredHUDToken?.actor].some(actor => actor && changed.includes(actor.uuid))) schedule();
    });
  }
  Hooks.on("createChatMessage", remember); Hooks.on("updateChatMessage", remember);
  Hooks.on("deleteChatMessage", (message: ChatMessage) => { const tracked = attacks.delete(message.id!); dismissed.delete(message.id!); if (tracked || foundry.utils.getProperty(message,"flags.pneuma-combattools.quickhack")) schedule(); });
  for (const hook of ["renderSidebar", "collapseSidebar"]) Hooks.on(hook, () => { if (root) dockHUD(root); });
  window.addEventListener("resize", () => { if (root) dockHUD(root); });
}
