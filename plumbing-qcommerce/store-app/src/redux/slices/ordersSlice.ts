import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '../../types';

interface OrdersState {
  newOrders: Order[];
  packingOrders: Order[];
  readyOrders: Order[];
  completedOrders: Order[];
  selectedOrder: Order | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  newOrders: [],
  packingOrders: [],
  readyOrders: [],
  completedOrders: [],
  selectedOrder: null,
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    fetchOrdersStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchOrdersSuccess: (
      state,
      action: PayloadAction<{
        newOrders: Order[];
        packingOrders: Order[];
        readyOrders: Order[];
        completedOrders: Order[];
      }>
    ) => {
      state.loading = false;
      state.newOrders = action.payload.newOrders;
      state.packingOrders = action.payload.packingOrders;
      state.readyOrders = action.payload.readyOrders;
      state.completedOrders = action.payload.completedOrders;
    },
    fetchOrdersFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setSelectedOrder: (state, action: PayloadAction<Order | null>) => {
      state.selectedOrder = action.payload;
    },
    updateOrderInSlice: (state, action: PayloadAction<Order>) => {
      const order = action.payload;
      // Remove from everywhere first
      state.newOrders = state.newOrders.filter(o => o.id !== order.id);
      state.packingOrders = state.packingOrders.filter(o => o.id !== order.id);
      state.readyOrders = state.readyOrders.filter(o => o.id !== order.id);
      state.completedOrders = state.completedOrders.filter(o => o.id !== order.id);

      // Re-insert into corresponding status list
      if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
        state.newOrders.push(order);
      } else if (order.status === 'PACKING') {
        state.packingOrders.push(order);
      } else if (order.status === 'PACKED' || order.status === 'READY_FOR_PICKUP') {
        state.readyOrders.push(order);
      } else if (order.status === 'DELIVERED' || order.status === 'OUT_FOR_DELIVERY') {
        state.completedOrders.push(order);
      }

      if (state.selectedOrder?.id === order.id) {
        state.selectedOrder = order;
      }
    }
  },
});

export const {
  fetchOrdersStart,
  fetchOrdersSuccess,
  fetchOrdersFailure,
  setSelectedOrder,
  updateOrderInSlice,
} = ordersSlice.actions;
export default ordersSlice.reducer;
