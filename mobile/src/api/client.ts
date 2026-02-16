import { DailyReport, Order, Role, StockSummary } from '../types';

const DEFAULT_API_BASE_URL = 'http://localhost:8080';
const REQUEST_TIMEOUT_MS = 12000;
const NETWORK_RETRIES = 1;

const API_BASE_URL = normalizeApiBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL,
);

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

function parseErrorBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return '';

  try {
    const parsed = JSON.parse(trimmed) as { error?: string };
    if (typeof parsed.error === 'string' && parsed.error.trim()) {
      return parsed.error.trim();
    }
  } catch {
    // El backend no siempre responde JSON; usamos texto plano como fallback.
  }

  return trimmed;
}

function humanizeHttpError(status: number, body: string): string {
  const parsedBody = parseErrorBody(body);
  if (status === 401) {
    return 'Sesión inválida o expirada. Volvé a iniciar sesión.';
  }
  if (status === 403) {
    return parsedBody || 'No tenés permisos para esta acción.';
  }
  if (status === 404) {
    return parsedBody || 'Recurso no encontrado.';
  }
  if (status >= 500) {
    return parsedBody || 'Error interno del servidor.';
  }
  return parsedBody || `Error HTTP ${status}`;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

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

  const url = `${API_BASE_URL}${path}`;
  for (let attempt = 0; attempt <= NETWORK_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(humanizeHttpError(response.status, body));
      }

      if (response.status === 204) {
        return {} as T;
      }

      return (await response.json()) as T;
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      const isNetwork = err instanceof TypeError || isTimeout;
      const canRetry = isNetwork && attempt < NETWORK_RETRIES;

      if (canRetry) {
        continue;
      }

      if (isTimeout) {
        throw new Error(
          `La API tardó demasiado en responder (${REQUEST_TIMEOUT_MS}ms). URL: ${API_BASE_URL}`,
        );
      }

      if (err instanceof TypeError) {
        throw new Error(
          `No se pudo conectar con la API. Revisá EXPO_PUBLIC_API_BASE_URL (${API_BASE_URL}) y que el backend esté activo.`,
        );
      }

      throw err as Error;
    }
  }
  throw new Error('No se pudo completar la solicitud.');
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

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
