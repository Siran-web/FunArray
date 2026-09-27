import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError, fetchWithAuth } from '../services/api';

describe('API Error States & Exception Handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should throw ApiError with status and message for 400 Bad Request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Invalid product input data',
          fieldErrors: {
            name: 'Product name must be between 3 and 255 characters',
            basePrice: 'Price must be positive',
          },
        },
      }),
    } as any);

    await expect(fetchWithAuth('/products', { method: 'POST' })).rejects.toThrow(ApiError);

    try {
      await fetchWithAuth('/products', { method: 'POST' });
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(400);
      expect(err.code).toBe('VALIDATION_FAILED');
      expect(err.fieldErrors?.name).toBe('Product name must be between 3 and 255 characters');
      expect(err.fieldErrors?.basePrice).toBe('Price must be positive');
    }
  });

  it('should handle 401 Unauthorized errors and throw ApiError', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Full authentication is required to access this resource',
        },
      }),
    } as any);

    await expect(fetchWithAuth('/customer/orders')).rejects.toThrow(ApiError);

    try {
      await fetchWithAuth('/customer/orders');
    } catch (err: any) {
      expect(err.status).toBe(401);
      expect(err.code).toBe('UNAUTHORIZED');
    }
  });

  it('should handle 429 Rate Limit error with standard user-friendly notice', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as any);

    try {
      await fetchWithAuth('/auth/login');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.status).toBe(429);
      expect(err.message).toContain('Rate limit exceeded');
    }
  });

  it('should handle 500 Internal Server error with fallback message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred while processing your request.',
        },
      }),
    } as any);

    try {
      await fetchWithAuth('/orders/checkout');
    } catch (err: any) {
      expect(err.status).toBe(500);
      expect(err.code).toBe('INTERNAL_SERVER_ERROR');
    }
  });

  it('should return valid data response on HTTP 200/201 success', async () => {
    const mockData = { id: 'order-999', totalAmount: 75000, status: 'CONFIRMED' };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: mockData,
      }),
    } as any);

    const result = await fetchWithAuth('/orders/order-999');
    expect(result).toEqual(mockData);
  });
});
