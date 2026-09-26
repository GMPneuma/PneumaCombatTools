import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
const {chromium}=await import(process.env.PNEUMA_PLAYWRIGHT_MODULE||'playwright');
const markdown=await readFile('docs/flow-map.md','utf8');
const blocks=[];let heading='Flow';
for(const match of markdown.matchAll(/^## (.+)$|~~~mermaid\n([\s\S]*?)\n~~~/gm)){
 if(match[1])heading=match[1];else blocks.push({heading,source:match[2]});
}
if(!blocks.length)throw Error('No Mermaid diagrams found');
const browser=await chromium.launch({channel:'msedge',headless:true});
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.setContent('<main></main>');
 await page.addScriptTag({path:process.env.PNEUMA_MERMAID_SOURCE||resolve(tmpdir(),'pct-mermaid-10.9.3.min.js')});
 await page.evaluate(()=>mermaid.initialize({startOnLoad:false,securityLevel:'strict',theme:'neutral',flowchart:{htmlLabels:true,useMaxWidth:false}}));
 const rendered=[];
 for(const [index,block] of blocks.entries()){
  const svg=await page.evaluate(async({source,index})=>{await mermaid.parse(source);return (await mermaid.render('flow'+index,source)).svg;},{...block,index});
  rendered.push(`<section id="flow-${index}"><h2>${escape(block.heading)}</h2><div class="diagram">${svg}</div></section>`);
 }
 const hash=createHash('sha256').update(markdown).digest('hex');
 const html=`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="flow-map-sha256" content="${hash}"><title>Combat Tools flow diagrams</title><style>body{font:16px system-ui;background:#eee;color:#222;margin:24px}h1{font-size:25px}section{background:#fff;padding:16px;margin:20px 0;border:1px solid #bbb}.diagram{overflow:auto}svg{display:block}nav{display:flex;gap:10px;flex-wrap:wrap}a{color:#922}</style><h1>Combat Tools — current flow diagrams</h1><p>Generated from flow-map.md with Mermaid 10.9.3. Source review: 2026-09-26. <a href="flow-map.md">Controls and storage reference</a> · <a href="chat-card-audit-2026-09-26.md">Audit findings</a></p><nav>${blocks.map((b,i)=>`<a href="#flow-${i}">${escape(b.heading)}</a>`).join('')}</nav>${rendered.join('\n')}</html>`;
 await writeFile('docs/flow-diagrams.html',html);
 await page.setContent(html);
 if(await page.locator('svg').count()!==blocks.length)throw Error('Missing rendered diagram');
 await page.screenshot({path:resolve(tmpdir(),'pct-flow-diagrams-audit.png')});
 console.log(`Validated and rendered ${blocks.length} Mermaid diagrams; source SHA-256 ${hash}`);
} finally {await browser.close();}
