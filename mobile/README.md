# Mobile MVP (React Native)

## Objetivo
Cliente móvil único con modo `ADMIN` y `REPARTIDOR`.

## Flujo MVP
1. Login (`/auth/login`).
2. Lectura de perfil (`/me`).
3. Selección de modo según rol.
4. Operación por pantallas:
   - Admin: pedidos/asignación y stock/reporte.
   - Repartidor: pedidos asignados y registro de entrega/fallida.

## Configuración API
Usar variable de entorno:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Comandos
```bash
npm install
npm test -- --runInBand
npm run start
```
