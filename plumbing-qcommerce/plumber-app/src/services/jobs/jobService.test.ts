import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  apiClient: { patch: mocks.patch },
}));

import { jobService } from './jobService';

describe('plumber accept contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps a successful accept response without inventing customer data', async () => {
    mocks.patch.mockResolvedValue({ status: 200, data: { id: 13, status: 'ACCEPTED' } });
    const job = await jobService.acceptJob('13');
    expect(job.jobId).toBe('13');
    expect(job.customer.fullName).toBeNull();
    expect(job.customer.rating).toBeNull();
    expect(job.latitude).toBeNull();
    expect(job.longitude).toBeNull();
    expect(job.estimatedEarnings).toBeNull();
  });

  it('preserves a 409 as an accepted-by-another-plumber conflict', async () => {
    mocks.patch.mockRejectedValue({ response: { status: 409 } });
    await expect(jobService.acceptJob('13')).rejects.toThrow('This job was accepted by another plumber.');
  });

  it('uses explicit eligibility messaging for 401/403', async () => {
    mocks.patch.mockRejectedValue({ response: { status: 403 } });
    await expect(jobService.acceptJob('13')).rejects.toThrow('You are not eligible to accept this job.');
  });

  it('classifies network and server errors as unavailable', async () => {
    mocks.patch.mockRejectedValue({ response: { status: 503 } });
    await expect(jobService.acceptJob('13')).rejects.toThrow(/unavailable/i);
  });
});

describe('plumber decline contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls the real reject endpoint once', async () => {
    mocks.patch.mockResolvedValue({ status: 200 });
    await jobService.rejectJob('13');
    expect(mocks.patch).toHaveBeenCalledOnce();
    expect(mocks.patch).toHaveBeenCalledWith('/orders/13/reject');
  });

  it('keeps conflict and auth failures distinguishable', async () => {
    mocks.patch.mockRejectedValue({ response: { status: 409 } });
    await expect(jobService.rejectJob('13')).rejects.toThrow('no longer available');
    mocks.patch.mockRejectedValue({ response: { status: 403 } });
    await expect(jobService.rejectJob('13')).rejects.toThrow('not eligible');
  });
});
