use crate::application;
use crate::domain::auth::Role;
use crate::domain::delivery::{NewDelivery, NewFailedDelivery};
use crate::domain::error::DomainError;
use crate::domain::orders::{NewOrder, OrderFilter, OrderStatus};
use crate::domain::stock::Inbound;
use crate::AppState;
use axum::extract::{Path, Query, Request, State};
use axum::http::{
    header::{HeaderName, AUTHORIZATION},
    HeaderValue, Method, StatusCode,
};
use axum::middleware::Next;
use axum::response::{IntoResponse, Response};
use axum::{Extension, Json};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::Instant;
use tracing::info;
use uuid::Uuid;

const REQUEST_ID_HEADER: HeaderName = HeaderName::from_static("x-request-id");

#[derive(Debug, Clone)]
pub struct AuthContext {
    pub user_id: Uuid,
    pub role: Role,
}

fn map_error(err: DomainError) -> (StatusCode, Json<serde_json::Value>) {
    match err {
        DomainError::Validation(msg) => (StatusCode::BAD_REQUEST, Json(json!({ "error": msg }))),
        DomainError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, Json(json!({ "error": msg }))),
        DomainError::NotFound(msg) => (StatusCode::NOT_FOUND, Json(json!({ "error": msg }))),
        DomainError::Conflict(msg) => (StatusCode::CONFLICT, Json(json!({ "error": msg }))),
        DomainError::Infrastructure(msg) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": msg })),
        ),
    }
}

fn parse_bearer_token(header_value: &str) -> Option<&str> {
    header_value.strip_prefix("Bearer ")
}

fn parse_uuid(user_id: &str) -> Result<Uuid, DomainError> {
    Uuid::parse_str(user_id).map_err(|_| DomainError::Unauthorized("token inválido".to_string()))
}

fn parse_date(date: &str) -> Result<NaiveDate, DomainError> {
    NaiveDate::parse_from_str(date, "%Y-%m-%d")
        .map_err(|_| DomainError::Validation("fecha inválida (usar YYYY-MM-DD)".to_string()))
}

fn parse_status(status: &str) -> Result<OrderStatus, DomainError> {
    OrderStatus::from_str(status)
        .ok_or_else(|| DomainError::Validation("status inválido".to_string()))
}

fn require_admin(ctx: &AuthContext) -> Result<(), DomainError> {
    if ctx.role != Role::Admin {
        return Err(DomainError::Unauthorized("requiere rol ADMIN".to_string()));
    }
    Ok(())
}

pub async fn request_id_middleware(mut req: Request, next: Next) -> Response {
    let started_at = Instant::now();
    let request_id = req
        .headers()
        .get(&REQUEST_ID_HEADER)
        .and_then(|h| h.to_str().ok())
        .filter(|v| !v.trim().is_empty())
        .map(ToOwned::to_owned)
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    let method: Method = req.method().clone();
    let path = req.uri().path().to_string();

    req.extensions_mut().insert(request_id.clone());

    let mut response = next.run(req).await;

    if let Ok(value) = HeaderValue::from_str(&request_id) {
        response.headers_mut().insert(&REQUEST_ID_HEADER, value);
    }

    info!(
        request_id = %request_id,
        method = %method,
        path = %path,
        status = response.status().as_u16(),
        latency_ms = started_at.elapsed().as_millis() as u64,
        "request completed"
    );

    response
}

pub async fn metrics_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Response {
    let should_track = req.uri().path() != "/metrics";
    if should_track {
        state.metrics.record_request();
    }
    let response = next.run(req).await;
    if should_track {
        state.metrics.record_status(response.status().as_u16());
    }
    response
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    let auth = req
        .headers()
        .get(AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .and_then(parse_bearer_token)
        .ok_or(StatusCode::UNAUTHORIZED)?;

    let claims = state
        .jwt
        .verify(auth)
        .map_err(|_| StatusCode::UNAUTHORIZED)?;
    let user_id = parse_uuid(&claims.sub).map_err(|_| StatusCode::UNAUTHORIZED)?;

    req.extensions_mut().insert(AuthContext {
        user_id,
        role: claims.role,
    });

    Ok(next.run(req).await)
}

pub async fn health() -> Json<serde_json::Value> {
    Json(json!({ "status": "ok" }))
}

pub async fn metrics(State(state): State<AppState>) -> impl IntoResponse {
    let body = state.metrics.render_prometheus();
    (
        StatusCode::OK,
        [(
            axum::http::header::CONTENT_TYPE,
            "text/plain; version=0.0.4; charset=utf-8",
        )],
        body,
    )
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    username: String,
    password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    access_token: String,
    token_type: &'static str,
}

pub async fn login(
    State(state): State<AppState>,
    Json(payload): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<serde_json::Value>)> {
    let token = application::auth::service::login(
        &state.repo,
        &state.jwt,
        payload.username,
        payload.password,
    )
    .await
    .map_err(map_error)?;

    Ok(Json(LoginResponse {
        access_token: token,
        token_type: "Bearer",
    }))
}

#[derive(Debug, Serialize)]
pub struct MeResponse {
    id: Uuid,
    username: String,
    role: Role,
}

pub async fn me(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
) -> Result<Json<MeResponse>, (StatusCode, Json<serde_json::Value>)> {
    let user = application::auth::service::me(&state.repo, ctx.user_id)
        .await
        .map_err(map_error)?;

    Ok(Json(MeResponse {
        id: user.id,
        username: user.username,
        role: user.role,
    }))
}

#[derive(Debug, Deserialize)]
pub struct CreateOrderRequest {
    address: String,
    zone: String,
    scheduled_date: String,
    time_slot: String,
    quantity: i32,
    notes: Option<String>,
}

pub async fn create_order(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Json(payload): Json<CreateOrderRequest>,
) -> Result<impl IntoResponse, (StatusCode, Json<serde_json::Value>)> {
    require_admin(&ctx).map_err(map_error)?;

    let input = NewOrder {
        address: payload.address,
        zone: payload.zone,
        scheduled_date: parse_date(&payload.scheduled_date).map_err(map_error)?,
        time_slot: payload.time_slot,
        quantity: payload.quantity,
        notes: payload.notes,
    };

    let order = application::orders::create_order::execute(&state.repo, input)
        .await
        .map_err(map_error)?;

    Ok((StatusCode::CREATED, Json(order)))
}

#[derive(Debug, Deserialize)]
pub struct ListOrdersQuery {
    date: Option<String>,
    status: Option<String>,
    assignee: Option<Uuid>,
}

pub async fn list_orders(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Query(query): Query<ListOrdersQuery>,
) -> Result<Json<Vec<crate::domain::orders::Order>>, (StatusCode, Json<serde_json::Value>)> {
    let mut filter = OrderFilter {
        date: query
            .date
            .as_deref()
            .map(parse_date)
            .transpose()
            .map_err(map_error)?,
        status: query
            .status
            .as_deref()
            .map(parse_status)
            .transpose()
            .map_err(map_error)?,
        assignee: query.assignee,
    };

    if ctx.role == Role::Repartidor {
        filter.assignee = Some(ctx.user_id);
    }

    let orders = application::orders::list_orders::execute(&state.repo, filter)
        .await
        .map_err(map_error)?;

    Ok(Json(orders))
}

#[derive(Debug, Deserialize)]
pub struct ChangeStatusRequest {
    status: String,
}

pub async fn change_order_status(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Path(id): Path<Uuid>,
    Json(payload): Json<ChangeStatusRequest>,
) -> Result<Json<crate::domain::orders::Order>, (StatusCode, Json<serde_json::Value>)> {
    require_admin(&ctx).map_err(map_error)?;

    let target = parse_status(&payload.status).map_err(map_error)?;
    let order = application::orders::change_status::execute(&state.repo, id, target)
        .await
        .map_err(map_error)?;

    Ok(Json(order))
}

#[derive(Debug, Deserialize)]
pub struct AssignOrdersRequest {
    order_ids: Vec<Uuid>,
    driver_id: Uuid,
}

pub async fn assign_orders(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Json(payload): Json<AssignOrdersRequest>,
) -> Result<StatusCode, (StatusCode, Json<serde_json::Value>)> {
    require_admin(&ctx).map_err(map_error)?;

    application::dispatch::assign_orders::execute(
        &state.repo,
        payload.order_ids,
        payload.driver_id,
    )
    .await
    .map_err(map_error)?;

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct RegisterDeliveryRequest {
    order_id: Uuid,
    llenas_entregadas: i32,
    vacias_recibidas: i32,
    notes: Option<String>,
}

pub async fn register_delivery(
    State(state): State<AppState>,
    Extension(_ctx): Extension<AuthContext>,
    Json(payload): Json<RegisterDeliveryRequest>,
) -> Result<
    (StatusCode, Json<crate::domain::delivery::Delivery>),
    (StatusCode, Json<serde_json::Value>),
> {
    let input = NewDelivery {
        order_id: payload.order_id,
        llenas_entregadas: payload.llenas_entregadas,
        vacias_recibidas: payload.vacias_recibidas,
        notes: payload.notes,
    };

    let delivery = application::deliveries::register_delivery::execute(&state.repo, input)
        .await
        .map_err(map_error)?;

    Ok((StatusCode::CREATED, Json(delivery)))
}

#[derive(Debug, Deserialize)]
pub struct RegisterFailedDeliveryRequest {
    order_id: Uuid,
    reason: String,
    reprogram_date: Option<String>,
    reprogram_time_slot: Option<String>,
}

pub async fn register_failed_delivery(
    State(state): State<AppState>,
    Extension(_ctx): Extension<AuthContext>,
    Json(payload): Json<RegisterFailedDeliveryRequest>,
) -> Result<
    (StatusCode, Json<crate::domain::delivery::FailedDelivery>),
    (StatusCode, Json<serde_json::Value>),
> {
    let input = NewFailedDelivery {
        order_id: payload.order_id,
        reason: payload.reason,
        reprogram_date: payload
            .reprogram_date
            .as_deref()
            .map(parse_date)
            .transpose()
            .map_err(map_error)?,
        reprogram_time_slot: payload.reprogram_time_slot,
    };

    let failed = application::deliveries::register_failed_delivery::execute(&state.repo, input)
        .await
        .map_err(map_error)?;

    Ok((StatusCode::CREATED, Json(failed)))
}

#[derive(Debug, Deserialize)]
pub struct CreateInboundRequest {
    date: String,
    cantidad_llenas: i32,
    notes: Option<String>,
}

pub async fn create_inbound(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Json(payload): Json<CreateInboundRequest>,
) -> Result<StatusCode, (StatusCode, Json<serde_json::Value>)> {
    require_admin(&ctx).map_err(map_error)?;

    let input = Inbound {
        date: parse_date(&payload.date).map_err(map_error)?,
        cantidad_llenas: payload.cantidad_llenas,
        notes: payload.notes,
    };

    application::stock::register_inbound::execute(&state.repo, input)
        .await
        .map_err(map_error)?;

    Ok(StatusCode::CREATED)
}

#[derive(Debug, Deserialize)]
pub struct StockSummaryQuery {
    date: Option<String>,
}

pub async fn stock_summary(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Query(query): Query<StockSummaryQuery>,
) -> Result<Json<crate::domain::stock::StockSummary>, (StatusCode, Json<serde_json::Value>)> {
    require_admin(&ctx).map_err(map_error)?;

    let date = query
        .date
        .as_deref()
        .map(parse_date)
        .transpose()
        .map_err(map_error)?;

    let summary = application::stock::summary::execute(&state.repo, date)
        .await
        .map_err(map_error)?;

    Ok(Json(summary))
}

#[derive(Debug, Deserialize)]
pub struct DailyReportQuery {
    date: Option<String>,
}

pub async fn daily_report(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Query(query): Query<DailyReportQuery>,
) -> Result<Json<crate::domain::stock::DailyOperationalReport>, (StatusCode, Json<serde_json::Value>)>
{
    require_admin(&ctx).map_err(map_error)?;

    let date = query
        .date
        .as_deref()
        .map(parse_date)
        .transpose()
        .map_err(map_error)?;

    let report = application::stock::daily_report::execute(&state.repo, date)
        .await
        .map_err(map_error)?;

    Ok(Json(report))
}
