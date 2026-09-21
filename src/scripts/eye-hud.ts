import { collectHUDConditions, lastingDrugs } from "./hud-conditions.js";
import {movementHUD} from "./aoe/movement.js";
import { grappleHUD } from "./grapple/state.js";
import { registerHUDMessages, postHUDMessage, listHUDMessages, dismissHUDMessage, hudMessageKey } from "./hud-messages.js";
import { getItemMarkers } from "./item-markers.js";
import { createEKGTrace, vitalState, indicatorState, signalExposure, clearRoundExposures, lamps, type LampId } from "./biomonitor.js";
const MODULE = "pneuma-combattools";
declare global { interface SettingConfig {
  "pneuma-combattools.biomonitorShowHP": boolean;
  "pneuma-combattools.eyeHUDMinimized": boolean;
  "pneuma-combattools.biomonitorFlashSeconds": number;
  "pneuma-combattools.eyeHUDMessage": HUDMessage | null;
  "pneuma-combattools.eyeHUD": boolean;
  "pneuma-combattools.eyeHUDAnimateMessages": boolean;
  "pneuma-combattools.eyeHUDPreview": boolean;
  "pneuma-combattools.eyeHUDPosition": { x: number; y: number; right?: number } | null;
} }

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
const demo: Notice[] = [
  { title: "Crushed Windpipe", detail: "You cannot speak." },
  { title: "Broken Arm", detail: "Left arm unusable." },
  { title: "Spinal Injury", detail: "Next turn: movement only." },
  { title: "Medical notice", detail: "Multiple conditions can appear together." },
];
let root: HTMLElement | undefined;
let hudBody: HTMLElement | undefined;
let medicalSignature = "";
let messageSignature = "";
let queued = false;
const dismissed = new Set<string>();
const attacks = new Map<string, ChatMessage>();
function actorInFocus(): Actor | undefined {
  const tokens = canvas.tokens?.controlled ?? [];
  if (tokens.length) return tokens.length === 1 && tokens[0]?.actor?.isOwner ? tokens[0].actor : undefined;
  return game.user?.isGM ? undefined : game.user?.character ?? undefined;
}
export function eyeConditions(actor: Actor): Notice[] {
  return collectHUDConditions(actor).medical.map(row => ({...row, detail: guidance[row.title] ?? "View actor sheet for details."}));
}
function displayedActor(): Actor | undefined {
  const token = hoveredHUDToken;
  return token?.isVisible && !token.isPreview && canvas.activeLayer === canvas.tokens && token.actor && hasBiomonitor(token.actor)
    ? token.actor : actorInFocus();
}
function positionAttachments() {
  if (!root || !attachments) return;
  const bounds = root.getBoundingClientRect();
  const width = Math.min(600, Math.max(0, bounds.right - 8));
  attachments.style.width = width + "px";
  attachments.style.left = Math.max(8, bounds.right - width) + "px";
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
function control(label: string, action: () => void) {
  const button = element("button", "pneuma-eye-button", label);
  button.type = "button"; button.addEventListener("click", action); return button;
}
function position(panel: HTMLElement, x: number, y: number) {
  panel.style.left = Math.max(8, Math.min(x, window.innerWidth - panel.offsetWidth - 8)) + "px";
  panel.style.top = Math.max(8, Math.min(y, window.innerHeight - panel.offsetHeight - 8)) + "px";
  positionAttachments();
}
let preferredPosition: { right: number; y: number } | undefined;
let draggingHUD = false;
// Retain manual placement for later; docking currently supersedes saved positions.
const HUD_DRAG_ENABLED = false;
let observedSidebar: HTMLElement | null = null;
const sidebarResizeObserver = new ResizeObserver(() => { if (root) restoreHUDPosition(root); });
function dockHUD(panel: HTMLElement) {
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
function restoreHUDPosition(panel: HTMLElement) {
  if (!HUD_DRAG_ENABLED) { dockHUD(panel); return; }
  if (draggingHUD) return;
  if (!preferredPosition) {
    const saved = game.settings!.get(MODULE, "eyeHUDPosition");
    preferredPosition = { right: saved?.right ?? (saved?.x !== undefined ? saved.x + 600 : window.innerWidth - 16), y: saved?.y ?? 16 };
  }
  position(panel, preferredPosition.right - panel.offsetWidth, preferredPosition.y);
}
function drag(panel: HTMLElement, handle: HTMLElement) {
  handle.addEventListener("pointerdown", event => {
    if (event.button !== 0 || (event.target as HTMLElement).closest("button, select, [role=button]")) return;
    event.preventDefault();
    const box = panel.getBoundingClientRect(), dx = event.clientX - box.left, dy = event.clientY - box.top;
    handle.setPointerCapture(event.pointerId);
    draggingHUD = true;
    const move = (e: PointerEvent) => position(panel, e.clientX - dx, e.clientY - dy);
    const end = (e: PointerEvent) => {
      handle.removeEventListener("pointermove", move); handle.removeEventListener("pointerup", end);
      handle.removeEventListener("pointercancel", end);
      draggingHUD = false;
      const bounds = panel.getBoundingClientRect();
      if (e.type === "pointerup" && (bounds.left !== box.left || bounds.top !== box.top)) {
        preferredPosition = { right: bounds.right, y: bounds.top };
        void game.settings!.set(MODULE, "eyeHUDPosition", { x: bounds.left, y: bounds.top, right: bounds.right });
      } else restoreHUDPosition(panel);
    };
    handle.addEventListener("pointermove", move); handle.addEventListener("pointerup", end);
    handle.addEventListener("pointercancel", end);
  });
}
function openCard(id: string) {
  void ui.sidebar!.activateTab("chat");
  const card = document.querySelector<HTMLElement>('#chat-log [data-message-id="' + CSS.escape(id) + '"]');
  if (card) { card.scrollIntoView({ block: "center", behavior: "smooth" }); }
  else ui.notifications!.info("Open the pending Combat Tools resolution card in chat.");
}

let previewHP = 40;
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
function vitals(actor: Actor | undefined, states: ReturnType<typeof indicatorState>, preview: boolean) {
  const box = element("div", "pneuma-eye-vitals");
  const hp = Number(preview ? previewHP : foundry.utils.getProperty(actor!, "system.derivedStats.hp.value"));
  const max = Number(preview ? 40 : foundry.utils.getProperty(actor!, "system.derivedStats.hp.max"));
  const valid = Number.isFinite(hp) && Number.isFinite(max) && max > 0;
  const state = valid ? vitalState(hp, max) : "unknown";
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
  const activeDrugs = new Set(preview ? ["Boost", "Stim"] : actor ? collectHUDConditions(actor).drugs : []);
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
    if (lamp.expires) next = Math.min(next, lamp.expires);
  }
  if (lampTimer) clearTimeout(lampTimer);
  if (Number.isFinite(next)) lampTimer = setTimeout(schedule, Math.max(10, next - Date.now() + 20));
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
function updateEffectArrivals(actor: Actor | undefined, preview: boolean) {
  const identity = preview ? "preview" : actor?.uuid;
  const data = actor ? collectHUDConditions(actor) : undefined;
  const active: EffectArrival[] = lastingDrugs.filter(drug => (preview ? ["Boost", "Stim"] : data?.drugs ?? []).includes(drug.name))
    .map(drug => ({key: "drug:" + drug.name, name: drug.name, icon: drug.icon, color: drug.kind === "drug" ? "#ff666b" : "#65e9a0"}));
  const colors = { poison: "#76ef69", radiation: "#ffe16b", biotoxin: "#d892ff", fire: "#ff853e", addict: "#ff666b", jacked: "#64f1df", unconscious: "#ead56c" };
  if (identity) for (const lamp of indicatorState(identity, preview ? ["Poison", "Addiction"] : data?.exposures ?? [], game.settings!.get(MODULE, "biomonitorFlashSeconds"), !preview && !!game.combat?.started)) {
    if (lamp.on) active.push({ key: "exposure:" + lamp.id, name: lamp.name, icon: lamp.icon, color: colors[lamp.id] });
  }
  const current = new Set(active.map(effect => effect.key));
  const enabled = game.settings!.get(MODULE, "eyeHUDAnimateMessages") && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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

/** Animate the real text, retaining its layout slot and private recipient filtering. */
function animateIncomingMessages(rows: HTMLElement[]) {
  if (!game.settings!.get(MODULE, "eyeHUDAnimateMessages") || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
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
      { top: "100%", opacity: 1, offset: .26 },
      { top: "100%", opacity: 0, offset: .28 },
      { top: "50%", opacity: 0, offset: .62 },
      { top: "50%", opacity: 1, offset: .70 },
      { top: "50%", opacity: 1, offset: .73 },
      { top: "50%", opacity: 0, offset: .76 },
      { top: "0%", opacity: 1, offset: .78 },
      { top: "100%", opacity: 1, offset: .94 },
      { top: "100%", opacity: 0, offset: 1 }
    ], { duration: 1800, easing: "linear" });
    const arrival = text.animate([
      { transform: center, clipPath: "inset(0 0 100% 0)", opacity: 1, offset: 0 },
      { transform: center, clipPath: "inset(0)", opacity: 1, offset: .26 },
      { transform: center, clipPath: "inset(0)", opacity: 1, offset: .62 },
      { transform: center, clipPath: "inset(49% 0)", opacity: 1, offset: .70 },
      { transform: center, clipPath: "inset(49% 0)", opacity: 1, offset: .73 },
      { transform: center, clipPath: "inset(50% 0)", opacity: 0, offset: .76 },
      { transform: "none", clipPath: "inset(0 0 100% 0)", opacity: 0, offset: .77 },
      { transform: "none", clipPath: "inset(0 0 100% 0)", opacity: 1, offset: .78 },
      { transform: "none", clipPath: "inset(0)", opacity: 1, offset: .94 },
      { transform: "none", clipPath: "inset(0)", opacity: 1, offset: 1 }
    ], { duration: 1800, easing: "linear" });
    const cleanup = () => { beam.cancel(); line.remove(); };
    arrival.onfinish = cleanup;
    arrival.oncancel = cleanup;
  }
}

function render() {
  const incomingRows: HTMLElement[] = [];
  const preview = game.settings!.get(MODULE, "eyeHUDPreview");
  if (!game.settings!.get(MODULE, "eyeHUD") && !preview) {
    clearEffectArrivals(); effectActor = undefined; previousEffects.clear();
    sidebarResizeObserver.disconnect(); observedSidebar = null;
    attachments?.remove(); attachments = undefined;
    root?.remove(); root = undefined; hudBody = undefined; medicalSignature = messageSignature = "";
    if (lampTimer) clearTimeout(lampTimer);
    return;
  }
  const prefersMinimized = !preview && game.settings!.get(MODULE, "eyeHUDMinimized");
  const ownActor = actorInFocus();
  const actor = displayedActor();
  const shared = !!actor && actor.uuid !== ownActor?.uuid;
  const monitor = preview || !!actor;
  const savedMessage = game.settings!.get(MODULE, "eyeHUDMessage");
  const custom = savedMessage && !dismissedLegacyMessages.has(savedMessage.id) && savedMessage.expires > Date.now() && savedMessage.recipients.includes(game.user!.id!) ? savedMessage : undefined;
  const pending = preview || !ownActor ? [] : [...attacks.values()].filter(message => {
    const data = exchange(message);
    return message.visible && message.isContentVisible && !dismissed.has(message.id!)
      && data?.defenderActor === ownActor!.uuid;
  });
  type AlertEntry = { key: string; text: string; open?: () => void; clear: () => void };
  const messages: AlertEntry[] = preview ? [
    { key: "preview-attack", text: "Incoming Attack", open: () => { ui.notifications!.info("Biomonitor test: a live alert opens its chat card."); }, clear: () => {} },
    { key: "preview-message", text: "Check your equipment", clear: () => {} }
  ] : [
    ...pending.map(message => ({ key: "attack:" + message.id!, text: "Incoming Attack", open: () => openCard(message.id!), clear: () => { dismissed.add(message.id!); } })),
    ...(custom ? [{ key: "legacy:" + custom.id, text: custom.text, clear: () => { dismissedLegacyMessages.add(custom.id); } }] : []),
    ...listHUDMessages().map(message => ({ key: hudMessageKey(message), text: message.text, clear: () => dismissHUDMessage(message.source, message.id) }))
  ];
  const minimized = prefersMinimized;
  const rows = minimized ? [] : preview ? demo : monitor && actor ? eyeConditions(actor) : [];
  const panel = root ??= element("section", "pneuma-eye-hud");
  panel.id = "pneuma-eye-hud"; panel.setAttribute("aria-label", "Status HUD · " + (actor?.name ?? "No character") + (shared ? " · Biomonitor link" : ""));
  if (HUD_DRAG_ENABLED && !panel.dataset.draggable) { drag(panel, panel); panel.dataset.draggable = "true"; }
  const header = element("header", "pneuma-eye-header");
  panel.classList.toggle("is-shared", shared);
  panel.classList.toggle("is-docked", !HUD_DRAG_ENABLED);
  if (preview) {
    const end = control("End test", () => { void game.settings!.set(MODULE, "eyeHUDPreview", false); });
    end.title = "Preview only — no actor changes"; header.append(end);
    const state = document.createElement("select"); state.setAttribute("aria-label", "Test HP state");
    for (const [label, hp] of [["Normal",40],["Wounded",30],["Seriously wounded",18],["Critical",9],["Flatline",0]] as const) state.append(new Option(label, String(hp)));
    state.value = String(previewHP); state.addEventListener("change", () => { previewHP = Number(state.value); render(); }); header.append(state);
    header.append(control("Test lights", () => { for (const lamp of lamps) signalExposure("preview", lamp.id, game.settings!.get(MODULE, "biomonitorFlashSeconds")); render(); }));
  }
  if (game.user?.isGM && !minimized && !preview) {
    const send = control("", openHUDMessageDialog);
    send.append(element("i", "fas fa-envelope"));
    send.setAttribute("aria-label", "Send HUD Message");
    send.title = "Send a message to connected players";
    header.append(send);
  }
  if (minimized && monitor && actor) {
    const mini = element("div", "pneuma-eye-vitals pneuma-eye-mini-vitals");
    const hp = Number(foundry.utils.getProperty(actor, "system.derivedStats.hp.value"));
    const max = Number(foundry.utils.getProperty(actor, "system.derivedStats.hp.max"));
    const state = Number.isFinite(hp) && Number.isFinite(max) && max > 0 ? vitalState(hp, max) : "unknown";
    mini.dataset.state = state;
    mini.append(createEKG(state, true));
    header.append(mini);
  }
  if (!preview) {
    const toggle = control(minimized ? "" : "−", async () => {
      await game.settings!.set(MODULE, "eyeHUDMinimized", !minimized);
      schedule();
    });
    toggle.setAttribute("aria-label", minimized ? "Expand status HUD" : "Minimize status HUD");
    toggle.title = minimized ? (pending.length ? "Incoming attack" : custom?.text ?? "Open status HUD") : "Minimize status HUD";
    if (minimized) { const icon = element("i", "fas fa-bell"); icon.setAttribute("aria-hidden", "true"); toggle.append(icon); }
    header.append(toggle);
  }
  panel.classList.toggle("is-minimized", minimized);
  panel.classList.toggle("has-mini-vitals", minimized && monitor);
  panel.classList.toggle("has-alert", !!pending.length || !!custom);
  const body = hudBody ??= element("div", "pneuma-eye-body");
  const extras = attachments ??= element("div", "pneuma-eye-attachments");
  extras.id = "pneuma-eye-attachments";
  const identity = extras.querySelector(".pneuma-eye-identity");
  if (actor && (game.user?.isGM || shared) && !preview) {
    const name = identity ?? element("div", "pneuma-eye-identity");
    name.textContent = actor.name + (shared ? " · BIOMONITOR LINK" : "");
    if (!identity) extras.prepend(name);
  } else identity?.remove();
  const nextMessages = JSON.stringify([preview, ownActor?.name, messages.map(message => [message.key, message.text])]);
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
      clear.setAttribute("aria-label", "Clear notification: " + message.text); clear.disabled = preview;
      row.append(clear); messageArea.append(row);
    }
    const previous = extras.querySelector(".pneuma-eye-notifications");
    if (previous) previous.replaceWith(messageArea); else extras.append(messageArea);
    messageSignature = nextMessages;
  }
  if (!minimized) {
    const disabled = preview ? [{ name: "Cyberarm", detail: "Disabled", item: undefined }] : Array.from(actor?.items ?? [])
      .filter(item => String(item.type) === "cyberware" && (!!getItemMarkers(item).disabled || !!getItemMarkers(item).emp))
      .map(item => ({ name: item.name ?? "Cyberware", detail: getItemMarkers(item).emp ? "Disabled — EMP" : getItemMarkers(item).disabled?.description ?? "Disabled", item }));
    const data = actor ? collectHUDConditions(actor) : { medical: [], situational: [], drugs: [], exposures: [] };
    const lampStates = monitor ? indicatorState(preview ? "preview" : actor!.uuid, preview ? ["Poison", "Addiction"] : data.exposures,
      game.settings!.get(MODULE, "biomonitorFlashSeconds"), !preview && !!game.combat?.started) : [];
    const grappleRows = preview ? [{id:"preview-grapple",text:"Grappling: Booster",detail:"−2 Actions"},{id:"preview-choke",text:"Choking: Booster — 1/3",detail:"Consecutive rounds"}] : actor ? [...grappleHUD(actor),...movementHUD(actor)] : [];
    const nextMedical = JSON.stringify([monitor, preview, actor?.uuid, actor?.isOwner, previewHP, grappleRows, data,
      actor && foundry.utils.getProperty(actor, "system.derivedStats.hp"), rows,
      disabled.map(entry => [entry.item?.id, entry.name, entry.detail]), lampStates,
      game.settings!.get(MODULE, "biomonitorShowHP")]);
    if (nextMedical !== medicalSignature) {
      const medical = element("div", "pneuma-eye-medical");
      const vitalColumn = element("div", "pneuma-eye-vitals-column");
      if (monitor) vitalColumn.append(vitals(actor, lampStates, preview));
      medical.append(vitalColumn);
      const conditions = element("div", "pneuma-eye-conditions");
      conditions.append(element("div", "pneuma-eye-medical-label", "Biological Scan"));
      for (const notice of rows) {
        const text = notice.detail === "View actor sheet for details." ? notice.title : notice.title + " — " + notice.detail;
        const row = control("", () => { if (!preview && actor?.isOwner) actor.sheet?.render(true); });
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
    const statuses = preview ? [{title:"Cover",detail:"Cover"},{title:"Prone",detail:"Prone"},{title:"Readied Action",detail:"Readied Action"}] : data.situational;
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
  const previousControls = [...Array.from(panel.querySelectorAll(".pneuma-eye-header, .pneuma-eye-inline-controls")), ...Array.from(extras.querySelectorAll(".pneuma-eye-preview-controls"))];
  const controlParent = preview ? extras : minimized ? panel : panel.querySelector(".pneuma-eye-cyber-heading") ?? panel;
  header.className = preview ? "pneuma-eye-preview-controls" : minimized ? "pneuma-eye-header" : "pneuma-eye-inline-controls";
  header.removeAttribute("title"); header.removeAttribute("aria-label");
  if (previousControls.length !== 1 || previousControls[0]?.outerHTML !== header.outerHTML || previousControls[0]?.parentElement !== controlParent) {
    previousControls.forEach(controls => controls.remove()); controlParent.append(header);
  }
  if (!panel.isConnected) document.body.append(panel);
  extras.classList.toggle("is-minimized", minimized);
  if (!extras.isConnected) document.body.append(extras);
  restoreHUDPosition(panel);
  animateIncomingMessages(incomingRows);
  updateEffectArrivals(actor, preview);
}
export function registerEyeHUD() {
  registerHUDMessages(schedule);
  game.settings!.register(MODULE, "biomonitorShowHP", { name: "Show Biomonitor HP numbers", hint: "When off, hover over or focus the heartbeat animation to reveal current and maximum HP.", scope: "client", config: true, type: Boolean, default: true, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDAnimateMessages", { name: "Animate HUD messages and effect icons", hint: "Scan new private messages into view at screen center, collapse them into a bright line, then reveal them below the HUD. New drug and exposure icons scan and blink three times before lighting up. Disable to show all indicators directly. Respects reduced-motion preferences.", scope: "client", config: true, type: Boolean, default: true, onChange: () => {
    clearEffectArrivals();
    attachments?.querySelectorAll<HTMLElement>(".pneuma-eye-notification > :first-child").forEach(text => text.getAnimations().forEach(animation => animation.cancel()));
    schedule();
  } });
  game.settings!.register(MODULE, "eyeHUDMinimized", { scope: "client", config: false, type: Boolean, default: false, onChange: schedule });
  game.settings!.register(MODULE, "biomonitorFlashSeconds", { name: "Biomonitor indicator flash duration", hint: "Seconds to flash a newly detected effect; ongoing conditions remain lit afterward. Zero disables flashing.", scope: "client", config: true, type: Number, default: 8, range: { min: 0, max: 60, step: 1 } });
  Hooks.on("pneumaCombatToolsExposure", (uuid: string, kind: LampId) => {
    signalExposure(uuid, kind, game.settings!.get(MODULE, "biomonitorFlashSeconds"), !!game.combat?.started);
    if(effectActor===uuid){const key="exposure:"+kind;previousEffects.delete(key);const arrival=effectArrivals.get(key);arrival?.animation.cancel();arrival?.node.remove();effectArrivals.delete(key);}
    schedule();
  });
  game.settings!.register(MODULE, "eyeHUDMessage", { scope: "world", config: false, type: Object, default: null, onChange: messageChanged });
  game.settings!.register(MODULE, "eyeHUD", { name: "Status HUD", hint: "Show your vitals, conditions, statuses and private notifications.", scope: "client", config: true, type: Boolean, default: true, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDPreview", { name: "Test status HUD", hint: "Preview sample conditions and an interactive attack alert. Changes no actor data. Use End test to exit.", scope: "client", config: true, type: Boolean, default: false, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDPosition", { scope: "client", config: false, type: Object, default: null });
  Hooks.once("ready", () => { for (const message of game.messages ?? []) remember(message); messageChanged(); });
  for (const hook of ["controlToken", "canvasReady"]) Hooks.on(hook, schedule);
  Hooks.on("updateUser", (user: User) => { if (user.id === game.user?.id) schedule(); });
  Hooks.on("updateToken", (token: TokenDocument) => { if (hoveredHUDToken?.document === token || canvas.tokens?.controlled.some(controlled => controlled.document === token)) schedule(); });
  Hooks.on("hoverToken", (token: Token, entered: boolean) => {
    if (entered) hoveredHUDToken = token;
    else if (hoveredHUDToken === token) hoveredHUDToken = undefined;
    schedule();
  });
  Hooks.on("canvasTearDown", () => { hoveredHUDToken = undefined; schedule(); });
  Hooks.on("updateCombat", (combat: Combat, change: {round?: number}) => {
    if (combat?.id === game.combat?.id && change?.round !== undefined) { clearRoundExposures(); schedule(); }
  });
  for (const hook of ["updateCombatant", "updateScene", "updateCombat", "deleteCombat", "deleteScene"]) Hooks.on(hook, schedule);
  for (const hook of ["createItem", "updateItem", "deleteItem", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect", "updateActor"]) {
    Hooks.on(hook, (doc: { uuid?: string; parent?: { uuid?: string; parent?: { uuid?: string } } }) => {
      const changed = [doc.uuid, doc.parent?.uuid, doc.parent?.parent?.uuid];
      if ([actorInFocus(), displayedActor(), hoveredHUDToken?.actor].some(actor => actor && changed.includes(actor.uuid))) schedule();
    });
  }
  Hooks.on("createChatMessage", remember); Hooks.on("updateChatMessage", remember);
  Hooks.on("deleteChatMessage", (message: ChatMessage) => { const tracked = attacks.delete(message.id!); dismissed.delete(message.id!); if (tracked) schedule(); });
  for (const hook of ["renderSidebar", "collapseSidebar"]) Hooks.on(hook, () => { if (root) restoreHUDPosition(root); });
  window.addEventListener("resize", () => { if (root) restoreHUDPosition(root); });
}
