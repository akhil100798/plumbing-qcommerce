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
    setWalletLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setWalletError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setWalletData: (
      state,
      action: PayloadAction<{ balance: number; transactions: Transaction[] }>
    ) => {
      state.balance = action.payload.balance;
      state.transactions = action.payload.transactions;
      state.loading = false;
      state.error = null;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.transactions.unshift(action.payload);
      if (action.payload.type === 'CREDIT') {
        state.balance += action.payload.amount;
      } else {
        state.balance -= action.payload.amount;
      }
    },
  },
});

export const { setWalletLoading, setWalletError, setWalletData, addTransaction } =
  walletSlice.actions;
export default walletSlice.reducer;
