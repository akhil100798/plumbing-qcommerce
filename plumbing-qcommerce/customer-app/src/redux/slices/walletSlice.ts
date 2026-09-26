import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TransactionItem } from '../../services/wallet/walletRepository';

interface WalletState {
  balance: number;
  transactions: TransactionItem[];
  loading: boolean;
}

const initialState: WalletState = {
  balance: 500,
  transactions: [
    {
      id: 't1',
      title: 'Refund for Order PC123456',
      amount: 150,
      type: 'credit',
      date: 'May 24, 09:30 AM',
    },
    {
      id: 't2',
      title: 'Plumber Inspection Payment',
      amount: 199,
      type: 'debit',
      date: 'May 22, 02:30 PM',
    },
    {
      id: 't3',
      title: 'Added to Wallet via UPI',
      amount: 500,
      type: 'credit',
      date: 'May 19, 11:00 AM',
    },
  ],
  loading: false,
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    addFunds: (state, action: PayloadAction<number>) => {
      state.balance += action.payload;
    },
    setTransactions: (state, action: PayloadAction<TransactionItem[]>) => {
      state.transactions = action.payload;
    },
    addTransaction: (state, action: PayloadAction<TransactionItem>) => {
      state.transactions.unshift(action.payload);
    },
  },
});

export const { setBalance, addFunds, setTransactions, addTransaction } = walletSlice.actions;
export default walletSlice.reducer;
