import assert from 'node:assert/strict';
import { calculatePrice } from './src/utils/pricing.js';
import { formatCurrency } from './src/utils/format.js';
import { DEFAULTS, MODELS, PAINTS, WHEELS, TRIMS, PACKAGES } from './src/data/carConfig.js';

let n = 0; const ok = (m) => { n++; console.log('  ✓', m); };

// pricing
assert.equal(calculatePrice(DEFAULTS).total, MODELS[0].basePrice); ok('default total = base price');
assert.equal(calculatePrice({ ...DEFAULTS, paintId: 'frozen-grey' }).total, MODELS[0].basePrice + 2400); ok('matte paint adds 2400');
const multi = calculatePrice({ ...DEFAULTS, packageIds: ['m-sport', 'tech-pack'] });
assert.equal(multi.total, MODELS[0].basePrice + 3900 + 2300); ok('two packages sum correctly');
assert.equal(multi.lineItems.length, 6); ok('line items count = 6');
assert.throws(() => calculatePrice({ ...DEFAULTS, paintId: 'nope' })); ok('throws on bad id');

// format
assert.ok(formatCurrency(58900).includes('€')); ok('currency has euro sign');
assert.equal(formatCurrency(NaN), '—'); ok('NaN -> dash');
assert.equal(formatCurrency('abc'), '—'); ok('string -> dash');

// data integrity: no duplicate ids, all defaults resolve
for (const [name, list] of [['PAINTS',PAINTS],['WHEELS',WHEELS],['TRIMS',TRIMS],['PACKAGES',PACKAGES],['MODELS',MODELS]]) {
  const ids = list.map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, `${name} has unique ids`);
}
ok('all option lists have unique ids');
assert.ok(PAINTS.some(p => p.id === DEFAULTS.paintId)); 
assert.ok(WHEELS.some(w => w.id === DEFAULTS.wheelId));
assert.ok(TRIMS.some(t => t.id === DEFAULTS.trimId));
assert.ok(MODELS.some(m => m.id === DEFAULTS.modelId)); ok('all DEFAULTS resolve to real options');

console.log(`\n${n} checks passed.`);
