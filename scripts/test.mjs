import {readdir,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
// Browser fixtures are separate scripts with optional local browser dependencies.
const files=[];
for(const name of await readdir(new URL('.',import.meta.url))){if(!name.endsWith('.test.mjs'))continue;const source=await readFile(new URL(name,import.meta.url),'utf8');if(source.includes('node:test')&&!source.includes('playwright'))files.push('scripts/'+name);}
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit'});
if(result.error)throw result.error;
process.exitCode=result.status??1;
