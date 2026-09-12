import { tokenStorage } from './tokenStorage';

const env: Record<string, string | undefined> =
  typeof process !== 'undefined' && process.env
    ? (process.env as Record<string, string | undefined>)
    : {};

const EXPLICIT_BACKEND_URL =
  env.EXPO_PUBLIC_API_BASE_URL ||
  env.EXPO_PUBLIC_BACKEND_URL ||
  env.NEXT_PUBLIC_API_BASE_URL;

const RAW_BACKEND_URL = EXPLICIT_BACKEND_URL || 'https://fixkart-dev2-backend.onrender.com';
export const BACKEND_URL = RAW_BACKEND_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

let authToken: string | null = null;
let refreshTokenStr: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    tokenStorage.setItem('authToken', token).catch((err) =>
      console.error('Failed to save auth token:', err)
    );
  } else {
    tokenStorage.deleteItem('authToken').catch((err) =>
      console.error('Failed to delete auth token:', err)
    );
  }
};

export const setRefreshToken = (token: string | null) => {
  refreshTokenStr = token;
  if (token) {
    tokenStorage.setItem('refreshToken', token).catch((err) =>
      console.error('Failed to save refresh token:', err)
    );
  } else {
    tokenStorage.deleteItem('refreshToken').catch((err) =>
      console.error('Failed to delete refresh token:', err)
    );
  }
};

export const getAuthToken = async (): Promise<string | null> => {
  if (!authToken) {
    authToken = await tokenStorage.getItem('authToken');
  }
  return authToken;
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (!refreshTokenStr) {
    refreshTokenStr = await tokenStorage.getItem('refreshToken');
  }
  return refreshTokenStr;
};

export const clearTokens = async () => {
  authToken = null;
  refreshTokenStr = null;
  await tokenStorage.deleteItem('authToken');
  await tokenStorage.deleteItem('refreshToken');
  await tokenStorage.deleteItem('currentUser');
};

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  skipAuth?: boolean;
}

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 25000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. The server might be waking up.', 408);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function request<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  const token = options.skipAuth ? null : await getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(url, { ...options, headers }, options.timeoutMs ?? 25000);
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.message || 'Network request failed. Please check your connection.', 0);
  }

  // Handle 401 Unauthorized for token refresh
  if (response.status === 401 && !options.skipAuth && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/verify-otp')) {
    if (isRefreshing) {
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            if (newToken) {
              const retryHeaders = new Headers(options.headers || {});
              retryHeaders.set('Authorization', `Bearer ${newToken}`);
              request<T>(endpoint, { ...options, headers: retryHeaders }).then(resolve).catch(reject);
            } else {
              reject(new ApiError('Session expired. Please log in again.', 401));
            }
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const storedRefreshToken = await getRefreshToken();
      if (!storedRefreshToken) {
        throw new ApiError('No refresh token available', 401);
      }

      const refreshResponse = await fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new ApiError('Refresh token expired', 401);
      }

      const refreshData = await refreshResponse.json();
      const newAccessToken = refreshData.token;
      const newRefreshToken = refreshData.refreshToken;

      setAuthToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }

      processQueue(null, newAccessToken);

      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set('Authorization', `Bearer ${newAccessToken}`);
      return request<T>(endpoint, { ...options, headers: retryHeaders });
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      await clearTokens();
      throw new ApiError('Session expired. Please log in again.', 401);
    } finally {
      isRefreshing = false;
    }
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  let data: any = null;
  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    let message = 'An unexpected error occurred.';
    if (data && typeof data === 'object') {
      message = data.message || data.error || JSON.stringify(data);
    } else if (typeof data === 'string' && data.length > 0) {
      message = data;
    } else {
      message = `Request failed with status ${response.status}`;
    }
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const apiClient = {
  get: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(url: string, body?: any, options?: RequestOptions) =>
    request<T>(url, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
    }),

  delete: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
