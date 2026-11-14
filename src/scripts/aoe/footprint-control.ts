import { MODULE } from "./settings.js";

const toolName = "pneuma-hide-grenade-footprints";

function visibleGrenade(template: MeasuredTemplateDocument) {
    if (template.hidden) return false;
    const flags = foundry.utils.getProperty(template, `flags.${MODULE}`) as
      { grenadeCombat?: string | null; areaMessage?: string } | undefined;
    if (flags?.grenadeCombat !== undefined) return true;
    const source = flags?.areaMessage && game.messages?.get(flags.areaMessage);
    return !!source && foundry.utils.getProperty(source, `flags.${MODULE}.aoe.kind`) === "explosive";
}
function visibleGrenades(scene: Scene) {
  return scene.templates.filter(visibleGrenade);
}

export function registerFootprintControl(hideCard: (message: string) => Promise<unknown>, report: (error: unknown) => void) {
  let indexedScene: Scene | undefined;
  const visible = new Set<string>();
  const available = () => {
    if (indexedScene !== canvas.scene) {
      indexedScene = canvas.scene ?? undefined;
      visible.clear();
      if (indexedScene) for (const template of visibleGrenades(indexedScene)) visible.add(template.id!);
    }
    return visible.size > 0;
  };
  async function hide() {
    const scene = canvas.scene;
    if (!game.user?.isGM || !scene) return;
    const cards = new Set<string>();
    const orphans: { _id: string; hidden: boolean }[] = [];
    for (const template of visibleGrenades(scene)) {
      const id = foundry.utils.getProperty(template, `flags.${MODULE}.areaMessage`) as string | undefined;
      const card = id && game.messages?.get(id);
      if (card && foundry.utils.getProperty(card, `flags.${MODULE}.aoe.scene`) === scene.id) cards.add(id);
      else orphans.push({ _id: template.id!, hidden: true });
    }
    if (orphans.length) await scene.updateEmbeddedDocuments("MeasuredTemplate", orphans);
    for (const id of cards) await hideCard(id);
  }

  Hooks.on("getSceneControlButtons", (controls: SceneControl[]) => {
    if (!game.user?.isGM) return;
    controls.find(control => control.name === "token")?.tools.push({
      name: toolName, title: "Hide grenade footprints", icon: "fas fa-eye-slash", button: true,
      visible: available(), onClick: () => { void hide().catch(report); }
    });
  });
  function refresh() {
    const tool = ui.controls?.controls?.find(control => control.name === "token")?.tools.find(entry => entry.name === toolName);
    if (!tool) return;
    const visible = available();
    if (tool.visible === visible) return;
    tool.visible = visible;
    ui.controls?.render();
  }
  Hooks.on("canvasReady", () => { indexedScene = undefined; refresh(); });
  for (const hook of ["createMeasuredTemplate", "updateMeasuredTemplate", "deleteMeasuredTemplate"]) {
    Hooks.on(hook, (template: MeasuredTemplateDocument) => {
      if (template.parent !== canvas.scene) return;
      if (indexedScene === canvas.scene) {
        if (hook === "deleteMeasuredTemplate" || !visibleGrenade(template)) visible.delete(template.id!);
        else visible.add(template.id!);
      }
      refresh();
    });
  }
}
