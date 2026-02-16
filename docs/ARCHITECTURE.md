# Arquitectura — GasFlow (Monolito Hexagonal)

## 1. Decisión central
**Monolito con Arquitectura Hexagonal** (Ports & Adapters).
- “Monolito” = un único servicio desplegable.
- “Hexagonal” = dominio aislado de frameworks/DB/UI.

Ventaja: rapidez de entrega + orden + migración futura si escala (extracción de servicios por módulo).

## 2. Contenedores (alto nivel)
1) **Mobile App (React Native)**  
   - Cliente Admin (modo admin) y Repartidor (modo repartidor) en la misma app
   - Consume API REST

2) **Backend (Rust)**  
   - Expone API REST
   - Aplica reglas del dominio
   - Autenticación + roles

3) **DB (PostgreSQL)**  
   - Persistencia principal
   - Migraciones versionadas

## 3. Capas Hexagonales (internas)
### Domain (Core)
- Entidades: Pedido, Entrega, Asignación, MovimientoStock (IngresoLlenas), ResumenStock
- Reglas:
  - transición de estados
  - validaciones de cantidades
  - conciliación del ciclo (llenas vs vacías)

### Application (Use Cases)
- CrearPedido
- AsignarPedidos
- MarcarEnReparto / MarcarEntregado
- RegistrarEntrega (llenas/vacías)
- RegistrarIngresoLlenas
- ConsultarStockResumen
- ReporteDiario

### Ports (Interfaces del core)
- RepositorioPedidos
- RepositorioEntregas
- RepositorioStock
- ServicioAuth
- Clock / UUID generator

### Adapters (Infra)
- HTTP (Axum): controllers/handlers
- DB (SQLx): repos implementados
- Auth (JWT)
- Observabilidad (logs, métricas)

## 4. Módulos (bounded contexts simples)
- `orders` (Pedidos)
- `dispatch` (Asignación / ejecución reparto)
- `stock` (Ingresos llenas / vacías recuperadas / resumen)
- `auth` (Usuarios/roles)

## 5. API (contratos MVP)
- `POST /auth/login`
- `GET /me`

Pedidos:
- `POST /orders`
- `GET /orders?date=&status=&assignee=&page=&page_size=` (paginado)
- `PATCH /orders/{id}/status`

Asignación:
- `POST /dispatch/assign` (lista de order_id → driver_id)

Entregas:
- `POST /deliveries` (order_id, llenas_entregadas, vacias_recibidas, notas)
- `POST /deliveries/failed` (order_id, motivo, reprogramación opcional)

Stock:
- `POST /stock/inbounds` (fecha, cantidad_llenas, notas)
- `GET /stock/summary?date=`

Reportes:
- `GET /reports/daily?date=`

Observabilidad:
- `GET /metrics`
- tabla `audit_events` para auditoría mínima de acciones operativas

## 6. Despliegue Dev (Docker)
- `backend` + `db` en `docker compose`
- Mobile se corre local (Metro / Android Studio / Xcode)

## 7. Evolución (cuando crezca)
- Extraer primero lo que más cambie o escale:
  - `stock` (si hay integraciones con proveedor)
  - `reporting` (si se vuelve pesado)
  - `dispatch` (si mete optimización de rutas)
