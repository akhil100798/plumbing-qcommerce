import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  apiClient: { patch: mocks.patch },
}));

import { jobService } from './jobService';

describe('plumber job rejection contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends exactly one authenticated reject mutation for the requested job', async () => {
    mocks.patch.mockResolvedValue({ status: 200, data: { id: 13, status: 'PENDING' } });

    await jobService.rejectJob('13');

    expect(mocks.patch).toHaveBeenCalledOnce();
    expect(mocks.patch).toHaveBeenCalledWith('/orders/13/reject');
  });

  it('does not turn a rejected mutation failure into a success', async () => {
    mocks.patch.mockRejectedValue(new Error('server unavailable'));

    await expect(jobService.rejectJob('13')).rejects.toThrow('server unavailable');
    expect(mocks.patch).toHaveBeenCalledOnce();
  });
});
