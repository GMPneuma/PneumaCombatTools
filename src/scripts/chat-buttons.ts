/** Shared presentation for Combat Tools chat controls only. Native roll links stay untouched. */
const controls=[
  ".pneuma-defense-controls button", ".pneuma-result-damage", ".pneuma-apply-damage", ".pneuma-apply-critical",
  ".pneuma-damage-status-slot", ".pneuma-damage-recovery-controls button", ".pneuma-quickhack-actions button",
  ".pneuma-grapple-controls button", "[data-aoe-action]", "[data-instant-action]", "[data-emp-select]",
  "[data-ribs-apply]", ".pneuma-manual-controls button", ".pneuma-group-action button", ".pneuma-half-armor", ".pneuma-interact-armor"
].join(",");
const observed=new WeakSet<HTMLElement>();
const clicked=new WeakSet<HTMLElement>();
const disabled=(node:HTMLElement)=>node.matches(":disabled,[aria-disabled=\"true\"]");
function decorate(node:HTMLElement):void {
  node.classList.add("pneuma-chat-button");
  const text=node.textContent?.trim()??"",action=node.dataset.aoeAction??node.dataset.instantAction??node.dataset.quickhackAction??"";
  const gmOnly=node.dataset.gmOnly==="true"
    || !!node.dataset.aoeAction && ["show","removeSmoke","scatter","hit","miss","exclude","forcehit","add","reset","damageReset","damageResolved","effectsResolved"].includes(action)
    || !!node.dataset.instantAction && ["skip","reset","review"].includes(action);
  node.dataset.chatRole=gmOnly?"gm":"player";
  const iconOnly=!text || node.classList.contains("pneuma-damage-status-slot");
  node.classList.toggle("pneuma-chat-icon",iconOnly);
  const recovery=["reset","damageReset","damageResolved","effectsResolved","review","forcehit","exclude","skip"].includes(action)
    || node.closest(".pneuma-damage-recovery-controls") || /^(GM:|Release|Retry|Finish payment|Finish roll|Mark resolved)/i.test(text);
  const cancel=node.classList.contains("pneuma-cancel-exchange")||/^End \(GM\)/.test(text)||action==="removeSmoke";
  node.dataset.chatKind=node.matches(".pneuma-half-armor, .pneuma-interact-armor")?"toggle":cancel?"cancel":recovery?"recovery":"action";
  if(!iconOnly&&node.dataset.chatKind!=="toggle"&&!node.querySelector("i,img,svg")) {
    const icon=document.createElement("i");icon.setAttribute("aria-hidden","true");
    const name=cancel?"fa-xmark":recovery?"fa-wrench":/evade/i.test(text)?"fa-person-running":/apply.*damage|apply to/i.test(text)?"fa-bolt":/damage/i.test(text)?"fa-droplet":/resist/i.test(text)?"fa-shield-halved":/roll/i.test(text)?"fa-dice":/injury/i.test(text)?"fa-heart-crack":/choose/i.test(text)?"fa-list-check":"fa-arrow-right";
    icon.className="fas "+name+" pneuma-chat-action-icon";node.prepend(icon);
  }
  const busy=clicked.has(node)&&disabled(node);
  node.classList.toggle("pneuma-chat-busy",busy);
  if(busy)node.setAttribute("aria-busy","true");else {node.removeAttribute("aria-busy");clicked.delete(node);}
  const completed=!busy&&disabled(node)&&(node.matches('.pneuma-apply-damage[data-pneuma-damage-target="recorded"]')
    || node.matches('[data-aoe-action="apply"], [data-emp-select]') && /applied/i.test(text+" "+node.title));
  node.classList.toggle("pneuma-chat-complete",completed);
  if(completed&&iconOnly){node.title="Applied";node.setAttribute("aria-label","Applied");}
  if(!node.title&&node.getAttribute("aria-label"))node.title=node.getAttribute("aria-label")!;
}
export function styleChatButtons(root:HTMLElement):void {
  const refresh=()=>{for(const node of Array.from(root.querySelectorAll<HTMLElement>(controls)))decorate(node);};
  refresh();if(observed.has(root))return;observed.add(root);
  // Some workflows append their permission-specific controls after awaiting actor lookup.
  const observer=new MutationObserver(()=>{observer.disconnect();refresh();watch();});
  const watch=()=>observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["disabled","aria-disabled","aria-pressed","title","data-gm-only"]});
  root.addEventListener("click",event=>{
    const node=(event.target as Element).closest<HTMLElement>(controls);
    if(node&&!disabled(node)){clicked.add(node);setTimeout(()=>{observer.disconnect();decorate(node);watch();},0);}
  },true);
  watch();
}
export function registerChatButtons():void {
  Hooks.on("renderChatMessage",(_message:ChatMessage,html:JQuery)=>{if(html[0])styleChatButtons(html[0]);});
}
