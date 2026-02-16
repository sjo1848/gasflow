use crate::domain::audit::NewAuditEvent;
use crate::domain::error::DomainError;
use async_trait::async_trait;

#[async_trait]
pub trait AuditPort: Send + Sync {
    async fn record_audit_event(&self, event: NewAuditEvent) -> Result<(), DomainError>;
}
