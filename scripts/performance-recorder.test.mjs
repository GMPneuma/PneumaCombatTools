import assert from "node:assert/strict";
import test from "node:test";
import { MinuteBuffer, socketAction } from "../dist/scripts/performance-recorder.js";
import Handlebars from "handlebars";
import { readFileSync } from "node:fs";

test("rolling minute ages out detail and bounds a burst without losing existing counts", () => {
  let time = 0;
  const buffer = new MinuteBuffer(() => time);
  for (let i = 0; i < 2050; i++) buffer.add(["work", "a"], 2);
  for (let i = 1; i <= 512; i++) buffer.add(["group", i]);
  const [first] = buffer.export();
  assert.equal(first.metrics[0].count, 2050);
  assert.equal(first.metrics[0].totalMs, 4100);
  assert.equal(first.events.length, 2048);
  assert.equal(first.metrics.length, 512);
  assert.equal(first.overflow, 1);
  assert.equal(first.droppedEvents, 513);
  time = 59999;
  buffer.add(["chat.render"]);
  time = 60000;
  assert.deepEqual(
    buffer.export().map((b) => b.second),
    [59, 60],
  );
  time = 125000;
  buffer.add(["gm.incoming"]);
  assert.deepEqual(
    buffer.history().map((b) => [b.minute, b.renders, b.gmIncoming]),
    [
      [0, 1, 0],
      [1, 0, 0],
      [2, 0, 1],
    ],
  );
  assert.equal(buffer.history()[0].renders, 1);
});

test("pairs nested exchange and grapple packet IDs, ignoring GM-to-player prompts", () => {
  const packet = socketAction({
    kind: "request",
    gm: "gm",
    packet: { user: "p", action: "claim", message: "m", id: "r" },
  });
  assert.equal(packet.id, "r");
  assert.equal(packet.user, "p");
  assert.equal(packet.card, "m");
  assert.equal(packet.action, "claim");
  assert.equal(
    socketAction({ grappleType: "reply", request: "request-key", id: "grapple-key" }).id,
    "request-key",
  );
  assert.equal(socketAction({ quickhackType: "force-out-roll" }), undefined);
  assert.equal(
    socketAction({ quickhackType: "force-out-complete", requesterId: "p", rollerId: "r" }).user,
    "r",
  );
});

test("GM and player controls export matching readable and machine reports and detach recorders", async (t) => {
  let now = 0,
    raf,
    menu,
    keybinding,
    instance;
  const hooks = new Map(),
    listeners = new Map(),
    uiClicks = new Map(),
    files = [],
    submissions = [];
  let optIn = false, replyOk = false;
  const gm = { id: "g", name: "GM", active: true, isGM: true },
    player = { id: "p", name: "Player", active: true, isGM: false };
  const channel = "module.pneuma-combattools";
  const outgoing = (...args) => listeners.get("out")(...args);
  const incoming = (...args) => listeners.get("in")(...args);
  const bind = (key, fn) => listeners.set(key, fn);
  const unbind = (key, fn) => {
    assert.equal(listeners.get(key), fn);
    listeners.delete(key);
  };
  const globals = {
    game: {
      user: gm,
      users: [gm, player],
      system: { id: "test" },
      modules: [],
      settings: { registerMenu: (_m, _k, data) => (menu = data) },
      keybindings: { register: (_m, _k, data) => (keybinding = data) },
      socket: {
        prependAny: (f) => bind("in", f),
        offAny: (f) => unbind("in", f),
        onAnyOutgoing: (f) => bind("out", f),
        offAnyOutgoing: (f) => unbind("out", f),
      },
    },
    Hooks: {
      on: (e, f) => {
        hooks.set(e, f);
        return e;
      },
      off: (e, id) => {
        assert.equal(e, id);
        hooks.delete(e);
      },
    },
    ui: { sidebar: { activeTab: "chat" }, windows: {}, notifications: { info() {}, warn() {} } },
    fetch: async (url, request) => {
      submissions.push({url, request});
      return {ok: replyOk, json: async () => ({id: "PNEUMA-5678"})};
    },
    canvas: {
      ready: true,
      app: { ticker: { FPS: 60, add: (f) => bind("pixi", f), remove: (f) => unbind("pixi", f) } },
    },
    document: {
      hidden: false,
      getElementById: () => null,
      querySelectorAll: () => [],
      addEventListener: bind,
      removeEventListener: unbind,
    },
    window: {
      setInterval: (f) => {
        bind("timer", f);
        return 123;
      },
    },
    clearInterval: (id) => {
      assert.equal(id, 123);
      listeners.delete("timer");
    },
    requestAnimationFrame: (f) => {
      raf = f;
      return 1;
    },
    cancelAnimationFrame: () => (raf = undefined),
    performance: { now: () => now },
    PerformanceObserver: undefined,
    FormApplication: class {
      activateListeners() {}
      render() {}
    },
    saveDataToFile: (data, mime, name) => files.push({ data, mime, name }),
  };
  for (const [key, value] of Object.entries(globals)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, key, original);
      else delete globalThis[key];
    });
  }
  const { registerPerformanceRecorder } = await import("../dist/scripts/performance-settings.js");
  registerPerformanceRecorder();
  assert.equal(menu.restricted, false);
  assert.equal(keybinding.onDown(), false);
  instance = new menu.type();
  globalThis.ui.windows.recorder = instance;
  instance.activateListeners({
    find: (selector) => ({
      on: (_event, handler) => uiClicks.set(selector, handler),
      is: (filter) => selector === "[data-share-report]" && filter === ":checked" && optIn,
    }),
  });
  const click = (name) => uiClicks.get("[data-" + name + "]")();
  const template = Handlebars.compile(
    readFileSync(new URL("../dist/templates/performance-recorder.hbs", import.meta.url), "utf8"),
  );
  click("start");
  assert.match(template(instance.getData()), /Recording this client/);
  const request = { aoeType: "request", user: "p", message: "m", action: "claim", id: "r" };
  const response = { ...request, aoeType: "reply", gm: "g" };
  incoming(channel, request);
  now = 12;
  globalThis.pneumaPerformance.handlerStart("aoeType", "r", "p");
  const state = {},
    message = {
      id: "m",
      uuid: "ChatMessage.m",
      content: "SECRET",
      flags: { "pneuma-combattools": { aoe: {} } },
    };
  globalThis.pneumaPerformance.bindWrite(state, "r");
  globalThis.pneumaPerformance.write(state, message, "aoe");
  hooks.get("updateChatMessage")(message, { content: "SECRET" }, {}, "g");
  hooks.get("renderChatMessage")(message);
  const finish = globalThis.pneumaPerformance.work("pneuma-visualtools", "chat.dice", "m");
  now = 16;
  finish();
  raf(now);
  listeners.get("pixi")();
  now = 20;
  outgoing(channel, response);
  now = 120;
  raf(now);
  listeners.get("pixi")();
  globalThis.ui.sidebar.activeTab = "actors";
  now = 136;
  raf(now);
  assert.equal(keybinding.onDown(), true);
  assert.equal(listeners.size, 0);
  assert.equal(submissions.length, 0, "default recording stays local even when marked by hotkey");
  assert.equal(hooks.size, 0);
  assert.equal(raf, undefined);
  const view = template(instance.getData());
  assert.match(view, /Export full report/);
  assert.match(view, /Export readable summary/);
  const exp = (format) => uiClicks.get("[data-export]")({ currentTarget: { dataset: { export: format } } });
  exp("full");
  exp("summary");
  const full = JSON.parse(files[0].data);
  assert.equal(files[1].data, full.summary.join("\n"));
  assert.match(files[0].name, /gm.*\.json$/);
  assert.match(files[1].name, /gm.*\.txt$/);
  assert.doesNotMatch(files[0].data, /SECRET/);
  assert.match(files[1].data, /Player \/ claim/);
  assert.match(files[1].data, /With the chat tab selected/);
  assert.equal(full.lagMarkMs, 136);
  const groups = full.seconds[0].metrics;
  const metric = (name) => groups.find((m) => m.key[0] === name);
  assert.equal(metric("gm.queueWait").totalMs, 12);
  assert.equal(metric("gm.handling").totalMs, 8);
  assert.equal(metric("chat.writeRequested").key[4], "r");
  assert.equal(metric("canvas.tick").maxMs, 104);
  assert.equal(metric("work").maxMs, 4);
  assert.ok(full.seconds[0].events.every((e) => groups[e[1]]));

  game.user = player;
  optIn = true;
  click("start");
  outgoing(channel, request);
  incoming(channel, { ...request, id: "other" });
  now += 25;
  incoming(channel, response);
  click("stop");
  exp("full");
  const playerReport = JSON.parse(files[2].data);
  const observations = playerReport.seconds[0].metrics;
  assert.equal(observations.find((m) => m.key[0] === "client.roundTrip").totalMs, 25);
  assert.ok(!observations.some((m) => m.key[0] === "gm.incoming"));
  assert.equal(playerReport.lagMarkMs, null);
  assert.equal(listeners.size, 0);
  await new Promise(setImmediate);
  assert.equal(submissions.length, 1);
  assert.equal(submissions[0].url,"https://pneuma-report-inbox.jeremygnj.chatgpt.site/api/reports");
  assert.equal(submissions[0].request.credentials,"omit");
  assert.equal(submissions[0].request.body, files[2].data);
  assert.match(template(instance.getData()), /Retry sending report/);
  replyOk = true;
  click("retry");
  click("retry");
  await new Promise(setImmediate);
  assert.equal(submissions.length, 2);
  assert.equal(submissions[1].request.body, submissions[0].request.body);
  assert.match(template(instance.getData()), /Pneuma received report PNEUMA-5678/);

  click("start");
  now += 20;
  assert.equal(keybinding.onDown(),true);
  await new Promise(setImmediate);
  assert.equal(submissions.length, 3);
  assert.equal(JSON.parse(submissions[2].request.body).lagMarkMs,20);
  assert.doesNotMatch(template(instance.getData()), /data-share-report[^>]*checked/);
  optIn = false;
  click("start");
  click("stop");
  await new Promise(setImmediate);
  assert.equal(submissions.length, 3, "earlier consent is not reused");
});
