import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

export function resolveApiBaseUrl(env?: Record<string, string | undefined>): string {
  const explicit = env
    ? (env.EXPO_PUBLIC_API_BASE_URL || env.EXPO_PUBLIC_BACKEND_URL)
    : (process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BACKEND_URL);

  const envAppEnv = env ? env.EXPO_PUBLIC_APP_ENV : process.env.EXPO_PUBLIC_APP_ENV;
  const envVercelEnv = env ? env.VERCEL_ENV : process.env.VERCEL_ENV;
  const envNodeEnv = env ? env.NODE_ENV : process.env.NODE_ENV;

  const isStagingOrPreview = envAppEnv === 'staging'
    || envAppEnv === 'preview'
    || envVercelEnv === 'preview';

  if (explicit && explicit.trim()) {
    const cleaned = explicit.trim().replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
    if (isStagingOrPreview && cleaned.includes('plumbing-qcommerce.onrender.com')) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: Staging/preview build cannot target production backend URL (https://plumbing-qcommerce.onrender.com)!'
      );
    }
    return cleaned;
  }

  if (isStagingOrPreview) {
    throw new Error(
      'CRITICAL CONFIGURATION ERROR: EXPO_PUBLIC_API_BASE_URL is required for staging/preview builds. Silent fallback to production backend is strictly prohibited!'
    );
  }

  if (envNodeEnv === 'development' || envNodeEnv === 'test') {
    return 'http://localhost:8085';
  }

  return 'https://plumbing-qcommerce.onrender.com';
}

const BACKEND_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authToken: string | null = null;
let isRefreshing = false;
let failedQueue: any[] = [];

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

export const getAuthToken = async () => {
  if (!authToken) {
    authToken = await tokenStorage.getItem('authToken');
  }
  return authToken;
};

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const storedRefreshToken = await tokenStorage.getItem('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token found');
        }

        const response = await axios.post(`${BACKEND_URL}/api/v1/auth/refresh`, {
          refreshToken: storedRefreshToken,
        });

        const { token, refreshToken: newRefreshToken } = response.data;

        setAuthToken(token);
        setRefreshToken(newRefreshToken);

        processQueue(null, token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setAuthToken(null);
        setRefreshToken(null);
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    let message = 'An unexpected error occurred.';
    const data = error.response?.data as any;
    if (data && data.message) {
      message = data.message;
    } else if (data && data.error) {
      message = data.error;
    } else if (error.message) {
      message = error.message;
    }

    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message,
    });

    return Promise.reject(new Error(message));
  }
);
