import { describe, it, expect } from 'vitest';
import { calculatePrice } from '../utils/pricing.js';
import { DEFAULTS, MODELS, PAINTS } from '../data/carConfig.js';

describe('calculatePrice', () => {
  it('returns the base model price for the default configuration', () => {
    const { total } = calculatePrice(DEFAULTS);
    expect(total).toBe(MODELS[0].basePrice); // all default options are €0
  });

  it('adds paid options to the total', () => {
    const config = { ...DEFAULTS, paintId: 'frozen-grey' }; // matte = +2400
    const paint = PAINTS.find((p) => p.id === 'frozen-grey');
    const { total } = calculatePrice(config);
    expect(total).toBe(MODELS[0].basePrice + paint.price);
  });

  it('sums multiple selected packages', () => {
    const config = { ...DEFAULTS, packageIds: ['m-sport', 'tech-pack'] };
    const { total, lineItems } = calculatePrice(config);
    expect(total).toBe(MODELS[0].basePrice + 3900 + 2300);
    expect(lineItems).toHaveLength(6); // model, paint, wheel, trim + 2 packages
  });

  it('throws on an unknown option id', () => {
    expect(() => calculatePrice({ ...DEFAULTS, paintId: 'nope' })).toThrow();
  });
});
