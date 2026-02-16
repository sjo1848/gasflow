use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Settings {
    pub database_url: String,
    pub jwt_secret: String,
    pub port: u16,
}

impl Settings {
    pub fn from_env() -> Result<Self> {
        dotenvy::dotenv().ok();

        let database_url = std::env::var("DATABASE_URL").context("missing DATABASE_URL")?;
        let jwt_secret = std::env::var("JWT_SECRET").context("missing JWT_SECRET")?;
        let port = std::env::var("PORT")
            .unwrap_or_else(|_| "8080".to_string())
            .parse::<u16>()
            .context("invalid PORT")?;

        Ok(Self {
            database_url,
            jwt_secret,
            port,
        })
    }
}
