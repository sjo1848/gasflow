use crate::domain::delivery::{Delivery, NewDelivery};
use crate::domain::error::DomainError;
use crate::domain::orders::OrderStatus;
use crate::ports::deliveries_port::DeliveriesPort;
use crate::ports::orders_port::OrdersPort;

pub async fn execute<P: OrdersPort + DeliveriesPort>(
    port: &P,
    input: NewDelivery,
) -> Result<Delivery, DomainError> {
    if input.llenas_entregadas < 0 || input.vacias_recibidas < 0 {
        return Err(DomainError::Validation(
            "llenas_entregadas y vacias_recibidas deben ser >= 0".to_string(),
        ));
    }

    let order = port
        .get_order_by_id(input.order_id)
        .await?
        .ok_or_else(|| DomainError::NotFound("pedido no encontrado".to_string()))?;

    if order.status != OrderStatus::Asignado && order.status != OrderStatus::EnReparto {
        return Err(DomainError::Validation(
            "el pedido debe estar ASIGNADO o EN_REPARTO para registrar entrega".to_string(),
        ));
    }

    let delivery = port.create_delivery(input).await?;
    let _ = port
        .update_order_status(delivery.order_id, OrderStatus::Entregado)
        .await?;

    Ok(delivery)
}
