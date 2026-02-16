use crate::domain::error::DomainError;
use crate::domain::orders::{Order, OrderStatus};
use crate::ports::orders_port::OrdersPort;
use uuid::Uuid;

pub async fn execute<P: OrdersPort>(
    port: &P,
    order_id: Uuid,
    target_status: OrderStatus,
) -> Result<Order, DomainError> {
    let current = port
        .get_order_by_id(order_id)
        .await?
        .ok_or_else(|| DomainError::NotFound("pedido no encontrado".to_string()))?;

    if !current.status.can_transition_to(&target_status) {
        return Err(DomainError::Validation(format!(
            "transición inválida: {} -> {}",
            current.status.as_str(),
            target_status.as_str()
        )));
    }

    port.update_order_status(order_id, target_status).await
}
