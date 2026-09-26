import { primaryGM as electedGM } from "../shared.js";
import { MODULE, quickhackId, isQuickhackLauncher, type QuickhackItem } from "./availability.js";
import { QUICKHACKS, type Quickhack } from "./catalog.js";
import { enabled, label } from "./settings.js";

export const itemView = (item: Item) => item as unknown as QuickhackItem;
export function programData(hack: Quickhack) {
  return {
    name: `Quickhack: ${hack.name}`, type: "program",
    img: `modules/${MODULE}/styles/quickhacks/${hack.id}-gray.png`,
    system: { class: "booster", size: 1, isRezzed: false,
      description: { value: `<p>${hack.tier} QuickHack — DV${hack.dv}</p><p>${label("Item.Effect." + hack.id)}</p>` },
      damage: { standard: "0", blackIce: "0" } },
    flags: { [String(MODULE)]: { quickhackId: hack.id } },
  };
}
export const primaryGM = () => electedGM()?.id === game.user!.id;

let initialization: Promise<void> | undefined;
export function initializeQuickhackContent(): Promise<void> {
  if (!enabled() || !primaryGM()) return Promise.resolve();
  return initialization ??= createMissingContent().finally(() => { initialization = undefined; });
}
/** Seed missing content only. Existing documents are never rewritten. */
async function createMissingContent() {
  if (!enabled()) return;
  const root = await ensureFolder("CombatTools");
  const folder = await ensureFolder("Quickhacks", root);
  for (const hack of QUICKHACKS) {
    if (!enabled()) return;
    if (game.items!.some(item => String(item.type) === "program" && quickhackId(itemView(item)) === hack.id)) continue;
    await Item.create({ ...programData(hack), folder: folder.id } as never);
  }
  if (!enabled()) return;
  if (!game.items!.some(item => isQuickhackLauncher(itemView(item)))) {
    await Item.create({ name: "QuickHack", type: "weapon", folder: root.id,
      img: `modules/${MODULE}/styles/quickhack-gray.png`,
      system: { description: { value: "<p>Use the sheet attack control to Jack In and the damage control to select a QuickHack. Select your token and target one other token.</p>" },
        equipped: "owned", weaponType: "unarmed", isRanged: false, handsReq: 0, rof: 1,
        damage: "0", unarmedAutomaticCalculation: false },
      flags: { [String(MODULE)]: { action: "quickhack" } } } as never);
  }
}

async function ensureFolder(name: string, parent?: Folder): Promise<Folder> {
  const existing = game.folders!.find(folder => folder.type === "Item" && folder.name === name
    && (folder.folder?.id ?? null) === (parent?.id ?? null));
  if (existing) return existing;
  const created = await Folder.create({ name, type: "Item", folder: parent?.id ?? null });
  if (!created) throw new Error(`Could not create QuickHack content folder: ${name}`);
  return created;
}
