import { describe, expect, it } from 'vitest';

import { getStockStatus, isLowStock } from './stockStatus';

describe('stock status', () => {
  it('uses the persisted threshold and distinguishes out-of-stock', () => {
    const expected = new Map([
      [0, 'OUT_OF_STOCK'],
      [1, 'LOW_STOCK'],
      [4, 'LOW_STOCK'],
      [5, 'LOW_STOCK'],
      [6, 'IN_STOCK'],
      [20, 'IN_STOCK'],
    ]);

    for (const [stock, status] of expected) {
      expect(getStockStatus({ stock, lowStockThreshold: 5 })).toBe(status);
    }
  });

  it('supports custom thresholds including a zero threshold', () => {
    expect(getStockStatus({ stock: 0, lowStockThreshold: 2 })).toBe('OUT_OF_STOCK');
    expect(getStockStatus({ stock: 1, lowStockThreshold: 2 })).toBe('LOW_STOCK');
    expect(getStockStatus({ stock: 2, lowStockThreshold: 2 })).toBe('LOW_STOCK');
    expect(getStockStatus({ stock: 3, lowStockThreshold: 2 })).toBe('IN_STOCK');
    expect(getStockStatus({ stock: 1, lowStockThreshold: 0 })).toBe('IN_STOCK');
    expect(isLowStock({ stock: 0, lowStockThreshold: 5 })).toBe(false);
  });

  it('falls back to the legacy quantity fields only when mapped stock is absent', () => {
    expect(getStockStatus({ availableQuantity: 2, lowStockThreshold: 5 })).toBe('LOW_STOCK');
    expect(getStockStatus({ quantity: 8, lowStockThreshold: 5 })).toBe('IN_STOCK');
  });
});
