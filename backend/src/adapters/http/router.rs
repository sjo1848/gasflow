use crate::adapters::http::handlers;
use crate::AppState;
use axum::middleware;
use axum::routing::{get, patch, post};
use axum::Router;

pub fn build_router(state: AppState) -> Router {
    let public_routes = Router::new()
        .route("/health", get(handlers::health))
        .route("/metrics", get(handlers::metrics))
        .route("/auth/login", post(handlers::login));

    let protected_routes = Router::new()
        .route("/me", get(handlers::me))
        .route(
            "/orders",
            post(handlers::create_order).get(handlers::list_orders),
        )
        .route("/orders/:id/status", patch(handlers::change_order_status))
        .route("/dispatch/assign", post(handlers::assign_orders))
        .route("/deliveries", post(handlers::register_delivery))
        .route(
            "/deliveries/failed",
            post(handlers::register_failed_delivery),
        )
        .route("/stock/inbounds", post(handlers::create_inbound))
        .route("/stock/summary", get(handlers::stock_summary))
        .route("/reports/daily", get(handlers::daily_report))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            handlers::auth_middleware,
        ));

    public_routes
        .merge(protected_routes)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            handlers::metrics_middleware,
        ))
        .layer(middleware::from_fn(handlers::request_id_middleware))
        .with_state(state)
}
