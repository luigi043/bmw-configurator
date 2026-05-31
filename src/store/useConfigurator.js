import { create } from 'zustand';
import { DEFAULTS } from '../data/carConfig.js';
import { calculatePrice } from '../utils/pricing.js';

/**
 * Global configurator state. Components subscribe with selectors so a paint
 * change only re-renders the bits that care about paint. The derived price
 * is recomputed on every mutation and cached in the store.
 */
export const useConfigurator = create((set, get) => ({
  ...DEFAULTS,
  price: calculatePrice(DEFAULTS),

  setModel: (modelId) => set(recalc({ modelId })),
  setPaint: (paintId) => set(recalc({ paintId })),
  setWheel: (wheelId) => set(recalc({ wheelId })),
  setTrim: (trimId) => set(recalc({ trimId })),

  togglePackage: (packageId) => {
    const has = get().packageIds.includes(packageId);
    const packageIds = has
      ? get().packageIds.filter((id) => id !== packageId)
      : [...get().packageIds, packageId];
    set(recalc({ packageIds }));
  },

  reset: () => set({ ...DEFAULTS, price: calculatePrice(DEFAULTS) }),
}));

// Helper that merges a partial change and recomputes the derived price.
// Returns a zustand updater so callers stay declarative.
function recalc(partial) {
  return (state) => {
    const next = { ...state, ...partial };
    return { ...partial, price: calculatePrice(next) };
  };
}
