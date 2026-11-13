import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }));

vi.mock('../api/axiosClient', () => ({ apiClient: mocks }));

import { Phase2JobRepository, createMutationKey } from './phase2JobRepository';

describe('plumber Phase 2 job repository contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads only the current order diagnosis and quote paths', async () => {
    mocks.get.mockResolvedValue({ data: { id: 7, state: 'DRAFT' } });
    await Phase2JobRepository.getDiagnosis(42);
    expect(mocks.get).toHaveBeenLastCalledWith('/orders/42/diagnosis');
    await Phase2JobRepository.getCurrentQuote(42);
    expect(mocks.get).toHaveBeenLastCalledWith('/orders/42/quotes/current');
  });

  it('attaches the same key to diagnosis creation and submission retries', async () => {
    const key = createMutationKey('plumber', 42, 'diagnosis-submit-7');
    expect(createMutationKey('plumber', 42, 'diagnosis-submit-7')).toBe(key);
    expect(key.length).toBeLessThanOrEqual(160);

    mocks.post.mockResolvedValue({ data: { id: 7, state: 'SUBMITTED' } });
    await Phase2JobRepository.submitDiagnosis(42, 7, key);
    expect(mocks.post).toHaveBeenCalledWith('/orders/42/diagnosis/7/submit', undefined, {
      headers: { 'Idempotency-Key': key },
    });
  });

  it('publishes against the explicit catalog and keeps completion server-authoritative', async () => {
    mocks.post.mockResolvedValue({ data: { id: 9, state: 'PUBLISHED' } });
    await Phase2JobRepository.publishQuote(42, 9, 17, 'publish-9');
    expect(mocks.post).toHaveBeenLastCalledWith('/orders/42/quotes/9/publish', { pricingCatalogId: 17 }, {
      headers: { 'Idempotency-Key': 'publish-9' },
    });

    mocks.post.mockResolvedValue({ data: { id: 42, status: 'COMPLETED', completedAt: 'now', totalAmount: 125 } });
    await Phase2JobRepository.completeService(42);
    expect(mocks.post).toHaveBeenLastCalledWith('/orders/42/complete');
  });
});
