import { Order } from '../types';

export type RootStackParamList = {
  Login: undefined;
  ModeSelect: { role: 'ADMIN' | 'REPARTIDOR'; username: string };
  AdminDashboard: undefined;
  DriverDashboard: undefined;
};

export type AdminTabParamList = {
  Orders: undefined;
  Stock: undefined;
};

export type DriverTabParamList = {
  AssignedOrders: undefined;
  DeliveryDetail: { order: Order };
};
