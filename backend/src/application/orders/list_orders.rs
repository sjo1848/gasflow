use crate::domain::error::DomainError;
use crate::domain::orders::{Order, OrderFilter};
use crate::ports::orders_port::OrdersPort;

pub async fn execute<P: OrdersPort>(
    port: &P,
    filter: OrderFilter,
) -> Result<Vec<Order>, DomainError> {
    port.list_orders(filter).await
}
