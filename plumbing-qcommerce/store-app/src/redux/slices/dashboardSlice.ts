import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface OrderSummary {
  newCount: number;
  packingCount: number;
  readyCount: number;
  deliveredCount: number;
}

interface DashboardState {
  todayRevenue: number;
  orderSummary: OrderSummary;
  lowStockCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  todayRevenue: 0,
  orderSummary: {
    newCount: 0,
    packingCount: 0,
    readyCount: 0,
    deliveredCount: 0,
  },
  lowStockCount: 0,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    fetchDashboardStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchDashboardSuccess: (
      state,
      action: PayloadAction<{ todayRevenue: number; orderSummary: OrderSummary; lowStockCount: number }>
    ) => {
      state.loading = false;
      state.todayRevenue = action.payload.todayRevenue;
      state.orderSummary = action.payload.orderSummary;
      state.lowStockCount = action.payload.lowStockCount;
    },
    fetchDashboardFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const { fetchDashboardStart, fetchDashboardSuccess, fetchDashboardFailure } = dashboardSlice.actions;
export default dashboardSlice.reducer;
