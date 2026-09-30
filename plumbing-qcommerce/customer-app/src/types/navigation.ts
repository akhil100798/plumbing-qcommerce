import { LoginResponse } from '../services/auth/authTypes';

export type AuthStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Otp: { phone: string };
  CompleteProfile: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  StoreTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

export type AppStackParamList = {
  Auth: undefined;
  Main: undefined;
  Search: undefined;
  Categories: undefined;
  ProductListing: { categoryId: number; categoryName: string };
  ProductDetails: { productId: number };
  Cart: undefined;
  Address: { totalAmount: number };
  Payment: { totalAmount: number };
  OrderDetails: { orderId: number; type: 'product' | 'service' };
  OrderTracking: { orderId: number; type: 'product' | 'service' };
  BookPlumber: undefined;
  PlumberConfirmation: { issueType: string; issueCategory?: string; description?: string; urgency?: string; scheduledFor?: string | null };
  PlumberTracking: {
    orderId: number;
    plumberId?: string | null;
    plumberName: string | null;
    plumberPhone?: string | null;
    customerLatitude?: number | null;
    customerLongitude?: number | null;
    plumberLatitude?: number | null;
    plumberLongitude?: number | null;
    createdAt?: string | null;
    assignedAt?: string | null;
    estimatedArrivalAt?: string | null;
    status?: string | null;
  };
  MaterialApproval: { serviceOrderId: number; plumberName: string };
  ServiceCompletion: { plumberName: string };
  AddressManagement: undefined;
  PaymentMethods: undefined;
  Settings: undefined;
  Wallet: undefined;
  Offers: undefined;
  Support: undefined;
  Notifications: undefined;
  OrderConfirmation: { orderId: number; totalAmount: number; address: string; eta: string };
  StoreDetails: { storeId: number; storeName: string };
  Chat: { name: string; role: string };
};
