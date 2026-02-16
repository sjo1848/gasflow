use crate::domain::delivery::{FailedDelivery, NewFailedDelivery};
use crate::domain::error::DomainError;
use crate::domain::orders::OrderStatus;
use crate::ports::deliveries_port::DeliveriesPort;
use crate::ports::orders_port::OrdersPort;

pub async fn execute<P: OrdersPort + DeliveriesPort>(
    port: &P,
    input: NewFailedDelivery,
) -> Result<FailedDelivery, DomainError> {
    if input.reason.trim().is_empty() {
        return Err(DomainError::Validation("reason es obligatorio".to_string()));
    }

    let order = port
        .get_order_by_id(input.order_id)
        .await?
        .ok_or_else(|| DomainError::NotFound("pedido no encontrado".to_string()))?;

    if order.status != OrderStatus::Asignado && order.status != OrderStatus::EnReparto {
        return Err(DomainError::Validation(
            "el pedido debe estar ASIGNADO o EN_REPARTO para registrar entrega fallida".to_string(),
        ));
    }

    let failed = port.create_failed_delivery(input.clone()).await?;

    let new_date = input.reprogram_date.unwrap_or(order.scheduled_date);
    let new_slot = input.reprogram_time_slot.unwrap_or(order.time_slot);

    // Reprogramación mínima: se mantiene el pedido en ASIGNADO para nuevo intento.
    let _ = port.reprogram_order(order.id, new_date, new_slot).await?;

    Ok(failed)
}
