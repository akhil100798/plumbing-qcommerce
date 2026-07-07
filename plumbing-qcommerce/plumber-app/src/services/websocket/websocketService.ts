import io, { Socket } from 'socket.io-client';
import { JobOffer } from '../../types';
import { getConfiguredEdgeUrl } from '../mockPolicy';

let socket: Socket | null = null;

export const websocketService = {
  connect: (
    plumberId: string,
    onJobOffer: (offer: JobOffer) => void,
    onPartsEnRoute: (data: any) => void
  ): Socket | null => {
    const edgeUrl = getConfiguredEdgeUrl();
    if (!edgeUrl) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return null;
    }

    if (socket) {
      socket.disconnect();
    }

    socket = io(edgeUrl, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('Socket.io connected to edge gateway');
      socket?.emit('register_plumber', { plumberId });
    });

    socket.on('JOB_OFFER', (data: any) => {
      console.log('Received JOB_OFFER WebSocket event:', data);
      onJobOffer({
        jobId: data.jobId || `job_${Date.now()}`,
        customerId: data.customerId || 'cust_unknown',
        distance: data.distance || 0,
      });
    });

    socket.on('PARTS_EN_ROUTE', (data: any) => {
      console.log('Received PARTS_EN_ROUTE WebSocket event:', data);
      onPartsEnRoute(data);
    });

    socket.on('disconnect', () => {
      console.log('Socket.io disconnected');
    });

    return socket;
  },

  sendLocationPing: (plumberId: string, longitude: number, latitude: number): void => {
    if (socket && socket.connected) {
      socket.emit('location_ping', {
        plumberId,
        longitude,
        latitude,
      });
    }
  },

  disconnect: (): void => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },
};
