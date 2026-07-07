import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Product, Category } from '../../types';
import { mockProducts, mockCategories } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  createUnsupportedBackendError,
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
  };
};

export const inventoryService = {
  getInventory: async (storeId?: number): Promise<{ products: Product[]; categories: Category[] }> => {
    try {
      const inventoryEndpoint = storeId ? ENDPOINTS.store.inventory(storeId) : ENDPOINTS.store.meInventory;
      const [stockResponse, catResponse] = await Promise.all([
        apiClient.get(inventoryEndpoint),
        apiClient.get(ENDPOINTS.catalog.categories),
      ]);

      const products: Product[] = (stockResponse.data || []).map(mapStockToProduct);
      const categories: Category[] = catResponse.data || [];
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

  addProduct: async (product: Partial<Product>): Promise<Product> => {
    if (!canUseDevMockFallbacks()) {
      throw createUnsupportedBackendError('Catalog product creation');
    }

    warnUsingDevMockFallback('Store add product', new Error('Catalog product creation'));
    const newProduct: Product = {
      id: Date.now(),
      sku: product.sku || `SKU-${Math.floor(Math.random() * 1000)}`,
      name: product.name || 'New Product',
      description: product.description || '',
      price: product.price || 0,
      mrp: product.mrp || 0,
      discount: product.discount || 0,
      imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1595206133361-b1fe343e5e23?q=80&w=200',
      categoryId: product.categoryId || 1,
      categoryName: product.categoryName || 'Pipes',
      stock: product.stock || 0,
      brand: product.brand || 'General',
      gst: product.gst || 18,
    };
    localProducts.push(newProduct);
    return newProduct;
  },

  updateProduct: async (productId: number, product: Partial<Product>): Promise<Product> => {
    if (!canUseDevMockFallbacks()) {
      throw createUnsupportedBackendError('Catalog product updates');
    }

    warnUsingDevMockFallback(`Store update product ${productId}`, new Error('Catalog product updates'));
    const idx = localProducts.findIndex((existing) => existing.id === productId);
    if (idx !== -1) {
      localProducts[idx] = { ...localProducts[idx], ...product };
      return localProducts[idx];
    }
    throw new Error('Product not found');
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

  getLowStock: async (): Promise<Product[]> => {
    try {
      const inventory = await inventoryService.getInventory();
      return inventory.products.filter((product) => product.stock <= 5);
    } catch (e) {
      console.warn('Inventory low-stock lookup failed:', e);
      return localProducts.filter((product) => product.stock <= 5);
    }
  }
};
