# Mobile MVP (React Native)

## Objetivo
Cliente movil unico con modo `ADMIN` y `REPARTIDOR`.

## Flujo MVP
1. Login (`/auth/login`).
2. Lectura de perfil (`/me`).
3. Seleccion de modo segun rol.
4. Operacion por pantallas:
   - Admin: pedidos/asignacion y stock/reporte.
   - Repartidor: pedidos asignados y registro de entrega/fallida.

## Sistema UI
- Design tokens centralizados en `src/theme/tokens.ts`.
- Componentes base reutilizables en `src/ui/primitives.tsx`.
- Fondos atmosfericos, cards con jerarquia y formularios consistentes.
- Fechas por defecto dinamicas (`src/utils/date.ts`), sin hardcodes de calendario en pantallas.

## Configuracion API
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
