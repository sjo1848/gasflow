use crate::domain::delivery::{Delivery, FailedDelivery, NewDelivery, NewFailedDelivery};
use crate::domain::error::DomainError;
use async_trait::async_trait;

#[async_trait]
pub trait DeliveriesPort: Send + Sync {
    async fn create_delivery(&self, input: NewDelivery) -> Result<Delivery, DomainError>;
    async fn create_failed_delivery(
        &self,
        input: NewFailedDelivery,
    ) -> Result<FailedDelivery, DomainError>;
}
