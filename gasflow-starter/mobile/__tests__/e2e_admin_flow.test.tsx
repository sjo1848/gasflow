import React from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import App from '../App';
import fetchMock from 'jest-fetch-mock';

describe('E2E: Admin Flow', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  it('allows Admin to login, check orders and see stock summary', async () => {
    // Mock API responses for Admin
    fetchMock.mockResponse((req) => {
      if (req.url.endsWith('/auth/login')) {
        return Promise.resolve(JSON.stringify({ access_token: 'fake-admin-jwt' }));
      }
      if (req.url.endsWith('/me')) {
        return Promise.resolve(
          JSON.stringify({
            id: 'a1',
            username: 'admin',
            role: 'ADMIN',
          })
        );
      }
      if (req.url.includes('/orders')) {
        return Promise.resolve(
            JSON.stringify({
                items: [
                    {
                        id: 'o-admin-1',
                        address: 'Av. Libertador 1000',
                        status: 'PENDIENTE',
                        scheduled_date: '2026-02-16',
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
      if (req.url.includes('/stock/summary')) {
          return Promise.resolve(
              JSON.stringify({
                  llenas_ingresadas: 1000,
                  llenas_entregadas: 450,
                  vacias_recibidas: 400,
                  llenas_disponibles_estimadas: 550,
                  vacias_deposito_estimadas: 400,
                  pendientes_recuperar: 50
              })
          );
      }
      if (req.url.includes('/reports/daily')) {
        return Promise.resolve(
            JSON.stringify({
                date: '2026-02-16',
                entregas_dia: 5,
                llenas_entregadas: 10,
                vacias_recibidas: 8,
                pendiente: 2
            })
        );
      }
      return Promise.reject(new Error('Unknown URL: ' + req.url));
    });

    render(<App />);

    // 1. Login
    const userInput = await screen.findByPlaceholderText('admin');
    const passInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByText('Iniciar Sesión');

    fireEvent.changeText(userInput, 'admin');
    fireEvent.changeText(passInput, 'admin123');
    fireEvent.press(submitBtn);

    // 2. Mode Selection
    await waitFor(() => {
       expect(screen.getByText('Panel Admin')).toBeTruthy();
    });
    fireEvent.press(screen.getByText('Panel Admin'));

    // 3. Verify Admin Dashboard (Orders tab active by default)
    await waitFor(() => {
      expect(screen.getByText('Av. Libertador 1000')).toBeTruthy();
    });

    // 4. Switch to Stock tab
    const stockTab = screen.getByText('Stock');
    fireEvent.press(stockTab);

    // 5. Verify Stock Summary and Daily Report
    await waitFor(() => {
        expect(screen.getByText('Estado del Ciclo')).toBeTruthy();
        expect(screen.getByText('Llenas Disponibles')).toBeTruthy();
        expect(screen.getByText('550')).toBeTruthy(); 
        expect(screen.getByText('Vacías Pendientes')).toBeTruthy();
        expect(screen.getByText('50')).toBeTruthy();   
        expect(screen.getByText('Balance del Día')).toBeTruthy();
        expect(screen.getByText('Entregas')).toBeTruthy();
    });
  });
});
