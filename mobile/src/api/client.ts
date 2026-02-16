import { DailyReport, Order, Role, StockSummary } from '../types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

export async function login(username: string, password: string): Promise<string> {
  const response = await request<{ access_token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

  return response.access_token;
}

export async function me(token: string): Promise<{ id: string; username: string; role: Role }> {
  return request('/me', { method: 'GET' }, token);
}

export async function listOrders(token: string, query = ''): Promise<Order[]> {
  const suffix = query ? `?${query}` : '';
  return request(`/orders${suffix}`, { method: 'GET' }, token);
}

export async function createOrder(
  token: string,
  payload: {
    address: string;
    zone: string;
    scheduled_date: string;
    time_slot: string;
    quantity: number;
    notes?: string;
  },
): Promise<Order> {
  return request('/orders', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function assignOrders(token: string, orderIds: string[], driverId: string): Promise<void> {
  await request('/dispatch/assign', {
    method: 'POST',
    body: JSON.stringify({ order_ids: orderIds, driver_id: driverId }),
  }, token);
}

export async function registerDelivery(
  token: string,
  payload: { order_id: string; llenas_entregadas: number; vacias_recibidas: number; notes?: string },
): Promise<void> {
  await request('/deliveries', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function registerFailedDelivery(
  token: string,
  payload: { order_id: string; reason: string; reprogram_date?: string; reprogram_time_slot?: string },
): Promise<void> {
  await request('/deliveries/failed', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function createInbound(
  token: string,
  payload: { date: string; cantidad_llenas: number; notes?: string },
): Promise<void> {
  await request('/stock/inbounds', { method: 'POST', body: JSON.stringify(payload) }, token);
}

export async function stockSummary(token: string): Promise<StockSummary> {
  return request('/stock/summary', { method: 'GET' }, token);
}

export async function dailyReport(token: string, date: string): Promise<DailyReport> {
  return request(`/reports/daily?date=${encodeURIComponent(date)}`, { method: 'GET' }, token);
}
