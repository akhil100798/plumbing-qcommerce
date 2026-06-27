import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';

interface AnalyticsState {
  revenue: number;
  orders: number;
  averageOrderValue: number;
  topProducts: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: AnalyticsState = {
  revenue: 0,
  orders: 0,
  averageOrderValue: 0,
  topProducts: [],
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    fetchAnalyticsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchAnalyticsSuccess: (
      state,
      action: PayloadAction<{ revenue: number; orders: number; averageOrderValue: number; topProducts: Product[] }>
    ) => {
      state.loading = false;
      state.revenue = action.payload.revenue;
      state.orders = action.payload.orders;
      state.averageOrderValue = action.payload.averageOrderValue;
      state.topProducts = action.payload.topProducts;
    },
    fetchAnalyticsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchAnalyticsStart, fetchAnalyticsSuccess, fetchAnalyticsFailure } = analyticsSlice.actions;
export default analyticsSlice.reducer;
