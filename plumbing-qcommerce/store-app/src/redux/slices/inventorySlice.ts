import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product, Category } from '../../types';

interface InventoryState {
  totalProducts: number;
  inStock: number;
  lowStock: number;
  categories: Category[];
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  totalProducts: 0,
  inStock: 0,
  lowStock: 0,
  categories: [],
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    fetchInventoryStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchInventorySuccess: (
      state,
      action: PayloadAction<{
        products: Product[];
        categories: Category[];
        totalProducts: number;
        inStock: number;
        lowStock: number;
      }>
    ) => {
      state.loading = false;
      state.products = action.payload.products;
      state.categories = action.payload.categories;
      state.totalProducts = action.payload.totalProducts;
      state.inStock = action.payload.inStock;
      state.lowStock = action.payload.lowStock;
    },
    fetchInventoryFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload;
    },
    addProductInSlice: (state, action: PayloadAction<Product>) => {
      state.products.push(action.payload);
      state.totalProducts += 1;
      if (action.payload.stock > 0) state.inStock += 1;
      if (action.payload.stock <= 5) state.lowStock += 1;
    },
    updateProductInSlice: (state, action: PayloadAction<Product>) => {
      const idx = state.products.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) {
        state.products[idx] = action.payload;
      }
      if (state.selectedProduct?.id === action.payload.id) {
        state.selectedProduct = action.payload;
      }
      // Re-recalculate totals
      state.totalProducts = state.products.length;
      state.inStock = state.products.filter(p => p.stock > 0).length;
      state.lowStock = state.products.filter(p => p.stock <= 5).length;
    }
  },
});

export const {
  fetchInventoryStart,
  fetchInventorySuccess,
  fetchInventoryFailure,
  setSelectedProduct,
  addProductInSlice,
  updateProductInSlice,
} = inventorySlice.actions;
export default inventorySlice.reducer;
