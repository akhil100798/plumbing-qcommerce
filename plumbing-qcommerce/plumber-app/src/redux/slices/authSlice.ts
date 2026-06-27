import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PlumberProfile } from '../../types';

interface AuthState {
  plumber: PlumberProfile | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  plumber: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    authSuccess: (
      state,
      action: PayloadAction<{ plumber: PlumberProfile; token: string; refreshToken: string }>
    ) => {
      state.loading = false;
      state.plumber = action.payload.plumber;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
      state.error = null;
    },
    authFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    setAvailability: (state, action: PayloadAction<boolean>) => {
      if (state.plumber) {
        state.plumber.availability = action.payload;
      }
    },
    logout: (state) => {
      state.plumber = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
  },
});

export const { authStart, authSuccess, authFailure, setAvailability, logout } = authSlice.actions;
export default authSlice.reducer;
