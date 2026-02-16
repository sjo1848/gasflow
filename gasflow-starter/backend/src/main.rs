use anyhow::Result;
use axum::Router;
use gasflow_backend::adapters::auth::jwt::JwtService;
use gasflow_backend::adapters::db::repository::PgRepository;
use gasflow_backend::adapters::http::router::build_router;
use gasflow_backend::adapters::observability::metrics::MetricsRegistry;
use gasflow_backend::config::Settings;
use gasflow_backend::AppState;
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .json()
        .init();

    let settings = Settings::from_env()?;

    let pool = PgPoolOptions::new()
        .max_connections(settings.database_max_connections)
        .connect(&settings.database_url)
        .await?;

    sqlx::migrate!("./migrations").run(&pool).await?;

    let state = AppState {
        repo: PgRepository::new(pool),
        jwt: JwtService::new(settings.jwt_secret, settings.jwt_expiration_hours),
        metrics: Arc::new(MetricsRegistry::default()),
    };

    let app: Router = build_router(state);
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.port));

    info!(%addr, "gasflow backend listening");

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
