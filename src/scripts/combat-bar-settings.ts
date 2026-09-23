import {combatBarPositionControls, COMBAT_BAR_SETTING_KEYS} from "./settings-layout.js";

const MODULE = "pneuma-combattools";
type BarSetting = typeof COMBAT_BAR_SETTING_KEYS[number];
type NativeRow = {id:string;key:string};
type NativeCategory = {id:string;title:string;settings:NativeRow[];menus:unknown[];count:number};

/** Read the same permission-filtered, localized rows as the native Module Settings window. */
export async function combatBarSettingsHTML():Promise<string> {
  const data = await new SettingsConfig().getData() as unknown as {categories:NativeCategory[]};
  const rows = data.categories.flatMap(category => category.settings);
  const settings = COMBAT_BAR_SETTING_KEYS.flatMap(key => rows.filter(row => row.id === MODULE + "." + key));
  return renderTemplate("templates/sidebar/apps/settings-config-category.html", {
    id:MODULE, title:"Combat Bar", menus:[], settings, count:settings.length,
  });
}

export async function saveCombatBarSetting(id:string,value:unknown):Promise<void> {
  const key = id.slice(MODULE.length + 1) as BarSetting;
  if (!id.startsWith(MODULE + ".") || !COMBAT_BAR_SETTING_KEYS.includes(key)) throw Error("Unknown Combat Bar setting.");
  const setting = game.settings!.settings.get(id as keyof SettingConfig);
  if (!setting?.config || setting.scope !== "client" && !game.user?.can("SETTINGS_MODIFY")) throw Error("You cannot change this setting.");
  if (setting.type === Boolean) {
    if (typeof value !== "boolean") throw Error("Invalid checkbox value.");
  } else if (setting.choices && !Object.hasOwn(setting.choices,String(value))) throw Error("Invalid setting choice.");
  if (game.settings!.get(MODULE,key) !== value) await game.settings!.set(MODULE,key,value as never);
}

export class CombatBarSettings extends FormApplication {
  constructor(){super({});}
  static override get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title:"Combat Bar", id:"pneuma-combat-bar-settings", width:460, height:"auto",
      classes:["pneuma-combat-bar-settings"], resizable:false, closeOnSubmit:false,
      submitOnChange:false, submitOnClose:false,
      template:"modules/pneuma-combattools/templates/combat-bar-settings.hbs",
    }) as typeof FormApplication.defaultOptions;
  }
  override async getData() {return {settingsHTML:await combatBarSettingsHTML()};}
  override activateListeners(html:JQuery) {
    super.activateListeners(html);
    const root=html[0];if(!root)return;
    combatBarPositionControls(root);
    root.querySelectorAll<HTMLInputElement|HTMLSelectElement>("input[name], select[name]").forEach(input => {
      input.addEventListener("change",()=>{
        const value=input instanceof HTMLInputElement && input.type==="checkbox"?input.checked:input.value;
        input.disabled=true;
        void saveCombatBarSetting(input.name,value).catch(error=>{
          ui.notifications!.error(String(error));
          void this.render(false);
        }).finally(()=>{input.disabled=false;});
      });
    });
    root.querySelector("[data-close]")?.addEventListener("click",()=>{void this.close();});
  }
  protected override async _updateObject(_event:Event,_data:Record<string,unknown>) {}
}
let editor:CombatBarSettings|undefined;
export function openCombatBarSettings():void {
  editor??=new CombatBarSettings();
  // Foundry focuses after the asynchronous render has created the window element.
  editor.render(true, {focus:true});
}
