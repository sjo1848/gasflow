# ADR-0002: Stack tecnológico MVP
**Estado:** Aceptado

## Decisión
- Backend: Rust (Axum sugerido)
- DB: PostgreSQL
- Persistencia: SQLx + migraciones
- Mobile: React Native
- Contenedores: Docker (backend + db)

## Motivos
- Rust: performance, seguridad, robustez
- PostgreSQL: confiable y escalable
- SQLx: tipado y migraciones claras
- React Native: una app para Android/iOS
- Docker: reproducibilidad de entornos
