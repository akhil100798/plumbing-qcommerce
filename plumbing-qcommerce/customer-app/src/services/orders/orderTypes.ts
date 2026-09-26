export interface ServiceOrderDTO {
  id: number;
  description: string;
  latitude: number;
  longitude: number;
  status: string;
  requestType: string;
  createdAt: string;
  totalCharge?: number;
  baseCharge?: number;
  partsCharge?: number;
  plumber?: {
    id: number;
    fullName: string;
    phone: string;
  } | null;
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
