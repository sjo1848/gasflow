use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const DEFAULT_ORDERS_PAGE: i64 = 1;
pub const DEFAULT_ORDERS_PAGE_SIZE: i64 = 20;
pub const MAX_ORDERS_PAGE_SIZE: i64 = 100;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum OrderStatus {
    Pendiente,
    Asignado,
    EnReparto,
    Entregado,
}

impl OrderStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Pendiente => "PENDIENTE",
            Self::Asignado => "ASIGNADO",
            Self::EnReparto => "EN_REPARTO",
            Self::Entregado => "ENTREGADO",
        }
    }

    pub fn from_str(value: &str) -> Option<Self> {
        match value {
            "PENDIENTE" => Some(Self::Pendiente),
            "ASIGNADO" => Some(Self::Asignado),
            "EN_REPARTO" => Some(Self::EnReparto),
            "ENTREGADO" => Some(Self::Entregado),
            _ => None,
        }
    }

    pub fn can_transition_to(&self, target: &Self) -> bool {
        matches!(
            (self, target),
            (Self::Pendiente, Self::Asignado)
                | (Self::Asignado, Self::EnReparto)
                | (Self::Asignado, Self::Entregado)
                | (Self::EnReparto, Self::Asignado)
                | (Self::EnReparto, Self::Entregado)
        )
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct Order {
    pub id: Uuid,
    pub address: String,
    pub zone: String,
    pub scheduled_date: NaiveDate,
    pub time_slot: String,
    pub quantity: i32,
    pub notes: Option<String>,
    pub status: OrderStatus,
    pub assignee_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct NewOrder {
    pub address: String,
    pub zone: String,
    pub scheduled_date: NaiveDate,
    pub time_slot: String,
    pub quantity: i32,
    pub notes: Option<String>,
}

#[derive(Debug, Clone)]
pub struct OrderFilter {
    pub date: Option<NaiveDate>,
    pub status: Option<OrderStatus>,
    pub assignee: Option<Uuid>,
    pub page: i64,
    pub page_size: i64,
}

#[derive(Debug, Clone, Serialize)]
pub struct PaginatedOrders {
    pub items: Vec<Order>,
    pub page: i64,
    pub page_size: i64,
    pub total: i64,
    pub total_pages: i64,
}
