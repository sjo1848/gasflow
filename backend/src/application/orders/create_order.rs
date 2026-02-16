use crate::domain::error::DomainError;
use crate::domain::orders::{NewOrder, Order};
use crate::ports::orders_port::OrdersPort;

pub async fn execute<P: OrdersPort>(port: &P, input: NewOrder) -> Result<Order, DomainError> {
    if input.quantity <= 0 {
        return Err(DomainError::Validation(
            "quantity debe ser mayor que 0".to_string(),
        ));
    }
    if input.address.trim().is_empty()
        || input.zone.trim().is_empty()
        || input.time_slot.trim().is_empty()
    {
        return Err(DomainError::Validation(
            "address, zone y time_slot son obligatorios".to_string(),
        ));
    }

    port.create_order(input).await
}
