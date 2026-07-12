export const ENDPOINTS = {
  auth: {
    login: '/auth/login',
    sendOtp: '/auth/send-otp',
    verifyOtp: '/auth/verify-otp',
    refresh: '/auth/refresh',
  },
  dashboard: {
    metrics: '/ai/dashboard-metrics',
    forecast: '/ai/demand-forecast',
  },
  store: {
    list: '/stores',
    me: '/stores/me',
    meInventory: '/stores/me/inventory',
    details: (id: number) => `/stores/${id}`,
    inventory: (id: number) => `/stores/${id}/inventory`,
    updateStock: (storeId: number, productId: number) => `/stores/${storeId}/inventory/${productId}`,
  },
  catalog: {
    categories: '/catalog/categories',
    products: '/catalog/products',
    productDetails: (id: number) => `/catalog/products/${id}`,
  },
  orders: {
    byStatus: (status: string) => `/checkout/orders/status/${status}`,
    details: (id: number) => `/checkout/orders/${id}`,
    accept: (id: number) => `/checkout/orders/${id}/accept`,
    pack: (id: number) => `/checkout/orders/${id}/pack`,
    handover: (id: number) => `/checkout/orders/${id}/handover`,
  },
  delivery: {
    partners: '/delivery/partners',
  },
  materialRequests: {
    store: '/checkout/material-requests/store',
  },
  wallet: {
    balance: '/wallet',
    transactions: '/wallet/transactions',
  },
  reviews: {
    list: '/reviews/store',
  },
  notifications: {
    list: '/notifications',
    markRead: (id: number) => `/notifications/${id}/read`,
    markAllRead: '/notifications/read-all',
  },
};
