const formatter = new Intl.NumberFormat('en-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

/** Format a number as a whole-euro currency string, e.g. 58900 -> "€58,900". */
export function formatCurrency(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return formatter.format(value);
}
