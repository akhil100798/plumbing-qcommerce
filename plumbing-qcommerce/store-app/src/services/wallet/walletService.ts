import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Transaction } from '../../types';
import { mockTransactions } from '../../mocks';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

let localTransactions = [...mockTransactions];
let localBalance = 84500;

export const walletService = {
  getBalance: async (): Promise<number> => {
    try {
      const response = await apiClient.get(ENDPOINTS.wallet.balance);
      return response.data?.balance || 0;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store wallet balance', e);
        return localBalance;
      }
      throw createBackendUnavailableError('Wallet', e);
    }
  },

  getTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.wallet.transactions);
      return response.data || [];
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store wallet transactions', e);
        return localTransactions;
      }
      throw createBackendUnavailableError('Wallet transactions', e);
    }
  },

  withdraw: async (amount: number): Promise<number> => {
    try {
      await apiClient.post(`${ENDPOINTS.wallet.balance}/pay?amount=${amount}&description=Payout+to+Bank`);
      localBalance = Math.max(0, localBalance - amount);
      return localBalance;
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store wallet withdrawal', e);
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
      throw createBackendUnavailableError('Wallet withdrawals', e);
    }
  }
};
