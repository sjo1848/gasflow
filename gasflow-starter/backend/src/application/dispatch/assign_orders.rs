use crate::domain::error::DomainError;
use crate::ports::orders_port::OrdersPort;
use uuid::Uuid;

pub async fn execute<P: OrdersPort>(
    port: &P,
    order_ids: Vec<Uuid>,
    driver_id: Uuid,
) -> Result<(), DomainError> {
    if order_ids.is_empty() {
        return Err(DomainError::Validation(
            "order_ids no puede estar vacío".to_string(),
        ));
    }

    port.assign_orders(&order_ids, driver_id).await
}
