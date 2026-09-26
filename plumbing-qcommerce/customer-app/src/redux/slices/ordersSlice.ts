import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ProductOrderDTO } from '../../services/cart/cartTypes';
import { OrderStatusDTO, ServiceOrderDTO } from '../../services/orders/orderTypes';

interface OrdersState {
  productOrders: ProductOrderDTO[];
  serviceOrders: ServiceOrderDTO[];
  activeProductOrder: OrderStatusDTO | null;
  loading: boolean;
  error: string | null;
}

const initialState: OrdersState = {
  productOrders: [],
  serviceOrders: [],
  activeProductOrder: null,
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setProductOrders: (state, action: PayloadAction<ProductOrderDTO[]>) => {
      state.productOrders = action.payload;
    },
    setServiceOrders: (state, action: PayloadAction<ServiceOrderDTO[]>) => {
      state.serviceOrders = action.payload;
    },
    setActiveProductOrder: (state, action: PayloadAction<OrderStatusDTO | null>) => {
      state.activeProductOrder = action.payload;
    },
    updateProductOrderStatus: (state, action: PayloadAction<string>) => {
      if (state.activeProductOrder) {
        state.activeProductOrder.status = action.payload;
      }
    },
  },
});

export const {
  setProductOrders,
  setServiceOrders,
  setActiveProductOrder,
  updateProductOrderStatus,
} = ordersSlice.actions;
export default ordersSlice.reducer;
