import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Transaction } from '../../types';
import { mockTransactions } from '../../mocks';

let localTransactions = [...mockTransactions];
let localBalance = 84500;

export const walletService = {
  getBalance: async (): Promise<number> => {
    try {
      const response = await apiClient.get(ENDPOINTS.wallet.balance);
      return response.data?.balance || 0;
    } catch (e) {
      console.warn('API getBalance failed, fallback to mock:', e);
      return localBalance;
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.wallet.transactions);
      return response.data || [];
    } catch (e) {
      console.warn('API getTransactions failed, fallback to mock:', e);
      return localTransactions;
    }
  },

  withdraw: async (amount: number): Promise<number> => {
    try {
      // Debit from wallet balance
      await apiClient.post(`${ENDPOINTS.wallet.balance}/pay?amount=${amount}&description=Payout+to+Bank`);
      localBalance = Math.max(0, localBalance - amount);
      return localBalance;
    } catch (e) {
      console.warn('API withdraw failed, fallback to local simulate:', e);
      localBalance = Math.max(0, localBalance - amount);
      localTransactions.unshift({
        id: Date.now(),
        amount,
        type: 'DEBIT',
        description: 'Payout to Bank Account',
        createdAt: new Date().toISOString()
      });
      return localBalance;
    }
  }
};
