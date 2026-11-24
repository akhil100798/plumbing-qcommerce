import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  apiRequest: vi.fn(),
}));

vi.mock('./apiClient', () => ({
  apiRequest: mocks.apiRequest,
}));

import { logout } from './superAdminService';

describe('admin superAdminService.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls /api/v1/auth/logout with POST method', async () => {
    mocks.apiRequest.mockResolvedValueOnce('Logged out successfully');

    const result = await logout();

    expect(mocks.apiRequest).toHaveBeenCalledWith('/api/v1/auth/logout', {
      method: 'POST',
      responseType: 'text',
    });
    expect(result).toBe('Logged out successfully');
  });
});
