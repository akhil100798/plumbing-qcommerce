import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Product, Category } from '../../types';
import { mockProducts, mockCategories } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { storeService } from '../store/storeService';

let localProducts: Product[] = [...mockProducts];

const mapStockToProduct = (stock: any): Product => {
  const product = stock.product || stock;
  return {
    id: product.id,
    sku: product.sku,
    name: product.name,
    description: product.description,
    price: Number(product.price),
    mrp: Number(product.price) * 1.15,
    imageUrl: product.imageUrl,
    categoryId: product.category?.id || product.categoryId || 1,
    categoryName: product.category?.name || product.categoryName || 'General',
    stock: Number(stock.availableQuantity ?? stock.stock ?? 0),
    lowStockThreshold: Number(stock.lowStockThreshold ?? 5),
  };
};

export const inventoryService = {
  getInventory: async (storeId?: number): Promise<{ products: Product[]; categories: Category[] }> => {
    try {
      const inventoryEndpoint = storeId ? ENDPOINTS.store.inventory(storeId) : ENDPOINTS.store.meInventory;
      const stockResponse = await apiClient.get(inventoryEndpoint);
      const products: Product[] = (stockResponse.data || []).map(mapStockToProduct);

      let categories: Category[] = [];
      try {
        const catResponse = await apiClient.get(ENDPOINTS.catalog.categories);
        categories = catResponse.data || [];
      } catch (catErr) {
        console.warn('Category list fetch warning:', catErr);
      }

      localProducts = products;
      return { products, categories };
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store inventory list', e);
        return { products: localProducts, categories: mockCategories };
      }
      throw createBackendUnavailableError('store inventory', e);
    }
  },

  getCatalogProducts: async (): Promise<Product[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.catalog.products);
      return (response.data || []).map((p: any) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        mrp: Number(p.price) * 1.15,
        imageUrl: p.imageUrl,
        categoryId: p.category?.id || p.categoryId || 1,
        categoryName: p.category?.name || p.categoryName || 'General',
        stock: Number(p.stock ?? 0),
        lowStockThreshold: 5,
      }));
    } catch {
      return localProducts;
    }
  },

  addCatalogProductToInventory: async (productId: number, initialQuantity: number = 10, lowStockThreshold: number = 5): Promise<Product> => {
    try {
      const response = await apiClient.post('/stores/me/inventory', {
        productId,
        initialQuantity,
        lowStockThreshold,
      });
      const mapped = mapStockToProduct(response.data);
      localProducts.push(mapped);
      return mapped;
    } catch (e) {
      throw createBackendUnavailableError('adding catalog product to store inventory', e);
    }
  },

  getProductDetails: async (productId: number): Promise<Product> => {
    try {
      const response = await apiClient.get(ENDPOINTS.catalog.productDetails(productId));
      const product = response.data;
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        mrp: Number(product.price) * 1.15,
        imageUrl: product.imageUrl,
        categoryId: product.category?.id || product.categoryId || 1,
        categoryName: product.category?.name || product.categoryName || 'General',
        stock: Number(product.stock ?? 0),
        lowStockThreshold: Number(product.lowStockThreshold ?? 5),
      };
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store product details ${productId}`, e);
        const found = localProducts.find((product) => product.id === productId);
        if (!found) throw new Error('Product not found');
        return found;
      }
      throw createBackendUnavailableError(`product details for ${productId}`, e);
    }
  },

  updateStock: async (productId: number, stockCount: number, storeId?: number): Promise<Product> => {
    try {
      const storeProfile = storeId ? { id: storeId } : await storeService.getCurrentStoreProfile();
      const response = await apiClient.put(
        ENDPOINTS.store.updateStock(storeProfile.id, productId),
        { quantity: stockCount }
      );
      const updatedProduct = mapStockToProduct(response.data);
      const idx = localProducts.findIndex((product) => product.id === productId);
      if (idx !== -1) {
        localProducts[idx] = updatedProduct;
      }
      return updatedProduct;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback(`Store update stock ${productId}`, e);
        const idx = localProducts.findIndex((product) => product.id === productId);
        if (idx !== -1) {
          localProducts[idx] = { ...localProducts[idx], stock: stockCount };
          return localProducts[idx];
        }
        throw new Error('Product not found');
      }
      throw createBackendUnavailableError(`stock update for ${productId}`, e);
    }
  },

  updateLowStockThreshold: async (productId: number, threshold: number, storeId?: number): Promise<Product> => {
    try {
      const storeProfile = storeId ? { id: storeId } : await storeService.getCurrentStoreProfile();
      const response = await apiClient.patch(`/stores/${storeProfile.id}/inventory/${productId}/threshold`, {
        lowStockThreshold: threshold,
      });
      return mapStockToProduct(response.data);
    } catch (e) {
      throw createBackendUnavailableError(`low stock threshold update for ${productId}`, e);
    }
  },

  getLowStock: async (): Promise<Product[]> => {
    try {
      const inventory = await inventoryService.getInventory();
      return inventory.products.filter((product) => product.stock <= (product.lowStockThreshold ?? 5));
    } catch (e) {
      return localProducts.filter((product) => product.stock <= (product.lowStockThreshold ?? 5));
    }
  },

  getStoreInventory: async (storeId?: number): Promise<Product[]> => {
    const inventory = await inventoryService.getInventory(storeId);
    return inventory.products;
  }
};
