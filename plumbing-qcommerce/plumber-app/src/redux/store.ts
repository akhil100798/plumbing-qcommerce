import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import jobReducer from './slices/jobSlice';
import materialReducer from './slices/materialSlice';
import earningsReducer from './slices/earningsSlice';
import walletReducer from './slices/walletSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    job: jobReducer,
    material: materialReducer,
    earnings: earningsReducer,
    wallet: walletReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
