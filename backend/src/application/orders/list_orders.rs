use crate::domain::error::DomainError;
use crate::domain::orders::{OrderFilter, PaginatedOrders};
use crate::ports::orders_port::OrdersPort;

pub async fn execute<P: OrdersPort>(
    port: &P,
    filter: OrderFilter,
) -> Result<PaginatedOrders, DomainError> {
    port.list_orders(filter).await
}
