# ADR-0001: Monolito con Arquitectura Hexagonal
**Estado:** Aceptado

## Contexto
Se requiere construir un MVP rápido, mantenible, y preparado para crecer sin pagar complejidad prematura.

## Decisión
Usar un único backend (monolito desplegable) organizado con Arquitectura Hexagonal (Ports & Adapters).

## Consecuencias
- + Desarrollo más rápido que microservicios
- + Testing más simple
- + Migración futura posible por extracción de módulos
- - Si crece mucho, habrá que modularizar/extraer servicios
