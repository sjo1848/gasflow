use chrono::{DateTime, NaiveDate, Utc};
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize)]
pub struct Delivery {
    pub id: Uuid,
    pub order_id: Uuid,
    pub llenas_entregadas: i32,
    pub vacias_recibidas: i32,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct NewDelivery {
    pub order_id: Uuid,
    pub llenas_entregadas: i32,
    pub vacias_recibidas: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FailedDelivery {
    pub id: Uuid,
    pub order_id: Uuid,
    pub reason: String,
    pub reprogram_date: Option<NaiveDate>,
    pub reprogram_time_slot: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct NewFailedDelivery {
    pub order_id: Uuid,
    pub reason: String,
    pub reprogram_date: Option<NaiveDate>,
    pub reprogram_time_slot: Option<String>,
}
