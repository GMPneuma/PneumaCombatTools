import { primaryGM } from "./shared.js";

const MODULE = "pneuma-combattools";
const MAX_EVENTS_PER_SECOND = 2048;
const WINDOW_SECONDS = 60;
const MAX_GROUPS = 512;
type Dimension = string | number | null;
type Metric = { index: number; key: Dimension[]; count: number; totalMs?: number; maxMs?: number };
type Bucket = {
  second: number;
  groups: Map<string, Metric>;
  overflow: number;
  peakOutstanding: number;
  events: [number, number, number?][];
  droppedEvents: number;
  sample?: ReturnType<typeof sample>;
};
type MessageRef = { id?: string | null; uuid?: string; documentName?: string; flags?: object };
type Packet = Record<string, unknown>;
const record = (value: unknown): Packet => (value && typeof value === "object" ? (value as Packet) : {});
const str = (value: unknown) => (typeof value === "string" ? value.slice(0, 160) : "");
const round = (value: number) => Math.round(value * 100) / 100;

function cardKind(message: MessageRef): string {
  const flags = record(message.flags),
    combat = record(flags[MODULE]);
  const kind = [
    "exchange",
    "aoe",
    "grapple",
    "quickhack",
    "sceneEffect",
    "manualRoll",
    "brokenRibs",
    "instant",
    "emp",
    "statusCleanup",
  ].find((key) => combat[key]);
  return kind ?? (flags[MODULE] ? "combat-other" : "other");
}

// Never serialize document values, chat content, socket payloads or user-entered text.
export function changedFields(value: unknown): string[] {
  const fields: string[] = [];
  const walk = (obj: Packet, prefix: string) => {
    for (const key of Object.keys(obj)) {
      if (fields.length >= 16) return;
      const path = prefix ? prefix + "." + key : key;
      const child = obj[key];
      if (
        child &&
        typeof child === "object" &&
        !Array.isArray(child) &&
        path.split(".").length < 4 &&
        Object.keys(child).length
      )
        walk(record(child), path);
      else fields.push(path.slice(0, 160));
    }
  };
  walk(record(value), "");
  return fields.sort();
}

function chatSize() {
  const logs = document.querySelectorAll("#chat-log, #chat-log-popout");
  let chatCards = 0,
    chatElements = 0;
  for (const log of Array.from(logs)) {
    chatCards += log.querySelectorAll(".message[data-message-id]").length;
    chatElements += log.getElementsByTagName("*").length;
  }
  return { chatCards, chatElements };
}

function sample(chat: ReturnType<typeof chatSize>) {
  const heap = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return {
    ...chat,
    jsHeapMiB: heap ? round(heap.usedJSHeapSize / 1048576) : null,
    scene: canvas.scene?.id,
    sceneTokens: canvas.scene?.tokens.size,
    combatants: game.combat?.combatants.size ?? 0,
    connectedUsers: game.users?.filter((u) => u.active).length,
    sidebar: ui.sidebar?.activeTab,
    chatPopoutOpen: !!document.getElementById("chat-popout"),
    sidebarCollapsed: document.getElementById("sidebar")?.classList.contains("collapsed") ?? false,
    foreground: !document.hidden,
    pendingRequests: 0,
    handling: 0,
    canvasTickerFPS: canvas.ready && canvas.app?.ticker ? round(canvas.app.ticker.FPS) : null,
  };
}

// Keep inexpensive minute totals for the whole session after the raw detail ages out.
function emptyMinute(minute: number) {
  return {
    minute,
    frames: 0,
    frameMs: 0,
    slowFrames: 0,
    worstFrameMs: 0,
    canvasTicks: 0,
    canvasMs: 0,
    renders: 0,
    documents: 0,
    gmIncoming: 0,
    combatWorkMs: 0,
    visualWorkMs: 0,
    jsHeapMiB: null as number | null,
    mountedCards: null as number | null,
  };
}
type Minute = ReturnType<typeof emptyMinute>;

function accumulateMinute(minutes: Map<number, Minute>, bucket: Bucket) {
  const index = Math.floor(bucket.second / 60);
  const minute = minutes.get(index) ?? emptyMinute(index);
  minutes.set(index, minute);
  if (bucket.sample) {
    minute.mountedCards = bucket.sample.chatCards;
    minute.jsHeapMiB = bucket.sample.jsHeapMiB;
  }
  for (const metric of bucket.groups.values()) {
    const [kind, label] = metric.key;
    switch (kind) {
      case "browser.frame":
        minute.frames += metric.count;
        minute.frameMs += metric.totalMs ?? 0;
        minute.worstFrameMs = Math.max(minute.worstFrameMs, metric.maxMs ?? 0);
        if (label === "50-100ms" || label === "100ms+") minute.slowFrames += metric.count;
        break;
      case "canvas.tick":
        minute.canvasTicks += metric.count;
        minute.canvasMs += metric.totalMs ?? 0;
        break;
      case "document":
        minute.documents += metric.count;
        break;
      case "chat.render":
        minute.renders += metric.count;
        break;
      case "gm.incoming":
        minute.gmIncoming += metric.count;
        break;
      case "work":
        if (label === MODULE) minute.combatWorkMs += metric.totalMs ?? 0;
        if (label === "pneuma-visualtools") minute.visualWorkMs += metric.totalMs ?? 0;
        break;
    }
  }
}

export class MinuteBuffer {
  private minutes = new Map<number, Minute>();
  private buckets = new Map<number, Bucket>();
  constructor(private readonly now: () => number) {}
  bucket(): Bucket {
    const second = Math.floor(this.now() / 1000);
    for (const [key, previous] of this.buckets) {
      if (key > second - WINDOW_SECONDS) break;
      accumulateMinute(this.minutes, previous);
      this.buckets.delete(key);
    }
    let bucket = this.buckets.get(second);
    if (!bucket) {
      bucket = { second, groups: new Map(), overflow: 0, peakOutstanding: 0, events: [], droppedEvents: 0 };
      this.buckets.set(second, bucket);
    }
    return bucket;
  }
  add(key: Dimension[], ms?: number): void {
    const bucket = this.bucket(),
      id = JSON.stringify(key);
    let metric = bucket.groups.get(id);
    if (!metric) {
      if (bucket.groups.size >= MAX_GROUPS) {
        bucket.overflow++;
        return;
      }
      metric = { index: bucket.groups.size, key, count: 0 };
      bucket.groups.set(id, metric);
    }
    metric.count++;
    if (bucket.events.length < MAX_EVENTS_PER_SECOND) {
      const time = round(this.now());
      bucket.events.push(ms === undefined ? [time, metric.index] : [time, metric.index, round(ms)]);
    } else bucket.droppedEvents++;
    if (ms !== undefined) {
      metric.totalMs = (metric.totalMs ?? 0) + ms;
      metric.maxMs = Math.max(metric.maxMs ?? 0, ms);
    }
  }
  history() {
    const minutes = new Map([...this.minutes].map(([index, minute]) => [index, { ...minute }]));
    for (const bucket of this.buckets.values()) accumulateMinute(minutes, bucket);
    return [...minutes.values()];
  }
  export() {
    this.bucket();
    return [...this.buckets.values()].map((b) => ({
      second: b.second,
      sample: b.sample,
      overflow: b.overflow,
      peakOutstanding: b.peakOutstanding,
      events: b.events,
      droppedEvents: b.droppedEvents,
      metrics: [...b.groups.values()].map((m) =>
        m.totalMs === undefined ? { ...m } : { ...m, totalMs: round(m.totalMs), maxMs: round(m.maxMs!) },
      ),
    }));
  }
}

const protocols = [
  "kind",
  "aoeType",
  "grappleType",
  "manualType",
  "instantType",
  "sceneEffectType",
  "medicalType",
  "reversalType",
  "empType",
  "barTurn",
  "ribsType",
  "wake",
  "quickhackType",
] as const;
export function socketAction(value: unknown) {
  const wire = record(value),
    protocol = protocols.find((key) => typeof wire[key] === "string");
  if (!protocol || wire.quickhackType === "force-out-roll") return;
  const verb = str(wire[protocol]),
    data = protocol === "kind" && wire.packet ? record(wire.packet) : wire;
  const reply = ["reply", "result", "connected"].includes(verb);
  const paired =
    reply || ["request", "apply", "select", "connect", "disconnect", "awareness", "breach"].includes(verb);
  return {
    protocol,
    reply,
    paired,
    user: str(
      verb === "force-out-complete" || verb === "force-out-cancel"
        ? data.rollerId
        : (data.user ?? data.requesterId),
    ),
    gm: str(wire.gm ?? wire.gmId),
    id: str(protocol === "grappleType" ? wire.request : data.id),
    action: str(record(data.request).action ?? data.action) || verb,
    card: str(data.message ?? data.messageId),
  };
}

type RequestTime = { at: number; start?: number; action: string; card: string };
type SocketTap = {
  prependAny?(f: SocketListener): unknown;
  offAny?(f: SocketListener): unknown;
  onAnyOutgoing?(f: SocketListener): unknown;
  offAnyOutgoing?(f: SocketListener): unknown;
};
type SocketListener = (channel: string, packet: unknown) => void;

function caller(): string {
  for (const line of (new Error().stack ?? "").split("\n")) {
    if (/performance-recorder\.js|chat-render-guard\.js|native-wrappers\.js|\/lib-wrapper\//.test(line))
      continue;
    const path = line.match(/\/(modules|systems)\/([^/\s]+)/);
    if (path) return path[2]!;
    // Native frames may precede the synchronous module caller.
  }
  return "unknown";
}

export class PerformanceCapture {
  private readonly origin = performance.now();
  private readonly startedAt = new Date().toISOString();
  readonly buffer = new MinuteBuffer(() => performance.now() - this.origin);
  private cleanups: (() => void)[] = [];
  private raf = 0;
  private requests = new Map<string, RequestTime>();
  private causes = new WeakMap<object, string>();
  private capabilities = { incoming: false, outgoing: false, longFrames: false };
  private expired = 0;
  private live = true;
  private frameAt?: number;
  private get tick() {
    return canvas.ready ? canvas.app?.ticker : undefined;
  }
  private metadata = {
    browser: navigator.userAgent,
    pixelRatio: window.devicePixelRatio,
    viewport: [window.innerWidth, window.innerHeight],
    foundry: game.version,
    system: { id: game.system?.id, version: game.system?.version },
    user: game.user?.id,
    gm: game.user?.isGM,
    users: Array.from(game.users ?? [])
      .filter((u) => u.active)
      .map((u) => ({ id: u.id, name: u.name })),
    modules: Array.from(game.modules ?? [])
      .filter((m) => m.active)
      .map((m) => ({ id: m.id, version: m.version })),
  };

  metric(key: Dimension[], ms?: number) {
    if (this.live) this.buffer.add(key, ms);
  }
  chatRequest(message: MessageRef) {
    this.metric(["chat.refreshRequested", caller(), message.id ?? null, cardKind(message)]);
  }
  work(module: string, handler: string, card?: string, cause?: string): () => void {
    const start = performance.now();
    return () =>
      this.metric(["work", module, handler, card || null, cause || null], performance.now() - start);
  }
  bindWrite(state: object, request: string) {
    this.causes.set(state, request);
  }
  write(state: object, message: MessageRef, workflow: string) {
    this.metric([
      "chat.writeRequested",
      MODULE,
      workflow,
      message.id ?? null,
      this.causes.get(state) ?? null,
    ]);
  }
  handlerStart(protocol: string, id: string | undefined, user: string | undefined) {
    if (!id || !user) return;
    const pending = this.requests.get(JSON.stringify([protocol, user, id]));
    if (pending && pending.start === undefined) {
      pending.start = performance.now();
      this.metric(["gm.queueWait", protocol, pending.action, user, id], pending.start - pending.at);
    }
  }
  private socket(direction: "in" | "out", channel: string, value: unknown) {
    if (typeof channel !== "string" || !channel.startsWith("module.")) return;
    this.metric(["socket.module", direction, channel.slice(7, 167)]);
    if (channel !== "module." + MODULE) return;
    const p = socketAction(value);
    if (!p) return;
    const local = game.user?.id;
    if (p.reply) {
      if ((direction === "in" && p.user !== local) || (direction === "out" && !game.user?.isGM)) return;
    } else if (direction === "in") {
      if (!game.user?.isGM || local !== (p.protocol === "kind" && p.gm ? p.gm : primaryGM()?.id)) return;
    } else if (p.user !== local) return;
    const key = JSON.stringify([p.protocol, p.user, p.id]);
    const now = performance.now();
    if (!p.reply) {
      this.metric([
        direction === "in" ? "gm.incoming" : "client.sent",
        p.protocol,
        p.action,
        p.user,
        p.id || null,
        p.card || null,
      ]);
      if (p.paired && p.id && !this.requests.has(key)) {
        if (this.requests.size >= 2048) {
          this.requests.delete(this.requests.keys().next().value!);
          this.expired++;
        }
        this.requests.set(key, { at: now, action: p.action, card: p.card });
        const bucket = this.buffer.bucket();
        bucket.peakOutstanding = Math.max(bucket.peakOutstanding, this.requests.size);
      }
      return;
    }
    const req = this.requests.get(key);
    if (!req) return;
    this.requests.delete(key);
    const labels = [p.protocol, req.action, p.user, p.id, record(value).error ? "error" : "ok"];
    this.metric([direction === "in" ? "client.roundTrip" : "gm.receiveToReply", ...labels], now - req.at);
    if (direction === "out" && req.start !== undefined)
      this.metric(["gm.handling", ...labels], now - req.start);
  }
  start() {
    const listen = (event: string, fn: (...args: any[]) => void) => {
      const id = Hooks.on(event, fn);
      this.cleanups.push(() => Hooks.off(event, id));
    };
    for (const doc of [
      "Actor",
      "Item",
      "ActiveEffect",
      "Token",
      "Combat",
      "Combatant",
      "ChatMessage",
      "MeasuredTemplate",
      "Scene",
      "User",
    ]) {
      for (const op of ["create", "update", "delete"]) {
        const pre = "pre" + op[0]!.toUpperCase() + op.slice(1) + doc;
        listen(pre, (document: MessageRef) =>
          this.metric(["document.localRequest", op, doc, document.uuid ?? document.id ?? null, caller()]),
        );
        listen(op + doc, (document: MessageRef, first: unknown, second: unknown, third: unknown) => {
          const fields = op === "update" ? changedFields(first) : [];
          this.metric([
            "document",
            op,
            doc,
            document.uuid ?? document.id ?? null,
            str(op === "update" ? third : second),
            doc === "ChatMessage" ? cardKind(document) : null,
            fields.join(","),
          ]);
        });
      }
    }
    listen("renderChatMessage", (message: MessageRef) =>
      this.metric(["chat.render", message.id ?? null, cardKind(message)]),
    );
    listen("renderActorSheet", (sheet: { actor?: MessageRef }) =>
      this.metric(["sheet.render", sheet.actor?.uuid ?? null]),
    );
    let ticker = this.tick;
    let canvasTime: number | undefined;
    const canvasTick = () => {
      const now = performance.now();
      if (!document.hidden && canvasTime !== undefined) this.metric(["canvas.tick"], now - canvasTime);
      canvasTime = document.hidden ? undefined : now;
    };
    const detachTicker = () => {
      ticker?.remove(canvasTick);
      ticker = undefined;
      canvasTime = undefined;
    };
    ticker?.add(canvasTick);
    listen("canvasTearDown", detachTicker);
    listen("canvasReady", () => {
      detachTicker();
      ticker = this.tick;
      ticker?.add(canvasTick);
    });
    this.cleanups.push(detachTicker);
    const sock = game.socket as unknown as SocketTap | undefined;
    const incoming: SocketListener = (c, p) => this.socket("in", c, p),
      outgoing: SocketListener = (c, p) => this.socket("out", c, p);
    if (sock?.prependAny && sock.offAny) {
      sock.prependAny(incoming);
      this.capabilities.incoming = true;
      this.cleanups.push(() => sock.offAny!(incoming));
    }
    if (sock?.onAnyOutgoing && sock.offAnyOutgoing) {
      sock.onAnyOutgoing(outgoing);
      this.capabilities.outgoing = true;
      this.cleanups.push(() => sock.offAnyOutgoing!(outgoing));
    }
    const tick = (time: number) => {
      if (!document.hidden && this.frameAt !== undefined) {
        const dt = time - this.frameAt;
        this.metric(
          [
            "browser.frame",
            dt >= 100 ? "100ms+" : dt >= 50 ? "50–100ms" : dt >= 33 ? "33–50ms" : "under33ms",
            ui.sidebar?.activeTab ?? null,
          ],
          dt,
        );
      }
      this.frameAt = document.hidden ? undefined : time;
      this.raf = requestAnimationFrame(tick);
    };
    const visibility = () => {
      this.frameAt = undefined;
      canvasTime = undefined;
      this.metric(["visibility", document.hidden ? "hidden" : "visible"]);
    };
    document.addEventListener("visibilitychange", visibility);
    this.cleanups.push(() => document.removeEventListener("visibilitychange", visibility));
    this.raf = requestAnimationFrame(tick);
    if (
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes.includes("long-animation-frame")
    ) {
      const observer = new PerformanceObserver((list) => {
        for (const frame of list.getEntries()) {
          this.metric(["longFrame"], frame.duration);
          const scripts =
            (frame as PerformanceEntry & { scripts?: { sourceURL: string; duration: number }[] }).scripts ??
            [];
          for (const s of scripts)
            this.metric(
              ["longFrame.script", s.sourceURL.match(/\/(?:modules|systems)\/([^/]+)/)?.[1] ?? "unknown"],
              s.duration,
            );
        }
      });
      observer.observe({ type: "long-animation-frame" });
      this.capabilities.longFrames = true;
      this.cleanups.push(() => observer.disconnect());
    }
    let chat = chatSize(),
      measuredAt = performance.now();
    const snapshot = () => {
      const now = performance.now();
      for (const [key, req] of this.requests)
        if (now - req.at > 60000) {
          this.requests.delete(key);
          this.expired++;
        }
      const bucket = this.buffer.bucket();
      if (now - measuredAt >= 5000) {
        chat = chatSize();
        measuredAt = now;
      }
      bucket.sample = sample(chat);
      const waiting = [...this.requests.values()].filter((req) => req.start === undefined).length;
      bucket.sample.pendingRequests = this.requests.size;
      bucket.sample.handling = this.requests.size - waiting;
    };
    snapshot();
    const timer = window.setInterval(snapshot, 1000);
    this.cleanups.push(() => clearInterval(timer));
  }
  stop(marked: boolean) {
    this.live = false;
    cancelAnimationFrame(this.raf);
    for (const cleanup of this.cleanups.splice(0)) cleanup();
    const elapsedMs = round(performance.now() - this.origin);
    return {
      schema: 1,
      startedAt: this.startedAt,
      elapsedMs,
      lagMarkMs: marked ? elapsedMs : null,
      client: this.metadata,
      capabilities: this.capabilities,
      unmatchedOrExpiredRequests: this.expired,
      pendingAtStop: this.requests.size,
      seconds: this.buffer.export(),
      minutes: this.buffer.history(),
    };
  }
}

declare global {
  var pneumaPerformance: PerformanceCapture | undefined;
}
export type Report = ReturnType<PerformanceCapture["stop"]>;
let last: Report | undefined;
export function startCapture() {
  if (globalThis.pneumaPerformance) return;
  const session = new PerformanceCapture();
  try {
    session.start();
    globalThis.pneumaPerformance = session;
    last = undefined;
  } catch (error) {
    session.stop(false);
    throw error;
  }
}
export function stopCapture(marked = false) {
  const capture = globalThis.pneumaPerformance;
  if (capture) {
    globalThis.pneumaPerformance = undefined;
    last = capture.stop(marked);
  }
  return last;
}
export function savedCapture() {
  return last;
}
