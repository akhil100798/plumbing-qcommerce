import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_TRANSACTIONS } from '../mocks/mockData';
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
      // Map balance and compute estimations
      return {
        todayEarnings: wallet.todayEarnings || 1450,
        weeklyEarnings: wallet.weeklyEarnings || 8450,
        serviceCommission: wallet.serviceEarnings || 1120,
        materialCommission: wallet.materialCommission || 230,
        tips: wallet.tips || 100,
        jobsCompleted: wallet.jobsCompleted || 8,
      };
    } catch (error) {
      console.warn('Failed to fetch wallet for earnings, using mock stats', error);
      return {
        todayEarnings: 1450,
        weeklyEarnings: 8450,
        serviceCommission: 1120,
        materialCommission: 230,
        tips: 100,
        jobsCompleted: 8,
      };
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
      console.warn('Failed to fetch transactions from API, using mock', error);
      return MOCK_TRANSACTIONS;
    }
  },
};
