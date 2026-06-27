import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CartState {
  items: { [productId: number]: number };
  storeId: number | null;
}

const initialState: CartState = {
  items: {},
  storeId: 1, // Default storeId
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<number>) => {
      const productId = action.payload;
      state.items[productId] = (state.items[productId] || 0) + 1;
    },
    removeFromCart: (state, action: PayloadAction<number>) => {
      const productId = action.payload;
      const currentQty = state.items[productId] || 0;
      if (currentQty <= 1) {
        delete state.items[productId];
      } else {
        state.items[productId] = currentQty - 1;
      }
    },
    clearCart: (state) => {
      state.items = {};
    },
    setStoreId: (state, action: PayloadAction<number>) => {
      state.storeId = action.payload;
    },
  },
});

export const { addToCart, removeFromCart, clearCart, setStoreId } = cartSlice.actions;
export default cartSlice.reducer;
