use crate::domain::auth::{Claims, Role};
use crate::domain::error::DomainError;
use chrono::{Duration, Utc};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct JwtService {
    secret: String,
}

impl JwtService {
    pub fn new(secret: String) -> Self {
        Self { secret }
    }

    pub fn issue(&self, user_id: Uuid, role: Role) -> Result<String, DomainError> {
        let claims = Claims {
            sub: user_id.to_string(),
            role,
            exp: (Utc::now() + Duration::hours(12)).timestamp() as usize,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_bytes()),
        )
        .map_err(|e| DomainError::Infrastructure(e.to_string()))
    }

    pub fn verify(&self, token: &str) -> Result<Claims, DomainError> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_bytes()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|_| DomainError::Unauthorized("token inválido".to_string()))
    }
}
