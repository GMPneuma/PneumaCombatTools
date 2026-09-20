import {movementHUD} from "./aoe/movement.js";
import { grappleHUD, property as grappleProperty } from "./grapple/state.js";
import { registerHUDMessages, postHUDMessage, listHUDMessages, dismissHUDMessage, hudMessageKey } from "./hud-messages.js";
import { getItemMarkers } from "./item-markers.js";
import { createEKGTrace, vitalState, indicatorState, signalExposure, lamps, type LampId } from "./biomonitor.js";
const MODULE = "pneuma-combattools";
declare global { interface SettingConfig {
  "pneuma-combattools.biomonitorShowHP": boolean;
  "pneuma-combattools.eyeHUDMinimized": boolean;
  "pneuma-combattools.biomonitorFlashSeconds": number;
  "pneuma-combattools.eyeHUDMessage": HUDMessage | null;
  "pneuma-combattools.biomonitorWithoutImplant": boolean;
  "pneuma-combattools.eyeHUD": boolean;
  "pneuma-combattools.eyeHUDPreview": boolean;
  "pneuma-combattools.eyeHUDPosition": { x: number; y: number; right?: number } | null;
} }

const messageDurations = [[60, "60 Seconds"], [300, "5 Minutes"], [900, "15 Minutes"], [3600, "1 Hour"], [21600, "6 Hours"], [0, "Until Cleared"]] as const;
type HUDMessage = { id: string; text: string; recipients: string[]; expires: number };
let messageTimer: ReturnType<typeof setTimeout> | undefined;
const dismissedLegacyMessages = new Set<string>();
let selectedNotice: string | undefined;
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
let hudWasMinimized = false;
let observedNotices: Map<string, string> | undefined;
let automaticNotice: string | undefined;
let automaticTimer: ReturnType<typeof setTimeout> | undefined;
function stopAutomaticNotice() {
  automaticNotice = undefined;
  if (automaticTimer) clearTimeout(automaticTimer);
  automaticTimer = undefined;
}
let queued = false;
const dismissed = new Set<string>();
const attacks = new Map<string, ChatMessage>();
function actorInFocus(): Actor | undefined {
  const tokens = canvas.tokens?.controlled ?? [];
  if (tokens.length) return tokens.length === 1 && tokens[0]?.actor?.isOwner ? tokens[0].actor : undefined;
  return game.user?.isGM ? undefined : game.user?.character ?? undefined;
}
export function eyeConditions(actor: Actor): Notice[] {
  const rows = new Map<string, Notice>();
  const add = (name: string, icon?: string | null) => {
    const title = game.i18n!.localize(name);
    if (!rows.has(title)) rows.set(title, { title, icon: icon ?? undefined, detail: guidance[title] ?? "View actor sheet for details." });
  };
  for (const item of actor.items) if (String(item.type) === "criticalInjury") add(item.name ?? "Injury", item.img);
  for (const effect of actor.allApplicableEffects()) {
    if (effect.disabled || effect.isSuppressed || foundry.utils.getProperty(effect, "system.isSuppressed")) continue;
    // Only conditions and injuries: ordinary equipment bonuses do not belong in this overlay.
    if (effect.statuses.size && !grappleProperty(effect, "grappleId")) add(effect.name ?? "Condition", effect.img);
  }
  return [...rows.values()];
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
}
let preferredPosition: { right: number; y: number } | undefined;
let draggingHUD = false;
function restoreHUDPosition(panel: HTMLElement) {
  if (draggingHUD) return;
  if (!preferredPosition) {
    const saved = game.settings!.get(MODULE, "eyeHUDPosition");
    preferredPosition = { right: saved?.right ?? (saved?.x ?? 110) + 600, y: saved?.y ?? 110 };
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
  const indicators = element("div", "pneuma-eye-lamps");
  let next = Infinity;
  for (const lamp of states.filter(lamp => lamp.on)) {
    const light = element("span", "pneuma-eye-lamp" + (lamp.on ? " is-on" : "") + (lamp.flashing ? " is-flashing" : ""));
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

function render() {
  const preview = game.settings!.get(MODULE, "eyeHUDPreview");
  if (!game.settings!.get(MODULE, "eyeHUD") && !preview) {
    stopAutomaticNotice(); observedNotices = undefined;
    root?.remove(); root = undefined; hudBody = undefined; medicalSignature = messageSignature = "";
    if (lampTimer) clearTimeout(lampTimer);
    return;
  }
  const prefersMinimized = !preview && game.settings!.get(MODULE, "eyeHUDMinimized");
  const actor = actorInFocus();
  const monitor = preview || !!actor && (game.settings!.get(MODULE, "biomonitorWithoutImplant") || hasBiomonitor(actor));
  const savedMessage = game.settings!.get(MODULE, "eyeHUDMessage");
  const custom = savedMessage && !dismissedLegacyMessages.has(savedMessage.id) && savedMessage.expires > Date.now() && savedMessage.recipients.includes(game.user!.id!) ? savedMessage : undefined;
  const pending = preview || !actor ? [] : [...attacks.values()].filter(message => {
    const data = exchange(message);
    return message.visible && message.isContentVisible && !dismissed.has(message.id!)
      && data?.defenderActor === actor.uuid;
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
  if (!preview) {
    const latest = messages.filter(message => observedNotices && observedNotices.get(message.key) !== message.text).at(-1);
    observedNotices = new Map(messages.map(message => [message.key, message.text]));
    if (latest && prefersMinimized) {
      stopAutomaticNotice();
      automaticNotice = latest.key;
      selectedNotice = latest.key;
      messageSignature = "";
    }
    if (!prefersMinimized || !messages.some(message => message.key === automaticNotice)) stopAutomaticNotice();
  } else stopAutomaticNotice();
  const minimized = prefersMinimized && !automaticNotice;
  const rows = minimized ? [] : preview ? demo : monitor && actor ? eyeConditions(actor) : [];
  const panel = root ??= element("section", "pneuma-eye-hud");
  panel.id = "pneuma-eye-hud"; panel.setAttribute("aria-label", "Status HUD");
  const header = element("header", "pneuma-eye-header");
  if (game.user?.isGM) header.append(element("span", "pneuma-eye-brand", preview ? "Preview" : canvas.tokens?.controlled[0]?.name ?? actor?.name ?? "HUD message"));
  header.title = "Drag to move HUD";
  header.setAttribute("aria-label", "Drag HUD");
  if (preview) {
    const end = control("End test", () => { void game.settings!.set(MODULE, "eyeHUDPreview", false); });
    end.title = "Preview only — no actor changes"; header.append(end);
    const state = document.createElement("select"); state.setAttribute("aria-label", "Test HP state");
    for (const [label, hp] of [["Normal",40],["Wounded",30],["Seriously wounded",18],["Critical",9],["Flatline",0]] as const) state.append(new Option(label, String(hp)));
    state.value = String(previewHP); state.addEventListener("change", () => { previewHP = Number(state.value); render(); }); header.append(state);
    header.append(control("Test lights", () => { for (const lamp of lamps) signalExposure("preview", lamp.id, game.settings!.get(MODULE, "biomonitorFlashSeconds")); render(); }));
  }
  if (game.user?.isGM && !minimized && !preview) {
    const send = control("Send HUD Message", openHUDMessageDialog);
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
      stopAutomaticNotice();
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
  const previousHeader = panel.querySelector<HTMLElement>(":scope > header");
  if (previousHeader?.outerHTML !== header.outerHTML) {
    if (previousHeader) previousHeader.replaceWith(header); else panel.append(header);
    drag(panel, header);
  }
  const body = hudBody ??= element("div", "pneuma-eye-body");
  const messageArea = element("div", "pneuma-eye-messages");
  let index = Math.max(0, messages.findIndex(message => message.key === selectedNotice));
  const current = messages[index];
  selectedNotice = current?.key;
  panel.classList.toggle("has-alert", messages.length > 0);
  if (current) {
    const alert = control("", () => { current.open?.(); });
    alert.className = "pneuma-eye-alert";
    alert.setAttribute("aria-label", preview ? "Test incoming attack alert" : current.open ? "Incoming attack: open chat card" : "HUD message");
    alert.title = current.open ? "Open chat card" : current.text;
    alert.append(element("strong", "pneuma-eye-ticker", "ALERT: " + current.text));
    messageArea.append(alert);
    const navigation = element("div", "pneuma-eye-message-controls");
    const step = (offset: number) => { index = (index + offset + messages.length) % messages.length; selectedNotice = messages[index]!.key; render(); };
    const previous = control("‹", () => step(-1)); previous.setAttribute("aria-label", "Previous HUD message");
    const next = control("›", () => step(1)); next.setAttribute("aria-label", "Next HUD message");
    previous.disabled = next.disabled = messages.length < 2;
    const clear = control("Clear", () => { if (preview) return; current.clear(); render(); });
    clear.setAttribute("aria-label", "Clear current HUD message");
    clear.classList.add("pneuma-eye-message-clear");
    clear.disabled = preview;
    navigation.append(previous, element("span", "pneuma-eye-message-index", (index + 1) + " / " + messages.length), next, clear);
    messageArea.append(navigation);
    if (minimized) panel.querySelector("header button")?.setAttribute("title", current.text);
  }
  if (!messages.length) messageArea.append(element("div", "pneuma-eye-idle", "STATUS: Standby"));
  const nextMessages = JSON.stringify([preview, automaticNotice, selectedNotice, messages.map(message => [message.key, message.text])]);
  if (nextMessages !== messageSignature) {
    const previousMessages = body.querySelector(".pneuma-eye-messages");
    if (previousMessages) previousMessages.replaceWith(messageArea); else body.prepend(messageArea);
    messageSignature = nextMessages;
    if (automaticTimer) clearTimeout(automaticTimer);
    if (automaticNotice) {
      const ticker = messageArea.querySelector<HTMLElement>(".pneuma-eye-ticker");
      if (ticker) {
        ticker.style.animationIterationCount = "1";
        const finish = () => {
          if (body.querySelector(".pneuma-eye-ticker") !== ticker || !automaticNotice) return;
          stopAutomaticNotice();
          schedule();
        };
        ticker.addEventListener("animationend", finish, { once: true });
        // Reduced motion has no animationend; retain the static notice for one normal pass.
        if (matchMedia("(prefers-reduced-motion: reduce)").matches) automaticTimer = setTimeout(finish, 8000);
      }
    }
  }
  if (!minimized) {
    const disabled = preview ? [{ name: "Cyberarm", detail: "Disabled", item: undefined }] : Array.from(actor?.items ?? [])
      .filter(item => String(item.type) === "cyberware" && (!!getItemMarkers(item).disabled || !!getItemMarkers(item).emp))
      .map(item => ({ name: item.name ?? "Cyberware", detail: getItemMarkers(item).emp ? "Disabled — EMP" : getItemMarkers(item).disabled?.description ?? "Disabled", item }));
    const lampStates = monitor ? indicatorState(preview ? "preview" : actor!.uuid, rows.map(row => row.title),
      game.settings!.get(MODULE, "biomonitorFlashSeconds")) : [];
    const grappleRows = preview ? [{id:"preview-grapple",text:"Grappling: Booster",detail:"−2 Actions"},{id:"preview-choke",text:"Choking: Booster — 1/3",detail:"Consecutive rounds"}] : actor ? [...grappleHUD(actor),...movementHUD(actor)] : [];
    const nextMedical = JSON.stringify([monitor, preview, actor?.uuid, actor?.isOwner, previewHP, grappleRows,
      actor && foundry.utils.getProperty(actor, "system.derivedStats.hp"), rows,
      disabled.map(entry => [entry.item?.id, entry.name, entry.detail]), lampStates,
      game.settings!.get(MODULE, "biomonitorShowHP")]);
    if (nextMedical !== medicalSignature) {
      const medical = element("div", "pneuma-eye-medical");
      const vitalColumn = element("div", "pneuma-eye-vitals-column");
      if (monitor) vitalColumn.append(vitals(actor, lampStates, preview));
      if (grappleRows.length) {
        const grappling = element("div", "pneuma-eye-grapple");
        for (const entry of grappleRows) {
          const row = element("div", "pneuma-eye-grapple-row", entry.text); row.title = entry.detail;
          grappling.append(row);
        }
        vitalColumn.append(grappling);
      }
      medical.append(vitalColumn);
      const conditions = element("div", "pneuma-eye-conditions");
      conditions.append(element("div", "pneuma-eye-medical-label", "Biological Scan"));
      for (const notice of rows) {
        const text = notice.detail === "View actor sheet for details." ? notice.title : notice.title + " — " + notice.detail;
        const row = control("", () => { if (!preview) actor!.sheet?.render(true); });
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
    cyber.append(element("div", "pneuma-eye-medical-label", "Implant Integrity"));
    for (const entry of disabled) {
      const row = control(entry.name + (entry.detail === "Disabled — EMP" ? " — Disabled — EMP" : ""), () => { entry.item?.sheet?.render(true); });
      row.className = "pneuma-eye-condition pneuma-eye-cyber-disabled";
      row.title = entry.name + " — " + (entry.detail || "Disabled");
      cyber.append(row);
  }
    if (!disabled.length) cyber.append(element("div", "pneuma-eye-condition-empty", "All Systems Normal"));
    if (monitor) medical.append(cyber);
    const previousMedical = body.querySelector(".pneuma-eye-medical");
    if (monitor || grappleRows.length) {
      if (previousMedical) previousMedical.replaceWith(medical); else body.append(medical);
    } else previousMedical?.remove();
    medicalSignature = nextMedical;
  }
  }
  if (!minimized && body.parentElement !== panel) panel.append(body);
  else if (minimized) body.remove();
  if (!panel.isConnected) document.body.append(panel);
  if (hudWasMinimized && !minimized) {
    const ticker = panel.querySelector<HTMLElement>(".pneuma-eye-ticker");
    if (ticker) {
      ticker.style.animation = "none";
      void ticker.offsetWidth;
      ticker.style.animation = "";
      if (automaticNotice) ticker.style.animationIterationCount = "1";
    }
  }
  hudWasMinimized = minimized;
  restoreHUDPosition(panel);
}
export function registerEyeHUD() {
  registerHUDMessages(schedule);
  game.settings!.register(MODULE, "biomonitorShowHP", { name: "Show Biomonitor HP numbers", hint: "When off, hover over or focus the heartbeat animation to reveal current and maximum HP.", scope: "client", config: true, type: Boolean, default: true, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDMinimized", { scope: "client", config: false, type: Boolean, default: false, onChange: schedule });
  game.settings!.register(MODULE, "biomonitorFlashSeconds", { name: "Biomonitor indicator flash duration", hint: "Seconds to flash a newly detected effect; ongoing conditions remain lit afterward. Zero disables flashing.", scope: "client", config: true, type: Number, default: 8, range: { min: 0, max: 60, step: 1 } });
  Hooks.on("pneumaCombatToolsExposure", (uuid: string, kind: LampId) => { signalExposure(uuid, kind, game.settings!.get(MODULE, "biomonitorFlashSeconds")); schedule(); });
  game.settings!.register(MODULE, "biomonitorWithoutImplant", { name: "Show Biomonitor even if not installed", hint: "Show vitals and conditions for all actors. Alerts do not require a Biomonitor.", scope: "world", config: true, type: Boolean, default: false, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDMessage", { scope: "world", config: false, type: Object, default: null, onChange: messageChanged });
  game.settings!.register(MODULE, "eyeHUD", { name: "Status HUD", hint: "Show alerts and, with an installed Biomonitor, conditions.", scope: "client", config: true, type: Boolean, default: true, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDPreview", { name: "Test status HUD", hint: "Preview sample conditions and an interactive attack alert. Changes no actor data. Use End test to exit.", scope: "client", config: true, type: Boolean, default: false, onChange: schedule });
  game.settings!.register(MODULE, "eyeHUDPosition", { scope: "client", config: false, type: Object, default: null });
  Hooks.once("ready", () => { for (const message of game.messages ?? []) remember(message); messageChanged(); });
  for (const hook of ["controlToken", "canvasReady"]) Hooks.on(hook, schedule);
  Hooks.on("updateUser", (user: User) => { if (user.id === game.user?.id) schedule(); });
  Hooks.on("updateToken", (token: TokenDocument) => { if (canvas.tokens?.controlled.some(controlled => controlled.document === token)) schedule(); });
  Hooks.on("canvasTearDown", schedule);
  for (const hook of ["updateCombatant", "updateScene", "updateCombat", "deleteCombat", "deleteScene"]) Hooks.on(hook, schedule);
  for (const hook of ["createItem", "updateItem", "deleteItem", "createActiveEffect", "updateActiveEffect", "deleteActiveEffect", "updateActor"]) {
    Hooks.on(hook, (doc: { uuid?: string; parent?: { uuid?: string; parent?: { uuid?: string } } }) => {
      const actor = actorInFocus();
      if (actor && [doc.uuid, doc.parent?.uuid, doc.parent?.parent?.uuid].includes(actor.uuid)) schedule();
    });
  }
  Hooks.on("createChatMessage", remember); Hooks.on("updateChatMessage", remember);
  Hooks.on("deleteChatMessage", (message: ChatMessage) => { const tracked = attacks.delete(message.id!); dismissed.delete(message.id!); if (tracked) schedule(); });
  window.addEventListener("resize", () => { if (root) restoreHUDPosition(root); });
}
