import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  persistAuthSession: vi.fn(),
  clearAuthSession: vi.fn(),
  fetchProfile: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({
  apiClient: { post: mocks.post },
  persistAuthSession: mocks.persistAuthSession,
  clearAuthSession: mocks.clearAuthSession,
}));

vi.mock('../profile/profileService', () => ({
  profileService: { fetchProfile: mocks.fetchProfile },
}));

import { authService } from './authService';

const profile = {
  id: '42',
  fullName: 'QA Plumber',
  phone: '9876543210',
  email: 'qa@example.test',
  rating: 0,
  ratingsCount: 0,
  plumberId: 'PLB42',
  availability: false,
};

describe('plumber registration session contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.persistAuthSession.mockResolvedValue(undefined);
    mocks.clearAuthSession.mockResolvedValue(undefined);
    mocks.fetchProfile.mockResolvedValue(profile);
  });

  it('maps the canonical accessToken, persists both tokens, then bootstraps profile', async () => {
    const order: string[] = [];
    mocks.post.mockResolvedValue({
      status: 201,
      data: {
        accessToken: 'canonical-access-token',
        token: 'legacy-token',
        refreshToken: 'refresh-token',
        role: 'PLUMBER',
      },
    });
    mocks.persistAuthSession.mockImplementation(async () => {
      order.push('persist');
    });
    mocks.fetchProfile.mockImplementation(async () => {
      order.push('profile');
      return profile;
    });

    const result = await authService.register({
      fullName: 'QA Plumber',
      email: 'qa@example.test',
      phone: '9876543210',
      password: 'QaOnly!Pass123',
      confirmPassword: 'QaOnly!Pass123',
    });

    expect(mocks.post).toHaveBeenCalledWith('/auth/register/plumber', expect.any(Object));
    expect(mocks.persistAuthSession).toHaveBeenCalledWith('canonical-access-token', 'refresh-token');
    expect(order).toEqual(['persist', 'profile']);
    expect(result).toEqual({
      plumber: profile,
      token: 'canonical-access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('accepts the legacy token field only as a compatibility fallback', async () => {
    mocks.post.mockResolvedValue({
      status: 201,
      data: { token: 'legacy-access-token', refreshToken: 'refresh-token' },
    });

    await authService.register({
      fullName: 'QA Plumber',
      email: 'qa@example.test',
      phone: '9876543210',
      password: 'QaOnly!Pass123',
      confirmPassword: 'QaOnly!Pass123',
    });

    expect(mocks.persistAuthSession).toHaveBeenCalledWith('legacy-access-token', 'refresh-token');
  });

  it('does not bootstrap a protected profile when registration omits session tokens', async () => {
    mocks.post.mockResolvedValue({ status: 201, data: { role: 'PLUMBER' } });

    await expect(authService.register({
      fullName: 'QA Plumber',
      email: 'qa@example.test',
      phone: '9876543210',
      password: 'QaOnly!Pass123',
      confirmPassword: 'QaOnly!Pass123',
    })).rejects.toThrow('complete authenticated session');

    expect(mocks.persistAuthSession).not.toHaveBeenCalled();
    expect(mocks.fetchProfile).not.toHaveBeenCalled();
  });

  it('clears the same session boundary used by registration on logout', async () => {
    await authService.logout();
    expect(mocks.clearAuthSession).toHaveBeenCalledOnce();
  });
});
