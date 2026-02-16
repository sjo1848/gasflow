use crate::domain::error::DomainError;
use crate::domain::orders::{NewOrder, Order, OrderFilter, OrderStatus, PaginatedOrders};
use async_trait::async_trait;
use chrono::NaiveDate;
use uuid::Uuid;

#[async_trait]
pub trait OrdersPort: Send + Sync {
    async fn create_order(&self, input: NewOrder) -> Result<Order, DomainError>;
    async fn list_orders(&self, filter: OrderFilter) -> Result<PaginatedOrders, DomainError>;
    async fn get_order_by_id(&self, order_id: Uuid) -> Result<Option<Order>, DomainError>;
    async fn update_order_status(
        &self,
        order_id: Uuid,
        status: OrderStatus,
    ) -> Result<Order, DomainError>;
    async fn reprogram_order(
        &self,
        order_id: Uuid,
        scheduled_date: NaiveDate,
        time_slot: String,
    ) -> Result<Order, DomainError>;
    async fn assign_orders(&self, order_ids: &[Uuid], driver_id: Uuid) -> Result<(), DomainError>;
}
