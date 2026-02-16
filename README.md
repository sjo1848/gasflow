# GasFlow — App de Reparto de Garrafas (MVP)

Sistema para **gestión de pedidos programados**, **entregas** y **control de garrafas llenas/vacías** para un reparto local.
En esta primera versión el foco es **operación eficiente** (no “delivery instantáneo”).

## Alcance del MVP (resumen)
- Pedidos programados (día + franja horaria) y estados
- Asignación de pedidos a repartidores
- Registro de entrega por domicilio: **llenas entregadas** y **vacías recibidas**
- Control de stock por **cantidades** (llenas/vacías), con conciliación del ciclo
- Panel admin **dentro de la misma app** (sin web por ahora)

## Documentación
- Requisitos: `docs/PRD.md`
- Arquitectura: `docs/ARCHITECTURE.md`
- Backlog: `docs/BACKLOG.md`
- Decisiones (ADR): `docs/adr/`
- Reglas para agentes (Codex): `AGENTS.md`

## Convenciones
- Todo cambio debe actualizar docs relevantes.
- Cada tarea del backlog tiene criterio de aceptación y comando de verificación (cuando haya código).

## Backend MVP Implementado
- Stack: Rust + Axum + PostgreSQL + SQLx.
- Arquitectura: monolito hexagonal (`domain`, `application`, `ports`, `adapters`).
- Endpoints MVP:
  - `POST /auth/login`
  - `GET /me`
  - `POST /orders`
  - `GET /orders?date=&status=&assignee=`
  - `PATCH /orders/{id}/status`
  - `POST /dispatch/assign`
  - `POST /deliveries`
  - `POST /deliveries/failed` (motivo + reprogramación opcional)
  - `POST /stock/inbounds`
  - `GET /stock/summary?date=`
  - `GET /reports/daily?date=`
  - `GET /metrics`
  - `GET /health`
  - Header de trazabilidad: `X-Request-Id` (entrada/salida)

## Ejecutar Con Docker Compose
```bash
docker compose up -d --build
docker compose ps
```

Servicios:
- Backend: `http://localhost:8080`
- PostgreSQL: `localhost:5433` (container `5432`)

Para detener:
```bash
docker compose down
```

## Pruebas Locales Backend
```bash
cd backend
cargo fmt
cargo test
```

## App Móvil MVP (React Native)
Incluye tareas `T13` a `T17` del backlog:
- Login + selección de modo por rol
- Pantalla Admin: pedidos + asignación
- Pantalla Admin: stock + resumen + reporte diario
- Pantalla Repartidor: pedidos asignados
- Pantalla Repartidor: registrar entrega / entrega fallida

Instalación y test:
```bash
cd mobile
npm install
npm test -- --runInBand
```

Run:
```bash
cd mobile
npm run start
```

Variable para API:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```

## Credenciales Seed (Dev)
- Admin: `admin` / `admin123`
- Repartidor: `repartidor` / `repartidor123`

Supuesto mínimo documentado para MVP: contraseña en texto plano en entorno dev para acelerar validación funcional inicial.

Supuesto mínimo para entrega fallida/reprogramación: al registrar `POST /deliveries/failed`, el pedido queda en `ASIGNADO` y se actualiza fecha/franja sólo si se informan datos de reprogramación.
