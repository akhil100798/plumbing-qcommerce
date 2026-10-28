import { describe, expect, it } from 'vitest';
import { resolveAdminBaseUrl } from '../apiClient';

describe('admin apiClient resolveAdminBaseUrl', () => {
  it('returns cleaned explicit URL when provided', () => {
    const url = resolveAdminBaseUrl({
      NEXT_PUBLIC_API_BASE_URL: 'https://staging-backend.example.com/api/v1/',
      NEXT_PUBLIC_APP_ENV: 'staging',
    });
    expect(url).toBe('https://staging-backend.example.com');
  });

  it('throws error if staging build targets production backend URL', () => {
    expect(() => {
      resolveAdminBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: 'https://plumbing-qcommerce.onrender.com',
        NEXT_PUBLIC_APP_ENV: 'staging',
      });
    }).toThrow(/Staging\/preview admin build cannot target production backend URL/);
  });

  it('throws error if preview build targets production backend URL', () => {
    expect(() => {
      resolveAdminBaseUrl({
        NEXT_PUBLIC_API_BASE_URL: 'https://plumbing-qcommerce.onrender.com',
        VERCEL_ENV: 'preview',
      });
    }).toThrow(/Staging\/preview admin build cannot target production backend URL/);
  });

  it('throws error if staging build has no explicit API base URL', () => {
    expect(() => {
      resolveAdminBaseUrl({
        NEXT_PUBLIC_APP_ENV: 'staging',
      });
    }).toThrow(/NEXT_PUBLIC_API_BASE_URL is required for staging\/preview builds/);
  });

  it('returns localhost:8081 by default when unconfigured in non-staging environment', () => {
    const defaultUrl = resolveAdminBaseUrl({
      NODE_ENV: 'development',
    });
    expect(defaultUrl).toBe('http://localhost:8081');
  });
});
