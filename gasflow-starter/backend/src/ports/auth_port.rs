use crate::domain::auth::User;
use crate::domain::error::DomainError;
use async_trait::async_trait;
use uuid::Uuid;

#[async_trait]
pub trait AuthPort: Send + Sync {
    async fn find_user_by_username(&self, username: &str) -> Result<Option<User>, DomainError>;
    async fn find_user_by_id(&self, user_id: Uuid) -> Result<Option<User>, DomainError>;
}
