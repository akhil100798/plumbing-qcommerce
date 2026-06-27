import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import dashboardReducer from './slices/dashboardSlice';
import ordersReducer from './slices/ordersSlice';
import inventoryReducer from './slices/inventorySlice';
import dispatchReducer from './slices/dispatchSlice';
import analyticsReducer from './slices/analyticsSlice';
import walletReducer from './slices/walletSlice';
import notificationsReducer from './slices/notificationsSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    orders: ordersReducer,
    inventory: inventoryReducer,
    dispatch: dispatchReducer,
    analytics: analyticsReducer,
    wallet: walletReducer,
    notifications: notificationsReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
