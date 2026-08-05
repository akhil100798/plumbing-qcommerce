import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadPolicy(options?: {
  apiBaseUrl?: string;
  allowMocks?: string;
  edgeUrl?: string;
}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.stubEnv('NODE_ENV', 'test');
  vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', options?.apiBaseUrl ?? 'https://plumbing-qcommerce.onrender.com');
  vi.stubEnv('EXPO_PUBLIC_ALLOW_MOCK_FALLBACKS', options?.allowMocks ?? 'false');
  vi.stubEnv('EXPO_PUBLIC_EDGE_URL', options?.edgeUrl ?? '');
  vi.stubEnv('EXPO_PUBLIC_EDGE_SERVER_URL', options?.edgeUrl ?? '');
  return import('./mockPolicy');
}

describe('customer mockPolicy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not fall back to localhost edge in staging', async () => {
    const policy = await loadPolicy();

    expect(policy.canUseDevMockFallbacks()).toBe(false);
    expect(policy.getConfiguredEdgeUrl()).toBeNull();
    expect(policy.isEdgeFeatureAvailable()).toBe(false);
  });

  it('keeps mock and implicit local edge fallbacks disabled in local mode', async () => {
    const policy = await loadPolicy({
      apiBaseUrl: 'http://localhost:8081',
      allowMocks: 'true',
    });

    expect(policy.canUseDevMockFallbacks()).toBe(false);
    expect(policy.getConfiguredEdgeUrl()).toBeNull();
    expect(policy.isEdgeFeatureAvailable()).toBe(false);
  });
});
