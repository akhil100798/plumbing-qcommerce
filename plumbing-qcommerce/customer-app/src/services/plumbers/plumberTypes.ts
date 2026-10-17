import { ServiceOrderDTO } from '../orders/orderTypes';

export interface CreateOrderRequest {
  issueCategory?: string;
  description: string;
  latitude?: number | null;
  longitude?: number | null;
  requestType?: string;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  city?: string;
  postalCode?: string;
  contactPhone?: string;
  urgency?: string;
  scheduledFor?: string | null;
}

export type PlumberServiceOrderDTO = ServiceOrderDTO;
