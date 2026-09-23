import {test} from 'node:test';
import assert from 'node:assert/strict';
import {updateTouchesPath} from '../dist/scripts/update-path.js';
test('update paths recognize nested, dotted, mixed and deleted flags without searching values',()=>{
 const path='flags.pneuma-combattools.grapples';
 for(const update of [{'flags.pneuma-combattools.grapples.a':1},{flags:{'pneuma-combattools':{grapples:{a:1}}}},{'flags.pneuma-combattools':{'-=grapples':null}},{'flags.-=pneuma-combattools':null},{flags:null}])assert.equal(updateTouchesPath(update,path),true);
 for(const update of [{name:'grapples'},{flags:{other:{grapples:true}}},{'flags.pneuma-combattools.itemMarkers':{}},{flags:{}}])assert.equal(updateTouchesPath(update,path),false);
});
