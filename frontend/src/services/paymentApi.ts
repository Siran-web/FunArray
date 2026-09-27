import { fetchWithAuth } from './api';

export interface CreatePaymentPayload {
  orderId: string;
  paymentMethod?: string;
  provider?: string;
  currency?: string;
}

export interface PaymentDto {
  id: string;
  orderId: string;
  orderNumber: string;
  provider: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
}

export const paymentApi = {
  createPayment: (payload: CreatePaymentPayload) =>
    fetchWithAuth<PaymentDto>('/payments/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getPaymentForOrder: (orderId: string) =>
    fetchWithAuth<PaymentDto>(`/payments/order/${orderId}`),
};
