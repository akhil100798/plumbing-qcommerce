import { Rider, Order } from '../../types';
import { mockRiders } from '../../mocks';
import { ordersService } from '../orders/ordersService';

export const dispatchService = {
  getAvailableRiders: async (): Promise<Rider[]> => {
    // TODO: Connect to backend GET /api/v1/delivery/available or rider location APIs
    return mockRiders;
  },

  assignRider: async (orderId: number, riderId: number): Promise<Rider> => {
    // TODO: Connect to backend PATCH /api/v1/delivery/{orderId}/accept with rider parameter
    const rider = mockRiders.find(r => r.id === riderId);
    if (!rider) throw new Error('Rider not found');
    
    // Update the local order to reference this rider and set status to OUT_FOR_DELIVERY or READY_FOR_PICKUP
    const order = await ordersService.getOrderDetails(orderId);
    if (order) {
      order.deliveryPartnerName = rider.fullName;
      order.deliveryPartnerPhone = rider.phone;
      order.deliveryOtp = '7234';
      order.status = 'OUT_FOR_DELIVERY';
    }
    return rider;
  }
};
