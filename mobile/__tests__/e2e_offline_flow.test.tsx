import React from 'react';
import { act, fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import App from '../App';
import fetchMock from 'jest-fetch-mock';
import { useDeliveryStore } from '../src/store/deliveryStore';

describe('E2E: Offline Delivery Flow', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    useDeliveryStore.getState().queue = []; // Clear queue
  });

  it('queues a delivery when network is down and syncs when it comes back', async () => {
    // 1. Initial Mocks (Login and List Orders)
    fetchMock.mockResponse((req) => {
      if (req.url.endsWith('/auth/login')) {
        return Promise.resolve(JSON.stringify({ access_token: 'fake-driver-jwt' }));
      }
      if (req.url.endsWith('/me')) {
        return Promise.resolve(JSON.stringify({ id: 'd1', username: 'driver', role: 'REPARTIDOR' }));
      }
      if (req.url.includes('/orders')) {
        return Promise.resolve(JSON.stringify({
          items: [{ id: 'o1', address: 'Calle 123', status: 'ASIGNADO', scheduled_date: '2026-02-16', time_slot: 'MAÑANA' }],
          total: 1, page: 1, page_size: 20, total_pages: 1
        }));
      }
      return Promise.reject(new Error('Unknown URL: ' + req.url));
    });

    render(<App />);

    // 2. Login
    const userInput = await screen.findByPlaceholderText('admin');
    fireEvent.changeText(userInput, 'driver');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'driver123');
    fireEvent.press(screen.getByText('Iniciar Sesión'));

    // 3. Select Mode
    await waitFor(() => expect(screen.getByText('Panel Repartidor')).toBeTruthy());
    fireEvent.press(screen.getByText('Panel Repartidor'));

    // 4. Select Order
    await waitFor(() => expect(screen.getByText('Calle 123')).toBeTruthy());
    fireEvent.press(screen.getByText('Calle 123'));

    // 5. Simulate Network Failure only for delivery
    fetchMock.mockResponse((req) => {
      if (req.url.endsWith('/deliveries')) {
        return Promise.reject(new TypeError('Network request failed'));
      }
      if (req.url.includes('/orders')) {
        return Promise.resolve(JSON.stringify({
          items: [{ id: 'o1', address: 'Calle 123', status: 'ASIGNADO', scheduled_date: '2026-02-16', time_slot: 'MAÑANA' }],
          total: 1, page: 1, page_size: 20, total_pages: 1
        }));
      }
      return Promise.resolve(JSON.stringify({}));
    });

    fireEvent.press(screen.getByText('Confirmar Entrega'));

    // 6. Verify Offline Message (it might be brief before onSuccess)
    // Actually, let's verify the queue directly as it's more robust
    await waitFor(() => {
        expect(useDeliveryStore.getState().queue.length).toBe(1);
    });

    // 7. Verify we are back to the list and see the "1 pendiente(s)" chip
    // Note: The chip is in DriverDeliveryScreen, but we called onSuccess which goes back to orders.
    // Wait, the chip should be visible if we are in the delivery screen.
    // Let's check if the queue in the store has 1 item.
    expect(useDeliveryStore.getState().queue.length).toBe(1);
    
    // Check if the chip appears when we go back to the delivery screen
    fireEvent.press(screen.getByText('Calle 123'));
    await waitFor(() => {
        expect(screen.getByText('1 pendiente(s)')).toBeTruthy();
    });

    // 8. Simulate Network Restore and Sync
    fetchMock.mockResponse(JSON.stringify({ success: true }));
    
    // Manually trigger sync for the test (the hook uses NetInfo which is hard to trigger here)
    await act(async () => {
      await useDeliveryStore.getState().syncQueue();
    });

    expect(useDeliveryStore.getState().queue.length).toBe(0);
  });
});
