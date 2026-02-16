export type Role = 'ADMIN' | 'REPARTIDOR';

export type OrderStatus = 'PENDIENTE' | 'ASIGNADO' | 'EN_REPARTO' | 'ENTREGADO';

export interface Session {
  token: string;
  userId: string;
  username: string;
  role: Role;
}

export interface Order {
  id: string;
  address: string;
  zone: string;
  scheduled_date: string;
  time_slot: string;
  quantity: number;
  notes?: string;
  status: OrderStatus;
  assignee_id?: string | null;
}

export interface StockSummary {
  date?: string | null;
  llenas_ingresadas: number;
  llenas_entregadas: number;
  vacias_recibidas: number;
  llenas_disponibles_estimadas: number;
  vacias_deposito_estimadas: number;
  pendientes_recuperar: number;
}

export interface DailyReport {
  date: string;
  entregas_dia: number;
  llenas_entregadas: number;
  vacias_recibidas: number;
  pendiente: number;
}
