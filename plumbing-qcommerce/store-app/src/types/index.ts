// Domain types for PlumbCommerce Store Partner App

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: 'CUSTOMER' | 'PLUMBER' | 'STORE_MANAGER' | 'ADMIN';
}

export interface Store {
  id: number;
  name: string;
  description?: string;
  address?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  phone?: string;
  email?: string;
  imageUrl?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  mrp: number;
  discount?: number;
  imageUrl?: string;
  categoryId: number;
  categoryName: string;
  stock: number;
  brand?: string;
  gst?: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number | null;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  storeId: number;
  storeName: string;
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PACKING' | 'PACKED' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  deliveryPartnerName?: string | null;
  deliveryPartnerPhone?: string | null;
  deliveryOtp?: string | null;
  estimatedDeliveryAt?: string | null;
  createdAt: string;
  items: OrderItem[];
  address?: string;
  packingNote?: string;
}

export interface Rider {
  id: number;
  fullName: string;
  phone: string;
  rating: number;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  status: 'AVAILABLE' | 'BUSY';
  eta?: string;
}

export interface MaterialRequest {
  id: number;
  serviceOrderId: number;
  storeId: number;
  plumberId: number;
  plumberName: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';
  createdAt: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  description: string;
  createdAt: string;
}

export interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Offer {
  id: number;
  code: string;
  description: string;
  value: number;
  type: 'PERCENTAGE' | 'FLAT' | 'FREE_DELIVERY';
  minOrderAmount: number;
  active: boolean;
  expiryDate: string;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'NEW_ORDER' | 'RIDER_ASSIGNED' | 'PAYMENT_RECEIVED' | 'LOW_STOCK' | 'OFFER_ACTIVATED';
}
