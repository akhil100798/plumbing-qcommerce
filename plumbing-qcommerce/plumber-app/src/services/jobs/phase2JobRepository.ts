import { apiClient } from '../api/axiosClient';
import { canUseDevMockFallbacks } from '../mockPolicy';
import { DiagnosisDraftRequest, PlumberDiagnosisDTO, PlumberQuoteDTO } from './phase2Types';

const orderPath = (orderId: number) => `/orders/${orderId}`;

const MOCK_DIAGNOSIS: PlumberDiagnosisDTO = {
  id: 101,
  orderId: 1024,
  version: 1,
  state: 'DRAFT',
  revisionNumber: 1,
  affectedComponent: 'Bathroom Main Water Inlet Valve',
  observedCondition: 'Water leakage observed at pipe joint',
  diagnosisNarrative: 'Thread seal deteriorated under continuous pressure',
  recommendedRemedy: 'Replace pipe joint seal and re-pressurize',
  estimatedLaborUnits: 1,
  knownMaterialCandidates: 'PVC Elbow, Teflon Tape, Sealant',
  safetyNotes: 'Main water supply isolated safely',
  safetyBlocked: false,
  evidence: [],
  submittedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const MOCK_QUOTE: PlumberQuoteDTO = {
  id: 201,
  orderId: 1024,
  diagnosisId: 101,
  kind: 'LABOR_AND_MATERIALS',
  state: 'PUBLISHED',
  version: 1,
  laborSubtotal: 350,
  knownMaterialSubtotal: 180,
  total: 560,
  currency: 'INR',
  pricingCatalogId: 1,
  pricingCatalogVersion: 1,
  publishedAt: new Date().toISOString(),
  expiresAt: null,
  approvedAt: null,
  rejectedAt: null,
  lines: [],
};

export const Phase2JobRepository = {
  getJob: async (orderId: number): Promise<{ id: number; status: string; completedAt: string | null; totalAmount: number | null }> => {
    try {
      const response = await apiClient.get<any>(orderPath(orderId));
      return {
        id: response.data.id,
        status: response.data.status,
        completedAt: response.data.completedAt ?? null,
        totalAmount: response.data.totalAmount == null ? null : Number(response.data.totalAmount),
      };
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { id: orderId || 1024, status: 'IN_PROGRESS', completedAt: null, totalAmount: 650 };
      }
      throw err;
    }
  },

  getDiagnosis: async (orderId: number): Promise<PlumberDiagnosisDTO> => {
    try {
      const response = await apiClient.get<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis`);
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_DIAGNOSIS, orderId: orderId || 1024 };
      }
      throw err;
    }
  },

  getCurrentQuote: async (orderId: number): Promise<PlumberQuoteDTO> => {
    try {
      const response = await apiClient.get<PlumberQuoteDTO>(`${orderPath(orderId)}/quotes/current`);
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_QUOTE, orderId: orderId || 1024 };
      }
      throw err;
    }
  },

  createDiagnosis: async (orderId: number, draft: DiagnosisDraftRequest, key: string): Promise<PlumberDiagnosisDTO> => {
    try {
      const response = await apiClient.post<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis`, draft, {
        headers: { 'Idempotency-Key': key },
      });
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_DIAGNOSIS, ...draft, orderId: orderId || 1024 };
      }
      throw err;
    }
  },

  updateDiagnosis: async (orderId: number, diagnosisId: number, draft: DiagnosisDraftRequest, version: number, key: string): Promise<PlumberDiagnosisDTO> => {
    try {
      const response = await apiClient.patch<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis/${diagnosisId}`, {
        ...draft,
        expectedVersion: version,
      }, { headers: { 'Idempotency-Key': key } });
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_DIAGNOSIS, ...draft, id: diagnosisId, version: version + 1 };
      }
      throw err;
    }
  },

  uploadDiagnosisEvidence: async (orderId: number, diagnosisId: number, asset: { uri: string; fileName?: string | null; mimeType?: string | null }, key: string): Promise<void> => {
    try {
      const body = new FormData();
      body.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'diagnosis-photo.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as unknown as Blob);
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
    } catch (err) {
      if (canUseDevMockFallbacks()) return;
      throw err;
    }
  },

  submitDiagnosis: async (orderId: number, diagnosisId: number, key: string): Promise<PlumberDiagnosisDTO> => {
    try {
      const response = await apiClient.post<PlumberDiagnosisDTO>(`${orderPath(orderId)}/diagnosis/${diagnosisId}/submit`, undefined, {
        headers: { 'Idempotency-Key': key },
      });
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_DIAGNOSIS, id: diagnosisId, state: 'SUBMITTED', submittedAt: new Date().toISOString() };
      }
      throw err;
    }
  },

  publishQuote: async (orderId: number, quoteId: number, catalogId: number, key: string): Promise<PlumberQuoteDTO> => {
    try {
      const response = await apiClient.post<PlumberQuoteDTO>(
        `${orderPath(orderId)}/quotes/${quoteId}/publish`,
        { pricingCatalogId: catalogId },
        { headers: { 'Idempotency-Key': key } },
      );
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_QUOTE, id: quoteId, state: 'PUBLISHED' };
      }
      throw err;
    }
  },

  reviseQuote: async (orderId: number, quoteId: number, reason: string, key: string): Promise<PlumberQuoteDTO> => {
    try {
      const response = await apiClient.post<PlumberQuoteDTO>(
        `${orderPath(orderId)}/quotes/${quoteId}/revise`,
        { reason },
        { headers: { 'Idempotency-Key': key } },
      );
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { ...MOCK_QUOTE, id: quoteId, state: 'PUBLISHED' };
      }
      throw err;
    }
  },

  completeService: async (orderId: number): Promise<{ id: number; status: string; completedAt: string | null; totalAmount: number | null }> => {
    try {
      const response = await apiClient.post<{ id: number; status: string; completedAt: string | null; totalAmount: number | null }>(
        `${orderPath(orderId)}/complete`,
      );
      return response.data;
    } catch (err) {
      if (canUseDevMockFallbacks()) {
        return { id: orderId || 1024, status: 'COMPLETED', completedAt: new Date().toISOString(), totalAmount: 650 };
      }
      throw err;
    }
  },

  uploadCompletionPhoto: async (orderId: number, asset?: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<void> => {
    try {
      const photoAsset = asset || {
        uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        fileName: 'after-completion-photo.png',
        mimeType: 'image/png',
      };
      const body = new FormData();
      body.append('file', {
        uri: photoAsset.uri,
        name: photoAsset.fileName || 'after-completion-photo.png',
        type: photoAsset.mimeType || 'image/png',
      } as unknown as Blob);
      await apiClient.post(
        `${orderPath(orderId)}/completion-photo`,
        body,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        },
      );
    } catch (err) {
      if (canUseDevMockFallbacks()) return;
      throw err;
    }
  },
};

export const createMutationKey = (role = 'plumber', orderId = 0, action = 'mutation') => `${role}_${orderId}_${action}`;
export const configuredLaborCatalogId = () => 1;
