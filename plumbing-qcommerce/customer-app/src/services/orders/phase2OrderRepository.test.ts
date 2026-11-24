import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  getApiBaseUrl: vi.fn(() => 'https://api.example.test/api/v1'),
  getAuthToken: vi.fn(),
}));

vi.mock('../apiClient', () => ({
  apiClient: { get: mocks.get, post: mocks.post },
  getApiBaseUrl: mocks.getApiBaseUrl,
  getAuthToken: mocks.getAuthToken,
}));

import { Phase2OrderRepository } from './phase2OrderRepository';

describe('customer Phase 2 order repository contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads customer diagnosis and the current quote from owner-scoped routes', async () => {
    mocks.get.mockResolvedValue({ data: { id: 3, state: 'SUBMITTED' } });
    await Phase2OrderRepository.getDiagnosis(42);
    expect(mocks.get).toHaveBeenLastCalledWith('/customer/orders/42/diagnosis');

    mocks.get.mockResolvedValue({ data: { id: 8, kind: 'INITIAL', state: 'PUBLISHED' } });
    await Phase2OrderRepository.getCurrentQuote(42);
    expect(mocks.get).toHaveBeenLastCalledWith('/customer/orders/42/quotes/current');
  });

  it('preserves evidence identifiers and returns no unauthenticated image source', async () => {
    mocks.get.mockResolvedValue({ data: [{ photoId: 12, phase: 'DIAGNOSIS', contentType: 'image/jpeg', sizeBytes: 14, createdAt: 'now' }] });
    await expect(Phase2OrderRepository.getEvidence(42)).resolves.toEqual([
      { id: 12, photoId: 12, phase: 'DIAGNOSIS', contentType: 'image/jpeg', sizeBytes: 14, createdAt: 'now' },
    ]);

    mocks.getAuthToken.mockResolvedValue(null);
    await expect(Phase2OrderRepository.getEvidenceImageSource(42, 12)).rejects.toThrow(/session expired/i);
    mocks.getAuthToken.mockResolvedValue('owner-token');
    await expect(Phase2OrderRepository.getEvidenceImageSource(42, 12)).resolves.toEqual({
      uri: 'https://api.example.test/api/v1/customer/orders/42/diagnosis/evidence/12/file',
      headers: { Authorization: 'Bearer owner-token' },
    });
  });

  it('sends stable decision keys on approval and rejection mutations', async () => {
    mocks.post.mockResolvedValue({ data: { id: 8, state: 'APPROVED' } });
    await Phase2OrderRepository.approveQuote(42, 8, 'customer-42-quote-8-approve-v1');
    expect(mocks.post).toHaveBeenLastCalledWith('/customer/orders/42/quotes/8/approve', undefined, {
      headers: { 'Idempotency-Key': 'customer-42-quote-8-approve-v1' },
    });

    mocks.post.mockResolvedValue({ data: { id: 8, state: 'REJECTED' } });
    await Phase2OrderRepository.rejectQuote(42, 8, 'Declined', 'customer-42-quote-8-reject-v1');
    expect(mocks.post).toHaveBeenLastCalledWith('/customer/orders/42/quotes/8/reject', { reason: 'Declined' }, {
      headers: { 'Idempotency-Key': 'customer-42-quote-8-reject-v1' },
    });
  });
});
