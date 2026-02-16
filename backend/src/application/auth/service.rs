use crate::adapters::auth::jwt::JwtService;
use crate::domain::error::DomainError;
use crate::ports::auth_port::AuthPort;
use uuid::Uuid;

pub async fn login<P: AuthPort>(
    auth_port: &P,
    jwt: &JwtService,
    username: String,
    password: String,
) -> Result<String, DomainError> {
    let user = auth_port
        .find_user_by_username(&username)
        .await?
        .ok_or_else(|| DomainError::Unauthorized("credenciales inválidas".to_string()))?;

    if user.password != password {
        return Err(DomainError::Unauthorized(
            "credenciales inválidas".to_string(),
        ));
    }

    jwt.issue(user.id, user.role)
}

pub async fn me<P: AuthPort>(
    auth_port: &P,
    user_id: Uuid,
) -> Result<crate::domain::auth::User, DomainError> {
    auth_port
        .find_user_by_id(user_id)
        .await?
        .ok_or_else(|| DomainError::NotFound("usuario no encontrado".to_string()))
}
