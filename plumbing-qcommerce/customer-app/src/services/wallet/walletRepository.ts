import { apiClient } from '../apiClient';

export interface TransactionItem {
  id: string;
  title: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
}

export interface WalletDTO {
  id: number;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export const WalletRepository = {
  getBalance: async (): Promise<number> => {
    const response = await apiClient.get<WalletDTO>('/wallet');
    return response.data.balance;
  },

  topup: async (amount: number): Promise<number> => {
    const response = await apiClient.post<WalletDTO>('/wallet/topup', null, {
      params: { amount },
    });
    return response.data.balance;
  },

  pay: async (amount: number, description: string): Promise<number> => {
    const response = await apiClient.post<WalletDTO>('/wallet/pay', null, {
      params: { amount, description },
    });
    return response.data.balance;
  },

  getTransactions: async (): Promise<TransactionItem[]> => {
    const response = await apiClient.get<any[]>('/wallet/transactions');
    return response.data.map((t) => ({
      id: String(t.id),
      title: t.description || (t.type === 'CREDIT' ? 'Wallet Deposit' : 'Payment'),
      amount: t.amount,
      type: t.type.toLowerCase() as 'credit' | 'debit',
      date: t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Recent',
    }));
  },
};
