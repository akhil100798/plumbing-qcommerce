export interface ServiceOrderDTO {
  id: number;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  issueCategory?: string | null;
  urgency?: string | null;
  scheduledFor?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  landmark?: string | null;
  city?: string | null;
  postalCode?: string | null;
  customerPhoneSnapshot?: string | null;
  visitFee?: number | null;
  currency?: string | null;
  assignedAt?: string | null;
  estimatedArrivalAt?: string | null;
  plumberName?: string | null;
  plumberPhone?: string | null;
  arrivedAt?: string | null;
  startedAt?: string | null;
  status: string;
  customerFacingStatus?: string | null;
  completedAt?: string | null;
  totalAmount?: number | null;
  requestType: string;
  createdAt: string;
  totalCharge?: number;
  baseCharge?: number;
  partsCharge?: number;
  cancellationEligible?: boolean;
}

export interface OrderStatusDTO {
  id: number;
  status: string;
  totalAmount: number;
  deliveryPartnerName?: string;
  deliveryPartnerPhone?: string;
  deliveryPartnerRating?: number;
  otp?: string;
}

export interface PaymentRequestDTO {
  orderId: number;
  amount: number;
  paymentMethod: string;
}

export interface PaymentResponseDTO {
  status: string;
  transactionId: string;
  message: string;
}

export interface CustomerConfirmationResponse {
  orderId: number;
  status: string;
  confirmedAt?: string | null;
  message: string;
}

export interface RatingRequest {
  rating: number;
  comment?: string;
}

export interface RatingResponse {
  orderId: number;
  rating: number;
  comment?: string;
  ratedAt?: string;
}
