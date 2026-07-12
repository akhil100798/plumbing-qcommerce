import { apiClient } from '../api/axiosClient';
import { ENDPOINTS } from '../api/endpoints';
import { Review } from '../../types';
import {
  canUseDevMockFallbacks,
  createBackendUnavailableError,
  warnUsingDevMockFallback,
} from '../mockPolicy';

const MOCK_REVIEWS: Review[] = [
  {
    id: 1,
    customerName: 'Rahul Mehta',
    rating: 5,
    comment: 'Very fast delivery and parts were exactly what the plumber needed. Great store!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 2,
    customerName: 'Priya Sharma',
    rating: 4,
    comment: 'Good quality parts, packaging could be better. Overall satisfied.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
  {
    id: 3,
    customerName: 'Amit Kumar',
    rating: 5,
    comment: 'Prompt response to the plumber material request. Will recommend!',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
  {
    id: 4,
    customerName: 'Sunita Rao',
    rating: 3,
    comment: 'Took a bit longer than expected but the part quality was fine.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
  },
];

export const reviewService = {
  getReviews: async (): Promise<Review[]> => {
    try {
      const response = await apiClient.get(ENDPOINTS.reviews.list);
      return response.data as Review[];
    } catch (e) {
      if (canUseDevMockFallbacks()) {
        warnUsingDevMockFallback('Store reviews list', e);
        return MOCK_REVIEWS;
      }
      throw createBackendUnavailableError('Store reviews', e);
    }
  },
};
