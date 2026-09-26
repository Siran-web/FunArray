const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function fetchWithAuth<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // If unauthorized and we have a refresh token, attempt silent refresh
  if (response.status === 401 && typeof window !== 'undefined' && !endpoint.includes('/auth/')) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const refreshJson = await refreshRes.json();
            const newAccessToken = refreshJson.data?.accessToken;
            const newRefreshToken = refreshJson.data?.refreshToken;

            if (newAccessToken) {
              localStorage.setItem('access_token', newAccessToken);
              if (newRefreshToken) localStorage.setItem('refresh_token', newRefreshToken);
              onRefreshed(newAccessToken);
            }
          } else {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('auth_user');
          }
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('auth_user');
        } finally {
          isRefreshing = false;
        }
      }

      // Retry request with new token
      const retryToken = localStorage.getItem('access_token');
      if (retryToken) {
        headers['Authorization'] = `Bearer ${retryToken}`;
        response = await fetch(`${BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json?.error?.message || json?.message || 'An unexpected error occurred');
  }

  return json.data !== undefined ? json.data : json;
}

export default fetchWithAuth;
