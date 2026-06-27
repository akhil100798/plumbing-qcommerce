import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { MOCK_ACTIVE_JOB, MOCK_JOB_OFFER } from '../mocks/mockData';
import { ActiveJob, JobOffer } from '../../types';

export const jobService = {
  fetchIncomingJobs: async (): Promise<JobOffer[]> => {
    try {
      // In q-commerce, jobs are broadcasted via websockets, but we can poll too.
      // Fetch available pending orders
      const response = await apiClient.get<any[]>(ENDPOINTS.ORDERS.BY_STATUS('PENDING'));
      return response.data.map((order) => ({
        jobId: String(order.id),
        customerId: String(order.customerId),
        customerName: order.customerName || 'Customer',
        customerRating: 4.8,
        distance: 2.4,
        location: order.address || 'Service Location',
        latitude: order.latitude,
        longitude: order.longitude,
        estimatedEarnings: order.serviceCharge || 299,
        issueDescription: order.description,
      }));
    } catch (error) {
      console.warn('Failed to fetch pending orders, using mock', error);
      return [MOCK_JOB_OFFER];
    }
  },

  acceptJob: async (jobId: string): Promise<ActiveJob> => {
    try {
      const numericId = jobId.replace(/[^0-9]/g, '');
      const cleanId = numericId ? parseInt(numericId) : 1;
      const response = await apiClient.patch<any>(ENDPOINTS.ORDERS.ACCEPT(cleanId));
      const order = response.data;
      
      return {
        jobId: String(order.id),
        customer: {
          id: String(order.customerId || 'cust_99'),
          fullName: order.customerName || 'Akhil Verma',
          phone: order.customerPhone || '+91 9999999999',
          rating: 4.8,
        },
        status: 'accepted',
        address: order.address || 'H.No 12-5-45, Street 3, Miyapur, Hyderabad - 500049',
        latitude: order.latitude || 17.4933,
        longitude: order.longitude || 78.3489,
        customerNote: order.description || 'Water leakage behind the wash basin.',
        estimatedEarnings: order.serviceCharge || 299,
        partsCharge: order.partsCharge || 0,
        timeline: {
          assigned: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          accepted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    } catch (error) {
      console.warn('Failed to accept order via API, fallback to mock active job', error);
      return {
        ...MOCK_ACTIVE_JOB,
        jobId,
        timeline: {
          assigned: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          accepted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }
  },

  startNavigation: async (jobId: string): Promise<void> => {
    // Local flow update - updates status to 'on_the_way'
    console.log(`Started navigation for job ${jobId}`);
  },

  markArrived: async (jobId: string): Promise<void> => {
    // Local flow update - updates status to 'reached'
    console.log(`Plumber reached destination for job ${jobId}`);
  },

  startWork: async (jobId: string): Promise<ActiveJob> => {
    try {
      const numericId = jobId.replace(/[^0-9]/g, '');
      const cleanId = numericId ? parseInt(numericId) : 1;
      const response = await apiClient.patch<any>(ENDPOINTS.ORDERS.START(cleanId));
      const order = response.data;
      return {
        jobId: String(order.id),
        customer: {
          id: String(order.customerId),
          fullName: order.customerName || 'Customer',
          phone: order.customerPhone || '',
          rating: 4.8,
        },
        status: 'started',
        address: order.address,
        latitude: order.latitude,
        longitude: order.longitude,
        customerNote: order.description,
        estimatedEarnings: order.serviceCharge || 299,
        partsCharge: order.partsCharge || 0,
        timeline: {
          assigned: '10:15 AM',
          accepted: '10:16 AM',
          on_the_way: '10:17 AM',
          reached: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          started: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    } catch (error) {
      console.warn('Failed to start order via API, fallback to local transition', error);
      return {
        ...MOCK_ACTIVE_JOB,
        jobId,
        status: 'started',
        timeline: {
          ...MOCK_ACTIVE_JOB.timeline,
          reached: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          started: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }
  },

  completeJob: async (jobId: string, partsCharge?: number): Promise<ActiveJob> => {
    try {
      const numericId = jobId.replace(/[^0-9]/g, '');
      const cleanId = numericId ? parseInt(numericId) : 1;
      const response = await apiClient.patch<any>(
        `${ENDPOINTS.ORDERS.COMPLETE(cleanId)}?partsCharge=${partsCharge || 0}`
      );
      const order = response.data;
      return {
        jobId: String(order.id),
        customer: {
          id: String(order.customerId),
          fullName: order.customerName || 'Customer',
          phone: order.customerPhone || '',
          rating: 4.8,
        },
        status: 'completed',
        address: order.address,
        latitude: order.latitude,
        longitude: order.longitude,
        customerNote: order.description,
        estimatedEarnings: order.serviceCharge || 299,
        partsCharge: order.partsCharge || partsCharge || 0,
        timeline: {
          assigned: '10:15 AM',
          accepted: '10:16 AM',
          on_the_way: '10:17 AM',
          reached: '10:30 AM',
          started: '10:35 AM',
          completed: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    } catch (error) {
      console.warn('Failed to complete order via API, fallback to local state', error);
      return {
        ...MOCK_ACTIVE_JOB,
        jobId,
        status: 'completed',
        partsCharge: partsCharge || 0,
        timeline: {
          ...MOCK_ACTIVE_JOB.timeline,
          reached: '10:30 AM',
          started: '10:35 AM',
          completed: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }
  },
};
