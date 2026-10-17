import { apiClient } from '../api/axiosClient';
import { DiagnosisDraftRequest, PlumberDiagnosisDTO, PlumberQuoteDTO } from './phase2Types';

const orderPath = (orderId: number) => `/orders/${orderId}`;

export const Phase2JobRepository = {
  getJob: async (orderId: number): Promise<{ id: number; status: string; completedAt: string | null; totalAmount: number | null }> => {
    const response = await apiClient.get<any>(orderPath(orderId));
    return {
      id: response.data.id,
      status: response.data.status,
      completedAt: response.data.completedAt ?? null,
      totalAmount: response.data.totalAmount == null ? null : Number(response.data.totalAmount),
    };
  },

  getDiagnosis: async (orderId: number): Promise<PlumberDiagnosisDTO> => {
    const response = await apiClient.get<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis`);
    return response.data;
  },

  getCurrentQuote: async (orderId: number): Promise<PlumberQuoteDTO> => {
    const response = await apiClient.get<PlumberQuoteDTO>(`${orderPath(orderId)}/quotes/current`);
    return response.data;
  },

  createDiagnosis: async (orderId: number, draft: DiagnosisDraftRequest, key: string): Promise<PlumberDiagnosisDTO> => {
    const response = await apiClient.post<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis`, draft, {
      headers: { 'Idempotency-Key': key },
    });
    return response.data;
  },

  updateDiagnosis: async (orderId: number, diagnosisId: number, draft: DiagnosisDraftRequest, version: number, key: string): Promise<PlumberDiagnosisDTO> => {
    const response = await apiClient.patch<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis/${diagnosisId}`, {
      ...draft,
      expectedVersion: version,
    }, { headers: { 'Idempotency-Key': key } });
    return response.data;
  },

  uploadDiagnosisEvidence: async (orderId: number, diagnosisId: number, asset: { uri: string; fileName?: string | null; mimeType?: string | null }, key: string): Promise<void> => {
    const body = new FormData();
    if (typeof window !== 'undefined' && asset.uri) {
      try {
        const res = await fetch(asset.uri);
        const blob = await res.blob();
        body.append('file', blob, asset.fileName || 'diagnosis-photo.jpg');
      } catch {
        body.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'diagnosis-photo.jpg',
          type: asset.mimeType || 'image/jpeg',
        } as unknown as Blob);
      }
    } else {
      body.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'diagnosis-photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob);
    }
    await apiClient.post(
      `${orderPath(orderId)}/diagnosis/${diagnosisId}/evidence`,
      body,
      {
        headers: {
          'Idempotency-Key': key,
          'Content-Type': 'multipart/form-data',
        },
      },
    );
  },

  submitDiagnosis: async (orderId: number, diagnosisId: number, key: string): Promise<PlumberDiagnosisDTO> => {
    const response = await apiClient.post<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis/${diagnosisId}/submit`, undefined, {
      headers: { 'Idempotency-Key': key },
    });
    return response.data;
  },

  publishQuote: async (orderId: number, quoteId: number, catalogId: number, key: string): Promise<PlumberQuoteDTO> => {
    const response = await apiClient.post<PlumberQuoteDTO>(
      `${orderPath(orderId)}/quotes/${quoteId}/publish`,
      { pricingCatalogId: catalogId },
      { headers: { 'Idempotency-Key': key } },
    );
    return response.data;
  },

  reviseQuote: async (orderId: number, quoteId: number, reason: string, key: string): Promise<PlumberQuoteDTO> => {
    const response = await apiClient.post<PlumberQuoteDTO>(
      `${orderPath(orderId)}/quotes/${quoteId}/revise`,
      { reason },
      { headers: { 'Idempotency-Key': key } },
    );
    return response.data;
  },

  completeService: async (orderId: number): Promise<{ id: number; status: string; completedAt: string | null; totalAmount: number | null }> => {
    const response = await apiClient.post<{ id: number; status: string; completedAt: string | null; totalAmount: number | null }>(
      `${orderPath(orderId)}/complete`,
    );
    return response.data;
  },
};

export function configuredLaborCatalogId(): number | null {
  const raw = process.env.EXPO_PUBLIC_LABOR_PRICING_CATALOG_ID?.trim();
  if (raw && /^\d+$/.test(raw)) {
    const id = Number(raw);
    if (Number.isSafeInteger(id) && id > 0) return id;
  }
  return 1;
}

export function createMutationKey(scope: string, orderId: number, action: string): string {
  let hash = 2166136261;
  for (let index = 0; index < action.length; index += 1) {
    hash ^= action.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const identity = action.replace(/[^a-zA-Z0-9-]/g, '-').slice(0, 48);
  return `${scope}-${orderId}-${identity.slice(0, 36)}-${(hash >>> 0).toString(36)}`;
}
