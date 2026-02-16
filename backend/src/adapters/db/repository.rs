use crate::domain::auth::{Role, User};
use crate::domain::delivery::{Delivery, FailedDelivery, NewDelivery, NewFailedDelivery};
use crate::domain::error::DomainError;
use crate::domain::orders::{NewOrder, Order, OrderFilter, OrderStatus};
use crate::domain::stock::Inbound;
use crate::ports::auth_port::AuthPort;
use crate::ports::deliveries_port::DeliveriesPort;
use crate::ports::orders_port::OrdersPort;
use crate::ports::stock_port::{DailyReportTotals, StockPort, StockTotals};
use async_trait::async_trait;
use chrono::{DateTime, NaiveDate, Utc};
use sqlx::{FromRow, PgPool, Postgres, QueryBuilder};
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct PgRepository {
    pool: PgPool,
}

impl PgRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    fn map_sqlx_error(err: sqlx::Error) -> DomainError {
        if let sqlx::Error::Database(db_err) = &err {
            if db_err.code().as_deref() == Some("23505") {
                return DomainError::Conflict("registro duplicado".to_string());
            }
        }
        DomainError::Infrastructure(err.to_string())
    }
}

#[derive(Debug, FromRow)]
struct UserRow {
    id: Uuid,
    username: String,
    password: String,
    role: String,
}

impl TryFrom<UserRow> for User {
    type Error = DomainError;

    fn try_from(value: UserRow) -> Result<Self, Self::Error> {
        let role = Role::from_str(&value.role)
            .ok_or_else(|| DomainError::Infrastructure("rol inválido en DB".to_string()))?;

        Ok(User {
            id: value.id,
            username: value.username,
            password: value.password,
            role,
        })
    }
}

#[derive(Debug, FromRow)]
struct OrderRow {
    id: Uuid,
    address: String,
    zone: String,
    scheduled_date: NaiveDate,
    time_slot: String,
    quantity: i32,
    notes: Option<String>,
    status: String,
    assignee_id: Option<Uuid>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

impl TryFrom<OrderRow> for Order {
    type Error = DomainError;

    fn try_from(value: OrderRow) -> Result<Self, Self::Error> {
        let status = OrderStatus::from_str(&value.status)
            .ok_or_else(|| DomainError::Infrastructure("estado inválido en DB".to_string()))?;

        Ok(Order {
            id: value.id,
            address: value.address,
            zone: value.zone,
            scheduled_date: value.scheduled_date,
            time_slot: value.time_slot,
            quantity: value.quantity,
            notes: value.notes,
            status,
            assignee_id: value.assignee_id,
            created_at: value.created_at,
            updated_at: value.updated_at,
        })
    }
}

#[derive(Debug, FromRow)]
struct DeliveryRow {
    id: Uuid,
    order_id: Uuid,
    llenas_entregadas: i32,
    vacias_recibidas: i32,
    notes: Option<String>,
    created_at: DateTime<Utc>,
}

impl From<DeliveryRow> for Delivery {
    fn from(value: DeliveryRow) -> Self {
        Delivery {
            id: value.id,
            order_id: value.order_id,
            llenas_entregadas: value.llenas_entregadas,
            vacias_recibidas: value.vacias_recibidas,
            notes: value.notes,
            created_at: value.created_at,
        }
    }
}

#[derive(Debug, FromRow)]
struct FailedDeliveryRow {
    id: Uuid,
    order_id: Uuid,
    reason: String,
    reprogram_date: Option<NaiveDate>,
    reprogram_time_slot: Option<String>,
    created_at: DateTime<Utc>,
}

impl From<FailedDeliveryRow> for FailedDelivery {
    fn from(value: FailedDeliveryRow) -> Self {
        FailedDelivery {
            id: value.id,
            order_id: value.order_id,
            reason: value.reason,
            reprogram_date: value.reprogram_date,
            reprogram_time_slot: value.reprogram_time_slot,
            created_at: value.created_at,
        }
    }
}

#[async_trait]
impl AuthPort for PgRepository {
    async fn find_user_by_username(&self, username: &str) -> Result<Option<User>, DomainError> {
        let row = sqlx::query_as::<_, UserRow>(
            "SELECT id, username, password, role FROM users WHERE username = $1",
        )
        .bind(username)
        .fetch_optional(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        row.map(User::try_from).transpose()
    }

    async fn find_user_by_id(&self, user_id: Uuid) -> Result<Option<User>, DomainError> {
        let row = sqlx::query_as::<_, UserRow>(
            "SELECT id, username, password, role FROM users WHERE id = $1",
        )
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        row.map(User::try_from).transpose()
    }
}

#[async_trait]
impl OrdersPort for PgRepository {
    async fn create_order(&self, input: NewOrder) -> Result<Order, DomainError> {
        let row = sqlx::query_as::<_, OrderRow>(
            r#"
            INSERT INTO orders (
                id, address, zone, scheduled_date, time_slot, quantity, notes, status, assignee_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDIENTE', NULL)
            RETURNING id, address, zone, scheduled_date, time_slot, quantity, notes, status, assignee_id, created_at, updated_at
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(input.address)
        .bind(input.zone)
        .bind(input.scheduled_date)
        .bind(input.time_slot)
        .bind(input.quantity)
        .bind(input.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        row.try_into()
    }

    async fn list_orders(&self, filter: OrderFilter) -> Result<Vec<Order>, DomainError> {
        let mut builder = QueryBuilder::<Postgres>::new(
            "SELECT id, address, zone, scheduled_date, time_slot, quantity, notes, status, assignee_id, created_at, updated_at FROM orders WHERE 1=1",
        );

        if let Some(date) = filter.date {
            builder.push(" AND scheduled_date = ").push_bind(date);
        }

        if let Some(status) = filter.status {
            builder.push(" AND status = ").push_bind(status.as_str());
        }

        if let Some(assignee) = filter.assignee {
            builder.push(" AND assignee_id = ").push_bind(assignee);
        }

        builder.push(" ORDER BY scheduled_date ASC, created_at ASC");

        let rows = builder
            .build_query_as::<OrderRow>()
            .fetch_all(&self.pool)
            .await
            .map_err(Self::map_sqlx_error)?;

        rows.into_iter().map(TryInto::try_into).collect()
    }

    async fn get_order_by_id(&self, order_id: Uuid) -> Result<Option<Order>, DomainError> {
        let row = sqlx::query_as::<_, OrderRow>(
            "SELECT id, address, zone, scheduled_date, time_slot, quantity, notes, status, assignee_id, created_at, updated_at FROM orders WHERE id = $1",
        )
        .bind(order_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        row.map(TryInto::try_into).transpose()
    }

    async fn update_order_status(
        &self,
        order_id: Uuid,
        status: OrderStatus,
    ) -> Result<Order, DomainError> {
        let row = sqlx::query_as::<_, OrderRow>(
            r#"
            UPDATE orders
            SET status = $2, updated_at = NOW()
            WHERE id = $1
            RETURNING id, address, zone, scheduled_date, time_slot, quantity, notes, status, assignee_id, created_at, updated_at
            "#,
        )
        .bind(order_id)
        .bind(status.as_str())
        .fetch_optional(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        let row = row.ok_or_else(|| DomainError::NotFound("pedido no encontrado".to_string()))?;
        row.try_into()
    }

    async fn reprogram_order(
        &self,
        order_id: Uuid,
        scheduled_date: NaiveDate,
        time_slot: String,
    ) -> Result<Order, DomainError> {
        let row = sqlx::query_as::<_, OrderRow>(
            r#"
            UPDATE orders
            SET scheduled_date = $2, time_slot = $3, status = 'ASIGNADO', updated_at = NOW()
            WHERE id = $1
            RETURNING id, address, zone, scheduled_date, time_slot, quantity, notes, status, assignee_id, created_at, updated_at
            "#,
        )
        .bind(order_id)
        .bind(scheduled_date)
        .bind(time_slot)
        .fetch_optional(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        let row = row.ok_or_else(|| DomainError::NotFound("pedido no encontrado".to_string()))?;
        row.try_into()
    }

    async fn assign_orders(&self, order_ids: &[Uuid], driver_id: Uuid) -> Result<(), DomainError> {
        let mut tx = self.pool.begin().await.map_err(Self::map_sqlx_error)?;

        for order_id in order_ids {
            let result = sqlx::query(
                "UPDATE orders SET assignee_id = $1, status = 'ASIGNADO', updated_at = NOW() WHERE id = $2",
            )
            .bind(driver_id)
            .bind(*order_id)
            .execute(&mut *tx)
            .await
            .map_err(Self::map_sqlx_error)?;

            if result.rows_affected() == 0 {
                return Err(DomainError::NotFound(format!(
                    "pedido {} no encontrado",
                    order_id
                )));
            }

            sqlx::query("INSERT INTO assignments (id, order_id, driver_id) VALUES ($1, $2, $3)")
                .bind(Uuid::new_v4())
                .bind(*order_id)
                .bind(driver_id)
                .execute(&mut *tx)
                .await
                .map_err(Self::map_sqlx_error)?;
        }

        tx.commit().await.map_err(Self::map_sqlx_error)?;
        Ok(())
    }
}

#[async_trait]
impl DeliveriesPort for PgRepository {
    async fn create_delivery(&self, input: NewDelivery) -> Result<Delivery, DomainError> {
        let row = sqlx::query_as::<_, DeliveryRow>(
            r#"
            INSERT INTO deliveries (id, order_id, llenas_entregadas, vacias_recibidas, notes)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, order_id, llenas_entregadas, vacias_recibidas, notes, created_at
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(input.order_id)
        .bind(input.llenas_entregadas)
        .bind(input.vacias_recibidas)
        .bind(input.notes)
        .fetch_one(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }

    async fn create_failed_delivery(
        &self,
        input: NewFailedDelivery,
    ) -> Result<FailedDelivery, DomainError> {
        let row = sqlx::query_as::<_, FailedDeliveryRow>(
            r#"
            INSERT INTO delivery_failures (id, order_id, reason, reprogram_date, reprogram_time_slot)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, order_id, reason, reprogram_date, reprogram_time_slot, created_at
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(input.order_id)
        .bind(input.reason)
        .bind(input.reprogram_date)
        .bind(input.reprogram_time_slot)
        .fetch_one(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(row.into())
    }
}

#[async_trait]
impl StockPort for PgRepository {
    async fn register_inbound(&self, input: Inbound) -> Result<(), DomainError> {
        sqlx::query(
            "INSERT INTO stock_inbounds (id, inbound_date, cantidad_llenas, notes) VALUES ($1, $2, $3, $4)",
        )
        .bind(Uuid::new_v4())
        .bind(input.date)
        .bind(input.cantidad_llenas)
        .bind(input.notes)
        .execute(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(())
    }

    async fn stock_totals(&self, date: Option<NaiveDate>) -> Result<StockTotals, DomainError> {
        let inbound_full: i64;
        let delivered_full: i64;
        let recovered_empty: i64;

        if let Some(d) = date {
            inbound_full = sqlx::query_scalar(
                "SELECT COALESCE(SUM(cantidad_llenas), 0)::BIGINT FROM stock_inbounds WHERE inbound_date <= $1",
            )
            .bind(d)
            .fetch_one(&self.pool)
            .await
            .map_err(Self::map_sqlx_error)?;

            let row = sqlx::query_as::<_, (i64, i64)>(
                "SELECT COALESCE(SUM(llenas_entregadas), 0)::BIGINT, COALESCE(SUM(vacias_recibidas), 0)::BIGINT FROM deliveries WHERE created_at::date <= $1",
            )
            .bind(d)
            .fetch_one(&self.pool)
            .await
            .map_err(Self::map_sqlx_error)?;

            delivered_full = row.0;
            recovered_empty = row.1;
        } else {
            inbound_full = sqlx::query_scalar(
                "SELECT COALESCE(SUM(cantidad_llenas), 0)::BIGINT FROM stock_inbounds",
            )
            .fetch_one(&self.pool)
            .await
            .map_err(Self::map_sqlx_error)?;

            let row = sqlx::query_as::<_, (i64, i64)>(
                "SELECT COALESCE(SUM(llenas_entregadas), 0)::BIGINT, COALESCE(SUM(vacias_recibidas), 0)::BIGINT FROM deliveries",
            )
            .fetch_one(&self.pool)
            .await
            .map_err(Self::map_sqlx_error)?;

            delivered_full = row.0;
            recovered_empty = row.1;
        }

        Ok(StockTotals {
            inbound_full,
            delivered_full,
            recovered_empty,
        })
    }

    async fn daily_report_totals(&self, date: NaiveDate) -> Result<DailyReportTotals, DomainError> {
        let row = sqlx::query_as::<_, (i64, i64, i64)>(
            "SELECT COUNT(*)::BIGINT, COALESCE(SUM(llenas_entregadas), 0)::BIGINT, COALESCE(SUM(vacias_recibidas), 0)::BIGINT FROM deliveries WHERE created_at::date = $1",
        )
        .bind(date)
        .fetch_one(&self.pool)
        .await
        .map_err(Self::map_sqlx_error)?;

        Ok(DailyReportTotals {
            deliveries_count: row.0,
            delivered_full: row.1,
            recovered_empty: row.2,
        })
    }
}
