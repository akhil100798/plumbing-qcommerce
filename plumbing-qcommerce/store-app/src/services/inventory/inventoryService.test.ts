import { beforeEach, describe, expect, it, vi } from 'vitest';

const putMock = vi.fn();
const getCurrentStoreProfileMock = vi.fn();

vi.mock('../api/axiosClient', () => ({
  apiClient: {
    put: putMock,
  },
}));

vi.mock('../store/storeService', () => ({
  storeService: {
    getCurrentStoreProfile: getCurrentStoreProfileMock,
  },
}));

describe('inventoryService.updateStock', () => {
  beforeEach(() => {
    putMock.mockReset();
    getCurrentStoreProfileMock.mockReset();
    putMock.mockResolvedValue({
      data: {
        product: { id: 6, sku: 'QA-PIPE', name: 'QA Pipe', price: 10 },
        availableQuantity: 12,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    });
    getCurrentStoreProfileMock.mockResolvedValue({ id: 21 });
  });

  it('maps explicit product, stock, and store fields to the backend contract', async () => {
    const { inventoryService } = await import('./inventoryService');

    await inventoryService.updateStock({ productId: 6, stockCount: 12, storeId: 21 });

    expect(putMock).toHaveBeenCalledWith('/stores/21/inventory/6', { quantity: 12 });
    expect(getCurrentStoreProfileMock).not.toHaveBeenCalled();
  });

  it('resolves the store through the shared profile when storeId is omitted', async () => {
    const { inventoryService } = await import('./inventoryService');

    await inventoryService.updateStock({ productId: 6, stockCount: 0 });

    expect(getCurrentStoreProfileMock).toHaveBeenCalledOnce();
    expect(putMock).toHaveBeenCalledWith('/stores/21/inventory/6', { quantity: 0 });
  });

  it('preserves the persisted low-stock threshold in the mapped update response', async () => {
    putMock.mockResolvedValueOnce({
      data: {
        product: { id: 6, sku: 'QA-PIPE', name: 'QA Pipe', price: 10 },
        availableQuantity: 2,
        reservedQuantity: 0,
        lowStockThreshold: 2,
      },
    });

    const { inventoryService } = await import('./inventoryService');
    const updated = await inventoryService.updateStock({ productId: 6, stockCount: 2, storeId: 21 });

    expect(updated.stock).toBe(2);
    expect(updated.lowStockThreshold).toBe(2);
  });
});
