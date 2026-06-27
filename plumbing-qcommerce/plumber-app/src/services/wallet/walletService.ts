import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_TRANSACTIONS } from '../mocks/mockData';
import { Transaction } from '../../types';

export const walletService = {
  getWallet: async (): Promise<{ balance: number }> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.WALLET.GET_WALLET);
      return {
        balance: response.data.balance || 0,
      };
    } catch (error) {
      console.warn('Failed to fetch wallet, using mock balance', error);
      return { balance: 12500 };
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.WALLET.TRANSACTIONS);
      return response.data.map((txn) => ({
        id: String(txn.id),
        type: txn.type as 'CREDIT' | 'DEBIT',
        amount: txn.amount,
        description: txn.description,
        createdAt: txn.createdAt,
      }));
    } catch (error) {
      console.warn('Failed to fetch wallet transactions, using mock', error);
      return MOCK_TRANSACTIONS;
    }
  },
};
