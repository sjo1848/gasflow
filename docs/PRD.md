# PRD — GasFlow (MVP Reparto de Garrafas)
**Fecha:** 2026-02-15
**Estado:** Borrador operativo (listo para backlog)

## 1. Contexto
Reparto local de garrafas (GLP). El flujo real es **planificado**:
- Se levantan pedidos (programados por día/franja)
- Se consolidan por zona
- Se reparten cuando conviene por logística (no inmediato)

## 2. Objetivo
Resolver 3 problemas:
1) **Pedidos programados** y seguimiento
2) **Operación de reparto** (asignación + ejecución)
3) **Control del ciclo de stock** (llenas vs vacías) por cantidades, evitando “traspapeles”

## 3. Usuarios / Roles
### Admin/Despacho
- Crea y gestiona pedidos (o importa/recibe del canal actual)
- Asigna pedidos a repartidores (por zona/turno)
- Ve stock y conciliación (llenas/vacías)
- Reporte diario (operativo)

### Repartidor
- Ve sus entregas asignadas
- Marca avance del reparto
- Registra por domicilio: **llenas entregadas** y **vacías recibidas**
- Cierra el día con resumen

### Cliente (Opcional MVP)
- Crea pedidos programados
- Ve estado / confirmación

## 4. Alcance del MVP (Must Have)
### Pedidos
- Crear pedido con:
  - Domicilio (texto)
  - Zona (manual al inicio; luego geocoding opcional)
  - Día + franja horaria (mañana/tarde o similar)
  - Cantidad solicitada
  - Notas (ej: “portón verde”, “llamar antes”)
- Estados del pedido:
  - `PENDIENTE` → `ASIGNADO` → `EN_REPARTO` → `ENTREGADO`
  - (Opcional MVP: `CANCELADO`, `FALLIDO`)

### Asignación
- Admin asigna pedidos a un repartidor para un día/turno
- Repartidor ve su lista ordenable (por zona / franja)

### Entrega (registro por cantidades)
- En cada domicilio:
  - `llenas_entregadas` (número)
  - `vacias_recibidas` (número)
  - Observación opcional

### Stock y conciliación del ciclo (por cantidades)
- Registrar “Ingreso de llenas desde proveedor”:
  - fecha, cantidad, observación
- Registrar “Acumulación de vacías recuperadas” desde entregas
- Indicadores:
  - Llenas disponibles estimadas
  - Vacías en depósito estimadas
  - Diferencia/pendientes para cerrar ciclo (ej: faltan X vacías)

### Panel Admin dentro de la app (sin web)
- Pantalla de pedidos
- Pantalla de asignación
- Pantalla de stock (ingresos + resumen)
- Reporte diario simple

## 5. Fuera de alcance (por ahora)
- App web/admin web
- Escaneo unitario por garrafa (serial/QR)
- Optimización de rutas avanzada
- Pagos online integrados
- Chat/llamadas dentro de la app
- Multi-sucursal/multi-empresa

## 6. Requisitos No Funcionales (MVP)
- Respuesta de listados: objetivo < 2s
- Autenticación con roles (Admin/Repartidor)
- Auditoría mínima: quién cambió estado y cuándo
- Datos centralizados (backend único)
- Sincronización tolerante a mala conexión (al menos reintentos básicos)

## 7. Métricas (operativas)
- Pedidos entregados por día
- Llenas entregadas vs vacías recuperadas por día
- Pendiente de vacías acumulado
- Entregas fallidas / reprogramadas

## 8. Riesgos conocidos
- Cobertura/cortes de datos en altamontaña → diseñar reintentos y modo “cola local” en el futuro
- Datos de domicilio poco precisos → empezar simple (texto + zona manual)
