/**
 * Spring Boot Backend DTOs & Entity Types for FixKart Customer App
 */

export interface AuthUserDto {
  id: number;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'PLUMBER' | 'STORE_MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
  phone?: string;
  phoneVerified?: boolean;
  profileComplete?: boolean;
  authProvider?: string;
  profileImageUrl?: string;
  status?: string;
  availability?: boolean;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  userId?: number;
  role?: string;
  email?: string;
  fullName?: string;
  phone?: string;
}

export interface UserAddress {
  id: number;
  label: string; // e.g. Home, Office, Other
  name: string; // Receiver name
  addressLine: string; // Full street address
  phone: string; // Contact number
}

export interface CategoryDTO {
  id: number;
  name: string;
  description?: string;
  parentId?: number | null;
}

export interface ProductDTO {
  id: number;
  sku?: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId?: number;
  categoryName?: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_PROGRESS'
  | 'COMBINED_ORDER'
  | 'MATERIALS_REQUIRED'
  | 'WAITING_FOR_STORE'
  | 'READY_FOR_PRODUCT_PICKUP'
  | 'PLUMBER_COLLECTING_PRODUCTS'
  | 'PRODUCTS_COLLECTED'
  | 'RETURNING_TO_CUSTOMER'
  | 'WORK_RESUMED'
  | 'CUSTOMER_CONFIRMED'
  | 'COMPLETED'
  | 'PAID'
  | 'CANCELLED';

export type RequestType = 'NEARBY_AUTO' | 'STORE_ROUTED' | 'DIRECT_PLUMBER';

export interface PlumberUserSummary {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  role?: string;
  rating?: number;
  experienceYears?: number;
  badge?: string;
  photoUrl?: string;
}

export interface StoreSummary {
  id: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export interface ServiceOrder {
  id: number;
  description: string;
  latitude: number;
  longitude: number;
  status: OrderStatus;
  requestType: RequestType;
  customer?: AuthUserDto;
  plumber?: PlumberUserSummary;
  store?: StoreSummary;
  partsCharge?: number;
  estimatedCost?: number;
  rating?: number;
  ratingComment?: string;
  createdAt?: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

export interface ServiceOrderStatusHistoryResponse {
  id: number;
  serviceOrderId: number;
  previousStatus?: string;
  newStatus: string;
  actorId?: number;
  actorRole?: string;
  reason?: string;
  timestamp: string;
}

export interface CustomerConfirmationResponse {
  orderId: number;
  status: string;
  message: string;
  timestamp: string;
}

export interface RatingRequest {
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  orderId: number;
  rating: number;
  comment?: string;
  ratedAt: string;
}

export type ProductOrderStatus =
  | 'PENDING'
  | 'REQUESTED'
  | 'STORE_REVIEWING'
  | 'APPROVED'
  | 'PARTIALLY_AVAILABLE'
  | 'REJECTED'
  | 'RESERVED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'PACKING'
  | 'READY_FOR_PICKUP'
  | 'PLUMBER_AT_STORE'
  | 'COLLECTED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED';

export interface MaterialRequestItemSummary {
  id: number;
  productId: number;
  productName: string;
  sku?: string;
  requestedQuantity: number;
  reservedQuantity?: number;
  collectedQuantity?: number;
  price: number;
}

export interface MaterialRequestSummaryResponse {
  id: number;
  serviceOrderId?: number;
  storeId?: number;
  storeName?: string;
  status: ProductOrderStatus;
  itemCount: number;
  totalAmount: number;
  createdAt?: string;
  items?: MaterialRequestItemSummary[];
}

export interface MaterialStatusHistoryResponse {
  id: number;
  previousStatus?: string;
  newStatus: string;
  actorRole?: string;
  reason?: string;
  timestamp: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ApiError {
  message: string;
  error?: string;
  status?: number;
}
