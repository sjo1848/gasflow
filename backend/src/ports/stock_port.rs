use crate::domain::error::DomainError;
use crate::domain::stock::Inbound;
use async_trait::async_trait;
use chrono::NaiveDate;

#[derive(Debug, Clone)]
pub struct StockTotals {
    pub inbound_full: i64,
    pub delivered_full: i64,
    pub recovered_empty: i64,
}

#[derive(Debug, Clone)]
pub struct DailyReportTotals {
    pub deliveries_count: i64,
    pub delivered_full: i64,
    pub recovered_empty: i64,
}

#[async_trait]
pub trait StockPort: Send + Sync {
    async fn register_inbound(&self, input: Inbound) -> Result<(), DomainError>;
    async fn stock_totals(&self, date: Option<NaiveDate>) -> Result<StockTotals, DomainError>;
    async fn daily_report_totals(&self, date: NaiveDate) -> Result<DailyReportTotals, DomainError>;
}
