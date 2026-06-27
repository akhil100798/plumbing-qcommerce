import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Product, Category } from '../../types';
import { mockProducts, mockCategories } from '../../mocks';
import { store } from '../../redux/store';

// In-memory local catalog cache for mocked operations
let localProducts: Product[] = [...mockProducts];

export const inventoryService = {
  getInventory: async (storeId: number): Promise<{ products: Product[]; categories: Category[] }> => {
    try {
      // Fetch store inventory stock list
      const response = await apiClient.get(ENDPOINTS.store.inventory(storeId));
      const stocks: any[] = response.data || [];

      // Fetch general catalog categories
      const catResponse = await apiClient.get(ENDPOINTS.catalog.categories);
      const categories: Category[] = catResponse.data || [];

      // Join stock items with local products
      const products: Product[] = stocks.map((st: any) => {
        const p = st.product;
        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          description: p.description,
          price: p.price,
          mrp: p.price * 1.15, // estimated MRP
          imageUrl: p.imageUrl,
          categoryId: p.category?.id || 1,
          categoryName: p.category?.name || 'PVC Pipes',
          stock: st.quantity, // actual inventory quantity
        };
      });

      return { products, categories: categories.length > 0 ? categories : mockCategories };
    } catch (e) {
      console.warn('API getInventory failed, using mock data:', e);
      return { products: localProducts, categories: mockCategories };
    }
  },

  getProductDetails: async (productId: number): Promise<Product> => {
    try {
      const response = await apiClient.get(ENDPOINTS.catalog.productDetails(productId));
      const p = response.data;
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        mrp: p.price * 1.15,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        categoryName: p.categoryName || 'General',
        stock: 10, // dummy stock
      };
    } catch (e) {
      console.warn(`API getProductDetails ${productId} failed, using mock:`, e);
      const found = localProducts.find(p => p.id === productId);
      if (!found) throw new Error('Product not found');
      return found;
    }
  },

  // TODO: Implement backend catalog addition route POST /api/v1/catalog/products
  addProduct: async (product: Partial<Product>): Promise<Product> => {
    console.warn('addProduct API missing. Fallback to mock.');
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
      categoryName: product.categoryName || 'PVC Pipes',
      stock: product.stock || 0,
      brand: product.brand || 'General',
      gst: product.gst || 18,
    };
    localProducts.push(newProduct);
    return newProduct;
  },

  // TODO: Implement backend catalog edit route PUT /api/v1/catalog/products/{id}
  updateProduct: async (productId: number, product: Partial<Product>): Promise<Product> => {
    console.warn(`updateProduct ${productId} API missing. Fallback to mock.`);
    const idx = localProducts.findIndex(p => p.id === productId);
    if (idx !== -1) {
      localProducts[idx] = { ...localProducts[idx], ...product };
      return localProducts[idx];
    }
    throw new Error('Product not found');
  },

  updateStock: async (productId: number, stockCount: number, storeId?: number): Promise<Product> => {
    try {
      const sId = storeId || store.getState().profile.storeProfile?.id || 123;
      const response = await apiClient.put(
        ENDPOINTS.store.updateStock(sId, productId), 
        { quantity: stockCount }
      );
      const st = response.data;
      const p = st.product;
      
      const updatedProduct: Product = {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        price: p.price,
        mrp: p.price * 1.15,
        imageUrl: p.imageUrl,
        categoryId: p.category?.id || 1,
        categoryName: p.category?.name || 'General',
        stock: st.availableQuantity,
      };

      // Also update local cache if we fall back
      const idx = localProducts.findIndex(lp => lp.id === productId);
      if (idx !== -1) {
        localProducts[idx] = updatedProduct;
      }
      return updatedProduct;
    } catch (e) {
      console.warn(`API updateStock for product ${productId} failed, fallback to mock:`, e);
      const idx = localProducts.findIndex(p => p.id === productId);
      if (idx !== -1) {
        localProducts[idx] = { ...localProducts[idx], stock: stockCount };
        return localProducts[idx];
      }
      throw new Error('Product not found');
    }
  },

  getLowStock: async (): Promise<Product[]> => {
    try {
      // Can call the AI forecast to query low stocks count
      const response = await apiClient.get(ENDPOINTS.dashboard.forecast);
      // If we got demand details, we can list low stock
      console.log('AI forecast details:', response.data);
      return localProducts.filter(p => p.stock <= 5);
    } catch (e) {
      console.warn('API getLowStock failed, fallback to filter logic:', e);
      return localProducts.filter(p => p.stock <= 5);
    }
  }
};
