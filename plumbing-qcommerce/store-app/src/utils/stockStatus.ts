export type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'IN_STOCK';

type StockRecord = {
  stock?: number | string | null;
  availableQuantity?: number | string | null;
  quantity?: number | string | null;
  lowStockThreshold?: number | string | null;
};

const toFiniteNumber = (value: number | string | null | undefined, fallback: number) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getAvailableStock = (item: StockRecord): number =>
  toFiniteNumber(item.stock ?? item.availableQuantity ?? item.quantity, 0);

export const getLowStockThreshold = (item: StockRecord): number =>
  Math.max(0, toFiniteNumber(item.lowStockThreshold, 5));

export const getStockStatus = (item: StockRecord): StockStatus => {
  const available = getAvailableStock(item);
  if (available <= 0) return 'OUT_OF_STOCK';
  return available <= getLowStockThreshold(item) ? 'LOW_STOCK' : 'IN_STOCK';
};

export const isLowStock = (item: StockRecord): boolean =>
  getStockStatus(item) === 'LOW_STOCK';
