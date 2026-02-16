use crate::adapters::auth::jwt::JwtService;
use crate::domain::error::DomainError;
use crate::ports::auth_port::AuthPort;
use bcrypt::verify as bcrypt_verify;
use uuid::Uuid;

fn is_bcrypt_hash(value: &str) -> bool {
    value.starts_with("$2a$") || value.starts_with("$2b$") || value.starts_with("$2y$")
}

fn verify_password(stored_password: &str, candidate: &str) -> Result<bool, DomainError> {
    if is_bcrypt_hash(stored_password) {
        return bcrypt_verify(candidate, stored_password)
            .map_err(|err| DomainError::Infrastructure(format!("password hash inválido: {err}")));
    }

    // Compatibilidad temporal para bases previas sin migrar hash.
    Ok(stored_password == candidate)
}

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

    if !verify_password(&user.password, &password)? {
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

#[cfg(test)]
mod tests {
    use super::*;
    use bcrypt::{hash, DEFAULT_COST};

    #[test]
    fn verify_plaintext_password_for_legacy_records() {
        let ok = verify_password("admin123", "admin123").expect("verify should work");
        assert!(ok);
    }

    #[test]
    fn verify_bcrypt_password() {
        let hashed = hash("admin123", DEFAULT_COST).expect("hash should work");
        let ok = verify_password(&hashed, "admin123").expect("verify should work");
        assert!(ok);
    }

    #[test]
    fn reject_invalid_password() {
        let hashed = hash("admin123", DEFAULT_COST).expect("hash should work");
        let ok = verify_password(&hashed, "wrong").expect("verify should work");
        assert!(!ok);
    }
}
