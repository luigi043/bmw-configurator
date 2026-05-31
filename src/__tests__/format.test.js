import { describe, it, expect } from 'vitest';
import { formatCurrency } from '../utils/format.js';

describe('formatCurrency', () => {
  it('formats whole euros without decimals', () => {
    expect(formatCurrency(58900)).toMatch(/58.?900/);
    expect(formatCurrency(58900)).toContain('€');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toContain('0');
  });

  it('returns a dash for invalid input', () => {
    expect(formatCurrency(NaN)).toBe('—');
    expect(formatCurrency('abc')).toBe('—');
  });
});
