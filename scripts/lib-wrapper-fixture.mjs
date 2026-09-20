// Test double for registration and chaining; not a substitute for live libWrapper validation.
export function installMockLibWrapper() {
 const calls=[];
 globalThis.libWrapper={register(module,path,fn,type){
  const keys=path.split('.'),method=keys.pop();let owner=globalThis;
  for(const key of keys)owner=owner[key];
  const original=owner[method];
  if(typeof original!=="function")throw Error('Missing target');
  owner[method]=function(...args){return fn.call(this,original.bind(this),...args);};
  calls.push({module,path,type});return calls.length;
 }};
 return calls;
}
