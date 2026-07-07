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
  return import('./mockPolicy');
}

describe('plumber mockPolicy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not return a localhost edge URL in staging', async () => {
    const policy = await loadPolicy();

    expect(policy.canUseDevMockFallbacks()).toBe(false);
    expect(policy.getConfiguredEdgeUrl()).toBeNull();
  });

  it('returns the local edge URL only for explicit local dev mode', async () => {
    const policy = await loadPolicy({
      apiBaseUrl: 'http://localhost:8081',
      allowMocks: 'true',
    });

    expect(policy.canUseDevMockFallbacks()).toBe(true);
    expect(policy.getConfiguredEdgeUrl()).toBe('http://localhost:3000');
  });
});
