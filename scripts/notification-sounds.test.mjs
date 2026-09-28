import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {playNotificationSound,registerNotificationSounds} from '../dist/scripts/notification-sounds.js';
test('two GM-configured sounds play locally, honor mute and never broadcast',()=>{
 const settings={},registrations=[],played=[];
 globalThis.game={settings:{register:(_m,key,config)=>{registrations.push(config);settings[key]=config.default;},get:(_m,key)=>settings[key]}};
 globalThis.foundry={audio:{AudioHelper:{play:async(...args)=>played.push(args)}}};
 registerNotificationSounds();assert.equal(registrations.length,4);assert.ok(registrations.every(s=>s.scope==='world'));
 playNotificationSound('message');playNotificationSound('turn');assert.equal(played.length,2);assert.notEqual(played[0][0].src,played[1][0].src);assert.ok(played.every(p=>p[1]===false));
 settings.messageAlertSound='';settings.yourTurnVolume=0;playNotificationSound('message');playNotificationSound('turn');assert.equal(played.length,2);
});
test('generated defaults are short mono PCM WAVs without clipping',()=>{
 for(const file of ['message-alert','your-turn']){const wav=readFileSync(new URL('../src/sounds/'+file+'.wav',import.meta.url));assert.equal(wav.toString('ascii',0,4),'RIFF');assert.equal(wav.readUInt16LE(22),1);assert.equal(wav.readUInt32LE(24),44100);assert.ok((wav.length-44)/88200<1);let peak=0;for(let i=44;i<wav.length;i+=2)peak=Math.max(peak,Math.abs(wav.readInt16LE(i)));assert.ok(peak>1000&&peak<32767);}
});

test('HUD sound suppression is carried through flash and queued notices and validates the API input',async()=>{
 const {postHUDMessage,registerHUDMessages,listHUDMessages,dismissHUDMessage}=await import('../dist/scripts/hud-messages.js');
 const flashes=[];globalThis.Hooks={once(){}};
 globalThis.game={user:{id:'owner'},modules:new Map([['pneuma-combattools',{}]])};
 globalThis.foundry={utils:{randomID:()=> 'sound-test'}};
 registerHUDMessages(()=>{},(notice,remove)=>{if(!remove)flashes.push(notice);});
 postHUDMessage({source:'test',id:'quiet',text:'Quiet',mode:'flash',suppressDefaultSound:true});assert.equal(flashes[0].suppressDefaultSound,true);
 postHUDMessage({source:'test',id:'default',text:'Normal',mode:'flash'});assert.equal(flashes[1].suppressDefaultSound,undefined);
 postHUDMessage({source:'test',id:'queue',text:'Queued',mode:'queued',suppressDefaultSound:true});assert.equal(listHUDMessages()[0].suppressDefaultSound,true);
 assert.throws(()=>postHUDMessage({source:'test',text:'Invalid',suppressDefaultSound:'yes'}),/Invalid HUD/);
 dismissHUDMessage('test','queue');
});
