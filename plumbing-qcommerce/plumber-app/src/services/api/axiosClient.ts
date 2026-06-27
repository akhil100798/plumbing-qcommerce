import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8081';

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

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    SecureStore.setItemAsync('authToken', token).catch((err) =>
      console.error('Failed to save auth token to SecureStore:', err)
    );
  } else {
    SecureStore.deleteItemAsync('authToken').catch((err) =>
      console.error('Failed to delete auth token from SecureStore:', err)
    );
  }
};

export const setRefreshToken = (token: string | null) => {
  if (token) {
    SecureStore.setItemAsync('refreshToken', token).catch((err) =>
      console.error('Failed to save refresh token to SecureStore:', err)
    );
  } else {
    SecureStore.deleteItemAsync('refreshToken').catch((err) =>
      console.error('Failed to delete refresh token from SecureStore:', err)
    );
  }
};

export const getAuthToken = async () => {
  if (!authToken) {
    authToken = await SecureStore.getItemAsync('authToken');
  }
  return authToken;
};

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized Error Handling and Token Refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried
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
        const storedRefreshToken = await SecureStore.getItemAsync('refreshToken');
        if (!storedRefreshToken) {
          throw new Error('No refresh token found');
        }

        // Call the refresh endpoint directly to avoid request interceptor recursion
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
        // Clear tokens if refresh fails
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
