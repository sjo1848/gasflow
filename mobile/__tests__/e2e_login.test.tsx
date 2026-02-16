import React from 'react';
import { fireEvent, render, waitFor, screen } from '@testing-library/react-native';
import App from '../App';
import fetchMock from 'jest-fetch-mock';

describe('E2E: Login Flow', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
    // Limpiar AsyncStorage mock si fuera necesario, pero jest.resetModules() o similar suele ser mejor.
    // Asumimos estado limpio.
  });

  it('renders login screen initially', async () => {
    render(<App />);
    expect(await screen.findByText('Ingresar')).toBeTruthy();
    expect(screen.getByPlaceholderText('admin')).toBeTruthy();
  });

  it('allows user to login as Admin and see dashboard', async () => {
    // Mock API responses
    fetchMock.mockResponse((req) => {
      if (req.url.endsWith('/auth/login')) {
        return Promise.resolve(JSON.stringify({ access_token: 'fake-jwt-token' }));
      }
      if (req.url.endsWith('/me')) {
        return Promise.resolve(
          JSON.stringify({
            id: 'u1',
            username: 'admin',
            role: 'ADMIN',
          })
        );
      }
      if (req.url.includes('/orders')) {
        return Promise.resolve(
            JSON.stringify({
                items: [],
                total: 0,
                page: 1,
                page_size: 20,
                total_pages: 1
            })
        );
      }
      return Promise.reject(new Error('Unknown URL: ' + req.url));
    });

    render(<App />);

    // 1. Check Login Screen (Wait for loading to finish)
    const userInput = await screen.findByPlaceholderText('admin');
    const passInput = screen.getByPlaceholderText('••••••••');
    const submitBtn = screen.getByText('Entrar al sistema');

    // 2. Fill Form
    fireEvent.changeText(userInput, 'admin');
    fireEvent.changeText(passInput, 'admin123');

    // 3. Submit
    fireEvent.press(submitBtn);

    // 4. Verify Mode Selection Screen appears (because Admin has choice)
    // Wait for "Hola, admin" or similar text from ModeSelectScreen if it exists,
    // or checks for buttons "Administrador" / "Repartidor"
    // Looking at ModeSelectScreen code (inferred): likely has buttons.
    
    // Let's wait for the "Cambiar modo" button which appears in the App header AFTER mode selection?
    // Wait, App logic:
    // If authenticated & no mode selected -> ModeSelectScreen.
    // If authenticated & mode selected -> Dashboard.
    
    // So after login, we should see ModeSelectScreen.
    // Let's assume ModeSelectScreen shows "Seleccioná tu rol" or similar.
    // I'll check for "Hola, admin" or buttons.
    
    await waitFor(() => {
       // ModeSelectScreen logic
       expect(screen.getByText('Panel Admin')).toBeTruthy();
    });

    // 5. Select Admin Mode
    const adminModeBtn = screen.getByText('Panel Admin');
    fireEvent.press(adminModeBtn);

    // 6. Verify Dashboard (Header shows "GasFlow")
    await waitFor(() => {
      expect(screen.getByText('GasFlow')).toBeTruthy();
      expect(screen.getByText('admin • ADMIN')).toBeTruthy();
    });
  });
});
