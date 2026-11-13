import { describe, expect, it, vi } from 'vitest';

vi.mock('../tokenStorage', () => ({
  tokenStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    deleteItem: vi.fn(),
  },
}));

import { resolveApiBaseUrl } from '../axiosClient';

describe('plumber axiosClient resolveApiBaseUrl', () => {
  it('returns cleaned explicit URL when provided', () => {
    const url = resolveApiBaseUrl({
      EXPO_PUBLIC_API_BASE_URL: 'https://staging-backend.example.com/api/v1/',
      EXPO_PUBLIC_APP_ENV: 'staging',
    });
    expect(url).toBe('https://staging-backend.example.com');
  });

  it('throws error if staging build targets production backend URL', () => {
    expect(() => {
      resolveApiBaseUrl({
        EXPO_PUBLIC_API_BASE_URL: 'https://plumbing-qcommerce.onrender.com',
        EXPO_PUBLIC_APP_ENV: 'staging',
      });
    }).toThrow(/Staging\/preview build cannot target production backend URL/);
  });

  it('throws error if preview build targets production backend URL', () => {
    expect(() => {
      resolveApiBaseUrl({
        EXPO_PUBLIC_API_BASE_URL: 'https://plumbing-qcommerce.onrender.com',
        VERCEL_ENV: 'preview',
      });
    }).toThrow(/Staging\/preview build cannot target production backend URL/);
  });

  it('throws error if staging build has no explicit API base URL', () => {
    expect(() => {
      resolveApiBaseUrl({
        EXPO_PUBLIC_APP_ENV: 'staging',
      });
    }).toThrow(/EXPO_PUBLIC_API_BASE_URL is required for staging\/preview builds/);
  });

  it('returns localhost:8085 in test/development mode when unconfigured', () => {
    const devUrl = resolveApiBaseUrl({
      NODE_ENV: 'development',
    });
    expect(devUrl).toBe('http://localhost:8085');

    const testUrl = resolveApiBaseUrl({
      NODE_ENV: 'test',
    });
    expect(testUrl).toBe('http://localhost:8085');
  });

  it('returns production URL only in true non-staging production mode when unconfigured', () => {
    const prodUrl = resolveApiBaseUrl({
      NODE_ENV: 'production',
    });
    expect(prodUrl).toBe('https://plumbing-qcommerce.onrender.com');
  });
});
