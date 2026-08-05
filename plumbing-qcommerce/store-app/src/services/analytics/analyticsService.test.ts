import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

async function loadAnalyticsService(options?: {
  apiBaseUrl?: string;
  allowMocks?: string;
}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  getMock.mockReset();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', options?.apiBaseUrl ?? 'https://plumbing-qcommerce.onrender.com');
  vi.stubEnv('EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS', options?.allowMocks ?? 'false');
  vi.doMock('../api/axiosClient', () => ({
    apiClient: {
      get: getMock,
    },
  }));
  return import('./analyticsService');
}

describe('store analyticsService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('throws instead of fabricating analytics in staging when the backend fails', async () => {
    const { analyticsService } = await loadAnalyticsService();
    getMock.mockRejectedValueOnce(new Error('analytics missing'));

    await expect(analyticsService.getSalesAnalytics()).rejects.toThrow('analytics missing');
  });

  it('never fabricates analytics when the legacy mock flag is enabled', async () => {
    const { analyticsService } = await loadAnalyticsService({
      apiBaseUrl: 'http://localhost:8081',
      allowMocks: 'true',
    });
    getMock.mockRejectedValueOnce(new Error('offline'));

    await expect(analyticsService.getSalesAnalytics()).rejects.toThrow('offline');
  });
});
