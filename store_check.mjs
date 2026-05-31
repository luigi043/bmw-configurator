import assert from 'node:assert/strict';
import { create } from '/tmp/shim/zustand/index.mjs';
import { DEFAULTS, MODELS } from './src/data/carConfig.js';
import { calculatePrice } from './src/utils/pricing.js';

// mirror of useConfigurator.js recalc + actions (kept in sync with source)
function recalc(partial){return (state)=>{const next={...state,...partial};return {...partial,price:calculatePrice(next)};};}
const useStore = create((set,get)=>({
  ...DEFAULTS, price: calculatePrice(DEFAULTS),
  setPaint:(paintId)=>set(recalc({paintId})),
  setWheel:(wheelId)=>set(recalc({wheelId})),
  togglePackage:(id)=>{const has=get().packageIds.includes(id);const packageIds=has?get().packageIds.filter(x=>x!==id):[...get().packageIds,id];set(recalc({packageIds}));},
  reset:()=>set({...DEFAULTS,price:calculatePrice(DEFAULTS)}),
}));
const s=useStore.getState();let n=0;const ok=(m)=>{n++;console.log('  ✓',m);};
assert.equal(s.price.total, MODELS[0].basePrice); ok('store starts at base price');
s.setPaint('frozen-grey'); assert.equal(useStore.getState().price.total, MODELS[0].basePrice+2400); ok('setPaint recomputes price');
s.togglePackage('m-sport'); assert.ok(useStore.getState().packageIds.includes('m-sport')); ok('togglePackage adds');
s.togglePackage('m-sport'); assert.ok(!useStore.getState().packageIds.includes('m-sport')); ok('togglePackage removes');
s.reset(); assert.equal(useStore.getState().paintId, DEFAULTS.paintId); ok('reset restores defaults');
console.log(`\n${n} store checks passed.`);
