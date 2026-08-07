import { apiClient } from '../api/axiosClient';

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

export const dashboardService = {
  async fetch(): Promise<PlumberDashboard> {
    const response = await apiClient.get<PlumberDashboard>('/plumber/dashboard');
    return response.data;
  },
};
