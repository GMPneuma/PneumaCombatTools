import {barCombat, barEntries, canEndTurn, movementMode, MOVEMENT_MODES, registerBarMovement, validMode, type BarEntry} from "./combat-bar-state.js";
import {requestEndTurn,registerBarTurns} from "./combat-bar-turn.js";
import {showBarStatuses,showBarControls,closeBarFlyout,leaveBarFlyout,navigateBarEntry} from "./combat-bar-flyout.js";

const MODULE = "pneuma-combattools";
let root: HTMLElement | undefined;
let observer: ResizeObserver | undefined;
let players: HTMLElement | null = null;
let frame = 0;
let renderKey = "";
let turnPending = false;
let modePending = false;
let hold: {timer: number; pointer: number; x: number; y: number} | undefined;
let suppressClick = false;
const report = (error: unknown) => ui.notifications!.error(error instanceof Error ? error.message : String(error));

function cancelHold(): void {
  if (hold) window.clearTimeout(hold.timer);
  hold = undefined;
}

function position(): void {
  if (!root) return;
  const anchor = players?.getBoundingClientRect();
  const visible = anchor && anchor.width > 0 && anchor.height > 0;
  const top = visible ? anchor.top : window.innerHeight - 12;
  root.style.left = "15px";
  root.style.bottom = `${window.innerHeight - top + 6}px`;
  root.style.maxHeight = `${Math.max(100, Math.min(window.innerHeight * 0.6, top - 16))}px`;
  const sidebar = document.getElementById("sidebar")?.getBoundingClientRect();
  root.style.maxWidth = `${Math.max(150, (sidebar?.width ? sidebar.left : window.innerWidth) - 30)}px`;
  positionEndTurn();
}

function positionEndTurn(): void {
  const end = root?.querySelector<HTMLElement>(".pneuma-bar-end");
  const active = root?.querySelector<HTMLElement>("li.active");
  const list = root?.querySelector("ol");
  if (!end || !active || !list || !root) return;
  const row = active.getBoundingClientRect(), bounds = list.getBoundingClientRect();
  end.hidden = row.top < bounds.top - 1 || row.bottom > bounds.bottom + 1 || row.left < bounds.left - 1 || row.right > bounds.right + 1;
  if (root.dataset.orientation === "horizontal") {
    end.style.left = `${row.left - root.getBoundingClientRect().left + (row.width - 56) / 2}px`;
    end.style.top = "-28px";
    return;
  }
  end.style.left = "";
  end.style.top = `${row.top - root.getBoundingClientRect().top + (row.height - 24) / 2}px`;
}

function button(text: string, title: string, action: string): HTMLButtonElement {
  const control = document.createElement("button");
  control.type = "button";
  control.textContent = text;
  control.title = title;
  control.setAttribute("aria-label", title);
  control.dataset.action = action;
  return control;
}

function row(entry: BarEntry): HTMLElement {
  const element = document.createElement("li");
  element.className = "combatant";
  element.dataset.entryId = entry.id;
  element.classList.toggle("active", entry.active);
  element.classList.toggle("is-hidden", entry.hidden);
  element.classList.toggle("defeated", entry.defeated);
  element.classList.toggle("controlled", !!entry.token?.controlled);
  if (entry.active) element.setAttribute("aria-current", "step");
  const title = game.settings!.get(MODULE, "combatBarNameOnly") ? entry.name
    : `${entry.name} — click to select; hold to ping; Shift-click to pan; double-click for sheet${game.user?.isGM ? "; Shift-hold to pan players" : ""}`;
  const portrait = button("", title, "token");
  portrait.className = "pneuma-bar-token";
  portrait.disabled = !entry.token && !entry.combatant?.actor;
  const img = document.createElement("img");
  img.src = entry.img;
  img.alt = "";
  img.draggable = false;
  img.width = img.height = 40;
  portrait.append(img);
  element.append(portrait);
  if (entry.hidden) {
    const hidden = document.createElement("i");
    hidden.className = "fas fa-eye-slash";
    hidden.title = "Hidden from players";
    hidden.setAttribute("aria-label", hidden.title);
    element.append(hidden);
  }
  return element;
}

async function action(event: MouseEvent): Promise<void> {
  const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button[data-action]");
  if (!target || target.disabled) return;
  event.preventDefault();
  event.stopPropagation();
  if (suppressClick && target.dataset.action === "token") {suppressClick = false; return;}
  if (target.dataset.action === "minimize") {
    await game.settings!.set(MODULE, "combatBarMinimized", !game.settings!.get(MODULE, "combatBarMinimized"));
    return;
  }
  if (target.dataset.action === "orientation") {
    await game.settings!.set(MODULE, "combatBarOrientation", game.settings!.get(MODULE, "combatBarOrientation") === "horizontal" ? "vertical" : "horizontal");
    return;
  }
  const combat = barCombat();
  if (target.dataset.action === "token") {
    const id = target.closest<HTMLElement>("[data-entry-id]")?.dataset.entryId ?? "";
    if (event.shiftKey) {await navigateBarEntry(id, "pan"); return;}
    const token = barEntries().find(entry => entry.id === id)?.token;
    if (!canvas.ready || !token?.visible) return;
    if (token.isOwner) {canvas.tokens!.activate(); token.control({releaseOthers: true});}
    return;
  }
  if (target.dataset.action === "mode") {
    if (!game.user?.isGM || modePending) return;
    const mode = validMode(target.dataset.mode);
    if (mode === "combat" && !combat) return;
    modePending = true;
    refresh();
    try {
      await game.settings!.set(MODULE, "combatBarMovement", mode);
    } finally {modePending = false; refresh();}
    return;
  }
  if (!combat || turnPending) return;
  // A stale click must never advance a different turn or encounter after a rerender is queued.
  if (root?.dataset.turnKey !== `${combat.id}:${combat.round}:${combat.turn}`) return;
  if (target.dataset.action === "end-turn" ? !canEndTurn(combat) : !game.user?.isGM) return;
  turnPending = true;
  refresh();
  try {
    if (target.dataset.action === "previous-turn") await combat.previousTurn();
    else if (target.dataset.action === "end-turn") await requestEndTurn(combat);
    else await combat.nextTurn();
  } finally {turnPending = false; refresh();}
}

function bind(root: HTMLElement): void {
  root.addEventListener("click", event => {void action(event).catch(report);});
  root.addEventListener("dblclick", event => {
    const target=(event.target as HTMLElement).closest<HTMLElement>("[data-action=token]");
    if(!target)return;
    event.preventDefault();event.stopPropagation();cancelHold();
    const id=target.closest<HTMLElement>("[data-entry-id]")?.dataset.entryId;
    const entry=barEntries().find(entry=>entry.id===id);
    const actor=entry?.combatant?.actor??entry?.token?.actor;
    // Same sheet-view permission used by Foundry v12's combat tracker.
    if(actor?.testUserPermission(game.user!,"OBSERVER")){
      closeBarFlyout();
      try{actor.sheet?.render(true);}catch(error){report(error);}
    }
  });
  root.addEventListener("pointerdown", event => {
    event.stopPropagation();
    cancelHold();
    suppressClick = false;
    const target = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action=token]");
    if (!target || target.disabled || event.button !== 0 || (event.shiftKey && !game.user?.isGM)) return;
    const pull = event.shiftKey;
    const id = target.closest<HTMLElement>("[data-entry-id]")!.dataset.entryId!;
    hold = {pointer: event.pointerId, x: event.clientX, y: event.clientY, timer: window.setTimeout(() => {
      hold = undefined;
      suppressClick = true;
      if (game.user?.isGM || game.user?.hasPermission("PING_CANVAS")) void navigateBarEntry(id, pull ? "pull" : "ping").catch(report);
    }, MouseInteractionManager.LONG_PRESS_DURATION_MS)};
  });
  root.addEventListener("pointermove", event => {
    if (hold && Math.hypot(event.clientX - hold.x, event.clientY - hold.y) > 8) {cancelHold(); suppressClick = true;}
  });
  root.addEventListener("pointerover", event => {
    const row=(event.target as HTMLElement).closest<HTMLElement>("li[data-entry-id]");
    if(row)showBarStatuses(root,row);
  });
  root.addEventListener("pointerleave", () => {cancelHold();leaveBarFlyout();});
  root.addEventListener("contextmenu", event => {
    event.preventDefault();event.stopPropagation();cancelHold();
    const row=(event.target as HTMLElement).closest<HTMLElement>("li[data-entry-id]");
    if(row)void showBarControls(root,row).catch(report);
  });
  root.addEventListener("dragstart", event => event.preventDefault());
}

function render(): void {
  frame = 0;
  if (!canvas.ready || !game.settings!.get(MODULE, "combatBar")) {remove(); return;}
  if (!root) {
    root = document.createElement("nav");
    root.id = "pneuma-combat-bar";
    root.className = "app";
    root.setAttribute("aria-label", "Combat bar");
    bind(root);
    document.body.append(root);
    observer = new ResizeObserver(position);
  }
  const anchor = document.getElementById("players");
  if (players !== anchor) {
    observer!.disconnect();
    players = anchor;
    if (players) observer!.observe(players);
    const left = document.getElementById("ui-left");
    if (left) observer!.observe(left);
  }
  position();
  const combat = barCombat();
  const entries = barEntries(combat);
  const mode = movementMode();
  const endTurn = canEndTurn(combat);
  const size = Number(game.settings!.get(MODULE, "combatBarSize"));
  const orientation = game.settings!.get(MODULE, "combatBarOrientation");
  const minimized = game.settings!.get(MODULE, "combatBarMinimized");
  const key = JSON.stringify([size, orientation, minimized, game.settings!.get(MODULE, "combatBarNameOnly"), combat?.id, combat?.round, combat?.turn, game.user?.isGM, mode, endTurn, turnPending, modePending,
    entries.map(entry => [entry.id, entry.name, entry.img, entry.active, entry.hidden, entry.defeated, !!entry.token])]);
  if (key === renderKey) return;
  renderKey = key;
  cancelHold();
  closeBarFlyout();
  const scroll = root.querySelector("ol")?.scrollTop ?? 0;
  const scrollLeft = root.querySelector("ol")?.scrollLeft ?? 0;
  root.replaceChildren();
  root.dataset.orientation = orientation;
  root.classList.toggle("is-minimized", minimized);
  root.classList.toggle("is-gm", !!game.user?.isGM);
  root.style.setProperty("--portrait-size", `${[32,40,48].includes(size) ? size : 40}px`);
  root.dataset.turnKey = combat ? `${combat.id}:${combat.round}:${combat.turn}` : "";
  root.hidden = !entries.length && !game.user?.isGM;
  const toolbar = document.createElement("div");
  toolbar.className = "pneuma-bar-display";
  const collapse = button(minimized ? "+" : "−", minimized ? "Restore combat bar" : "Minimize combat bar", "minimize");
  collapse.setAttribute("aria-expanded", String(!minimized));
  toolbar.append(collapse);
  if (!minimized) toolbar.append(button(orientation === "vertical" ? "↔" : "↕", `Switch to ${orientation === "vertical" ? "horizontal" : "vertical"} layout`, "orientation"));
  root.append(toolbar);
  if (!minimized) {
    if (combat) {
      const header = document.createElement("header");
      if (game.user?.isGM) {
        const previous = button(orientation === "horizontal" ? "←" : "↑", "Previous turn", "previous-turn");
        const next = button(orientation === "horizontal" ? "→" : "↓", "Next turn", "next-turn");
        previous.disabled = next.disabled = turnPending;
        header.append(previous, next);
      }
      const round = document.createElement("span");
      round.textContent = `R ${combat.round}`;
      round.title = `Round ${combat.round}`;
      header.append(round);
      root.append(header);
    }
    const list = document.createElement("ol");
    list.setAttribute("aria-label", combat ? "Combatants" : "Player characters");
    for (const entry of entries) list.append(row(entry));
    list.addEventListener("scroll", () => {positionEndTurn();closeBarFlyout();});
    root.append(list);
    list.scrollTop = scroll;
    list.scrollLeft = scrollLeft;
    root.hidden = !entries.length && !game.user?.isGM;
    if (endTurn && entries.some(entry => entry.active)) {
      const end = button("End Turn", "End Turn", "end-turn");
      end.className = "pneuma-bar-end";
      end.disabled = turnPending;
      root.append(end);
    }
  }
  if (game.user?.isGM) {
    const footer = document.createElement("footer");
    footer.setAttribute("aria-label", "Player movement");
    for (const [value, label] of Object.entries(MOVEMENT_MODES)) {
      const control = button("", label, "mode");
      const icon = document.createElement("i");
      icon.className = `fas ${{default: "fa-person-walking", none: "fa-hand", combat: "fa-hourglass-half", free: "fa-person-running"}[value]}`;
      icon.setAttribute("aria-hidden", "true");
      control.append(icon);
      control.dataset.mode = value;
      control.setAttribute("aria-pressed", String(value === mode));
      control.disabled = modePending || (value === "combat" && !combat);
      footer.append(control);
    }
    root.append(footer);
  }
  positionEndTurn();
}

function refresh(): void {if (!frame) frame = requestAnimationFrame(render);}
function remove(): void {
  cancelHold();
  closeBarFlyout();
  observer?.disconnect();
  observer = undefined;
  root?.remove();
  root = undefined;
  players = null;
  renderKey = "";
}

export function registerCombatBar(): void {
  registerBarMovement(refresh);
  registerBarTurns();
  game.settings!.register(MODULE, "combatBar", {
    name: "Show combat bar", hint: "Square actor portraits above Players, with token selection, ping and pan. Movement rules still apply when this display is hidden.",
    scope: "client", config: true, type: Boolean, default: true, onChange: refresh,
  });
  game.settings!.register(MODULE, "combatBarSize", {
    name: "Combat bar portrait size", hint: "Square actor portrait size on this client.",
    scope: "client", config: true, type: String, default: "40",
    choices: {32: "Small (32 px)", 40: "Medium (40 px)", 48: "Large (48 px)"}, onChange: refresh,
  });
  game.settings!.register(MODULE, "combatBarOrientation", {
    name: "Combat bar layout", hint: "Display actors vertically or horizontally above Players.",
    scope: "client", config: true, type: String, default: "vertical",
    choices: {vertical: "Vertical", horizontal: "Horizontal"}, onChange: refresh,
  });
  game.settings!.register(MODULE, "combatBarMinimized", {
    name: "Combat bar minimized", scope: "client", config: false, type: Boolean, default: false, onChange: refresh,
  });
  game.settings!.register(MODULE, "combatBarNameOnly", {
    name: "Show name only", hint: "Show only the actor's name in combat bar portrait tooltips, without click instructions.",
    scope: "client", config: true, type: Boolean, default: false, onChange: refresh,
  });
  // Keep portrait nodes stable between the two clicks; a selection rerender would swallow dblclick.
  Hooks.on("controlToken", () => {
    const entries=barEntries();
    root?.querySelectorAll<HTMLElement>("li[data-entry-id]").forEach(row=>{
      row.classList.toggle("controlled",!!entries.find(entry=>entry.id===row.dataset.entryId)?.token?.controlled);
    });
  });
  for (const hook of ["ready", "canvasReady", "renderPlayerList", "renderCombatTracker", "createToken", "updateToken", "deleteToken",
    "updateActor", "updateUser", "userConnected", "createCombat", "updateCombat", "deleteCombat", "createCombatant", "updateCombatant", "deleteCombatant"])
    Hooks.on(hook, refresh);
  Hooks.on("canvasTearDown", () => {cancelAnimationFrame(frame); frame = 0; remove();});
  window.addEventListener("resize", position);
  window.addEventListener("pointerup", cancelHold);
  window.addEventListener("pointercancel", cancelHold);
  window.addEventListener("blur", cancelHold);
  window.addEventListener("pointerdown", event => {if(root&&!root.contains(event.target as Node))closeBarFlyout();});
  window.addEventListener("keydown", event => {if(event.key==="Escape")closeBarFlyout();});
  for(const hook of ["createActiveEffect","updateActiveEffect","deleteActiveEffect"])Hooks.on(hook,closeBarFlyout);
}
