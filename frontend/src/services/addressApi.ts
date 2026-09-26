import { fetchWithAuth } from './api';
import { Address, CreateAddressPayload } from '../types/address';

export const addressApi = {
  getAddresses: () => fetchWithAuth<Address[]>('/addresses'),
  getAddressById: (id: string) => fetchWithAuth<Address>(`/addresses/${id}`),
  createAddress: (payload: CreateAddressPayload) =>
    fetchWithAuth<Address>('/addresses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateAddress: (id: string, payload: Partial<CreateAddressPayload>) =>
    fetchWithAuth<Address>(`/addresses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteAddress: (id: string) =>
    fetchWithAuth<{ message: string }>(`/addresses/${id}`, {
      method: 'DELETE',
    }),
  setDefaultAddress: (id: string) =>
    fetchWithAuth<Address>(`/addresses/${id}/default`, {
      method: 'PATCH',
    }),
};
