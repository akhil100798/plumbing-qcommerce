import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_TRANSACTIONS } from '../mocks/mockData';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';
import { Transaction } from '../../types';

export const earningsService = {
  fetchEarnings: async (): Promise<{
    todayEarnings: number;
    weeklyEarnings: number;
    serviceCommission: number;
    materialCommission: number;
    tips: number;
    jobsCompleted: number;
  }> => {
    try {
      const response = await apiClient.get<any>(ENDPOINTS.WALLET.GET_WALLET);
      const wallet = response.data;
      return {
        todayEarnings: wallet.todayEarnings || 0,
        weeklyEarnings: wallet.weeklyEarnings || 0,
        serviceCommission: wallet.serviceEarnings || 0,
        materialCommission: wallet.materialCommission || 0,
        tips: wallet.tips || 0,
        jobsCompleted: wallet.jobsCompleted || 0,
      };
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Plumber earnings summary', error);
        return {
          todayEarnings: 1450,
          weeklyEarnings: 8450,
          serviceCommission: 1120,
          materialCommission: 230,
          tips: 100,
          jobsCompleted: 8,
        };
      }
      throw createBackendUnavailableError('Wallet and earnings', error);
    }
  },

  fetchTransactions: async (): Promise<Transaction[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.WALLET.TRANSACTIONS);
      return response.data.map((txn) => ({
        id: String(txn.id),
        type: txn.type as 'CREDIT' | 'DEBIT',
        amount: txn.amount,
        description: txn.description,
        createdAt: new Date(txn.createdAt).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Plumber earnings transactions', error);
        return MOCK_TRANSACTIONS;
      }
      throw createBackendUnavailableError('Wallet transactions', error);
    }
  },
};
