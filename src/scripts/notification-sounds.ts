const M="pneuma-combattools";
declare global {interface SettingConfig {
  "pneuma-combattools.messageAlertSound":string;
  "pneuma-combattools.messageAlertVolume":number;
  "pneuma-combattools.yourTurnSound":string;
  "pneuma-combattools.yourTurnVolume":number;
}}
export function playNotificationSound(kind:"message"|"turn"):void {
  const src=game.settings!.get(M,kind==="turn"?"yourTurnSound":"messageAlertSound");
  const volume=game.settings!.get(M,kind==="turn"?"yourTurnVolume":"messageAlertVolume");
  if(typeof src!=="string"||!src.trim()||!Number.isFinite(volume)||volume<=0)return;
  void foundry.audio.AudioHelper.play({src,volume:Math.min(1,volume),loop:false},false)
    .catch(error=>console.warn(M,"Notification sound unavailable",error));
}
export function registerNotificationSounds():void {
  for(const [key,label,file,volumeKey,volume] of [
    ["messageAlertSound","Popup message sound","message-alert","messageAlertVolume",.4],
    ["yourTurnSound","Your-turn sound","your-turn","yourTurnVolume",.65]
  ] as const){
    game.settings!.register(M,key,{name:label,hint:"GM-controlled sound file. Leave blank to silence. Plays only on the receiving client.",scope:"world",config:false,type:String,default:`modules/${M}/sounds/${file}.wav`});
    game.settings!.register(M,volumeKey,{name:label+" volume",hint:"0 silences this notification.",scope:"world",config:false,type:Number,default:volume,range:{min:0,max:1,step:.05}});
  }
}
