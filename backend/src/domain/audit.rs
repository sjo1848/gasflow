use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct NewAuditEvent {
    pub actor_id: Option<Uuid>,
    pub entity: String,
    pub entity_id: Option<Uuid>,
    pub action: String,
    pub details: Value,
}
