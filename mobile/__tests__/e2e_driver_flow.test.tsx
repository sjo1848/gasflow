import React from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import App from '../App';
import fetchMock from 'jest-fetch-mock';

describe('E2E: Driver Flow', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('allows Driver to login, see assigned orders and deliver one', async () => {
    // Mock API responses for Driver
    fetchMock.mockResponse((req) => {
      if (req.url.endsWith('/auth/login')) {
        return Promise.resolve(JSON.stringify({ access_token: 'fake-driver-jwt' }));
      }
      if (req.url.endsWith('/me')) {
        return Promise.resolve(
          JSON.stringify({
            id: 'd1',
            username: 'driver',
            role: 'REPARTIDOR',
          })
        );
      }
      if (req.url.includes('/orders')) {
        // Return 1 assigned order
        return Promise.resolve(
            JSON.stringify({
                items: [
                    {
                        id: 'o1',
                        address: 'Calle Falsa 123',
                        status: 'ASIGNADO',
                        total_amount: 1,
                        notes: 'Timbre roto',
                        delivery_date: '2026-02-16',
                        time_slot: '09:00-13:00'
                    }
                ],
                total: 1,
                page: 1,
                page_size: 20,
                total_pages: 1
            })
        );
      }
      if (req.url.endsWith('/deliveries')) {
          return Promise.resolve(JSON.stringify({ success: true }));
      }
      return Promise.reject(new Error('Unknown URL: ' + req.url));
    });

    render(<App />);

    // 1. Wait for loading to finish
    const userInput = await screen.findByPlaceholderText('admin');
    const passInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByText('Iniciar Sesión');

    // 2. Login as Driver
    fireEvent.changeText(userInput, 'driver');
    fireEvent.changeText(passInput, 'driver123');
    fireEvent.press(submitBtn);

    // 3. Verify Mode Selection (Driver only sees "Panel Repartidor")
    await waitFor(() => {
       expect(screen.getByText('Panel Repartidor')).toBeTruthy();
    });
    
    // 4. Enter Driver Mode
    fireEvent.press(screen.getByText('Panel Repartidor'));

    // 5. Verify Driver Dashboard & Order List
    await waitFor(() => {
      expect(screen.getByText('GasFlow Reparto')).toBeTruthy();
      expect(screen.getByText('driver')).toBeTruthy();
      expect(screen.getByText('Calle Falsa 123')).toBeTruthy();
    });

    // 6. Select Order to Deliver
    fireEvent.press(screen.getByText('Calle Falsa 123'));

    // 7. Verify Delivery Screen
    await waitFor(() => {
        expect(screen.getByText('Registrar entrega')).toBeTruthy();
    });

    // 8. Fill Delivery Form
    const inputLlenas = screen.getByTestId('input-llenas');
    const inputVacias = screen.getByTestId('input-vacias');

    fireEvent.changeText(inputLlenas, '2');
    fireEvent.changeText(inputVacias, '1');

    // 9. Submit Delivery
    const confirmBtn = screen.getByText('Confirmar Entrega');
    fireEvent.press(confirmBtn);

    // 10. Verify return to list (Dashboard)
    await waitFor(() => {
        expect(screen.getByText('Asignados')).toBeTruthy();
    });
  });
});
