import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { createBackendUnavailableError } from '../mockPolicy';
import { ActiveJob, JobOffer } from '../../types';

const serviceLocation = (order: any) => {
  const address = [order.addressLine1, order.addressLine2, order.landmark, order.city, order.postalCode].filter(Boolean).join(', ');
  if (address) return address;
  if (order.customerLatitude != null && order.customerLongitude != null) {
    return `Lat ${Number(order.customerLatitude).toFixed(4)}, Lng ${Number(order.customerLongitude).toFixed(4)}`;
  }
  return 'Address unavailable';
};

const parseServiceOrderId = (jobId: string): number => {
  const digits = String(jobId || '').match(/\d+/)?.[0];
  const orderId = digits ? Number(digits) : NaN;
  if (!Number.isFinite(orderId) || orderId <= 0) {
    throw new Error(`Invalid service order id: ${jobId}`);
  }
  return orderId;
};

const mapServiceOrderToOffer = (order: any): JobOffer => ({
  jobId: String(order.id),
  customerId: String(order.customer?.id || order.customerId || ''),
  customerName: order.customer?.fullName || order.customerName,
  location: serviceLocation(order),
  latitude: order.customerLatitude ?? order.latitude ?? null,
  longitude: order.customerLongitude ?? order.longitude ?? null,
  estimatedEarnings: null,
  issueDescription: order.description,
  category: order.issueCategory || order.requestType,
});

const mapServiceOrderToActiveJob = (order: any, status?: ActiveJob['status']): ActiveJob => {
  let mappedStatus: ActiveJob['status'] = status || 'accepted';
  if (!status) {
    if (order.status === 'ACCEPTED') {
      mappedStatus = order.arrivedAt != null ? 'reached' : 'accepted';
    } else if (order.status === 'IN_PROGRESS' || order.status === 'COMBINED_ORDER') {
      mappedStatus = 'started';
    } else if (order.status === 'COMPLETED' || order.status === 'PAID') {
      mappedStatus = 'completed';
    }
  } else if (status === 'accepted' && order.arrivedAt != null) {
    mappedStatus = 'reached';
  }

  return {
    jobId: String(order.id),
    customer: {
      id: String(order.customer?.id || order.customerId || ''),
      fullName: order.customer?.fullName || order.customerName || null,
      phone: order.customer?.phone || order.customerPhone || null,
      rating: order.customer?.rating ?? order.customerRating ?? null,
    },
    status: mappedStatus,
    address: serviceLocation(order),
    latitude: order.customerLatitude ?? order.latitude ?? null,
    longitude: order.customerLongitude ?? order.longitude ?? null,
    customerNote: order.description,
    estimatedEarnings: null,
    partsCharge: null,
    timeline: {
      accepted: order.acceptedAt,
      reached: order.arrivedAt,
      started: order.startedAt,
      completed: order.completedAt,
    },
  };
};

export const jobService = {
  fetchIncomingJobs: async (): Promise<JobOffer[]> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.ORDERS.OFFERS);
      return (response.data || []).map(mapServiceOrderToOffer);
    } catch (error) { throw createBackendUnavailableError('Fetch incoming jobs', error); }
  },

  acceptJob: async (jobId: string): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.patch<any>(ENDPOINTS.ORDERS.ACCEPT(cleanId));
      return mapServiceOrderToActiveJob(response.data, 'accepted');
    } catch (error: any) {
      if (error?.response?.status === 409) throw new Error('This job was accepted by another plumber.');
      if (error?.response?.status === 401 || error?.response?.status === 403) throw new Error('You are not eligible to accept this job.');
      throw createBackendUnavailableError('Accept plumber job', error);
    }
  },

  rejectJob: async (jobId: string): Promise<void> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      await apiClient.patch<any>(ENDPOINTS.ORDERS.REJECT(cleanId));
    } catch (error: any) {
      if (error?.response?.status === 409) throw new Error('This job is no longer available.');
      if (error?.response?.status === 401 || error?.response?.status === 403) throw new Error('You are not eligible to decline this job.');
      throw createBackendUnavailableError('Decline plumber job', error);
    }
  },

  startNavigation: async (jobId: string): Promise<void> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      await apiClient.patch<any>(`/orders/${cleanId}/start-navigation`);
    } catch (error) {
      throw createBackendUnavailableError('Start navigation', error);
    }
  },

  markArrived: async (jobId: string): Promise<void> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      await apiClient.patch<any>(ENDPOINTS.ORDERS.ARRIVE(cleanId));
    } catch (error) {
      throw createBackendUnavailableError('Mark arrived', error);
    }
  },

  startWork: async (jobId: string): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.patch<any>(ENDPOINTS.ORDERS.START(cleanId));
      return mapServiceOrderToActiveJob(response.data, 'started');
    } catch (error) {
      throw createBackendUnavailableError('Start plumber job', error);
    }
  },

  completeJob: async (jobId: string, partsCharge?: number): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.patch<any>(
        `${ENDPOINTS.ORDERS.COMPLETE(cleanId)}?partsCharge=${partsCharge || 0}`
      );
      return mapServiceOrderToActiveJob(response.data, 'completed');
    } catch (error) {
      throw createBackendUnavailableError('Complete plumber job', error);
    }
  },

  fetchActiveJob: async (): Promise<ActiveJob | null> => {
    try {
      const response = await apiClient.get<any[]>(ENDPOINTS.ORDERS.PLUMBER_ASSIGNED);
      const orders = response.data || [];
      const sortedOrders = [...orders].sort((a, b) => Number(b.id) - Number(a.id));
      const activeOrder = sortedOrders.find(
        (order) =>
          order.status === 'ACCEPTED' ||
          order.status === 'IN_PROGRESS' ||
          order.status === 'COMBINED_ORDER' ||
          order.status === 'COMPLETED'
      );
      if (!activeOrder) return null;

      // Let mapServiceOrderToActiveJob infer status from all fields (including arrivedAt)
      return mapServiceOrderToActiveJob(activeOrder);
    } catch (error) {
      throw createBackendUnavailableError('Fetch active job', error);
    }
  },

  fetchJobById: async (jobId: string): Promise<ActiveJob> => {
    try {
      const cleanId = parseServiceOrderId(jobId);
      const response = await apiClient.get<any>(ENDPOINTS.ORDERS.GET_BY_ID(cleanId));
      return mapServiceOrderToActiveJob(response.data);
    } catch (error) {
      throw createBackendUnavailableError('Fetch job by ID', error);
    }
  },
};
