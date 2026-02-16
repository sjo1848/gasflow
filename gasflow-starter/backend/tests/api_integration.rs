use axum::{
    body::Body,
    http::{self, Request, StatusCode},
};
use gasflow_backend::{
    adapters::{auth::jwt::JwtService, db::repository::PgRepository, http::router::build_router, observability::metrics::MetricsRegistry},
    AppState,
};
use serde_json::{json, Value};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower::ServiceExt; // for `oneshot`

#[tokio::test]
async fn test_login_and_me_flow() {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://gasflow:gasflow@localhost:5433/gasflow".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations just in case
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    let state = AppState {
        repo: PgRepository::new(pool),
        jwt: JwtService::new("test-secret".to_string(), 1),
        metrics: Arc::new(MetricsRegistry::default()),
    };

    let app = build_router(state);

    // 1. Try to login with seed admin
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/auth/login")
                .header(http::header::CONTENT_TYPE, mime::APPLICATION_JSON.as_ref())
                .body(Body::from(
                    json!({
                        "username": "admin",
                        "password": "admin123"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    let token = body["access_token"].as_str().expect("token not found");

    // 2. Try to get /me with that token
    let response = app
        .oneshot(
            Request::builder()
                .method(http::Method::GET)
                .uri("/me")
                .header(http::header::AUTHORIZATION, format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(body["username"], "admin");
    assert_eq!(body["role"], "ADMIN");
}

#[tokio::test]
async fn test_order_lifecycle() {
    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://gasflow:gasflow@localhost:5433/gasflow".to_string());

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to database");

    sqlx::migrate!("./migrations").run(&pool).await.unwrap();

    let state = AppState {
        repo: PgRepository::new(pool),
        jwt: JwtService::new("test-secret".to_string(), 1),
        metrics: Arc::new(MetricsRegistry::default()),
    };

    let app = build_router(state);

    // 1. Login as admin
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/auth/login")
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"username": "admin", "password": "admin123"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    let admin_token = body["access_token"].as_str().unwrap().to_string();

    // 2. Create an order
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/orders")
                .header(http::header::AUTHORIZATION, format!("Bearer {}", admin_token))
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "address": "Test Street 123",
                        "zone": "North",
                        "scheduled_date": "2026-02-16",
                        "time_slot": "MAÑANA",
                        "quantity": 2,
                        "notes": "Test order"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    let order_id = body["id"].as_str().unwrap().to_string();

    // 3. Get repartidor ID
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/auth/login")
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(json!({"username": "repartidor", "password": "repartidor123"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    let repartidor_token = body["access_token"].as_str().unwrap().to_string();
    
    // Get repartidor profile to get ID
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::GET)
                .uri("/me")
                .header(http::header::AUTHORIZATION, format!("Bearer {}", repartidor_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    let repartidor_id = body["id"].as_str().unwrap().to_string();

    // 4. Assign order to repartidor
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/dispatch/assign")
                .header(http::header::AUTHORIZATION, format!("Bearer {}", admin_token))
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "order_ids": [order_id],
                        "driver_id": repartidor_id
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    // 5. Deliver order as repartidor
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::POST)
                .uri("/deliveries")
                .header(http::header::AUTHORIZATION, format!("Bearer {}", repartidor_token))
                .header(http::header::CONTENT_TYPE, "application/json")
                .body(Body::from(
                    json!({
                        "order_id": order_id,
                        "llenas_entregadas": 2,
                        "vacias_recibidas": 2,
                        "notes": "All good"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::CREATED);

    // 6. Verify order status is ENTREGADO
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .method(http::Method::GET)
                .uri(format!("/orders?date=2026-02-16"))
                .header(http::header::AUTHORIZATION, format!("Bearer {}", admin_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let body: Value = serde_json::from_slice(&body).unwrap();
    
    // Paged response
    let items = body["items"].as_array().unwrap();
    let order = items.iter().find(|o| o["id"] == order_id).unwrap();
    assert_eq!(order["status"], "ENTREGADO");
}
