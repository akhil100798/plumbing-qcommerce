import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types';

interface WalletState {
  balance: number;
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: WalletState = {
  balance: 0,
  transactions: [],
  loading: false,
  error: null,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    fetchWalletStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchWalletSuccess: (
      state,
      action: PayloadAction<{ balance: number; transactions: Transaction[] }>
    ) => {
      state.loading = false;
      state.balance = action.payload.balance;
      state.transactions = action.payload.transactions;
    },
    fetchWalletFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
  },
});

export const { fetchWalletStart, fetchWalletSuccess, fetchWalletFailure, updateBalance } = walletSlice.actions;
export default walletSlice.reducer;
