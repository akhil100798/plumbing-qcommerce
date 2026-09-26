import { apiClient } from '../apiClient';

export interface UserAddressDTO {
  id: number;
  label: string;
  name: string;
  addressLine: string;
  phone: string;
}

export const AddressRepository = {
  getAddresses: async (): Promise<UserAddressDTO[]> => {
    const response = await apiClient.get<UserAddressDTO[]>('/users/me/addresses');
    return response.data;
  },

  addAddress: async (address: Omit<UserAddressDTO, 'id'>): Promise<UserAddressDTO> => {
    const response = await apiClient.post<UserAddressDTO>('/users/me/addresses', address);
    return response.data;
  },

  deleteAddress: async (id: number): Promise<void> => {
    await apiClient.delete(`/users/me/addresses/${id}`);
  },
};
