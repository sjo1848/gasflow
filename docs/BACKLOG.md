# Backlog — GasFlow (MVP)
Prioridad: Must/Should/Could

## ÉPICAS
E1. Fundaciones backend (auth, db, api)
E2. Pedidos (CRUD mínimo + estados)
E3. Despacho (asignación de pedidos)
E4. Entregas (registro por domicilio)
E5. Stock (ingreso de llenas + resumen + conciliación)
E6. App móvil (pantallas MVP)
E7. Operación DevOps (docker compose, scripts, logging básico)

---

## E1 — Fundaciones backend
### T1 (Must) — Definir estructura hexagonal (carpetas/módulos)
**Aceptación:** existe estructura Domain/Application/Adapters + compilación OK (cuando haya código).

### T2 (Must) — Autenticación JWT con roles (Admin/Repartidor)
**Aceptación:** login devuelve token; endpoints protegidos por rol.

### T3 (Must) — PostgreSQL + migraciones
**Aceptación:** `migrate up` crea esquema; se puede levantar con Docker.

## E2 — Pedidos
### T4 (Must) — Crear pedido programado
Campos: domicilio, zona, fecha, franja, cantidad, notas  
**Aceptación:** `POST /orders` crea y devuelve id.

### T5 (Must) — Listar pedidos con filtros
Filtros: fecha, estado, repartidor  
**Aceptación:** `GET /orders?...` devuelve lista paginada (simple).

### T6 (Must) — Transición de estados controlada
**Aceptación:** sólo transiciones válidas (ej: PENDIENTE→ASIGNADO).

## E3 — Despacho
### T7 (Must) — Asignar pedidos a repartidor
**Aceptación:** pedidos asignados aparecen en listado del repartidor.

## E4 — Entregas
### T8 (Must) — Registrar entrega por domicilio
Datos: order_id, llenas_entregadas, vacias_recibidas, notas  
**Aceptación:** crea entrega + marca pedido ENTREGADO (si corresponde).

### T9 (Should) — Entrega fallida / reprogramación
**Aceptación:** se registra motivo y no rompe stock.

## E5 — Stock
### T10 (Must) — Registrar ingreso de llenas (proveedor)
**Aceptación:** el stock resumen aumenta por ingresos.

### T11 (Must) — Calcular resumen stock (llenas/vacías/diferencia)
**Aceptación:** endpoint muestra totals correctos por fecha y acumulado.

### T12 (Should) — Reporte diario operativo
**Aceptación:** “entregas del día” + “llenas entregadas” + “vacías recuperadas” + “pendiente”.

## E6 — App móvil
### T13 (Must) — Login y selección de modo (Admin/Repartidor)
**Aceptación:** token guardado y navegación por rol.

### T14 (Must) — Pantalla Repartidor: lista de pedidos asignados
**Aceptación:** ver pedidos y abrir detalle.

### T15 (Must) — Pantalla Repartidor: registrar entrega (llenas/vacías)
**Aceptación:** envía datos y actualiza estado.

### T16 (Must) — Pantalla Admin: pedidos + asignación
**Aceptación:** asignar repartidor a pedidos del día.

### T17 (Must) — Pantalla Admin: stock (ingreso llenas + resumen)
**Aceptación:** registrar ingreso y ver resumen actualizado.

## E7 — Operación / DevOps
### T18 (Must) — Docker Compose dev (backend+db)
**Aceptación:** `docker compose up` levanta todo.

### T19 (Should) — Logging estructurado + healthcheck
**Aceptación:** `/health` ok y logs con request_id.

### T20 (Could) — Métricas Prometheus
**Aceptación:** `/metrics` expone contadores básicos.

---

## Estado de implementación (2026-02-16)
- Completadas: `T1` `T2` `T3` `T4` `T5` `T6` `T7` `T8` `T9` `T10` `T11` `T12` `T13` `T14` `T15` `T16` `T17` `T18` `T19` `T20`.
- Pendiente funcional: robustecer seguridad de credenciales (hashing) y cobertura de tests E2E en móvil.
