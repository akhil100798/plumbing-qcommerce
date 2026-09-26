import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadProfileRepository() {
  vi.resetModules();
  vi.doMock('../apiClient', () => ({
    apiClient: {
      get: vi.fn(),
    },
  }));
  return import('./profileRepository');
}

describe('customer ProfileRepository', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns empty stats instead of fabricated staging values', async () => {
    const { ProfileRepository } = await loadProfileRepository();

    await expect(ProfileRepository.getStats()).resolves.toEqual({
      walletBalance: 0,
      totalOrders: 0,
      rating: 0,
    });
  });

  it('returns no saved cards when staging card APIs are unavailable', async () => {
    const { ProfileRepository } = await loadProfileRepository();

    await expect(ProfileRepository.getSavedCards()).resolves.toEqual([]);
  });
});
