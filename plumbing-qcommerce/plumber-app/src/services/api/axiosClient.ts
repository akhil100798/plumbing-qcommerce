import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from './tokenStorage';

const EXPLICIT_BACKEND_URL = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_BACKEND_URL;
const RAW_BACKEND_URL = EXPLICIT_BACKEND_URL || 'https://plumbing-qcommerce.onrender.com';
const BACKEND_URL = RAW_BACKEND_URL.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');

export const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
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

export const setAuthToken = async (token: string | null): Promise<void> => {
  authToken = token;
  if (token) {
    await tokenStorage.setItem('authToken', token);
  } else {
    await tokenStorage.deleteItem('authToken');
  }
};

export const setRefreshToken = async (token: string | null): Promise<void> => {
  if (token) {
    await tokenStorage.setItem('refreshToken', token);
  } else {
    await tokenStorage.deleteItem('refreshToken');
  }
};

/**
 * Persist the complete authenticated session before any protected bootstrap
 * request or authenticated navigation is allowed to continue.
 */
export const persistAuthSession = async (token: string, refreshToken: string): Promise<void> => {
  if (!token || !refreshToken) {
    throw new Error('Authentication response did not include the required session tokens.');
  }

  // Set the in-memory access token before the writes so requests issued by the
  // same JS turn are authenticated, then await both durable writes together.
  authToken = token;
  await Promise.all([
    tokenStorage.setItem('authToken', token),
    tokenStorage.setItem('refreshToken', refreshToken),
  ]);
};

export const clearAuthSession = async (): Promise<void> => {
  authToken = null;
  await Promise.all([
    tokenStorage.deleteItem('authToken'),
    tokenStorage.deleteItem('refreshToken'),
  ]);
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

    const isAuthenticationRequest = originalRequest.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthenticationRequest) {
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

        await persistAuthSession(token, newRefreshToken);

        processQueue(null, token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearAuthSession();
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
