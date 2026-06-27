import { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  InventoryTab: undefined;
  DispatchTab: undefined;
  AccountTab: undefined;
};

export type AppStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  
  // Dashboard & Quick Actions
  Dashboard: undefined;
  SalesAnalytics: undefined;
  Wallet: undefined;
  LowStockAlert: undefined;
  Notifications: undefined;
  
  // Orders Stack
  Orders: undefined;
  OrderDetails: { orderId: number };
  Packing: { orderId: number };
  ReadyForPickup: { orderId: number };
  
  // Inventory Stack
  Inventory: undefined;
  ProductDetails: { productId: number };
  AddProduct: { productId?: number } | undefined;
  
  // Materials Request Stack
  MaterialRequests: undefined;
  
  // Dispatch Stack
  DispatchAssignment: { orderId: number };
  
  // Settings & Promos
  ReviewsRatings: undefined;
  OffersPromotions: undefined;
  StoreProfile: undefined;
  Account: undefined;
};
