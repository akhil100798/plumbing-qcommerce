import { apiClient, getApiBaseUrl, getAuthToken } from '../apiClient';
import { CustomerDiagnosisDTO, CustomerQuoteDTO, DiagnosisEvidenceDTO } from './phase2Types';

export const Phase2OrderRepository = {
  getDiagnosis: async (orderId: number): Promise<CustomerDiagnosisDTO> => {
    const response = await apiClient.get<CustomerDiagnosisDTO>(`/customer/orders/${orderId}/diagnosis`);
    return response.data;
  },

  getEvidence: async (orderId: number): Promise<DiagnosisEvidenceDTO[]> => {
    const response = await apiClient.get<DiagnosisEvidenceDTO[]>(`/customer/orders/${orderId}/diagnosis/evidence`);
    return response.data.map((item: any) => ({ ...item, id: item.photoId }));
  },

  getEvidenceImageSource: async (orderId: number, photoId: number) => {
    const token = await getAuthToken();
    if (!token) throw new Error('Your session expired. Please log in again.');
    return {
      uri: `${getApiBaseUrl()}/customer/orders/${orderId}/diagnosis/evidence/${photoId}/file`,
      headers: { Authorization: `Bearer ${token}` },
    };
  },

  getCurrentQuote: async (orderId: number): Promise<CustomerQuoteDTO> => {
    const response = await apiClient.get<CustomerQuoteDTO>(`/customer/orders/${orderId}/quotes/current`);
    return response.data;
  },

  approveQuote: async (orderId: number, quoteId: number, key: string): Promise<CustomerQuoteDTO> => {
    const response = await apiClient.post<CustomerQuoteDTO>(
      `/customer/orders/${orderId}/quotes/${quoteId}/approve`,
      undefined,
      { headers: { 'Idempotency-Key': key } },
    );
    return response.data;
  },

  rejectQuote: async (orderId: number, quoteId: number, reason: string, key: string): Promise<CustomerQuoteDTO> => {
    const response = await apiClient.post<CustomerQuoteDTO>(
      `/customer/orders/${orderId}/quotes/${quoteId}/reject`,
      { reason },
      { headers: { 'Idempotency-Key': key } },
    );
    return response.data;
  },
};
