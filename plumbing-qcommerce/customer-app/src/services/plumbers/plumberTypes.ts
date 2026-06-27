import { ServiceOrderDTO } from '../orders/orderTypes';

export interface CreateOrderRequest {
  description: string;
  latitude: number;
  longitude: number;
  requestType?: string;
}

export type PlumberServiceOrderDTO = ServiceOrderDTO;
