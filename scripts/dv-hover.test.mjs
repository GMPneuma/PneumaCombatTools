import assert from 'node:assert/strict';
import { test } from 'node:test';
import { equippedRanges, distanceWithElevation, parseDV, dvTone } from '../dist/scripts/dv-data.js';
import { registerHoverDV } from '../dist/scripts/dv-hover.js';

const weapon = (id, system = {}) => ({ id, name: id, type: 'weapon', system: {
  isRanged: true, equipped: 'equipped', dvTable: 'DV Pistol', ...system,
} });

test('equipped ranged weapons only, with per-weapon Autofire entries', () => {
  const items = [weapon('pistol'), weapon('rifle', { weaponType: 'assaultRifle' }),
    weapon('carried', { equipped: 'carried' }), weapon('blade', { isRanged: false }),
    weapon('unconfigured', { dvTable: '' })];
  assert.deepEqual(equippedRanges(items, false).map(row => row.name), ['pistol', 'rifle']);
  assert.deepEqual(equippedRanges(items, true).map(row => [row.name, row.autofire]),
    [['pistol', false], ['rifle', false], ['rifle', true]]);
});

test('installed cyberweapons and launchers on parents without a DV table; no scopes or duplicates', () => {
  const launcher = weapon('launcher', { isInstalled: true });
  const scope = weapon('scope', { isInstalled: true, isRanged: false });
  const parent = weapon('parent', { dvTable: '', upgrades: [{ _id: 'launcher' }, { _id: 'scope' }] });
  const cyber = { ...weapon('cyber', { equipped: 'owned', isInstalled: true, isWeapon: true }), type: 'cyberware' };
  const spare = { ...cyber, id: 'spare', system: { ...cyber.system, isInstalled: false } };
  assert.deepEqual(equippedRanges([parent, launcher, scope, cyber, spare], false).map(row => row.name), ['launcher', 'cyber']);
});

test('distance incorporates elevation and malformed/nonpositive DVs are omitted', () => {
  assert.equal(distanceWithElevation(3, 0, 4), 5);
  assert.equal(distanceWithElevation(12.6, 0, 0), 13);
  assert.equal(parseDV(' 13 '), 13);
  for (const value of ['', undefined, '13 garbage', '0', '-1', 'NaN']) assert.equal(parseDV(value), undefined);
});

test('hover lifecycle, table precedence, range boundaries, updates and stale async lookup', async () => {
  const hooks = new Map();
  globalThis.Hooks = { on: (name, fn) => hooks.set(name, [...(hooks.get(name) ?? []), fn]) };
  const fire = (name, ...args) => { for (const fn of hooks.get(name) ?? []) fn(...args); };
  const settings = new Map([['dvRollTableCompendium', 'custom.dv']]);
  globalThis.window = { innerWidth: 1000, innerHeight: 800, addEventListener() {} };
  const children = [];
  globalThis.document = {
    body: { append: node => {node.parentElement = true;children.push(node);} },
    createTextNode: textContent => ({ textContent }),
    createElement: () => ({ style: {}, children: [], offsetWidth: 150, offsetHeight: 35,
      replaceChildren(...nodes) {this.children = nodes;}, setAttribute() {}, append(...nodes) { this.children.push(...nodes); },
      get textContent() { return this.children.map(node => node.textContent).join(''); },
      set textContent(value) { this.children = [{ textContent: value }]; },
      remove() { const index = children.indexOf(this); if (index >= 0) children.splice(index, 1); } }),
  };
  globalThis.PIXI = { Point: class { constructor(x, y) { this.x = x; this.y = y; } } };
  let distance = 6;
  const source = { actor: { isOwner: true, items: [weapon('<pistol>')] }, center: { x: 0, y: 0 }, document: { elevation: 0 } };
  const target = { isVisible: true, center: { x: 6, y: 0 }, x: 6, y: 0, w: 1, document: { elevation: 0 } };
  const tokens = { controlled: [source] };
  globalThis.canvas = { tokens, activeLayer: tokens,
    grid: { measurePath: () => ({ distance }) }, stage: { toGlobal: point => point },
    app: { view: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 800 }) }, screen: { width: 1000, height: 800 } },
  };
  const ranges = [{ range: [0, 6], text: '13' }, { range: [7, 12], text: '15' }];
  const world = { getResultsForRoll: value => ranges.filter(row => value >= row.range[0] && value <= row.range[1]) };
  let worldTable = world;
  let packReads = 0;
  let release;
  const pack = { documentName: 'RollTable', getIndex: async () => [{ _id: 'table', name: 'DV Pistol' }],
    getDocument: () => { packReads++; return new Promise(resolve => { release = resolve; }); } };
  globalThis.game = { settings: { get: (_, key) => settings.get(key), register: (_, key, config) => settings.set(key, config.default) },
    tables: { getName: () => worldTable }, packs: new Map([['custom.dv', pack]]), i18n: { localize: () => 'Autofire' } };
  registerHoverDV();
  const settle = () => new Promise(resolve => setImmediate(resolve));
  fire('hoverToken', target, true);
  await settle();
  assert.equal(children[0].children[0].textContent, 'DV13 <pistol>');
  assert.equal(children[0].children[0].children[0].className, 'pneuma-dv-value pneuma-dv-green');
  assert.equal(packReads, 0, 'world table takes precedence');
  const retained = children[0]; const row = retained.children[0];
  fire("updateToken", target.document);await settle();
  assert.equal(children[0],retained);assert.equal(retained.children[0],row,"unchanged DV retains row nodes");
  distance = 7;
  fire('updateToken', target.document);
  await settle();
  assert.equal(children[0].children[0].textContent, 'DV15 <pistol>');
  ranges[1].text = '17';
  fire('updateTableResult');
  await settle();
  assert.equal(children[0].children[0].textContent, 'DV17 <pistol>');
  assert.equal(children[0].children[0].children[0].className, 'pneuma-dv-value pneuma-dv-yellow');
  tokens.controlled.push(target);
  fire('controlToken');
  await settle();
  assert.equal(children.length, 0, 'ambiguous attacker hides panel');
  tokens.controlled.pop();
  distance = 99;
  fire('controlToken');
  await settle();
  assert.equal(children.length, 0, 'out-of-range produces no DV');
  distance = 6;
  worldTable = undefined;
  fire('hoverToken', target, true);
  await settle();
  assert.equal(packReads, 1);
  fire('hoverToken', target, false);
  release(world);
  await settle();
  assert.equal(children.length, 0, 'late lookup cannot revive dismissed panel');
  fire("hoverToken", target, true);await settle();assert.equal(packReads,1,"cached table reused after hover ends");
  fire("updateTableResult");await settle();assert.equal(packReads,2,"edited table invalidates cache");release(world);await settle();
  worldTable = world;
  fire('hoverToken', target, true);
  await settle();
  assert.equal(children.length, 1);
  fire('canvasTearDown');
  assert.equal(children.length, 0);
});

test("DV colors change exactly at 17 and 21", () => {
  for (const [dv, tone] of [[13, "green"], [16, "green"], [17, "yellow"], [20, "yellow"], [21, "red"], [30, "red"]]) {
    assert.equal(dvTone(dv), tone);
  }
});
