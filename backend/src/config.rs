use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Settings {
    pub database_url: String,
    pub database_max_connections: u32,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub port: u16,
}

impl Settings {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let database_url = std::env::var("DATABASE_URL").context("missing DATABASE_URL")?;
        let database_max_connections = std::env::var("DATABASE_MAX_CONNECTIONS")
            .unwrap_or_else(|_| "10".to_string())
            .parse::<u32>()
            .context("invalid DATABASE_MAX_CONNECTIONS")?;

        let jwt_secret = std::env::var("JWT_SECRET").context("missing JWT_SECRET")?;
        let jwt_expiration_hours = std::env::var("JWT_EXPIRATION_HOURS")
            .unwrap_or_else(|_| "12".to_string())
            .parse::<i64>()
            .context("invalid JWT_EXPIRATION_HOURS")?;

        let port = std::env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .context("invalid PORT")?;

        Ok(Self {
            database_url,
            database_max_connections,
            jwt_secret,
            jwt_expiration_hours,
            port,
        })
    }
}
