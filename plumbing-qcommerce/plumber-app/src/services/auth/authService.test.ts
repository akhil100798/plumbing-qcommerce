import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  setAuthToken: vi.fn(),
  setRefreshToken: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  apiClient: {
    post: mocks.post,
  },
  setAuthToken: mocks.setAuthToken,
  setRefreshToken: mocks.setRefreshToken,
}));

import { authService } from './authService';
import { ENDPOINTS } from '../api/endpoints';

describe('plumber authService.logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('invokes backend logout endpoint and clears local tokens', async () => {
    mocks.post.mockResolvedValueOnce({ data: { message: 'Logged out successfully' } });

    await authService.logout();

    expect(mocks.post).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGOUT);
    expect(mocks.setAuthToken).toHaveBeenCalledWith(null);
    expect(mocks.setRefreshToken).toHaveBeenCalledWith(null);
  });

  it('clears local tokens even if backend logout fails with network error', async () => {
    mocks.post.mockRejectedValueOnce(new Error('Network error'));

    await authService.logout();

    expect(mocks.post).toHaveBeenCalledWith(ENDPOINTS.AUTH.LOGOUT);
    expect(mocks.setAuthToken).toHaveBeenCalledWith(null);
    expect(mocks.setRefreshToken).toHaveBeenCalledWith(null);
  });
});
