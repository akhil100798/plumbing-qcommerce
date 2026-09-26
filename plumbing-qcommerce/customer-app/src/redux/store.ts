import { configureStore } from '@reduxjs/toolkit';
import addressReducer from './slices/addressSlice';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import ordersReducer from './slices/ordersSlice';
import plumbersReducer from './slices/plumbersSlice';
import walletReducer from './slices/walletSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    address: addressReducer,
    auth: authReducer,
    cart: cartReducer,
    orders: ordersReducer,
    plumbers: plumbersReducer,
    wallet: walletReducer,
    notifications: notificationsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
