import { describe, it, expect, beforeEach } from 'vitest';
import { useConfigurator } from '../store/useConfigurator.js';
import { DEFAULTS, MODELS } from '../data/carConfig.js';

const get = () => useConfigurator.getState();

describe('useConfigurator store', () => {
  beforeEach(() => get().reset());

  it('starts from defaults', () => {
    expect(get().paintId).toBe(DEFAULTS.paintId);
    expect(get().price.total).toBe(MODELS[0].basePrice);
  });

  it('updates paint and recomputes price', () => {
    get().setPaint('frozen-grey');
    expect(get().paintId).toBe('frozen-grey');
    expect(get().price.total).toBe(MODELS[0].basePrice + 2400);
  });

  it('toggles a package on and off', () => {
    get().togglePackage('m-sport');
    expect(get().packageIds).toContain('m-sport');
    expect(get().price.total).toBe(MODELS[0].basePrice + 3900);

    get().togglePackage('m-sport');
    expect(get().packageIds).not.toContain('m-sport');
    expect(get().price.total).toBe(MODELS[0].basePrice);
  });

  it('reset returns to defaults', () => {
    get().setWheel('forged-21');
    get().togglePackage('tech-pack');
    get().reset();
    expect(get().wheelId).toBe(DEFAULTS.wheelId);
    expect(get().packageIds).toEqual([]);
  });
});
