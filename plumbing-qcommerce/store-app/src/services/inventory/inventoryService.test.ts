import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  apiClient: {
    get: mocks.get,
    post: mocks.post,
    put: mocks.put,
  },
}));

import { inventoryService } from './inventoryService';
import { ENDPOINTS } from '../api/endpoints';

describe('store inventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches inventory and maps stock and category lists correctly', async () => {
    const mockStockData = [
      {
        availableQuantity: 42,
        product: {
          id: 10,
          sku: 'SKU-PIPE-10',
          name: 'PVC Pipe 1 inch',
          description: 'Durable PVC pipe',
          price: 150,
          imageUrl: 'https://example.com/pipe.jpg',
          category: { id: 2, name: 'Pipes' },
        },
      },
    ];
    const mockCategoryData = [
      { id: 1, name: 'Fittings' },
      { id: 2, name: 'Pipes' },
    ];

    mocks.get.mockImplementation((url: string) => {
      if (url === ENDPOINTS.store.meInventory) {
        return Promise.resolve({ data: mockStockData });
      }
      if (url === ENDPOINTS.catalog.categories) {
        return Promise.resolve({ data: mockCategoryData });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    const result = await inventoryService.getInventory();

    expect(result.products).toHaveLength(1);
    expect(result.products[0]).toMatchObject({
      id: 10,
      sku: 'SKU-PIPE-10',
      name: 'PVC Pipe 1 inch',
      price: 150,
      categoryName: 'Pipes',
      stock: 42,
    });
    expect(result.categories).toHaveLength(2);
  });

  it('uses storeId specific endpoint when storeId is provided', async () => {
    mocks.get.mockResolvedValue({ data: [] });

    await inventoryService.getInventory(5);

    expect(mocks.get).toHaveBeenCalledWith(ENDPOINTS.store.inventory(5));
    expect(mocks.get).toHaveBeenCalledWith(ENDPOINTS.catalog.categories);
  });

  it('fetches product details and formats Product model', async () => {
    const mockProduct = {
      id: 77,
      sku: 'SKU-VALVE-77',
      name: 'Brass Ball Valve',
      description: 'Heavy duty valve',
      price: 320,
      imageUrl: 'https://example.com/valve.jpg',
      category: { id: 3, name: 'Valves' },
      stock: 15,
    };

    mocks.get.mockResolvedValueOnce({ data: mockProduct });

    const product = await inventoryService.getProductDetails(77);

    expect(mocks.get).toHaveBeenCalledWith(ENDPOINTS.catalog.productDetails(77));
    expect(product).toMatchObject({
      id: 77,
      name: 'Brass Ball Valve',
      price: 320,
      stock: 15,
      categoryName: 'Valves',
    });
  });
});
