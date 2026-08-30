/**
 * Centralized API Client Service for DispatchHub
 * Uses relative "/api" base URL proxied by Vite to http://localhost:5000 in local dev
 */

export const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`[API Service Error] Failed fetch from ${url}:`, error);
    throw new Error(`API fetch error on ${url}: ${error.message}`);
  }
}

export default {
  getHealth: () => fetchApi('/health'),
  getRetailers: () => fetchApi('/retailers'),
  getCustomers: () => fetchApi('/customers'),
  getDispatchers: () => fetchApi('/dispatchers'),
  getRiders: () => fetchApi('/riders'),
  getOrders: () => fetchApi('/orders'),
  getMetrics: (retailerId) => fetchApi(`/metrics${retailerId ? `?retailer_id=${retailerId}` : ''}`)
};
