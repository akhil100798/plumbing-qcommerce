export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH: '/auth/refresh',
  },
  ORDERS: {
    ACCEPT: (id: string | number) => `/orders/${id}/accept`,
    START: (id: string | number) => `/orders/${id}/start`,
    COMPLETE: (id: string | number) => `/orders/${id}/complete`,
    CANCEL: (id: string | number) => `/orders/${id}/cancel`,
    BY_STATUS: (status: string) => `/orders/status/${status}`,
    GET_BY_ID: (id: string | number) => `/orders/${id}`,
    PLUMBER_ASSIGNED: '/orders/plumber',
  },
  DELIVERY: {
    MATERIAL_REQUEST: '/delivery/material-request',
    STATUS: (id: string | number) => `/delivery/${id}/status`,
  },
  WALLET: {
    GET_WALLET: '/wallet',
    TRANSACTIONS: '/wallet/transactions',
  },
  USER: {
    ME: '/users/me',
    UPDATE_AVAILABILITY: '/users/me/availability',
  },
  CATALOG: {
    SEARCH: '/catalog/products', // Assume catalog search route
  },
};
