use chrono::NaiveDate;
use serde::Serialize;

#[derive(Debug, Clone)]
pub struct Inbound {
    pub date: NaiveDate,
    pub cantidad_llenas: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct StockSummary {
    pub date: Option<NaiveDate>,
    pub llenas_ingresadas: i64,
    pub llenas_entregadas: i64,
    pub vacias_recibidas: i64,
    pub llenas_disponibles_estimadas: i64,
    pub vacias_deposito_estimadas: i64,
    pub pendientes_recuperar: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DailyOperationalReport {
    pub date: NaiveDate,
    pub entregas_dia: i64,
    pub llenas_entregadas: i64,
    pub vacias_recibidas: i64,
    pub pendiente: i64,
}
