import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/client';

// Orders
export function useOrders(token: string, query = '') {
  return useQuery({
    queryKey: ['orders', token, query],
    queryFn: () => api.listOrders(token, query),
    enabled: !!token,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: any }) => api.createOrder(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useAssignOrders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, orderIds, driverId }: { token: string; orderIds: string[]; driverId: string }) => 
      api.assignOrders(token, orderIds, driverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

// Stock
export function useStockSummary(token: string) {
  return useQuery({
    queryKey: ['stockSummary', token],
    queryFn: () => api.stockSummary(token),
    enabled: !!token,
  });
}

export function useDailyReport(token: string, date: string) {
  return useQuery({
    queryKey: ['dailyReport', token, date],
    queryFn: () => api.dailyReport(token, date),
    enabled: !!token && !!date,
  });
}

export function useCreateInbound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: any }) => api.createInbound(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
    },
  });
}

// Deliveries
export function useRegisterDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: any }) => api.registerDelivery(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['stockSummary'] });
      queryClient.invalidateQueries({ queryKey: ['dailyReport'] });
    },
  });
}

export function useRegisterFailedDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ token, payload }: { token: string; payload: any }) => api.registerFailedDelivery(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
