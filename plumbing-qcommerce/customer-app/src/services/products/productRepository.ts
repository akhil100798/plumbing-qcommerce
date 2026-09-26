import { apiClient } from '../apiClient';
import { CategoryDTO, ProductDTO } from './productTypes';

export const ProductRepository = {
  getCategories: async (): Promise<CategoryDTO[]> => {
    const response = await apiClient.get<CategoryDTO[]>('/catalog/categories');
    return response.data;
  },

  getProducts: async (categoryId?: number): Promise<ProductDTO[]> => {
    const params = categoryId ? { categoryId } : undefined;
    const response = await apiClient.get<ProductDTO[]>('/catalog/products', { params });
    return response.data;
  },

  getProductById: async (id: number): Promise<ProductDTO> => {
    const response = await apiClient.get<ProductDTO>(`/catalog/products/${id}`);
    return response.data;
  },
};
