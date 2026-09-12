import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  InventoryTab: undefined;
  MaterialsTab: undefined;
  AccountTab: undefined;
};

export type AppStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Dashboard & Quick Actions
  Dashboard: undefined;
  SalesAnalytics: undefined;
  WeeklySummary: undefined;
  Wallet: undefined;
  LowStockAlert: undefined;
  Notifications: undefined;
  
  // Orders Stack
  Orders: undefined;
  OrderDetails: { orderId: number };
  Packing: { orderId: number; requestId?: number };
  ReadyForPickup: { orderId?: number; requestId?: number };
  CollectionConfirmation: { requestId: number };
  
  // Inventory Stack
  Inventory: undefined;
  ProductDetails: { productId: number };
  AddProduct: { productId?: number } | undefined;
  
  // Materials Request Stack
  MaterialRequests: undefined;
  MaterialRequestDetail: { requestId: number };
  
  // Dispatch Stack (feature-flagged, not active in MVP)
  DispatchAssignment: { orderId: number };
  
  // Settings & Promos
  ReviewsRatings: undefined;
  OffersPromotions: undefined;
  StoreProfile: undefined;
  Account: undefined;
};
