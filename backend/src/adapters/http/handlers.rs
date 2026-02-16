use crate::application;
use crate::domain::audit::NewAuditEvent;
use crate::domain::auth::Role;
use crate::domain::delivery::{Delivery, FailedDelivery, NewDelivery, NewFailedDelivery};
use crate::domain::error::DomainError;
use crate::domain::orders::{
    NewOrder, Order, OrderFilter, OrderStatus, PaginatedOrders, DEFAULT_ORDERS_PAGE,
    DEFAULT_ORDERS_PAGE_SIZE, MAX_ORDERS_PAGE_SIZE,
};
use crate::domain::stock::{DailyOperationalReport, Inbound, StockSummary};
use crate::ports::audit_port::AuditPort;
use crate::ports::orders_port::OrdersPort;
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
use utoipa::ToSchema;
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

fn parse_page(page: Option<i64>) -> Result<i64, DomainError> {
    let page = page.unwrap_or(DEFAULT_ORDERS_PAGE);
    if page < 1 {
        return Err(DomainError::Validation(
            "page debe ser mayor o igual a 1".to_string(),
        ));
    }
    Ok(page)
}

fn parse_page_size(page_size: Option<i64>) -> Result<i64, DomainError> {
    let page_size = page_size.unwrap_or(DEFAULT_ORDERS_PAGE_SIZE);
    if page_size < 1 || page_size > MAX_ORDERS_PAGE_SIZE {
        return Err(DomainError::Validation(format!(
            "page_size debe estar entre 1 y {}",
            MAX_ORDERS_PAGE_SIZE
        )));
    }
    Ok(page_size)
}

fn ensure_delivery_access(ctx: &AuthContext, order: &Order) -> Result<(), DomainError> {
    if ctx.role == Role::Repartidor && order.assignee_id != Some(ctx.user_id) {
        return Err(DomainError::Unauthorized(
            "no podés registrar entregas de pedidos no asignados".to_string(),
        ));
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

#[derive(Debug, Deserialize, ToSchema)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, ToSchema)]
pub struct LoginResponse {
    pub access_token: String,
    pub token_type: &'static str,
}

#[utoipa::path(
    post,
    path = "/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "Login successful", body = LoginResponse),
        (status = 401, description = "Unauthorized")
    ),
    tag = "auth"
)]
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

#[derive(Debug, Serialize, ToSchema)]
pub struct MeResponse {
    pub id: Uuid,
    pub username: String,
    pub role: Role,
}

#[utoipa::path(
    get,
    path = "/me",
    responses(
        (status = 200, description = "Get current user profile", body = MeResponse),
        (status = 401, description = "Unauthorized")
    ),
    tag = "auth",
    security(
        ("bearer_auth" = [])
    )
)]
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

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateOrderRequest {
    pub address: String,
    pub zone: String,
    pub scheduled_date: String,
    pub time_slot: String,
    pub quantity: i32,
    pub notes: Option<String>,
}

#[utoipa::path(
    post,
    path = "/orders",
    request_body = CreateOrderRequest,
    responses(
        (status = 201, description = "Order created successfully", body = Order),
        (status = 400, description = "Invalid input"),
        (status = 401, description = "Unauthorized")
    ),
    tag = "orders",
    security(
        ("bearer_auth" = [])
    )
)]
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
    pub date: Option<String>,
    pub status: Option<String>,
    pub assignee: Option<Uuid>,
    pub page: Option<i64>,
    pub page_size: Option<i64>,
}

#[utoipa::path(
    get,
    path = "/orders",
    params(
        ("date" = Option<String>, Query, description = "Filter by scheduled date (YYYY-MM-DD)"),
        ("status" = Option<String>, Query, description = "Filter by status"),
        ("assignee" = Option<Uuid>, Query, description = "Filter by assignee ID"),
        ("page" = Option<i64>, Query, description = "Page number"),
        ("page_size" = Option<i64>, Query, description = "Items per page")
    ),
    responses(
        (status = 200, description = "List of orders", body = PaginatedOrders),
        (status = 401, description = "Unauthorized")
    ),
    tag = "orders",
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn list_orders(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Query(query): Query<ListOrdersQuery>,
) -> Result<Json<crate::domain::orders::PaginatedOrders>, (StatusCode, Json<serde_json::Value>)> {
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
        page: parse_page(query.page).map_err(map_error)?,
        page_size: parse_page_size(query.page_size).map_err(map_error)?,
    };

    if ctx.role == Role::Repartidor {
        filter.assignee = Some(ctx.user_id);
    }

    let orders = application::orders::list_orders::execute(&state.repo, filter)
        .await
        .map_err(map_error)?;

    Ok(Json(orders))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct ChangeStatusRequest {
    pub status: String,
}

#[utoipa::path(
    patch,
    path = "/orders/{id}/status",
    params(
        ("id" = Uuid, Path, description = "Order ID")
    ),
    request_body = ChangeStatusRequest,
    responses(
        (status = 200, description = "Order status updated", body = Order),
        (status = 400, description = "Invalid transition"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Order not found")
    ),
    tag = "orders",
    security(
        ("bearer_auth" = [])
    )
)]
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

    state
        .repo
        .record_audit_event(NewAuditEvent {
            actor_id: Some(ctx.user_id),
            entity: "order".to_string(),
            entity_id: Some(order.id),
            action: "status_changed".to_string(),
            details: json!({ "status": order.status.as_str() }),
        })
        .await
        .map_err(map_error)?;

    Ok(Json(order))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct AssignOrdersRequest {
    pub order_ids: Vec<Uuid>,
    pub driver_id: Uuid,
}

#[utoipa::path(
    post,
    path = "/dispatch/assign",
    request_body = AssignOrdersRequest,
    responses(
        (status = 204, description = "Orders assigned successfully"),
        (status = 400, description = "Invalid input"),
        (status = 401, description = "Unauthorized")
    ),
    tag = "dispatch",
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn assign_orders(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Json(payload): Json<AssignOrdersRequest>,
) -> Result<StatusCode, (StatusCode, Json<serde_json::Value>)> {
    require_admin(&ctx).map_err(map_error)?;

    let order_ids = payload.order_ids;
    let driver_id = payload.driver_id;

    application::dispatch::assign_orders::execute(&state.repo, order_ids.clone(), driver_id)
        .await
        .map_err(map_error)?;

    for order_id in order_ids {
        state
            .repo
            .record_audit_event(NewAuditEvent {
                actor_id: Some(ctx.user_id),
                entity: "order".to_string(),
                entity_id: Some(order_id),
                action: "assigned".to_string(),
                details: json!({ "driver_id": driver_id }),
            })
            .await
            .map_err(map_error)?;
    }

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RegisterDeliveryRequest {
    pub order_id: Uuid,
    pub llenas_entregadas: i32,
    pub vacias_recibidas: i32,
    pub notes: Option<String>,
}

#[utoipa::path(
    post,
    path = "/deliveries",
    request_body = RegisterDeliveryRequest,
    responses(
        (status = 201, description = "Delivery registered successfully", body = Delivery),
        (status = 400, description = "Invalid input"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Order not found")
    ),
    tag = "deliveries",
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn register_delivery(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Json(payload): Json<RegisterDeliveryRequest>,
) -> Result<
    (StatusCode, Json<crate::domain::delivery::Delivery>),
    (StatusCode, Json<serde_json::Value>),
> {
    let order = state
        .repo
        .get_order_by_id(payload.order_id)
        .await
        .map_err(map_error)?
        .ok_or_else(|| map_error(DomainError::NotFound("pedido no encontrado".to_string())))?;

    ensure_delivery_access(&ctx, &order).map_err(map_error)?;

    let input = NewDelivery {
        order_id: payload.order_id,
        llenas_entregadas: payload.llenas_entregadas,
        vacias_recibidas: payload.vacias_recibidas,
        notes: payload.notes,
    };

    let delivery = application::deliveries::register_delivery::execute(&state.repo, input)
        .await
        .map_err(map_error)?;

    state
        .repo
        .record_audit_event(NewAuditEvent {
            actor_id: Some(ctx.user_id),
            entity: "delivery".to_string(),
            entity_id: Some(delivery.id),
            action: "created".to_string(),
            details: json!({
                "order_id": delivery.order_id,
                "llenas_entregadas": delivery.llenas_entregadas,
                "vacias_recibidas": delivery.vacias_recibidas
            }),
        })
        .await
        .map_err(map_error)?;

    Ok((StatusCode::CREATED, Json(delivery)))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct RegisterFailedDeliveryRequest {
    pub order_id: Uuid,
    pub reason: String,
    pub reprogram_date: Option<String>,
    pub reprogram_time_slot: Option<String>,
}

#[utoipa::path(
    post,
    path = "/deliveries/failed",
    request_body = RegisterFailedDeliveryRequest,
    responses(
        (status = 201, description = "Failed delivery registered successfully", body = FailedDelivery),
        (status = 400, description = "Invalid input"),
        (status = 401, description = "Unauthorized"),
        (status = 404, description = "Order not found")
    ),
    tag = "deliveries",
    security(
        ("bearer_auth" = [])
    )
)]
pub async fn register_failed_delivery(
    State(state): State<AppState>,
    Extension(ctx): Extension<AuthContext>,
    Json(payload): Json<RegisterFailedDeliveryRequest>,
) -> Result<
    (StatusCode, Json<crate::domain::delivery::FailedDelivery>),
    (StatusCode, Json<serde_json::Value>),
> {
    let order = state
        .repo
        .get_order_by_id(payload.order_id)
        .await
        .map_err(map_error)?
        .ok_or_else(|| map_error(DomainError::NotFound("pedido no encontrado".to_string())))?;

    ensure_delivery_access(&ctx, &order).map_err(map_error)?;

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

    state
        .repo
        .record_audit_event(NewAuditEvent {
            actor_id: Some(ctx.user_id),
            entity: "delivery_failure".to_string(),
            entity_id: Some(failed.id),
            action: "created".to_string(),
            details: json!({
                "order_id": failed.order_id,
                "reason": failed.reason,
                "reprogram_date": failed.reprogram_date,
                "reprogram_time_slot": failed.reprogram_time_slot
            }),
        })
        .await
        .map_err(map_error)?;

    Ok((StatusCode::CREATED, Json(failed)))
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct CreateInboundRequest {
    pub date: String,
    pub cantidad_llenas: i32,
    pub notes: Option<String>,
}

#[utoipa::path(
    post,
    path = "/stock/inbounds",
    request_body = CreateInboundRequest,
    responses(
        (status = 201, description = "Inbound stock registered"),
        (status = 400, description = "Invalid input"),
        (status = 401, description = "Unauthorized")
    ),
    tag = "stock",
    security(
        ("bearer_auth" = [])
    )
)]
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

    state
        .repo
        .record_audit_event(NewAuditEvent {
            actor_id: Some(ctx.user_id),
            entity: "stock_inbound".to_string(),
            entity_id: None,
            action: "created".to_string(),
            details: json!({
                "date": payload.date,
                "cantidad_llenas": payload.cantidad_llenas
            }),
        })
        .await
        .map_err(map_error)?;

    Ok(StatusCode::CREATED)
}

#[derive(Debug, Deserialize)]
pub struct StockSummaryQuery {
    pub date: Option<String>,
}

#[utoipa::path(
    get,
    path = "/stock/summary",
    params(
        ("date" = Option<String>, Query, description = "Reference date (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Stock summary", body = StockSummary),
        (status = 401, description = "Unauthorized")
    ),
    tag = "stock",
    security(
        ("bearer_auth" = [])
    )
)]
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
    pub date: Option<String>,
}

#[utoipa::path(
    get,
    path = "/reports/daily",
    params(
        ("date" = Option<String>, Query, description = "Report date (YYYY-MM-DD)")
    ),
    responses(
        (status = 200, description = "Daily operational report", body = DailyOperationalReport),
        (status = 401, description = "Unauthorized")
    ),
    tag = "reports",
    security(
        ("bearer_auth" = [])
    )
)]
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

use utoipa::OpenApi;

#[derive(OpenApi)]
#[openapi(
    paths(
        login,
        me,
        create_order,
        list_orders,
        change_order_status,
        assign_orders,
        register_delivery,
        register_failed_delivery,
        create_inbound,
        stock_summary,
        daily_report
    ),
    components(
        schemas(
            LoginRequest, LoginResponse, MeResponse, Role,
            CreateOrderRequest, Order, OrderStatus, PaginatedOrders,
            ChangeStatusRequest, AssignOrdersRequest,
            RegisterDeliveryRequest, Delivery,
            RegisterFailedDeliveryRequest, FailedDelivery,
            CreateInboundRequest, StockSummary, DailyOperationalReport
        )
    ),
    modifiers(&SecurityAddon)
)]
pub struct ApiDoc;

struct SecurityAddon;

impl utoipa::Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "bearer_auth",
                utoipa::openapi::security::SecurityScheme::Http(
                    utoipa::openapi::security::HttpBuilder::new()
                        .scheme(utoipa::openapi::security::HttpAuthScheme::Bearer)
                        .bearer_format("JWT")
                        .build(),
                ),
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn sample_order(assignee_id: Option<Uuid>) -> Order {
        Order {
            id: Uuid::new_v4(),
            address: "Calle 1".to_string(),
            zone: "Z1".to_string(),
            scheduled_date: chrono::NaiveDate::from_ymd_opt(2026, 2, 16).unwrap(),
            time_slot: "MANANA".to_string(),
            quantity: 1,
            notes: None,
            status: OrderStatus::Asignado,
            assignee_id,
            created_at: Utc::now(),
            updated_at: Utc::now(),
        }
    }

    #[test]
    fn repartidor_cannot_access_unassigned_order() {
        let ctx = AuthContext {
            user_id: Uuid::new_v4(),
            role: Role::Repartidor,
        };
        let order = sample_order(None);

        let result = ensure_delivery_access(&ctx, &order);
        assert!(matches!(result, Err(DomainError::Unauthorized(_))));
    }

    #[test]
    fn repartidor_can_access_own_order() {
        let user_id = Uuid::new_v4();
        let ctx = AuthContext {
            user_id,
            role: Role::Repartidor,
        };
        let order = sample_order(Some(user_id));

        let result = ensure_delivery_access(&ctx, &order);
        assert!(result.is_ok());
    }

    #[test]
    fn admin_can_access_any_order() {
        let ctx = AuthContext {
            user_id: Uuid::new_v4(),
            role: Role::Admin,
        };
        let order = sample_order(None);

        let result = ensure_delivery_access(&ctx, &order);
        assert!(result.is_ok());
    }

    #[test]
    fn validate_page_and_page_size_bounds() {
        assert!(parse_page(Some(0)).is_err());
        assert!(parse_page_size(Some(0)).is_err());
        assert!(parse_page_size(Some(MAX_ORDERS_PAGE_SIZE + 1)).is_err());
        assert_eq!(parse_page(None).expect("default page"), DEFAULT_ORDERS_PAGE);
        assert_eq!(
            parse_page_size(None).expect("default page_size"),
            DEFAULT_ORDERS_PAGE_SIZE
        );
    }
}
