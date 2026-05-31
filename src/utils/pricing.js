import { MODELS, PAINTS, WHEELS, TRIMS, PACKAGES } from '../data/carConfig.js';

const byId = (list, id) => list.find((item) => item.id === id);

/**
 * Pure pricing function — given a configuration object it returns a full
 * breakdown plus the grand total. Kept side-effect free so it is trivial
 * to unit test and reuse on a server if needed.
 */
export function calculatePrice(config) {
  const model = byId(MODELS, config.modelId);
  const paint = byId(PAINTS, config.paintId);
  const wheel = byId(WHEELS, config.wheelId);
  const trim = byId(TRIMS, config.trimId);
  const packages = (config.packageIds ?? [])
    .map((id) => byId(PACKAGES, id))
    .filter(Boolean);

  if (!model || !paint || !wheel || !trim) {
    throw new Error('Invalid configuration: unknown option id.');
  }

  const lineItems = [
    { label: model.name, amount: model.basePrice },
    { label: paint.name, amount: paint.price },
    { label: wheel.name, amount: wheel.price },
    { label: trim.name, amount: trim.price },
    ...packages.map((p) => ({ label: p.name, amount: p.price })),
  ];

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);
  return { lineItems, total };
}
