import { apiClient } from '../api/axiosClient';
import { canUseDevMockFallbacks, warnUsingDevMockFallback } from '../mockPolicy';

export interface PlumberDashboard {
  name: string | null;
  online: boolean;
  rating: number | null;
  todayEarnings: number;
  completedJobs: number;
  activeJobs: number;
  assignedJobs: number;
  cancelledJobs: number;
  upcomingJob: {
    id: number;
    title: string | null;
    customerName: string | null;
    address: string | null;
    scheduledTime: string | null;
    estimatedAmount: number;
  } | null;
}

export const MOCK_DASHBOARD: PlumberDashboard = {
  name: 'Rajesh Kumar',
  online: true,
  rating: 4.8,
  todayEarnings: 1450,
  completedJobs: 8,
  activeJobs: 1,
  assignedJobs: 1,
  cancelledJobs: 0,
  upcomingJob: {
    id: 1024,
    title: 'Emergency Pipe Leakage Repair',
    customerName: 'Priya Sharma',
    address: 'Flat 402, Green Glen Layout, Bellandur, Bangalore',
    scheduledTime: '10:30 AM',
    estimatedAmount: 650,
  },
};

export const dashboardService = {
  async fetch(): Promise<PlumberDashboard> {
    try {
      const response = await apiClient.get<PlumberDashboard>('/plumber/dashboard');
      return response.data;
    } catch (error) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Plumber dashboard', error);
        return MOCK_DASHBOARD;
      }
      throw error;
    }
  },
};
