pub mod adapters;
pub mod application;
pub mod config;
pub mod domain;
pub mod ports;

use adapters::auth::jwt::JwtService;
use adapters::db::repository::PgRepository;
use adapters::observability::metrics::MetricsRegistry;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub repo: PgRepository,
    pub jwt: JwtService,
    pub metrics: Arc<MetricsRegistry>,
}
