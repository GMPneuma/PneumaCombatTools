import {mkdirSync,writeFileSync} from 'node:fs';
// Original procedural notification sounds, mono PCM. Deterministic noise and smooth envelopes.
const rate=44100;let seed=937;
const noise=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/2147483648-1;};
function wav(name,duration,sample){const length=Math.ceil(duration*rate),buffer=Buffer.alloc(44+length*2);buffer.write('RIFF');buffer.writeUInt32LE(buffer.length-8,4);buffer.write('WAVEfmt ',8);buffer.writeUInt32LE(16,16);buffer.writeUInt16LE(1,20);buffer.writeUInt16LE(1,22);buffer.writeUInt32LE(rate,24);buffer.writeUInt32LE(rate*2,28);buffer.writeUInt16LE(2,32);buffer.writeUInt16LE(16,34);buffer.write('data',36);buffer.writeUInt32LE(length*2,40);for(let i=0;i<length;i++){const t=i/rate;const fade=Math.min(1,t/.005,(duration-t)/.02);buffer.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample(t)*fade))*32767),44+i*2);}writeFileSync('src/sounds/'+name+'.wav',buffer);}
mkdirSync('src/sounds',{recursive:true});
wav('message-alert',.65,t=>{const pulse=(start)=>{const x=t-start;if(x<0||x>.18)return 0;return Math.sin(Math.PI*x/.18)**2*(.2*Math.sin(2*Math.PI*145*x)+.06*Math.sin(2*Math.PI*290*x)+.018*noise());};const x=t-.43;return pulse(.02)+pulse(.24)+(x>0&&x<.12?.055*Math.sin(Math.PI*x/.12)**2*Math.sin(2*Math.PI*920*x):0);});
wav('your-turn',.48,t=>{const envelope=(1-Math.exp(-t*900))*Math.exp(-t*15);return envelope*(.53*Math.sin(2*Math.PI*(95*t+1.1*(1-Math.exp(-t*35))))+.15*Math.sin(2*Math.PI*190*t)*Math.exp(-t*12)+.12*noise()*Math.exp(-t*65));});
console.log('Generated message-alert.wav and your-turn.wav');
