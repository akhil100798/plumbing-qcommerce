import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api/axiosClient';
import { materialService } from './materialService';
vi.mock('../api/axiosClient', () => ({ apiClient: { get: vi.fn(), post: vi.fn() } }));
beforeEach(() => vi.resetAllMocks());
describe('resumeWork persisted transition', () => {
  it('returns and resumes only after store collection', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { status: 'PRODUCTS_COLLECTED' } });
    vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { status: 'RETURNING_TO_CUSTOMER' } }).mockResolvedValueOnce({ data: { status: 'WORK_RESUMED' } });
    await materialService.resumeWork('27');
    expect(apiClient.post).toHaveBeenNthCalledWith(1, '/orders/27/return-to-customer');
    expect(apiClient.post).toHaveBeenNthCalledWith(2, '/orders/27/resume');
  });
  it('does not advance after a failed return transition', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { status: 'PRODUCTS_COLLECTED' } });
    vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Network failure'));
    await expect(materialService.resumeWork('27')).rejects.toThrow('Network failure');
    expect(apiClient.post).toHaveBeenCalledTimes(1);
  });
  it('retries safely after return persisted but resume failed', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { status: 'RETURNING_TO_CUSTOMER' } });
    vi.mocked(apiClient.post).mockResolvedValue({ data: { status: 'WORK_RESUMED' } });
    await materialService.resumeWork('27');
    expect(apiClient.post).toHaveBeenCalledExactlyOnceWith('/orders/27/resume');
  });
  it('rejects a job awaiting store handover without mutating it', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { status: 'READY_FOR_PRODUCT_PICKUP' } });
    await expect(materialService.resumeWork('27')).rejects.toThrow('Store must confirm collection');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
  it('does not repeat transitions for already resumed work', async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { status: 'WORK_RESUMED' } });
    await materialService.resumeWork('27');
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
