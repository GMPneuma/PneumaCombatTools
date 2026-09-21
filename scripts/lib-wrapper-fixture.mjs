// Test double for registration and chaining; not a substitute for live libWrapper validation.
export function installMockLibWrapper() {
 const calls=[];
 const registered=new WeakMap();
 globalThis.libWrapper={register(module,path,fn,type){
  const keys=path.split('.'),method=keys.pop();let owner=globalThis;
  for(const key of keys)owner=owner[key];
  const targets=registered.get(owner)??new Set();
  const registration=module+':'+method;
  if(targets.has(registration))throw Error(`A wrapper for '${path}' has already been registered by module ${module}.`);
  const original=owner[method];
  if(typeof original!=="function")throw Error('Missing target');
  targets.add(registration);registered.set(owner,targets);
  owner[method]=function(...args){return fn.call(this,original.bind(this),...args);};
  calls.push({module,path,type});return calls.length;
 }};
 return calls;
}
