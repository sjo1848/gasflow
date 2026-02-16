use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, ToSchema)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Role {
    Admin,
    Repartidor,
}

impl Role {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Admin => "ADMIN",
            Self::Repartidor => "REPARTIDOR",
        }
    }

    pub fn from_str(value: &str) -> Option<Self> {
        match value {
            "ADMIN" => Some(Self::Admin),
            "REPARTIDOR" => Some(Self::Repartidor),
            _ => None,
        }
    }
}

#[derive(Debug, Clone)]
pub struct User {
    pub id: Uuid,
    pub username: String,
    pub password: String,
    pub role: Role,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String,
    pub role: Role,
    pub exp: usize,
}
